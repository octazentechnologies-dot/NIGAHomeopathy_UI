import {
  setPackageLoading,
  setPackageList,
  setPackageError,
  setPackageSuccess,
} from "./reducer";
import {
  getPackageList as getPackageListApi,
  deletePackage as deletePackageApi,
  createPackage as createPackageApi,
  updatePackage as updatePackageApi,
} from "../../../helpers/realbackend_helper";

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.resultObject)) return response.resultObject;
  if (Array.isArray(response?.Data)) return response.Data;
  return [];
};

const unwrapMessage = (response, fallback) => {
  if (typeof response === "string" && response.trim()) return response;
  if (response?.message) return response.message;
  if (response?.Message) return response.Message;
  return fallback;
};

export const getPackageList = (data) => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await getPackageListApi(data);
    dispatch(setPackageList(unwrapList(response)));
    dispatch(setPackageLoading(false));
  } catch (error) {
    dispatch(setPackageError(error?.message || error || "Failed to load packages"));
    dispatch(setPackageLoading(false));
  }
};

export const deletePackage = (packageModel) => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await deletePackageApi(packageModel);
    dispatch(setPackageLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setPackageError(unwrapMessage(response, "Failed to delete package")));
      return;
    }

    dispatch(setPackageSuccess(unwrapMessage(response, "Package deleted successfully")));
    dispatch(getPackageList());
  } catch (error) {
    dispatch(setPackageError(error?.message || error || "Failed to delete package"));
    dispatch(setPackageLoading(false));
  }
};

export const createPackage = (data) => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await createPackageApi(data);
    dispatch(setPackageLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setPackageError(unwrapMessage(response, "Failed to create package")));
      return response;
    }

    dispatch(setPackageSuccess(unwrapMessage(response, "Package created successfully")));
    return response;
  } catch (error) {
    dispatch(setPackageError(error?.message || error || "Failed to create package"));
    dispatch(setPackageLoading(false));
  }
};

export const updatePackage = (data) => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await updatePackageApi(data);
    dispatch(setPackageLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setPackageError(unwrapMessage(response, "Failed to update package")));
      return response;
    }

    dispatch(setPackageSuccess(unwrapMessage(response, "Package updated successfully")));
    return response;
  } catch (error) {
    dispatch(setPackageError(error?.message || error || "Failed to update package"));
    dispatch(setPackageLoading(false));
  }
};
