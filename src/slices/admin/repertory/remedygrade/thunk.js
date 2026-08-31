import { setRemedyGradeError, setRemedyGradeSuccess, setRemedyGradesList, setRemedyGradesLoading } from './reducer';
import {
    getRemedyGrades as getRemedyGradesApi,
    deleteRemedyGrade as deleteRemedyGradeApi,
    createUpdateRemedyGrade as createUpdateRemedyGradeApi
} from '../../../../helpers/realbackend_helper';

/* Get Remedy Grades Api Call */
export const getRemedyGradesList = (data) => async (dispatch) => {
    dispatch(setRemedyGradesLoading(true));
    try {
        const response = await getRemedyGradesApi(data);
        dispatch(setRemedyGradesList(response));
    } catch (error) {
        dispatch(setRemedyGradeError(error.message));
    } finally {
        dispatch(setRemedyGradesLoading(false));
    }
};

/* Create Remedy Grade Api Call */
export const createRemedyGrade = (data) => async (dispatch) => {
    try {
        const response = await createUpdateRemedyGradeApi(data);
        dispatch(setRemedyGradeSuccess(response));
        dispatch(getRemedyGradesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRemedyGradeError(error.message));
    } finally {
        dispatch(setRemedyGradesLoading(false));
    }
};

/* Update Remedy Grade Api Call */
export const updateRemedyGrade = (data) => async (dispatch) => {
    try {
        const response = await createUpdateRemedyGradeApi(data);
        dispatch(setRemedyGradeSuccess(response));
        dispatch(getRemedyGradesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRemedyGradeError(error.message));
    } finally {
        dispatch(setRemedyGradesLoading(false));
    }
};

/* Delete Remedy Grade Api Call */
export const deleteRemedyGrade = (data) => async (dispatch) => {
    try {
        const response = await deleteRemedyGradeApi(data);
        dispatch(setRemedyGradeSuccess(response));
        dispatch(getRemedyGradesList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRemedyGradeError(error.message));
    } finally {
        dispatch(setRemedyGradesLoading(false));
    }
};
