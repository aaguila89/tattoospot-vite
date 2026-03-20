import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Login({ setScreen }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function redirectByRole(user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === 'artist') {
          setScreen('dashboard');
        } else {
          setScreen('discover');
        }
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'User',
          email: user.email,
          role: 'client',
          createdAt: new Date().toISOString(),
        });
        setScreen('discover');
      }
    } catch (err) {
      console.error('Error getting role:', err);
      setScreen('discover');
    }
  }

  async function handleLogin() {
    if (email === '' || password === '') {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await redirectByRole(result.user);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await redirectByRole(result.user);
    } catch (err) {
      setError('Google sign in failed. Please try again.');
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
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {error !== '' && (
          <div className="auth-error">{error}</div>
        )}

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
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-forgot">
          Forgot password?
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span>🔵</span> Continue with Google
        </button>

        <div className="auth-switch">
          Don't have an account?{' '}
          <span onClick={() => setScreen('signup')}>Sign Up</span>
        </div>

      </div>
    </div>
  );
}

export default Login;