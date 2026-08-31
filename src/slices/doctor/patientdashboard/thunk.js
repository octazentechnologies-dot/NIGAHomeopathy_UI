import {
    getAllopathicDrugForDropdown as getAllopathicDrugForDropdownApi,
    getAllopathicDrugForDropdownById as getAllopathicDrugForDropdownByIdApi,
    getRemedyDDL as getRemedyDDLApi,
    getAuthorDDL as getAuthorDDLApi,
    diagnosisSearch as diagnosisSearchApi,
    getIntensitiesForPatient as getIntensitiesForPatientApi,
    getThrepoticByDiagnosisId as getThrepoticByDiagnosisIdApi,
    getDiagnosisKeywordByTab as getDiagnosisKeywordByTabApi,
    getPatientBoardData as getPatientBoardDataApi,
    getQuestionSectionsBySubSectionId as getQuestionSectionsBySubSectionIdApi,
    getRubricDetails as getRubricDetailsApi,
    getRubricByKeywordId as getRubricByKeywordIdApi,
    searchRubricsByKeyword as searchRubricsByKeywordApi,
    getRemedyCounts as getRemedyCountsApi,
    getCommanUnCommanRubricsDetails as getCommanUnCommanRubricsDetailsApi,
    getDifferentialMateriaMedica as getDifferentialMateriaMedicaApi,
    getRepertorizarionRemedyForAccordion as getRepertorizarionRemedyForAccordionApi,
    getMateriaMedicaHeadingByAuthorId as getMateriaMedicaHeadingByAuthorIdApi,
    getEliminationData as getEliminationDataApi,
    getPatientLabTestDDL as getPatientLabTestDDLApi,
    getPatientLabOrder as getPatientLabOrderApi,
    getPatientLabEntry as getPatientLabEntryApi,
    saveUpdateAppointmentHistoryNote as saveUpdateAppointmentHistoryNoteApi,
    getPrescriptionRemedy as getPrescriptionRemedyApi,
    savePatientLabOrder as savePatientLabOrderApi,
    savePatientLabEntry as savePatientLabEntryApi,
    savePrescriptionDetail as savePrescriptionDetailApi,
    getPatientDetails as getPatientDetailsApi
} from '../../../helpers/realbackend_helper';
import {
    mergeClinicalPatternRubricPages,
    normalizeClinicalPatternRubricPagedResponse,
} from '../../../utils/subSectionSearchUtils';
import {
    setAllopathicDrugForDropdownList, setAllopathicDrugForDropdownError,
    setAllopathicDrugForDropdownByIdLoading, setAllopathicDrugForDropdownByIdList, setAllopathicDrugForDropdownByIdError,
    setRemedyDDLLoading, setRemedyDDLError, setRemedyDDLList,
    setAuthorDDLLoading, setAuthorDDLError, setAuthorDDLList,
    setDiagnosisSearchList, setDiagnosisSearchError, setDiagnosisSearchLoading,
    setIntensitiesForPatientList, setIntensitiesForPatientError, setIntensitiesForPatientLoading,
    setThrepoticByDiagnosisIdList, setThrepoticByDiagnosisIdError, setThrepoticByDiagnosisIdLoading,
    setDiagnosisKeywordByTabList, setDiagnosisKeywordByTabError, setDiagnosisKeywordByTabLoading,
    setPatientBoardDataList, setPatientBoardDataError, setPatientBoardDataLoading,
    setQuestionSectionsBySubSectionIdList, setQuestionSectionsBySubSectionIdError, setQuestionSectionsBySubSectionIdLoading,
    setRubricDetailsList, setRubricDetailsError, setRubricDetailsLoading, setRubricDetailsRefreshing,
    setRubricDetailsBySubSectionIdList, setRubricDetailsBySubSectionIdError, setRubricDetailsBySubSectionIdLoading,
    setRubricByKeywordIdList, setRubricByKeywordIdError, setRubricByKeywordIdLoading,
    setRemedyCountsList, setRemedyCountsError, setRemedyCountsLoading,
    setCommanUnCommanRubricsDetailsList, setCommanUnCommanRubricsDetailsError, setCommanUnCommanRubricsDetailsLoading,
    setDifferentialMateriaMedicaList, setDifferentialMateriaMedicaError, setDifferentialMateriaMedicaLoading,
    setRepertorizarionRemedyForAccordionList, setRepertorizarionRemedyForAccordionError, setRepertorizarionRemedyForAccordionLoading,
    setMateriaMedicaHeadingByAuthorIdList, setMateriaMedicaHeadingByAuthorIdError, setMateriaMedicaHeadingByAuthorIdLoading,
    setEliminationDataList, setEliminationDataError, setEliminationDataLoading,
    setPatientLabTestDDLLoading, setPatientLabTestDDLError, setPatientLabTestDDLList,
    setPatientLabOrderList, setPatientLabOrderError, setPatientLabOrderLoading,
    setPatientLabEntryList, setPatientLabEntryError, setPatientLabEntryLoading,
    setAppointmentHistoryNoteList, setAppointmentHistoryNoteError, setAppointmentHistoryNoteLoading,
    setPrescriptionRemedyList, setPrescriptionRemedyError, setPrescriptionRemedyLoading,
    setPrescriptionDetailList, setPrescriptionDetailError, setPrescriptionDetailLoading,
    setPatientDetailsLoading, setPatientDetails, setPatientDetailsError
} from '../../../slices/doctor/patientdashboard/reducer';
import {
    getCachedRubricDetails,
    setCachedRubricDetails,
    markPrefetchQueued,
    unmarkPrefetchQueued,
} from '../../../utils/rubricDetailsCache';
import {
    fetchRubricDetailsWithPriority,
    getQueuedRubricDetailsFetch,
} from '../../../utils/rubricDetailsFetchQueue';

