import {
    setLoading,
    setRemedyList,
    setRemedyError,
    setRemedySuccess,
    setTermalDDLList,
    setSingleRemedy
} from './reducer';

import {
    getRemedyList as getRemedyListApi,
    createUpdateRemedy as createUpdateRemedyApi,
    deleteRemedy as deleteRemedyApi,
    getAllTermalDDL as getAllTermalDDLApi,
    getSingleRemedy as getSingleRemedyApi
} from '../../../../helpers/realbackend_helper';

/* Get Remedy List Api Call */
export const getRemedyList = (data) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const response = await getRemedyListApi(data);
        dispatch(setRemedyList(response));
        dispatch(setLoading(false));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setRemedyError(error.message));
    }
};

/* Create or Update Remedy Api Call */
export const createOrUpdateRemedy = (data) => async (dispatch) => {
    try {
        // dispatch(setLoading(true));
        const response = await createUpdateRemedyApi(data);
        dispatch(setRemedySuccess(response));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setRemedyError(error.message));
    }
};

/* Delete Remedy Api Call */
export const deleteRemedy = (data) => async (dispatch) => {
    try {
        //  dispatch(setLoading(true));
        await deleteRemedyApi(data);
        //dispatch(setLoading(false));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setRemedyError(error.message));
    }
};

/* Get Thermal DDL Values */
export const getTermalDDL = (data) => async (dispatch) => {
    try {
        const response = await getAllTermalDDLApi(data);
        dispatch(setTermalDDLList(response))
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setRemedyError(error.message));
    }
}

/* Get Single Remedy For Edit */
export const getSingleRemedy = (data) => async (dispatch) => {
    try {
        const response = await getSingleRemedyApi(data);
        dispatch(setSingleRemedy(response));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setRemedyError(error.message));
    }
}
