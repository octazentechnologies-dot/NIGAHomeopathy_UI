/**
 * Persist open Patient Board sessions (orange header initials) across browser refresh.
 * Scoped per doctor so logins do not leak cases between accounts.
 */
const STORAGE_PREFIX = 'patientBoardSessions:v1:';

const readAuthUserId = () => {
  try {
    const raw = sessionStorage.getItem('authUser');
    if (!raw) return 'anon';
    const user = JSON.parse(raw);
    const id =
      user?.userId ??
      user?.UserId ??
      user?.data?.userId ??
      user?.data?.UserId ??
      user?.resultObject?.userId ??
      null;
    return id != null && String(id).trim() !== '' ? String(id) : 'anon';
  } catch {
    return 'anon';
  }
};

const storageKeyFor = (userId) => `${STORAGE_PREFIX}${userId || 'anon'}`;

export const loadPersistedPatientBoardSessions = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const key = storageKeyFor(readAuthUserId());
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
    return {
      sessions,
      activePatientKey: parsed.activePatientKey ?? sessions[0]?.patientKey ?? null,
    };
  } catch {
    return null;
  }
};

export const persistPatientBoardSessions = (state) => {
  if (typeof window === 'undefined' || !state) {
    return;
  }
  try {
    const key = storageKeyFor(readAuthUserId());
    const payload = {
      sessions: Array.isArray(state.sessions) ? state.sessions : [],
      activePatientKey: state.activePatientKey ?? null,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* quota / private mode — in-memory sessions still work for the current page life */
  }
};

export const clearPersistedPatientBoardSessions = () => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(storageKeyFor(readAuthUserId()));
  } catch {
    /* ignore */
  }
};