let rubricDetailsRequestSeq = 0;

export const getAllopathicDrugForDropdown = (data) => async (dispatch) => {
    try {
        const response = await getAllopathicDrugForDropdownApi(data);
        dispatch(setAllopathicDrugForDropdownList(response.data));
    }
    catch (error) {
        dispatch(setAllopathicDrugForDropdownError(error));
    }
}

export const getAllopathicDrugForDropdownById = (data) => async (dispatch) => {
    try {
        dispatch(setAllopathicDrugForDropdownByIdLoading(true));
        const response = await getAllopathicDrugForDropdownByIdApi(data);
        dispatch(setAllopathicDrugForDropdownByIdList(response));
    }
    catch (error) {
        dispatch(setAllopathicDrugForDropdownError(error));
    }
}

export const getRemedyDDLForPatient = (data) => async (dispatch) => {
    try {
        dispatch(setRemedyDDLLoading(true));
        const response = await getRemedyDDLApi(data);
        dispatch(setRemedyDDLList(response));
    }
    catch (error) {
        dispatch(setRemedyDDLError(error));
    }
    finally {
        dispatch(setRemedyDDLLoading(false));
    }
}

export const getAuthorDDLForPatient = (data) => async (dispatch) => {
    try {
        dispatch(setAuthorDDLLoading(true));
        const response = await getAuthorDDLApi(data);
        dispatch(setAuthorDDLList(response));
    }
    catch (error) {
        dispatch(setAuthorDDLError(error));
    }
    finally {
        dispatch(setAuthorDDLLoading(false));
    }
}

export const diagnosisSearch = (data) => async (dispatch) => {
    try {
        dispatch(setDiagnosisSearchLoading(true));
        const response = await diagnosisSearchApi(data);
        dispatch(setDiagnosisSearchList(response));
    }
    catch (error) {
        dispatch(setDiagnosisSearchError(error));
    }
    finally {
        dispatch(setDiagnosisSearchLoading(false));
    }
}

export const getIntensitiesForPatient = (data) => async (dispatch) => {
    try {
        dispatch(setIntensitiesForPatientLoading(true));
        const response = await getIntensitiesForPatientApi(data);
        dispatch(setIntensitiesForPatientList(response));
    }
    catch (error) {
        dispatch(setIntensitiesForPatientError(error));
    }
    finally {
        dispatch(setIntensitiesForPatientLoading(false));
    }
}

export const getThrepoticByDiagnosisId = (data) => async (dispatch) => {
    try {
        dispatch(setThrepoticByDiagnosisIdLoading(true));
        const response = await getThrepoticByDiagnosisIdApi(data);
        dispatch(setThrepoticByDiagnosisIdList(response));
    }
    catch (error) {
        dispatch(setThrepoticByDiagnosisIdError(error));
    }
    finally {
        dispatch(setThrepoticByDiagnosisIdLoading(false));
    }
}

