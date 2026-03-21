import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const styleFilters = [
  'All Styles', 'Japanese', 'Blackwork', 'Realism',
  'Neo-Trad', 'Fine Line', 'Watercolor', 'Geometric'
];

function Discover({ setScreen, setSelectedArtist, ClientTabBar }) {
  const [activeFilter, setActiveFilter] = useState('All Styles');
  const [search, setSearch] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtists() {
      try {
        const snapshot = await getDocs(collection(db, 'artists'));
        const realArtists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          match: Math.floor(Math.random() * 30) + 70,
          emoji: '🎨',
          bg: '#1a1a2e',
          available: doc.data().available || true,
        }));
        setArtists(realArtists);
      } catch (err) {
        console.error('Error loading artists:', err);
      }
      setLoading(false);
    }
    loadArtists();
  }, []);

  const filtered = artists.filter(artist => {
    const matchesFilter = activeFilter === 'All Styles' ||
      (artist.styles && artist.styles.some(s =>
        s.toLowerCase().includes(activeFilter.toLowerCase())
      ));
    const matchesSearch = artist.name.toLowerCase().includes(search.toLowerCase()) ||
      (artist.styles && artist.styles.some(s =>
        s.toLowerCase().includes(search.toLowerCase())
      ));
    return matchesFilter && matchesSearch;
  });

  function handleArtistClick(artist) {
    if (setSelectedArtist) {
      setSelectedArtist({
        ...artist,
        id: artist.id,
      });
    }
    setScreen('profile');
  }

  return (
    <div className="page">
      <div className="nav">
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <button className="back-btn" onClick={() => setScreen('splash')}>← Exit</button>
      </div>

      <div className="content">
        <div className="section-header">
          <h2 className="page-title">Find Your Artist</h2>
          <p className="page-sub">
            {loading ? 'Loading artists...' : `${filtered.length} artists found`}
          </p>
        </div>

        <div className="search-bar">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search artists, styles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="style-chips">
          {styleFilters.map(filter => (
            <div
              key={filter}
              className={`chip ${activeFilter === filter ? 'selected' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading artists...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <p>No artists found yet.<br />Be the first to join TattooSpot!</p>
          </div>
        ) : (
          filtered.map(artist => (
            <div
              className="artist-card"
              key={artist.id}
              onClick={() => handleArtistClick(artist)}
            >
              <div className="artist-card-img" style={{ background: artist.bg }}>
                {artist.portfolioPhotos && artist.portfolioPhotos.length > 0 ? (
                  <img
                    src={artist.portfolioPhotos[0]}
                    alt={artist.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div className="mock-tattoo">{artist.emoji}</div>
                )}
                <div className="style-badge">
                  {artist.styles ? artist.styles[0] : 'Custom'}
                </div>
                {artist.available && (
                  <div className="avail-badge">Available</div>
                )}
              </div>
              <div className="artist-card-body">
                <div className="artist-name">{artist.name}</div>
                <div className="artist-location">📍 {artist.location}</div>
                <div className="artist-styles">
                  {artist.styles && artist.styles.map(s => (
                    <span className="artist-style-tag" key={s}>{s}</span>
                  ))}
                </div>
                <div className="artist-meta">
                  <div className="artist-rate">
                    From <strong>{artist.rate}</strong>
                  </div>
                  <div className="artist-rating">
                    ⭐ {artist.rating || 'New'}{' '}
                    {artist.reviews > 0 && (
                      <span className="review-count">({artist.reviews})</span>
                    )}
                  </div>
                </div>
                <div className="match-bar">
                  <div className="match-label">
                    <span>Style Match</span>
                    <strong>{artist.match}%</strong>
                  </div>
                  <div className="match-track">
                    <div
                      className="match-fill"
                      style={{ width: `${artist.match}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {ClientTabBar && <ClientTabBar activeTab="discover" />}
    </div>
  );
}

export default Discover;