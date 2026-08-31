import {
    setCountLoading, setCounts, setCountError,
    setAppointmentLoading,
    setAppointmentError,
    setAppointmentSuccess,
    setPatientListLoading,
    setPatientList,
    setPatientListError,
    setDoctorListLoading,
    setDoctorList,
    setDoctorListError,
    setAppointmentListLoading,
    setAppointmentList,
    setAppointmentListError,
    setPatientLoading,
    setPatient,
    setPatientError,
    setPatientSuccess,
    setCountriesLoading,
    setCountries,
    setCountriesError,
    setStatesLoading,
    setStates,
    setStatesError,
    setPackagesLoading,
    setPackages,
    setPackagesError,
    setOrderLoading,
    setOrderSuccess,
    setOrderError,
    setSubscriptionLoading,
    setSubscriptionSuccess,
    setSubscriptionError,
    setAppointmentHistoryNotesLoading,
    setAppointmentHistoryNotes,
    setAppointmentHistoryNotesError,
    setUpdateAppointmentStatusLoading,
    setUpdateAppointmentStatusSuccess,
    setUpdateAppointmentStatusError,
    setPatientStatsChartsLoading,
    setPatientStatsCharts,
    setPatientStatsChartsError
} from './reducer';
import {
    getDoctorDashboardCount as getDoctorDashboardCountApi,
    getPatientStatsCharts as getPatientStatsChartsApi,
    patientNewAppointment as patientNewAppointmentApi,
    getPatientList as getPatientListApi,
    getDoctorList as getDoctorListApi,
    getAppointmentList as getAppointmentListApi,
    createPatient as createPatientApi,
    deletePatient as deletePatientApi,
    getCountries as getCountriesApi,
    getStates as getStatesApi,
    getPackages as getPackagesApi,
    generateOrderId as generateOrderIdApi,
    saveUpdateSubscription as saveUpdateSubscriptionApi,
    getAppointmentHistoryNotes as getAppointmentHistoryNotesApi,
    saveUpdateAppointmentHistoryNote as saveUpdateAppointmentHistoryNoteApi,
    updateAppointmentStatus as updateAppointmentStatusApi
} from '../../../helpers/realbackend_helper';

export const fetchDoctorDashboardCounts = (payload) => async (dispatch) => {
    try {
        dispatch(setCountLoading(true));
        const response = await getDoctorDashboardCountApi(payload);
        console.log("fetchDoctorDashboardCounts response :", response);
        dispatch(setCounts(response));
        dispatch(setCountLoading(false));
    } catch (error) {
        dispatch(setCountError(error));
        dispatch(setCountLoading(false));
    }
}

export const patientNewAppointment = (payload) => async (dispatch) => {
    try {
        dispatch(setAppointmentLoading(true));
        const response = await patientNewAppointmentApi(payload);
        dispatch(setAppointmentSuccess(response));
    } catch (error) {
        dispatch(setAppointmentError(error));
    } finally {
        dispatch(setAppointmentLoading(false));
    }
};

export const getPatientList = (payload) => async (dispatch) => {
    try {
        dispatch(setPatientListLoading(true));
        const response = await getPatientListApi(payload);
        dispatch(setPatientList(response));
        return response;
    } catch (error) {
        dispatch(setPatientListError(error));
        throw error;
    } finally {
        dispatch(setPatientListLoading(false));
    }
};

export const getDoctorList = (payload) => async (dispatch) => {
    try {
        dispatch(setDoctorListLoading(true));
        const response = await getDoctorListApi(payload);
        dispatch(setDoctorList(response));
    } catch (error) {
        dispatch(setDoctorListError(error));
    } finally {
        dispatch(setDoctorListLoading(false));
    }
};

export const getAppointmentList = (payload) => async (dispatch) => {
    try {
        dispatch(setAppointmentListLoading(true));
        const response = await getAppointmentListApi(payload);
        dispatch(setAppointmentList(response));
    } catch (error) {
        dispatch(setAppointmentListError(error));
    } finally {
        dispatch(setAppointmentListLoading(false));
    }
};

export const createPatient = (payload) => async (dispatch) => {
    try {
        dispatch(setPatientLoading(true));
        const response = await createPatientApi(payload);
        dispatch(setPatient(response));
        const isUpdate = payload?.patientID > 0;
        dispatch(setPatientSuccess(isUpdate ? "Patient updated successfully!" : "Patient created successfully!"));
        return response;
    } catch (error) {
        dispatch(setPatientError(error));
        throw error;
    } finally {
        dispatch(setPatientLoading(false));
    }
};

