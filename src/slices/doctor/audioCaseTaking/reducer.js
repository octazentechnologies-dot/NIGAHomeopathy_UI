import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  sessionId: null,
  audioSource: null,
  selectedFileName: null,
  language: '',
  status: 'idle',
  progressStep: null,
  progressPercent: 0,
  elapsedSeconds: null,
  stageLabel: null,
  takingLonger: false,
  transcript: null,
  messages: [],
  summary: null,
  suggestedRubrics: [],
  requireManualApprovalForSuggestedRubrics: false,
  engineVersion: 'v1',
  concepts: [],
  causationLinks: [],
  conceptsLoading: false,
  conceptsError: null,
  rubricApprovalState: {},
  approvedRubricCount: 0,
  usedMockData: false,
  canDownloadFromServer: false,
  error: null,
  uploadLoading: false,
  pollLoading: false,
  reAnalyzeLoading: false,
  restoredFromServer: false,
  pendingPreviousSession: null,
  pendingPreviousSessionLoading: false,
  pendingPreviousSessionDismissed: false,
  sessionHistory: [],
  sessionHistoryTotal: 0,
  sessionHistoryCompletedCount: 0,
  sessionHistoryProcessingCount: 0,
  sessionHistoryFailedCount: 0,
  sessionHistoryHasMore: false,
  sessionHistoryPage: 1,
  sessionHistoryLoading: false,
  sessionHistoryError: null,
  sessionHistoryOpen: false,
  openedFromHistory: false,
  viewingHistorySessionId: null,
};

