import { setAuthorError, setAuthorSuccess, setAuthorsList, setAuthorsLoading } from './reducer';

import {
    getAuthorsList as getAuthorsListApi,
    createOrUpdateAuthor as createOrUpdateAuthorApi,
    deleteAuthor as deleteAuthorApi,
} from '../../../../helpers/realbackend_helper';

/* Get Authors Api Call */
export const getAuthorsList = (data) => async (dispatch) => {
    dispatch(setAuthorsLoading(true));
    try {
        const response = await getAuthorsListApi(data);
        dispatch(setAuthorsList(response));
    } catch (error) {
        dispatch(setAuthorError(error.message));
    } finally {
        dispatch(setAuthorsLoading(false));
    }
};

/* Create or Update Author Api Call */
export const createAuthor = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateAuthorApi(data);
        dispatch(setAuthorSuccess(response));
        dispatch(getAuthorsList({
            queryString: '',
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setAuthorError(error.message));
    } finally {
        dispatch(setAuthorsLoading(false));
    }
};

/* Update Author Api Call */
export const updateAuthor = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateAuthorApi(data);
        dispatch(setAuthorSuccess(response));
        dispatch(getAuthorsList({
            queryString: '',
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setAuthorError(error.message));
    } finally {
        dispatch(setAuthorsLoading(false));
    }
};

/* Delete Author Api Call */
export const deleteAuthor = (data) => async (dispatch) => {
    try {
        const response = await deleteAuthorApi(data);
        dispatch(setAuthorSuccess(response));
        dispatch(getAuthorsList({
            queryString: '',
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setAuthorError(error.message));
    } finally {
        dispatch(setAuthorsLoading(false));
    }
};