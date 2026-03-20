import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function Messages({ setScreen, setSelectedArtist }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        console.log('Loading artists for messages...');
        const snapshot = await getDocs(collection(db, 'artists'));
        console.log('Artists found:', snapshot.docs.length);
        const artists = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Artist data:', data);
          return {
            id: doc.id, // Always use Firestore document ID
            ...data,
          };
        });
        setConversations(artists);
      } catch (err) {
        console.error('Error loading conversations:', err);
      }
      setLoading(false);
    }
    loadConversations();
  }, []);

  function handleConvoClick(artist) {
    console.log('Artist clicked:', artist.name, 'doc id:', artist.id, 'uid:', artist.uid);
    if (setSelectedArtist) {
      setSelectedArtist({
        ...artist,
        id: artist.id,
      });
    }
    setScreen('chat');
  }

  return (
    <div className="page">

      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <button className="back-btn" onClick={() => setScreen('discover')}>← Back</button>
      </div>

      <div className="content" style={{ padding: '20px 20px 100px' }}>

        <div className="section-header">
          <h2 className="page-title">Messages</h2>
          <p className="page-sub">Your conversations</p>
        </div>

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading conversations...</p>
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No artists available yet.<br />Check back soon!</p>
          </div>
        )}

        <div className="convo-list">
          {conversations.map(artist => (
            <div
              key={artist.id}
              className="convo-item"
              onClick={() => handleConvoClick(artist)}
            >
              <div className="convo-avatar">
                🎨
              </div>
              <div className="convo-info">
                <div className="convo-name">{artist.name}</div>
                <div className="convo-preview">
                  {artist.styles ? artist.styles.join(', ') : 'Tattoo Artist'}
                </div>
              </div>
              <div className="convo-time">
                {artist.location || ''}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="tab-bar">
        <button className="tab-item" onClick={() => setScreen('discover')}>
          <span className="tab-icon">🔍</span>
          <span className="tab-label">Discover</span>
        </button>
        <button className="tab-item active">
          <span className="tab-icon">💬</span>
          <span className="tab-label">Messages</span>
        </button>
        <button className="tab-item">
          <span className="tab-icon">📅</span>
          <span className="tab-label">Bookings</span>
        </button>
        <button className="tab-item">
          <span className="tab-icon">👤</span>
          <span className="tab-label">Profile</span>
        </button>
      </div>

    </div>
  );
}

export default Messages;