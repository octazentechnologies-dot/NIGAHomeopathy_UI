import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  meshKeyMasterList: null,
  loading: false,
  meshKeyMasterError: null,
  meshKeyMasterSuccess: null,
};

export const meshKeyMasterSlice = createSlice({
  name: "meshKeyMaster",
  initialState,
  reducers: {
    setMeshKeyMasterList: (state, action) => {
      state.meshKeyMasterList = action.payload;
    },
    setMeshKeyMasterLoading: (state, action) => {
      state.loading = action.payload;
    },
    setMeshKeyMasterError: (state, action) => {
      state.meshKeyMasterError = action.payload;
    },
    setMeshKeyMasterSuccess: (state, action) => {
      state.meshKeyMasterSuccess = action.payload;
    },
  },
});

export const {
  setMeshKeyMasterList,
  setMeshKeyMasterLoading,
  setMeshKeyMasterError,
  setMeshKeyMasterSuccess,
} = meshKeyMasterSlice.actions;

export default meshKeyMasterSlice.reducer;
