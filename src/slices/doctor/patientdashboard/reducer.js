import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
    allopathicDrugForDropdownLoading: false,
    allopathicDrugForDropdownError: null,
    allopathicDrugForDropdownList: null,
    allopathicDrugForDropdownByIdLoading: false,
    allopathicDrugForDropdownByIdError: null,
    allopathicDrugForDropdownByIdList: null,
    remedyDDLLoading: false,
    remedyDDLError: null,
    remedyDDLList: null,
    authorDDLLoading: false,
    authorDDLError: null,
    authorDDLList: null,
    diagnosisSearchLoading: false,
    diagnosisSearchError: null,
    diagnosisSearchList: null,
    intensitiesForPatientLoading: false,
    intensitiesForPatientError: null,
    intensitiesForPatientList: null,
    threpoticByDiagnosisIdLoading: false,
    threpoticByDiagnosisIdError: null,
    threpoticByDiagnosisIdList: null,
    diagnosisKeywordByTabLoading: false,
    diagnosisKeywordByTabError: null,
    diagnosisKeywordByTabList: null,
    patientBoardDataLoading: false,
    patientBoardDataError: null,
    patientBoardDataList: null,
    questionSectionsBySubSectionIdLoading: false,
    questionSectionsBySubSectionIdError: null,
    questionSectionsBySubSectionIdList: null,
    rubricDetailsLoading: false,
    rubricDetailsRefreshing: false,
    rubricDetailsError: null,
    rubricDetailsList: null,
    rubricDetailsBySubSectionIdLoading: false,
    rubricDetailsBySubSectionIdError: null,
    rubricDetailsBySubSectionIdList: null,
    rubricByKeywordIdLoading: false,
    rubricByKeywordIdError: null,
    rubricByKeywordIdList: null,
    remedyCountsLoading: false,
    remedyCountsError: null,
    remedyCountsList: null,
    commanUnCommanRubricsDetailsLoading: false,
    commanUnCommanRubricsDetailsError: null,
    commanUnCommanRubricsDetailsList: null,
    differentialMateriaMedicaLoading: false,
    differentialMateriaMedicaError: null,
    differentialMateriaMedicaList: null,
    repertorizarionRemedyForAccordionLoading: false,
    repertorizarionRemedyForAccordionError: null,
    repertorizarionRemedyForAccordionList: null,
    materiaMedicaHeadingByAuthorIdLoading: false,
    materiaMedicaHeadingByAuthorIdError: null,
    materiaMedicaHeadingByAuthorIdList: null,
    eliminationDataLoading: false,
    eliminationDataError: null,
    eliminationDataList: null,
    patientLabTestDDLLoading: false,
    patientLabTestDDLError: null,
    patientLabTestDDLList: null,
    patientLabOrderLoading: false,
    patientLabOrderError: null,
    patientLabOrderList: null,
    patientLabEntryLoading: false,
    patientLabEntryError: null,
    patientLabEntryList: null,
    appointmentHistoryNoteLoading: false,
    appointmentHistoryNoteError: null,
    appointmentHistoryNoteList: null,
    prescriptionRemedyLoading: false,
    prescriptionRemedyError: null,
    prescriptionRemedyList: null,
    prescriptionDetailLoading: false,
    prescriptionDetailError: null,
    prescriptionDetailList: null,
    patientDetailsLoading: false,
    patientDetailsError: null,
    patientDetails: null,
};

