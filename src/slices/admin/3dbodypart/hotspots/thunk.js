import {
  setAnatomyHotspotError,
  setAnatomyHotspotSuccess,
  setAnatomyHotspotList,
  setAnatomyHotspotLoading,
} from "./reducer";
import {
  getAnatomyHotspotList as getAnatomyHotspotListApi,
  deleteAnatomyHotspot as deleteAnatomyHotspotApi,
  createAnatomyHotspot as createAnatomyHotspotApi,
  updateAnatomyHotspot as updateAnatomyHotspotApi,
} from "../../../../helpers/realbackend_helper";

const defaultListParams = { PageNumber: 1, PageSize: 10 };

export const getAnatomyHotspotsList = (data) => async (dispatch) => {
  dispatch(setAnatomyHotspotLoading(true));
  try {
    const response = await getAnatomyHotspotListApi(data);
    dispatch(setAnatomyHotspotList(response));
    dispatch(setAnatomyHotspotError(null));
  } catch (error) {
    dispatch(setAnatomyHotspotList({ resultObject: [], totalPageCount: 1 }));
  } finally {
    dispatch(setAnatomyHotspotLoading(false));
  }
};

export const createAnatomyHotspot = (data) => async (dispatch) => {
  dispatch(setAnatomyHotspotLoading(true));
  try {
    const response = await createAnatomyHotspotApi(data);
    dispatch(setAnatomyHotspotSuccess(response));
    dispatch(getAnatomyHotspotsList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomyHotspotError(error?.message || "Failed to create hotspot"));
  } finally {
    dispatch(setAnatomyHotspotLoading(false));
  }
};

export const updateAnatomyHotspot = (data) => async (dispatch) => {
  dispatch(setAnatomyHotspotLoading(true));
  try {
    const response = await updateAnatomyHotspotApi(data);
    dispatch(setAnatomyHotspotSuccess(response));
    dispatch(getAnatomyHotspotsList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomyHotspotError(error?.message || "Failed to update hotspot"));
  } finally {
    dispatch(setAnatomyHotspotLoading(false));
  }
};

export const deleteAnatomyHotspot = (data) => async (dispatch) => {
  dispatch(setAnatomyHotspotLoading(true));
  try {
    const response = await deleteAnatomyHotspotApi(data);
    dispatch(setAnatomyHotspotSuccess(response));
    dispatch(getAnatomyHotspotsList(defaultListParams));
  } catch (error) {
    dispatch(setAnatomyHotspotError(error?.message || "Failed to delete hotspot"));
  } finally {
    dispatch(setAnatomyHotspotLoading(false));
  }
};
