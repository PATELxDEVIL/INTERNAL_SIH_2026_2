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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
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
      if (data.success) setTeams(data.teams);

      const probRes = await fetch('/api/admin/problems');
      const probData = await probRes.json();
      if (probData.success) setProblems(probData.problems);

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

  // Stats
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

  const [passwordReset, setPasswordReset] = useState({ teamId: '', newPassword: '' });
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
      if (res.ok) {
        alert("Password reset successfully!");
        setPasswordReset({ teamId: '', newPassword: '' });
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Error resetting password");
    }
  };

  const handleTimerConfigUpdate = async (e) => {
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
        alert('Site configuration updated successfully!');
      } else {
        alert('Failed to update configuration.');
      }
    } catch {
      alert('Connection error.');
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
    } catch {
      alert("Error deleting team");
    }
  };

  const [newProblem, setNewProblem] = useState({ title: '', description: '' });

  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    const files = e.target.pdfFile.files;
    let pdfFile = null;

    if (files.length > 0) {
      const file = files[0];
      const maxSizeInBytes = 2.5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        alert("The PDF file is too large! Please compress it to under 2.5MB.");
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
        fetchTeams();
      } else {
        alert("Failed to add problem statement");
      }
    } catch {
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
      if (res.ok) fetchTeams();
    } catch {
      alert("Error toggling status");
    }
  };

  const deleteProblem = async (id) => {
    if (!confirm("Are you sure you want to delete this problem statement? This cannot be undone.")) return;
    try {
      const res = await fetch('/api/admin/problems', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.ok) {
        fetchTeams();
      } else {
        alert("Failed to delete problem statement");
      }
    } catch {
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
      if (res.ok) alert("Timer configuration updated successfully!");
      else alert("Failed to update timer configuration");
    } catch {
      alert("Error updating timer configuration");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading dashboard...</span>
      </div>
    );
  }

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

  const STAT_CARDS = [
    {
      value: totalTeams,
      label: 'Total Teams',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      value: totalTeams * 6,
      label: 'Total Participants',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5"></circle>
          <path d="M20 21a8 8 0 1 0-16 0"></path>
        </svg>
      )
    },
    {
      value: <>{totalMale}<span style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 400 }}> / </span>{totalFemale}</>,
      label: 'Male / Female',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      value: pendingMentor,
      label: 'Pending Mentor',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    }
  ];

  return (
    <div className={styles.dashboardContainer}>

      {/* ── HEADER ── */}
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0', fontWeight: 500 }}>
            Internal SIH 2026 &nbsp;&mdash;&nbsp; {totalTeams} team{totalTeams !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.875rem',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, color: '#059669'
          }}>
            <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
            Live
          </span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statCardTop}>
              <div className={styles.statIconBox}>{card.icon}</div>
            </div>
            <div>
              <div className={styles.statValue}>{card.value}</div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TEAMS TABLE ── */}
      <div id="teams" className={styles.modernTableContainer}>
        <div className={styles.modernTableHeader}>
          <div className={styles.modernTableHeaderLeft}>
            <div className={styles.modernHeaderIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search teams..."
                className={styles.modernSearchInput}
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

        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
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
                  <td colSpan="6">
                    <div style={{ textAlign: 'center', padding: '3.5rem 2rem', color: '#94a3b8' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#64748b' }}>No teams found</p>
                      <p style={{ fontSize: '0.8rem' }}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredTeams.map(team => (
                <tr key={team.teamId}>
                  <td><span className={styles.modernIdPill}>{team.teamId}</span></td>
                  <td><span className={styles.modernTeamName}>{team.teamName}</span></td>
                  <td style={{ color: '#1e293b', fontWeight: 500 }}>{team.leader?.name || 'N/A'}</td>
                  <td style={{ color: '#64748b' }}>{team.leader?.email || 'N/A'}</td>
                  <td>
                    <span className={`${styles.modernStatusPill} ${getStatusClass(team.status)}`}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}></span>
                      {team.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        className={styles.modernActionLink}
                        onClick={() => setSelectedTeam(team)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.35rem 0.875rem', borderRadius: '8px',
                          border: '1.5px solid #e2e8f0', background: 'white',
                          color: '#1B3F8B', fontWeight: 600, fontSize: '0.8rem',
                          cursor: 'pointer', transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#1B3F8B';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = '#1B3F8B';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#1B3F8B';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
                      <button
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '34px', height: '34px', borderRadius: '8px',
                          border: '1.5px solid #fee2e2', background: '#fff5f5',
                          color: '#ef4444', cursor: 'pointer', transition: 'all 0.18s ease',
                        }}
                        onClick={() => handleDeleteTeam(team.teamId)}
                        title="Delete Team"
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#ef4444';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fff5f5';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.borderColor = '#fee2e2';
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Section divider */}
      <div id="settings" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1.5rem' }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
          padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '20px',
          border: '1px solid #e2e8f0',
        }}>Site & Security Settings</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
      </div>

      {/* ── SITE CONFIGURATION ── */}
      <div className={styles.settingsSection} style={{ marginBottom: '1.5rem' }}>
        <h2 className={styles.settingsTitle}>
          <span style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          Timer & Event Configuration
        </h2>
        <form onSubmit={handleTimerConfigUpdate}>
          <div className={styles.grid2Col}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Heading</label>
              <input className={styles.input} required value={regHeading} onChange={e => setRegHeading(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Deadline Date</label>
              <input type="datetime-local" className={styles.input} required value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Button Text</label>
              <input className={styles.input} required value={regBtnText} onChange={e => setRegBtnText(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Button Link</label>
              <input className={styles.input} required value={regBtnLink} onChange={e => setRegBtnLink(e.target.value)} />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Footer Text</label>
              <input className={styles.input} required value={regFooterText} onChange={e => setRegFooterText(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ borderRadius: '8px', fontWeight: 700, marginTop: '0.5rem' }}>
            Save Configuration
          </button>
        </form>
      </div>

      {/* ── SETTINGS GRID ── */}
      <div className={styles.grid2Col}>
        {/* Reset Team Password */}
        <div className={styles.settingsSection}>
          <h2 className={styles.settingsTitle}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(99,102,241,0.1)', color: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            Reset Team Password
          </h2>
          <form onSubmit={handlePasswordReset}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Team ID</label>
              <input
                className={styles.input}
                required
                value={passwordReset.teamId}
                onChange={e => setPasswordReset({...passwordReset, teamId: e.target.value})}
                placeholder="e.g., SIH2026-001"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input
                className={styles.input}
                type="password"
                required
                value={passwordReset.newPassword}
                onChange={e => setPasswordReset({...passwordReset, newPassword: e.target.value})}
                placeholder="Enter new password"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ borderRadius: '8px', fontWeight: 700 }}>
              Reset Password
            </button>
          </form>
        </div>

        {/* Change Admin Password */}
        <div className={styles.settingsSection}>
          <h2 className={styles.settingsTitle}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
              </svg>
            </span>
            Change Admin Password
          </h2>
          {changePassMsg.text && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem',
              fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: changePassMsg.type === 'error' ? '#fff1f2' : '#f0fdf4',
              color: changePassMsg.type === 'error' ? '#be123c' : '#15803d',
              border: `1px solid ${changePassMsg.type === 'error' ? '#fecdd3' : '#bbf7d0'}`
            }}>
              {changePassMsg.text}
            </div>
          )}
          <form onSubmit={handleChangeAdminPassword}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input type="password" className={styles.input} required
                value={changePass.current} onChange={e => setChangePass({ ...changePass, current: e.target.value })}
                placeholder="Enter current password" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className={styles.input} required minLength={6}
                value={changePass.newPass} onChange={e => setChangePass({ ...changePass, newPass: e.target.value })}
                placeholder="Min. 6 characters" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input type="password" className={styles.input} required minLength={6}
                value={changePass.confirm} onChange={e => setChangePass({ ...changePass, confirm: e.target.value })}
                placeholder="Re-enter new password" />
            </div>
            <button type="submit" className="btn-primary" style={{ borderRadius: '8px', fontWeight: 700 }}>
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Section divider */}
      <div id="problems" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
          padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '20px',
          border: '1px solid #e2e8f0',
        }}>Problem Statements</span>
        <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
      </div>

      {/* ── PROBLEM STATEMENTS ── */}
      <div className={styles.settingsSection}>
        <h2 className={styles.settingsTitle}>
          <span style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(14,165,233,0.1)', color: '#0ea5e9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </span>
          Problem Statements Management
        </h2>
        <div className={styles.grid2Col}>
          {/* Add Problem */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
              Add New Problem Statement
            </h3>
            <form onSubmit={handleProblemSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Title</label>
                <input className={styles.input} required value={newProblem.title}
                  onChange={e => setNewProblem({...newProblem, title: e.target.value})}
                  placeholder="Problem statement title" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.input}
                  required
                  value={newProblem.description}
                  onChange={e => setNewProblem({...newProblem, description: e.target.value})}
                  style={{ resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }}
                  placeholder="Brief description..."
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>PDF File <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max 2.5MB)</span></label>
                <input type="file" name="pdfFile" accept="application/pdf" className={styles.input} required
                  style={{ padding: '0.5rem 0.875rem' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ borderRadius: '8px', fontWeight: 700 }}>
                Upload Problem
              </button>
            </form>
          </div>

          {/* Problem List */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
              All Problem Statements
              <span style={{
                marginLeft: '0.5rem', padding: '0.1rem 0.5rem',
                background: '#f1f5f9', border: '1px solid #e2e8f0',
                borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b'
              }}>{problems.length}</span>
            </h3>
            <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {problems.map(p => (
                <div key={p.id} style={{
                  border: '1.5px solid #e2e8f0', padding: '1.125rem',
                  marginBottom: '0.875rem', borderRadius: '12px',
                  background: '#fafafa', transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#1B3F8B', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>{p.title}</h4>
                    <span style={{
                      marginLeft: '0.5rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                      gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                      borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      ...(p.isLive
                        ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                        : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' })
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                      {p.isLive ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => openPdfInNewTab(p.pdfUrl, p.title)}
                      style={{
                        color: '#C1272D', fontWeight: 600, background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0, fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      View PDF
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => toggleProblemStatus(p.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.75rem', borderRadius: '7px', border: '1.5px solid',
                          fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.18s ease',
                          ...(p.isLive
                            ? { background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)', color: '#e11d48' }
                            : { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)', color: '#059669' })
                        }}
                      >
                        {p.isLive ? 'Take Offline' : 'Make Live'}
                      </button>
                      <button
                        onClick={() => deleteProblem(p.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.3rem 0.75rem', borderRadius: '7px',
                          border: '1.5px solid rgba(100,116,139,0.25)',
                          background: 'rgba(100,116,139,0.08)', color: '#475569',
                          fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.18s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#64748b'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#64748b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100,116,139,0.08)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(100,116,139,0.25)'; }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {problems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.4 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>No problem statements yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEW TEAM MODAL ── */}
      {selectedTeam && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,17,23,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '1.5rem'
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedTeam(null); }}
        >
          <div style={{
            background: 'white', borderRadius: '20px',
            width: '100%', maxWidth: '820px', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 10px 24px rgba(0,0,0,0.1)',
            animation: 'none',
          }}>

            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              background: 'linear-gradient(135deg, #1B3F8B 0%, #2d5ab5 60%, #6366f1 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
              <div style={{ position: 'absolute', top: '-60%', right: '-5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {selectedTeam.teamName}
                </h2>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                  {selectedTeam.teamId} &bull; {selectedTeam.status}
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', width: '36px', height: '36px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.18s ease', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
              <div className={styles.grid2Col} style={{ marginBottom: '1.75rem', gap: '1rem' }}>
                {/* Team Details */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1B3F8B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', paddingBottom: '0.625rem', borderBottom: '1px solid #e2e8f0' }}>
                    Team Details
                  </h3>
                  {[
                    ['Leader', `${selectedTeam.leader.name} (${selectedTeam.leader.enrollment})`],
                    ['Email', selectedTeam.leader.email],
                    ['Phone', selectedTeam.leader.phone],
                    ['Registered', new Date(selectedTeam.createdAt).toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', minWidth: '90px', flexShrink: 0 }}>{label}</span>
                      <span style={{ color: '#64748b', wordBreak: 'break-word' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Mentor & Problem */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1B3F8B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', paddingBottom: '0.625rem', borderBottom: '1px solid #e2e8f0' }}>
                    Mentor &amp; Problem
                  </h3>
                  {selectedTeam.mentor ? (
                    <>
                      {[
                        ['Mentor', selectedTeam.mentor.name],
                        ['Contact', selectedTeam.mentor.contact],
                        ['Institute', selectedTeam.mentor.institute],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a', minWidth: '75px', flexShrink: 0 }}>{label}</span>
                          <span style={{ color: '#64748b' }}>{value}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem', marginBottom: '1rem' }}>No mentor selected yet.</p>
                  )}
                  {selectedTeam.problem ? (
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', minWidth: '70px', flexShrink: 0 }}>Problem</span>
                      <span style={{ color: '#64748b' }}>{selectedTeam.problem.title}</span>
                    </div>
                  ) : (
                    <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem', margin: 0 }}>No problem statement selected yet.</p>
                  )}
                </div>
              </div>

              {/* Members Table */}
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.01em' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B3F8B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                All Team Members
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Role</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Name</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Enrollment</th>
                    <th style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em' }}>Dept / Sem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ★ Leader
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>{selectedTeam.leader.name}</td>
                    <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontFamily: 'monospace' }}>{selectedTeam.leader.enrollment}</td>
                    <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{selectedTeam.leader.department}, Sem {selectedTeam.leader.semester}</td>
                  </tr>
                  {selectedTeam.members.map((m, i) => (
                    <tr key={m.id}>
                      <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Member
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', fontWeight: 500, color: '#1e293b' }}>{m.name}</td>
                      <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontFamily: 'monospace' }}>{m.enrollment}</td>
                      <td style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{m.department}, Sem {m.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.6rem 1.5rem', background: '#e2e8f0',
                  border: '1.5px solid #d1d5db', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                  color: '#374151', transition: 'all 0.18s ease', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cbd5e1'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#d1d5db'; }}
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
