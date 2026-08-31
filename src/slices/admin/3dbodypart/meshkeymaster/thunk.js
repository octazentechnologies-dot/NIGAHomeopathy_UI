import {
  setMeshKeyMasterError,
  setMeshKeyMasterSuccess,
  setMeshKeyMasterList,
  setMeshKeyMasterLoading,
} from "./reducer";
import {
  getMeshKeyMasterList as getMeshKeyMasterListApi,
  deleteMeshKeyMaster as deleteMeshKeyMasterApi,
  createMeshKeyMaster as createMeshKeyMasterApi,
  updateMeshKeyMaster as updateMeshKeyMasterApi,
} from "../../../../helpers/realbackend_helper";

const defaultListParams = { PageNumber: 1, PageSize: 10 };

export const getMeshKeyMastersList = (data) => async (dispatch) => {
  dispatch(setMeshKeyMasterLoading(true));
  try {
    const response = await getMeshKeyMasterListApi(data);
    dispatch(setMeshKeyMasterList(response));
    dispatch(setMeshKeyMasterError(null));
  } catch (error) {
    // List page shows empty state; do not set global error (Add/Edit would show stale list errors).
    dispatch(setMeshKeyMasterList({ resultObject: [], totalPageCount: 1 }));
  } finally {
    dispatch(setMeshKeyMasterLoading(false));
  }
};

export const createMeshKeyMaster = (data) => async (dispatch) => {
  dispatch(setMeshKeyMasterLoading(true));
  try {
    const response = await createMeshKeyMasterApi(data);
    dispatch(setMeshKeyMasterSuccess(response.message || "Mesh Key Master created successfully"));
    dispatch(getMeshKeyMastersList(defaultListParams));
  } catch (error) {
    dispatch(setMeshKeyMasterError(error?.message || "Failed to create mesh key"));
  } finally {
    dispatch(setMeshKeyMasterLoading(false));
  }
};

export const updateMeshKeyMaster = (data) => async (dispatch) => {
  dispatch(setMeshKeyMasterLoading(true));
  try {
    console.log("data", data);
    const response = await updateMeshKeyMasterApi(data);
    dispatch(setMeshKeyMasterSuccess(response.message || "Mesh Key Master updated successfully"));
    dispatch(getMeshKeyMastersList(defaultListParams));
  } catch (error) {
    dispatch(setMeshKeyMasterError(error?.message || "Failed to update mesh key"));
  } finally {
    dispatch(setMeshKeyMasterLoading(false));
  }
};

export const deleteMeshKeyMaster = (data, listQuery) => async (dispatch) => {
  dispatch(setMeshKeyMasterLoading(true));
  try {

    const response = await deleteMeshKeyMasterApi(data);
    dispatch(setMeshKeyMasterSuccess(response.message || "Mesh Key Master deleted successfully"));
    dispatch(getMeshKeyMastersList({ ...defaultListParams, ...listQuery }));
  } catch (error) {
    dispatch(setMeshKeyMasterError(error?.message || "Failed to delete mesh key"));
  } finally {
    dispatch(setMeshKeyMasterLoading(false));
  }
};
