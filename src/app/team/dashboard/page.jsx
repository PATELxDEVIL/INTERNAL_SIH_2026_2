"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../team.module.css';
import { openPdfInNewTab } from '@/lib/pdfHelper';

export default function TeamDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  
  const [mentor, setMentor] = useState({
    name: '', contact: '', email: '', department: '', institute: '', address: ''
  });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [problems, setProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [problemMsg, setProblemMsg] = useState({ type: '', text: '' });

  const [editingMember, setEditingMember] = useState(null);
  const [memberMsg, setMemberMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const session = localStorage.getItem('teamSession');
    if (!session) {
      router.push('/team/login');
      return;
    }
    const initialTeam = JSON.parse(session);
    setTeam(initialTeam);
    
    // Fetch fresh team data
    fetch(`/api/team/details?teamId=${initialTeam.teamId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTeam(data.team);
          localStorage.setItem('teamSession', JSON.stringify(data.team));
        }
      });
      
    // Fetch problems
    fetch('/api/team/problems')
      .then(res => res.json())
      .then(data => {
        if (data.success) setProblems(data.problems);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('teamSession');
    router.push('/team/login');
  };

  const handleMentorSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/team/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.teamId, mentor })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error });
      } else {
        setMsg({ type: 'success', text: 'Mentor details submitted successfully!' });
        setTeam(data.team || { ...team, mentor, status: 'Registration Completed' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to submit mentor details.' });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/team/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.teamId, ...passwords })
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error });
      } else {
        setMsg({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ oldPassword: '', newPassword: '' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to change password.' });
    }
  };

  const handleSelectProblem = async (e) => {
    e.preventDefault();
    if (!selectedProblemId) return;
    setProblemMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/team/select-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.teamId, problemId: selectedProblemId })
      });
      const data = await res.json();
      if (!res.ok) {
        setProblemMsg({ type: 'error', text: data.error });
      } else {
        setProblemMsg({ type: 'success', text: 'Problem statement selected successfully!' });
        setTeam(data.team);
      }
    } catch (err) {
      setProblemMsg({ type: 'error', text: 'Failed to select problem statement.' });
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setMemberMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/team/member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.teamId, member: editingMember })
      });
      const data = await res.json();
      if (!res.ok) {
        setMemberMsg({ type: 'error', text: data.error });
      } else {
        setTeam(data.team);
        setEditingMember(null);
      }
    } catch (err) {
      setMemberMsg({ type: 'error', text: 'Failed to update member.' });
    }
  };

  if (!team) return null;

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.dashboardCard}`}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.title}>Team Dashboard</h1>
          <button className="btn-primary" style={{ background: '#E63946', boxShadow: 'none' }} onClick={handleLogout}>Logout</button>
        </div>

        {msg.text && (
          <div className={msg.type === 'error' ? styles.error : styles.success}>
            {msg.text}
          </div>
        )}

        <div className={styles.infoBlock}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--white)' }}>Team Registration ID: {team.teamId}</h2>
          <p style={{ margin: 0 }}><strong>Status:</strong> {team.status}</p>
          {team.status === 'Pending' && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#94A3B8' }}>Your team is under review. You can select your Mentor and Problem Statement.</p>}
        </div>

        {/* ── MENTOR SELECTION ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>1. Mentor Details</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#CBD5E1' }}>Please provide details for the faculty member mentoring your team.</p>
          {team.mentor ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}>
              <p>✅ Mentor details have been submitted.</p>
              <p><strong>Mentor Name:</strong> {team.mentor.name}</p>
            </div>
          ) : (
            <form onSubmit={handleMentorSubmit}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Mentor Name</label>
                  <input className={styles.input} required value={mentor.name} onChange={e => setMentor({...mentor, name: e.target.value})} placeholder="Dr./Prof./Mr./Ms." />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Number</label>
                  <input className={styles.input} required value={mentor.contact} onChange={e => setMentor({...mentor, contact: e.target.value})} maxLength="10" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input type="email" className={styles.input} required value={mentor.email} onChange={e => setMentor({...mentor, email: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <select className={styles.select} required value={mentor.department} onChange={e => setMentor({...mentor, department: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="AI & DS">AI & DS</option>
                    <option value="MCA">MCA</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Institute</label>
                  <select className={styles.select} required value={mentor.institute} onChange={e => setMentor({...mentor, institute: e.target.value})}>
                    <option value="">Select</option>
                    <option value="KSV Kadi">KSV Kadi</option>
                    <option value="KSV Gandhinagar">KSV Gandhinagar</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Office Address</label>
                <textarea className={styles.input} required value={mentor.address} onChange={e => setMentor({...mentor, address: e.target.value})} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn-primary">Submit Mentor Details</button>
            </form>
          )}
        </div>

        {/* ── PROBLEM STATEMENT SELECTION ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>2. Select Problem Statement</h2>
          {problemMsg.text && (
            <div className={problemMsg.type === 'error' ? styles.error : styles.success} style={{ marginBottom: '1rem' }}>
              {problemMsg.text}
            </div>
          )}
          {team.problem ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>{team.problem.title}</h3>
              <p style={{ color: '#E2E8F0', marginBottom: '1rem' }}>{team.problem.description}</p>
              <button 
                onClick={() => openPdfInNewTab(team.problem.pdfUrl, team.problem.title)}
                className="btn-primary" 
                style={{ fontSize: '0.9rem', background: '#10B981' }}
              >
                View Selected Problem PDF
              </button>
            </div>
          ) : (
            <form onSubmit={handleSelectProblem}>
              <div className={styles.formGroup} style={{ maxWidth: '500px' }}>
                <label className={styles.label}>Select a Problem Statement</label>
                <select className={styles.select} required value={selectedProblemId} onChange={e => setSelectedProblemId(e.target.value)}>
                  <option value="">Choose...</option>
                  {problems.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary">Lock Problem Statement</button>
            </form>
          )}
        </div>

        {/* ── EDIT TEAM MEMBERS ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>3. Manage Team Members</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#CBD5E1' }}>Ensure all member details are accurate.</p>
          
          <div className={styles.tableContainer}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Enrollment</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className={styles.avatarRow}>
                      <div className={styles.avatar}>{team.leader.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <span className={styles.nameText}>{team.leader.name}</span>
                        <span className={styles.subText}>{team.leader.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{team.leader.enrollment}</td>
                  <td>
                    <span className={`${styles.badge} ${styles.badgeLeader}`}>Team Leader</span>
                  </td>
                  <td>{team.leader.phone}</td>
                  <td>
                    <span style={{ display: 'block' }}>{team.leader.department}</span>
                    <span className={styles.subText}>Semester {team.leader.semester}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={styles.subText} style={{ fontStyle: 'italic' }}>-</span>
                  </td>
                </tr>

                {team.members.map((m, i) => (
                  <tr key={m.id}>
                    <td>
                      <div className={styles.avatarRow}>
                        <div className={styles.avatar}>{m.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className={styles.nameText}>{m.name}</span>
                          <span className={styles.subText}>{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{m.enrollment}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeMember}`}>Member</span>
                    </td>
                    <td>{m.phone}</td>
                    <td>
                      <span style={{ display: 'block' }}>{m.department}</span>
                      <span className={styles.subText}>Semester {m.semester}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => setEditingMember(m)}
                        className={styles.iconBtn}
                        title="Edit Member"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>4. Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Password</label>
                <input type="password" required className={styles.input} value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input type="password" required className={styles.input} value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        </div>

      </div>

      {/* ── EDIT MEMBER MODAL ── */}
      {editingMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-color, #1a1a1a)', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--glass-border, #333)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--white)' }}>Edit Member Details</h2>
            {memberMsg.text && (
              <div className={memberMsg.type === 'error' ? styles.error : styles.success} style={{ marginBottom: '1rem' }}>{memberMsg.text}</div>
            )}
            <form onSubmit={handleSaveMember}>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input className={styles.input} required value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input type="email" className={styles.input} required value={editingMember.email} onChange={e => setEditingMember({...editingMember, email: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone (10 digits)</label>
                  <input className={styles.input} required maxLength="10" value={editingMember.phone} onChange={e => setEditingMember({...editingMember, phone: e.target.value.replace(/\D/g, '')})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Enrollment</label>
                  <input className={styles.input} required value={editingMember.enrollment} onChange={e => setEditingMember({...editingMember, enrollment: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Semester</label>
                  <select className={styles.select} required value={editingMember.semester} onChange={e => setEditingMember({...editingMember, semester: e.target.value})}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <select className={styles.select} required value={editingMember.department} onChange={e => setEditingMember({...editingMember, department: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn-secondary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'var(--white)' }} onClick={() => setEditingMember(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
