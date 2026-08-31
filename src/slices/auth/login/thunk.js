//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  postFakeLogin,
  postJwtLogin,
  postSocialLogin,
} from "../../../helpers/fakebackend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag, loginLoading, updateSubscriptionStatus } from './reducer';
import { clearPatientBoardSession } from '../../doctor/patientBoardSession/reducer';
import { clearPatientBoardBackupSummary } from '../../doctor/patientBoardBackup/reducer';
import { fetchPatientBoardBackupSummary } from '../../doctor/patientBoardBackup/thunk';
import { login as loginApi, getSubscriptionStatus as getSubscriptionStatusApi } from "../../../helpers/realbackend_helper";
import { UserRole } from '../../../Components/constants/roles';
import { changeSidebarVisibility } from '../../../slices/thunks';
import { sidebarVisibilitytypes } from '../../../Components/constants/layout';

// const fireBaseBackend = getFirebaseBackend();

export const loginUser = (user, history) => async (dispatch) => {
  try {
    /* if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      let fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.loginUser(
        user.email,
        user.password
      );
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      response = postJwtLogin({
        email: user.email,
        password: user.password
      });

    } else if (process.env.REACT_APP_API_URL) {
      response = postFakeLogin({
        email: user.email,
        password: user.password,
      });
    } */

    console.log("user :", user);
    dispatch(loginLoading(true));
    const response = await loginApi(user);
    const body = response?.data ?? response;
    const data = body?.data ?? body?.resultObject ?? body;

    console.log("data :", data);

    if (data?.token || data?.Token) {
      const authUser = data?.token ? data : { ...data, token: data.Token };
      sessionStorage.setItem("authUser", JSON.stringify(authUser));
      dispatch(loginSuccess(authUser));

      if (authUser.role === UserRole.ADMIN) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
        history('/dashboard')
      } else if (authUser.role === UserRole.DOCTOR) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
        dispatch(fetchPatientBoardBackupSummary());
        history('/doctordashboard')
      } else if (authUser.role === UserRole.RECEPTION) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
        dispatch(fetchPatientBoardBackupSummary());
        history('/doctordashboard')
      }

      /*  if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
         var finallogin = JSON.stringify(data);
         finallogin = JSON.parse(finallogin)
         data = finallogin.data;
         if (finallogin.status === "success") {
           dispatch(loginSuccess(data));
           history('/dashboard')
         } else {
           dispatch(apiError(finallogin));
         }
       } else {
         dispatch(loginSuccess(data));
         history('/dashboard')
       } */
    } else {
      dispatch(loginLoading(false));
      dispatch(apiError(body?.message || 'Login failed. Please check username and password.'));
    }
  } catch (error) {
    dispatch(loginLoading(false));
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    dispatch(clearPatientBoardSession());
    dispatch(clearPatientBoardBackupSummary());
    sessionStorage.removeItem("authUser");
    let fireBaseBackend = getFirebaseBackend();
    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const response = fireBaseBackend.logout;
      dispatch(logoutUserSuccess(response));
    } else {
      dispatch(logoutUserSuccess(true));
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const socialLogin = (type, history) => async (dispatch) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      const fireBaseBackend = getFirebaseBackend();
      response = fireBaseBackend.socialLoginUser(type);
    }
    //  else {
    //   response = postSocialLogin(data);
    // }

    const socialdata = await response;
    if (socialdata) {
      sessionStorage.setItem("authUser", JSON.stringify(response));
      dispatch(loginSuccess(response));
      history('/dashboard')
    }

  } catch (error) {
    dispatch(apiError(error));
  }
};

export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};

const applySubscriptionStatusToAuthStorage = (status) => {
  const authUserStr = sessionStorage.getItem("authUser");
  if (!authUserStr || !status) {
    return null;
  }

  const auth = JSON.parse(authUserStr);
  const subscriptionFields = {
    daysRemaining: status.daysRemaining ?? 0,
    isPlanActive: status.isPlanActive ?? false,
    islastFiveDays: status.islastFiveDays ?? false,
  };

  const updatedAuth = auth?.data
    ? { ...auth, data: { ...auth.data, ...subscriptionFields } }
    : { ...auth, ...subscriptionFields };

  sessionStorage.setItem("authUser", JSON.stringify(updatedAuth));
  return auth?.data ? updatedAuth.data : updatedAuth;
};

export const refreshAuthSubscriptionStatus = () => async (dispatch) => {
  try {
    const response = await getSubscriptionStatusApi();
    const status = response?.data ?? response;
    const updatedUser = applySubscriptionStatusToAuthStorage(status);

    if (updatedUser) {
      dispatch(updateSubscriptionStatus({
        daysRemaining: updatedUser.daysRemaining,
        isPlanActive: updatedUser.isPlanActive,
        islastFiveDays: updatedUser.islastFiveDays,
      }));
    }

    return status;
  } catch (error) {
    console.error("Failed to refresh subscription status:", error);
    return null;
  }
};