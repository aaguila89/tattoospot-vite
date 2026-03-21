import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

function ArtistDashboard({ setScreen, handleSignOut: parentSignOut }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('artistId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(bookings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleAccept(id) {
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'accepted' });
    } catch (err) {
      console.error('Error accepting booking:', err);
    }
  }

  async function handleDecline(id) {
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'declined' });
    } catch (err) {
      console.error('Error declining booking:', err);
    }
  }

  function handleSignOut() {
    if (parentSignOut) {
      parentSignOut();
    } else {
      signOut(auth);
      setScreen('splash');
    }
  }

  return (
    <div className="page">

      <div className="dash-header">
        <div className="dash-greeting">Welcome back</div>
        <div className="dash-name">{auth.currentUser?.displayName || 'Artist'} 🎨</div>
        <button
          onClick={handleSignOut}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#8a8580',
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '8px',
            fontFamily: 'inherit'
          }}
        >
          Sign Out
        </button>
        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-val">{requests.length}</div>
            <div className="dash-stat-lbl">Pending</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val"
              style={{ cursor: 'pointer' }}
              onClick={() => setScreen('artistBookings')}
            >📋</div>
            <div className="dash-stat-lbl">All Bookings</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val"
              style={{ cursor: 'pointer' }}
              onClick={() => setScreen('artistMessages')}
            >💬</div>
            <div className="dash-stat-lbl">Messages</div>
          </div>
        </div>
      </div>

      <div className="content" style={{ paddingTop: '20px' }}>
        <div className="section-header">
          <h2 className="page-title" style={{ fontSize: '20px' }}>New Requests</h2>
          <p className="page-sub">{loading ? 'Loading...' : `${requests.length} pending requests`}</p>
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading your bookings...</p>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No pending requests.<br />Share your profile to get started!</p>
          </div>
        )}

        {requests.map(request => (
          <div className="request-card" key={request.id}>
            <div className="request-top">
              <div className="request-avatar">👤</div>
              <div className="request-info">
                <div className="request-name">{request.clientName}</div>
                <div className="request-style">{request.style} · {request.placement}</div>
              </div>
              <div className="request-time">{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="request-desc">
              📅 {request.date} at {request.time} · {request.duration}
              {request.description && <div style={{ marginTop: '6px' }}>{request.description}</div>}
            </div>
            <div className="request-actions">
              <button className="req-btn req-btn-accept" onClick={() => handleAccept(request.id)}>✓ Accept</button>
              <button className="req-btn req-btn-decline" onClick={() => handleDecline(request.id)}>✗ Decline</button>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-bar">
        <button className="tab-item active">
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
        <button className="tab-item" onClick={() => setScreen('artistBookings')}>
          <span className="tab-icon">📅</span>
          <span className="tab-label">Bookings</span>
        </button>
      </div>
    </div>
  );
}

export default ArtistDashboard;