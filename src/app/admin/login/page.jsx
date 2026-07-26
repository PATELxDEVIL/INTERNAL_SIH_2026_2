"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'verify'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        localStorage.setItem('adminSession', 'true');
        router.push('/admin/dashboard');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp' })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
      } else {
        setSuccess('OTP sent to admin email (internalsih.vsitr@gmail.com). Check your inbox.');
        setMode('verify');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setMode('login');
        setOtp(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            <h1 className={styles.title} style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Login</h1>
            {error && <div style={msgStyle('error')}>{error}</div>}
            {success && <div style={msgStyle('success')}>{success}</div>}
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input type="text" className={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input type="password" className={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem' }}>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>
                Forgot Password?
              </button>
            </p>
          </>
        )}

        {/* ── FORGOT — REQUEST OTP ── */}
        {mode === 'forgot' && (
          <>
            <h1 className={styles.title} style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h1>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              An OTP will be sent to <strong>internalsih.vsitr@gmail.com</strong>
            </p>
            {error && <div style={msgStyle('error')}>{error}</div>}
            {success && <div style={msgStyle('success')}>{success}</div>}
            <form onSubmit={handleRequestOtp}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP to Admin Email'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem' }}>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}>
                ← Back to Login
              </button>
            </p>
          </>
        )}

        {/* ── VERIFY OTP + NEW PASSWORD ── */}
        {mode === 'verify' && (
          <>
            <h1 className={styles.title} style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Enter OTP</h1>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Check <strong>internalsih.vsitr@gmail.com</strong> for the 6-digit OTP.
            </p>
            {error && <div style={msgStyle('error')}>{error}</div>}
            {success && <div style={msgStyle('success')}>{success}</div>}
            <form onSubmit={handleVerifyOtp}>
              <div className={styles.formGroup}>
                <label className={styles.label}>6-Digit OTP</label>
                <input type="text" maxLength={6} className={styles.input}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482910" required style={{ letterSpacing: '0.4rem', fontSize: '1.25rem', textAlign: 'center' }} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input type="password" className={styles.input} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <input type="password" className={styles.input} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <button onClick={handleRequestOtp} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontSize: '0.875rem' }} disabled={loading}>
                Resend OTP
              </button>
              {' · '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.875rem' }}>
                Back to Login
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

function msgStyle(type) {
  return {
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    background: type === 'error' ? '#fff5f5' : '#f6ffed',
    color: type === 'error' ? '#cc0000' : '#389e0d',
    border: `1px solid ${type === 'error' ? '#ffccc7' : '#b7eb8f'}`,
  };
}
