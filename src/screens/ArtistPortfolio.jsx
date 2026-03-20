import React, { useState } from 'react';

const portfolioItems = [
  { id: 1, emoji: '🐉', bg: '#1a1a2e' },
  { id: 2, emoji: '🌊', bg: '#0d2818' },
  { id: 3, emoji: '🦅', bg: '#2d1b00' },
  { id: 4, emoji: '🌸', bg: '#1a0a2e' },
  { id: 5, emoji: '🐯', bg: '#0a1a1a' },
  { id: 6, emoji: '⛩️', bg: '#1a1a0a' },
];

const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ArtistPortfolio({ setScreen }) {
  const [styles, setStyles] = useState([
    'Japanese', 'Irezumi', 'Neo-Traditional', 'Color Work'
  ]);
  const [availability, setAvailability] = useState([
    'Mon', 'Tue', 'Thu', 'Fri'
  ]);
  const [saved, setSaved] = useState(false);

  function removeStyle(style) {
    setStyles(styles.filter(s => s !== style));
  }

  function toggleDay(day) {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day));
    } else {
      setAvailability([...availability, day]);
    }
  }

  function saveAvailability() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page">

      {/* NAV */}
      <div className="nav">
        <button className="back-btn" onClick={() => setScreen('artist')}>← Back</button>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="content">

        {/* HEADER */}
        <div className="section-header">
          <h2 className="page-title">My Portfolio</h2>
          <p className="page-sub">Manage your work and styles</p>
        </div>

        {/* STYLE TAGS */}
        <div className="info-card">
          <h3 className="info-card-title">Style Tags</h3>
          <p className="info-card-text" style={{ marginBottom: '12px' }}>
            These tags help clients find you based on their style preferences
          </p>
          <div>
            {styles.map(style => (
              <span
                key={style}
                className="tag-pill"
                style={{ cursor: 'pointer' }}
                onClick={() => removeStyle(style)}
              >
                {style} ✕
              </span>
            ))}
            <span
              className="tag-pill-add"
              onClick={() => setStyles([...styles, 'New Style'])}
            >
              + Add Style
            </span>
          </div>
        </div>

        {/* PORTFOLIO GRID */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 className="page-title" style={{ fontSize: '16px' }}>
            Work Samples
          </h3>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
            onClick={() => alert('Upload feature coming soon!')}
          >
            + Upload
          </button>
        </div>

        <div className="portfolio-grid" style={{ marginBottom: '20px' }}>
          {portfolioItems.map(item => (
            <div
              key={item.id}
              className="portfolio-item"
              style={{ background: item.bg }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* AVAILABILITY */}
        <div className="info-card">
          <h3 className="info-card-title">Weekly Availability</h3>
          <p className="info-card-text" style={{ marginBottom: '12px' }}>
            Select the days you are available for bookings
          </p>
          <div className="style-chips">
            {allDays.map(day => (
              <div
                key={day}
                className={`chip ${availability.includes(day) ? 'selected' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </div>
            ))}
          </div>
          <button
            className={`btn ${saved ? 'btn-saved' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '10px' }}
            onClick={saveAvailability}
          >
            {saved ? '✓ Saved!' : 'Save Availability'}
          </button>
        </div>

        {/* PROFILE STATS */}
        <div className="info-card">
          <h3 className="info-card-title">Profile Performance</h3>
          <div className="booking-row">
            <span className="booking-row-label">Profile Views</span>
            <span className="booking-row-val">1,284 this month</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Booking Requests</span>
            <span className="booking-row-val">47 this month</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Conversion Rate</span>
            <span className="booking-row-val" style={{ color: '#22c55e' }}>73%</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Avg Response Time</span>
            <span className="booking-row-val">2.4 hours</span>
          </div>
        </div>

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        <button className="tab-item" onClick={() => setScreen('artist')}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Dashboard</span>
        </button>
        <button className="tab-item active">
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">Portfolio</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('messages')}>
          <span className="tab-icon">💬</span>
          <span className="tab-label">Messages</span>
        </button>
        <button className="tab-item">
          <span className="tab-icon">📅</span>
          <span className="tab-label">Schedule</span>
        </button>
      </div>

    </div>
  );
}

export default ArtistPortfolio;