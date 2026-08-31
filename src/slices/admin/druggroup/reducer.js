import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    drugGroupLoading: true,
    drugGroupSuccess: null,
    drugGroupError: null,
    drugGroupList: [],
    selectedDrugGroup: null
};

const DrugGroupSlice = createSlice({
    name: 'DrugGroup',
    initialState,
    reducers: {
        setDrugGroupLoading(state, action) {
            state.drugGroupLoading = action.payload
        },
        setDrugGroupList(state, action) {
            state.drugGroupList = action.payload
        },
        setDrugGroupSuccess(state, action) {
            state.drugGroupSuccess = action.payload
        },
        setDrugGroupError(state, action) {
            state.drugGroupError = action.payload
        },
        setSelectedDrugGroup(state, action) {
            state.selectedDrugGroup = action.payload
        }
    }
});

export const {
    setDrugGroupLoading,
    setDrugGroupList,
    setDrugGroupSuccess,
    setDrugGroupError,
    setSelectedDrugGroup
} = DrugGroupSlice.actions;

export default DrugGroupSlice.reducer; 