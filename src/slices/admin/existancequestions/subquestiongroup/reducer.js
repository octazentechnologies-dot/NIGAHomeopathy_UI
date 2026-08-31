import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    subQuestionGroupList: [],
    questionGroups: [],
    sections: [],
    subQuestionGroupLoading: true,
    subQuestionGroupError: null,
    subQuestionGroupSuccess: null
};

const subQuestionGroupSlice = createSlice({
    name: 'SubQuestionGroup',
    initialState,
    reducers: {
        setSubQuestionGroupLoading(state, action) {
            state.subQuestionGroupLoading = action.payload;
        },
        setSubQuestionGroupSuccess(state, action) {
            state.subQuestionGroupSuccess = action.payload;
        },
        setSubQuestionGroupError(state, action) {
            state.subQuestionGroupError = action.payload;
        },
        setSubQuestionGroupList(state, action) {
            state.subQuestionGroupList = action.payload;
        },
        setQuestionGroups(state, action) {
            state.questionGroups = action.payload;
        },
        setSections(state, action) {
            state.sections = action.payload;
        }
    },
});

export const {
    setSubQuestionGroupLoading,
    setSubQuestionGroupSuccess,
    setSubQuestionGroupError,
    setSubQuestionGroupList,
    setQuestionGroups,
    setSections
} = subQuestionGroupSlice.actions;

export default subQuestionGroupSlice.reducer;
