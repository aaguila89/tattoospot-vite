import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
import Login from './screens/Login.jsx';
import Signup from './screens/Signup.jsx';

function App() {
  const [screen, setScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        setSelectedArtist(null);
        setSelectedClient(null);
      }
    });
    return () => unsubscribe();
  }, []);

  function handleSignOut() {
    setSelectedArtist(null);
    setSelectedClient(null);
    signOut(auth);
    setScreen('splash');
  }

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">Tattoo<span>Spot</span></div>
        <p className="splash-tagline">WHERE ART MEETS SKIN</p>
      </div>
    );
  }

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
        />
      )}
      {screen === 'client' && (
        <Discover
          setScreen={setScreen}
          setSelectedArtist={setSelectedArtist}
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
        />
      )}
      {screen === 'confirmation' && <Confirmation setScreen={setScreen} />}
      {screen === 'messages' && (
        <Messages
          setScreen={setScreen}
          setSelectedArtist={setSelectedArtist}
        />
      )}
      {screen === 'chat' && (
        <Chat
          setScreen={setScreen}
          artistId={selectedArtist?.id}
          artistName={selectedArtist?.name}
          artist={selectedArtist}
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
    </div>
  );
}

export default App;