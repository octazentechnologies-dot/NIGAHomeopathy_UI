import {
    setQuestionsLoading,
    setQuestionsList,
    setQuestionSuccess,
    setQuestionError,
    setQuestionGroups,
    setQuestionSubGroups,
    setQuestionBodyParts,
    setQuestionSections,
    setQuestionSubSections,
    setQuestionSectionDDL,
    setQuestionSubSectionDDL,
    setQuestionBodyPartDataById,
    setQuestionGroupByExistanceId,
    setQuestionSubSectionDDLByQGIDQSID,
    setQuestionKeywordBodyPart,
    setQuestionRubricData

} from './reducer';

import {
    getQuestionGroups as getQuestionGroupsApi,
    getQuestionsSubGroups as getQuestionsSubGroupsApi,
    getClinicalQuestionBodyPart as getClinicalQuestionBodyPartApi,
    deleteClinicalQuestionBodyPart as deleteClinicalQuestionBodyPartApi,
    getQuestionSectionDll as getQuestionSectionDllApi,
    getSubQuestionGroupDll as getSubQuestionGroupDllApi,
    getBodyPartBySection as getBodyPartBySectionApi,
    getSubSection as getSubSectionApi,
    getSectionForSubSection as getSectionForSubSectionApi,
    createOrUpdateClinicalQuestionBodyPart as createOrUpdateClinicalQuestionBodyPartApi,
    getClinicalQuestionBodyPartDataById as getClinicalQuestionBodyPartDataByIdApi,
    getQuestionGroupByExistanceId as getQuestionGroupByExistanceIdApi,
    getSubQuestionGroupByQGIDQSID as getSubQuestionGroupByQGIDQSIDApi,
    getClinicalQuestionsKeywordBodyPart as getClinicalQuestionsKeywordBodyPartApi,
    getClinicalRubricData as getClinicalRubricDataApi,
} from '../../../../helpers/realbackend_helper';

export const getQuestionGroups = () => async (dispatch) => {
    try {
        const response = await getQuestionGroupsApi();
        dispatch(setQuestionGroups(response));
        //dispatch(setQuestionsLoading(false));
        //dispatch(setQuestionSuccess('Question groups fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch question groups.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const getQuestionsSubGroups = () => async (dispatch) => {
    dispatch(setQuestionsLoading(true));
    try {
        const response = await getQuestionsSubGroupsApi();
        dispatch(setQuestionSubGroups(response));
        //dispatch(setQuestionSuccess('Question sub-groups fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch question sub-groups.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const getClinicalQuestionBodyPart = (data) => async (dispatch) => {
    dispatch(setQuestionsLoading(true));
    try {
        const response = await getClinicalQuestionBodyPartApi(data);
        dispatch(setQuestionsList(response));
        dispatch(setQuestionsLoading(false));
        //  dispatch(setQuestionSuccess('Clinical question body parts fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch clinical question body parts.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const deleteClinicalQuestionBodyPart = (data) => async (dispatch) => {
    const { listParams, ...deleteData } = data;
    try {
        dispatch(setQuestionsLoading(true));
        await deleteClinicalQuestionBodyPartApi(deleteData);
        if (listParams) {
            dispatch(getClinicalQuestionBodyPart(listParams));
        }
    } catch (error) {
        dispatch(setQuestionError('Failed to delete clinical question body part.'));
        throw error;
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const getQuestionSectionDll = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getQuestionSectionDllApi(data);
        dispatch(setQuestionSectionDDL(response));
        //dispatch(setQuestionSuccess('Question sections fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch question sections.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const getSubQuestionGroupDll = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getSubQuestionGroupDllApi(data);
        dispatch(setQuestionSubSectionDDL(response));
        //dispatch(setQuestionSuccess('Sub-question groups fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch sub-question groups.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}
export const getBodyPartBySection = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getBodyPartBySectionApi(data);
        dispatch(setQuestionBodyParts(response));
        //dispatch(setQuestionSuccess('Body parts fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch body parts.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}
export const getSubSectionForClinicalQuestion = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getSubSectionApi(data);
        dispatch(setQuestionSubSections(response));
        //dispatch(setQuestionSuccess('Sub-sections fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch sub-sections.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const getSectionForSubSectionForClinicalQuestion = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getSectionForSubSectionApi(data);
        dispatch(setQuestionSections(response));
        //dispatch(setQuestionSuccess('Sections for sub-section fetched successfully.'));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch sections for sub-section.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
};

export const createOrUpdateClinicalQuestionBodyPart = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await createOrUpdateClinicalQuestionBodyPartApi(data);
        dispatch(setQuestionSuccess(response));
    } catch (error) {
        dispatch(setQuestionError(error));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}

export const getClinicalQuestionBodyPartDataById = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getClinicalQuestionBodyPartDataByIdApi(data);
        dispatch(setQuestionBodyPartDataById(response));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch clinical question body part data by id.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}


export const getQuestionGroupByExistanceId = (data) => async (dispatch) => {
    try {
        const response = await getQuestionGroupByExistanceIdApi(data);
        dispatch(setQuestionGroupByExistanceId(Array.isArray(response) ? response : []));
    } catch (error) {
        dispatch(setQuestionGroupByExistanceId([]));
        dispatch(setQuestionError('Failed to fetch question group by existence id.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}


export const getSubQuestionGroupByQGIDQSID = (data) => async (dispatch) => {
    try {
        const response = await getSubQuestionGroupByQGIDQSIDApi(data);
        dispatch(setQuestionSubSectionDDLByQGIDQSID(Array.isArray(response) ? response : []));
    } catch (error) {
        dispatch(setQuestionSubSectionDDLByQGIDQSID([]));
        dispatch(setQuestionError('Failed to fetch sub-question group by qg id qsid.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}

export const getClinicalQuestionsKeywordBodyPart = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getClinicalQuestionsKeywordBodyPartApi(data);
        dispatch(setQuestionKeywordBodyPart(response));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch clinical questions keyword body part.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}

export const getClinicalRubricData = (data) => async (dispatch) => {
    // dispatch(setQuestionsLoading(true));
    try {
        const response = await getClinicalRubricDataApi(data);
        dispatch(setQuestionRubricData(response));
    } catch (error) {
        dispatch(setQuestionError('Failed to fetch clinical rubric data.'));
    } finally {
        dispatch(setQuestionsLoading(false));
    }
}