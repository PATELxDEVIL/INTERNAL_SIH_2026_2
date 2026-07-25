"use client";
import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/team/problems')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProblems(data.problems);
        } else {
          setError(data.error || 'Failed to load problem statements');
        }
      })
      .catch(err => {
        setError('Network error loading problem statements');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container" style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      <h1 className="section-title" style={{ textAlign: 'center', display: 'block' }}>Live Problem Statements</h1>
      <p style={{ textAlign: 'center', marginBottom: '3rem', color: '#666' }}>
        Review the available problem statements for Internal SIH 2026. Teams can select their problem statement from the Team Dashboard.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', fontSize: '1.25rem', color: '#666' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>
      ) : problems.length === 0 ? (
        <div style={{ textAlign: 'center', fontSize: '1.25rem', color: '#666' }}>No problem statements are currently live. Check back later!</div>
      ) : (
        <div className={styles.problemsGrid}>
          {problems.map((problem) => (
            <div key={problem.id} className={styles.problemCard}>
              <div className={styles.problemHeader}>
                <h2 className={styles.problemTitle}>{problem.title}</h2>
              </div>
              <div className={styles.problemContent}>
                <p className={styles.problemDesc}>{problem.description}</p>
                {problem.pdfUrl && (
                  <a href={problem.pdfUrl} download={`${problem.title.replace(/\s+/g, '_')}_Statement.pdf`} className={styles.pdfLink}>
                    📄 View Reference PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}