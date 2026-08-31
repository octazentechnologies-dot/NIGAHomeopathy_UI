import {
  uploadAudioCaseTaking as uploadAudioCaseTakingApi,
  getAudioCaseTakingStatus as getAudioCaseTakingStatusApi,
  getAudioCaseTakingResult as getAudioCaseTakingResultApi,
  reAnalyzeAudioCaseTaking as reAnalyzeAudioCaseTakingApi,
  logAudioCaseDoctorAction as logAudioCaseDoctorActionApi,
  getLatestAudioCaseSession as getLatestAudioCaseSessionApi,
  getAudioCaseTakingSessions as getAudioCaseTakingSessionsApi,
  getAudioCaseConcepts as getAudioCaseConceptsApi,
  submitAudioCaseRubricFeedback as submitAudioCaseRubricFeedbackApi,
} from '../../../helpers/realbackend_helper';
import { enqueueOfflineAudioUpload } from '../../../helpers/audioCaseOfflineQueueHelper';
import {
  setAudioCaseUploadLoading,
  setAudioCasePollLoading,
  setAudioCaseSessionMeta,
  setAudioCaseStatus,
  setAudioCaseAnalysisResult,
  setAudioCaseError,
  setAudioCaseReAnalyzeLoading,
  setAudioCaseTranscript,
  setAudioCaseConceptsLoading,
  setAudioCaseConcepts,
  setAudioCaseConceptsError,
  dismissPendingPreviousSession,
  setPendingPreviousSession,
  setPendingPreviousSessionLoading,
  resetAudioCaseTaking,
  startNewAudioCaseSession,
  setAudioCaseSessionHistoryLoading,
  setAudioCaseSessionHistory,
  setAudioCaseSessionHistoryError,
  setViewingHistorySessionId,
} from './reducer';

const POLL_INTERVAL_MS = 2500;
// UX requirement: don't block doctors waiting > ~8 minutes by default.
// 8 minutes / 2.5s ≈ 192 attempts.
const MAX_POLL_ATTEMPTS = 192;
const GRACE_POLL_ATTEMPTS = 0;

const AUDIO_CASE_TIMEOUT_MESSAGE =
  'Analysis is taking longer than expected (often due to long audio transcription). '
  + 'You can keep waiting or try Continue waiting. If this persists, check API logs.';

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const unwrapApiPayload = (response) => {
  const body = response?.data ?? response;
  if (body?.resultObject != null) {
    return body.resultObject;
  }
  return body?.data ?? body;
};

const getErrorMessage = (error, fallback) => {
  if (typeof error === 'string') {
    return error;
  }
  return error?.response?.data?.message
    ?? error?.message
    ?? fallback;
};

const assertApiSuccess = (response, fallbackMessage) => {
  const body = response?.data ?? response;
  if (body?.success === false) {
    throw new Error(body?.message || fallbackMessage);
  }
  return body;
};

const dispatchCompletedAnalysis = (dispatch, sessionId, resultPayload, elapsedSeconds = null) => {
  dispatch(setAudioCaseAnalysisResult({
    sessionId,
    transcript: resultPayload?.transcript ?? resultPayload?.transcriptRaw,
    messages: resultPayload?.messages ?? resultPayload?.conversation,
    summary: resultPayload?.summary,
    suggestedRubrics:
      resultPayload?.suggestedRubrics
      ?? resultPayload?.rubrics
      ?? [],
    requireManualApprovalForSuggestedRubrics:
      resultPayload?.rubricIntelligence?.requireManualApprovalForSuggestedRubrics,
    engineVersion: resultPayload?.rubricIntelligence?.engineVersion,
    usedMockData: false,
    restoredFromServer: Boolean(resultPayload?.restoredFromServer),
    ...(resultPayload?.openedFromHistory ? { openedFromHistory: true } : {}),
  }));

  const engineVersion = resultPayload?.rubricIntelligence?.engineVersion;
  if (engineVersion === 'v2' || engineVersion === 'v3' || engineVersion === 'v3.5'
    || engineVersion === 'v4.0' || engineVersion === 'v5.2'
    || resultPayload?.rubricIntelligence?.requireManualApprovalForSuggestedRubrics) {
    dispatch(loadAudioCaseConcepts(sessionId));
  }

  dispatch(setAudioCaseStatus({
    status: 'completed',
    progressStep: 'completed',
    progressPercent: 100,
    elapsedSeconds: elapsedSeconds
      ?? resultPayload?.elapsedSeconds
      ?? undefined,
  }));
  dispatch(setAudioCasePollLoading(false));
};

