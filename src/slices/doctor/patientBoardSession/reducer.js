import { createSlice } from '@reduxjs/toolkit';
import {
  clearPersistedPatientBoardSessions,
  loadPersistedPatientBoardSessions,
  persistPatientBoardSessions,
} from '../../../helpers/patientBoardSessionPersist';

const persisted = loadPersistedPatientBoardSessions();

export const initialState = {
  sessions: persisted?.sessions ?? [],
  activePatientKey: persisted?.activePatientKey ?? null,
};

const syncPersist = (state) => {
  persistPatientBoardSessions({
    sessions: state.sessions,
    activePatientKey: state.activePatientKey,
  });
};

const PatientBoardSessionSlice = createSlice({
  name: 'PatientBoardSession',
  initialState,
  reducers: {
    savePatientBoardSession(state, action) {
      const {
        patientKey,
        patientName = '',
        resumePath = '',
        snapshot = null,
      } = action.payload ?? {};

      if (!patientKey) {
        return;
      }

      const existingIndex = state.sessions.findIndex((item) => item.patientKey === patientKey);
      const existingName = existingIndex >= 0 ? state.sessions[existingIndex].patientName : '';
      const resolvedName = String(patientName || existingName || '').trim();

      const entry = {
        patientKey,
        patientName: resolvedName,
        resumePath,
        snapshot,
        lastUpdatedAt: Date.now(),
      };
      if (existingIndex >= 0) {
        state.sessions[existingIndex] = {
          ...state.sessions[existingIndex],
          ...entry,
        };
      } else {
        state.sessions.push(entry);
      }

      state.activePatientKey = patientKey;
      syncPersist(state);
    },
    completePatientBoardSession(state, action) {
      const patientKey = action.payload;
      if (!patientKey) {
        return;
      }

      state.sessions = state.sessions.filter((item) => item.patientKey !== patientKey);
      if (state.activePatientKey === patientKey) {
        state.activePatientKey = state.sessions[0]?.patientKey ?? null;
      }
      syncPersist(state);
    },
    setActivePatientBoardSession(state, action) {
      state.activePatientKey = action.payload ?? null;
      syncPersist(state);
    },
    clearPatientBoardSession(state) {
      state.sessions = [];
      state.activePatientKey = null;
      clearPersistedPatientBoardSessions();
    },
  },
});

export const {
  savePatientBoardSession,
  completePatientBoardSession,
  setActivePatientBoardSession,
  clearPatientBoardSession,
} = PatientBoardSessionSlice.actions;

export default PatientBoardSessionSlice.reducer;
