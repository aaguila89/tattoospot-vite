import React, { useState } from 'react';

function Confirmation({ setScreen }) {
  const [bookingDetails] = useState(() => {
    const saved = sessionStorage.getItem('lastBooking');
    return saved ? JSON.parse(saved) : null;
  });

  const artistName = bookingDetails?.artistName || 'Your artist';

  return (
    <div className="page">

      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
      </div>

      <div className="content">
        <div className="confirm-hero">
          <div className="confirm-icon">🎉</div>
          <div className="confirm-title">Request Sent!</div>
          <div className="confirm-sub">
            {artistName} will review your request and confirm within 24 hours.
            You'll get a notification when they respond.
          </div>
        </div>

        <div className="info-card">
          <div className="booking-row">
            <span className="booking-row-label">Artist</span>
            <span className="booking-row-val">{artistName}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Date</span>
            <span className="booking-row-val">{bookingDetails?.date || 'TBD'}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Time</span>
            <span className="booking-row-val">{bookingDetails?.time || 'TBD'}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Style</span>
            <span className="booking-row-val">{bookingDetails?.style || 'TBD'}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Duration</span>
            <span className="booking-row-val">{bookingDetails?.duration || 'TBD'}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Deposit Due</span>
            <span className="booking-row-val" style={{ color: '#c84b2f' }}>
              ${bookingDetails?.deposit || 100}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3 className="info-card-title">What Happens Next?</h3>
          <div className="next-step">
            <div className="next-step-icon">1️⃣</div>
            <div className="next-step-text">
              <strong>Artist Reviews</strong>
              <p>{artistName} will review your request and accept or suggest changes</p>
            </div>
          </div>
          <div className="next-step">
            <div className="next-step-icon">2️⃣</div>
            <div className="next-step-text">
              <strong>Pay Deposit</strong>
              <p>Once accepted pay your ${bookingDetails?.deposit || 100} deposit to secure your spot</p>
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

        <button
          className="btn btn-primary"
          style={{ marginBottom: '10px' }}
          onClick={() => setScreen('messages')}
        >
          💬 Message {artistName}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setScreen('discover')}
        >
          🔍 Back to Discover
        </button>

      </div>
    </div>
  );
}

export default Confirmation;