const PatientDashboardSlice = createSlice({
    name: 'PatientDashboard',
    initialState,
    reducers: {
        setAllopathicDrugForDropdownLoading(state, action) {
            state.allopathicDrugForDropdownLoading = action.payload;
        },
        setAllopathicDrugForDropdownList(state, action) {
            state.allopathicDrugForDropdownList = action.payload;
        },
        setAllopathicDrugForDropdownError(state, action) {
            state.allopathicDrugForDropdownError = action.payload;
        },
        setAllopathicDrugForDropdownByIdLoading(state, action) {
            state.allopathicDrugForDropdownByIdLoading = action.payload;
        },
        setAllopathicDrugForDropdownByIdList(state, action) {
            state.allopathicDrugForDropdownByIdList = action.payload;
        },
        setAllopathicDrugForDropdownByIdError(state, action) {
            state.allopathicDrugForDropdownByIdError = action.payload;
        },
        setRemedyDDLLoading(state, action) {
            state.remedyDDLLoading = action.payload;
        },
        setRemedyDDLList(state, action) {
            state.remedyDDLList = action.payload;
        },
        setRemedyDDLError(state, action) {
            state.remedyDDLError = action.payload;
        },
        setAuthorDDLLoading(state, action) {
            state.authorDDLLoading = action.payload;
        },
        setAuthorDDLList(state, action) {
            state.authorDDLList = action.payload;
        },
        setAuthorDDLError(state, action) {
            state.authorDDLError = action.payload;
        },
        setDiagnosisSearchLoading(state, action) {
            state.diagnosisSearchLoading = action.payload;
        },
        setDiagnosisSearchList(state, action) {
            state.diagnosisSearchList = action.payload;
        },
        setDiagnosisSearchError(state, action) {
            state.diagnosisSearchError = action.payload;
        },
        setIntensitiesForPatientLoading(state, action) {
            state.intensitiesForPatientLoading = action.payload;
        },
        setIntensitiesForPatientList(state, action) {
            state.intensitiesForPatientList = action.payload;
        },
        setIntensitiesForPatientError(state, action) {
            state.intensitiesForPatientError = action.payload;
        },
        setThrepoticByDiagnosisIdLoading(state, action) {
            state.threpoticByDiagnosisIdLoading = action.payload;
        },
        setThrepoticByDiagnosisIdList(state, action) {
            state.threpoticByDiagnosisIdList = action.payload;
        },
        setThrepoticByDiagnosisIdError(state, action) {
            state.threpoticByDiagnosisIdError = action.payload;
        },
        setDiagnosisKeywordByTabLoading(state, action) {
            state.diagnosisKeywordByTabLoading = action.payload;
        },
        setDiagnosisKeywordByTabList(state, action) {
            state.diagnosisKeywordByTabList = action.payload;
        },
        setDiagnosisKeywordByTabError(state, action) {
            state.diagnosisKeywordByTabError = action.payload;
        },
        setPatientBoardDataLoading(state, action) {
            state.patientBoardDataLoading = action.payload;
        },
        setPatientBoardDataList(state, action) {
            state.patientBoardDataList = action.payload;
        },
        setPatientBoardDataError(state, action) {
            state.patientBoardDataError = action.payload;
        },
        setQuestionSectionsBySubSectionIdLoading(state, action) {
            state.questionSectionsBySubSectionIdLoading = action.payload;
        },
        setQuestionSectionsBySubSectionIdList(state, action) {
            state.questionSectionsBySubSectionIdList = action.payload;
        },
        setQuestionSectionsBySubSectionIdError(state, action) {
            state.questionSectionsBySubSectionIdError = action.payload;
        },
        setRubricDetailsLoading(state, action) {
            state.rubricDetailsLoading = action.payload;
        },
        setRubricDetailsRefreshing(state, action) {
            state.rubricDetailsRefreshing = action.payload;
        },
        setRubricDetailsList(state, action) {
            state.rubricDetailsList = action.payload;
        },
        setRubricDetailsError(state, action) {
            state.rubricDetailsError = action.payload;
        },
        setRubricDetailsBySubSectionIdLoading(state, action) {
            state.rubricDetailsBySubSectionIdLoading = action.payload;
        },
        setRubricDetailsBySubSectionIdList(state, action) {
            state.rubricDetailsBySubSectionIdList = action.payload;
        },
        setRubricDetailsBySubSectionIdError(state, action) {
            state.rubricDetailsBySubSectionIdError = action.payload;
        },
        setRubricByKeywordIdLoading(state, action) {
            state.rubricByKeywordIdLoading = action.payload;
        },
        setRubricByKeywordIdList(state, action) {
            state.rubricByKeywordIdList = action.payload;
        },
        setRubricByKeywordIdError(state, action) {
            state.rubricByKeywordIdError = action.payload;
        },
        setRemedyCountsLoading(state, action) {
            state.remedyCountsLoading = action.payload;
        },
        setRemedyCountsList(state, action) {
            state.remedyCountsList = action.payload;
        },
        setRemedyCountsError(state, action) {
            state.remedyCountsError = action.payload;
        },
        setCommanUnCommanRubricsDetailsLoading(state, action) {
            state.commanUnCommanRubricsDetailsLoading = action.payload;
        },
        setCommanUnCommanRubricsDetailsList(state, action) {
            state.commanUnCommanRubricsDetailsList = action.payload;
        },
        setCommanUnCommanRubricsDetailsError(state, action) {
            state.commanUnCommanRubricsDetailsError = action.payload;
        },
        setDifferentialMateriaMedicaLoading(state, action) {
            state.differentialMateriaMedicaLoading = action.payload;
        },
        setDifferentialMateriaMedicaList(state, action) {
            state.differentialMateriaMedicaList = action.payload;
        },
        setDifferentialMateriaMedicaError(state, action) {
            state.differentialMateriaMedicaError = action.payload;
        },
        setRepertorizarionRemedyForAccordionLoading(state, action) {
            state.repertorizarionRemedyForAccordionLoading = action.payload;
        },
        setRepertorizarionRemedyForAccordionList(state, action) {
            state.repertorizarionRemedyForAccordionList = action.payload;
        },
        setRepertorizarionRemedyForAccordionError(state, action) {
            state.repertorizarionRemedyForAccordionError = action.payload;
        },
        setMateriaMedicaHeadingByAuthorIdLoading(state, action) {
            state.materiaMedicaHeadingByAuthorIdLoading = action.payload;
        },
        setMateriaMedicaHeadingByAuthorIdList(state, action) {
            state.materiaMedicaHeadingByAuthorIdList = action.payload;
        },
        setMateriaMedicaHeadingByAuthorIdError(state, action) {
            state.materiaMedicaHeadingByAuthorIdError = action.payload;
        },
        setEliminationDataLoading(state, action) {
            state.eliminationDataLoading = action.payload;
        },
        setEliminationDataList(state, action) {
            state.eliminationDataList = action.payload;
        },
        setEliminationDataError(state, action) {
            state.eliminationDataError = action.payload;
        },
        setPatientLabTestDDLLoading(state, action) {
            state.patientLabTestDDLLoading = action.payload;
        },
        setPatientLabTestDDLList(state, action) {
            state.patientLabTestDDLList = action.payload;
        },
        setPatientLabTestDDLError(state, action) {
            state.patientLabTestDDLError = action.payload;
        },
        setPatientLabOrderLoading(state, action) {
            state.patientLabOrderLoading = action.payload;
        },
        setPatientLabOrderList(state, action) {
            state.patientLabOrderList = action.payload;
        },
        setPatientLabOrderError(state, action) {
            state.patientLabOrderError = action.payload;
        },
        setPatientLabEntryLoading(state, action) {
            state.patientLabEntryLoading = action.payload;
        },
        setPatientLabEntryList(state, action) {
            state.patientLabEntryList = action.payload;
        },
        setPatientLabEntryError(state, action) {
            state.patientLabEntryError = action.payload;
        },
        setAppointmentHistoryNoteLoading(state, action) {
            state.appointmentHistoryNoteLoading = action.payload;
        },
        setAppointmentHistoryNoteList(state, action) {
            state.appointmentHistoryNoteList = action.payload;
        },
        setAppointmentHistoryNoteError(state, action) {
            state.appointmentHistoryNoteError = action.payload;
        },
        setPrescriptionRemedyLoading(state, action) {
            state.prescriptionRemedyLoading = action.payload;
        },
        setPrescriptionRemedyList(state, action) {
            state.prescriptionRemedyList = action.payload;
        },
        setPrescriptionRemedyError(state, action) {
            state.prescriptionRemedyError = action.payload;
        },
        setPrescriptionDetailLoading(state, action) {
            state.prescriptionDetailLoading = action.payload;
        },
        setPrescriptionDetailList(state, action) {
            state.prescriptionDetailList = action.payload;
        },
        setPrescriptionDetailError(state, action) {
            state.prescriptionDetailError = action.payload;
        },
        setPatientDetailsLoading(state, action) {
            state.patientDetailsLoading = action.payload;
        },
        setPatientDetails(state, action) {
            state.patientDetails = action.payload;
        },
        setPatientDetailsError(state, action) {
            state.patientDetailsError = action.payload;
        }
    },
});

