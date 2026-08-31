import {
  setUserError,
  setUserList,
  setUserLoading,
  setUserSuccess,
  setUserTotals,
  setRoleList,
  setRoleLoading,
  setRoleError,
  setSelectedUser
} from "./reducer";
import { getUserList as getUserListApi, getRoleMaster as getRoleMasterApi, createUser as createUserApi, updateUser as updateUserApi, getUserById as getUserByIdApi } from "../../../helpers/realbackend_helper";

/* Get User List Api Call */
export const getUserList = (data) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    const response = await getUserListApi(data);
    dispatch(setUserList(response?.resultObject || []));
    dispatch(
      setUserTotals({
        totalCount: response?.totalCount || 0,
        totalPageCount: response?.totalPageCount || 0
      })
    );
    dispatch(setUserLoading(false));
  } catch (error) {
    dispatch(setUserError(error.message));
    dispatch(setUserLoading(false));
  }
};

/* Get User By ID Api Call */
export const getUserById = (userId) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    const response = await getUserByIdApi(userId);
    dispatch(setSelectedUser(response));
    dispatch(setUserLoading(false));
    return response;
  } catch (error) {
    dispatch(setUserError(error.message));
    dispatch(setUserLoading(false));
  }
};

/* Get Role Master Api Call */
export const getRoleMaster = (data) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await getRoleMasterApi(data);
    dispatch(setRoleList(response || []));
    dispatch(setRoleLoading(false));
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Create User Api Call */
export const createUser = (data) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    const response = await createUserApi(data);
    dispatch(setUserLoading(false));
    // The API returns a success message string
    dispatch(setUserSuccess(response || "User created successfully"));
    return response;
  } catch (error) {
    dispatch(setUserError(error.message));
    dispatch(setUserLoading(false));
  }
};

/* Update User Api Call */
export const updateUser = (data) => async (dispatch) => {
  try {
    dispatch(setUserLoading(true));
    const response = await updateUserApi(data);
    dispatch(setUserLoading(false));
    // The API returns a success message string
    dispatch(setUserSuccess(response || "User updated successfully"));
    return response;
  } catch (error) {
    dispatch(setUserError(error.message));
    dispatch(setUserLoading(false));
  }
};

