import {
  setQualificationLoading,
  setQualificationList,
  setQualificationError,
  setQualificationSuccess,
} from "./reducer";
import {
  getQualificationList as getQualificationListApi,
  deleteQualification as deleteQualificationApi,
  createQualification as createQualificationApi,
  updateQualification as updateQualificationApi,
} from "../../../helpers/realbackend_helper";

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.resultObject)) return response.resultObject;
  return [];
};

const unwrapMessage = (response, fallback) => {
  if (typeof response === "string" && response.trim()) return response;
  if (response?.message) return response.message;
  if (response?.Message) return response.Message;
  return fallback;
};

export const getQualificationList = (data) => async (dispatch) => {
  try {
    dispatch(setQualificationLoading(true));
    const response = await getQualificationListApi(data || { PageNumber: 1, PageSize: 100 });
    dispatch(setQualificationList(unwrapList(response)));
    dispatch(setQualificationLoading(false));
  } catch (error) {
    dispatch(setQualificationError(error?.message || error || "Failed to load qualifications"));
    dispatch(setQualificationLoading(false));
  }
};

export const deleteQualification = (qualificationId) => async (dispatch) => {
  try {
    dispatch(setQualificationLoading(true));
    const response = await deleteQualificationApi(qualificationId);
    dispatch(setQualificationLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setQualificationError(unwrapMessage(response, "Failed to delete qualification")));
      return;
    }

    dispatch(setQualificationSuccess(unwrapMessage(response, "Qualification deleted successfully")));
    dispatch(getQualificationList({ PageNumber: 1, PageSize: 100 }));
  } catch (error) {
    dispatch(setQualificationError(error?.message || error || "Failed to delete qualification"));
    dispatch(setQualificationLoading(false));
  }
};

export const createQualification = (data) => async (dispatch) => {
  try {
    dispatch(setQualificationLoading(true));
    const response = await createQualificationApi(data);
    dispatch(setQualificationLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setQualificationError(unwrapMessage(response, "Failed to create qualification")));
      return response;
    }

    dispatch(setQualificationSuccess(unwrapMessage(response, "Qualification created successfully")));
    return response;
  } catch (error) {
    dispatch(setQualificationError(error?.message || error || "Failed to create qualification"));
    dispatch(setQualificationLoading(false));
  }
};

export const updateQualification = (data) => async (dispatch) => {
  try {
    dispatch(setQualificationLoading(true));
    const response = await updateQualificationApi(data);
    dispatch(setQualificationLoading(false));

    if (response?.Status && response.Status !== 200) {
      dispatch(setQualificationError(unwrapMessage(response, "Failed to update qualification")));
      return response;
    }

    dispatch(setQualificationSuccess(unwrapMessage(response, "Qualification updated successfully")));
    return response;
  } catch (error) {
    dispatch(setQualificationError(error?.message || error || "Failed to update qualification"));
    dispatch(setQualificationLoading(false));
  }
};
