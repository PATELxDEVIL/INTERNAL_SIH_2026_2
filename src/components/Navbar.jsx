"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const [config, setConfig] = useState({ logos: null });
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.logos) {
          setConfig(data);
        }
      })
      .catch(err => console.error("Failed to fetch config", err))
      .finally(() => setConfigLoaded(true));
  }, []);

  const defaultLogos = {
    sih: '/logos/sih-logo.png',
    ksv: '/logos/sih-logo.png',
    vsitr: '/logos/sih-logo.png'
  };

  const displayLogos = configLoaded ? {
    sih: (config.logos && typeof config.logos === 'object' && config.logos.sih) || defaultLogos.sih,
    ksv: (config.logos && typeof config.logos === 'object' && config.logos.ksv) || defaultLogos.ksv,
    vsitr: (config.logos && typeof config.logos === 'object' && config.logos.vsitr) || defaultLogos.vsitr
  } : null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logoSection}>
          <div className={styles.logoWrapper}>
            {displayLogos && (
              <>
                <img src={displayLogos.sih} alt="SIH Logo" className={styles.logo} />
                <img src={displayLogos.ksv} alt="KSV Logo" className={styles.logo} />
                <img src={displayLogos.vsitr} alt="VSITR Logo" className={styles.logo} />
              </>
            )}
          </div>
          <div className={styles.title}>Internal SIH 2026</div>
        </div>
        <div className={styles.navLinks}>
          <Link 
            href="/" 
            className={`${styles.navLink} ${pathname === '/' ? styles.activeLink : ''}`}
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            Home
          </Link>
          <Link href="/#rules" className={`${styles.navLink} ${pathname === '/rules' ? styles.activeLink : ''}`}>Rules & FAQ</Link>
          <Link href="/#clubs" className={`${styles.navLink} ${pathname === '/clubs' ? styles.activeLink : ''}`}>Clubs</Link>
          <Link href="/register" className={`${styles.navLink} ${pathname === '/register' ? styles.activeLink : ''}`}>Register Your Team</Link>
          <Link href="/problems" className={`${styles.navLink} ${pathname === '/problems' ? styles.activeLink : ''}`}>Problem Statements</Link>
          <Link href="/team/login" className={`${styles.navLink} ${pathname === '/team/login' ? styles.activeLink : ''}`}>Team Login</Link>
          <Link href="/admin/login" className={`${styles.navLink} ${pathname === '/admin/login' ? styles.activeLink : ''}`}>Admin Login</Link>
        </div>
      </div>
    </nav>
  );
}
