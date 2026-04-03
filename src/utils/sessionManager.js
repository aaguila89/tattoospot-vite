import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
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

  // Store session ID in localStorage instead of sessionStorage
  // so it persists across browser sessions on the same device
  localStorage.setItem(`sessionId_${userId}`, sessionId);

  return sessionId;
}

export function getLocalSessionId(userId) {
  // Check both localStorage (persistent) and sessionStorage (legacy)
  return localStorage.getItem(`sessionId_${userId}`) 
    || sessionStorage.getItem('sessionId');
}

export function clearLocalSession(userId) {
  if (userId) localStorage.removeItem(`sessionId_${userId}`);
  sessionStorage.removeItem('sessionId');
}