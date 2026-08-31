import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    intensitiesList: null,
    loading: false,
    intensityError: null,
    intensitySuccess: null
};

const intensitySlice = createSlice({
    name: 'Intensity',
    initialState,
    reducers: {
        setIntensitiesList: (state, action) => {
            state.intensitiesList = action.payload;
        },
        setIntensitiesLoading: (state, action) => {
            state.loading = action.payload;
        },
        setIntensityError: (state, action) => {
            state.intensityError = action.payload;
        },
        setIntensitySuccess: (state, action) => {
            state.intensitySuccess = action.payload;
        }
    }
});

export const { setIntensitiesList, setIntensitiesLoading, setIntensityError, setIntensitySuccess } = intensitySlice.actions;
export default intensitySlice.reducer;
