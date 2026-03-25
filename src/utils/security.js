import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function recordFailedAttempt(email) {
  const ref = doc(db, 'loginAttempts', email.toLowerCase());
  const snap = await getDoc(ref);
  const now = new Date();

  if (snap.exists()) {
    const data = snap.data();
    const lockedUntil = data.lockedUntil?.toDate();

    if (lockedUntil && now > lockedUntil) {
      await setDoc(ref, { attempts: 1, lockedUntil: null, lastAttempt: Timestamp.now() });
      return { locked: false, attempts: 1 };
    }

    const attempts = (data.attempts || 0) + 1;

    if (attempts >= MAX_ATTEMPTS) {
      const lockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      await updateDoc(ref, {
        attempts,
        lockedUntil: Timestamp.fromDate(lockUntil),
        lastAttempt: Timestamp.now(),
      });
      return { locked: true, lockedUntil: lockUntil, attempts };
    }

    await updateDoc(ref, { attempts, lastAttempt: Timestamp.now() });
    return { locked: false, attempts, remaining: MAX_ATTEMPTS - attempts };
  } else {
    await setDoc(ref, { attempts: 1, lockedUntil: null, lastAttempt: Timestamp.now() });
    return { locked: false, attempts: 1, remaining: MAX_ATTEMPTS - 1 };
  }
}

export async function checkLockout(email) {
  const ref = doc(db, 'loginAttempts', email.toLowerCase());
  const snap = await getDoc(ref);
  if (!snap.exists()) return { locked: false };

  const data = snap.data();
  const lockedUntil = data.lockedUntil?.toDate();
  const now = new Date();

  if (lockedUntil && now < lockedUntil) {
    const minutesLeft = Math.ceil((lockedUntil - now) / 60000);
    return { locked: true, lockedUntil, minutesLeft };
  }

  return { locked: false };
}

export async function clearLoginAttempts(email) {
  const ref = doc(db, 'loginAttempts', email.toLowerCase());
  await setDoc(ref, { attempts: 0, lockedUntil: null, lastAttempt: null });
}

export function generateTwoFactorCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveTwoFactorCode(userId, code) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await setDoc(doc(db, 'twoFactorCodes', userId), {
    code,
    expiresAt: Timestamp.fromDate(expiresAt),
    verified: false,
  });
}

export async function verifyTwoFactorCode(userId, inputCode) {
  const snap = await getDoc(doc(db, 'twoFactorCodes', userId));
  if (!snap.exists()) return { valid: false, reason: 'No code found' };

  const data = snap.data();
  const expiresAt = data.expiresAt?.toDate();

  if (new Date() > expiresAt) return { valid: false, reason: 'Code expired' };
  if (data.code !== inputCode) return { valid: false, reason: 'Incorrect code' };

  await updateDoc(doc(db, 'twoFactorCodes', userId), { verified: true });
  return { valid: true };
}