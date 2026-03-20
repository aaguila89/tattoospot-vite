import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function Signup({ setScreen }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (name === '' || email === '' || password === '') {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      });
      if (role === 'client') {
        setScreen('client');
      } else {
        setScreen('artistSetup');
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        role,
        createdAt: new Date().toISOString(),
      });
      if (role === 'client') {
        setScreen('client');
      } else {
        setScreen('artistSetup');
      }
    } catch (err) {
      setError('Google sign up failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">

      <div className="auth-logo">
        Tattoo<span>Spot</span>
      </div>
      <p className="auth-tagline">WHERE ART MEETS SKIN</p>

      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">Join TattooSpot today</p>

        <div className="role-toggle">
          <button
            className={`role-toggle-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            🔍 Client
          </button>
          <button
            className={`role-toggle-btn ${role === 'artist' ? 'active' : ''}`}
            onClick={() => setRole('artist')}
          >
            🎨 Artist
          </button>
        </div>

        {error !== '' && (
          <div className="auth-error">{error}</div>
        )}

        <div className="form-group">
          <label className="form-label">FULL NAME</label>
          <input
            className="form-input"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">EMAIL</label>
          <input
            className="form-input"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">PASSWORD</label>
          <input
            className="form-input"
            type="password"
            placeholder="Create a password (6+ characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-terms">
          By signing up you agree to our{' '}
          <span>Terms of Service</span> and <span>Privacy Policy</span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account →'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-google"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <span>🔵</span> Continue with Google
        </button>

        <div className="auth-switch">
          Already have an account?{' '}
          <span onClick={() => setScreen('login')}>Sign In</span>
        </div>

      </div>
    </div>
  );
}

export default Signup;