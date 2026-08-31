import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    questions: [],
    questionGroups: [],
    questionSubGroups: [],
    questionsLoading: true,
    questionError: null,
    questionSuccess: null,
    questionBodyParts: [],
    questionSections: [],
    questionSubSections: [],
    questionSectionDDL: [],
    questionSubSectionDDL: [],
    questionBodyPartDataById: null,
    questionGroupByExistanceId: [],
    questionSubSectionDDLByQGIDQSID: [],
    questionKeywordBodyPart: [],
    questionRubricData: [],
};

const clinicalQuestionsSlice = createSlice({
    name: 'ClinicalQuestions',
    initialState,
    reducers: {
        setQuestionsLoading(state, action) {
            state.questionsLoading = action.payload;
        },
        setQuestionsList(state, action) {
            state.questions = action.payload;
        },
        setQuestionSuccess(state, action) {
            state.questionSuccess = action.payload;
        },
        setQuestionError(state, action) {
            state.questionError = action.payload;
        },
        setQuestionGroups(state, action) {
            state.questionGroups = action.payload;
        },
        setQuestionSubGroups(state, action) {
            state.questionSubGroups = action.payload;
        },
        setQuestionBodyParts(state, action) {
            state.questionBodyParts = action.payload;
        },
        setQuestionSections(state, action) {
            state.questionSections = action.payload;
        },
        setQuestionSubSections(state, action) {
            state.questionSubSections = action.payload;
        },
        setQuestionSectionDDL(state, action) {
            state.questionSectionDDL = action.payload;
        },
        setQuestionSubSectionDDL(state, action) {
            state.questionSubSectionDDL = action.payload;
        },
        setQuestionBodyPartDataById(state, action) {
            state.questionBodyPartDataById = action.payload;
        },
        setQuestionGroupByExistanceId(state, action) {
            state.questionGroupByExistanceId = action.payload;
        },
        setQuestionSubSectionDDLByQGIDQSID(state, action) {
            state.questionSubSectionDDLByQGIDQSID = action.payload;
        },
        setQuestionKeywordBodyPart(state, action) {
            state.questionKeywordBodyPart = action.payload;
        },
        setQuestionRubricData(state, action) {
            state.questionRubricData = action.payload;
        },
    },
});

export const {
    setQuestionsLoading,
    setQuestionsList,
    setQuestionSuccess,
    setQuestionError,
    setQuestionGroups,
    setQuestionSubGroups,
    setQuestionBodyParts,
    setQuestionSections,
    setQuestionSubSections,
    setQuestionSectionDDL,
    setQuestionSubSectionDDL,
    setQuestionBodyPartDataById,
    setQuestionGroupByExistanceId,
    setQuestionSubSectionDDLByQGIDQSID,
    setQuestionKeywordBodyPart,
    setQuestionRubricData
} = clinicalQuestionsSlice.actions;

export default clinicalQuestionsSlice.reducer;