import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const styleOptions = [
  'Japanese', 'Blackwork', 'Realism', 'Neo-Traditional',
  'Fine Line', 'Watercolor', 'Geometric', 'Tribal',
  'Illustrative', 'Dark Art', 'Botanical', 'Minimalist'
];

function ArtistSetup({ setScreen }) {
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [rate, setRate] = useState('');
  const [experience, setExperience] = useState('');
  const [minDeposit, setMinDeposit] = useState('100');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleStyle(style) {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      if (selectedStyles.length >= 5) {
        setError('Maximum 5 styles allowed');
        return;
      }
      setSelectedStyles([...selectedStyles, style]);
    }
    setError('');
  }

  async function handleSave() {
    if (bio === '' || location === '' || rate === '') {
      setError('Please fill in all fields');
      return;
    }
    if (selectedStyles.length === 0) {
      setError('Please select at least one style');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, 'artists', user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        bio,
        location,
        rate,
        experience,
        minDeposit: parseInt(minDeposit) || 100,
        styles: selectedStyles,
        rating: 0,
        reviews: 0,
        available: true,
        createdAt: new Date().toISOString(),
      });
      setScreen('artist');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="page">

      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
      </div>

      <div className="content">

        <div className="section-header">
          <h2 className="page-title">Set Up Your Profile</h2>
          <p className="page-sub">Let clients know about your work</p>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {error !== '' && (
          <div className="auth-error">{error}</div>
        )}

        {/* STEP 1 — BASIC INFO */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">YOUR LOCATION</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Brooklyn, NY"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">YEARS OF EXPERIENCE</label>
              <select
                className="form-select"
                value={experience}
                onChange={e => setExperience(e.target.value)}
              >
                <option value="">Select experience</option>
                <option>1-2 years</option>
                <option>3-5 years</option>
                <option>5-10 years</option>
                <option>10+ years</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">HOURLY RATE</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. $150/hr"
                value={rate}
                onChange={e => setRate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">MINIMUM DEPOSIT REQUIRED ($)</label>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 100"
                value={minDeposit}
                onChange={e => setMinDeposit(e.target.value)}
                min="0"
              />
              <p style={{
                fontSize: '12px',
                color: '#8a8580',
                marginTop: '6px'
              }}>
                This is the minimum deposit clients must pay to book you.
                They can choose to pay more.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                if (location === '' || rate === '' || experience === '') {
                  setError('Please fill in all fields');
                  return;
                }
                setError('');
                setStep(2);
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* STEP 2 — STYLES */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">
                SELECT YOUR STYLES (up to 5)
              </label>
              <div className="style-chips">
                {styleOptions.map(style => (
                  <div
                    key={style}
                    className={`chip ${selectedStyles.includes(style) ? 'selected' : ''}`}
                    onClick={() => toggleStyle(style)}
                  >
                    {style}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (selectedStyles.length === 0) {
                    setError('Please select at least one style');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — BIO */}
        {step === 3 && (
          <div>
            <div className="form-group">
              <label className="form-label">YOUR BIO</label>
              <textarea
                className="form-textarea"
                placeholder="Tell clients about your style, experience, and what makes your work unique..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                style={{ minHeight: '140px' }}
              />
            </div>

            <div className="info-card" style={{ marginBottom: '16px' }}>
              <h3 className="info-card-title">Profile Preview</h3>
              <div className="booking-row">
                <span className="booking-row-label">Name</span>
                <span className="booking-row-val">
                  {auth.currentUser?.displayName}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Location</span>
                <span className="booking-row-val">{location}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Rate</span>
                <span className="booking-row-val">{rate}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Min. Deposit</span>
                <span className="booking-row-val">${minDeposit}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Experience</span>
                <span className="booking-row-val">{experience}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Styles</span>
                <span className="booking-row-val">
                  {selectedStyles.join(', ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Launch Profile 🚀'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ArtistSetup;