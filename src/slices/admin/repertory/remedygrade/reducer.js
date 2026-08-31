import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    remedyGradesList: null,
    loading: false,
    remedyGradeError: null,
    remedyGradeSuccess: null
};

const remedyGradeSlice = createSlice({
    name: 'RemedyGrade',
    initialState,
    reducers: {
        setRemedyGradesList: (state, action) => {
            state.remedyGradesList = action.payload;
        },
        setRemedyGradesLoading: (state, action) => {
            state.loading = action.payload;
        },
        setRemedyGradeError: (state, action) => {
            state.remedyGradeError = action.payload;
            state.remedyGradeSuccess = null;
        },
        setRemedyGradeSuccess: (state, action) => {
            state.remedyGradeSuccess = action.payload;
            state.remedyGradeError = null;
        },
        resetRemedyGradeState: (state) => {
            state.remedyGradeError = null;
            state.remedyGradeSuccess = null;
        }
    }
});

export const {
    setRemedyGradesList,
    setRemedyGradesLoading,
    setRemedyGradeError,
    setRemedyGradeSuccess,
    resetRemedyGradeState
} = remedyGradeSlice.actions;

export default remedyGradeSlice.reducer;
