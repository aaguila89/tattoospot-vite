import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function ArtistBookings({ setScreen }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('artistId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(all);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const accepted = bookings.filter(b => b.status === 'accepted');
  const declined = bookings.filter(b => b.status === 'declined');
  const pending = bookings.filter(b => b.status === 'pending');

  const displayed = activeTab === 'accepted' ? accepted
    : activeTab === 'declined' ? declined
    : pending;

  function getStatusColor(status) {
    if (status === 'accepted') return '#22c55e';
    if (status === 'declined') return '#8a8580';
    return '#d4a853';
  }

  function getStatusLabel(status) {
    if (status === 'accepted') return '✓ Accepted';
    if (status === 'declined') return '✗ Declined';
    return '⏳ Pending';
  }

  return (
    <div className="page">

      <div className="nav">
        <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="content">

        <div className="section-header">
          <h2 className="page-title">My Bookings</h2>
          <p className="page-sub">All your booking requests</p>
        </div>

        {/* STATS */}
        <div className="dash-stats" style={{ marginBottom: '20px' }}>
          <div className="dash-stat">
            <div className="dash-stat-val" style={{ color: '#d4a853' }}>
              {pending.length}
            </div>
            <div className="dash-stat-lbl">Pending</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val" style={{ color: '#22c55e' }}>
              {accepted.length}
            </div>
            <div className="dash-stat-lbl">Accepted</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val" style={{ color: '#8a8580' }}>
              {declined.length}
            </div>
            <div className="dash-stat-lbl">Declined</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{
          display: 'flex',
          background: '#f5f0e8',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
          gap: '4px',
        }}>
          {['accepted', 'pending', 'declined'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '7px',
                border: 'none',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#0a0a0a' : '#8a8580',
                fontWeight: activeTab === tab ? '600' : '400',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {tab} ({tab === 'accepted' ? accepted.length : tab === 'declined' ? declined.length : pending.length})
            </button>
          ))}
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading bookings...</p>
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No {activeTab} bookings yet.</p>
          </div>
        )}

        {displayed.map(booking => (
          <div className="info-card" key={booking.id} style={{ marginBottom: '12px' }}>

            {/* STATUS BADGE */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>
                {booking.clientName}
              </div>
              <span style={{
                background: `${getStatusColor(booking.status)}20`,
                color: getStatusColor(booking.status),
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
              }}>
                {getStatusLabel(booking.status)}
              </span>
            </div>

            <div className="booking-row">
              <span className="booking-row-label">Style</span>
              <span className="booking-row-val">{booking.style}</span>
            </div>
            <div className="booking-row">
              <span className="booking-row-label">Placement</span>
              <span className="booking-row-val">{booking.placement}</span>
            </div>
            <div className="booking-row">
              <span className="booking-row-label">Date</span>
              <span className="booking-row-val">{booking.date}</span>
            </div>
            <div className="booking-row">
              <span className="booking-row-label">Time</span>
              <span className="booking-row-val">{booking.time}</span>
            </div>
            <div className="booking-row">
              <span className="booking-row-label">Duration</span>
              <span className="booking-row-val">{booking.duration}</span>
            </div>
            <div className="booking-row">
              <span className="booking-row-label">Deposit</span>
              <span className="booking-row-val" style={{ color: '#c84b2f' }}>
                ${booking.deposit || 100}
              </span>
            </div>
            {booking.description && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#f5f0e8',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#2c2c2c',
                lineHeight: '1.5',
              }}>
                {booking.description}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: '#8a8580',
              marginTop: '10px',
              textAlign: 'right',
            }}>
              {new Date(booking.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}

      </div>

      {/* TAB BAR */}
      <div className="tab-bar">
        <button className="tab-item" onClick={() => setScreen('dashboard')}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Dashboard</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('artistPortfolio')}>
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">Portfolio</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('artistMessages')}>
          <span className="tab-icon">💬</span>
          <span className="tab-label">Messages</span>
        </button>
        <button className="tab-item active">
          <span className="tab-icon">📅</span>
          <span className="tab-label">Bookings</span>
        </button>
      </div>

    </div>
  );
}

export default ArtistBookings;