export const getDiagnosisKeywordByTab = (data) => async (dispatch) => {
    console.log('getDiagnosisKeywordByTab thunk called with:', data);
    try {
        dispatch(setDiagnosisKeywordByTabLoading(true));
        console.log('About to call API with data:', data);
        const response = await getDiagnosisKeywordByTabApi(data);
        console.log('API response received:', response);
        dispatch(setDiagnosisKeywordByTabList(response));
        return { payload: response }; // Return the response data
    }
    catch (error) {
        console.error('Error in getDiagnosisKeywordByTab thunk:', error);
        dispatch(setDiagnosisKeywordByTabError(error));
        throw error; // Re-throw to handle in component
    }
    finally {
        dispatch(setDiagnosisKeywordByTabLoading(false));
    }
}

export const getPatientBoardData = (data) => async (dispatch) => {
    try {
        dispatch(setPatientBoardDataLoading(true));
        const response = await getPatientBoardDataApi(data);
        dispatch(setPatientBoardDataList(response));
    }
    catch (error) {
        dispatch(setPatientBoardDataError(error));
    }
    finally {
        dispatch(setPatientBoardDataLoading(false));
    }
}

export const getQuestionSectionsBySubSectionId = (data) => async (dispatch) => {
    try {
        dispatch(setQuestionSectionsBySubSectionIdLoading(true));
        const response = await getQuestionSectionsBySubSectionIdApi(data);
        dispatch(setQuestionSectionsBySubSectionIdList(response));
    }
    catch (error) {
        dispatch(setQuestionSectionsBySubSectionIdError(error));
    }
    finally {
        dispatch(setQuestionSectionsBySubSectionIdLoading(false));
    }
}

const applyRubricDetailsToStore = (dispatch, response) => {
    dispatch(setRubricDetailsList(response));
    dispatch(setRubricDetailsError(null));
    dispatch(setRubricDetailsLoading(false));
    dispatch(setRubricDetailsRefreshing(false));
};

const createRubricDetailsFetch = (subSectionId) => () =>
    getRubricDetailsApi({ subSectionId }).then((response) => {
        setCachedRubricDetails(subSectionId, response);
        unmarkPrefetchQueued(subSectionId);
        return response;
    });

export const getRubricDetails = (data) => async (dispatch) => {
    const subSectionId = Number(data?.subSectionId);
    const prefetchOnly = Boolean(data?.prefetchOnly);
    const requestId = ++rubricDetailsRequestSeq;

    if (!Number.isFinite(subSectionId) || subSectionId <= 0) {
        return null;
    }

    const cached = getCachedRubricDetails(subSectionId);
    if (cached) {
        if (!prefetchOnly) {
            applyRubricDetailsToStore(dispatch, cached);
        }
        return cached;
    }

    const existingRequest = getQueuedRubricDetailsFetch(subSectionId);
    if (existingRequest) {
        if (!prefetchOnly) {
            dispatch(setRubricDetailsLoading(false));
            dispatch(setRubricDetailsRefreshing(true));
        }
        try {
            const response = await existingRequest;
            if (!prefetchOnly && requestId === rubricDetailsRequestSeq) {
                applyRubricDetailsToStore(dispatch, response);
            }
            return response;
        } catch (error) {
            if (!prefetchOnly && requestId === rubricDetailsRequestSeq) {
                dispatch(setRubricDetailsError(error));
                dispatch(setRubricDetailsLoading(false));
                dispatch(setRubricDetailsRefreshing(false));
            }
            throw error;
        }
    }

    if (prefetchOnly && !markPrefetchQueued(subSectionId)) {
        return null;
    }

    if (!prefetchOnly) {
        dispatch(setRubricDetailsLoading(true));
        dispatch(setRubricDetailsRefreshing(false));
    }

    const execute = createRubricDetailsFetch(subSectionId);
    const priority = prefetchOnly ? 'low' : 'high';

    try {
        const response = await fetchRubricDetailsWithPriority(
            subSectionId,
            execute,
            { priority }
        );
        if (response == null) {
            return null;
        }
        if (!prefetchOnly && requestId === rubricDetailsRequestSeq) {
            applyRubricDetailsToStore(dispatch, response);
        }
        return response;
    } catch (error) {
        unmarkPrefetchQueued(subSectionId);
        if (!prefetchOnly && requestId === rubricDetailsRequestSeq) {
            dispatch(setRubricDetailsError(error));
            dispatch(setRubricDetailsLoading(false));
            dispatch(setRubricDetailsRefreshing(false));
        }
        throw error;
    }
}

// Patient details for header
export const getPatientDetails = (data) => async (dispatch) => {
    try {
        dispatch(setPatientDetailsLoading(true));
        const response = await getPatientDetailsApi(data);
        const details = response?.resultObject || response || null;
        dispatch(setPatientDetails(details));
    } catch (error) {
        dispatch(setPatientDetailsError(error));
    } finally {
        dispatch(setPatientDetailsLoading(false));
    }
}

