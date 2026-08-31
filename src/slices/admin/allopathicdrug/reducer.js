import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    allopathicDrugLoading: true,
    allopathicDrugSuccess: null,
    allopathicDrugError: null,
    allopathicDrugList: [],
    selectedAllopathicDrug: null
};

const AllopathicDrugSlice = createSlice({
    name: 'AllopathicDrug',
    initialState,
    reducers: {
        setAllopathicDrugLoading(state, action) {
            state.allopathicDrugLoading = action.payload
        },
        setAllopathicDrugList(state, action) {
            state.allopathicDrugList = action.payload
        },
        setAllopathicDrugSuccess(state, action) {
            state.allopathicDrugSuccess = action.payload
        },
        setAllopathicDrugError(state, action) {
            state.allopathicDrugError = action.payload
        },
        setSelectedAllopathicDrug(state, action) {
            state.selectedAllopathicDrug = action.payload
        }
    }
});

export const {
    setAllopathicDrugLoading,
    setAllopathicDrugList,
    setAllopathicDrugSuccess,
    setAllopathicDrugError,
    setSelectedAllopathicDrug
} = AllopathicDrugSlice.actions;

export default AllopathicDrugSlice.reducer; 