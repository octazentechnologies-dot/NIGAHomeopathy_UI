import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  labTestLoading: false,
  labTestList: [],
  labTestError: null,
  labTestSuccess: null,
  labTestDetailsLoading: false,
  labTestDetailsSuccess: null,
  labTestDetailsError: null,
  selectedLabTest: null,
  selectedLabTestLoading: false,
  selectedLabTestError: null
};

const LabTestSlice = createSlice({
  name: "LabTest",
  initialState,
  reducers: {
    setLabTestLoading: (state, action) => {
      state.labTestLoading = action.payload;
    },
    setLabTestList: (state, action) => {
      state.labTestList = action.payload;
    },
    setLabTestError: (state, action) => {
      state.labTestError = action.payload;
    },
    setLabTestSuccess: (state, action) => {
      state.labTestSuccess = action.payload;
    },
    setLabTestDetailsLoading: (state, action) => {
      state.labTestDetailsLoading = action.payload;
    },
    setLabTestDetailsSuccess: (state, action) => {
      state.labTestDetailsSuccess = action.payload;
    },
    setLabTestDetailsError: (state, action) => {
      state.labTestDetailsError = action.payload;
    },
    setSelectedLabTest: (state, action) => {
      state.selectedLabTest = action.payload;
    },
    setSelectedLabTestLoading: (state, action) => {
      state.selectedLabTestLoading = action.payload;
    },
    setSelectedLabTestError: (state, action) => {
      state.selectedLabTestError = action.payload;
    }
  }
});

export const {
  setLabTestLoading,
  setLabTestList,
  setLabTestError,
  setLabTestSuccess,
  setLabTestDetailsLoading,
  setLabTestDetailsSuccess,
  setLabTestDetailsError,
  setSelectedLabTest,
  setSelectedLabTestLoading,
  setSelectedLabTestError
} = LabTestSlice.actions;

export default LabTestSlice.reducer; 