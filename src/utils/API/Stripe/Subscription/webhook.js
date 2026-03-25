import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

const db = getFirestore();

export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody, sig, process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {

    // Payment succeeded — activate Pro
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode !== 'subscription') break;
      const userId = session.metadata?.userId;
      if (!userId) break;

      await db.collection('users').doc(userId).update({
        plan: 'pro',
        proActive: true,
        stripeSubscriptionId: session.subscription,
        subscribedAt: Timestamp.now(),
        trialEndsAt: null,
      });
      break;
    }

    // Subscription renewed successfully
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const usersSnap = await db.collection('users')
        .where('stripeCustomerId', '==', customerId).get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.update({
          plan: 'pro',
          proActive: true,
          lastPaymentAt: Timestamp.now(),
        });
      }
      break;
    }

    // Payment failed — downgrade to free
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const usersSnap = await db.collection('users')
        .where('stripeCustomerId', '==', customerId).get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.update({
          plan: 'free',
          proActive: false,
        });
      }
      break;
    }

    // Subscription cancelled
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const usersSnap = await db.collection('users')
        .where('stripeCustomerId', '==', customerId).get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.update({
          plan: 'free',
          proActive: false,
          stripeSubscriptionId: null,
        });
      }
      break;
    }
  }

  return res.json({ received: true });
}