import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  applyPatientBoardSnapshot,
  buildPatientBoardKey,
  buildPatientBoardResumePath,
  collectPatientBoardSnapshot,
  findPatientSession,
} from '../helpers/patientBoardSessionHelper';
import {
  savePatientBoardSession,
} from '../slices/doctor/patientBoardSession/reducer';

const SAVE_DEBOUNCE_MS = 500;

const usePatientBoardSessionPersistence = ({
  patientId,
  caseId,
  patientAppId,
  appointmentDate,
  patientName,
  getState,
  setters,
  afterRestoreRef,
  watchSignature,
  isRestoringRef,
  skipPersistRef,
  dispatch,
}) => {
  const storedSessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
  const storedSessionsRef = useRef(storedSessions);
  storedSessionsRef.current = storedSessions;

  const hasHydratedRef = useRef(false);
  const saveTimerRef = useRef(null);
  const patientKey = buildPatientBoardKey({ patientId, caseId, patientAppId });

  const getStateRef = useRef(getState);
  getStateRef.current = getState;

  const identityRef = useRef({});
  identityRef.current = {
    patientKey,
    patientId,
    caseId,
    patientAppId,
    appointmentDate,
    patientName,
  };

  const persistSessionForIdentity = useCallback((identity, { force = false } = {}) => {
    if (!identity?.patientKey) {
      return;
    }
    if (!force && (!hasHydratedRef.current || isRestoringRef?.current || skipPersistRef?.current)) {
      return;
    }

    const existingSession = findPatientSession(storedSessionsRef.current, identity.patientKey);
    const snapshot = collectPatientBoardSnapshot(getStateRef.current());
    const resumePath = buildPatientBoardResumePath({
      patientId: identity.patientId,
      caseId: identity.caseId,
      patientAppId: identity.patientAppId,
      appointmentDate: identity.appointmentDate,
      patientName: identity.patientName || existingSession?.patientName || '',
    });

    dispatch(
      savePatientBoardSession({
        patientKey: identity.patientKey,
        patientName: identity.patientName || existingSession?.patientName || '',
        resumePath,
        snapshot,
      })
    );
  }, [dispatch, isRestoringRef, skipPersistRef]);

  useEffect(() => {
    if (!patientKey) {
      hasHydratedRef.current = true;
      return undefined;
    }

    hasHydratedRef.current = false;
    if (isRestoringRef) {
      isRestoringRef.current = false;
    }

    const storedSession = findPatientSession(storedSessionsRef.current, patientKey);
    const storedSnapshot = storedSession?.snapshot;

    if (storedSnapshot) {
      if (isRestoringRef) {
        isRestoringRef.current = true;
      }
      applyPatientBoardSnapshot(storedSnapshot, setters);

      const runAfterRestore = async () => {
        try {
          if (afterRestoreRef?.current) {
            await afterRestoreRef.current(storedSnapshot);
          }
        } finally {
          if (isRestoringRef) {
            isRestoringRef.current = false;
          }
          hasHydratedRef.current = true;
        }
      };

      runAfterRestore();
    } else {
      hasHydratedRef.current = true;
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (skipPersistRef?.current) {
        return;
      }

      persistSessionForIdentity(identityRef.current, { force: true });
    };
  }, [patientKey, afterRestoreRef, isRestoringRef, persistSessionForIdentity, setters, skipPersistRef]);

  useEffect(() => {
    if (!patientKey || !hasHydratedRef.current || isRestoringRef?.current || skipPersistRef?.current) {
      return undefined;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistSessionForIdentity(identityRef.current);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    patientKey,
    watchSignature,
    patientName,
    persistSessionForIdentity,
    isRestoringRef,
    skipPersistRef,
  ]);

  return { isRestoringRef, patientKey };
};

export default usePatientBoardSessionPersistence;
