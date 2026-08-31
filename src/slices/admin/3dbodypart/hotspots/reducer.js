import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  anatomyHotspotList: null,
  loading: false,
  anatomyHotspotError: null,
  anatomyHotspotSuccess: null,
};

export const anatomyHotspotSlice = createSlice({
  name: "anatomyHotspot",
  initialState,
  reducers: {
    setAnatomyHotspotList: (state, action) => {
      state.anatomyHotspotList = action.payload;
    },
    setAnatomyHotspotLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAnatomyHotspotError: (state, action) => {
      state.anatomyHotspotError = action.payload;
    },
    setAnatomyHotspotSuccess: (state, action) => {
      state.anatomyHotspotSuccess = action.payload;
    },
  },
});

export const {
  setAnatomyHotspotList,
  setAnatomyHotspotLoading,
  setAnatomyHotspotError,
  setAnatomyHotspotSuccess,
} = anatomyHotspotSlice.actions;

export default anatomyHotspotSlice.reducer;
