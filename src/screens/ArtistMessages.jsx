import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { auth } from '../firebase';

function ArtistMessages({ setScreen, setSelectedClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const allUsers = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser?.uid);
        setClients(allUsers);
      } catch (err) {
        console.error('Error loading clients:', err);
      }
      setLoading(false);
    }
    loadClients();
  }, []);

  function handleClientClick(client) {
    if (setSelectedClient) {
      setSelectedClient(client);
    }
    setScreen('artistChat');
  }

  return (
    <div className="page">

      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
      </div>

      <div className="content" style={{ padding: '20px 20px 100px' }}>

        <div className="section-header">
          <h2 className="page-title">Messages</h2>
          <p className="page-sub">Conversations with clients</p>
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading conversations...</p>
          </div>
        )}

        {!loading && clients.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No conversations yet.<br />Clients will appear here when they message you!</p>
          </div>
        )}

        <div className="convo-list">
          {clients.map(client => (
            <div
              key={client.id}
              className="convo-item"
              onClick={() => handleClientClick(client)}
            >
              <div className="convo-avatar">👤</div>
              <div className="convo-info">
                <div className="convo-name">{client.name || client.email}</div>
                <div className="convo-preview">Tap to view conversation</div>
              </div>
              <div className="convo-time">Now</div>
            </div>
          ))}
        </div>

      </div>

      <div className="tab-bar">
        <button className="tab-item" onClick={() => setScreen('dashboard')}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Dashboard</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('artistPortfolio')}>
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">Portfolio</span>
        </button>
        <button className="tab-item active">
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

export default ArtistMessages;