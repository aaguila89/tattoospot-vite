import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import NavBar from '../components/NavBar.jsx';

function ArtistMessages({ setScreen, setSelectedClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessageMap, setLastMessageMap] = useState({});

  useEffect(() => {
    async function loadClients() {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const allUsers = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser?.uid);
        setClients(allUsers);

        const user = auth.currentUser;
        if (!user) return;

        allUsers.forEach(client => {
          const chatId = [user.uid, client.id].sort().join('_');
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

          onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
              const lastMsg = snapshot.docs[0].data();
              setLastMessageMap(prev => ({ ...prev, [client.id]: lastMsg }));

              const readRef = doc(db, 'readStatus', `${user.uid}_${chatId}`);
              const readSnap = await getDoc(readRef);

              if (!readSnap.exists()) {
                if (lastMsg.senderId !== user.uid) {
                  setUnreadMap(prev => ({ ...prev, [client.id]: true }));
                }
              } else {
                const lastRead = readSnap.data().lastRead;
                if (lastMsg.createdAt > lastRead && lastMsg.senderId !== user.uid) {
                  setUnreadMap(prev => ({ ...prev, [client.id]: true }));
                } else {
                  setUnreadMap(prev => ({ ...prev, [client.id]: false }));
                }
              }
            }
          });
        });
      } catch (err) {
        console.error('Error loading clients:', err);
      }
      setLoading(false);
    }
    loadClients();
  }, []);

  async function handleClientClick(client) {
    const user = auth.currentUser;
    if (user) {
      const chatId = [user.uid, client.id].sort().join('_');
      const readRef = doc(db, 'readStatus', `${user.uid}_${chatId}`);
      await setDoc(readRef, {
        lastRead: new Date().toISOString(),
        userId: user.uid,
        chatId,
      });
      setUnreadMap(prev => ({ ...prev, [client.id]: false }));
    }
    if (setSelectedClient) setSelectedClient(client);
    setScreen('artistChat');
  }

  function formatTime(createdAt) {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

  return (
    <div className="page">
      <NavBar leftButton={
        <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
      } />

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
          {clients.map(client => {
            const isUnread = unreadMap[client.id];
            const lastMessage = lastMessageMap[client.id];
            return (
              <div key={client.id} className="convo-item" onClick={() => handleClientClick(client)}>
                <div className="convo-avatar">
                  👤
                  {isUnread && <div className="convo-dot"></div>}
                </div>
                <div className="convo-info">
                  <div className="convo-name" style={{
                    fontWeight: isUnread ? '700' : '500',
                    color: isUnread ? '#0a0a0a' : '#2c2c2c',
                  }}>
                    {client.name || client.email}
                  </div>
                  <div className="convo-preview" style={{
                    fontWeight: isUnread ? '600' : '400',
                    color: isUnread ? '#0a0a0a' : '#8a8580',
                  }}>
                    {lastMessage ? lastMessage.text : 'Tap to view conversation'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div className="convo-time">{lastMessage ? formatTime(lastMessage.createdAt) : ''}</div>
                  {isUnread && (
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c84b2f' }}></div>
                  )}
                </div>
              </div>
            );
          })}
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
        <button className="tab-item" onClick={() => setScreen('artistBookings')}>
          <span className="tab-icon">📅</span>
          <span className="tab-label">Bookings</span>
        </button>
      </div>
    </div>
  );
}

export default ArtistMessages;