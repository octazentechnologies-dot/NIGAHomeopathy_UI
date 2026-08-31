import {
    setDiagnosisSystemError,
    setDiagnosisSystemSuccess,
    setDiagnosisSystemsList,
    setDiagnosisSystemLoading
} from './reducer';
import {
    getDiagnosisSystemList as getDiagnosisSystemListApi,
    deleteDiagnosisSystem as deleteDiagnosisSystemApi,
    saveUpdateDiagnosisSystem as saveUpdateDiagnosisSystemApi
} from '../../../../helpers/realbackend_helper';

/* Get Diagnosis Systems Api Call */
export const getDiagnosisSystemsList = (data) => async (dispatch) => {
    dispatch(setDiagnosisSystemLoading(true));
    try {
        const response = await getDiagnosisSystemListApi(data);
        dispatch(setDiagnosisSystemsList(response));
    } catch (error) {
        dispatch(setDiagnosisSystemError(error.message));
    } finally {
        dispatch(setDiagnosisSystemLoading(false));
    }
};

/* Create Diagnosis System Api Call */
export const createDiagnosisSystem = (data) => async (dispatch) => {
    try {
        const response = await saveUpdateDiagnosisSystemApi(data);
        dispatch(setDiagnosisSystemSuccess(response));
        dispatch(getDiagnosisSystemsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setDiagnosisSystemError(error.message));
    } finally {
        dispatch(setDiagnosisSystemLoading(false));
    }
};

/* Update Diagnosis System Api Call */
export const updateDiagnosisSystem = (data) => async (dispatch) => {
    try {
        const response = await saveUpdateDiagnosisSystemApi(data);
        dispatch(setDiagnosisSystemSuccess(response));
        dispatch(getDiagnosisSystemsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setDiagnosisSystemError(error.message));
    } finally {
        dispatch(setDiagnosisSystemLoading(false));
    }
};

/* Delete Diagnosis System Api Call */
export const deleteDiagnosisSystem = (data) => async (dispatch) => {
    try {
        const response = await deleteDiagnosisSystemApi(data);
        dispatch(setDiagnosisSystemSuccess(response));
        dispatch(getDiagnosisSystemsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setDiagnosisSystemError(error.message));
    } finally {
        dispatch(setDiagnosisSystemLoading(false));
    }
};