export const getRubricByKeywordId = (data) => async (dispatch) => {
    console.log('getRubricByKeywordId thunk called with:', data);
    try {
        dispatch(setRubricByKeywordIdLoading(true));
        console.log('About to call getRubricByKeywordId API');
        const response = await getRubricByKeywordIdApi(data);
        console.log('getRubricByKeywordId API response:', response);
        // Ensure empty array if response is null, undefined, or empty
        const responseData = (Array.isArray(response) && response.length > 0) ? response : [];
        dispatch(setRubricByKeywordIdList(responseData));
        return { payload: responseData };
    }
    catch (error) {
        console.error('Error in getRubricByKeywordId thunk:', error);
        dispatch(setRubricByKeywordIdError(error));
        // Set empty array on error
        dispatch(setRubricByKeywordIdList([]));
        throw error;
    }
    finally {
        dispatch(setRubricByKeywordIdLoading(false));
    }
}

export const searchRubricsByKeyword = (data) => async (dispatch, getState) => {
    const { keyword, pageNumber = 1, pageSize = 10, append = false, sectionIds } = data || {};
    try {
        if (!append) {
            dispatch(setRubricByKeywordIdLoading(true));
        }
        const response = await searchRubricsByKeywordApi({ keyword, pageNumber, pageSize, sectionIds });
        const paged = normalizeClinicalPatternRubricPagedResponse(response);
        const items = Array.isArray(paged.items) ? paged.items : [];

        if (append) {
            const existing = getState()?.PatientDashboard?.rubricByKeywordIdList || [];
            dispatch(setRubricByKeywordIdList(mergeClinicalPatternRubricPages(existing, items)));
        } else {
            dispatch(setRubricByKeywordIdList(items));
        }

        return { payload: { ...paged, items } };
    } catch (error) {
        console.error('Error in searchRubricsByKeyword thunk:', error);
        dispatch(setRubricByKeywordIdError(error));
        if (!append) {
            dispatch(setRubricByKeywordIdList([]));
        }
        throw error;
    } finally {
        if (!append) {
            dispatch(setRubricByKeywordIdLoading(false));
        }
    }
};

export const getRemedyCounts = (data) => async (dispatch) => {
    try {
        dispatch(setRemedyCountsLoading(true));
        const response = await getRemedyCountsApi(data);
        dispatch(setRemedyCountsList(response));
    }
    catch (error) {
        dispatch(setRemedyCountsError(error));
    }
    finally {
        dispatch(setRemedyCountsLoading(false));
    }
}

export const getCommanUnCommanRubricsDetails = (data) => async (dispatch) => {
    try {
        dispatch(setCommanUnCommanRubricsDetailsLoading(true));
        const response = await getCommanUnCommanRubricsDetailsApi(data);
        dispatch(setCommanUnCommanRubricsDetailsList(response));
    }
    catch (error) {
        dispatch(setCommanUnCommanRubricsDetailsError(error));
    }
    finally {
        dispatch(setCommanUnCommanRubricsDetailsLoading(false));
    }
}

export const getDifferentialMateriaMedica = (data) => async (dispatch) => {
    try {
        dispatch(setDifferentialMateriaMedicaLoading(true));
        const response = await getDifferentialMateriaMedicaApi(data);
        dispatch(setDifferentialMateriaMedicaList(response));
    }
    catch (error) {
        dispatch(setDifferentialMateriaMedicaError(error));
    }
    finally {
        dispatch(setDifferentialMateriaMedicaLoading(false));
    }
}

export const getRepertorizarionRemedyForAccordion = (data) => async (dispatch) => {
    try {
        dispatch(setRepertorizarionRemedyForAccordionLoading(true));
        const response = await getRepertorizarionRemedyForAccordionApi(data);
        dispatch(setRepertorizarionRemedyForAccordionList(response));
    }
    catch (error) {
        dispatch(setRepertorizarionRemedyForAccordionError(error));
    }
    finally {
        dispatch(setRepertorizarionRemedyForAccordionLoading(false));
    }
}

export const getMateriaMedicaHeadingByAuthorId = (data) => async (dispatch) => {
    try {
        dispatch(setMateriaMedicaHeadingByAuthorIdLoading(true));
        const response = await getMateriaMedicaHeadingByAuthorIdApi(data);
        dispatch(setMateriaMedicaHeadingByAuthorIdList(response));
    }
    catch (error) {
        dispatch(setMateriaMedicaHeadingByAuthorIdError(error));
    }
    finally {
        dispatch(setMateriaMedicaHeadingByAuthorIdLoading(false));
    }
}

