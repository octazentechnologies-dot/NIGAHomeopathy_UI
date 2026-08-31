import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    materiaMedicaAuthors: [],
    matriaMedicaRemedies: [],
    materiaMedicaRemediesDetails: null,
    materiaMedicaRemediesLoading: true,
    materiaMedicaError: null,
    materiaMedicaSuccess: null
};

const materiaMedicaRemediesSlice = createSlice({
    name: 'MateriaMedicaRemedies',
    initialState,
    reducers: {
        setMateriaMedicaLoading(state, action) {
            state.materiaMedicaRemediesLoading = action.payload;
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
        setRemedy(state, action) {
            state.matriaMedicaRemedies = action.payload;
        },
        setMateriaMedicaRemediesDetails(state, action) {
            state.materiaMedicaRemediesDetails = action.payload
        }
    },
});

export const {
    setMateriaMedicaLoading,
    setMateriaMedicaSuccess,
    setMateriaMedicaError,
    setAuthorsForMateriaMedicaDDL,
    setRemedy,
    setMateriaMedicaRemediesDetails
} = materiaMedicaRemediesSlice.actions;

export default materiaMedicaRemediesSlice.reducer;