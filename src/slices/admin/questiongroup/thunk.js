import { toast } from 'react-toastify';
import { setQuestionGroupError, setQuestionGroupList, setQuestionGroupLoading, setQuestionGroupSuccess } from './reducer';
import { getQuestionGroupExistance, deleteQuestionGroup as deleteQuestionGroupApi, createQuestionGroup as createQuestionGroupApi } from '../../../helpers/realbackend_helper';

export const getQuestionGroups = (data) => async (dispatch) => {
    try {
        dispatch(setQuestionGroupLoading(true));
        const response = await getQuestionGroupExistance(data);
        dispatch(setQuestionGroupList(response));
        dispatch(setQuestionGroupLoading(false));
    } catch (error) {
        dispatch(setQuestionGroupError(error.response?.data?.message || 'Something went wrong'));
        dispatch(setQuestionGroupLoading(false));
    }
};

export const deleteQuestionGroup = (data) => async (dispatch) => {
    try {
        dispatch(setQuestionGroupLoading(true));
        const response = await deleteQuestionGroupApi(data);
        dispatch(setQuestionGroupSuccess(response));
        dispatch(setQuestionGroupLoading(false));
        // Refresh the list after successful deletion
        dispatch(getQuestionGroups({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setQuestionGroupError(error.message));
        dispatch(setQuestionGroupLoading(false));
    }
}

export const createQuestionGroup = (data) => async (dispatch) => {
    try {
        dispatch(setQuestionGroupLoading(true));
        const response = await createQuestionGroupApi(data);
        dispatch(setQuestionGroupSuccess(response));
        dispatch(setQuestionGroupLoading(false));
        // Refresh the list after successful creation
        dispatch(getQuestionGroups({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setQuestionGroupError(error.message));
        dispatch(setQuestionGroupLoading(false));
    }
}

export const updateQuestionGroup = (data) => async (dispatch) => {
    try {
        dispatch(setQuestionGroupLoading(true));
        const response = await createQuestionGroupApi(data);
        dispatch(setQuestionGroupSuccess(response));
        dispatch(setQuestionGroupLoading(false));
        // Refresh the list after successful creation
        dispatch(getQuestionGroups({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setQuestionGroupError(error.message));
        dispatch(setQuestionGroupLoading(false));
    }
}