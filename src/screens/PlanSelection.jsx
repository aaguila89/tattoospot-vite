import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

export default function PlanSelection({ setScreen }) {
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      await updateDoc(doc(db, 'users', user.uid), {
        plan: 'pro_trial',
        trialStarted: Timestamp.now(),
        trialEndsAt: Timestamp.fromDate(trialEnd),
        proActive: true,
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
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px 40px',
    }}>

      {/* Header */}
      <div style={{ paddingTop: '60px', textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '34px', fontWeight: '800', color: 'white', letterSpacing: '-1px' }}>
          Tattoo<span style={{ color: '#c84b2f' }}>Spot</span>
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: '6px', letterSpacing: '1px' }}>
          Where ink meets skin
        </div>
      </div>

      {/* Launch Special */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎉</div>
        <div style={{ color: 'white', fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>
          Launch Special!
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: '1.6' }}>
          Please enjoy these features as a thank you for your support
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(200,75,47,0.4)', marginBottom: '24px' }} />

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px', alignItems: 'center', textAlign: 'center' }}>
        {[
          'Unlimited portfolio photos',
          'All style categories + custom',
          'Featured in search results',
          'Profile analytics',
          'Custom profile link',
          'Verified ✓ badge',
          'Priority support',
        ].map(feature => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#d4a853', fontSize: '16px' }}>★</span>
            {feature}
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          width: '100%',
          background: '#c84b2f',
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
        {loading ? 'Setting up...' : 'Join TattooSpot →'}
      </button>

      {/* Fine print */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', margin: 0 }}>
        Free for the first 30 days! $12.99 monthly. Cancel anytime.
      </p>

    </div>
  );
}