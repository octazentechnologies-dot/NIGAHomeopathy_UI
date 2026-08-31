import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    countLoading: false,
    countError: null,
    counts: null,
    appointmentLoading: false,
    appointmentError: null,
    appointmentSuccess: null,
    patientListLoading: false,
    patientListError: null,
    patientList: null,
    doctorListLoading: false,
    doctorListError: null,
    doctorList: null,
    appointmentListLoading: false,
    appointmentListError: null,
    appointmentList: null,
    patientLoading: false,
    patientError: null,
    patientSuccess: null,
    patient: null,
    countriesLoading: false,
    countriesError: null,
    countries: null,
    statesLoading: false,
    statesError: null,
    states: null,
    packagesLoading: false,
    packagesError: null,
    packages: null,
    orderLoading: false,
    orderError: null,
    orderSuccess: null,
    subscriptionLoading: false,
    subscriptionError: null,
    subscriptionSuccess: null,
    appointmentHistoryNotesLoading: false,
    appointmentHistoryNotesError: null,
    appointmentHistoryNotes: null,
    updateAppointmentStatusLoading: false,
    updateAppointmentStatusError: null,
    updateAppointmentStatusSuccess: null,
    patientStatsChartsLoading: false,
    patientStatsChartsError: null,
    patientStatsChartsByKey: {}
};

const DoctorDashboardSlice = createSlice({
    name: 'DoctorDashboard',
    initialState,
    reducers: {
        setCountLoading(state, action) {
            state.countLoading = action.payload;
        },
        setCounts(state, action) {
            state.counts = action.payload;
        },
        setCountError(state, action) {
            state.countError = action.payload;
        },
        setAppointmentLoading(state, action) {
            state.appointmentLoading = action.payload;
        },
        setAppointmentSuccess(state, action) {
            state.appointmentSuccess = action.payload;
            state.appointmentError = null;
        },
        setAppointmentError(state, action) {
            state.appointmentError = action.payload;
            state.appointmentSuccess = null;
        },
        setPatientListLoading(state, action) {
            state.patientListLoading = action.payload;
        },
        setPatientList(state, action) {
            state.patientList = action.payload;
        },
        setPatientListError(state, action) {
            state.patientListError = action.payload;
        },
        setDoctorListLoading(state, action) {
            state.doctorListLoading = action.payload;
        },
        setDoctorList(state, action) {
            state.doctorList = action.payload;
        },
        setDoctorListError(state, action) {
            state.doctorListError = action.payload;
        },
        setAppointmentListLoading(state, action) {
            state.appointmentListLoading = action.payload;
        },
        setAppointmentList(state, action) {
            state.appointmentList = action.payload;
        },
        setAppointmentListError(state, action) {
            state.appointmentListError = action.payload;
        },
        setPatientLoading(state, action) {
            state.patientLoading = action.payload;
        },
        setPatient(state, action) {
            state.patient = action.payload;
        },
        setPatientError(state, action) {
            state.patientError = action.payload;
        },
        setPatientSuccess(state, action) {
            state.patientSuccess = action.payload;
            state.patientError = null;
        },
        setCountriesLoading(state, action) {
            state.countriesLoading = action.payload;
        },
        setCountries(state, action) {
            state.countries = action.payload;
        },
        setCountriesError(state, action) {
            state.countriesError = action.payload;
        },
        setStatesLoading(state, action) {
            state.statesLoading = action.payload;
        },
        setStates(state, action) {
            state.states = action.payload;
        },
        setStatesError(state, action) {
            state.statesError = action.payload;
        },
        setPackagesLoading(state, action) {
            state.packagesLoading = action.payload;
        },
        setPackages(state, action) {
            state.packages = action.payload;
        },
        setPackagesError(state, action) {
            state.packagesError = action.payload;
        },
        setOrderLoading(state, action) {
            state.orderLoading = action.payload;
        },
        setOrderSuccess(state, action) {
            state.orderSuccess = action.payload;
            state.orderError = null;
        },
        setOrderError(state, action) {
            state.orderError = action.payload;
            state.orderSuccess = null;
        },
        setSubscriptionLoading(state, action) {
            state.subscriptionLoading = action.payload;
        },
        setSubscriptionSuccess(state, action) {
            state.subscriptionSuccess = action.payload;
            state.subscriptionError = null;
        },
        setSubscriptionError(state, action) {
            state.subscriptionError = action.payload;
            state.subscriptionSuccess = null;
        },
        setAppointmentHistoryNotesLoading(state, action) {
            state.appointmentHistoryNotesLoading = action.payload;
        },
        setAppointmentHistoryNotes(state, action) {
            state.appointmentHistoryNotes = action.payload;
        },
        setAppointmentHistoryNotesError(state, action) {
            state.appointmentHistoryNotesError = action.payload;
        },
        setUpdateAppointmentStatusLoading(state, action) {
            state.updateAppointmentStatusLoading = action.payload;
        },
        setUpdateAppointmentStatusSuccess(state, action) {
            state.updateAppointmentStatusSuccess = action.payload;
            state.updateAppointmentStatusError = null;
        },
        setUpdateAppointmentStatusError(state, action) {
            state.updateAppointmentStatusError = action.payload;
            state.updateAppointmentStatusSuccess = null;
        },
        setPatientStatsChartsLoading(state, action) {
            state.patientStatsChartsLoading = action.payload;
        },
        setPatientStatsCharts(state, action) {
            const { cacheKey, data } = action.payload;
            state.patientStatsChartsByKey[cacheKey] = data;
        },
        setPatientStatsChartsError(state, action) {
            state.patientStatsChartsError = action.payload;
        }
    }
});

export const {
    setCountLoading,
    setCounts,
    setCountError,
    setAppointmentLoading,
    setAppointmentSuccess,
    setAppointmentError,
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
} = DoctorDashboardSlice.actions;

export default DoctorDashboardSlice.reducer;