export const {
    setAllopathicDrugForDropdownLoading,
    setAllopathicDrugForDropdownList,
    setAllopathicDrugForDropdownError,
    setAllopathicDrugForDropdownByIdLoading,
    setAllopathicDrugForDropdownByIdList,
    setAllopathicDrugForDropdownByIdError,
    setRemedyDDLLoading,
    setRemedyDDLList,
    setRemedyDDLError,
    setAuthorDDLLoading,
    setAuthorDDLList,
    setAuthorDDLError,
    setDiagnosisSearchLoading,
    setDiagnosisSearchList,
    setDiagnosisSearchError,
    setIntensitiesForPatientLoading,
    setIntensitiesForPatientList,
    setIntensitiesForPatientError,
    setThrepoticByDiagnosisIdLoading,
    setThrepoticByDiagnosisIdList,
    setThrepoticByDiagnosisIdError,
    setDiagnosisKeywordByTabLoading,
    setDiagnosisKeywordByTabList,
    setDiagnosisKeywordByTabError,
    setPatientBoardDataLoading,
    setPatientBoardDataList,
    setPatientBoardDataError,
    setQuestionSectionsBySubSectionIdLoading,
    setQuestionSectionsBySubSectionIdList,
    setQuestionSectionsBySubSectionIdError,
    setRubricDetailsLoading,
    setRubricDetailsRefreshing,
    setRubricDetailsList,
    setRubricDetailsError,
    setRubricDetailsBySubSectionIdLoading,
    setRubricDetailsBySubSectionIdList,
    setRubricDetailsBySubSectionIdError,
    setRubricByKeywordIdLoading,
    setRubricByKeywordIdList,
    setRubricByKeywordIdError,
    setRemedyCountsLoading,
    setRemedyCountsList,
    setRemedyCountsError,
    setCommanUnCommanRubricsDetailsLoading,
    setCommanUnCommanRubricsDetailsList,
    setCommanUnCommanRubricsDetailsError,
    setDifferentialMateriaMedicaLoading,
    setDifferentialMateriaMedicaList,
    setDifferentialMateriaMedicaError,
    setRepertorizarionRemedyForAccordionLoading,
    setRepertorizarionRemedyForAccordionList,
    setRepertorizarionRemedyForAccordionError,
    setMateriaMedicaHeadingByAuthorIdLoading,
    setMateriaMedicaHeadingByAuthorIdList,
    setMateriaMedicaHeadingByAuthorIdError,
    setEliminationDataLoading,
    setEliminationDataList,
    setEliminationDataError,
    setPatientLabTestDDLLoading,
    setPatientLabTestDDLList,
    setPatientLabTestDDLError,
    setPatientLabOrderLoading,
    setPatientLabOrderList,
    setPatientLabOrderError,
    setPatientLabEntryLoading,
    setPatientLabEntryList,
    setPatientLabEntryError,
    setAppointmentHistoryNoteLoading,
    setAppointmentHistoryNoteList,
    setAppointmentHistoryNoteError,
    setPrescriptionRemedyLoading,
    setPrescriptionRemedyList,
    setPrescriptionRemedyError,
    setPrescriptionDetailLoading,
    setPrescriptionDetailList,
    setPrescriptionDetailError,
    setPatientDetailsLoading,
    setPatientDetails,
    setPatientDetailsError
} = PatientDashboardSlice.actions;

export default PatientDashboardSlice.reducer;