import {
    setRubricError,
    setRubricSuccess,
    setRubricsList,
    setRubricsLoading,
    setSectionForSubSection,
    setGradeDetails,
    setAuthorForRubric,
    setSubSection,
    setRemedyGrades,
    setRemediesByGrade,
    setRubricRemedyBySectionIdGreadId
} from './reducer';

import {
    getRubric as getRubricApi,
    getSectionForSubSection as getSectionForSubSectionApi,
    getGradeDetails as getGradeDetailsApi,
    getAuthorForRubric as getAuthorForRubricApi,
    getSubSection as getSubSectionApi,
    getRemedyGrades as getRemedyGradesApi,
    getRemediesByGrade as getRemediesByGradeApi,
    saveUpdateRubricRemedy as saveUpdateRubricRemedyApi,
    importFromExcel as importFromExcelApi,
    getImportFromExcelStatus as getImportFromExcelStatusApi,
    exportRubricsToExcel as exportRubricsToExcelApi,
    getRubricRemedyBySectionIdGreadId as getRubricRemedyBySectionIdGreadIdApi
} from '../../../../helpers/realbackend_helper';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForImportJob = async (jobId, onProgress) => {
    const maxAttempts = 900; // ~30 minutes at 2s interval
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const status = await getImportFromExcelStatusApi(jobId);
        if (onProgress) onProgress(status);

        if (status?.status === 'Completed') {
            return status.result || status;
        }
        if (status?.status === 'Failed') {
            throw new Error(status.error || status.message || 'Import failed');
        }

        await sleep(2000);
    }
    throw new Error('Import timed out while waiting for background job.');
};

/* Get Rubrics Api Call */
export const getRubricsList = (data) => async (dispatch) => {
    dispatch(setRubricsLoading(true));
    try {
        const response = await getRubricApi(data);
        dispatch(setRubricsList(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    } finally {
        dispatch(setRubricsLoading(false));
    }
};

/* Create Rubric Api Call */
export const createRubric = (data) => async (dispatch) => {
    dispatch(setRubricsLoading(true));
    try {
        const response = await saveUpdateRubricRemedyApi(data);
        dispatch(setRubricSuccess(response?.message || 'Rubric created successfully'));
        dispatch(getRubricsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRubricError(error?.response?.data?.message || error.message || 'Failed to create rubric'));
    } finally {
        dispatch(setRubricsLoading(false));
    }
};

/* Update Rubric Api Call */
export const updateRubric = (data) => async (dispatch) => {
    try {
        const response = await saveUpdateRubricRemedyApi(data);
        dispatch(setRubricSuccess(response));
        dispatch(getRubricsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRubricError(error.message));
    } finally {
        dispatch(setRubricsLoading(false));
    }
};

/* Delete Rubric Api Call */
/* export const deleteRubric = (data) => async (dispatch) => {
    try {
        const response = await deleteRubricApi(data);
        dispatch(setRubricSuccess(response));
        dispatch(getRubricsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setRubricError(error.message));
    } finally {
        dispatch(setRubricsLoading(false));
    }
}; */

/* Get Section For Sub Section Api Call */
export const getSectionForSubSection = (data) => async (dispatch) => {
    try {
        const response = await getSectionForSubSectionApi(data);
        dispatch(setSectionForSubSection(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Get Grade Details Api Call */
export const getGradeDetails = (data) => async (dispatch) => {
    try {
        const response = await getGradeDetailsApi(data);
        dispatch(setGradeDetails(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Get Author For Rubric Api Call */
export const getAuthorForRubric = (data) => async (dispatch) => {
    try {
        const response = await getAuthorForRubricApi(data);
        dispatch(setAuthorForRubric(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Get Sub Section Api Call */
export const getSubSection = (data) => async (dispatch) => {
    try {
        const response = await getSubSectionApi(data);
        dispatch(setSubSection(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Get Remedy Grades Api Call */
export const getRemedyGrades = (data) => async (dispatch) => {
    try {
        const response = await getRemedyGradesApi(data);
        dispatch(setRemedyGrades(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Get Remedies By Grade Api Call */
export const getRemediesByGrade = (data) => async (dispatch) => {
    try {
        const response = await getRemediesByGradeApi(data);
        dispatch(setRemediesByGrade(response));
    } catch (error) {
        dispatch(setRubricError(error.message));
    }
};

/* Import From Excel Api Call (background job + poll — avoids Cloudflare 524) */
export const importRubricsFromExcel = (file, onProgress) => async (dispatch) => {
    dispatch(setRubricsLoading(true));
    try {
        const formData = new FormData();
        formData.append('file', file);
        const start = await importFromExcelApi(formData);
        const jobId = start?.jobId || start?.JobId;
        if (!jobId) {
            // Backward compatibility if API still returns sync result
            if (start?.totalRows != null || start?.successCount != null) {
                dispatch(setRubricSuccess(start));
                return start;
            }
            throw new Error('Import job did not return a jobId.');
        }

        const result = await waitForImportJob(jobId, onProgress);
        dispatch(setRubricSuccess(result));
        dispatch(getRubricsList({
            PageNumber: 1,
            PageSize: 10
        }));
        return result;
    } catch (error) {
        dispatch(setRubricError(error.message));
        throw error;
    } finally {
        dispatch(setRubricsLoading(false));
    }
};

/* Export Rubrics To Excel by Section */
export const exportRubricsToExcelThunk = (sectionId) => async () => {
    const response = await exportRubricsToExcelApi(sectionId);
    return response;
};

/* Get Rubric Remedy By Section Id Gread Id Api Call */
export const getRubricRemedyBySectionIdGreadId = (data) => async (dispatch) => {
    try {
        dispatch(setRubricsLoading(true));
        const response = await getRubricRemedyBySectionIdGreadIdApi(data);
        dispatch(setRubricRemedyBySectionIdGreadId(response));
        dispatch(setRubricsLoading(false));
    } catch (error) {
        dispatch(setRubricError(error.message));
        dispatch(setRubricsLoading(false));
    }
};