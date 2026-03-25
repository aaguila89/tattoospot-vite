// Helper functions to check plan status throughout the app

export function isPro(userData) {
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
  if (!userData?.trialEndsAt) return 0;
  const end = userData.trialEndsAt.toDate
    ? userData.trialEndsAt.toDate()
    : new Date(userData.trialEndsAt);
  return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
}

export const FREE_PHOTO_LIMIT = 10;
export const FREE_CATEGORY_LIMIT = 1;