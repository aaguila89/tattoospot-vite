import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProUpgrade({ setScreen }) {
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const user = auth.currentUser;
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setPlanInfo(snap.data());
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadPlan();
  }, []);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const user = auth.currentUser;
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          artistName: user.displayName,
        }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch (err) {
      console.error('Subscription error:', err);
    }
    setSubscribing(false);
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel your Pro subscription?')) return;
    try {
      const user = auth.currentUser;
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Subscription cancelled. You will keep Pro access until the end of your billing period.');
        setScreen('dashboard');
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  }

  function getTrialDaysLeft() {
    if (!planInfo?.trialEndsAt) return 0;
    const end = planInfo.trialEndsAt.toDate();
    const now = new Date();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  const isPro = planInfo?.plan === 'pro' || planInfo?.plan === 'pro_trial';
  const isTrial = planInfo?.plan === 'pro_trial';
  const trialDaysLeft = getTrialDaysLeft();

  if (loading) {
    return (
      <div className="page">
        <div className="nav">
          <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
          <div className="nav-logo">Tattoo<span>Spot</span></div>
          <div style={{ width: '60px' }} />
        </div>
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="nav">
        <button className="back-btn" onClick={() => setScreen('dashboard')}>← Back</button>
        <div className="nav-logo">Tattoo<span>Spot</span></div>
        <div style={{ width: '60px' }} />
      </div>

      <div className="content" style={{ paddingBottom: '40px' }}>

        {/* Current plan status */}
        {isPro && (
          <div style={{
            background: isTrial ? 'linear-gradient(135deg, #1a0a00, #2d1000)' : 'linear-gradient(135deg, #064e3b, #065f46)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              {isTrial ? '⏳' : '⭐'}
            </div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>
              {isTrial ? `Pro Trial — ${trialDaysLeft} days left` : 'You are on Pro ✓'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              {isTrial
                ? 'Subscribe before your trial ends to keep Pro features'
                : 'All Pro features are active on your account'}
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚡</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0a0a0a', marginBottom: '4px' }}>
            {isPro && !isTrial ? 'Manage your Pro plan' : 'Upgrade to Pro'}
          </div>
          <div style={{ fontSize: '14px', color: '#8a8580' }}>
            $19 / month · Cancel anytime
          </div>
        </div>

        {/* Features list */}
        <div className="info-card" style={{ marginBottom: '20px' }}>
          <h3 className="info-card-title">What you get with Pro</h3>
          {[
            { icon: '📸', text: 'Unlimited portfolio photos' },
            { icon: '🗂️', text: 'All style categories + custom categories' },
            { icon: '⭐', text: 'Featured at top of search results' },
            { icon: '📊', text: 'Profile analytics — views, clicks, bookings' },
            { icon: '🔗', text: 'Custom profile link (tattoospot.net/yourname)' },
            { icon: '✓', text: 'Verified badge on your profile' },
            { icon: '🎯', text: 'Priority support' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f5f0e8' }}>
              <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', color: '#2c2c2c' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{
          background: '#f5f0e8',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '13px', color: '#8a8580', marginBottom: '4px' }}>Monthly subscription</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#0a0a0a' }}>$19</div>
          <div style={{ fontSize: '13px', color: '#8a8580' }}>per month · billed monthly · cancel anytime</div>
        </div>

        {/* Action buttons */}
        {!isPro || isTrial ? (
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
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
              marginBottom: '10px',
            }}
          >
            {subscribing ? 'Redirecting to payment...' : isTrial ? `Subscribe Now — $19/mo` : 'Upgrade to Pro — $19/mo'}
          </button>
        ) : (
          <div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px' }}>✓ Pro subscription active</div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>Your next billing date renews automatically</div>
            </div>
            <button
              onClick={handleCancel}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#dc2626',
                border: '1.5px solid #fca5a5',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel subscription
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '12px', lineHeight: '1.5' }}>
          Secure payment via Stripe. Cancel anytime before your next billing date and you won't be charged.
        </p>

      </div>
    </div>
  );
}