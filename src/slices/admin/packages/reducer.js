import { createSlice } from "@reduxjs/toolkit";

// TODO(Packages): stub — real Tedarikci admin slice was never committed.
// Keeps `Package: PackageReducer` in src/slices/index.js compiling until the
// module (pages + thunk + API wiring) is restored. No live code reads this
// state; DoctorDashboard packages use their own slice.

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