const audioCaseTakingSlice = createSlice({
  name: 'AudioCaseTaking',
  initialState,
  reducers: {
    resetAudioCaseTaking(state) {
      Object.assign(state, initialState);
    },
    startNewAudioCaseSession(state) {
      const preservedHistory = {
        sessionHistory: state.sessionHistory,
        sessionHistoryTotal: state.sessionHistoryTotal,
        sessionHistoryCompletedCount: state.sessionHistoryCompletedCount,
        sessionHistoryProcessingCount: state.sessionHistoryProcessingCount,
        sessionHistoryFailedCount: state.sessionHistoryFailedCount,
        sessionHistoryHasMore: state.sessionHistoryHasMore,
        sessionHistoryPage: state.sessionHistoryPage,
        sessionHistoryLoading: state.sessionHistoryLoading,
        sessionHistoryError: state.sessionHistoryError,
        sessionHistoryOpen: state.sessionHistoryOpen,
      };
      Object.assign(state, initialState, preservedHistory);
      state.pendingPreviousSession = null;
      state.pendingPreviousSessionDismissed = true;
    },
    dismissPendingPreviousSession(state) {
      state.pendingPreviousSession = null;
      state.pendingPreviousSessionDismissed = true;
      state.pendingPreviousSessionLoading = false;
    },
    setPendingPreviousSession(state, action) {
      state.pendingPreviousSession = action.payload ?? null;
      state.pendingPreviousSessionLoading = false;
      state.pendingPreviousSessionDismissed = false;
    },
    setPendingPreviousSessionLoading(state, action) {
      state.pendingPreviousSessionLoading = action.payload;
    },
    setAudioCaseUploadLoading(state, action) {
      state.uploadLoading = action.payload;
    },
    setAudioCasePollLoading(state, action) {
      state.pollLoading = action.payload;
    },
    setAudioCaseSessionMeta(state, action) {
      const { sessionId, audioSource, selectedFileName, language } = action.payload || {};
      if (sessionId != null) state.sessionId = sessionId;
      if (audioSource != null) state.audioSource = audioSource;
      if (selectedFileName != null) state.selectedFileName = selectedFileName;
      if (language != null) state.language = language;
    },
    setAudioCaseTranscript(state, action) {
      state.transcript = action.payload ?? null;
    },
    setAudioCaseReAnalyzeLoading(state, action) {
      state.reAnalyzeLoading = action.payload;
    },
    setAudioCaseStatus(state, action) {
      const {
        status,
        progressStep,
        progressPercent,
        elapsedSeconds,
        stageLabel,
        engineVersion,
        takingLonger,
        error,
      } = action.payload || {};
      if (status != null) state.status = status;
      if (progressStep != null) state.progressStep = progressStep;
      if (progressPercent != null) state.progressPercent = progressPercent;
      if (elapsedSeconds != null) state.elapsedSeconds = elapsedSeconds;
      if (stageLabel != null) state.stageLabel = stageLabel;
      if (engineVersion != null) state.engineVersion = engineVersion;
      if (takingLonger != null) state.takingLonger = takingLonger;
      if (error !== undefined) state.error = error;
    },
    setAudioCaseAnalysisResult(state, action) {
      const payload = action.payload || {};
      state.sessionId = payload.sessionId ?? state.sessionId;
      state.transcript = payload.transcript ?? null;
      state.messages = Array.isArray(payload.messages) ? payload.messages : [];
      state.summary = payload.summary ?? null;
      state.suggestedRubrics = Array.isArray(payload.suggestedRubrics) ? payload.suggestedRubrics : [];
      state.requireManualApprovalForSuggestedRubrics = Boolean(
        payload.requireManualApprovalForSuggestedRubrics
        ?? payload.rubricIntelligence?.requireManualApprovalForSuggestedRubrics
      );
      state.engineVersion = payload.engineVersion
        ?? payload.rubricIntelligence?.engineVersion
        ?? 'v1';
      state.usedMockData = Boolean(payload.usedMockData);
      state.status = 'completed';
      state.progressStep = 'completed';
      state.progressPercent = 100;
      state.canDownloadFromServer = Boolean(payload.sessionId && !payload.usedMockData);
      state.error = null;
      state.restoredFromServer = Boolean(payload.restoredFromServer);
      if (payload.openedFromHistory != null) {
        state.openedFromHistory = Boolean(payload.openedFromHistory);
      }
      if (state.openedFromHistory && (payload.sessionId || state.sessionId)) {
        state.viewingHistorySessionId = payload.sessionId ?? state.sessionId;
      }
      state.concepts = [];
      state.causationLinks = [];
      state.conceptsError = null;
      state.rubricApprovalState = {};
      state.approvedRubricCount = 0;
    },
    setRubricApprovalState(state, action) {
      const { rubricKey, status } = action.payload || {};
      if (!rubricKey || !status) return;
      state.rubricApprovalState[rubricKey] = status;
      state.approvedRubricCount = Object.values(state.rubricApprovalState)
        .filter((value) => value === 'approved').length;
    },
    resetRubricApprovalState(state) {
      state.rubricApprovalState = {};
      state.approvedRubricCount = 0;
    },
    setAudioCaseConceptsLoading(state, action) {
      state.conceptsLoading = action.payload;
    },
    setAudioCaseConcepts(state, action) {
      const payload = action.payload || {};
      state.concepts = Array.isArray(payload.concepts) ? payload.concepts : [];
      state.causationLinks = Array.isArray(payload.causationLinks) ? payload.causationLinks : [];
      state.conceptsLoading = false;
      state.conceptsError = null;
      if (payload.engineVersion) {
        state.engineVersion = payload.engineVersion;
      }
    },
    setAudioCaseConceptsError(state, action) {
      state.conceptsLoading = false;
      state.conceptsError = action.payload ?? 'Could not load clinical concepts.';
    },
    setAudioCaseError(state, action) {
      state.error = action.payload;
      state.status = 'failed';
      state.uploadLoading = false;
      state.pollLoading = false;
    },
    toggleAudioCaseSessionHistory(state, action) {
      state.sessionHistoryOpen = typeof action.payload === 'boolean'
        ? action.payload
        : !state.sessionHistoryOpen;
    },
    setAudioCaseSessionHistoryLoading(state, action) {
      state.sessionHistoryLoading = action.payload;
      if (action.payload) {
        state.sessionHistoryError = null;
      }
    },
    setAudioCaseSessionHistory(state, action) {
      const payload = action.payload || {};
      const append = Boolean(payload.append);
      const items = Array.isArray(payload.items) ? payload.items : [];
      state.sessionHistory = append ? [...state.sessionHistory, ...items] : items;
      state.sessionHistoryTotal = payload.totalCount ?? state.sessionHistory.length;
      state.sessionHistoryCompletedCount = payload.completedCount ?? 0;
      state.sessionHistoryProcessingCount = payload.processingCount ?? 0;
      state.sessionHistoryFailedCount = payload.failedCount ?? 0;
      state.sessionHistoryHasMore = Boolean(payload.hasMore);
      state.sessionHistoryPage = payload.pageNumber ?? 1;
      state.sessionHistoryLoading = false;
      state.sessionHistoryError = null;
    },
    setAudioCaseSessionHistoryError(state, action) {
      state.sessionHistoryLoading = false;
      state.sessionHistoryError = action.payload ?? 'Could not load session history.';
    },
    setViewingHistorySessionId(state, action) {
      state.viewingHistorySessionId = action.payload ?? null;
      state.openedFromHistory = Boolean(action.payload);
    },
    resetAudioCaseSessionHistory(state) {
      state.sessionHistory = [];
      state.sessionHistoryTotal = 0;
      state.sessionHistoryCompletedCount = 0;
      state.sessionHistoryProcessingCount = 0;
      state.sessionHistoryFailedCount = 0;
      state.sessionHistoryHasMore = false;
      state.sessionHistoryPage = 1;
      state.sessionHistoryLoading = false;
      state.sessionHistoryError = null;
      state.sessionHistoryOpen = false;
    },
  },
});

export const {
  resetAudioCaseTaking,
  startNewAudioCaseSession,
  dismissPendingPreviousSession,
  setPendingPreviousSession,
  setPendingPreviousSessionLoading,
  setAudioCaseUploadLoading,
  setAudioCasePollLoading,
  setAudioCaseSessionMeta,
  setAudioCaseStatus,
  setAudioCaseAnalysisResult,
  setAudioCaseError,
  setAudioCaseTranscript,
  setAudioCaseReAnalyzeLoading,
  setAudioCaseConceptsLoading,
  setAudioCaseConcepts,
  setAudioCaseConceptsError,
  setRubricApprovalState,
  resetRubricApprovalState,
  toggleAudioCaseSessionHistory,
  setAudioCaseSessionHistoryLoading,
  setAudioCaseSessionHistory,
  setAudioCaseSessionHistoryError,
  setViewingHistorySessionId,
  resetAudioCaseSessionHistory,
} = audioCaseTakingSlice.actions;

export default audioCaseTakingSlice.reducer;
