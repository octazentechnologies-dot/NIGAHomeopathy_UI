import {
    setDiagnosisConditionError,
    setDiagnosisConditionSuccess,
    setDiagnosisConditionsList,
    setDiagnosisConditionLoading,
    setSectionList,
    setSectionLoading,
    setSectionError,
    setSubSectionList,
    setSubSectionLoading,
    setSubSectionError,
    setDiagnosisSystemList,
    setDiagnosisSystemLoading,
    setDiagnosisSystemError,
    setDiagnosisDetails,
    setDiagnosisDetailsLoading,
    setDiagnosisDetailsError,
    setDeleteRubricSuccess,
    setDeleteRubricError
} from './reducer';
import {
    getDiagnosisConditions as getDiagnosisConditionsApi,
    deleteDiagnosis as deleteDiagnosisApi,
    createDiagnosis as createDiagnosisApi,
    updateDiagnosis as updateDiagnosisApi,
    getSectionList as getSectionListApi,
    getSubSectionBySection as getSubSectionBySectionApi,
    getDiagnosisSystemList as getDiagnosisSystemListApi,
    getDiagnosisById as getDiagnosisByIdApi,
    deleteDiagnosisRubric as deleteDiagnosisRubricApi
} from '../../../../helpers/realbackend_helper';

/* Get Diagnosis Conditions Api Call */
export const getDiagnosisConditionsList = (data, showLoading = true) => async (dispatch) => {
    if (showLoading) dispatch(setDiagnosisConditionLoading(true));
    try {
        const response = await getDiagnosisConditionsApi(data);
        dispatch(setDiagnosisConditionsList(response));
    } catch (error) {
        dispatch(setDiagnosisConditionError(error.message));
    } finally {
        if (showLoading) dispatch(setDiagnosisConditionLoading(false));
    }
};

/* Create Diagnosis Condition Api Call */
export const createDiagnosisCondition = (data) => async (dispatch) => {
    dispatch(setDiagnosisConditionLoading(true));
    try {
        const response = await createDiagnosisApi(data);
        dispatch(setDiagnosisConditionSuccess(response.data || 'Diagnosis created successfully!'));
        return response;
    } catch (error) {
        dispatch(setDiagnosisConditionError(error.message));
        throw error;
    } finally {
        dispatch(setDiagnosisConditionLoading(false));
    }
};

/* Update Diagnosis Condition Api Call */
export const updateDiagnosisCondition = (data) => async (dispatch) => {
    dispatch(setDiagnosisConditionLoading(true));
    try {
        const response = await updateDiagnosisApi(data);
        dispatch(setDiagnosisConditionSuccess(response.data || 'Updated successfully'));
        return response;
    } catch (error) {
        dispatch(setDiagnosisConditionError(error.message));
        throw error;
    } finally {
        dispatch(setDiagnosisConditionLoading(false));
    }
};

/* Delete Diagnosis Condition Api Call */
export const deleteDiagnosisCondition = (data) => async (dispatch) => {
    try {
        const response = await deleteDiagnosisApi(data);
        dispatch(setDiagnosisConditionSuccess(response));
        dispatch(getDiagnosisConditionsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setDiagnosisConditionError(error.message));
    } finally {
        dispatch(setDiagnosisConditionLoading(false));
    }
};

/* Get Section List Api Call */
export const getSectionListForDiagnosis = () => async (dispatch) => {
    dispatch(setSectionLoading(true));
    try {
        const response = await getSectionListApi();
        dispatch(setSectionList(response.resultObject || response || []));
    } catch (error) {
        dispatch(setSectionError(error.message));
    } finally {
        dispatch(setSectionLoading(false));
    }
};

/* Get Sub Section By Section Api Call */
export const getSubSectionBySectionForDiagnosis = (data) => async (dispatch) => {
    dispatch(setSubSectionLoading(true));
    try {
        const response = await getSubSectionBySectionApi(data);
        dispatch(setSubSectionList(response || []));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    } finally {
        dispatch(setSubSectionLoading(false));
    }
};

/* Get Diagnosis System List Api Call */
export const getDiagnosisSystemListForDiagnosis = () => async (dispatch) => {
    dispatch(setDiagnosisSystemLoading(true));
    try {
        const response = await getDiagnosisSystemListApi();
        dispatch(setDiagnosisSystemList(response.resultObject || response || []));
    } catch (error) {
        dispatch(setDiagnosisSystemError(error.message));
    } finally {
        dispatch(setDiagnosisSystemLoading(false));
    }
};

/* Get Diagnosis By ID Api Call */
export const getDiagnosisByIdForEdit = (id) => async (dispatch) => {
    dispatch(setDiagnosisDetailsLoading(true));
    try {
        const response = await getDiagnosisByIdApi(id);
        dispatch(setDiagnosisDetails(response));
        return response;
    } catch (error) {
        dispatch(setDiagnosisDetailsError(error.message));
        throw error;
    } finally {
        dispatch(setDiagnosisDetailsLoading(false));
    }
};

/* Delete Diagnosis Rubric Api Call */
export const deleteDiagnosisRubricForDiagnosis = (data) => async (dispatch) => {
    try {
        const response = await deleteDiagnosisRubricApi(data);
        dispatch(setDeleteRubricSuccess(response));
        return response;
    } catch (error) {
        dispatch(setDeleteRubricError(error.message));
        throw error;
    }
};