const tryFetchCompletedResult = async (sessionId, dispatch) => {
  const statusResponse = await getAudioCaseTakingStatusApi(sessionId);
  assertApiSuccess(statusResponse, 'Could not read analysis status.');
  const statusPayload = unwrapApiPayload(statusResponse);
  const status = String(statusPayload?.status || '').toLowerCase();

  if (status !== 'completed') {
    return null;
  }

  const resultResponse = await getAudioCaseTakingResultApi(sessionId);
  assertApiSuccess(resultResponse, 'Analysis completed but result could not be loaded.');
  const resultPayload = unwrapApiPayload(resultResponse);
  dispatchCompletedAnalysis(
    dispatch,
    sessionId,
    resultPayload,
    statusPayload?.elapsedSeconds ?? null,
  );
  return resultPayload;
};

export const uploadAndAnalyzeAudioCase = ({
  audioFile,
  patientId,
  caseId,
  patientAppId,
  doctorUserId,
  audioSource,
  originalFileName,
  patientName,
  language,
}) => async (dispatch) => {
  dispatch(startNewAudioCaseSession());
  dispatch(setAudioCaseUploadLoading(true));
  dispatch(setAudioCaseError(null));
  dispatch(setAudioCaseStatus({
    status: 'uploading',
    progressStep: 'uploading',
    progressPercent: 5,
  }));
  dispatch(setAudioCaseSessionMeta({
    audioSource,
    selectedFileName: originalFileName || audioFile?.name || null,
  }));

  const formData = new FormData();
  formData.append('audioFile', audioFile, originalFileName || audioFile?.name || 'recording.webm');
  formData.append('patientId', String(patientId ?? ''));
  if (caseId != null && caseId !== '') formData.append('caseId', String(caseId));
  if (patientAppId != null && patientAppId !== '') formData.append('patientAppId', String(patientAppId));
  if (doctorUserId != null && doctorUserId !== '') formData.append('doctorUserId', String(doctorUserId));
  formData.append('audioSource', audioSource);
  if (originalFileName) formData.append('originalFileName', originalFileName);
  if (language) formData.append('language', language);
  formData.append('consentGiven', 'true');

  try {
    const uploadResponse = await uploadAudioCaseTakingApi(formData);
    const uploadPayload = unwrapApiPayload(uploadResponse);
    const sessionId =
      uploadPayload?.sessionId
      ?? uploadPayload?.audioCaseSessionId
      ?? uploadPayload?.data?.sessionId;

    if (!sessionId) {
      throw new Error('Upload succeeded but session id was not returned.');
    }

    dispatch(setAudioCaseSessionMeta({ sessionId }));
    dispatch(setAudioCaseUploadLoading(false));
    dispatch(setAudioCaseStatus({
      status: 'processing',
      progressStep: 'processing',
      progressPercent: 15,
    }));

    await dispatch(pollAudioCaseAnalysis(sessionId));
    return sessionId;
  } catch (error) {
    dispatch(setAudioCaseUploadLoading(false));

    const message = getErrorMessage(error, 'Failed to upload audio for analysis.');
    dispatch(setAudioCaseError(message));

    try {
      await enqueueOfflineAudioUpload({
        patientId,
        caseId,
        patientAppId,
        doctorUserId,
        audioSource,
        originalFileName,
        patientName,
        language,
        queuedReason: message,
      });
    } catch (queueError) {
      // Ignore queue failures; primary error already set.
    }

    throw error;
  }
};

