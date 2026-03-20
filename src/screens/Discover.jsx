import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const styleFilters = [
  'All Styles', 'Japanese', 'Blackwork', 'Realism',
  'Neo-Trad', 'Fine Line', 'Watercolor', 'Geometric'
];

const placeholderArtists = [
  {
    id: 'placeholder-1',
    name: 'Kenji Mori',
    location: 'Brooklyn, NY',
    styles: ['Japanese', 'Neo-Traditional', 'Irezumi'],
    rate: '$180/hr',
    rating: 4.9,
    reviews: 147,
    match: 96,
    available: true,
    emoji: '🐉',
    bg: '#1a1a2e',
  },
  {
    id: 'placeholder-2',
    name: 'Sofia Reyes',
    location: 'Manhattan, NY',
    styles: ['Fine Line', 'Botanical', 'Minimalist'],
    rate: '$150/hr',
    rating: 4.8,
    reviews: 89,
    match: 88,
    available: true,
    emoji: '🌸',
    bg: '#0d1117',
  },
  {
    id: 'placeholder-3',
    name: 'Marcus Webb',
    location: 'Williamsburg, NY',
    styles: ['Blackwork', 'Geometric', 'Dark Art'],
    rate: '$200/hr',
    rating: 4.7,
    reviews: 203,
    match: 81,
    available: false,
    emoji: '💀',
    bg: '#1c1410',
  },
];

function Discover({ setScreen, setSelectedArtist }) {
  const [activeFilter, setActiveFilter] = useState('All Styles');
  const [search, setSearch] = useState('');
  const [artists, setArtists] = useState(placeholderArtists);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtists() {
      try {
        console.log('Loading artists for messages...');
        const snapshot = await getDocs(collection(db, 'artists'));
        console.log('Artists found:', snapshot.docs.length);
        const realArtists = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Artist data:', data);
          return {
            id: doc.id, // Always use Firestore document ID
            ...data,
            match: Math.floor(Math.random() * 30) + 70,
            emoji: '🎨',
            bg: '#1a1a2e',
            available: data.available || true,
          };
        });
        if (realArtists.length > 0) {
          setArtists([...realArtists, ...placeholderArtists]);
        }
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
    console.log('Artist clicked:', artist.name, 'doc id:', artist.id, 'uid:', artist.uid);
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
        ) : (
          filtered.map(artist => (
            <div
              className="artist-card"
              key={artist.id}
              onClick={() => handleArtistClick(artist)}
            >
              <div className="artist-card-img" style={{ background: artist.bg }}>
                <div className="mock-tattoo">{artist.emoji}</div>
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

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No artists found for that style yet.<br />Try a different filter!</p>
          </div>
        )}
      </div>

      <div className="tab-bar">
        <button className="tab-item active">
          <span className="tab-icon">🔍</span>
          <span className="tab-label">Discover</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('messages')}>
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

export default Discover;