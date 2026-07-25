"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// ── Validation helpers ──────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone.trim());

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  
  const emptyMember = {
    name: '', gender: '', enrollment: '', semester: '', department: '', phone: '', email: ''
  };

  const [leader, setLeader] = useState({ ...emptyMember });
  const [members, setMembers] = useState([{ ...emptyMember }, { ...emptyMember }, { ...emptyMember }, { ...emptyMember }, { ...emptyMember }]);

  const [modal, setModal] = useState({ show: false, type: '', title: '', message: '' });

  const closeModal = () => {
    setModal({ show: false, type: '', title: '', message: '' });
    if (modal.type === 'success') {
      router.push('/');
    }
  };

  const showError = (title, message) => setModal({ show: true, type: 'error', title, message });

  const handleNext = () => {
    if (step === 1) {
      if (!teamName.trim()) return showError("Missing Info", "Team Name is required.");
      if (teamName.toLowerCase().includes('vsitr') || teamName.toLowerCase().includes('vidush somany'))
        return showError("Invalid Name", "Team name must not include the institute's name.");
      setStep(2);
    } else if (step === 2) {
      if (!leader.name || !leader.email || !leader.phone || !leader.enrollment || !leader.gender || !leader.semester || !leader.department)
        return showError("Missing Info", "Please fill all Team Leader details.");
      if (!isValidEmail(leader.email))
        return showError("Invalid Email", `"${leader.email}" is not a valid email address.`);
      if (!isValidPhone(leader.phone))
        return showError("Invalid Mobile", `Mobile number must be 10 digits and start with 6–9 (Indian number). Got: "${leader.phone}"`);
      setStep(3);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMember = () => {
    if (members.length < 5) setMembers([...members, { ...emptyMember }]);
    else showError("Limit Reached", "Maximum 5 members allowed (6 total with leader).");
  };

  const removeMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  const handleSubmit = async () => {
    if (members.length !== 5)
      return showError("Registration Incomplete", "Each team must consist of exactly 6 members, including the Team Leader.");

    const allMembers = [leader, ...members];
    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      const label = i === 0 ? 'Team Leader' : `Member ${i}`;
      if (!m.name || !m.gender || !m.enrollment || !m.email || !m.phone || !m.semester || !m.department)
        return showError("Missing Info", `Please fill all required details for ${label}.`);
      if (!isValidEmail(m.email))
        return showError("Invalid Email", `${label}: "${m.email}" is not a valid email address.`);
      if (!isValidPhone(m.phone))
        return showError("Invalid Mobile", `${label}: Mobile number must be exactly 10 digits and start with 6–9. Got: "${m.phone}"`);
    }

    const hasFemale = allMembers.some(m => m.gender === 'Female');
    if (!hasFemale) {
      return showError("Registration Failed", "Every team must include at least one female participant.");
    }

    const enrollments = allMembers.map(m => m.enrollment);
    if (new Set(enrollments).size !== enrollments.length) {
      return showError("Duplicate Entry", "An enrollment number has been entered more than once in your team.");
    }

    // API Call
    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, leader, members })
      });
      const data = await res.json();

      if (!res.ok) {
        showError("Registration Error", data.error || "An error occurred.");
      } else {
        setModal({
          show: true,
          type: 'success',
          title: "Registration Successful",
          message: `Congratulations! Your team has been successfully registered.

Registration ID: ${data.teamId}

A confirmation email with your team's password has been sent to the Team Leader.

Please Note: The Team Leader must regularly check their email inbox for further details.`
        });
      }
    } catch (e) {
      showError("Error", "Failed to connect to server.");
    }
  };

  const renderMemberForm = (data, onChange, prefix = "Leader") => (
    <div className={styles.row}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Full Name</label>
        <input className={styles.input} type="text" placeholder="First Last Middle" value={data.name} onChange={e => onChange('name', e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Gender</label>
        <select className={styles.select} value={data.gender} onChange={e => onChange('gender', e.target.value)}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Enrollment Number</label>
        <input className={styles.input} type="text" value={data.enrollment} onChange={e => onChange('enrollment', e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Semester</label>
        <select className={styles.select} value={data.semester} onChange={e => onChange('semester', e.target.value)}>
          <option value="">Select</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Department</label>
        <select className={styles.select} value={data.department} onChange={e => onChange('department', e.target.value)}>
          <option value="">Select</option>
          <option value="Computer Engineering">Computer Engineering</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
          <option value="Civil Engineering">Civil Engineering</option>
          <option value="AI & DS">AI & DS</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Mobile Number</label>
        <input
          className={styles.input}
          type="tel"
          maxLength="10"
          placeholder="10-digit mobile (starts with 6-9)"
          value={data.phone}
          onChange={e => onChange('phone', e.target.value.replace(/\D/g, ''))}
          style={data.phone && !isValidPhone(data.phone) ? { borderColor: '#ff4d4f' } : {}}
        />
        {data.phone && !isValidPhone(data.phone) && (
          <small style={{ color: '#ff4d4f', marginTop: '0.25rem', display: 'block' }}>
            ⚠ Must be 10 digits and start with 6, 7, 8, or 9
          </small>
        )}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label}>Email ID</label>
        <input
          className={styles.input}
          type="email"
          placeholder="e.g. name@example.com"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
          style={data.email && !isValidEmail(data.email) ? { borderColor: '#ff4d4f' } : {}}
        />
        {data.email && !isValidEmail(data.email) && (
          <small style={{ color: '#ff4d4f', marginTop: '0.25rem', display: 'block' }}>
            ⚠ Enter a valid email address (e.g. name@domain.com)
          </small>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Register Your Team</h1>
        
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div>Team Name</div>
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div>Team Leader</div>
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.activeStep : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div>Team Members</div>
          </div>
        </div>

        {step === 1 && (
          <div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Team Name</label>
              <input 
                className={styles.input} 
                type="text" 
                placeholder="Enter unique team name"
                value={teamName}
                onChange={e => setTeamName(e.target.value)} 
              />
              <small style={{color: '#666', marginTop: '0.5rem', display: 'block'}}>
                Must not contain institute name (e.g., VSITR, Vidush Somany)
              </small>
            </div>
            <div className={styles.actions}>
              <div></div>
              <button className="btn-primary" onClick={handleNext}>Next Step</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-blue)'}}>Team Leader Details</h3>
            {renderMemberForm(leader, (field, val) => setLeader({...leader, [field]: val}))}
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={handleNext}>Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-blue)'}}>Team Members (Exactly 5 required)</h3>
            {members.map((member, index) => (
              <div key={index} className={styles.memberCard}>
                <div className={styles.memberHeader}>
                  <span>Member {index + 1}</span>
                  <button className={styles.removeBtn} onClick={() => removeMember(index)}>Remove</button>
                </div>
                {renderMemberForm(member, (field, val) => handleMemberChange(index, field, val))}
              </div>
            ))}
            
            {members.length < 5 && (
              <button className={styles.addBtn} onClick={addMember}>+ Add Member</button>
            )}

            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={handleSubmit}>Submit Registration</button>
            </div>
          </div>
        )}
      </div>

      {modal.show && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${modal.type === 'error' ? styles.modalError : styles.modalSuccess}`}>
            <div className={styles.modalTitle}>
              {modal.type === 'error' ? '❌ ' : '✅ '}{modal.title}
            </div>
            <div className={styles.modalText} style={{ whiteSpace: 'pre-line' }}>{modal.message}</div>
            <button className="btn-primary" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
