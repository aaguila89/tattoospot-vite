import React, { useState } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { registerSession } from '../utils/sessionManager';
import { checkLockout, recordFailedAttempt, clearLoginAttempts } from '../utils/security';
import TwoFactorScreen from '../components/TwoFactorScreen.jsx';

function Login({ setScreen }) {
  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  async function redirectByRole(user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setScreen(userDoc.data().role === 'artist' ? 'dashboard' : 'discover');
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
      setScreen('discover');
    }
  }

  async function sendTwoFactorCode(userId, userEmail) {
    try {
      await fetch('/api/send-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });
    } catch (err) {
      console.error('Error sending 2FA code:', err);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setAttemptsRemaining(null);

    const lockout = await checkLockout(email);
    if (lockout.locked) {
      setLockoutMinutes(lockout.minutesLeft);
      setError(`Account temporarily locked. Try again in ${lockout.minutesLeft} minute${lockout.minutesLeft !== 1 ? 's' : ''}.`);
      setLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await clearLoginAttempts(email);
      await registerSession(result.user.uid);
      await sendTwoFactorCode(result.user.uid, result.user.email);
      setTwoFactorUserId(result.user.uid);
      setTwoFactorEmail(result.user.email);
      setShowTwoFactor(true);
    } catch (err) {
      const attemptResult = await recordFailedAttempt(email);
      if (attemptResult.locked) {
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        const remaining = attemptResult.remaining;
        if (remaining <= 2) {
          setAttemptsRemaining(remaining);
          setError(`Incorrect email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`);
        } else {
          setError('Incorrect email or password. Please try again.');
        }
      }
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await registerSession(result.user.uid);
      await redirectByRole(result.user);
    } catch (err) {
      setError('Google sign in failed. Please try again.');
    }
    setLoading(false);
  }

  async function handleTwoFactorSuccess() {
    setShowTwoFactor(false);
    await redirectByRole(auth.currentUser);
  }

  async function handleTwoFactorCancel() {
    setShowTwoFactor(false);
    await signOut(auth);
  }

  async function handlePasswordReset() {
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email address.');
      } else {
        setResetError('Something went wrong. Please try again.');
      }
    }
    setResetLoading(false);
  }

  if (showTwoFactor) {
    return (
      <TwoFactorScreen
        userId={twoFactorUserId}
        email={twoFactorEmail}
        onSuccess={handleTwoFactorSuccess}
        onCancel={handleTwoFactorCancel}
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">Tattoo<span>Spot</span></div>
      <p className="auth-tagline">WHERE INK MEETS SKIN</p>

      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-sub">Sign in to your account</p>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#1d4ed8',
          lineHeight: '1.5',
        }}>
          🔒 <strong>More secure:</strong> Use Google Sign-In for built-in 2-factor authentication
        </div>

        {error && <div className="auth-error">{error}</div>}

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
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          marginTop: '-8px',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#2c2c2c', fontWeight: '500' }}>
            <div
              onClick={() => {
                const newVal = !rememberMe;
                setRememberMe(newVal);
                if (!newVal) localStorage.removeItem('rememberedEmail');
              }}
              style={{
                width: '24px', height: '24px', borderRadius: '6px',
                border: `2px solid ${rememberMe ? '#c84b2f' : '#d0d0d0'}`,
                background: rememberMe ? '#c84b2f' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              }}
            >
              {rememberMe && <span style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>✓</span>}
            </div>
            Remember me
          </label>
          <span
            style={{ fontSize: '13px', color: '#c84b2f', cursor: 'pointer', fontWeight: '500' }}
            onClick={() => { setResetEmail(email); setShowResetModal(true); setResetSent(false); setResetError(''); }}
          >
            Forgot password?
          </span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading || lockoutMinutes > 0}
        >
          {loading ? 'Signing in...' : lockoutMinutes > 0 ? `Locked (${lockoutMinutes}m)` : 'Sign In →'}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn btn-google" onClick={handleGoogleLogin} disabled={loading}>
          <span>🔵</span> Continue with Google
        </button>

        <div className="auth-switch">
          Don't have an account?{' '}
          <span onClick={() => setScreen('signup')}>Sign Up</span>
        </div>
      </div>

      {showResetModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px 24px',
            maxWidth: '340px', width: '100%', textAlign: 'center',
          }}>
            {!resetSent ? (
              <>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>
                  Reset your password
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.6' }}>
                  Enter your email and we'll send you a reset link.
                </p>
                {resetError && (
                  <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px' }}>{resetError}</p>
                )}
                <input
                  className="form-input"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  style={{ marginBottom: '12px', textAlign: 'left' }}
                />
                <button
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  style={{
                    width: '100%', background: '#c84b2f', color: 'white',
                    border: 'none', borderRadius: '10px', padding: '14px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    fontFamily: 'inherit', marginBottom: '10px',
                  }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  onClick={() => setShowResetModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '13px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📧</div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>
                  Check your email
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.6' }}>
                  We sent a reset link to <strong>{resetEmail}</strong>. Check your inbox and follow the link.
                </p>
                <button
                  onClick={() => setShowResetModal(false)}
                  style={{
                    width: '100%', background: '#c84b2f', color: 'white',
                    border: 'none', borderRadius: '10px', padding: '14px',
                    fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;