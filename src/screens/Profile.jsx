import React from 'react';

function Profile({ setScreen, artist }) {
  const name = artist?.name || 'Kenji Mori';
  const location = artist?.location || 'Brooklyn, NY';
  const styles = artist?.styles || ['Japanese', 'Neo-Traditional', 'Irezumi'];
  const rate = artist?.rate || '$180/hr';
  const rating = artist?.rating || 4.9;
  const reviews = artist?.reviews || 147;

  return (
    <div className="page">

      <div className="nav">
        <button className="back-btn" onClick={() => setScreen('discover')}>← Back</button>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar">🎨</div>
        <div className="profile-name">{name}</div>
        <div className="profile-loc">📍 {location}</div>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-val">{reviews}</div>
            <div className="profile-stat-lbl">Reviews</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{rating}★</div>
            <div className="profile-stat-lbl">Rating</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">{artist?.experience || '5yr'}</div>
            <div className="profile-stat-lbl">Experience</div>
          </div>
        </div>
      </div>

      <div className="content" style={{ paddingTop: '20px' }}>

        <div style={{ marginBottom: '16px' }}>
          {styles.map(style => (
            <span key={style} className="tag-pill">{style}</span>
          ))}
        </div>

        <div className="info-card">
          <h3 className="info-card-title">About</h3>
          <p className="info-card-text">
            {artist?.bio || 'Specializing in custom tattoo work with a passion for bringing your vision to life.'}
          </p>
        </div>

        <h3 className="page-title" style={{ fontSize: '16px', marginBottom: '12px' }}>
          Portfolio
        </h3>
        <div className="portfolio-grid">
          <div className="portfolio-item" style={{ background: '#1a1a2e' }}>🐉</div>
          <div className="portfolio-item" style={{ background: '#0d2818' }}>🌊</div>
          <div className="portfolio-item" style={{ background: '#2d1b00' }}>🦅</div>
          <div className="portfolio-item" style={{ background: '#1a0a2e' }}>🌸</div>
          <div className="portfolio-item" style={{ background: '#0a1a1a' }}>🐯</div>
          <div className="portfolio-item" style={{ background: '#1a1a0a' }}>⛩️</div>
        </div>

        <div className="info-card" style={{ marginTop: '16px' }}>
          <div className="booking-row">
            <span className="booking-row-label">Hourly Rate</span>
            <span className="booking-row-val">{rate}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Min. Session</span>
            <span className="booking-row-val">2 hours</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Next Available</span>
            <span className="booking-row-val" style={{ color: '#22c55e' }}>This Friday</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Deposit</span>
            <span className="booking-row-val">$100</span>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={() => setScreen('messages')}>
            💬 Message
          </button>
          <button className="btn btn-primary" onClick={() => setScreen('booking')}>
            📅 Book Now
          </button>
        </div>

      </div>
    </div>
  );
}

export default Profile;