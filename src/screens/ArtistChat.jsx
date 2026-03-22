import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function ArtistChat({ setScreen, client }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && client?.id) {
        const id = [user.uid, client.id].sort().join('_');
        console.log('Artist uid:', user.uid);
        console.log('Client id:', client.id);
        console.log('Artist Chat ID:', id);
        setCurrentUserId(user.uid);
        setChatId(id);

        try {
          const readRef = doc(db, 'readStatus', `${user.uid}_${id}`);
          await setDoc(readRef, {
            lastRead: new Date().toISOString(),
            userId: user.uid,
            chatId: id,
          });
        } catch (err) {
          console.error('Error marking as read:', err);
        }
      } else if (!client?.id) {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [client?.id]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    }, (err) => {
      console.error('Snapshot error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async function sendMessage() {
    if (input.trim() === '' || !chatId || !currentUserId) return;
    const text = input;
    setInput('');
    try {
      await addDoc(
        collection(db, 'chats', chatId, 'messages'),
        {
          text,
          senderId: currentUserId,
          senderName: auth.currentUser?.displayName,
          createdAt: new Date().toISOString(),
        }
      );
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
  }

  if (!client?.id && !loading) {
    return (
      <div className="page">
        <div className="nav">
          <button className="back-btn" onClick={() => setScreen('artistMessages')}>← Back</button>
          <div className="nav-logo">Tattoo<span>Spot</span></div>
          <div style={{ width: '60px' }}></div>
        </div>
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-icon">💬</div>
          <p>No conversation selected.<br />Go back and select a client.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px', width: 'auto', padding: '12px 24px' }}
            onClick={() => setScreen('artistMessages')}
          >
            ← Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wrap">

      <div className="chat-header">
        <button className="back-btn" onClick={() => setScreen('artistMessages')}>←</button>
        <div className="chat-avatar">👤</div>
        <div className="chat-info">
          <div className="chat-name">{client?.name || 'Client'}</div>
          <div className="chat-status">● Online</div>
        </div>
      </div>

      <div className="chat-messages">
        {loading && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No messages yet.<br />Start the conversation!</p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`msg ${msg.senderId === currentUserId ? 'me' : 'them'}`}
          >
            <div className="msg-bubble">{msg.text}</div>
            <div className="msg-time">
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <button className="chat-attach-btn">📎</button>
        <input
          className="chat-input"
          type="text"
          placeholder="Reply to client..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="chat-send-btn" onClick={sendMessage}>↑</button>
      </div>

    </div>
  );
}

export default ArtistChat;