export const pollAudioCaseAnalysis = (sessionId) => async (dispatch) => {
  dispatch(setAudioCasePollLoading(true));
  dispatch(setAudioCaseStatus({
    status: 'processing',
    progressStep: 'transcribing',
    progressPercent: 20,
    error: null,
  }));

  try {
    const totalAttempts = MAX_POLL_ATTEMPTS + GRACE_POLL_ATTEMPTS;

    for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
      const statusResponse = await getAudioCaseTakingStatusApi(sessionId);
      assertApiSuccess(statusResponse, 'Could not read analysis status.');
      const statusPayload = unwrapApiPayload(statusResponse);
      const status = String(statusPayload?.status || '').toLowerCase();
      const progressStep = statusPayload?.progressStep ?? statusPayload?.currentStep ?? status;
      const progressPercent = statusPayload?.percent ?? statusPayload?.progressPercent ?? null;
      const elapsedSeconds = statusPayload?.elapsedSeconds ?? null;
      const stageLabel = statusPayload?.stageLabel ?? null;
      const engineVersion = statusPayload?.engineVersion ?? null;
      const takingLonger = attempt >= MAX_POLL_ATTEMPTS;
      const stepKey = String(progressStep || '').toLowerCase();
      const isNearComplete = (progressPercent ?? 0) >= 96 || stepKey === 'finalizingresults';

      dispatch(setAudioCaseStatus({
        status: status === 'completed' ? 'completed' : 'processing',
        // Keep the real server step (e.g. rubricdiscovery at 93%) — don't imply "almost done" while discovery is still running.
        progressStep: takingLonger && isNearComplete ? 'finishing' : progressStep,
        progressPercent: progressPercent ?? undefined,
        elapsedSeconds,
        stageLabel,
        engineVersion,
        takingLonger,
      }));

      if (status === 'completed') {
        const resultResponse = await getAudioCaseTakingResultApi(sessionId);
        assertApiSuccess(resultResponse, 'Analysis completed but result could not be loaded.');
        const resultPayload = unwrapApiPayload(resultResponse);
        dispatchCompletedAnalysis(dispatch, sessionId, resultPayload, elapsedSeconds);
        return resultPayload;
      }

      if (status === 'failed') {
        throw new Error(
          statusPayload?.errorMessage
          || statusPayload?.errorCode
          || 'Audio analysis failed on the server.',
        );
      }

      await sleep(POLL_INTERVAL_MS);
    }

    const recovered = await tryFetchCompletedResult(sessionId, dispatch);
    if (recovered) {
      return recovered;
    }

    // Do NOT mark as failed. The backend may still be processing (server timeout is 20 min).
    // Stop auto-polling to respect the 8-minute wait budget, but allow user to resume manually.
    dispatch(setAudioCasePollLoading(false));
    dispatch(setAudioCaseStatus({
      status: 'processing',
      progressStep: 'waiting',
      takingLonger: true,
      error: AUDIO_CASE_TIMEOUT_MESSAGE,
    }));
    return { timedOut: true, sessionId };
  } catch (error) {
    try {
      const recovered = await tryFetchCompletedResult(sessionId, dispatch);
      if (recovered) {
        return recovered;
      }
    } catch (recoveryError) {
      // Fall through to primary error handling.
    }

    dispatch(setAudioCasePollLoading(false));
    const message = getErrorMessage(error, 'Failed while processing audio.');
    dispatch(setAudioCaseError(message));
    throw error;
  }
};

export const reAnalyzeAudioCase = (sessionId, transcript) => async (dispatch) => {
  if (!sessionId || !transcript?.trim()) {
    return null;
  }

  dispatch(setAudioCaseReAnalyzeLoading(true));
  dispatch(setAudioCaseError(null));
  dispatch(setAudioCaseTranscript(transcript.trim()));
  dispatch(setAudioCaseStatus({
    status: 'processing',
    progressStep: 'reanalysis',
    progressPercent: 20,
  }));

  try {
    const response = await reAnalyzeAudioCaseTakingApi(sessionId, { transcript: transcript.trim() });
    const payload = unwrapApiPayload(response);
    const resolvedSessionId = payload?.sessionId ?? sessionId;
    dispatch(setAudioCaseSessionMeta({ sessionId: resolvedSessionId }));
    dispatch(setAudioCaseReAnalyzeLoading(false));
    await dispatch(pollAudioCaseAnalysis(resolvedSessionId));
    return resolvedSessionId;
  } catch (error) {
    dispatch(setAudioCaseReAnalyzeLoading(false));
    const message = getErrorMessage(error, 'Failed to re-analyze transcript.');
    dispatch(setAudioCaseError(message));
    throw error;
  }
};

export const logAudioDoctorAction = ({
  sessionId,
  actionType,
  targetType,
  targetId,
  beforeJson,
  afterJson,
  notes,
}) => async () => {
  if (!sessionId || sessionId.startsWith('mock-')) {
    return null;
  }

  try {
    await logAudioCaseDoctorActionApi(sessionId, {
      actionType,
      targetType,
      targetId,
      beforeJson,
      afterJson,
      notes,
    });
    return true;
  } catch (error) {
    return null;
  }
};

export const submitAudioCaseRubricFeedback = ({
  sessionId,
  feedbackType,
  subSectionId,
  rubricName,
  originalMatchLayer,
  correctedSubSectionId,
  reason,
  rejectReasonStage,
  rejectReasonNote,
  confidenceAtFeedback,
  engineVersion,
}) => async () => {
  if (!sessionId || sessionId.startsWith('mock-')) {
    return null;
  }

  try {
    const response = await submitAudioCaseRubricFeedbackApi(sessionId, {
      feedbackType,
      subSectionId,
      rubricName,
      originalMatchLayer,
      correctedSubSectionId,
      reason,
      rejectReasonStage,
      rejectReasonNote,
      confidenceAtFeedback,
      engineVersion,
    });
    return unwrapApiPayload(response);
  } catch (error) {
    return null;
  }
};