export const deletePatient = (payload) => async (dispatch) => {
    try {
        dispatch(setPatientLoading(true));
        await deletePatientApi(payload);
        dispatch(setPatientSuccess("Patient deleted successfully!"));
    } catch (error) {
        dispatch(setPatientError(error));
        throw error;
    } finally {
        dispatch(setPatientLoading(false));
    }
};

export const getCountries = (payload) => async (dispatch) => {
    try {
        dispatch(setCountriesLoading(true));
        const response = await getCountriesApi(payload);
        dispatch(setCountries(response));
    } catch (error) {
        dispatch(setCountriesError(error));
    } finally {
        dispatch(setCountriesLoading(false));
    }
};

export const getStates = (payload) => async (dispatch) => {
    try {
        dispatch(setStatesLoading(true));
        const response = await getStatesApi(payload);
        dispatch(setStates(response));
    } catch (error) {
        dispatch(setStatesError(error));
    } finally {
        dispatch(setStatesLoading(false));
    }
};

export const getPackages = (payload) => async (dispatch) => {
    try {
        dispatch(setPackagesLoading(true));
        const response = await getPackagesApi(payload);
        dispatch(setPackages(response));
    } catch (error) {
        dispatch(setPackagesError(error));
    } finally {
        dispatch(setPackagesLoading(false));
    }
};

export const generateOrderId = (payload) => async (dispatch) => {
    try {
        dispatch(setOrderLoading(true));
        const response = await generateOrderIdApi(payload);
        dispatch(setOrderSuccess(response));
        return response;
    } catch (error) {
        dispatch(setOrderError(error));
    } finally {
        dispatch(setOrderLoading(false));
    }
};

export const saveUpdateSubscription = (payload) => async (dispatch) => {
    try {
        dispatch(setSubscriptionLoading(true));
        const response = await saveUpdateSubscriptionApi(payload);
        dispatch(setSubscriptionSuccess(response));
    } catch (error) {
        dispatch(setSubscriptionError(error));
    } finally {
        dispatch(setSubscriptionLoading(false));
    }
};

export const getAppointmentHistoryNotes = (payload) => async (dispatch) => {
    try {
        dispatch(setAppointmentHistoryNotesLoading(true));
        const response = await getAppointmentHistoryNotesApi(payload);
        dispatch(setAppointmentHistoryNotes(response?.data || response));
    } catch (error) {
        dispatch(setAppointmentHistoryNotesError(error));
    } finally {
        dispatch(setAppointmentHistoryNotesLoading(false));
    }
};

export const saveUpdateAppointmentHistoryNote = (payload) => async (dispatch) => {
    try {
        const response = await saveUpdateAppointmentHistoryNoteApi(payload);
        return response?.data || response;
    } catch (error) {
        dispatch(setAppointmentHistoryNotesError(error));
        throw error;
    }
};

export const updateAppointmentStatus = (payload) => async (dispatch) => {
    try {
        dispatch(setUpdateAppointmentStatusLoading(true));
        const response = await updateAppointmentStatusApi(payload);
        dispatch(setUpdateAppointmentStatusSuccess(response));
        return response;
    } catch (error) {
        dispatch(setUpdateAppointmentStatusError(error));
        throw error;
    } finally {
        dispatch(setUpdateAppointmentStatusLoading(false));
    }
};

const getAuthUserId = () => {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authUser'));
        return auth?.userId || auth?.user?.userId || auth?.user?.id;
    } catch {
        return null;
    }
};

export const fetchPatientStatsCharts = (payload) => async (dispatch, getState) => {
    const period = payload?.period || 'ALL';
    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;
    const userId = payload?.userId || getAuthUserId();

    if (!userId) {
        return;
    }

    const cacheKey = payload?.cacheKey
        || (period === 'ALL' && fromDate && toDate ? `ALL|${fromDate}|${toDate}` : period);

    const cached = getState()?.DoctorDashboard?.patientStatsChartsByKey?.[cacheKey];
    if (cached && !payload?.force) {
        return cached;
    }

    try {
        dispatch(setPatientStatsChartsLoading(true));
        const response = await getPatientStatsChartsApi({ userId, period, fromDate, toDate });
        dispatch(setPatientStatsCharts({ cacheKey, data: response }));
        dispatch(setPatientStatsChartsError(null));
        return response;
    } catch (error) {
        dispatch(setPatientStatsChartsError(error));
        throw error;
    } finally {
        dispatch(setPatientStatsChartsLoading(false));
    }
};