import {
  setAnatomySectionMasterError,
  setAnatomySectionMasterSuccess,
  setAnatomySectionMasterList,
  setAnatomySectionMasterLoading,
} from "./reducer";
import {
  getAnatomySectionMasterList as getAnatomySectionMasterListApi,
  deleteAnatomySectionMaster as deleteAnatomySectionMasterApi,
  createAnatomySectionMaster as createAnatomySectionMasterApi,
  updateAnatomySectionMaster as updateAnatomySectionMasterApi,
} from "../../../../helpers/realbackend_helper";

const defaultListParams = { PageNumber: 1, PageSize: 10 };

export const getAnatomySectionMastersList = (data) => async (dispatch) => {
  dispatch(setAnatomySectionMasterLoading(true));
  try {
    const response = await getAnatomySectionMasterListApi(data);
    dispatch(setAnatomySectionMasterList(response));
    dispatch(setAnatomySectionMasterError(null));
  } catch (error) {
    dispatch(setAnatomySectionMasterList({ resultObject: [], totalPageCount: 1 }));
  } finally {
    dispatch(setAnatomySectionMasterLoading(false));
  }
};

export const createAnatomySectionMaster = (data) => async (dispatch) => {
  dispatch(setAnatomySectionMasterLoading(true));
  try {
    console.log("data", data);
    const response = await createAnatomySectionMasterApi(data);
    dispatch(setAnatomySectionMasterSuccess(response.message || "Section created successfully"));
    dispatch(getAnatomySectionMastersList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomySectionMasterError(error?.message || "Failed to create section"));
  } finally {
    dispatch(setAnatomySectionMasterLoading(false));
  }
};

export const updateAnatomySectionMaster = (data) => async (dispatch) => {
  dispatch(setAnatomySectionMasterLoading(true));
  try {
    const response = await updateAnatomySectionMasterApi(data);
    dispatch(setAnatomySectionMasterSuccess(response.message || "Section updated successfully"));
    dispatch(getAnatomySectionMastersList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomySectionMasterError(error?.message || "Failed to update section"));
  } finally {
    dispatch(setAnatomySectionMasterLoading(false));
  }
};

export const deleteAnatomySectionMaster = (data) => async (dispatch) => {
  dispatch(setAnatomySectionMasterLoading(true));
  try {
    const response = await deleteAnatomySectionMasterApi(data);
    dispatch(setAnatomySectionMasterSuccess(response.message || "Section deleted successfully"));
    dispatch(getAnatomySectionMastersList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomySectionMasterError(error?.message || "Failed to delete section"));
  } finally {
    dispatch(setAnatomySectionMasterLoading(false));
  }
};
