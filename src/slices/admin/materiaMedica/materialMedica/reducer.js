import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {
    materiaMedica: [],
    materiaMedicaAuthors: [],
    matriaMedicaRemediesDDL: [],
    materiaMedicaHeads: [],
    matriaMedicaRemedies: [],
    materiaMedicaLoading: true,
    materiaMedicaError: null,
    materiaMedicaSuccess: null,
    materiaMedicaDetails: null
};

const materiaMedicaSlice = createSlice({
    name: 'MateriaMedica',
    initialState,
    reducers: {
        setMateriaMedicaLoading(state, action) {
            state.materiaMedicaLoading = action.payload;
        },
        setMateriaMedicaList(state, action) {
            state.materiaMedica = action.payload;
        },
        setMateriaMedicaSuccess(state, action) {
            state.materiaMedicaSuccess = action.payload;
        },
        setMateriaMedicaError(state, action) {
            state.materiaMedicaError = action.payload;
        },
        setAuthorsForMateriaMedicaDDL(state, action) {
            state.materiaMedicaAuthors = action.payload;
        },
        setRemedyDDL(state, action) {
            state.matriaMedicaRemediesDDL = action.payload;
        },
        setRemedy(state, action) {
            state.matriaMedicaRemedies = action.payload;
        },
        setMateriaMedicaHeads(state, action) {
            state.materiaMedicaHeads = action.payload;
        },
        setMateriaMedicaDetails(state, action) {
            state.materiaMedicaDetails = action.payload;
        }
    },
});

export const {
    setMateriaMedicaLoading,
    setMateriaMedicaList,
    setMateriaMedicaSuccess,
    setMateriaMedicaError,
    setAuthorsForMateriaMedicaDDL,
    setRemedyDDL,
    setRemedy,
    setMateriaMedicaHeads,
    setMateriaMedicaDetails
} = materiaMedicaSlice.actions;

export default materiaMedicaSlice.reducer;