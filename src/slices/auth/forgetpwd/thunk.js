import { userForgetPasswordSuccess, userForgetPasswordError } from "./reducer";
import { forgotPasswordSecure } from "../../../helpers/realbackend_helper";

/** SEC-02.03 — real New-API ForgotPassword (no fake/Firebase). */
export const userForgetPassword = (user) => async (dispatch) => {
  try {
    const email = user?.email;
    if (!email) {
      dispatch(userForgetPasswordError("Please Enter Your Email"));
      return;
    }
    const response = await forgotPasswordSecure(email);
    const body = response?.data ?? response;
    const message =
      body?.message ||
      "If an account exists for that email, a password reset link has been sent.";
    dispatch(userForgetPasswordSuccess(message));
  } catch (forgetError) {
    const msg =
      forgetError?.response?.data?.message ||
      forgetError?.message ||
      "Unable to send reset link. Please try again.";
    dispatch(userForgetPasswordError(msg));
  }
};
