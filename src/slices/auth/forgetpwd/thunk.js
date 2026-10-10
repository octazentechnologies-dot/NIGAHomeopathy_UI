import {
  userForgetPasswordLoading,
  userForgetPasswordSuccess,
  userForgetPasswordError,
} from "./reducer";
import { forgotPasswordSecure } from "../../../helpers/realbackend_helper";

/** SEC-02.03 — real API ForgotPassword (no fake/Firebase). */
export const userForgetPassword = (user) => async (dispatch) => {
  try {
    const email = user?.email;
    if (!email) {
      dispatch(userForgetPasswordError("Please Enter Your Email or username"));
      return;
    }
    dispatch(userForgetPasswordLoading(true));
    const response = await forgotPasswordSecure(email, user?.userId);
    const body = response?.data ?? response;
    if (body?.needsRole) {
      dispatch(userForgetPasswordError(body.message || "Choose which role to reset."));
      return;
    }
    const message =
      body?.message ||
      "If an account exists for that email, a password reset link has been sent.";
    dispatch(
      userForgetPasswordSuccess({
        message,
        resetLink: body?.resetLink || null,
        mailSent: body?.mailSent,
      })
    );
  } catch (forgetError) {
    if (forgetError?.response?.status === 404) {
      dispatch(
        userForgetPasswordError("If an account exists for those details, a password reset link has been sent.")
      );
      return;
    }
    const msg =
      (typeof forgetError === "string" && forgetError) ||
      forgetError?.response?.data?.message ||
      forgetError?.message ||
      "Unable to send reset link. Please try again.";
    dispatch(userForgetPasswordError(msg));
  }
};
