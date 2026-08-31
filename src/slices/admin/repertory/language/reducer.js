import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    languagesList: null,
    loading: false,
    languageError: null,
    languageSuccess: null
};

export const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        setLanguagesList: (state, action) => {
            state.languagesList = action.payload;
        },
        setLanguagesLoading: (state, action) => {
            state.loading = action.payload;
        },
        setLanguageError: (state, action) => {
            state.languageError = action.payload;
        },
        setLanguageSuccess: (state, action) => {
            state.languageSuccess = action.payload;
        }
    }
});

export const {
    setLanguagesList,
    setLanguagesLoading,
    setLanguageError,
    setLanguageSuccess
} = languageSlice.actions;

export default languageSlice.reducer;
