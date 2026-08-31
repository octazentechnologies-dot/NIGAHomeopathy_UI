import { setLanguageError, setLanguageSuccess, setLanguagesList, setLanguagesLoading } from './reducer';
import {
    getLanugages as getLanguagesApi,
    deleteLanguage as deleteLanguageApi,
    createUpdateLanguage as createUpdateLanguageApi
} from '../../../../helpers/realbackend_helper';

/* Get Languages Api Call */
export const getLanguagesList = (data) => async (dispatch) => {
    dispatch(setLanguagesLoading(true));
    try {
        const response = await getLanguagesApi(data);
        dispatch(setLanguagesList(response));
    } catch (error) {
        dispatch(setLanguageError(error.message));
    } finally {
        dispatch(setLanguagesLoading(false));
    }
};

/* Create Language Api Call */
export const createLanguage = (data) => async (dispatch) => {
    try {
        const response = await createUpdateLanguageApi(data);
        dispatch(setLanguageSuccess(response));
        dispatch(getLanguagesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setLanguageError(error.message));
    } finally {
        dispatch(setLanguagesLoading(false));
    }
};

/* Update Language Api Call */
export const updateLanguage = (data) => async (dispatch) => {
    try {
        const response = await createUpdateLanguageApi(data);
        dispatch(setLanguageSuccess(response));
        dispatch(getLanguagesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setLanguageError(error.message));
    } finally {
        dispatch(setLanguagesLoading(false));
    }
};

/* Delete Language Api Call */
export const deleteLanguage = (data) => async (dispatch) => {
    try {
        const response = await deleteLanguageApi(data);
        dispatch(setLanguageSuccess(response));
        dispatch(getLanguagesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setLanguageError(error.message));
    } finally {
        dispatch(setLanguagesLoading(false));
    }
};
