import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  anatomySectionMasterList: null,
  loading: false,
  anatomySectionMasterError: null,
  anatomySectionMasterSuccess: null,
};

export const anatomySectionMasterSlice = createSlice({
  name: "anatomySectionMaster",
  initialState,
  reducers: {
    setAnatomySectionMasterList: (state, action) => {
      state.anatomySectionMasterList = action.payload;
    },
    setAnatomySectionMasterLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAnatomySectionMasterError: (state, action) => {
      state.anatomySectionMasterError = action.payload;
    },
    setAnatomySectionMasterSuccess: (state, action) => {
      state.anatomySectionMasterSuccess = action.payload;
    },
  },
});

export const {
  setAnatomySectionMasterList,
  setAnatomySectionMasterLoading,
  setAnatomySectionMasterError,
  setAnatomySectionMasterSuccess,
} = anatomySectionMasterSlice.actions;

export default anatomySectionMasterSlice.reducer;
