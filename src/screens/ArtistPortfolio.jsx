import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const CLOUD_NAME = 'di6wcrd9j';
const UPLOAD_PRESET = 'TatooSpot';

const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ArtistPortfolio({ setScreen }) {
  const [styles, setStyles] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const docSnap = await getDoc(doc(db, 'artists', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStyles(data.styles || []);
          setAvailability(data.availability || ['Mon', 'Tue', 'Thu', 'Fri']);
          setPortfolioPhotos(data.portfolioPhotos || []);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function removeStyle(style) {
    setStyles(styles.filter(s => s !== style));
  }

  function toggleDay(day) {
    if (availability.includes(day)) {
      setAvailability(availability.filter(d => d !== day));
    } else {
      setAvailability([...availability, day]);
    }
  }

  async function saveChanges() {
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, 'artists', user.uid), {
        availability,
        styles,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving:', err);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `portfolios/${user.uid}`);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const downloadURL = response.secure_url;
          const newPhotos = [...portfolioPhotos, downloadURL];
          setPortfolioPhotos(newPhotos);

          await updateDoc(doc(db, 'artists', user.uid), {
            portfolioPhotos: newPhotos,
          });
        } else {
          console.error('Upload failed:', xhr.responseText);
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        console.error('Upload error');
        setUploading(false);
      });

      xhr.open(
        'POST',
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
      );
      xhr.send(formData);

    } catch (err) {
      console.error('Error uploading:', err);
      setUploading(false);
    }
  }

  async function removePhoto(photoUrl) {
    try {
      const user = auth.currentUser;
      const newPhotos = portfolioPhotos.filter(p => p !== photoUrl);
      setPortfolioPhotos(newPhotos);
      await updateDoc(doc(db, 'artists', user.uid), {
        portfolioPhotos: newPhotos,
      });
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="nav">
          <div className="nav-logo">Tattoo<span>Spot</span></div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">

      <div className="nav">
        <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div className="content">

        <div className="section-header">
          <h2 className="page-title">My Portfolio</h2>
          <p className="page-sub">Manage your work and styles</p>
        </div>

        {/* STYLE TAGS */}
        <div className="info-card">
          <h3 className="info-card-title">Style Tags</h3>
          <p className="info-card-text" style={{ marginBottom: '12px' }}>
            These tags help clients find you
          </p>
          <div>
            {styles.map(style => (
              <span
                key={style}
                className="tag-pill"
                style={{ cursor: 'pointer' }}
                onClick={() => removeStyle(style)}
              >
                {style} ✕
              </span>
            ))}
          </div>
        </div>

        {/* PORTFOLIO PHOTOS */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h3 className="page-title" style={{ fontSize: '16px' }}>
            Portfolio Photos
          </h3>
          <label
            style={{
              background: uploading ? '#8a8580' : '#c84b2f',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {uploading ? `Uploading ${uploadProgress}%` : '+ Upload Photo'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* UPLOAD PROGRESS BAR */}
        {uploading && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              height: '4px',
              background: '#f5f0e8',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: 'linear-gradient(90deg, #c84b2f, #d4a853)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#8a8580',
              marginTop: '4px',
              textAlign: 'center'
            }}>
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* PHOTO GRID */}
        {portfolioPhotos.length > 0 ? (
          <div className="portfolio-grid" style={{ marginBottom: '20px' }}>
            {portfolioPhotos.map((photo, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  overflow: 'hidden',
                  background: '#1a1a2e',
                }}
              >
                <img
                  src={photo}
                  alt={`Portfolio ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={() => removePhoto(photo)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ marginBottom: '20px' }}>
            <div className="empty-icon">🖼️</div>
            <p>No photos yet.<br />Upload your first portfolio photo!</p>
          </div>
        )}

        {/* AVAILABILITY */}
        <div className="info-card">
          <h3 className="info-card-title">Weekly Availability</h3>
          <p className="info-card-text" style={{ marginBottom: '12px' }}>
            Select the days you are available for bookings
          </p>
          <div className="style-chips">
            {allDays.map(day => (
              <div
                key={day}
                className={`chip ${availability.includes(day) ? 'selected' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </div>
            ))}
          </div>
          <button
            className={`btn ${saved ? 'btn-saved' : 'btn-secondary'}`}
            style={{ fontSize: '13px', padding: '10px' }}
            onClick={saveChanges}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* STATS */}
        <div className="info-card">
          <h3 className="info-card-title">Profile Stats</h3>
          <div className="booking-row">
            <span className="booking-row-label">Portfolio Photos</span>
            <span className="booking-row-val">{portfolioPhotos.length}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Style Tags</span>
            <span className="booking-row-val">{styles.length}</span>
          </div>
          <div className="booking-row">
            <span className="booking-row-label">Available Days</span>
            <span className="booking-row-val">{availability.length} days/week</span>
          </div>
        </div>

      </div>

      <div className="tab-bar">
        <button className="tab-item" onClick={() => setScreen('dashboard')}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Dashboard</span>
        </button>
        <button className="tab-item active">
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">Portfolio</span>
        </button>
        <button className="tab-item" onClick={() => setScreen('artistMessages')}>
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

export default ArtistPortfolio;