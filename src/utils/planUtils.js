// LAUNCH MODE — everything is free until we're ready to charge
// To enable paid tiers, change LAUNCH_MODE to false
export const LAUNCH_MODE = true;

export function isPro(userData) {
  // During launch everyone gets Pro features for free
  if (LAUNCH_MODE) return true;
  if (!userData) return false;
  if (userData.plan === 'pro') return true;
  if (userData.plan === 'pro_trial') {
    if (!userData.trialEndsAt) return false;
    const trialEnd = userData.trialEndsAt.toDate
      ? userData.trialEndsAt.toDate()
      : new Date(userData.trialEndsAt);
    return new Date() < trialEnd;
  }
  return false;
}

export function getTrialDaysLeft(userData) {
  if (LAUNCH_MODE) return 30;
  if (!userData?.trialEndsAt) return 0;
  const end = userData.trialEndsAt.toDate
    ? userData.trialEndsAt.toDate()
    : new Date(userData.trialEndsAt);
  return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
}

export const FREE_PHOTO_LIMIT = LAUNCH_MODE ? 999 : 10;
export const FREE_CATEGORY_LIMIT = LAUNCH_MODE ? 999 : 1;