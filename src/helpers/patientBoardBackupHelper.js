import {
  getSortedPatientSessions,
  hasPatientBoardWork,
} from './patientBoardSessionHelper';

export const BACKUP_SCHEMA_VERSION = 1;

export const buildBackupPayloadFromSessions = (sessions = []) => {
  const activeSessions = getSortedPatientSessions(sessions).filter(
    (session) => session?.snapshot && hasPatientBoardWork(session.snapshot)
  );

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    sessions: activeSessions,
  };
};

/**
 * Merge stored backup with current in-progress sessions.
 * Only patients with latest work in `currentSessions` are updated/replaced.
 * All other patients already in the backup are kept unchanged.
 */
export const mergeBackupSessionsWithCurrentWork = (
  existingSessions = [],
  currentSessions = [],
) => {
  const mergedByKey = new Map();

  getSortedPatientSessions(existingSessions).forEach((session) => {
    if (session?.patientKey) {
      mergedByKey.set(session.patientKey, session);
    }
  });

  getSortedPatientSessions(currentSessions).forEach((session) => {
    if (session?.patientKey && session?.snapshot && hasPatientBoardWork(session.snapshot)) {
      mergedByKey.set(session.patientKey, {
        ...session,
        updatedAt: session.updatedAt || new Date().toISOString(),
      });
    }
  });

  return getSortedPatientSessions(Array.from(mergedByKey.values()));
};

export const buildMergedBackupPayload = (existingSessions = [], currentSessions = []) => {
  const sessions = mergeBackupSessionsWithCurrentWork(existingSessions, currentSessions);

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    sessions,
  };
};

export const parseBackupPayload = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (typeof payload === 'object') {
    return payload;
  }

  return null;
};

export const getBackupSessionsFromPayload = (payload) => {
  const parsed = parseBackupPayload(payload);
  if (!parsed || !Array.isArray(parsed.sessions)) {
    return [];
  }
  return parsed.sessions;
};

export const getBackupPayloadString = (detail) => (
  detail?.backupPayload ?? detail?.BackupPayload ?? null
);

export const sessionsHaveBackupWork = (sessions = []) => (
  sessions.some((session) => hasPatientBoardWork(session?.snapshot))
);

export const extractApiResult = (response) => {
  const data = response?.data ?? response;
  if (data?.resultObject != null) {
    return data.resultObject;
  }
  if (data?.ResultObject != null) {
    return data.ResultObject;
  }
  return data;
};

export const getApiErrorMessage = (error, fallback = 'Request failed.') => {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return (
    error?.response?.data?.message
    ?? error?.response?.data?.Message
    ?? error?.message
    ?? fallback
  );
};

export const assertBackupApiSuccess = (response, fallback = 'Backup request failed.') => {
  const data = response?.data ?? response;
  const success = data?.success ?? data?.Success;
  if (success === false) {
    throw new Error(data?.message ?? data?.Message ?? fallback);
  }
  return data;
};

export const normalizeBackupSummary = (summary) => {
  if (!summary) {
    return { hasBackup: false };
  }

  return {
    hasBackup: Boolean(summary.hasBackup ?? summary.HasBackup),
    backupId: summary.backupId ?? summary.BackupId ?? null,
    patientCount: summary.patientCount ?? summary.PatientCount ?? 0,
    schemaVersion: summary.schemaVersion ?? summary.SchemaVersion ?? 1,
    savedAt: summary.savedAt ?? summary.SavedAt ?? null,
  };
};
