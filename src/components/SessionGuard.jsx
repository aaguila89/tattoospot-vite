import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getLocalSessionId, registerSession, clearLocalSession } from '../utils/sessionManager';

export default function SessionGuard({ userId, onSignOut }) {
  const [showWarning, setShowWarning] = useState(false);
  const [suspiciousDevice, setSuspiciousDevice] = useState('');
  const ignoringRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(doc(db, 'sessions', userId), (snap) => {
      if (!snap.exists()) return;
      if (ignoringRef.current) return;

      const data = snap.data();
      const localSessionId = getLocalSessionId(userId);

      // Only show warning if we have a local session ID and it doesn't match
      // This prevents false triggers on first login
      if (localSessionId && data.sessionId !== localSessionId) {
        const device = data.deviceInfo?.userAgent || '';
        let deviceName = 'Unknown device';
        if (device.includes('iPhone')) deviceName = 'iPhone';
        else if (device.includes('Android')) deviceName = 'Android device';
        else if (device.includes('Mac')) deviceName = 'Mac computer';
        else if (device.includes('Windows')) deviceName = 'Windows computer';
        else if (device.includes('iPad')) deviceName = 'iPad';

        // Check if it's the same browser/device by comparing user agents
        const currentUserAgent = navigator.userAgent;
        if (data.deviceInfo?.userAgent === currentUserAgent) {
          // Same device — just update the local session silently
          localStorage.setItem(`sessionId_${userId}`, data.sessionId);
          return;
        }

        setSuspiciousDevice(deviceName);
        setShowWarning(true);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  async function handleItWasMe() {
    ignoringRef.current = true;
    setShowWarning(false);
    await registerSession(userId);
    setTimeout(() => {
      ignoringRef.current = false;
    }, 3000);
  }

  async function handleNotMe() {
    setShowWarning(false);
    clearLocalSession(userId);
    await signOut(auth);
    if (onSignOut) onSignOut();
  }

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '16px', padding: '28px 24px',
        maxWidth: '340px', width: '100%', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔐</div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px', color: 'white' }}>
          New sign-in detected
        </h2>
        <p style={{ fontSize: '14px', color: '#8a8580', lineHeight: '1.6', margin: '0 0 24px' }}>
          Your account was just signed into from a <strong style={{ color: 'white' }}>{suspiciousDevice}</strong>. Was this you?
        </p>
        <button
          onClick={handleItWasMe}
          style={{
            width: '100%', background: '#22c55e', color: 'white', border: 'none',
            borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px',
          }}
        >
          ✓ Yes, that was me
        </button>
        <button
          onClick={handleNotMe}
          style={{
            width: '100%', background: 'rgba(220,38,38,0.15)', color: '#dc2626', border: 'none',
            borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🚨 No, sign me out now
        </button>
        <p style={{ fontSize: '11px', color: '#8a8580', marginTop: '12px', marginBottom: 0 }}>
          If this wasn't you, we recommend changing your password.
        </p>
      </div>
    </div>
  );
}