import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  user: {},
  error: "", // for error message
  loading: false,
  isUserLogout: false,
  errorMsg: false, // for error
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    loginLoading(state, action) {
      state.loading = action.payload;
    },
    apiError(state, action) {
      const payload = action.payload;
      if (typeof payload === 'string') {
        state.error = payload;
      } else if (payload?.message) {
        state.error = payload.message;
      } else if (typeof payload?.data === 'string') {
        state.error = payload.data;
      } else {
        state.error = payload?.data?.message || 'Login failed. Please try again.';
      }
      state.loading = false;
      state.isUserLogout = false;
      state.errorMsg = true;
    },
    loginSuccess(state, action) {
      state.user = action.payload
      state.loading = false;
      state.errorMsg = false;
      state.isUserLogout = false;
    },
    logoutUserSuccess(state, action) {
      state.isUserLogout = true
    },
    reset_login_flag(state) {
      state.error = null
      state.loading = false;
      state.errorMsg = false;
    },
    updateSubscriptionStatus(state, action) {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    }
  },
});

export const {
  apiError,
  loginSuccess,
  logoutUserSuccess,
  reset_login_flag,
  loginLoading,
  updateSubscriptionStatus,
} = loginSlice.actions

export default loginSlice.reducer;