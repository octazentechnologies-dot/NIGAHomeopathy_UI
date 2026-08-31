import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    diagnosisListForClinicalPattern: [],
    diagnosisTherapeuticsList: [],
    diagnosisTherapeuticsDetails: null,
    loading: false,
    error: null,
    success: null
};

const diagnosisTherapeuticsSlice = createSlice({
    name: 'diagnosisTherapeutics',
    initialState,
    reducers: {
        setDiagnosisTherapeuticsList: (state, action) => {
            state.diagnosisTherapeuticsList = action.payload;
            state.error = null;
        },
        setDiagnosisTherapeuticsDetails: (state, action) => {
            state.diagnosisTherapeuticsDetails = action.payload;
            state.error = null;
        },
        setDiagnosisTherapeuticsLoading: (state, action) => {
            state.loading = action.payload;
        },
        setDiagnosisTherapeuticsError: (state, action) => {
            state.error = action.payload;
            state.success = null;
        },
        setDiagnosisTherapeuticsSuccess: (state, action) => {
            state.success = action.payload;
            state.error = null;
        },
        setDiagnosisListForClinicalPattern: (state, action) => {
            state.diagnosisListForClinicalPattern = action.payload;
        },
        resetDiagnosisTherapeuticsState: (state) => {
            state.diagnosisTherapeuticsList = [];
            state.diagnosisTherapeuticsDetails = null;
            state.loading = false;
            state.error = null;
            state.success = null;
        }
    }
});

export const {
    setDiagnosisTherapeuticsList,
    setDiagnosisTherapeuticsDetails,
    setDiagnosisTherapeuticsLoading,
    setDiagnosisTherapeuticsError,
    setDiagnosisTherapeuticsSuccess,
    resetDiagnosisTherapeuticsState,
    setDiagnosisListForClinicalPattern
} = diagnosisTherapeuticsSlice.actions;

export default diagnosisTherapeuticsSlice.reducer;

