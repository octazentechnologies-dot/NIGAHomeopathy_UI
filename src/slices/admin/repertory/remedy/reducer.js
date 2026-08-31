import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    remedyList: [],
    termalDDLList: [],
    loading: false,
    singleRemedy: null,
    remedyError: null,
    remedySuccess: null
};

const remedySlice = createSlice({
    name: 'Remedy',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setRemedyList: (state, action) => {
            state.remedyList = action.payload;
        },
        setTermalDDLList: (state, action) => {
            state.termalDDLList = action.payload
        },
        setSingleRemedy: (state, action) => {
            state.singleRemedy = action.payload
        },
        setRemedyError: (state, action) => {
            state.remedyError = action.payload;
        },
        setRemedySuccess: (state, action) => {
            state.remedySuccess = action.payload
        }
    }
});

export const { setLoading, setRemedyList, setRemedyError, setRemedySuccess, setTermalDDLList, setSingleRemedy } = remedySlice.actions;

export default remedySlice.reducer;
