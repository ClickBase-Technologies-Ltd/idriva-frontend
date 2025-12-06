// utils/events.ts
export const PROFILE_UPDATE_EVENT = 'profile-updated';

export const dispatchProfileUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT));
  }
};

export const listenToProfileUpdate = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    window.addEventListener(PROFILE_UPDATE_EVENT, callback);
    return () => window.removeEventListener(PROFILE_UPDATE_EVENT, callback);
  }
  return () => {};
};