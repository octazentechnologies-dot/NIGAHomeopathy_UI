import {
    setLoading,
    setRemedy,
    setRubricRemedyDetails,
    setError
} from './reducer';

import {
    getRemediesForRemedialRubrics as getRemediesForRemedialRubricsApi,
    getRubricRemedyDetails as getRubricRemedyDetailsApi,
    updateIsSmallRubric as updateIsSmallRubricApi,
    updateIsConfirmationRubric as updateIsConfirmationRubricApi
} from '../../../../helpers/realbackend_helper';

/* Get Remedies Api Call */
export const getRemedieList = (data) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        const response = await getRemediesForRemedialRubricsApi(data);
        dispatch(setRemedy(response));
        dispatch(setLoading(false));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setError(error.message));
    }
};

/* Get Rubric Remedy Details Api Call */
export const getRubricRemedyDetails = (data) => async (dispatch) => {
    try {
        dispatch(setLoading(true));
        dispatch(setRubricRemedyDetails(null));
        const response = await getRubricRemedyDetailsApi(data);
        dispatch(setRubricRemedyDetails(response));
        dispatch(setLoading(false));
    } catch (error) {
        dispatch(setLoading(false));
        dispatch(setError(error.message));
    }
};

/* Update Is Small Rubric Api Call */
export const updateIsSmallRubricStatus = (data) => async (dispatch) => {
    try {
        await updateIsSmallRubricApi(data);
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

/* Update Is Confirmation Rubric Api Call */
export const updateIsConfirmationRubricStatus = (data) => async (dispatch) => {
    try {
        await updateIsConfirmationRubricApi(data);
    } catch (error) {
        dispatch(setError(error.message));
        throw error;
    }
};

