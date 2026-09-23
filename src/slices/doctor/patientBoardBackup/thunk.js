import Swal from 'sweetalert2';
import {
  savePatientBoardBackup as savePatientBoardBackupApi,
  getPatientBoardBackupSummary as getPatientBoardBackupSummaryApi,
  getLatestPatientBoardBackup as getLatestPatientBoardBackupApi,
  deletePatientBoardBackup as deletePatientBoardBackupApi,
} from '../../../helpers/realbackend_helper';
import {
  buildMergedBackupPayload,
  extractApiResult,
  getBackupSessionsFromPayload,
  getBackupPayloadString,
  normalizeBackupSummary,
  assertBackupApiSuccess,
  getApiErrorMessage,
  sessionsHaveBackupWork,
} from '../../../helpers/patientBoardBackupHelper';
import { getSortedPatientSessions } from '../../../helpers/patientBoardSessionHelper';
import { UserRole } from '../../../Components/constants/roles';
import { resolveUserRole } from '../../../Components/constants/roles';
import { getAuthUserInfo } from '../../../helpers/dashboard_helper';
import { clearPatientBoardSession } from '../patientBoardSession/reducer';
import { logoutUserSuccess } from '../../auth/login/reducer';
import {
  setPatientBoardBackupSummaryLoading,
  setPatientBoardBackupSummary,
  setPatientBoardBackupSummaryError,
  setPatientBoardBackupSaveLoading,
  setPatientBoardBackupSaveError,
  clearPatientBoardBackupSummary,
  setPatientBoardBackupRestoreLoading,
  setPatientBoardBackupRestoreError,
  setPatientBoardBackupDeleteLoading,
  setPatientBoardBackupDeleteError,
  setPatientBoardBackupLatestDetail,
} from './reducer';
import { savePatientBoardSession } from '../patientBoardSession/reducer';

export const fetchPatientBoardBackupSummary = () => async (dispatch) => {
  try {
    dispatch(setPatientBoardBackupSummaryLoading(true));
    const response = await getPatientBoardBackupSummaryApi();
    const summary = normalizeBackupSummary(extractApiResult(response));
    dispatch(setPatientBoardBackupSummary(summary));
    return summary;
  } catch (error) {
    dispatch(setPatientBoardBackupSummaryError(error));
    return null;
  } finally {
    dispatch(setPatientBoardBackupSummaryLoading(false));
  }
};

export const savePatientBoardBackupFromSessions = (sessions = []) => async (dispatch, getState) => {
  try {
    dispatch(setPatientBoardBackupSaveLoading(true));

    let existingSessions = [];
    const state = getState();
    const cachedPayload = getBackupPayloadString(state?.PatientBoardBackup?.latestBackupDetail);

    if (cachedPayload) {
      existingSessions = getBackupSessionsFromPayload(cachedPayload);
    } else {
      const summary = normalizeBackupSummary(state?.PatientBoardBackup?.summary);
      if (summary?.hasBackup) {
        try {
          const latestResponse = await getLatestPatientBoardBackupApi();
          assertBackupApiSuccess(latestResponse, 'Unable to load existing backup.');
          const detail = extractApiResult(latestResponse);
          dispatch(setPatientBoardBackupLatestDetail(detail));
          existingSessions = getBackupSessionsFromPayload(getBackupPayloadString(detail));
        } catch {
          existingSessions = [];
        }
      }
    }

    const payload = buildMergedBackupPayload(existingSessions, sessions);

    if (!payload.sessions.length) {
      throw new Error('No patient work to save in backup.');
    }

    const response = await savePatientBoardBackupApi({
      backupPayload: JSON.stringify(payload),
      patientCount: payload.sessions.length,
      schemaVersion: payload.schemaVersion,
    });
    assertBackupApiSuccess(response, 'Unable to save patient board backup.');
    const result = extractApiResult(response);
    await dispatch(fetchPatientBoardBackupSummary());
    await dispatch(fetchLatestPatientBoardBackupDetail());
    return result;
  } catch (error) {
    dispatch(setPatientBoardBackupSaveError(error));
    throw error;
  } finally {
    dispatch(setPatientBoardBackupSaveLoading(false));
  }
};

export const fetchLatestPatientBoardBackupDetail = () => async (dispatch) => {
  try {
    dispatch(setPatientBoardBackupRestoreLoading(true));
    const response = await getLatestPatientBoardBackupApi();
    const detail = extractApiResult(response);
    dispatch(setPatientBoardBackupLatestDetail(detail));
    return detail;
  } catch (error) {
    dispatch(setPatientBoardBackupRestoreError(error));
    return null;
  } finally {
    dispatch(setPatientBoardBackupRestoreLoading(false));
  }
};

