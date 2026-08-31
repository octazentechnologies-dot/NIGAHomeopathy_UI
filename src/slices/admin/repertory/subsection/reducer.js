import { createSlice } from '@reduxjs/toolkit';
import { languages } from 'prismjs';

const initialState = {
    subSectionList: [],
    subSectionError: null,
    subSectionSuccess: null,
    loading: false,
    sectionForSubSection: [],
    subSectionBySection: [],
    subSectionById: null,
    languages: []
};

export const subSectionSlice = createSlice({
    name: 'SubSection',
    initialState,
    reducers: {
        setSubSectionList: (state, action) => {
            state.subSectionList = action.payload;
        },
        setSubSectionError: (state, action) => {
            state.subSectionError = action.payload;
        },
        setSubSectionSuccess: (state, action) => {
            state.subSectionSuccess = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSectionForSubSection: (state, action) => {
            state.sectionForSubSection = action.payload;
        },
        setSubSectionBySection: (state, action) => {
            state.subSectionBySection = action.payload;
        },
        setLanguages: (state, action) => {
            state.languages = action.payload;
        },
        setSubSectionById: (state, action) => {
            state.subSectionById = action.payload;
        },
        clearSubSectionState: (state) => {
            state.subSectionError = null;
            state.subSectionSuccess = null;
        }
    }
});

export const {
    setSubSectionList,
    setSubSectionError,
    setSubSectionSuccess,
    setLoading,
    setLanguages,
    setSectionForSubSection,
    clearSubSectionState,
    setSubSectionBySection,
    setSubSectionById
} = subSectionSlice.actions;

export default subSectionSlice.reducer;


