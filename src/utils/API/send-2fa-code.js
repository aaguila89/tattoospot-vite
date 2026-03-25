import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerSession(userId) {
  const sessionId = generateSessionId();
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };

  await setDoc(doc(db, 'sessions', userId), {
    sessionId,
    deviceInfo,
    loggedInAt: Timestamp.now(),
  });

  sessionStorage.setItem('sessionId', sessionId);
  return sessionId;
}

export function getLocalSessionId() {
  return sessionStorage.getItem('sessionId');
}

export function clearLocalSession() {
  sessionStorage.removeItem('sessionId');
}