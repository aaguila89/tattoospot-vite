import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function Signup({ setScreen }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSignup() {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
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
        plan: 'free',
        proActive: false,
        createdAt: new Date().toISOString(),
      });
      if (role === 'artist') {
        setScreen('planSelection');
      } else {
        setScreen('client');
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
        plan: 'free',
        proActive: false,
        createdAt: new Date().toISOString(),
      });
      if (role === 'artist') {
        setScreen('planSelection');
      } else {
        setScreen('client');
      }
    } catch (err) {
      setError('Google sign up failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Tattoo<span>Spot</span></div>
      <p className="auth-tagline">WHERE INK MEETS SKIN</p>

      <div className="auth-card">

        {/* ── STEP 1 — Role selection ── */}
        {step === 1 && (
          <div>
            <h2 className="auth-title">Who are you joining as?</h2>
            <p className="auth-sub" style={{ marginBottom: '24px' }}>Choose your account type</p>

            {/* Role cards */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <div
                onClick={() => setRole('client')}
                style={{
                  flex: 1,
                  background: role === 'client' ? '#0a0a0a' : '#111',
                  border: `2px solid ${role === 'client' ? '#c84b2f' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                <div style={{ color: role === 'client' ? 'white' : '#8a8580', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                  I'm a Client
                </div>
                <div style={{ color: role === 'client' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', fontSize: '11px', lineHeight: '1.4', marginBottom: '10px' }}>
                  Looking for a tattoo artist
                </div>
                <div style={{
                  background: role === 'client' ? '#c84b2f' : 'rgba(255,255,255,0.06)',
                  color: role === 'client' ? 'white' : '#8a8580',
                  borderRadius: '20px', padding: '3px 10px',
                  fontSize: '11px', fontWeight: '700', display: 'inline-block',
                }}>
                  {role === 'client' ? '✓ Selected' : 'Tap to select'}
                </div>
              </div>

              <div
                onClick={() => setRole('artist')}
                style={{
                  flex: 1,
                  background: role === 'artist' ? '#0a0a0a' : '#111',
                  border: `2px solid ${role === 'artist' ? '#c84b2f' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>💀</div>
                <div style={{ color: role === 'artist' ? 'white' : '#8a8580', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                  I'm an Artist
                </div>
                <div style={{ color: role === 'artist' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', fontSize: '11px', lineHeight: '1.4', marginBottom: '10px' }}>
                  Showcasing my work
                </div>
                <div style={{
                  background: role === 'artist' ? '#c84b2f' : 'rgba(255,255,255,0.06)',
                  color: role === 'artist' ? 'white' : '#8a8580',
                  borderRadius: '20px', padding: '3px 10px',
                  fontSize: '11px', fontWeight: '700', display: 'inline-block',
                }}>
                  {role === 'artist' ? '✓ Selected' : 'Tap to select'}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              style={{ marginBottom: '14px' }}
            >
              Next →
            </button>

            <div className="auth-switch">
              Already have an account?{' '}
              <span onClick={() => setScreen('login')}>Sign In</span>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Details ── */}
        {step === 2 && (
          <div>
            <h2 className="auth-title">Your Details</h2>
            <p className="auth-sub" style={{ marginBottom: '20px' }}>
              Signing up as a{' '}
              <span style={{ color: '#c84b2f', fontWeight: '700' }}>
                {role === 'artist' ? '💀 Artist' : '🔍 Client'}
              </span>
            </p>

            {error && <div className="auth-error">{error}</div>}

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

            <div className="form-group">
              <label className="form-label">CONFIRM PASSWORD</label>
              <input
                className="form-input"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  borderColor: passwordsMatch ? '#22c55e' : passwordsMismatch ? '#dc2626' : 'rgba(255,255,255,0.1)',
                }}
              />
              {passwordsMatch && (
                <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '5px' }}>✓ Passwords match</p>
              )}
              {passwordsMismatch && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>✗ Passwords do not match</p>
              )}
            </div>

            <div className="auth-terms">
              By signing up you agree to our{' '}
              <span>Terms of Service</span> and <span>Privacy Policy</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSignup}
              disabled={loading}
              style={{ marginBottom: '10px' }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

            <div className="auth-divider"><span>or</span></div>

            <button
              className="btn btn-google"
              onClick={handleGoogleSignup}
              disabled={loading}
              style={{ marginBottom: '14px' }}
            >
              <span>🔵</span> Continue with Google
            </button>

            <button
              onClick={() => setStep(1)}
              style={{
                background: 'none', border: 'none',
                color: '#8a8580', fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit',
                width: '100%', textAlign: 'center',
              }}
            >
              ← Back
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Signup;