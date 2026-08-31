import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    matriaMedicaRemedies: [],
    rubricRemedyDetails: null,
    loading: true,
    error: null
};

const materiaMedicaRemediesSlice = createSlice({
    name: 'RemedicalRubric',
    initialState,
    reducers: {
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setRemedy(state, action) {
            state.matriaMedicaRemedies = action.payload;
        },
        setRubricRemedyDetails(state, action) {
            state.rubricRemedyDetails = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
        }
    },
});

export const {
    setLoading,
    setRemedy,
    setRubricRemedyDetails,
    setError
} = materiaMedicaRemediesSlice.actions;

export default materiaMedicaRemediesSlice.reducer;