export const loadLatestAudioCaseSession = (patientId, caseId) => async (dispatch) => {
  const payload = await dispatch(checkForPreviousAudioCaseSession(patientId, caseId));
  if (!payload?.sessionId) {
    return null;
  }
  return dispatch(resumePreviousAudioCaseSession(payload, patientId, caseId));
};

const restoreSessionFromPayload = async (dispatch, payload) => {
  const sessionId = payload?.sessionId;
  const status = String(payload?.status || '').toLowerCase();

  if (!sessionId) {
    return null;
  }

  dispatch(setAudioCaseSessionMeta({
    sessionId,
    selectedFileName: payload?.audioFileName ?? null,
  }));

  if (status === 'completed' && payload?.result) {
    let elapsedSeconds = payload?.elapsedSeconds ?? null;
    try {
      const statusResponse = await getAudioCaseTakingStatusApi(sessionId);
      const statusPayload = unwrapApiPayload(statusResponse);
      if (typeof statusPayload?.elapsedSeconds === 'number') {
        elapsedSeconds = statusPayload.elapsedSeconds;
      }
    } catch (error) {
      // Non-fatal — UI will omit elapsed if unavailable.
    }

    dispatch(setAudioCaseAnalysisResult({
      sessionId,
      transcript: payload.result?.transcript,
      messages: payload.result?.messages,
      summary: payload.result?.summary,
      suggestedRubrics: payload.result?.suggestedRubrics ?? [],
      requireManualApprovalForSuggestedRubrics:
        payload.result?.rubricIntelligence?.requireManualApprovalForSuggestedRubrics,
      engineVersion: payload.result?.rubricIntelligence?.engineVersion,
      usedMockData: false,
      restoredFromServer: true,
    }));
    dispatch(setAudioCaseStatus({
      status: 'completed',
      progressStep: 'completed',
      progressPercent: 100,
      elapsedSeconds: elapsedSeconds ?? undefined,
    }));

    const engineVersion = payload.result?.rubricIntelligence?.engineVersion;
    if (engineVersion === 'v2' || engineVersion === 'v3' || engineVersion === 'v3.5'
      || engineVersion === 'v4.0' || engineVersion === 'v5.2'
      || payload.result?.rubricIntelligence?.requireManualApprovalForSuggestedRubrics) {
      dispatch(loadAudioCaseConcepts(sessionId));
    }
    return payload.result;
  }

  if (status === 'processing' || status === 'uploaded') {
    dispatch(setAudioCaseStatus({
      status: 'processing',
      progressStep: payload?.progressStep ?? 'processing',
      progressPercent: status === 'uploaded' ? 10 : 15,
    }));
    return dispatch(pollAudioCaseAnalysis(sessionId));
  }

  if (status === 'failed') {
    dispatch(setAudioCaseError(
      payload?.errorMessage || 'Previous audio analysis failed. Start a new case.',
    ));
    return payload;
  }

  dispatch(setAudioCaseStatus({ status: status || 'idle' }));
  return payload;
};

export const checkForPreviousAudioCaseSession = (patientId, caseId) => async (dispatch) => {
  if (!patientId) {
    return null;
  }

  dispatch(setPendingPreviousSessionLoading(true));

  try {
    const response = await getLatestAudioCaseSessionApi(patientId, caseId);
    assertApiSuccess(response, 'Could not check for a previous audio session.');
    const payload = unwrapApiPayload(response);

    if (!payload?.sessionId) {
      dispatch(setPendingPreviousSession(null));
      return null;
    }

    dispatch(setPendingPreviousSession({
      sessionId: payload.sessionId,
      status: payload.status,
      progressStep: payload.progressStep,
      audioFileName: payload.audioFileName,
      enteredDate: payload.enteredDate,
      errorMessage: payload.errorMessage,
      isStale: Boolean(payload.isStale),
      canResume: payload.canResume !== false && !payload.isStale,
    }));

    return payload;
  } catch (error) {
    dispatch(setPendingPreviousSession(null));
    return null;
  }
};

