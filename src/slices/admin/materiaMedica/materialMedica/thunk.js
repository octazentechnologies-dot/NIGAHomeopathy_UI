import {
    setMateriaMedicaError,
    setMateriaMedicaSuccess,
    setMateriaMedicaList,
    setMateriaMedicaLoading,
    setAuthorsForMateriaMedicaDDL,
    setRemedyDDL,
    setRemedy,
    setMateriaMedicaHeads,
    setMateriaMedicaDetails
} from './reducer';

import {
    getMateriaMedica as getMateriaMedicaApi,
    createOrUpdateMateriaMedica as createOrUpdateMateriaMedicaApi,
    deleteMateriaMedica as deleteMateriaMedicaApi,
    getAuthorForMateriaMedicaDDL as getAuthorForMateriaMedicaDDLApi,
    getRemedyDDL as getRemedyDDLApi,
    getMateriaMedicaHeadByAuthorId as getMateriaMedicaHeadByAuthorIdApi,
    getMateriaMedicaDetails as getMateriaMedicaDetailsApi
} from '../../../../helpers/realbackend_helper';

/* Get Materia Medica List Api Call */
export const getMateriaMedica = (data) => async (dispatch) => {
    dispatch(setMateriaMedicaLoading(true));
    try {
        const response = await getMateriaMedicaApi(data);
        dispatch(setMateriaMedicaList(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    } finally {
        dispatch(setMateriaMedicaLoading(false));
    }
};

/* Create or Update Materia Medica Api Call */
export const createMateriaMedica = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateMateriaMedicaApi(data);
        dispatch(setMateriaMedicaSuccess(response));
        dispatch(getMateriaMedica({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    } finally {
        dispatch(setMateriaMedicaLoading(false));
    }
};

/* Update Materia Medica Api Call */
export const updateMateriaMedica = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateMateriaMedicaApi(data);
        dispatch(setMateriaMedicaSuccess(response));
        dispatch(getMateriaMedica({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    } finally {
        dispatch(setMateriaMedicaLoading(false));
    }
};

/* Delete Materia Medica Api Call */
export const deleteMateriaMedica = (data) => async (dispatch) => {
    try {
        const response = await deleteMateriaMedicaApi(data);
        dispatch(setMateriaMedicaSuccess(response));
        dispatch(getMateriaMedica({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    } finally {
        dispatch(setMateriaMedicaLoading(false));
    }
};

/* Get Authors for Materia Medica DDL Api Call */
export const getAuthorsForMateriaMedicaDDL = (data) => async (dispatch) => {
    try {
        const response = await getAuthorForMateriaMedicaDDLApi(data);
        dispatch(setAuthorsForMateriaMedicaDDL(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    }
};

/* Get Remedy DDL Api Call */
export const getRemedyDDL = (data) => async (dispatch) => {
    try {
        const response = await getRemedyDDLApi(data);
        dispatch(setRemedyDDL(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    }
};

/* Get Materia Medica Head By Author Id Api Call */
export const getMateriaMedicaHeadByAuthorId = (data) => async (dispatch) => {
    try {
        const response = await getMateriaMedicaHeadByAuthorIdApi(data);
        dispatch(setMateriaMedicaHeads(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    }
};

/* Get Materia Medica Details Api Call */
export const getMateriaMedicaDetails = (data) => async (dispatch) => {
    try {
        debugger
        const response = await getMateriaMedicaDetailsApi(data);
        debugger
        console.log(response);
        dispatch(setMateriaMedicaDetails(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    }
};