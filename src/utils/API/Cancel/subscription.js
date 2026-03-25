import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};
    const subscriptionId = userData.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end so they keep access until billing date
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await db.collection('users').doc(userId).update({
      planCancelledAt: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('cancel-subscription error:', err);
    return res.status(500).json({ error: err.message });
  }
}