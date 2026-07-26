"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.accordionItem}>
      <button className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
        {title}
        <span>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClosed, setIsClosed] = useState(false);
  const [config, setConfig] = useState({ heroMedia: [] });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("2026-08-02T23:59:00");
  const [currentSlide, setCurrentSlide] = useState(0);

  const deadline = new Date(deadlineDate).getTime();

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data);
          if (data.deadline) {
            setDeadlineDate(data.deadline);
          }
        }
      })
      .catch(console.error)
      .finally(() => setConfigLoaded(true));
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setIsClosed(true);
      } else {
        setIsClosed(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer(); // Call immediately so it doesn't wait 1s for the first tick
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [deadline]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
    return `${day} ${month} ${year}, ${strTime}`;
  };

  const defaultHeroMedia = [
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
  ];

  const slides = (config?.heroMedia && config.heroMedia.length > 0) ? config.heroMedia : defaultHeroMedia;

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

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
    <main>
      <section className={styles.heroSection}>
        <div className={styles.sliderContainer}>
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`${styles.slide} ${index === currentSlide ? styles.activeSlide : ''}`}
              style={{ backgroundImage: `url(${slide})` }}
            />
          ))}
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>INTERNAL SIH 2026</h1>
          <p className={styles.heroTagline}>Innovate. Build. Represent.</p>
          <p className={styles.heroSubtext}>Vidush Somany Institute of Technology & Research (VSITR)</p>
        </div>
        <div className={styles.sliderControls}>
          {slides.map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className={styles.countdownSection}>
        {!configLoaded ? (
          <div style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)' }}>Loading Timer...</p>
          </div>
        ) : isClosed ? (
          <h2 style={{ color: 'var(--primary-red)' }}>Registrations Closed</h2>
        ) : (
          <>
            <h2>{config.registrationHeading || "Registration Closes In"}</h2>
            <div className={styles.countdownTimer}>
              <div className={styles.countdownBox}>
                <span>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>Days</span>
              </div>
              <span>:</span>
              <div className={styles.countdownBox}>
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>Hours</span>
              </div>
              <span>:</span>
              <div className={styles.countdownBox}>
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>Minutes</span>
              </div>
              <span>:</span>
              <div className={styles.countdownBox}>
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.countdownLabel}>Seconds</span>
              </div>
            </div>
          </>
        )}
        
        <div className={styles.ctaSection}>
          <button 
            className="btn-primary" 
            disabled={isClosed}
            title={isClosed ? "Registrations are now closed" : ""}
            onClick={() => !isClosed && (window.location.href = config.registrationButtonLink || '/register')}
            style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
          >
            {config.registrationButtonText || "Register Your Team"}
          </button>
          <span className={styles.deadlineText}>{config.registrationFooterText || "Registration closes on"} {formatDate(deadlineDate)}</span>
        </div>
      </section>

      <div className="container">
        <section className={styles.section} id="rules">
          <h2 className="section-title">Rules & Regulations</h2>
          
          <Accordion title="Eligibility">
            <ul>
              <li>1. Each team must consist of exactly <strong>6 members</strong>, including the Team Leader.</li>
              <li>2. Each team must include <strong>at least 1 female participant</strong>. All-girls teams are welcome and eligible.</li>
              <li>3. All participants must be from the <strong>same college</strong> — inter-college teams are <strong>not permitted</strong>.</li>
              <li>4. Members may belong to different years, branches, or disciplines within the same college.</li>
              <li>5. Each team must use a <strong>unique team name</strong> that does <strong>not include the institute's name</strong>.</li>
              <li>6. Each participant (by enrollment number) may be part of <strong>only one team</strong>.</li>
              <li>7. A team once registered <strong>cannot add/replace members</strong> after the registration deadline without admin approval.</li>
            </ul>
          </Accordion>

          <Accordion title="Registration Process">
            <ul>
              <li>8. Registration is split into two independent phases: <strong>(a) Team Registration</strong> and <strong>(b) Mentor Details Submission</strong>.</li>
              <li>9. Only the <strong>Team Leader</strong> may register the team and will be the sole point of contact.</li>
              <li>10. All communication will be sent <strong>only</strong> to the Team Leader's registered college email.</li>
            </ul>
          </Accordion>

          <Accordion title="Conduct & Participation">
            <ul>
              <li>11. Teams must report on time for screening rounds/presentations.</li>
              <li>12. Plagiarism or misrepresentation will lead to <strong>disqualification</strong>.</li>
              <li>13. Decisions of the organizing committee are final and binding.</li>
              <li>14. Any change in team composition must be communicated in writing.</li>
            </ul>
          </Accordion>
        </section>

        <section className={styles.section} id="faq">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <Accordion title="Who can participate in Internal SIH 2026?">
            Any student enrolled at VSITR, KSV can participate.
          </Accordion>
          <Accordion title="Is it compulsory to have a female team member?">
            Yes, each team must have at least one female member.
          </Accordion>
          <Accordion title="Can I register without a mentor?">
            You can complete Phase 1 (Team Registration) without a mentor, but Phase 2 (Mentor Details) is mandatory for final confirmation.
          </Accordion>
          <Accordion title="Can I edit my team details after submission?">
            No, post-deadline edits are not allowed without admin approval.
          </Accordion>
        </section>

        <section className={styles.section} id="clubs">
          <h2 className="section-title">Organizing Clubs</h2>
          <div className={styles.clubsGrid}>
            <div className={styles.clubCard}>
              <h3 className={styles.clubName}>Research Club</h3>
              <p><strong>Faculty:</strong> Dr. Parita Shah, Prof. Amit P. Modi</p>
              <p><strong>Student:</strong> Sorathiya Jenish, Patel Ved</p>
            </div>
            <div className={styles.clubCard}>
              <h3 className={styles.clubName}>Coding Club</h3>
              <p><strong>Faculty:</strong> Prof. Ankit Vaghela, Prof. Ridhish Sir</p>
              <p><strong>Student:</strong> Patel Devang, Vekariya Jeel</p>
            </div>
            <div className={styles.clubCard}>
              <h3 className={styles.clubName}>Soft Skills Club</h3>
              <p><strong>Faculty:</strong> Prof. Nirzari S. Patel, Prof. Nehal Shah</p>
              <p><strong>Student:</strong> Salina Hirani, Christian Sanyam</p>
            </div>
            <div className={styles.clubCard}>
              <h3 className={styles.clubName}>Design Club</h3>
              <p><strong>Faculty:</strong> Prof. Sanjay Makwana</p>
              <p><strong>Student:</strong> Patel Dev, Patel Semi</p>
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLeft}>
            <div className={styles.footerLogos}>
               {displayLogos && (
                 <>
                   <img src={displayLogos.sih} alt="SIH Logo" />
                   <img src={displayLogos.ksv} alt="KSV Logo" />
                   <img src={displayLogos.vsitr} alt="VSITR Logo" />
                 </>
               )}
            </div>
            <span className={styles.footerTitle}>Internal SIH 2026</span>
          </div>
          
          <div className={styles.footerNav}>
            <Link 
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </Link>
            <Link href="/#rules">Rules & FAQ</Link>
            <Link href="/#clubs">Clubs</Link>
            <Link href="/register">Register</Link>
            <Link href="/problems">Problem Statements</Link>
            <Link href="/team/login">Team Login</Link>
            <Link href="/admin/login">Admin Login</Link>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          &copy; 2026 Internal SIH Hackathon. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