export const restorePatientBoardBackupSessions = () => async (dispatch, getState) => {
  try {
    dispatch(setPatientBoardBackupRestoreLoading(true));
    const detail = await dispatch(fetchLatestPatientBoardBackupDetail());
    const backupSessions = getBackupSessionsFromPayload(getBackupPayloadString(detail));
    if (!backupSessions.length) {
      throw new Error('No patient sessions found in backup.');
    }

    const currentSessions = getState()?.PatientBoardSession?.sessions ?? [];
    if (currentSessions.length > 0) {
      const mergeConfirm = await Swal.fire({
        icon: 'warning',
        title: 'Replace active patient work?',
        text: 'Restoring backup will replace your current in-progress patient sessions.',
        showCancelButton: true,
        confirmButtonText: 'Replace & Restore',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#000000',
      });
      if (!mergeConfirm.isConfirmed) {
        return false;
      }
      dispatch(clearPatientBoardSession());
    }

    backupSessions.forEach((session) => {
      dispatch(savePatientBoardSession(session));
    });

    return true;
  } catch (error) {
    dispatch(setPatientBoardBackupRestoreError(error));
    throw error;
  } finally {
    dispatch(setPatientBoardBackupRestoreLoading(false));
  }
};

export const restoreSinglePatientBoardBackupSession = (session) => async (dispatch, getState) => {
  if (!session?.patientKey) {
    return false;
  }

  const currentSessions = getState()?.PatientBoardSession?.sessions ?? [];
  if (
    currentSessions.length >= 5
    && !currentSessions.some((item) => item.patientKey === session.patientKey)
  ) {
    await Swal.fire({
      icon: 'info',
      title: 'Active patient limit reached',
      text: 'Please complete a patient prescription or remove an active session before restoring another patient.',
      confirmButtonColor: '#000000',
    });
    return false;
  }

  dispatch(savePatientBoardSession(session));
  return true;
};

export const deletePatientBoardBackup = () => async (dispatch) => {
  try {
    dispatch(setPatientBoardBackupDeleteLoading(true));
    const response = await deletePatientBoardBackupApi();
    assertBackupApiSuccess(response, 'Unable to delete backup.');
    dispatch(clearPatientBoardBackupSummary());
    return true;
  } catch (error) {
    dispatch(setPatientBoardBackupDeleteError(error));
    throw error;
  } finally {
    dispatch(setPatientBoardBackupDeleteLoading(false));
  }
};

const shouldOfferBackupOnLogout = (role, sessions = []) => {
  const normalizedRole = resolveUserRole(role) ?? role;
  if (normalizedRole !== UserRole.DOCTOR && normalizedRole !== UserRole.RECEPTION) {
    return false;
  }
  return sessionsHaveBackupWork(sessions);
};

export const logoutWithBackupPrompt = () => async (dispatch, getState) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const state = getState();
  const authUser = getAuthUserInfo();
  const role = authUser?.role;
  const sessions = state?.PatientBoardSession?.sessions ?? [];
  const patientNames = getSortedPatientSessions(sessions)
    .map((session) => session.patientName)
    .filter(Boolean);

  if (shouldOfferBackupOnLogout(role, sessions)) {
    const patientList = patientNames
      .map((name) => `<li style="margin-bottom:4px;">${name}</li>`)
      .join('');

    const result = await Swal.fire({
      icon: 'question',
      title: 'Save your ongoing work?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.5;">
          <p style="margin-bottom:12px;">
            You have in-progress work for <strong>${patientNames.length}</strong> patient(s).
            Would you like to save a backup before logout?
          </p>
          <ul style="margin:0;padding-left:18px;">${patientList}</ul>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save & Logout',
      cancelButtonText: 'Logout without saving',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#6c757d',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(savePatientBoardBackupFromSessions(sessions));
        await Swal.fire({
          icon: 'success',
          title: 'Backup saved',
          text: 'Your ongoing patient work was saved successfully.',
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        const errorMessage = getApiErrorMessage(error, 'Unable to save your backup.');
        const retry = await Swal.fire({
          icon: 'error',
          title: 'Backup failed',
          text: `${errorMessage} Logout anyway?`,
          showCancelButton: true,
          confirmButtonText: 'Logout anyway',
          cancelButtonText: 'Stay logged in',
          confirmButtonColor: '#000000',
        });
        if (!retry.isConfirmed) {
          return false;
        }
      }
    }
  }

  dispatch(clearPatientBoardSession());
  dispatch(clearPatientBoardBackupSummary());
  sessionStorage.removeItem('authUser');
  dispatch(logoutUserSuccess(true));
  return true;
};
