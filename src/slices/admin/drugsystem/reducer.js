import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    drugSystemLoading: true,
    drugSystemSuccess: null,
    drugSystemError: null,
    drugSystemList: []
};

const DrugSystemSlice = createSlice({
    name: 'DrugSystem',
    initialState,
    reducers: {
        setDrugSystemLoading(state, action) {
            state.drugSystemLoading = action.payload
        },
        setDrugSystemList(state, action) {
            state.drugSystemList = action.payload
        },
        setDrugSystemSuccess(state, action) {
            state.drugSystemSuccess = action.payload
        },
        setDrugSystemError(state, action) {
            state.drugSystemError = action.payload
        }
    }
});

export const {
    setDrugSystemLoading,
    setDrugSystemList,
    setDrugSystemSuccess,
    setDrugSystemError
} = DrugSystemSlice.actions;

export default DrugSystemSlice.reducer; 