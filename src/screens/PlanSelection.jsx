import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

export default function PlanSelection({ setScreen }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('trial');

  async function handleContinue() {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const isPro = selected === 'trial';
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      await updateDoc(doc(db, 'users', user.uid), {
        plan: isPro ? 'pro_trial' : 'free',
        trialStarted: isPro ? Timestamp.now() : null,
        trialEndsAt: isPro ? Timestamp.fromDate(trialEnd) : null,
        proActive: isPro,
      });

      setScreen('artistSetup');
    } catch (err) {
      console.error('Error saving plan:', err);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf9f7',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800' }}>
          Tattoo<span style={{ color: '#c84b2f' }}>Spot</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0a0a0a', marginBottom: '8px' }}>
          Choose your plan
        </div>
        <div style={{ fontSize: '14px', color: '#8a8580', lineHeight: '1.6' }}>
          Start free, upgrade anytime.<br />No surprises.
        </div>
      </div>

      {/* Trial banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00, #3d1500)',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '20px',
        textAlign: 'center',
        border: '1px solid #c84b2f60',
      }}>
        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎉</div>
        <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>
          Launch Special
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
          Pro is free for your first 30 days. No credit card needed.
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>

        {/* Pro Trial card */}
        <div
          onClick={() => setSelected('trial')}
          style={{
            background: selected === 'trial' ? 'linear-gradient(135deg, #1a0a00, #2d1000)' : 'white',
            border: `2px solid ${selected === 'trial' ? '#c84b2f' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
          }}
        >
          {/* Most popular badge */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#c84b2f',
            color: 'white',
            fontSize: '10px',
            fontWeight: '800',
            padding: '3px 12px',
            borderRadius: '20px',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}>
            ⭐ RECOMMENDED
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: selected === 'trial' ? 'white' : '#0a0a0a', marginBottom: '2px' }}>
                Pro — Free Trial
              </div>
              <div style={{ fontSize: '13px', color: selected === 'trial' ? 'rgba(255,255,255,0.6)' : '#8a8580' }}>
                30 days free, then $19/month
              </div>
            </div>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: `2px solid ${selected === 'trial' ? '#c84b2f' : '#e2e8f0'}`,
              background: selected === 'trial' ? '#c84b2f' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {selected === 'trial' && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Unlimited portfolio photos',
              'All style categories + custom',
              'Featured in search results',
              'Profile analytics',
              'Custom profile link',
              'Verified ✓ badge',
              'Priority support',
            ].map(feature => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: selected === 'trial' ? 'rgba(255,255,255,0.9)' : '#2c2c2c' }}>
                <span style={{ color: '#d4a853', fontSize: '12px' }}>★</span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Free card */}
        <div
          onClick={() => setSelected('free')}
          style={{
            background: 'white',
            border: `2px solid ${selected === 'free' ? '#c84b2f' : '#e2e8f0'}`,
            borderRadius: '16px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a0a0a', marginBottom: '2px' }}>
                Free
              </div>
              <div style={{ fontSize: '13px', color: '#8a8580' }}>
                Always free, upgrade anytime
              </div>
            </div>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: `2px solid ${selected === 'free' ? '#c84b2f' : '#e2e8f0'}`,
              background: selected === 'free' ? '#c84b2f' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {selected === 'free' && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { text: 'Basic profile', included: true },
              { text: '10 photos max', included: true },
              { text: '1 portfolio category', included: true },
              { text: 'Messaging & bookings', included: true },
              { text: 'Featured in search', included: false },
              { text: 'Analytics & insights', included: false },
              { text: 'Verified badge', included: false },
            ].map(feature => (
              <div key={feature.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2c2c2c' }}>
                <span style={{ color: feature.included ? '#22c55e' : '#94a3b8', fontSize: '12px' }}>
                  {feature.included ? '✓' : '✗'}
                </span>
                <span style={{ color: feature.included ? '#2c2c2c' : '#94a3b8' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #c84b2f, #d4a853)',
          color: 'white',
          border: 'none',
          borderRadius: '14px',
          padding: '16px',
          fontSize: '16px',
          fontWeight: '800',
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginBottom: '12px',
        }}
      >
        {loading ? 'Setting up...' : selected === 'trial' ? 'Start Free Trial →' : 'Continue with Free →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
        {selected === 'trial'
          ? 'No credit card required. Cancel anytime before your trial ends.'
          : 'You can upgrade to Pro anytime from your dashboard.'}
      </p>
    </div>
  );
}