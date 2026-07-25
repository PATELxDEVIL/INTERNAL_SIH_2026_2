"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { openPdfInNewTab } from '@/lib/pdfHelper';

export default function AdminDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [problems, setProblems] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [regHeading, setRegHeading] = useState('Registration Closes In');
  const [regBtnText, setRegBtnText] = useState('Register Your Team');
  const [regBtnLink, setRegBtnLink] = useState('/register');
  const [regFooterText, setRegFooterText] = useState('Registration closes on');
  const [loading, setLoading] = useState(true);

  // New states for modern table UI
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  // Team view modal state
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    fetchTeams();
  }, [router]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/admin/teams');
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams);
      }
      
      const probRes = await fetch('/api/admin/problems');
      const probData = await probRes.json();
      if (probData.success) {
        setProblems(probData.problems);
      }

      const configRes = await fetch('/api/admin/config');
      const configData = await configRes.json();
      if (configData) {
        if (configData.deadline) setDeadline(configData.deadline);
        if (configData.registrationHeading) setRegHeading(configData.registrationHeading);
        if (configData.registrationButtonText) setRegBtnText(configData.registrationButtonText);
        if (configData.registrationButtonLink) setRegBtnLink(configData.registrationButtonLink);
        if (configData.registrationFooterText) setRegFooterText(configData.registrationFooterText);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    router.push('/admin/login');
  };

  // Stats calculation
  const totalTeams = teams.length;
  let totalMale = 0, totalFemale = 0;
  teams.forEach(t => {
    const all = [t.leader, ...t.members];
    all.forEach(m => {
      if (m.gender === 'Male') totalMale++;
      else if (m.gender === 'Female') totalFemale++;
    });
  });
  const pendingMentor = teams.filter(t => !t.mentor).length;
  const completedMentor = teams.filter(t => t.mentor).length;

  const [passwordReset, setPasswordReset] = useState({ teamId: '', newPassword: '' });

  // Change admin password
  const [changePass, setChangePass] = useState({ current: '', newPass: '', confirm: '' });
  const [changePassMsg, setChangePassMsg] = useState({ text: '', type: '' });
  const handleChangeAdminPassword = async (e) => {
    e.preventDefault();
    setChangePassMsg({ text: '', type: '' });
    if (changePass.newPass !== changePass.confirm) {
      setChangePassMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: changePass.current, newPassword: changePass.newPass })
      });
      const data = await res.json();
      if (res.ok) {
        setChangePassMsg({ text: 'Password changed successfully!', type: 'success' });
        setChangePass({ current: '', newPass: '', confirm: '' });
      } else {
        setChangePassMsg({ text: data.error || 'Failed to change password.', type: 'error' });
      }
    } catch {
      setChangePassMsg({ text: 'Connection error.', type: 'error' });
    }
  };
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', ...passwordReset })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password reset successfully!");
        setPasswordReset({ teamId: '', newPassword: '' });
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Error resetting password");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm(`Are you sure you want to permanently delete team ${teamId}? This will remove all their members and data.`)) return;
    try {
      const res = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', teamId })
      });
      if (res.ok) {
        setTeams(teams.filter(t => t.teamId !== teamId));
        if (selectedTeam?.teamId === teamId) setSelectedTeam(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete team');
      }
    } catch (err) {
      alert("Error deleting team");
    }
  };

  const handleFileUpload = async (e, type) => {
    e.preventDefault();
    const files = e.target.files.files;
    if (files.length === 0) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ name: file.name, data: e.target.result });
        reader.readAsDataURL(file);
      });
    });

    const base64Files = await Promise.all(filePromises);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, files: base64Files })
      });
      if (res.ok) {
        alert(`${type} updated successfully! Refresh to see changes.`);
      } else {
        alert(`Failed to update ${type}`);
      }
    } catch (err) {
      alert("Upload error");
    }
  };

  const [newProblem, setNewProblem] = useState({ title: '', description: '' });
  
  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    const files = e.target.pdfFile.files;
    let pdfFile = null;
    
    if (files.length > 0) {
      const file = files[0];
      
      // Vercel Serverless Functions have a strict 4.5MB request limit.
      // Base64 encoding adds ~33% overhead. So limit file to ~2.5MB.
      const maxSizeInBytes = 2.5 * 1024 * 1024; // 2.5 MB
      if (file.size > maxSizeInBytes) {
        alert("The PDF file is too large! Please compress it to under 2.5MB before uploading. Vercel's free tier cannot process larger files.");
        return;
      }

      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      pdfFile = { name: file.name, data: base64Data };
    }

    try {
      const res = await fetch('/api/admin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProblem, pdfFile })
      });
      if (res.ok) {
        alert("Problem statement added successfully!");
        setNewProblem({ title: '', description: '' });
        fetchTeams(); // Re-fetch problems
      } else {
        alert("Failed to add problem statement");
      }
    } catch (err) {
      alert("Error adding problem");
    }
  };

  const toggleProblemStatus = async (id) => {
    try {
      const res = await fetch('/api/admin/problems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle_live' })
      });
      if (res.ok) {
        fetchTeams(); // Re-fetch problems
      }
    } catch (err) {
      alert("Error toggling status");
    }
  };

  const deleteProblem = async (id) => {
    if (!confirm("Are you sure you want to delete this problem statement? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/admin/problems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.ok) {
        fetchTeams(); // Re-fetch problems
      } else {
        alert("Failed to delete problem statement");
      }
    } catch (err) {
      alert("Error deleting problem");
    }
  };

  const handleTimerConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'timerConfig', 
          deadline,
          heading: regHeading, 
          buttonText: regBtnText, 
          buttonLink: regBtnLink,
          footerText: regFooterText
        })
      });
      if (res.ok) {
        alert("Timer configuration updated successfully!");
      } else {
        alert("Failed to update timer configuration");
      }
    } catch (err) {
      alert("Error updating timer configuration");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

  // Filter teams for modern table UI
  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.teamId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Statuses' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = ['All Statuses', ...Array.from(new Set(teams.map(t => t.status)))];

  const getStatusClass = (status) => {
    if (status.includes('Approve') || status.includes('Complete')) return styles.statusApproved;
    if (status.includes('Reject')) return styles.statusRejected;
    if (status.includes('Review')) return styles.statusReview;
    return styles.statusPending;
  };

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.dashboardHeader}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <button className="btn-primary" style={{ background: '#E63946', boxShadow: 'none' }} onClick={handleLogout}>Logout</button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalTeams}</div>
            <div className={styles.statLabel}>Total Teams</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalTeams * 6}</div>
            <div className={styles.statLabel}>Total Participants</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalMale} / {totalFemale}</div>
            <div className={styles.statLabel}>Male / Female</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{pendingMentor}</div>
            <div className={styles.statLabel}>Pending Mentor</div>
          </div>
        </div>

        <div className={styles.modernTableContainer}>
          <div className={styles.modernTableHeader}>
            <div className={styles.modernTableHeaderLeft}>
              <div className={styles.modernHeaderIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h2 className={styles.modernTitle}>Team Registrations</h2>
                <p className={styles.modernSubtitle}>{filteredTeams.length} of {teams.length} teams</p>
              </div>
            </div>
            <div className={styles.modernTableHeaderRight}>
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search teams..." 
                  className={styles.modernSearchInput}
                  style={{ paddingLeft: '32px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className={styles.modernStatusSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th>Registration ID</th>
                  <th>Team Name</th>
                  <th>Leader Name</th>
                  <th>Leader Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>No teams found matching your filters.</td>
                  </tr>
                )}
                {filteredTeams.map(team => (
                  <tr key={team.teamId}>
                    <td><span className={styles.modernIdPill}>{team.teamId}</span></td>
                    <td><span className={styles.modernTeamName}>{team.teamName}</span></td>
                    <td>{team.leader?.name || 'N/A'}</td>
                    <td>{team.leader?.email || 'N/A'}</td>
                    <td>
                      <span className={`${styles.modernStatusPill} ${getStatusClass(team.status)}`}>
                        {team.status}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginLeft: '2px' }}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button className={styles.modernActionLink} onClick={() => setSelectedTeam(team)}>View</button>
                        <button 
                          className={styles.modernActionLink} 
                          style={{ color: '#cf1322' }} 
                          onClick={() => handleDeleteTeam(team.teamId)}
                          title="Delete Team"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.grid2Col}>
          <div className={styles.settingsSection}>
            <h2 className={styles.settingsTitle}>Reset Team Password</h2>
            <form onSubmit={handlePasswordReset}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Team ID</label>
                <input className={styles.input} required value={passwordReset.teamId} onChange={e => setPasswordReset({...passwordReset, teamId: e.target.value})} placeholder="e.g., SIH2026-001" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input className={styles.input} type="password" required value={passwordReset.newPassword} onChange={e => setPasswordReset({...passwordReset, newPassword: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary">Reset Password</button>
            </form>
          </div>

          <div className={styles.settingsSection}>
            <h2 className={styles.settingsTitle}>Portal Configuration</h2>
            
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>Upload Brand Logos</h3>

            <form onSubmit={e => handleFileUpload(e, 'logo_sih')} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>SIH Logo (Official Logo)</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#10B981' }}>Update SIH Logo</button>
            </form>

            <form onSubmit={e => handleFileUpload(e, 'logo_ksv')} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>KSV Logo</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#10B981' }}>Update KSV Logo</button>
            </form>

            <form onSubmit={e => handleFileUpload(e, 'logo_vsitr')} style={{ marginBottom: '2rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>VSITR Logo</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#10B981' }}>Update VSITR Logo</button>
            </form>

            <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem', marginTop: '2rem' }}>Hero Images</h3>
            <form onSubmit={e => handleFileUpload(e, 'heroMedia')} style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Hero Slider Images (Select multiple)</label>
                <input type="file" name="files" multiple accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#10B981' }}>Update Hero Slider</button>
            </form>

            <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '1rem', marginTop: '2rem' }}>Timer Configuration</h3>
            <form onSubmit={handleTimerConfigSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Deadline Date & Time</label>
                <input 
                  type="datetime-local" 
                  className={styles.input} 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Timer Heading</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={regHeading} 
                  onChange={e => setRegHeading(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Button Text</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={regBtnText} 
                  onChange={e => setRegBtnText(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Button Link</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={regBtnLink} 
                  onChange={e => setRegBtnLink(e.target.value)} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Footer Text Prefix</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={regFooterText} 
                  onChange={e => setRegFooterText(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#28a745' }}>Update Timer Settings</button>
            </form>
          </div>
        </div>
        
        {/* ── CHANGE ADMIN PASSWORD ── */}
        <div className={styles.settingsSection} style={{ maxWidth: '480px' }}>
          <h2 className={styles.settingsTitle}>🔑 Change Admin Password</h2>
          {changePassMsg.text && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem',
              fontSize: '0.875rem', textAlign: 'center',
              background: changePassMsg.type === 'error' ? '#fff5f5' : '#f6ffed',
              color: changePassMsg.type === 'error' ? '#cc0000' : '#389e0d',
              border: `1px solid ${changePassMsg.type === 'error' ? '#ffccc7' : '#b7eb8f'}`
            }}>
              {changePassMsg.text}
            </div>
          )}
          <form onSubmit={handleChangeAdminPassword}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input type="password" className={styles.input} required
                value={changePass.current} onChange={e => setChangePass({ ...changePass, current: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className={styles.input} required minLength={6}
                value={changePass.newPass} onChange={e => setChangePass({ ...changePass, newPass: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input type="password" className={styles.input} required minLength={6}
                value={changePass.confirm} onChange={e => setChangePass({ ...changePass, confirm: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        </div>

        <div className={styles.settingsSection}>
          <h2 className={styles.settingsTitle}>Problem Statements Management</h2>
          <div className={styles.grid2Col}>
            <div>
              <h3>Add New Problem Statement</h3>
              <form onSubmit={handleProblemSubmit} style={{ marginTop: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Title</label>
                  <input className={styles.input} required value={newProblem.title} onChange={e => setNewProblem({...newProblem, title: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea className={styles.input} required value={newProblem.description} onChange={e => setNewProblem({...newProblem, description: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PDF File</label>
                  <input type="file" name="pdfFile" accept="application/pdf" className={styles.input} required />
                </div>
                <button type="submit" className="btn-primary">Upload Problem</button>
              </form>
            </div>
            
            <div>
              <h3 style={{ color: 'var(--accent-cyan)' }}>All Problem Statements</h3>
              <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
                {problems.map(p => (
                  <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', marginBottom: '1rem', borderRadius: '12px' }}>
                    <h4 style={{ color: 'var(--white)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{p.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#CBD5E1', marginBottom: '1rem' }}>{p.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={() => openPdfInNewTab(p.pdfUrl, p.title)} 
                        style={{ color: 'var(--accent-cyan)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        View PDF
                      </button>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => toggleProblemStatus(p.id)}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.8rem', background: p.isLive ? '#E63946' : '#10B981', fontSize: '0.8rem' }}
                        >
                          {p.isLive ? 'Take Offline' : 'Make Live'}
                        </button>
                        <button 
                          onClick={() => deleteProblem(p.id)}
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.8rem', background: '#334155', fontSize: '0.8rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && <p style={{ color: '#94A3B8' }}>No problem statements uploaded yet.</p>}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── VIEW TEAM MODAL ── */}
      {selectedTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--bg-color)', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)' }}>
            
            <div style={{ padding: '1.5rem 2rem', background: 'var(--glass-bg)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--white)' }}>Team {selectedTeam.teamName}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{selectedTeam.teamId} • {selectedTeam.status}</span>
              </div>
              <button 
                onClick={() => setSelectedTeam(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, color: '#E2E8F0' }}>
              <div className={styles.grid2Col} style={{ marginBottom: '2rem', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1rem' }}>Team Details</h3>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Leader:</strong> {selectedTeam.leader.name} ({selectedTeam.leader.enrollment})</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Email:</strong> {selectedTeam.leader.email}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Phone:</strong> {selectedTeam.leader.phone}</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>Registered:</strong> {new Date(selectedTeam.createdAt).toLocaleString()}</p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1rem' }}>Mentor & Problem</h3>
                  {selectedTeam.mentor ? (
                    <>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Mentor:</strong> {selectedTeam.mentor.name}</p>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Contact:</strong> {selectedTeam.mentor.contact}</p>
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Institute:</strong> {selectedTeam.mentor.institute}</p>
                    </>
                  ) : (
                    <p style={{ color: '#64748B', fontStyle: 'italic', margin: '0 0 1rem 0' }}>No mentor selected yet.</p>
                  )}

                  {selectedTeam.problem ? (
                    <p style={{ margin: '0' }}><strong>Problem:</strong> {selectedTeam.problem.title}</p>
                  ) : (
                    <p style={{ color: '#64748B', fontStyle: 'italic', margin: 0 }}>No problem statement selected yet.</p>
                  )}
                </div>
              </div>

              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '1rem', fontSize: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>All Team Members</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#94A3B8' }}>
                    <th style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</th>
                    <th style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Enrollment</th>
                    <th style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Dept / Sem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#10B981', fontWeight: '600' }}>Leader</td>
                    <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: '600', color: 'var(--white)' }}>{selectedTeam.leader.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{selectedTeam.leader.enrollment}</td>
                    <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{selectedTeam.leader.department}, Sem {selectedTeam.leader.semester}</td>
                  </tr>
                  {selectedTeam.members.map(m => (
                    <tr key={m.id}>
                      <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94A3B8' }}>Member</td>
                      <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: '500', color: 'var(--white)' }}>{m.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{m.enrollment}</td>
                      <td style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{m.department}, Sem {m.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '1.25rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedTeam(null)}
                style={{ padding: '0.6rem 1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--white)', transition: 'background 0.3s' }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
