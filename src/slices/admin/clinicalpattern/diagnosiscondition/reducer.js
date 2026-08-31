import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    diagnosisConditionsList: null,
    diagnosisConditionLoading: false,
    diagnosisConditionError: null,
    diagnosisConditionSuccess: null,

    // Section state
    sectionList: [],
    sectionLoading: false,
    sectionError: null,

    // Sub Section state
    subSectionList: [],
    subSectionLoading: false,
    subSectionError: null,

    // Diagnosis System state
    diagnosisSystemList: [],
    diagnosisSystemLoading: false,
    diagnosisSystemError: null,

    // Diagnosis By ID state
    diagnosisDetails: null,
    diagnosisDetailsLoading: false,
    diagnosisDetailsError: null,

    // Delete Rubric state
    deleteRubricSuccess: null,
    deleteRubricError: null
};

const diagnosisConditionSlice = createSlice({
    name: 'DiagnosisCondition',
    initialState,
    reducers: {
        setDiagnosisConditionsList: (state, action) => {
            state.diagnosisConditionsList = action.payload;
        },
        setDiagnosisConditionLoading: (state, action) => {
            state.diagnosisConditionLoading = action.payload;
        },
        setDiagnosisConditionError: (state, action) => {
            state.diagnosisConditionError = action.payload;
        },
        setDiagnosisConditionSuccess: (state, action) => {
            state.diagnosisConditionSuccess = action.payload;
        },

        // Section reducers
        setSectionList: (state, action) => {
            state.sectionList = action.payload;
        },
        setSectionLoading: (state, action) => {
            state.sectionLoading = action.payload;
        },
        setSectionError: (state, action) => {
            state.sectionError = action.payload;
        },

        // Sub Section reducers
        setSubSectionList: (state, action) => {
            state.subSectionList = action.payload;
        },
        setSubSectionLoading: (state, action) => {
            state.subSectionLoading = action.payload;
        },
        setSubSectionError: (state, action) => {
            state.subSectionError = action.payload;
        },

        // Diagnosis System reducers
        setDiagnosisSystemList: (state, action) => {
            state.diagnosisSystemList = action.payload;
        },
        setDiagnosisSystemLoading: (state, action) => {
            state.diagnosisSystemLoading = action.payload;
        },
        setDiagnosisSystemError: (state, action) => {
            state.diagnosisSystemError = action.payload;
        },

        // Diagnosis Details reducers
        setDiagnosisDetails: (state, action) => {
            state.diagnosisDetails = action.payload;
        },
        setDiagnosisDetailsLoading: (state, action) => {
            state.diagnosisDetailsLoading = action.payload;
        },
        setDiagnosisDetailsError: (state, action) => {
            state.diagnosisDetailsError = action.payload;
        },

        // Delete Rubric reducers
        setDeleteRubricSuccess: (state, action) => {
            state.deleteRubricSuccess = action.payload;
        },
        setDeleteRubricError: (state, action) => {
            state.deleteRubricError = action.payload;
        }
    }
});

export const {
    setDiagnosisConditionsList,
    setDiagnosisConditionLoading,
    setDiagnosisConditionError,
    setDiagnosisConditionSuccess,
    setSectionList,
    setSectionLoading,
    setSectionError,
    setSubSectionList,
    setSubSectionLoading,
    setSubSectionError,
    setDiagnosisSystemList,
    setDiagnosisSystemLoading,
    setDiagnosisSystemError,
    setDiagnosisDetails,
    setDiagnosisDetailsLoading,
    setDiagnosisDetailsError,
    setDeleteRubricSuccess,
    setDeleteRubricError
} = diagnosisConditionSlice.actions;

export default diagnosisConditionSlice.reducer;
