import { createSlice } from '@reduxjs/toolkit';
import { setAuthorsList } from '../author/reducer';

const initialState = {
    heads: [],
    authors: [],
    headsLoading: true,
    headError: null,
    headSuccess: null
};

const headSlice = createSlice({
    name: 'Heads',
    initialState,
    reducers: {
        setHeadsLoading(state, action) {
            state.headsLoading = action.payload;
        },
        setHeadsList(state, action) {
            state.heads = action.payload;
        },
        setAuthors(state, action) {
            state.authors = action.payload;
        },
        setHeadSuccess(state, action) {
            state.headSuccess = action.payload;
        },
        setHeadError(state, action) {
            state.headError = action.payload;
        }
    },
});

export const {
    setHeadsLoading,
    setHeadsList,
    setAuthors,
    setHeadSuccess,
    setHeadError
} = headSlice.actions;

export default headSlice.reducer;