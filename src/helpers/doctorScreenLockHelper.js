const LOCK_FLAG_KEY = 'homeocentrum:doctor-screen-locked';

export const isDoctorScreenLocked = () => {
  try {
    return sessionStorage.getItem(LOCK_FLAG_KEY) === '1';
  } catch {
    return false;
  }
};

export const setDoctorScreenLocked = (locked) => {
  try {
    if (locked) {
      sessionStorage.setItem(LOCK_FLAG_KEY, '1');
    } else {
      sessionStorage.removeItem(LOCK_FLAG_KEY);
    }
  } catch {
    /* ignore */
  }
};

export const clearDoctorScreenLocked = () => setDoctorScreenLocked(false);
