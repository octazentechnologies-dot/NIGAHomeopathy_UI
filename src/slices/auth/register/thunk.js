import { registerDoctor as registerDoctorApi } from "../../../helpers/realbackend_helper";
import {
  registerUserSuccessful,
  registerUserFailed,
  registerUserLoading,
  resetRegisterFlagChange,
  apiErrorChange
} from "./reducer";

export const registerUser = (user) => async (dispatch) => {
  try {
    dispatch(registerUserLoading());
    const response = await registerDoctorApi(user);

    if (response?.success === true || (typeof response === "string" && response.toLowerCase().includes("success"))) {
      dispatch(registerUserSuccessful({
        message: response?.message || response || "Registration successful",
        userName: user.userName,
        emailId: user.emailId,
      }));
      return;
    }

    const failureMessage =
      response?.message ||
      (typeof response === "string" ? response : null) ||
      "Registration failed. Please try again.";

    dispatch(registerUserFailed(failureMessage));
  } catch (error) {
    const message =
      (typeof error === "string" && error) ||
      error?.message ||
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error.response.data : null) ||
      "Registration failed. Please try again.";
    dispatch(registerUserFailed(message));
  }
};

export const resetRegisterFlag = () => {
  try {
    return resetRegisterFlagChange();
  } catch (error) {
    return error;
  }
};

export const apiError = () => {
  try {
    return apiErrorChange("");
  } catch (error) {
    return error;
  }
};
