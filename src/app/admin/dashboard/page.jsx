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

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.dashboardHeader}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <button className="btn-primary" style={{ background: '#ff4d4f' }} onClick={handleLogout}>Logout</button>
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

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Team Name</th>
                <th>Leader Name</th>
                <th>Leader Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No teams registered yet.</td>
                </tr>
              )}
              {teams.map(team => (
                <tr key={team.teamId}>
                  <td>{team.teamId}</td>
                  <td><strong>{team.teamName}</strong></td>
                  <td>{team.leader.name}</td>
                  <td>{team.leader.email}</td>
                  <td>
                    <span className={`${styles.badge} ${team.mentor ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {team.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            
            <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}>Upload Brand Logos</h3>

            <form onSubmit={e => handleFileUpload(e, 'logo_sih')} style={{ marginBottom: '1.5rem', borderBottom: '1px dashed #eee', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>SIH Logo (Official Logo)</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#28a745' }}>Update SIH Logo</button>
            </form>

            <form onSubmit={e => handleFileUpload(e, 'logo_ksv')} style={{ marginBottom: '1.5rem', borderBottom: '1px dashed #eee', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>KSV Logo</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#28a745' }}>Update KSV Logo</button>
            </form>

            <form onSubmit={e => handleFileUpload(e, 'logo_vsitr')} style={{ marginBottom: '2rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>VSITR Logo</label>
                <input type="file" name="files" accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#28a745' }}>Update VSITR Logo</button>
            </form>

            <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem', marginTop: '2rem' }}>Hero Images</h3>
            <form onSubmit={e => handleFileUpload(e, 'heroMedia')} style={{ marginBottom: '2rem', borderBottom: '1px dashed #eee', paddingBottom: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload Hero Slider Images (Select multiple)</label>
                <input type="file" name="files" multiple accept="image/*" className={styles.input} required />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#28a745' }}>Update Hero Slider</button>
            </form>

            <h3 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem', marginTop: '2rem' }}>Timer Configuration</h3>
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
              <h3>All Problem Statements</h3>
              <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                {problems.map(p => (
                  <div key={p.id} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
                    <h4 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>{p.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>{p.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={() => openPdfInNewTab(p.pdfUrl, p.title)} 
                        style={{ color: 'var(--primary-red)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        View PDF (New Tab)
                      </button>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => toggleProblemStatus(p.id)}
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.5rem', background: p.isLive ? '#ff4d4f' : '#28a745', fontSize: '0.8rem' }}
                        >
                          {p.isLive ? 'Take Offline' : 'Make Live'}
                        </button>
                        <button 
                          onClick={() => deleteProblem(p.id)}
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.5rem', background: '#333', fontSize: '0.8rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && <p>No problem statements uploaded yet.</p>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
