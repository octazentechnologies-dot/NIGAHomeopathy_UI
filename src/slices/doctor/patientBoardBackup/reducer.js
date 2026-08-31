import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  summary: null,
  summaryLoading: false,
  summaryError: null,
  saveLoading: false,
  saveError: null,
  restoreLoading: false,
  restoreError: null,
  deleteLoading: false,
  deleteError: null,
  latestBackupDetail: null,
};

const PatientBoardBackupSlice = createSlice({
  name: 'PatientBoardBackup',
  initialState,
  reducers: {
    setPatientBoardBackupSummaryLoading(state, action) {
      state.summaryLoading = action.payload;
    },
    setPatientBoardBackupSummary(state, action) {
      state.summary = action.payload;
      state.summaryError = null;
    },
    setPatientBoardBackupSummaryError(state, action) {
      state.summaryError = action.payload;
    },
    setPatientBoardBackupSaveLoading(state, action) {
      state.saveLoading = action.payload;
    },
    setPatientBoardBackupSaveError(state, action) {
      state.saveError = action.payload;
    },
    clearPatientBoardBackupSummary(state) {
      state.summary = { hasBackup: false };
      state.latestBackupDetail = null;
    },
    setPatientBoardBackupRestoreLoading(state, action) {
      state.restoreLoading = action.payload;
    },
    setPatientBoardBackupRestoreError(state, action) {
      state.restoreError = action.payload;
    },
    setPatientBoardBackupDeleteLoading(state, action) {
      state.deleteLoading = action.payload;
    },
    setPatientBoardBackupDeleteError(state, action) {
      state.deleteError = action.payload;
    },
    setPatientBoardBackupLatestDetail(state, action) {
      state.latestBackupDetail = action.payload;
    },
  },
});

export const {
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
} = PatientBoardBackupSlice.actions;

export default PatientBoardBackupSlice.reducer;
