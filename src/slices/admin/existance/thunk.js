import { setExistanceLoading, setExistanceList, setExistanceError, setExistanceSuccess } from './reducer';
import { getQuestionSections as getQuestionSectionsApi, deleteQuestionSection as deleteQuestionSectionApi, createQuestionSection as createQuestionSectionApi, updateQuestionSection as updateQuestionSectionApi } from '../../../helpers/realbackend_helper';

/* Get Question Sections List Api Call */
export const getQuestionSections = (data) => async (dispatch) => {
    try {
        dispatch(setExistanceLoading(true));
        const response = await getQuestionSectionsApi(data);
        dispatch(setExistanceLoading(false));
        dispatch(setExistanceList(response));
    } catch (error) {
        dispatch(setExistanceError(error.message));
        dispatch(setExistanceLoading(false));
    }
}

/* Create Question Section Api Call */
export const createQuestionSection = (data) => async (dispatch) => {
    try {
        dispatch(setExistanceLoading(true));
        const response = await createQuestionSectionApi(data);
        dispatch(setExistanceLoading(false));
        dispatch(setExistanceSuccess(response));
        // Refresh the list after successful creation
        dispatch(getQuestionSections({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setExistanceError(error.message));
        dispatch(setExistanceLoading(false));
    }
}

/* Delete Question Section Api Call */
export const deleteQuestionSection = (data) => async (dispatch) => {
    try {
        dispatch(setExistanceLoading(true));
        const response = await deleteQuestionSectionApi(data);
        dispatch(setExistanceLoading(false));
        dispatch(setExistanceSuccess(response));
        // Refresh the list after successful deletion
        dispatch(getQuestionSections({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setExistanceError(error.message));
        dispatch(setExistanceLoading(false));
    }
}

/* Update Question Section Api Call */
export const updateQuestionSection = (data) => async (dispatch) => {
    try {
        dispatch(setExistanceLoading(true));
        const response = await updateQuestionSectionApi(data);
        dispatch(setExistanceLoading(false));
        dispatch(setExistanceSuccess("Question Section updated successfully"));
        // Refresh the list after successful update
        dispatch(getQuestionSections({ pageNumber: 1, pageSize: 10 }));
    } catch (error) {
        dispatch(setExistanceError(error.message));
        dispatch(setExistanceLoading(false));
    }
}; 