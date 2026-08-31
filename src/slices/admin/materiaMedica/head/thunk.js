import { setHeadError, setHeadSuccess, setHeadsList, setHeadsLoading, setAuthors } from './reducer';
import {

    getHeadsList as getHeadsListApi,
    createOrUpdateHead as createOrUpdateHeadApi,
    deleteHead as deleteHeadApi,
    UpdateDifferentialMateriaMedicadDefaultStatus as UpdateDifferentialMateriaMedicadDefaultStatusApi,
    getAuthorForCreateOrUpdateHead as getAuthorForCreateOrUpdateHeadApi
} from '../../../../helpers/realbackend_helper';

/* Get Heads Api Call */
export const getHeadsList = (data) => async (dispatch) => {
    dispatch(setHeadsLoading(true));
    try {
        const response = await getHeadsListApi(data);
        dispatch(setHeadsList(response));
    } catch (error) {
        dispatch(setHeadError(error.message));
    } finally {
        dispatch(setHeadsLoading(false));
    }
};

/* Create or Update Head Api Call */
export const createHead = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateHeadApi(data);
        dispatch(setHeadSuccess(response));
        dispatch(getHeadsList({
            /*  queryString: '', */
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setHeadError(error.message));
    } finally {
        dispatch(setHeadsLoading(false));
    }
};

/* Update Head Api Call */
export const updateHead = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateHeadApi(data);
        dispatch(setHeadSuccess(response));
        dispatch(getHeadsList({
            /*  queryString: '', */
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setHeadError(error.message));
    } finally {
        dispatch(setHeadsLoading(false));
    }
};

/* Delete Head Api Call */
export const deleteHead = (data) => async (dispatch) => {
    try {
        const response = await deleteHeadApi(data);
        dispatch(setHeadSuccess(response));
        dispatch(getHeadsList({
            /*  queryString: '', */
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setHeadError(error.message));
    } finally {
        dispatch(setHeadsLoading(false));
    }
};

/* Update Differential Materia Medica Default Status Api Call */
export const updateDifferentialMateriaMedicaDefaultStatus = (data) => async (dispatch) => {
    try {
        const response = await UpdateDifferentialMateriaMedicadDefaultStatusApi(data);
        dispatch(setHeadSuccess(response));
        dispatch(getHeadsList({
            /*  queryString: '', */
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setHeadError(error.message));
    } finally {
        dispatch(setHeadsLoading(false));
    }
};

/* Get Author For Create or Update Head Api Call */
export const getAuthorForCreateOrUpdateHead = (data) => async (dispatch) => {
    try {
        const response = await getAuthorForCreateOrUpdateHeadApi(data);
        dispatch(setAuthors(response));
    } catch (error) {
        dispatch(setHeadError(error.message));
    }
};
