import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { notifyClientAccepted, notifyClientDeclined } from '../utils/notifications';
import { isPro, getTrialDaysLeft } from '../utils/planUtils';

function ArtistDashboard({ setScreen, handleSignOut: parentSignOut }) {
  const [requests, setRequests] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [artistData, setArtistData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [availability, setAvailability] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editRate, setEditRate] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const artistSnap = await getDoc(doc(db, 'artists', user.uid));
        if (artistSnap.exists()) {
          const data = artistSnap.data();
          setArtistData(data);
          setAvailability(data.available !== false);
          setEditRate(data.rate || '');
          setEditBio(data.bio || '');
        }
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) setUserData(userSnap.data());
      } catch (err) {
        console.error('Error loading artist:', err);
      }
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('artistId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'bookings'), where('artistId', '==', user.uid));
    const unsubscribe = onSnapshot(q, snapshot => {
      setAllBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const accepted = allBookings.filter(b => b.status === 'accepted');
  const confirmed = allBookings.filter(b => b.status === 'confirmed');
  const declined = allBookings.filter(b => b.status === 'declined');
  const totalEarnings = confirmed.reduce((sum, b) => sum + (b.deposit || 0), 0);
  const totalClients = new Set(allBookings.map(b => b.clientId)).size;
  const responseRate = allBookings.length > 0
    ? Math.round(((accepted.length + declined.length) / allBookings.length) * 100)
    : 0;

  const proActive = isPro(userData);
  const trialDays = getTrialDaysLeft(userData);

  async function handleAccept(request) {
    try {
      await updateDoc(doc(db, 'bookings', request.id), { status: 'accepted' });
      await notifyClientAccepted({
        clientId: request.clientId,
        artistName: user?.displayName || 'Your artist',
        bookingId: request.id,
      });
    } catch (err) {
      console.error('Error accepting:', err);
    }
  }

  async function handleDecline(request) {
    try {
      await updateDoc(doc(db, 'bookings', request.id), { status: 'declined' });
      await notifyClientDeclined({
        clientId: request.clientId,
        artistName: user?.displayName || 'Your artist',
        bookingId: request.id,
      });
    } catch (err) {
      console.error('Error declining:', err);
    }
  }

  async function toggleAvailability() {
    const newVal = !availability;
    setAvailability(newVal);
    try {
      await updateDoc(doc(db, 'artists', user.uid), { available: newVal });
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'artists', user.uid), { rate: editRate, bio: editBio });
      setArtistData(prev => ({ ...prev, rate: editRate, bio: editBio }));
      setEditMode(false);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
    setSaving(false);
  }

  function shareProfile() {
    const url = `https://tattoospot.net`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }

  function handleSignOut() {
    if (parentSignOut) parentSignOut();
    else { signOut(auth); setScreen('splash'); }
  }

  function getCalendarDays() {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }

  function getBookingsForDay(date) {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return allBookings.filter(b =>
      b.date === dateStr && (b.status === 'accepted' || b.status === 'confirmed')
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="page">

      {/* HEADER */}
      <div className="dash-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <div className="dash-greeting">Welcome back</div>
            <div className="dash-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.displayName || 'Artist'} 🎨
              {proActive && (
                <span style={{
                  background: 'linear-gradient(135deg, #c84b2f, #d4a853)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '20px',
                }}>
                  ✓ PRO
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={toggleAvailability}
              style={{
                background: availability ? '#22c55e' : '#8a8580',
                color: 'white', border: 'none', borderRadius: '20px',
                padding: '6px 12px', fontSize: '12px', fontWeight: '700',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {availability ? '● Open' : '○ Closed'}
            </button>
            <button
              onClick={handleSignOut}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#8a8580', fontSize: '12px', padding: '6px 12px',
                borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Trial warning banner */}
        {userData?.plan === 'pro_trial' && trialDays <= 7 && trialDays > 0 && (
          <div
            onClick={() => setScreen('proUpgrade')}
            style={{
              background: 'rgba(200,75,47,0.15)',
              border: '1px solid rgba(200,75,47,0.4)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginTop: '12px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div>
              <div style={{ color: '#c84b2f', fontWeight: '700', fontSize: '13px' }}>
                ⚠ Trial ends in {trialDays} day{trialDays !== 1 ? 's' : ''}
              </div>
              <div style={{ color: 'rgba(200,75,47,0.8)', fontSize: '11px' }}>
                Subscribe to keep Pro features
              </div>
            </div>
            <span style={{ color: '#c84b2f', fontSize: '13px', fontWeight: '700' }}>Subscribe →</span>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {!proActive && userData?.plan === 'free' && (
          <div
            onClick={() => setScreen('proUpgrade')}
            style={{
              background: 'linear-gradient(135deg, rgba(26,10,0,0.8), rgba(61,21,0,0.8))',
              border: '1px solid #c84b2f40',
              borderRadius: '10px',
              padding: '10px 14px',
              marginTop: '12px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>
                ⚡ Upgrade to Pro
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                Get featured, unlimited photos & more
              </div>
            </div>
            <span style={{ color: '#d4a853', fontSize: '13px', fontWeight: '700' }}>$19/mo →</span>
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats" style={{ marginTop: '16px' }}>
          <div className="dash-stat">
            <div className="dash-stat-val" style={{ color: '#d4a853' }}>${totalEarnings}</div>
            <div className="dash-stat-lbl">Earned</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val">{totalClients}</div>
            <div className="dash-stat-lbl">Clients</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val">{allBookings.length}</div>
            <div className="dash-stat-lbl">Bookings</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-val">{responseRate}%</div>
            <div className="dash-stat-lbl">Response</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', background: '#f5f0e8', borderRadius: '10px',
        padding: '4px', margin: '16px 16px 0', gap: '4px',
      }}>
        {[
          { key: 'overview', label: '🏠 Overview' },
          { key: 'calendar', label: '📅 Calendar' },
          { key: 'profile', label: '👤 Profile' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '7px', border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#0a0a0a' : '#8a8580',
              fontWeight: activeTab === tab.key ? '600' : '400',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content" style={{ paddingTop: '20px' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div className="section-header">
              <h2 className="page-title" style={{ fontSize: '18px' }}>New Requests</h2>
              <p className="page-sub">{loading ? 'Loading...' : `${requests.length} pending`}</p>
            </div>

            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>No pending requests.<br />Share your profile to get booked!</p>
                <button
                  onClick={shareProfile}
                  style={{
                    marginTop: '12px', background: '#c84b2f', color: 'white',
                    border: 'none', borderRadius: '8px', padding: '10px 20px',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {shareCopied ? '✓ Link Copied!' : '🔗 Share My Profile'}
                </button>
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
                <div style={{
                  background: '#f5f0e8', borderRadius: '8px', padding: '8px 12px',
                  fontSize: '13px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#8a8580' }}>Deposit offered</span>
                  <strong style={{ color: '#c84b2f' }}>${request.deposit || 100}</strong>
                </div>
                <div className="request-actions">
                  <button className="req-btn req-btn-accept" onClick={() => handleAccept(request)}>✓ Accept</button>
                  <button className="req-btn req-btn-decline" onClick={() => handleDecline(request)}>✗ Decline</button>
                </div>
              </div>
            ))}

            {/* Earnings */}
            <div className="info-card" style={{ marginTop: '20px' }}>
              <h3 className="info-card-title">Earnings Summary</h3>
              <div className="booking-row">
                <span className="booking-row-label">Total deposits received</span>
                <span className="booking-row-val" style={{ color: '#22c55e', fontWeight: '700' }}>${totalEarnings}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Confirmed bookings</span>
                <span className="booking-row-val">{confirmed.length}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Pending deposits</span>
                <span className="booking-row-val" style={{ color: '#d4a853' }}>
                  ${accepted.reduce((sum, b) => sum + (b.deposit || 0), 0)}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="info-card" style={{ marginTop: '12px' }}>
              <h3 className="info-card-title">Rating & Reviews</h3>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: '40px', fontWeight: '700', color: '#d4a853' }}>
                  {artistData?.rating || '—'}
                </div>
                <div style={{ fontSize: '13px', color: '#8a8580', marginTop: '8px' }}>
                  {artistData?.reviews || 0} reviews
                </div>
              </div>
              {(!artistData?.reviews || artistData.reviews === 0) && (
                <p style={{ fontSize: '13px', color: '#8a8580', textAlign: 'center', margin: 0 }}>
                  Complete your first booking to start receiving reviews!
                </p>
              )}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div>
            <div className="section-header">
              <h2 className="page-title" style={{ fontSize: '18px' }}>Upcoming 14 Days</h2>
              <p className="page-sub">Accepted & confirmed bookings</p>
            </div>
            {calendarDays.map(day => {
              const dayBookings = getBookingsForDay(day);
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div key={day.toISOString()} style={{ display: 'flex', gap: '12px', marginBottom: '12px', opacity: dayBookings.length === 0 ? 0.4 : 1 }}>
                  <div style={{
                    minWidth: '48px', textAlign: 'center', padding: '8px 4px',
                    background: isToday ? '#c84b2f' : '#f5f0e8', borderRadius: '8px',
                    color: isToday ? 'white' : '#0a0a0a',
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{day.getDate()}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {dayBookings.length === 0 ? (
                      <div style={{ background: '#f5f0e8', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#8a8580' }}>
                        No bookings
                      </div>
                    ) : dayBookings.map(b => (
                      <div key={b.id} style={{
                        background: b.status === 'confirmed' ? '#f0fdf4' : '#eff6ff',
                        border: `1px solid ${b.status === 'confirmed' ? '#bbf7d0' : '#bfdbfe'}`,
                        borderRadius: '8px', padding: '10px 12px', marginBottom: '6px',
                      }}>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{b.clientName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {b.time} · {b.style} · {b.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div>
            <div className="section-header">
              <h2 className="page-title" style={{ fontSize: '18px' }}>My Profile</h2>
              <p className="page-sub">How clients see you</p>
            </div>

            <div className="info-card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '40px' }}>🎨</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: '700', fontSize: '18px' }}>{user?.displayName}</div>
                    {proActive && (
                      <span style={{
                        background: 'linear-gradient(135deg, #c84b2f, #d4a853)',
                        color: 'white', fontSize: '10px', fontWeight: '800',
                        padding: '2px 8px', borderRadius: '20px',
                      }}>✓ PRO</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8a8580' }}>{artistData?.location}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {(artistData?.styles || []).map(s => (
                  <span key={s} className="tag-pill">{s}</span>
                ))}
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Rate</span>
                <span className="booking-row-val">{artistData?.rate}</span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Status</span>
                <span className="booking-row-val" style={{ color: availability ? '#22c55e' : '#8a8580', fontWeight: '700' }}>
                  {availability ? '● Available' : '○ Unavailable'}
                </span>
              </div>
              <div className="booking-row">
                <span className="booking-row-label">Plan</span>
                <span className="booking-row-val">
                  {proActive ? (
                    <span style={{ color: '#d4a853', fontWeight: '700' }}>
                      {userData?.plan === 'pro_trial' ? `Pro Trial (${trialDays}d left)` : '⭐ Pro'}
                    </span>
                  ) : (
                    <span style={{ color: '#8a8580' }}>Free</span>
                  )}
                </span>
              </div>
            </div>

            {!editMode ? (
              <div>
                <div className="info-card" style={{ marginBottom: '12px' }}>
                  <h3 className="info-card-title">Bio</h3>
                  <p className="info-card-text">{artistData?.bio || 'No bio yet.'}</p>
                </div>
                <button onClick={() => setEditMode(true)} className="btn btn-secondary" style={{ marginBottom: '12px' }}>
                  ✏️ Edit Rate & Bio
                </button>
              </div>
            ) : (
              <div className="info-card" style={{ marginBottom: '12px' }}>
                <h3 className="info-card-title">Edit Profile</h3>
                <div className="form-group">
                  <label className="form-label">HOURLY RATE</label>
                  <input className="form-input" value={editRate} onChange={e => setEditRate(e.target.value)} placeholder="e.g. $150/hr" />
                </div>
                <div className="form-group">
                  <label className="form-label">BIO</label>
                  <textarea className="form-textarea" value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} placeholder="Tell clients about your style..." />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setEditMode(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={saveProfile} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            <button onClick={shareProfile} className="btn btn-primary" style={{ marginBottom: '12px' }}>
              {shareCopied ? '✓ Link Copied!' : '🔗 Share My Profile'}
            </button>

            <button onClick={() => setScreen('artistPortfolio')} className="btn btn-secondary" style={{ marginBottom: '12px' }}>
              🖼️ Manage Portfolio
            </button>

            <button onClick={() => setScreen('proUpgrade')} className="btn btn-secondary">
              {proActive ? '⭐ Manage Pro Plan' : '⚡ Upgrade to Pro'}
            </button>
          </div>
        )}

      </div>

      {/* TAB BAR */}
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