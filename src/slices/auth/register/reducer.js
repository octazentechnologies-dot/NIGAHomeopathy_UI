import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  registrationError: null,
  message: null,
  loading: false,
  user: null,
  success: false,
  error: false
};

const registerSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    registerUserSuccessful(state, action) {
      state.user = action.payload;
      state.loading = false;
      state.success = true;
      state.error = false;
      state.registrationError = null;
      state.message = action.payload?.message || null;
    },
    registerUserFailed(state, action) {
      state.user = null;
      state.loading = false;
      state.registrationError = action.payload;
      state.error = true;
      state.success = false;
    },
    registerUserLoading(state) {
      state.loading = true;
      state.error = false;
      state.success = false;
      state.registrationError = null;
    },
    resetRegisterFlagChange(state) {
      state.success = false;
      state.error = false;
      state.registrationError = null;
      state.message = null;
      state.loading = false;
    },
    apiErrorChange(state, action){
      state.error = action.payload;
      state.loading = false;
      state.isUserLogout = false;
    }
  }
});

export const {
  registerUserSuccessful,
  registerUserFailed,
  registerUserLoading,
  resetRegisterFlagChange,
  apiErrorChange
} = registerSlice.actions;

export default registerSlice.reducer;