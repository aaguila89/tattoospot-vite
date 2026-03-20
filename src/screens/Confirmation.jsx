import React from 'react';

function Confirmation({ setScreen }) {
  return (
    <div className="page">

      {/* NAV */}
      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
      </div>

      {/* SUCCESS HERO */}
      <div className="confirm-hero">
        <div className="confirm-icon">🎉</div>
        <h2 className="confirm-title">Request Sent!</h2>
        <p className="confirm-sub">
          Kenji will review your request and confirm within 24 hours.
          You'll get a notification when they respond.
        </p>
      </div>

      <div className="content" style={{ paddingTop: '0' }}>

        {/* BOOKING SUMMARY */}
        <div className="info-card">
          <div className="booking-row">
            <span className="booking-row-label">Artist</span>
            <span className="booking-row-val">Kenji Mori</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Date</span>
            <span className="booking-row-val">Friday, Mar 21</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Time</span>
            <span className="booking-row-val">12:00 PM</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Style</span>
            <span className="booking-row-val">Japanese / Irezumi</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Duration</span>
            <span className="booking-row-val">~3 hours</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Deposit Due</span>
            <span className="booking-row-val" style={{ color: '#c84b2f' }}>$100</span>
          </div>
        </div>

        {/* WHAT HAPPENS NEXT */}
        <div className="info-card">
          <h3 className="info-card-title">What Happens Next?</h3>
          <div className="next-step">
            <div className="next-step-icon">1️⃣</div>
            <div className="next-step-text">
              <strong>Artist Reviews</strong>
              <p>Kenji will review your request and accept or suggest changes</p>
            </div>
          </div>
          <div className="next-step">
            <div className="next-step-icon">2️⃣</div>
            <div className="next-step-text">
              <strong>Pay Deposit</strong>
              <p>Once accepted pay your $100 deposit to secure your spot</p>
            </div>
          </div>
          <div className="next-step">
            <div className="next-step-icon">3️⃣</div>
            <div className="next-step-text">
              <strong>Get Inked!</strong>
              <p>Show up to your session and get your dream tattoo</p>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <button
          className="btn btn-primary"
          style={{ marginBottom: '10px' }}
          onClick={() => setScreen('messages')}
        >
          💬 Message Kenji
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setScreen('client')}
        >
          🔍 Back to Discover
        </button>

      </div>
    </div>
  );
}

export default Confirmation;