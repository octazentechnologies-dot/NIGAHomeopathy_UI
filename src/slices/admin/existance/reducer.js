import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loading: false,
    existanceSuccess: null,
    existanceError: null,
    questionSections: null
};

export const ExistanceSlice = createSlice({
    name: 'Existance',
    initialState,
    reducers: {
        setExistanceLoading: (state, action) => {
            state.loading = action.payload;
        },
        setExistanceList: (state, action) => {
            state.questionSections = action.payload;
        },
        setExistanceSuccess: (state, action) => {
            state.existanceSuccess = action.payload;
        },
        setExistanceError: (state, action) => {
            state.existanceError = action.payload;
        }
    }
});

export const { setExistanceLoading, setExistanceList, setExistanceSuccess, setExistanceError } = ExistanceSlice.actions;
export default ExistanceSlice.reducer; 