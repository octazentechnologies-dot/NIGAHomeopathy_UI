import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    diagnosisSystemsList: null,
    diagnosisSystemLoading: false,
    diagnosisSystemError: null,
    diagnosisSystemSuccess: null
};

const diagnosisSystemSlice = createSlice({
    name: 'DiagnosisSystem',
    initialState,
    reducers: {
        setDiagnosisSystemsList: (state, action) => {
            state.diagnosisSystemsList = action.payload;
        },
        setDiagnosisSystemLoading: (state, action) => {
            state.diagnosisSystemLoading = action.payload;
        },
        setDiagnosisSystemError: (state, action) => {
            state.diagnosisSystemError = action.payload;
        },
        setDiagnosisSystemSuccess: (state, action) => {
            state.diagnosisSystemSuccess = action.payload;
        }
    }
});

export const {
    setDiagnosisSystemsList,
    setDiagnosisSystemLoading,
    setDiagnosisSystemError,
    setDiagnosisSystemSuccess
} = diagnosisSystemSlice.actions;

export default diagnosisSystemSlice.reducer;
