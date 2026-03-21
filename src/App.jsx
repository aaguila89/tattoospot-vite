import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Discover from './screens/Discover.jsx';
import Profile from './screens/Profile.jsx';
import Booking from './screens/Booking.jsx';
import Confirmation from './screens/Confirmation.jsx';
import Messages from './screens/Messages.jsx';
import Chat from './screens/Chat.jsx';
import ArtistDashboard from './screens/ArtistDashboard.jsx';
import ArtistPortfolio from './screens/ArtistPortfolio.jsx';
import ArtistSetup from './screens/ArtistSetup.jsx';
import ArtistMessages from './screens/ArtistMessages.jsx';
import ArtistChat from './screens/ArtistChat.jsx';
import ArtistBookings from './screens/ArtistBookings.jsx';
import Login from './screens/Login.jsx';
import Signup from './screens/Signup.jsx';

function App() {
  const [screen, setScreenState] = useState(
    sessionStorage.getItem('currentScreen') || 'splash'
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtistState] = useState(() => {
    const saved = sessionStorage.getItem('selectedArtist');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  function setScreen(newScreen) {
    sessionStorage.setItem('currentScreen', newScreen);
    setScreenState(newScreen);
  }

  function setSelectedArtist(artist) {
    setSelectedArtistState(artist);
    if (artist) {
      sessionStorage.setItem('selectedArtist', JSON.stringify(artist));
    } else {
      sessionStorage.removeItem('selectedArtist');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setSelectedArtistState(null);
        setSelectedClient(null);
        setUnreadMessages(0);
        setPendingBookings(0);
        sessionStorage.removeItem('currentScreen');
        sessionStorage.removeItem('selectedArtist');
        setScreenState('splash');
      } else {
        loadUnreadCounts(currentUser);
        const savedScreen = sessionStorage.getItem('currentScreen');
        if (!savedScreen || savedScreen === 'splash' || savedScreen === 'login') {
          getDoc(doc(db, 'users', currentUser.uid)).then(userDoc => {
            if (userDoc.exists() && userDoc.data().role === 'artist') {
              setScreen('dashboard');
            } else {
              setScreen('discover');
            }
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadUnreadCounts(currentUser) {
    try {
      const artistsSnap = await getDocs(collection(db, 'artists'));
      const artists = artistsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      let unreadCount = 0;
      artists.forEach(artist => {
        const chatId = [currentUser.uid, artist.id].sort().join('_');
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

        onSnapshot(q, async (snapshot) => {
          if (!snapshot.empty) {
            const lastMsg = snapshot.docs[0].data();
            if (lastMsg.senderId !== currentUser.uid) {
              const readRef = doc(db, 'readStatus', `${currentUser.uid}_${chatId}`);
              const readSnap = await getDoc(readRef);
              if (!readSnap.exists() || lastMsg.createdAt > readSnap.data().lastRead) {
                unreadCount++;
                setUnreadMessages(unreadCount);
              }
            }
          }
        });
      });

      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const pending = bookingsSnap.docs
        .map(d => d.data())
        .filter(b => b.clientId === currentUser.uid && b.status === 'accepted')
        .length;
      setPendingBookings(pending);

    } catch (err) {
      console.error('Error loading counts:', err);
    }
  }

  function handleSignOut() {
    setSelectedArtistState(null);
    setSelectedClient(null);
    setUnreadMessages(0);
    setPendingBookings(0);
    sessionStorage.removeItem('currentScreen');
    sessionStorage.removeItem('selectedArtist');
    signOut(auth);
    setScreenState('splash');
  }

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">Tattoo<span>Spot</span></div>
        <p className="splash-tagline">WHERE ART MEETS SKIN</p>
      </div>
    );
  }

  const ClientTabBar = ({ activeTab }) => (
    <div className="tab-bar">
      <button
        className={`tab-item ${activeTab === 'discover' ? 'active' : ''}`}
        onClick={() => setScreen('discover')}
      >
        <span className="tab-icon">🔍</span>
        <span className="tab-label">Discover</span>
      </button>
      <button
        className={`tab-item ${activeTab === 'messages' ? 'active' : ''}`}
        onClick={() => setScreen('messages')}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span className="tab-icon">💬</span>
          {unreadMessages > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              background: '#c84b2f',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}>
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </div>
          )}
        </div>
        <span className="tab-label">Messages</span>
      </button>
      <button
        className={`tab-item ${activeTab === 'bookings' ? 'active' : ''}`}
        onClick={() => setScreen('bookings')}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span className="tab-icon">📅</span>
          {pendingBookings > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-6px',
              background: '#c84b2f',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}>
              {pendingBookings > 9 ? '9+' : pendingBookings}
            </div>
          )}
        </div>
        <span className="tab-label">Bookings</span>
      </button>
      <button className="tab-item">
        <span className="tab-icon">👤</span>
        <span className="tab-label">Profile</span>
      </button>
    </div>
  );

  return (
    <div className="app">
      {screen === 'splash' && (
        <div className="splash">
          <div className="splash-logo">
            Tattoo<span>Spot</span>
          </div>
          <p className="splash-tagline">WHERE ART MEETS SKIN</p>
          <div className="splash-divider"></div>
          <p className="splash-desc">
            Find the perfect tattoo artist for your vision — or grow your client base as an artist.
          </p>
          <div className="role-cards">
            <div className="role-card" onClick={() => setScreen('login')}>
              <div className="role-icon">🔍</div>
              <div className="role-label">I'm a Client</div>
              <div className="role-sub">Find my perfect artist</div>
            </div>
            <div className="role-card" onClick={() => setScreen('login')}>
              <div className="role-icon">🎨</div>
              <div className="role-label">I'm an Artist</div>
              <div className="role-sub">Showcase my work</div>
            </div>
          </div>
          <div className="auth-switch" style={{ marginTop: '24px' }}>
            New to TattooSpot?{' '}
            <span
              style={{ color: '#d4a853', cursor: 'pointer' }}
              onClick={() => setScreen('signup')}
            >
              Create Account
            </span>
          </div>
          {user && (
            <div className="auth-switch" style={{ marginTop: '12px' }}>
              <span
                style={{ color: '#8a8580', cursor: 'pointer' }}
                onClick={handleSignOut}
              >
                Sign out
              </span>
            </div>
          )}
        </div>
      )}

      {screen === 'login' && <Login setScreen={setScreen} />}
      {screen === 'signup' && <Signup setScreen={setScreen} />}
      {screen === 'discover' && (
        <Discover
          setScreen={setScreen}
          setSelectedArtist={setSelectedArtist}
          ClientTabBar={ClientTabBar}
        />
      )}
      {screen === 'client' && (
        <Discover
          setScreen={setScreen}
          setSelectedArtist={setSelectedArtist}
          ClientTabBar={ClientTabBar}
        />
      )}
      {screen === 'profile' && (
        <Profile
          setScreen={setScreen}
          artist={selectedArtist}
        />
      )}
      {screen === 'booking' && (
        <Booking
          setScreen={setScreen}
          artistId={selectedArtist?.id}
          artistName={selectedArtist?.name}
          artist={selectedArtist}
        />
      )}
      {screen === 'confirmation' && <Confirmation setScreen={setScreen} />}
      {screen === 'messages' && (
        <Messages
          setScreen={setScreen}
          setSelectedArtist={setSelectedArtist}
          ClientTabBar={ClientTabBar}
        />
      )}
      {screen === 'chat' && (
        <Chat
          setScreen={setScreen}
          artistId={selectedArtist?.id}
          artistName={selectedArtist?.name}
          artist={selectedArtist}
          onMessageRead={() => setUnreadMessages(prev => Math.max(0, prev - 1))}
        />
      )}
      {screen === 'dashboard' && (
        <ArtistDashboard
          setScreen={setScreen}
          handleSignOut={handleSignOut}
        />
      )}
      {screen === 'artist' && (
        <ArtistDashboard
          setScreen={setScreen}
          handleSignOut={handleSignOut}
        />
      )}
      {screen === 'artistPortfolio' && <ArtistPortfolio setScreen={setScreen} />}
      {screen === 'artistSetup' && <ArtistSetup setScreen={setScreen} />}
      {screen === 'artistMessages' && (
        <ArtistMessages
          setScreen={setScreen}
          setSelectedClient={setSelectedClient}
        />
      )}
      {screen === 'artistChat' && (
        <ArtistChat
          setScreen={setScreen}
          client={selectedClient}
        />
      )}
      {screen === 'artistBookings' && (
        <ArtistBookings setScreen={setScreen} />
      )}
    </div>
  );
}

export default App;