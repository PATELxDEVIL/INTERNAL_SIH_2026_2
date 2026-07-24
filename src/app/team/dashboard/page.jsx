"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../team.module.css';

export default function TeamDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  
  // Mentor form state
  const [mentor, setMentor] = useState({
    name: '', contact: '', email: '', department: '', institute: '', address: ''
  });
  
  // Password form state
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const session = localStorage.getItem('teamSession');
    if (!session) {
      router.push('/team/login');
    } else {
      setTeam(JSON.parse(session));
    }
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
        const updatedTeam = { ...team, mentor, status: 'Registration Completed' };
        setTeam(updatedTeam);
        localStorage.setItem('teamSession', JSON.stringify(updatedTeam));
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

        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>1. Mentor Details</h2>
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

        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>2. Change Password</h2>
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
    </div>
  );
}