export const resumePreviousAudioCaseSession = (pendingSession, patientId, caseId) => async (dispatch) => {
  const session = pendingSession;
  if (!session?.sessionId) {
    return null;
  }

  if (session.isStale || session.canResume === false) {
    dispatch(setAudioCaseError(
      session.errorMessage
      || 'This previous upload is no longer active. Use Start new case and upload again.',
    ));
    return null;
  }

  dispatch(dismissPendingPreviousSession());

  try {
    const response = await getLatestAudioCaseSessionApi(patientId, caseId);
    assertApiSuccess(response, 'Could not resume previous audio session.');
    const payload = unwrapApiPayload(response);

    if (!payload?.sessionId || payload.sessionId !== session.sessionId) {
      throw new Error('Previous session is no longer available.');
    }

    if (payload.isStale || payload.canResume === false) {
      dispatch(setAudioCaseError(
        payload.errorMessage
        || 'This previous upload is no longer active. Use Start new case and upload again.',
      ));
      return null;
    }

    return restoreSessionFromPayload(dispatch, payload);
  } catch (error) {
    const message = getErrorMessage(error, 'Could not resume previous audio session.');
    dispatch(setAudioCaseError(message));
    throw error;
  }
};

export const dismissPreviousAudioCaseSession = () => (dispatch) => {
  dispatch(dismissPendingPreviousSession());
};

export { startNewAudioCaseSession } from './reducer';

export const loadAudioCaseSessionHistory = (patientId, {
  pageNumber = 1,
  pageSize = 50,
  append = false,
} = {}) => async (dispatch) => {
  if (!patientId) {
    return null;
  }

  dispatch(setAudioCaseSessionHistoryLoading(true));

  try {
    const response = await getAudioCaseTakingSessionsApi(patientId, { pageNumber, pageSize });
    assertApiSuccess(response, 'Could not load audio session history.');
    const payload = unwrapApiPayload(response);
    const items = Array.isArray(payload?.items) ? payload.items : [];

    dispatch(setAudioCaseSessionHistory({
      items,
      append,
      totalCount: payload?.totalCount ?? items.length,
      completedCount: payload?.completedCount ?? 0,
      processingCount: payload?.processingCount ?? 0,
      failedCount: payload?.failedCount ?? 0,
      hasMore: Boolean(payload?.hasMore),
      pageNumber: payload?.pageNumber ?? pageNumber,
    }));

    return payload;
  } catch (error) {
    const message = getErrorMessage(error, 'Could not load audio session history.');
    dispatch(setAudioCaseSessionHistoryError(message));
    return null;
  }
};

export const openAudioCaseHistorySession = (session) => async (dispatch) => {
  const sessionId = session?.sessionId;
  const status = String(session?.status || '').toLowerCase();

  if (!sessionId) {
    return null;
  }

  dispatch(dismissPendingPreviousSession());
  dispatch(setViewingHistorySessionId(sessionId));
  dispatch(setAudioCaseSessionMeta({
    sessionId,
    selectedFileName: session?.audioFileName ?? null,
    audioSource: session?.audioSourceType ?? null,
  }));

  if (status === 'completed') {
    try {
      const resultResponse = await getAudioCaseTakingResultApi(sessionId);
      assertApiSuccess(resultResponse, 'Could not load this session.');
      const resultPayload = unwrapApiPayload(resultResponse);
      dispatchCompletedAnalysis(dispatch, sessionId, {
        ...resultPayload,
        restoredFromServer: true,
        openedFromHistory: true,
      });
      return resultPayload;
    } catch (error) {
      const message = getErrorMessage(error, 'Could not open this session.');
      dispatch(setAudioCaseError(message));
      throw error;
    }
  }

  if (status === 'processing' || status === 'uploaded') {
    if (session?.isStale || session?.canOpen === false) {
      dispatch(setAudioCaseError(
        session?.errorMessage
        || 'This session did not finish. Start a new recording.',
      ));
      return null;
    }

    dispatch(setAudioCaseStatus({
      status: 'processing',
      progressStep: session?.progressStep ?? 'processing',
      progressPercent: status === 'uploaded' ? 10 : 15,
      error: null,
    }));
    return dispatch(pollAudioCaseAnalysis(sessionId));
  }

  dispatch(setAudioCaseError(
    session?.errorMessage || 'This analysis failed. You can start a new recording.',
  ));
  return session;
};

export const loadAudioCaseConcepts = (sessionId) => async (dispatch) => {
  if (!sessionId) {
    return null;
  }

  dispatch(setAudioCaseConceptsLoading(true));
  try {
    const response = await getAudioCaseConceptsApi(sessionId);
    const payload = unwrapApiPayload(response);
    dispatch(setAudioCaseConcepts({
      concepts: payload?.concepts ?? [],
      causationLinks: payload?.causationLinks ?? [],
      engineVersion: payload?.engineVersion,
    }));
    return payload;
  } catch (error) {
    const message = getErrorMessage(error, 'Could not load clinical concepts.');
    dispatch(setAudioCaseConceptsError(message));
    return null;
  }
};
