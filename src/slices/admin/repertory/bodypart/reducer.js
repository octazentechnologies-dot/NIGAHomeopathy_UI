import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    bodyPartsList: [],
    sectionForSubSection: [],
    loading: false,
    bodyPartError: null,
    bodyPartSuccess: null
};

const bodyPartSlice = createSlice({
    name: 'BodyPart',
    initialState,
    reducers: {
        setBodyPartsList: (state, action) => {
            state.bodyPartsList = action.payload;
        },
        setBodyPartsLoading: (state, action) => {
            state.loading = action.payload;
        },
        setBodyPartError: (state, action) => {
            state.bodyPartError = action.payload;
            state.bodyPartSuccess = null;
        },
        setBodyPartSuccess: (state, action) => {
            state.bodyPartSuccess = action.payload;
            state.bodyPartError = null;
        },
        resetBodyPartState: (state) => {
            state.bodyPartError = null;
            state.bodyPartSuccess = null;
        },
        setSectionForSubSection: (state, action) => {
            state.sectionForSubSection = action.payload;
        },
    }
});

export const {
    setBodyPartsList,
    setBodyPartsLoading,
    setBodyPartError,
    setBodyPartSuccess,
    resetBodyPartState,
    setSectionForSubSection
} = bodyPartSlice.actions;

export default bodyPartSlice.reducer;
