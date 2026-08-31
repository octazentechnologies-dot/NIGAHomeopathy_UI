import {
    setSubSectionList,
    setSubSectionError,
    setSubSectionSuccess,
    setLoading,
    setSectionForSubSection,
    clearSubSectionState,
    setSubSectionBySection,
    setLanguages,
    setSubSectionById,

} from './reducer';

import {
    getSectionForSubSection as getSectionForSubSectionApi,
    getSubSectionsList as getSubSectionsListApi,
    deleteSubSection as deleteSubSectionApi,
    getSubSectionBySection as getSubSectionBySectionApi,
    createUpdateSubsection as createUpdateSubsectionApi,
    GetLanguages as GetLanguagesApi,
    getSubSection as getSubSectionApi,
    getSubSectionById as getSubSectionByIdApi,
    exportSubSectionsToExcel as exportSubSectionsToExcelApi,
    deleteReferenceRubricDetails as deleteReferenceRubricDetailsApi,
    deleteSubSectionLanguageDetails as deleteSubSectionLanguageDetailsApi,
    updateMainParentSubsection as updateMainParentSubsectionApi,

} from '../../../../helpers/realbackend_helper';

import { importAPI } from '../../../../helpers/api_helper';
import * as url from '../../../../helpers/url_helper';

/* Get SubSections List Api Call */
export const getSubSectionsList = (data) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const response = await getSubSectionsListApi(data);
        dispatch(setSubSectionList(response));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

/* Create SubSection Api Call */
export const createSubSection = (data) => async (dispatch) => {
    try {
        const response = await createUpdateSubsectionApi(data);
        dispatch(setSubSectionSuccess(response));
        dispatch(getSubSectionsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

/* Update SubSection Api Call */
export const updateSubSection = (data, selectedSection) => async (dispatch) => {
    try {
        const response = await createUpdateSubsectionApi(data);
        dispatch(setSubSectionSuccess(response));
        // Refresh the list with current section, query, and page if provided
        if (selectedSection?.value) {
            dispatch(getSubSectionsList({
                sectionId: selectedSection.value,
                queryString: "",
                PageNumber: 1,
                PageSize: 10
            }));
        } else {
            dispatch(getSubSectionsList({
                sectionId: data[0].sectionId,
                queryString: "",
                PageNumber: 1,
                PageSize: 10
            }));
        }
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

/* Delete SubSection Api Call */
export const deleteSubSection = (data) => async (dispatch) => {
    try {
        const response = await deleteSubSectionApi(data);
        dispatch(setSubSectionSuccess(response));
        dispatch(getSubSectionsList({
            PageNumber: 1,
            PageSize: 10
        }));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};

/* Get Section For Sub Section Api Call */
export const getSectionForSubSectionList = (data) => async (dispatch) => {
    try {
        const response = await getSectionForSubSectionApi(data);
        dispatch(setSectionForSubSection(response));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    }
};

/* Get Sub Section By Section Api Call */
export const getSubSectionBySectionList = (data) => async (dispatch) => {
    try {
        const response = await getSubSectionBySectionApi(data);
        dispatch(setSubSectionBySection(response));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    }
};

/* Get Lanugages */
export const getLanguages = (data) => async (dispatch) => {
    try {
        const response = await GetLanguagesApi(data);
        dispatch(setLanguages(response));
    } catch (error) {
        dispatch(setSubSectionError(error.message));
    }
};

/* Get Single SubSection By ID */
export const getSubSectionById = (subSectionId) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        console.log('subSectionId =', subSectionId)
        const response = await getSubSectionByIdApi(subSectionId);
        // No direct reducer for single subsection, so just return response
        dispatch(setSubSectionById(response));
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    } finally {
        dispatch(setLoading(false));
    }
};


export const exportSubSectionsToExcelThunk = (sectionId) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const response = await exportSubSectionsToExcelApi(sectionId);
        return response; // Let the component handle the file download
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    } finally {
        dispatch(setLoading(false));
    }
};

export const importSubSectionsFromExcel = (file) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await importAPI.post(url.IMPORT_SUBSECTIONS_FROM_EXCEL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        dispatch(setSubSectionSuccess(response));
        // Refresh the subsections list after successful import
        dispatch(getSubSectionsList({ PageNumber: 1, PageSize: 10 }));
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    } finally {
        dispatch(setLoading(false));
    }
};

export const uploadSubSectionsFromExcel = (file) => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await importAPI.post(url.UPDATE_SUBSECTIONS_FROM_EXCEL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        dispatch(setSubSectionSuccess(response));
        // Refresh the subsections list after successful upload
        if (response.success) {
            dispatch(getSubSectionsList({ PageNumber: 1, PageSize: 10 }));
        }
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    } finally {
        dispatch(setLoading(false));
    }
};

/* Delete Reference Rubric Details Api Call */
export const deleteReferenceRubricDetails = (data) => async (dispatch) => {
    try {
        const response = await deleteReferenceRubricDetailsApi(data);
        // Don't dispatch main success for delete operations
        // dispatch(setSubSectionSuccess(response));
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    }
};

/* Delete SubSection Language Details Api Call */
export const deleteSubSectionLanguageDetails = (data) => async (dispatch) => {
    try {
        const response = await deleteSubSectionLanguageDetailsApi(data);
        // Don't dispatch main success for delete operations
        // dispatch(setSubSectionSuccess(response));
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    }
};

/* Update Main Parent Subsection Api Call */
export const updateMainParentSubsection = (data) => async (dispatch) => {
    try {
        const response = await updateMainParentSubsectionApi(data);
        dispatch(setSubSectionSuccess(response));
        // Refresh the list if a section is selected
        return response;
    } catch (error) {
        dispatch(setSubSectionError(error.message));
        throw error;
    }
};


