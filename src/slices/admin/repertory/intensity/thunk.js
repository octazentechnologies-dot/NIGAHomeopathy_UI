import { setIntensityError, setIntensitySuccess, setIntensitiesList, setIntensitiesLoading } from './reducer';
import {
    getIntensities as getIntensitiesApi,
    deleteIntensity as deleteIntensityApi,
    createUpdateIntensity as createUpdateIntensityApi
} from '../../../../helpers/realbackend_helper';

/* Get Intensities Api Call */
export const getIntensitiesList = (data) => async (dispatch) => {
    dispatch(setIntensitiesLoading(true));
    try {
        const response = await getIntensitiesApi(data);
        dispatch(setIntensitiesList(response));
    } catch (error) {
        dispatch(setIntensityError(error.message));
    } finally {
        dispatch(setIntensitiesLoading(false));
    }
};

/* Create Intensity Api Call */
export const createIntensity = (data) => async (dispatch) => {
    try {
        const response = await createUpdateIntensityApi(data);
        dispatch(setIntensitySuccess(response));
        dispatch(getIntensitiesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setIntensityError(error.message));
    } finally {
        dispatch(setIntensitiesLoading(false));
    }
};

/* Update Intensity Api Call */
export const updateIntensity = (data) => async (dispatch) => {
    try {
        const response = await createUpdateIntensityApi(data);
        dispatch(setIntensitySuccess(response));
        dispatch(getIntensitiesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setIntensityError(error.message));
    } finally {
        dispatch(setIntensitiesLoading(false));
    }
};

/* Delete Intensity Api Call */
export const deleteIntensity = (data) => async (dispatch) => {
    try {
        const response = await deleteIntensityApi(data);
        dispatch(setIntensitySuccess(response));
        dispatch(getIntensitiesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setIntensityError(error.message));
    } finally {
        dispatch(setIntensitiesLoading(false));
    }
};
