import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    authors: [],
    authorsLoading: true,
    authorError: null,
    authorSuccess: null
};

const authorSlice = createSlice({
    name: 'Authors',
    initialState,
    reducers: {
        setAuthorsLoading(state, action) {
            state.authorsLoading = action.payload
        },
        setAuthorsList(state, action) {
            state.authors = action.payload
        },
        setAuthorSuccess(state, action) {
            state.authorSuccess = action.payload
        },
        setAuthorError(state, action) {
            state.authorError = action.payload
        }
    },
});

export const {
    setAuthorsLoading,
    setAuthorsList,
    setAuthorSuccess,
    setAuthorError
} = authorSlice.actions;

export default authorSlice.reducer;