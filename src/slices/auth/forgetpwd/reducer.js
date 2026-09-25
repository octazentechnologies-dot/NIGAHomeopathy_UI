import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  forgetSuccessMsg: null,
  forgetError: null,
  resetLink: null,
  mailSent: null,
  forgetLoading: false,
};

const forgotPasswordSlice = createSlice({
  name: "forgotpwd",
  initialState,
  reducers: {
      userForgetPasswordLoading(state, action) {
          state.forgetLoading = Boolean(action.payload);
          if (action.payload) {
              state.forgetError = null;
          }
      },
      userForgetPasswordSuccess(state, action) {
          const payload = action.payload;
          if (payload && typeof payload === "object") {
              state.forgetSuccessMsg = payload.message || null;
              state.resetLink = payload.resetLink || null;
              state.mailSent = payload.mailSent;
          } else {
              state.forgetSuccessMsg = payload;
              state.resetLink = null;
              state.mailSent = null;
          }
          state.forgetError = null;
          state.forgetLoading = false;
      },
      userForgetPasswordError(state, action) {
          state.forgetError = action.payload;
          state.forgetSuccessMsg = null;
          state.resetLink = null;
          state.mailSent = null;
          state.forgetLoading = false;
      },
      userForgetPasswordReset() {
          return { ...initialState };
      },
  },
});

export const {
  userForgetPasswordLoading,
  userForgetPasswordSuccess,
  userForgetPasswordError,
  userForgetPasswordReset,
} = forgotPasswordSlice.actions

export default forgotPasswordSlice.reducer;
