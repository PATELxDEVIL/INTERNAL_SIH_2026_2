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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className={styles.title} style={{ marginBottom: 0 }}>Team Portal</h1>
          <button onClick={handleLogout} className="btn-primary" style={{ background: '#ff4d4f' }}>Logout</button>
        </div>

        {msg.text && (
          <div className={msg.type === 'error' ? styles.error : styles.success}>
            {msg.text}
          </div>
        )}

        <div className={styles.infoBlock}>
          <h3 style={{ marginBottom: '0.5rem' }}>Team {team.teamName}</h3>
          <p><strong>Registration ID:</strong> {team.teamId}</p>
          <p><strong>Status:</strong> {team.status}</p>
        </div>

        {/* ── PROBLEM STATEMENT SELECTION ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>1. Problem Statement</h2>
          {problemMsg.text && (
            <div className={problemMsg.type === 'error' ? styles.error : styles.success} style={{ marginBottom: '1rem' }}>
              {problemMsg.text}
            </div>
          )}
          {team.problem ? (
            <div style={{ background: '#e6f7ff', padding: '1rem', border: '1px solid #91d5ff', borderRadius: '4px' }}>
              <p>✅ <strong>Selected Problem:</strong> {team.problem.title}</p>
              <button 
                onClick={() => openPdfInNewTab(team.problem.pdfUrl, team.problem.title)}
                style={{ color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.5rem', fontWeight: 'bold' }}
              >
                📄 View Problem Details (PDF)
              </button>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.5rem' }}>Want to change it?</p>
                <form onSubmit={handleSelectProblem} style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
                  <select className={styles.select} required value={selectedProblemId} onChange={e => setSelectedProblemId(e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="">Select a new problem</option>
                    {problems.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Change</button>
                </form>
              </div>
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

        {/* ── MENTOR DETAILS ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>2. Mentor Details</h2>
          {team.mentor ? (
            <div style={{ background: '#f6ffed', padding: '1rem', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
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

        {/* ── EDIT TEAM MEMBERS ── */}
        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>3. Manage Team Members</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>The Team Leader cannot be changed. You can edit the details of other members.</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', border: '1px solid #eee' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Role</th>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Name</th>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Email</th>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Phone</th>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Enrollment</th>
                  <th style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Dept / Sem</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Leader Row */}
                <tr style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary-blue)', borderRight: '1px solid #eee' }}>👑 Team Leader</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', borderRight: '1px solid #eee' }}>{team.leader.name}</td>
                  <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{team.leader.email}</td>
                  <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{team.leader.phone}</td>
                  <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{team.leader.enrollment}</td>
                  <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{team.leader.department} <br/> <small>Sem {team.leader.semester}</small></td>
                  <td style={{ padding: '0.75rem', color: '#999', fontStyle: 'italic' }}>Cannot Edit</td>
                </tr>
                {/* Member Rows */}
                {team.members.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>Team Member</td>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{m.name}</td>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{m.email}</td>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{m.phone}</td>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{m.enrollment}</td>
                    <td style={{ padding: '0.75rem', borderRight: '1px solid #eee' }}>{m.department} <br/> <small>Sem {m.semester}</small></td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => setEditingMember(m)}
                        className={styles.btnSecondary}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Edit
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-blue)' }}>Edit Member Details</h2>
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className={styles.btnSecondary} onClick={() => setEditingMember(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