export const getEliminationData = (data) => async (dispatch) => {
    try {
        dispatch(setEliminationDataLoading(true));
        const response = await getEliminationDataApi(data);
        dispatch(setEliminationDataList(response));
    }
    catch (error) {
        dispatch(setEliminationDataError(error));
    }
    finally {
        dispatch(setEliminationDataLoading(false));
    }
}

export const getPatientLabTestDDL = (data) => async (dispatch) => {
    try {
        dispatch(setPatientLabTestDDLLoading(true));
        const response = await getPatientLabTestDDLApi(data);
        // Handle response - check if it's wrapped in data property or direct array
        const labTestList = Array.isArray(response) ? response : (response?.data || response);
        dispatch(setPatientLabTestDDLList(labTestList));
    }
    catch (error) {
        dispatch(setPatientLabTestDDLError(error));
    }
    finally {
        dispatch(setPatientLabTestDDLLoading(false));
    }
}

export const getPatientLabOrder = (data) => async (dispatch) => {
    try {
        dispatch(setPatientLabOrderLoading(true));
        const response = await getPatientLabOrderApi(data);
        // Handle response - check if it's wrapped in data property or direct array
        const labOrderList = Array.isArray(response) ? response : (response?.data || response);
        dispatch(setPatientLabOrderList(labOrderList));
    }
    catch (error) {
        dispatch(setPatientLabOrderError(error));
    }
    finally {
        dispatch(setPatientLabOrderLoading(false));
    }
}

export const getPatientLabEntry = (data) => async (dispatch) => {
    try {
        dispatch(setPatientLabEntryLoading(true));
        const response = await getPatientLabEntryApi(data);
        // Handle response - check if it's wrapped in data property or direct array
        const labEntryList = Array.isArray(response) ? response : (response?.data || response);
        dispatch(setPatientLabEntryList(labEntryList));
    }
    catch (error) {
        dispatch(setPatientLabEntryError(error));
    }
    finally {
        dispatch(setPatientLabEntryLoading(false));
    }
}

export const saveUpdateAppointmentHistoryNote = (data) => async (dispatch) => {
    try {
        dispatch(setAppointmentHistoryNoteLoading(true));
        const response = await saveUpdateAppointmentHistoryNoteApi(data);
        dispatch(setAppointmentHistoryNoteList(response));
    }
    catch (error) {
        dispatch(setAppointmentHistoryNoteError(error));
    }
    finally {
        dispatch(setAppointmentHistoryNoteLoading(false));
    }
}

export const getPrescriptionRemedy = (data) => async (dispatch) => {
    try {
        dispatch(setPrescriptionRemedyLoading(true));
        const response = await getPrescriptionRemedyApi(data);
        // Handle response - check if it's wrapped in data property or direct array
        const remedyList = Array.isArray(response) ? response : (response?.data || response);
        dispatch(setPrescriptionRemedyList(remedyList));
    }
    catch (error) {
        dispatch(setPrescriptionRemedyError(error));
    }
    finally {
        dispatch(setPrescriptionRemedyLoading(false));
    }
}

export const savePatientLabOrder = (data) => async (dispatch) => {
    try {
        dispatch(setPatientLabOrderLoading(true));
        const response = await savePatientLabOrderApi(data);
        // dispatch(setPatientLabOrderList(response));
    }
    catch (error) {
        dispatch(setPatientLabOrderError(error));
    }
    finally {
        dispatch(setPatientLabOrderLoading(false));
    }
}

export const savePatientLabEntry = (data) => async (dispatch) => {
    try {
        dispatch(setPatientLabEntryLoading(true));
        const response = await savePatientLabEntryApi(data);
        // dispatch(setPatientLabEntryList(response));
    }
    catch (error) {
        dispatch(setPatientLabEntryError(error));
    }
    finally {
        dispatch(setPatientLabEntryLoading(false));
    }
}

export const savePrescriptionDetail = (data) => async (dispatch) => {
    try {
        dispatch(setPrescriptionDetailLoading(true));
        const response = await savePrescriptionDetailApi(data);
        // dispatch(setPrescriptionDetailList(response));
    }
    catch (error) {
        dispatch(setPrescriptionDetailError(error));
    }
    finally {
        dispatch(setPrescriptionDetailLoading(false));
    }
}