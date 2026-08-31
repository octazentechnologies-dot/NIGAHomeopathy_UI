import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loading: false,
    success: null,
    error: null,
    questionGroups: null
};

export const QuestionGroupSlice = createSlice({
    name: 'QuestionGroup',
    initialState,
    reducers: {
        setQuestionGroupLoading: (state, action) => {
            state.loading = action.payload;
        },
        setQuestionGroupList: (state, action) => {
            state.questionGroups = action.payload;
        },
        setQuestionGroupSuccess: (state, action) => {
            state.success = action.payload;
        },
        setQuestionGroupError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const {
    setQuestionGroupLoading,
    setQuestionGroupList,
    setQuestionGroupSuccess,
    setQuestionGroupError
} = QuestionGroupSlice.actions;

export default QuestionGroupSlice.reducer; 