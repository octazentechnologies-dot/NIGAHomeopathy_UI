import { createSlice } from "@reduxjs/toolkit";
import { set } from "lodash";

export const initialState = {
    sectionLoading: true,
    sectionSuccess: null,
    sectionError: null,
    sectionList: []
};

const SectionSlice = createSlice({
    name: 'Section',
    initialState,
    reducers: {
        setSectionLoading(state, action) {
            state.sectionLoading = action.payload
        },
        setSectionList(state, action) {
            state.sectionList = action.payload
        },
        setSectionSuccess(state, action) {
            state.sectionSuccess = action.payload
        },
        setSectionError(state, action) {
            state.sectionError = action.payload
        }
    }
});

export const {
    setSectionLoading,
    setSectionList,
    setSectionSuccess,
    setSectionError
} = SectionSlice.actions;

export default SectionSlice.reducer;