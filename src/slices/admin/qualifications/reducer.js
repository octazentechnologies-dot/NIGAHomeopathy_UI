import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  qualificationLoading: false,
  qualificationList: [],
  qualificationError: null,
  qualificationSuccess: null,
};

const QualificationSlice = createSlice({
  name: "Qualification",
  initialState,
  reducers: {
    setQualificationLoading: (state, action) => {
      state.qualificationLoading = action.payload;
    },
    setQualificationList: (state, action) => {
      state.qualificationList = action.payload;
    },
    setQualificationError: (state, action) => {
      state.qualificationError = action.payload;
    },
    setQualificationSuccess: (state, action) => {
      state.qualificationSuccess = action.payload;
    },
  },
});

export const {
  setQualificationLoading,
  setQualificationList,
  setQualificationError,
  setQualificationSuccess,
} = QualificationSlice.actions;

export default QualificationSlice.reducer;
