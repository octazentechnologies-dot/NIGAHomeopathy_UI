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
import { normalizeAuthSubscription, pickSubscriptionStatus, isDevClinicDoctorName } from "../../../helpers/client_error_reporter";
import { UserRole } from '../../../Components/constants/roles';
import { changeLayout, changeSidebarVisibility } from '../../../slices/thunks';
import { layoutTypes, sidebarVisibilitytypes } from '../../../Components/constants/layout';
import { clearSignedOut, markSignedOut } from '../../../helpers/signedOutHistory';

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
      normalizeAuthSubscription(authUser, user?.userName || user?.username || "");
      sessionStorage.setItem("authUser", JSON.stringify(authUser));
      clearSignedOut();
      dispatch(loginSuccess(authUser));

      const role = authUser.role || authUser.Role;

      if (role === UserRole.ADMIN) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
        dispatch(changeLayout(layoutTypes.HORIZONTAL));
        history('/dashboard')
      } else if (role === UserRole.DOCTOR) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
        // Clear admin horizontal layout so page-content does not keep nav-bar gap
        dispatch(changeLayout(layoutTypes.SEMIBOX));
        dispatch(fetchPatientBoardBackupSummary());
        history('/doctordashboard')
      } else if (role === UserRole.RECEPTION) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
        dispatch(changeLayout(layoutTypes.SEMIBOX));
        history('/reception')
      } else if (role === UserRole.ACCOUNT) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
        dispatch(changeLayout(layoutTypes.HORIZONTAL));
        history('/accountdashboard')
      } else if (
        role === UserRole.PHARMACY ||
        role === UserRole.PHARMACY_PARTNER
      ) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
        dispatch(changeLayout(layoutTypes.HORIZONTAL));
        history('/pharmacydashboard')
      } else if (role === UserRole.PATIENT) {
        dispatch(loginLoading(false));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
        dispatch(changeLayout(layoutTypes.HORIZONTAL));
        history('/family')
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
    const message =
      typeof error === "string"
        ? error
        : error?.message || error?.data?.message || "Invalid username or password";
    dispatch(apiError(message));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    dispatch(clearPatientBoardSession());
    dispatch(clearPatientBoardBackupSummary());
    try {
      const { logoutApi } = await import("../../../helpers/realbackend_helper");
      await logoutApi();
    } catch {
      // Best-effort Old-API + New-API revoke (SEC-03.01)
    }
    markSignedOut();
    document.body.classList.remove('admin-layout', 'doctor-layout', 'admin-forms-ui', 'admin-dashboard-route', 'admin-mobile-topbar');
    // Reset layout attribute so the next role does not inherit admin horizontal spacing
    dispatch(changeLayout(layoutTypes.SEMIBOX));
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
  const parsed = pickSubscriptionStatus(status);
  const existing = auth?.data || auth;
  const loginName = existing?.userName || existing?.UserName;
  const active = parsed.isPlanActive === true || isDevClinicDoctorName(loginName);
  const subscriptionFields = {
    daysRemaining: active ? (parsed.daysRemaining > 0 ? parsed.daysRemaining : 365) : parsed.daysRemaining,
    isPlanActive: active,
    IsPlanActive: active,
    islastFiveDays: parsed.islastFiveDays,
    IslastFiveDays: parsed.islastFiveDays,
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