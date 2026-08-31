import {
  setRoleLoading,
  setRoleList,
  setRoleError,
  setRoleSuccess,
  setSelectedRole,
  setFirmList,
  setFirmLoading,
  setFirmError
} from "./reducer";
import {
  getRoleList as getRoleListApi,
  getRoleById as getRoleByIdApi,
  createRole as createRoleApi,
  updateRole as updateRoleApi,
  deleteRole as deleteRoleApi,
  getFirmDetails as getFirmDetailsApi
} from "../../../helpers/realbackend_helper";

/* Get Role List Api Call */
export const getRoleList = (data) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await getRoleListApi(data);
    dispatch(setRoleLoading(false));
    dispatch(setRoleList(response || []));
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Get Role By ID Api Call */
export const getRoleById = (roleId) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await getRoleByIdApi(roleId);
    dispatch(setSelectedRole(response));
    dispatch(setRoleLoading(false));
    return response;
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Create Role Api Call */
export const createRole = (data) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await createRoleApi(data);
    dispatch(setRoleLoading(false));
    // The API returns a success message string
    dispatch(setRoleSuccess(response || "RoleMaster Saved Successfully"));
    return response;
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Update Role Api Call */
export const updateRole = (data) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await updateRoleApi(data);
    dispatch(setRoleLoading(false));
    // The API returns a success message string
    dispatch(setRoleSuccess(response || "RoleMaster Updated Successfully"));
    return response;
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Delete Role Api Call */
export const deleteRole = (data) => async (dispatch) => {
  try {
    dispatch(setRoleLoading(true));
    const response = await deleteRoleApi(data);
    dispatch(setRoleLoading(false));
    dispatch(setRoleSuccess(response || "Role deleted successfully"));
    // Refresh the list after successful deletion
    dispatch(getRoleList());
    return response;
  } catch (error) {
    dispatch(setRoleError(error.message));
    dispatch(setRoleLoading(false));
  }
};

/* Get Firm Details Api Call */
export const getFirmDetails = (data) => async (dispatch) => {
  try {
    dispatch(setFirmLoading(true));
    const response = await getFirmDetailsApi(data);
    dispatch(setFirmList(response || []));
    dispatch(setFirmLoading(false));
  } catch (error) {
    dispatch(setFirmError(error.message));
    dispatch(setFirmLoading(false));
  }
};

