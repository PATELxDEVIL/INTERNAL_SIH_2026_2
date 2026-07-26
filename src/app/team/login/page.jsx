"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../team.module.css';

export default function TeamLogin() {
  const router = useRouter();
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.registrationButtonLink?.toLowerCase().includes('login') && data.deadline) {
          const deadlineTime = new Date(data.deadline).getTime();
          if (new Date().getTime() > deadlineTime) {
            setIsClosed(true);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/team/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        // Store session locally for this prototype
        localStorage.setItem('teamSession', JSON.stringify(data.team));
        router.push('/team/dashboard');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Team Login</h1>
        
        {loadingConfig ? (
          <h2 style={{ textAlign: 'center', margin: '2rem 0', color: '#64748b' }}>Loading...</h2>
        ) : isClosed ? (
          <div style={{ textAlign: 'center', margin: '3rem 0' }}>
            <h2 style={{ color: 'var(--primary-red)', marginBottom: '1rem' }}>Login Closed</h2>
            <p style={{ color: '#64748b' }}>The time window for team login has ended.</p>
          </div>
        ) : (
          <>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Team ID</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g., SIH2026-001" 
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="Enter password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
          </>
        )}
      </div>
    </div>
  );
}
