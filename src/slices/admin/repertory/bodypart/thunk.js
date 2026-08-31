import { setBodyPartError, setBodyPartSuccess, setBodyPartsList, setBodyPartsLoading, setSectionForSubSection } from './reducer';
import {
    getBodyParts as getBodyPartsApi,
    deleteBodyPart as deleteBodyPartApi,
    createUpdateBodyPart as createUpdateBodyPartApi,
    getSectionForSubSection as getSectionForSubSectionApi
} from '../../../../helpers/realbackend_helper';

/* Get Body Parts Api Call */
export const getBodyPartsList = (data) => async (dispatch) => {
    dispatch(setBodyPartsLoading(true));
    try {
        const response = await getBodyPartsApi(data);
        dispatch(setBodyPartsList(response));
    } catch (error) {
        dispatch(setBodyPartError(error.message));
    } finally {
        dispatch(setBodyPartsLoading(false));
    }
};

/* Create Body Part Api Call */
export const createBodyPart = (data) => async (dispatch) => {
    try {
        const response = await createUpdateBodyPartApi(data);
        dispatch(setBodyPartSuccess(response));
        dispatch(getBodyPartsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setBodyPartError(error.message));
    } finally {
        dispatch(setBodyPartsLoading(false));
    }
};

/* Update Body Part Api Call */
export const updateBodyPart = (data) => async (dispatch) => {
    try {
        const response = await createUpdateBodyPartApi(data);
        dispatch(setBodyPartSuccess(response));
        dispatch(getBodyPartsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setBodyPartError(error.message));
    } finally {
        dispatch(setBodyPartsLoading(false));
    }
};

/* Delete Body Part Api Call */
export const deleteBodyPart = (data) => async (dispatch) => {
    try {
        const response = await deleteBodyPartApi(data);
        dispatch(setBodyPartSuccess(response));
        dispatch(getBodyPartsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setBodyPartError(error.message));
    } finally {
        dispatch(setBodyPartsLoading(false));
    }
};

/* Get Section For Sub Section Api Call */
export const getSectionForBodyPart = (data) => async (dispatch) => {
    try {
        const response = await getSectionForSubSectionApi(data);
        dispatch(setSectionForSubSection(response));
    } catch (error) {
        dispatch(setBodyPartError(error.message));
    }
};

