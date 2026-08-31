import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    rubricsList: [],
    rubricError: null,
    rubricSuccess: null,
    rubricsLoading: false,
    sectionForSubSection: [],
    gradeDetails: [],
    authorForRubric: [],
    subSection: [],
    remedyGrades: [],
    remediesByGrade: [],
    rubricRemedyBySectionIdGreadId: null
};

export const rubricSlice = createSlice({
    name: 'Rubric',
    initialState,
    reducers: {
        setRubricsList: (state, action) => {
            state.rubricsList = action.payload;
        },
        setRubricError: (state, action) => {
            state.rubricError = action.payload;
        },
        setRubricSuccess: (state, action) => {
            state.rubricSuccess = action.payload;
        },
        setRubricsLoading: (state, action) => {
            state.rubricsLoading = action.payload;
        },
        setSectionForSubSection: (state, action) => {
            state.sectionForSubSection = action.payload;
        },
        clearRubricState: (state) => {
            state.rubricError = null;
            state.rubricSuccess = null;
        },
        setGradeDetails: (state, action) => {
            state.gradeDetails = action.payload;
        },
        setAuthorForRubric: (state, action) => {
            state.authorForRubric = action.payload;
        },
        setSubSection: (state, action) => {
            state.subSection = action.payload;
        },
        setRemedyGrades: (state, action) => {
            state.remedyGrades = action.payload;
        },
        setRemediesByGrade: (state, action) => {
            state.remediesByGrade = action.payload;
        },
        setRubricRemedyBySectionIdGreadId: (state, action) => {
            state.rubricRemedyBySectionIdGreadId = action.payload;
        }
    }
});

export const {
    setRubricsList,
    setRubricError,
    setRubricSuccess,
    setRubricsLoading,
    setSectionForSubSection,
    clearRubricState,
    setGradeDetails,
    setAuthorForRubric,
    setSubSection,
    setRemedyGrades,
    setRemediesByGrade,
    setRubricRemedyBySectionIdGreadId
} = rubricSlice.actions;

export default rubricSlice.reducer;
