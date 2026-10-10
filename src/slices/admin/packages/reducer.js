import { createSlice } from "@reduxjs/toolkit";

// Admin > Packages master (/admin/listpackage). The doctor dashboard buy-package flow uses its own slice.

const initialState = {
  packageLoading: false,
  packageList: [],
  packageError: null,
  packageSuccess: null,
};

const PackageSlice = createSlice({
  name: "Packages",
  initialState,
  reducers: {
    setPackageLoading: (state, action) => {
      state.packageLoading = action.payload;
    },
    setPackageList: (state, action) => {
      state.packageList = action.payload;
    },
    setPackageError: (state, action) => {
      state.packageError = action.payload;
    },
    setPackageSuccess: (state, action) => {
      state.packageSuccess = action.payload;
    },
  },
});

export const {
  setPackageLoading,
  setPackageList,
  setPackageError,
  setPackageSuccess,
} = PackageSlice.actions;

export default PackageSlice.reducer;
