import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  forgetSuccessMsg: null,
  forgetError: null,
  resetLink: null,
  mailSent: null,
};

const forgotPasswordSlice = createSlice({
  name: "forgotpwd",
  initialState,
  reducers: {
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
      },
      userForgetPasswordError(state, action) {
          state.forgetError = action.payload;
          state.forgetSuccessMsg = null;
          state.resetLink = null;
          state.mailSent = null;
      },
  },
});

export const {
  userForgetPasswordSuccess,
  userForgetPasswordError
} = forgotPasswordSlice.actions

export default forgotPasswordSlice.reducer;
