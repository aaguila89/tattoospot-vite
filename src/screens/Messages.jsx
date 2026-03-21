import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import NavBar from '../components/NavBar.jsx';

function Messages({ setScreen, setSelectedArtist, ClientTabBar }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState({});
  const [lastMessageMap, setLastMessageMap] = useState({});

  useEffect(() => {
    async function loadConversations() {
      try {
        const snapshot = await getDocs(collection(db, 'artists'));
        const artists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setConversations(artists);

        const user = auth.currentUser;
        if (!user) return;

        artists.forEach(artist => {
          const chatId = [user.uid, artist.id].sort().join('_');
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

          onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
              const lastMsg = snapshot.docs[0].data();
              setLastMessageMap(prev => ({ ...prev, [artist.id]: lastMsg }));

              const readRef = doc(db, 'readStatus', `${user.uid}_${chatId}`);
              const readSnap = await getDoc(readRef);

              if (!readSnap.exists()) {
                if (lastMsg.senderId !== user.uid) {
                  setUnreadMap(prev => ({ ...prev, [artist.id]: true }));
                }
              } else {
                const lastRead = readSnap.data().lastRead;
                if (lastMsg.createdAt > lastRead && lastMsg.senderId !== user.uid) {
                  setUnreadMap(prev => ({ ...prev, [artist.id]: true }));
                } else {
                  setUnreadMap(prev => ({ ...prev, [artist.id]: false }));
                }
              }
            }
          });
        });
      } catch (err) {
        console.error('Error loading conversations:', err);
      }
      setLoading(false);
    }
    loadConversations();
  }, []);

  async function handleConvoClick(artist) {
    const user = auth.currentUser;
    if (user) {
      const chatId = [user.uid, artist.id].sort().join('_');
      const readRef = doc(db, 'readStatus', `${user.uid}_${chatId}`);
      await setDoc(readRef, {
        lastRead: new Date().toISOString(),
        userId: user.uid,
        chatId,
      });
      setUnreadMap(prev => ({ ...prev, [artist.id]: false }));
    }
    if (setSelectedArtist) {
      setSelectedArtist({ ...artist, id: artist.id });
    }
    setScreen('chat');
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
      <NavBar rightButton={
        <button className="back-btn" onClick={() => setScreen('discover')}>← Back</button>
      } />

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
          {conversations.map(artist => {
            const isUnread = unreadMap[artist.id];
            const lastMessage = lastMessageMap[artist.id];
            return (
              <div key={artist.id} className="convo-item" onClick={() => handleConvoClick(artist)}>
                <div className="convo-avatar">
                  🎨
                  {isUnread && <div className="convo-dot"></div>}
                </div>
                <div className="convo-info">
                  <div className="convo-name" style={{
                    fontWeight: isUnread ? '700' : '500',
                    color: isUnread ? '#0a0a0a' : '#2c2c2c',
                  }}>
                    {artist.name}
                  </div>
                  <div className="convo-preview" style={{
                    fontWeight: isUnread ? '600' : '400',
                    color: isUnread ? '#0a0a0a' : '#8a8580',
                  }}>
                    {lastMessage ? lastMessage.text : artist.styles ? artist.styles.join(', ') : 'Tap to start a conversation'}
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
      {ClientTabBar && <ClientTabBar activeTab="messages" />}
    </div>
  );
}

export default Messages;