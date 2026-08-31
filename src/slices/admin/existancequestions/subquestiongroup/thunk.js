import {
    setSubQuestionGroupLoading,
    setSubQuestionGroupList,
    setSubQuestionGroupError,
    setSubQuestionGroupSuccess,
    setQuestionGroups,
    setSections
} from './reducer';
import {
    getQuestionSubGroupList as getQuestionSubGroupListApi,
    deleteQuestionSubGroup as deleteQuestionSubGroupApi,
    createUpdateQuestionSubGroup as createUpdateQuestionSubGroupApi,
    getQuestionGroups as getQuestionGroupsApi,
    getSectionForSubSection as getSectionForSubSectionApi,
} from '../../../../helpers/realbackend_helper';

/* Get Sub Question Group List Api Call */
export const getSubQuestionGroupList = (data) => async (dispatch) => {
    try {
        dispatch(setSubQuestionGroupLoading(true));
        const response = await getQuestionSubGroupListApi(data);
        dispatch(setSubQuestionGroupLoading(false));
        dispatch(setSubQuestionGroupList(response));
    } catch (error) {
        dispatch(setSubQuestionGroupError(error.message));
        dispatch(setSubQuestionGroupLoading(false));
    }
}

/* Create/Update Sub Question Group Api Call */
export const createUpdateSubQuestionGroup = (data) => async (dispatch) => {
    try {
        dispatch(setSubQuestionGroupLoading(true));
        const response = await createUpdateQuestionSubGroupApi(data);
        dispatch(setSubQuestionGroupLoading(false));
        dispatch(setSubQuestionGroupSuccess(response));
        dispatch(getSubQuestionGroupList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setSubQuestionGroupError(error.message));
        dispatch(setSubQuestionGroupLoading(false));
    }
}

/* Delete Sub Question Group Api Call */
export const deleteSubQuestionGroup = (data) => async (dispatch) => {
    try {
        dispatch(setSubQuestionGroupLoading(true));
        const response = await deleteQuestionSubGroupApi(data);
        dispatch(setSubQuestionGroupLoading(false));
        dispatch(setSubQuestionGroupSuccess(response));
        dispatch(getSubQuestionGroupList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setSubQuestionGroupError(error.message));
        dispatch(setSubQuestionGroupLoading(false));
    }
}

export const getQuestionGroupsForSubQuestionGroup = () => async (dispatch) => {
    try {
        const response = await getQuestionGroupsApi();
        dispatch(setQuestionGroups(response));
        //dispatch(setQuestionsLoading(false));
        //dispatch(setQuestionSuccess('Question groups fetched successfully.'));
    } catch (error) {
        dispatch(setSubQuestionGroupError('Failed to fetch question groups.'));
    } finally {
        dispatch(setSubQuestionGroupLoading(false));
    }
};

export const getSectionsForSubQuestionGroup = () => async (dispatch) => {
    try {
        const response = await getSectionForSubSectionApi(null);
        dispatch(setSections(response || []));
    } catch (error) {
        dispatch(setSubQuestionGroupError('Failed to fetch sections.'));
    }
};
