import React, { useState, useEffect, useRef } from 'react';
import { verifyTwoFactorCode } from '../utils/security';

export default function TwoFactorScreen({ userId, email, onSuccess, onCancel }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  function maskEmail(email) {
    if (!email) return '';
    const [user, domain] = email.split('@');
    return user.slice(0, 2) + '***@' + domain;
  }

  function handleDigitChange(index, value) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every(d => d !== '') && value) handleVerify(newCode.join(''));
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      handleVerify(pasted);
    }
  }

  async function handleVerify(codeString) {
    const finalCode = codeString || code.join('');
    if (finalCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await verifyTwoFactorCode(userId, finalCode);
      if (result.valid) {
        onSuccess();
      } else if (result.reason === 'Code expired') {
        setError('This code has expired. Please request a new one.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError('Incorrect code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  async function handleResend() {
    setResending(true);
    setError('');
    setResendSuccess(false);
    try {
      const res = await fetch('/api/send-2fa-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      if (res.ok) {
        setResendSuccess(true);
        setResendCountdown(30);
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
    setResending(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#faf9f7',
    }}>
      <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>
        Tattoo<span style={{ color: '#c84b2f' }}>Spot</span>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px 24px',
        maxWidth: '360px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>

        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
          Verify your identity
        </h2>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0 0 28px' }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: '#0a0a0a' }}>{maskEmail(email)}</strong>
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                width: '44px',
                height: '52px',
                textAlign: 'center',
                fontSize: '22px',
                fontWeight: '700',
                border: `2px solid ${error ? '#fca5a5' : digit ? '#c84b2f' : '#e2e8f0'}`,
                borderRadius: '10px',
                outline: 'none',
                fontFamily: 'inherit',
                background: digit ? '#fff5f0' : 'white',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}

        {resendSuccess && (
          <p style={{ color: '#22c55e', fontSize: '13px', margin: '0 0 16px' }}>
            ✓ New code sent to your email
          </p>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={loading || code.some(d => d === '')}
          style={{
            width: '100%',
            background: code.every(d => d !== '') ? '#c84b2f' : '#e2e8f0',
            color: code.every(d => d !== '') ? 'white' : '#94a3b8',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '700',
            cursor: code.every(d => d !== '') ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            marginBottom: '16px',
          }}
        >
          {loading ? 'Verifying...' : 'Verify →'}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCountdown > 0 || resending}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            color: resendCountdown > 0 ? '#94a3b8' : '#c84b2f',
            cursor: resendCountdown > 0 ? 'default' : 'pointer',
            fontFamily: 'inherit',
            marginBottom: '16px',
            display: 'block',
            width: '100%',
          }}
        >
          {resending ? 'Sending...' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
        </button>

        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '13px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancel and sign out
        </button>
      </div>
    </div>
  );
}