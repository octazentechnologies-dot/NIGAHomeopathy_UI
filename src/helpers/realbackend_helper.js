import { APIClient, APIClients, apiHelpers } from "./api_helper";
import axios from "axios";
import { api as configApi } from "../config";

import * as url from "./url_helper";

import { importAPI } from './api_helper';

//default client using apiHelpers for enhanced API methods
const api = apiHelpers.default;

// Nigahomeopathy JSON client
const nigahomeoAPI = apiHelpers.nigahomeo;

// Nigahomeopathy multipart client
const nigahomeoMultipart = apiHelpers.nigahomeoMultipart;


/* API call start here added by Pranav on Date:12/02/25 */

export const login = data => api.post(url.LOGIN, data);
export const getSubscriptionStatus = () => api.get(url.SUBSCRIPTION_STATUS, null);

/* Doctor registration (public) — NigaHomeopathy API */
export const registerDoctor = data => nigahomeoAPI.post(url.REGISTER_DOCTOR, data);
export const activateUser = data => nigahomeoAPI.post(url.CHECK_ACTIVATION, data);

const unwrapRegistrationList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.resultObject)) return response.resultObject;
  if (Array.isArray(response?.Data)) return response.Data;
  return [];
};

export const getRegistrationCountries = async () =>
  unwrapRegistrationList(await nigahomeoAPI.get(url.REGISTRATION_COUNTRIES, null));

export const getRegistrationStates = async (countryId) =>
  unwrapRegistrationList(
    await nigahomeoAPI.get(url.REGISTRATION_STATES, countryId ? { countryId } : null)
  );

export const getRegistrationQualifications = async () => {
  try {
    const list = unwrapRegistrationList(await nigahomeoAPI.get(url.REGISTRATION_QUALIFICATIONS, null));
    if (list.length) return list;
  } catch {
    // fall through to admin list endpoint
  }

  try {
    return unwrapRegistrationList(
      await nigahomeoAPI.get(url.GET_QUALIFICATIONS, { PageNumber: 1, PageSize: 100 })
    );
  } catch {
    return [];
  }
};

/* User API calls */
export const getUserList = data => api.get(url.GET_USERS, data);
export const getUserById = userId => api.get(url.GET_USER_BY_ID + "/" + userId, null);
export const createUser = data => api.post(url.CREATE_USER, data);
export const updateUser = data => api.post(url.UPDATE_USER, data);

export const getSectionList = data => api.get(url.GET_SECTIONS, data);

export const createOrUpdateSection = data => api.post(url.CREATE_SECTION, data);

export const deleteSection = data => api.post(url.DELETE_SECTION, data);

export const getAuthorsList = data => api.get(url.GET_AUTHORS, data);

export const createOrUpdateAuthor = data => api.post(url.CREATE_AUTHOR, data);

export const deleteAuthor = data => api.post(url.DELETE_AUTHOR, data);

export const getHeadsList = data => api.get(url.GET_HEADS, data);

export const createOrUpdateHead = data => api.post(url.CREATE_HEAD, data);

export const deleteHead = data => api.post(url.DELETE_HEAD, data);

export const UpdateDifferentialMateriaMedicadDefaultStatus = data => api.post(url.UPDATE_DIFFERENTIAL_MATERIA_MEDICADDEFAULTSTATUS, data);

export const getAuthorForCreateOrUpdateHead = data => api.get(url.CREATE_AUTHOR, data);

export const getMateriaMedica = data => api.get(url.GET_MATERIA_MEDICA, data);

export const createOrUpdateMateriaMedica = data => api.post(url.CREATE_MATERIA_MEDICA, data);

export const deleteMateriaMedica = data => api.post(url.DELETE_MATERIA_MEDICA, data);

export const getAuthorForMateriaMedicaDDL = data => api.get(url.GET_AUTHOR_FOR_MATERIA_MEDICA_DDL, data);

export const getRemedyDDL = data => api.get(url.GET_REMEDY_DDL, data);

export const getAuthorDDL = data => api.get(url.GET_AUTHOR_DDL, data);

export const getRemedies = data => api.get(url.GET_REMEDIES, data);

export const getRemediesForRemedialRubrics = data => api.get(url.GET_REMEDIES_FOR_REMEDIAL_RUBRICS, data);

export const getMateriaMedicaRemediesDetails = data => api.get(url.GET_MATERIA_MEDICA_REMEDIES_DETAILS, data);

export const getMateriaMedicaHeadByAuthorId = data => api.get(url.GET_MATERIA_MEDICA_HEAD_BY_AUTHOR_ID + data.authorId, null);

export const getMateriaMedicaDetails = data => api.get(url.CREATE_MATERIA_MEDICA + "/" + data.materiaMedicaId, null);

export const getRubric = data => api.get(url.GET_RUBRIC, data);

export const getSectionForSubSection = data => api.get(url.GET_SECTION_FOR_SUBSECTION, data);

export const getGradeDetails = data => api.get(url.GET_GRADE_DETAILS + data.subSectionId, null);

export const getAuthorForRubric = data => api.get(url.GET_AUTHOR_FOR_RUBRIC, data);

export const getSubSection = data => api.get(url.GET_SUB_SECTION + "/" + data, null);

export const getSubSectionById = data => api.get(url.CREATE_UPDATE_SUNSECTION + "/" + data, null);

export const getRemedyGrades = data => api.get(url.GET_REMEDY_GRADES, data);

export const getRemediesByGrade = data => api.post(url.GET_REMEDIES_BY_GRADE, data);

export const saveUpdateRubricRemedy = data => nigahomeoAPI.post(url.SAVE_UPDATE_RUBRIC_REMEDY, data);

export const getRubricRemedyBySectionIdGreadId = data => api.get(url.GET_RUBRIC_REMEDY_BY_SECTION_ID_GREAD_ID + "/" + data.subSectionId + "/" + data.gradeId, null);

//clinical questions
export const getQuestionGroups = data => api.get(url.GET_QUESTION_GROUP, data);

export const getQuestionsSubGroups = data => api.get(url.GET_QUESTION_SUB_GROUP, data);

export const getClinicalQuestionBodyPart = data => api.get(url.GET_CLINICAL_QUESTION_BODY_PART, data);

export const getClinicalQuestionBodyPartDataById = data => api.get(url.GET_CLINICAL_QUESTION_BODY_PART_DATA_BY_ID, data);

export const deleteClinicalQuestionBodyPart = data => api.post(url.DELETE_QUESTION_BODY_PART_DATA + '?questionId=' + data.questionId, {});

export const getQuestionSectionDll = data => api.get(url.GET_QUESTION_SECTIONS_DDL, data);

export const getSubQuestionGroupDll = data => api.get(url.GET_SUB_QUESTION_GROUP_DDL + "/" + data.questionGroupId + "/" + data.questionSectionId, null);

export const getBodyPartBySection = data => api.get(url.GET_BODY_PARTS_BY_SECTION + "/" + data.questionSectionForBodyPartId, null);

export const createOrUpdateClinicalQuestionBodyPart = data => api.post(url.ADD_EDIT_CLINICAL_QUESTIONS_BODY_PART, data);

export const getQuestionGroupByExistanceId = data => api.get(url.GET_QUESTION_GROUP_BY_EXISTANCE_ID + "/" + data.questionSectionId, null);
export const getSubQuestionGroupByQGIDQSID = data => api.get(url.GET_SUB_QUESTION_GROUP_BY_QGID_QSID + "/" + data.questionGroupId + "/" + data.questionSectionId, null);
export const getClinicalQuestionsKeywordBodyPart = data => api.post(url.GET_CLINICAL_QUESTIONS_KEYWORD_BODY_PART, data);
export const getClinicalRubricData = data => api.post(url.GET_CLINICAL_RUBRIC_DATA, data);
// 3D Body Part
export const getMeshKeyMasterList = data => nigahomeoAPI.get(url.GET_MESH_KEY_MASTER, data);
export const deleteMeshKeyMaster = data => nigahomeoAPI.post(url.DELETE_MESH_KEY_MASTER, data);
export const createMeshKeyMaster = data => nigahomeoAPI.post(url.ADD_MESH_KEY_MASTER, data);
export const updateMeshKeyMaster = data => nigahomeoAPI.post(url.UPDATE_MESH_KEY_MASTER, data);

export const getAnatomySectionMasterList = data => nigahomeoAPI.get(url.GET_ANATOMY_SECTION_MASTER, data);
export const getAnatomySectionMasterByMeshKeyId = (meshKeyId, data) =>
  nigahomeoAPI.get(`${url.GET_ANATOMY_SECTION_MASTER_BY_MESH_KEY_ID}/${meshKeyId}`, data);
export const deleteAnatomySectionMaster = data => nigahomeoAPI.post(url.DELETE_ANATOMY_SECTION_MASTER, data);
export const createAnatomySectionMaster = data => nigahomeoAPI.post(url.ADD_ANATOMY_SECTION_MASTER, data);
export const updateAnatomySectionMaster = data => nigahomeoAPI.post(url.UPDATE_ANATOMY_SECTION_MASTER, data);

export const getAnatomyHotspotList = data => nigahomeoAPI.get(url.GET_ANATOMY_HOTSPOT, data);
export const getAnatomyHotspotBySectionId = (sectionId, data) =>
  nigahomeoAPI.get(`${url.GET_ANATOMY_HOTSPOT_BY_SECTION_ID}/${sectionId}`, data);

export const searchSubsectionByHotspot = (data) =>
  nigahomeoAPI.get(url.SEARCH_SUBSECTION_BY_HOTSPOT, data);
export const deleteAnatomyHotspot = data => nigahomeoAPI.post(url.DELETE_ANATOMY_HOTSPOT, data);
export const createAnatomyHotspot = data => nigahomeoAPI.post(url.ADD_ANATOMY_HOTSPOT, data);
export const updateAnatomyHotspot = data => nigahomeoAPI.post(url.UPDATE_ANATOMY_HOTSPOT, data);

//language
export const getLanugages = data => api.get(url.GET_LANGUAGE, data);

export const deleteLanguage = data => api.post(url.DELETE_LANGUAGE, data);

export const createUpdateLanguage = data => api.post(url.ADD_UPDATE_LANGUAGE, data);

//intensity
export const getIntensities = data => api.get(url.GET_INTENSITIES, data);

export const deleteIntensity = data => api.post(url.DELETE_INTENSITY, data);

export const createUpdateIntensity = data => api.post(url.CREATE_UPDATE_INTENSITY, data);

//bodypart
export const getBodyParts = data => api.get(url.GET_BODY_PARTS, data);

export const deleteBodyPart = data => api.post(url.DELETE_BODY_PART, data);

export const createUpdateBodyPart = data => api.post(url.CREATE_UPDATE_BODYPART, data);

//remedy grade
export const getRemedyGrade = data => api.get(url.GET_REMEDY_GRADES_LIST, data);

export const deleteRemedyGrade = data => api.post(url.DELETE_REMEDY_GRADE, data);

export const createUpdateRemedyGrade = data => api.post(url.CREATE_UPDATE_REMEDY_GRADE, data);

//remedical rubric
export const getRubricRemedyDetails = data => api.get(url.GET_RUBRIC_REMEDY_DETAILS + "/" + data.remedyId, null);

export const updateIsSmallRubric = data => api.get(url.UPDATE_ISSMALL_RUBRIC + "/" + data.rubricId + "/" + data.isSmallRubric, null);

export const updateIsConfirmationRubric = data => api.get(url.UPDATE_ISCONFIRMATION_RUBRIC + "/" + data.rubricId + "/" + data.isConfirmationRubric, null);

//remedy
export const getRemedyList = data => api.get(url.GET_REMEDIES_LIST, data);

export const createUpdateRemedy = data => api.post(url.CREATE_REMEDY, data);

export const getSingleRemedy = data => api.get(url.CREATE_REMEDY + "/" + data.remedyId, null)

export const getAllTermalDDL = data => api.get(url.GET_ALL_THERMAL_DDL, data);

export const deleteRemedy = data => api.post(url.DELETE_REMEDY, data);

//sub section 
export const getSubSectionsList = data => api.get(url.GET_SUBSECTION_BY_SECTION_ID_AND_QUERY_STRING, data);

export const deleteSubSection = data => api.post(url.DELETE_SUBSECTION, data);

export const getSubSectionBySection = data => api.get(url.GET_SUBSECTION_BY_SECTION + "/" + data.sectionId, null);

export const createUpdateSubsection = data => api.post(url.CREATE_UPDATE_SUNSECTION, data);

export const deleteReferenceRubricDetails = data => api.post(url.DELETE_REFERENCE_RUBRIC_DETAILS, data);
export const deleteSubSectionLanguageDetails = data => api.post(url.DELETE_SUBSECTION_LANGUAGE_DETAILS, data);

export const getMainParentSubSectionsWithChildCount = (sectionId) => api.get(url.GET_MAIN_PARENT_SUBSECTIONS_WITH_CHILD_COUNT + "/" + sectionId, null);
export const getSubSectionWithChildrenCount = (subSectionId) => api.get(url.GET_SUBSECTION_WITH_CHILDREN_COUNT + "/" + subSectionId, null);
export const searchSubSectionsBySection = (params) => api.get(url.SEARCH_SUBSECTION_BY_SECTION, params);
export const searchSubSectionsGlobal = (params) => api.get(url.SEARCH_SUBSECTION_GLOBAL, params);
export const searchSubSectionsBySectionPaged = (params) => api.get(url.SEARCH_SUBSECTION_BY_SECTION_PAGED, params);
export const searchSubSectionsGlobalPaged = (params) => api.get(url.SEARCH_SUBSECTION_GLOBAL_PAGED, params);
export const updateMainParentSubsection = (data) => api.post(url.UPDATE_MAIN_PARENT_SUBSECTION + "/" + data.subSectionId + "?mainParentSubsection=" + encodeURIComponent(data.mainParentSubsection) + "&changedBy=" + encodeURIComponent(data.changedBy), null);

export const GetLanguages = data => api.get(url.ADD_UPDATE_LANGUAGE, data);

//diagnosis system
export const getDiagnosisSystemList = data => api.get(url.GET_DIAGNOSIS_SYSTEM, data);

export const deleteDiagnosisSystem = data => api.post(url.DELETE_DIAGNOSIS_SYSTEM, data);

export const saveUpdateDiagnosisSystem = data => api.post(url.SAVE_DIAGNOSIS_SYSTEM, data);

//drug system

export const getDrugSystemList = data => api.get(url.GET_DRUG_SYSTEM, data);

export const deleteDrugSystem = data => api.post(url.DELETE_DRUG_SYSTEM, data);

export const createDrugSystem = data => api.post(url.CREATE_DRUG_SYSTEM, data);

export const getDrugGroupList = data => api.get(url.GET_DRUG_GROUP, data);

export const addDrugGroup = data => api.post(url.ADD_DRUG_GROUP, data);

export const deleteDrugGroup = data => api.post(url.DELETE_DRUG_GROUP, data);

export const updateDrugGroup = data => api.post(url.UPDATE_DRUG_GROUP, data);

export const getDrugGroupById = id => api.get(url.GET_DRUG_GROUP_BY_ID + "/" + id);

export const getAllopathicDrug = data => api.get(url.GET_ALLOPATHIC_DRUG, data);

export const getAllopathicDrugById = id => api.get(url.GET_ALLOPATHIC_DRUG_BY_ID + "/" + id);

export const createAllopathicDrug = data => api.post(url.GET_ALLOPATHIC_DRUG_BY_ID, data);

export const updateAllopathicDrug = data => api.post(url.UPDATE_ALLOPATHIC_DRUG, data);

export const deleteAllopathicDrug = data => api.post(url.DELETE_ALLOPATHIC_DRUG, data);

// Side Effect Delete APIs
export const deleteSeriousSideEffect = data => api.post(url.DELETE_SERIOUS_SIDE_EFFECT, data);
export const deleteOtherSideEffect = data => api.post(url.DELETE_OTHER_SIDE_EFFECT, data);
export const deleteAdverseReaction = data => api.post(url.DELETE_ADVERSE_REACTION, data);

// Question Sections API

export const getQuestionSections = data => api.get(url.GET_QUESTION_SECTIONS, data);

export const deleteQuestionSection = data => api.post(url.DELETE_QUESTION_SECTION, data);

export const createQuestionSection = data => api.post(url.CREATE_QUESTION_SECTION, data);

export const updateQuestionSection = data => api.post(url.UPDATE_QUESTION_SECTION, data);

// Question Group API

export const getQuestionGroupExistance = data => api.get(url.GET_QUESTION_GROUP_EXISTANCE, data);

export const deleteQuestionGroup = data => api.post(url.DELETE_QUESTION_GROUP, data);

export const createQuestionGroup = data => api.post(url.CREATE_QUESTION_GROUP, data);

/* Package API calls */
export const getPackageList = data => api.get(url.GET_PACKAGES, data);
export const deletePackage = data => api.delete(url.DELETE_PACKAGE, data);
export const createPackage = data => api.post(url.CREATE_PACKAGE, data);
export const updatePackage = data => api.post(url.CREATE_PACKAGE, data);

/* Qualification Master API calls */
export const getQualificationList = (data) => nigahomeoAPI.get(url.GET_QUALIFICATIONS, data || { PageNumber: 1, PageSize: 100 });
export const createQualification = (data) => nigahomeoAPI.post(url.ADD_QUALIFICATION, data);
export const updateQualification = (data) => nigahomeoAPI.post(url.UPDATE_QUALIFICATION, data);
export const deleteQualification = (id) => nigahomeoAPI.post(`${url.DELETE_QUALIFICATION}/${id}`, {});
export const getQualificationById = (id) => nigahomeoAPI.get(`${url.GET_QUALIFICATION_BY_ID}/${id}`, null);

/* Lab Test API calls */
export const getLabTestList = data => api.get(url.GET_LAB_TESTS, data);
export const addEditPatientLabTest = data => api.post(url.ADD_EDIT_PATIENT_LAB_TEST, data);
export const getPatientLabTestById = labTestId => api.get(url.GET_PATIENT_LAB_TEST_BY_ID + "/" + labTestId, null);

export const importFromExcel = data => nigahomeoMultipart.post(url.IMPORT_FROM_EXCEL, data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const getImportFromExcelStatus = (jobId) =>
  nigahomeoAPI.get(`${url.IMPORT_FROM_EXCEL_STATUS}/${jobId}`, null);
export const exportRubricsToExcel = (sectionId) =>
  nigahomeoMultipart.get(`${url.EXPORT_RUBRICS_TO_EXCEL}/${sectionId}`, { responseType: 'blob' });

/* Sub question group API calls */
export const getQuestionSubGroupList = data => api.get(url.GET_QUESTION_SUB_GROUP_LIST, data);
export const deleteQuestionSubGroup = data => api.post(url.DELETE_QUESTION_SUB_GROUP, data);
export const createUpdateQuestionSubGroup = data => api.post(url.CREATE_UPDATE_QUESTION_SUB_GROUP, data);

export const exportSubSectionsToExcel = (sectionId) =>
  nigahomeoMultipart.get(`${url.EXPORT_SUBSECTIONS_TO_EXCEL}/${sectionId}`, { responseType: 'blob' });
export const downloadReferenceRubricsTemplate = (format = 'excel') =>
  nigahomeoMultipart.get(`${url.DOWNLOAD_REFERENCE_RUBRICS_TEMPLATE}?format=${format}`, { responseType: 'blob' });
export const importReferenceRubrics = (formData) =>
  nigahomeoMultipart.post(url.IMPORT_REFERENCE_RUBRICS, formData);


/* Diagnosis Therapeutics API calls */
export const getDiagnosisTherapeuticsDetails = data => api.get(url.GET_DIAGNOSIS_THERAPEUTICS_DETAILS, data);
export const getDiagnosisForClinicalPattern = data => api.get(url.GET_DIAGNOSIS_FOR_CLINICAL_PATTERN, data);
export const getDiagnosisTherapeuticsDetailsById = data => api.get(url.GET_DIAGNOSIS_THERAPEUTICS_DETAILS_BY_ID, data);
export const diagnosisTherapeuticsDetails = data => api.get(url.DIAGNOSIS_THERAPEUTICS_DETAIL + "/" + data.diagnosisId, null);
export const saveDiagnosisTherapeuticsDetail = data => api.post(url.SAVE_DIAGNOSIS_THERAPEUTICS_DETAIL, data);
export const diagnosisSearch = data => api.post(url.DIAGNOSIS_SEARCH + "?diagnosisID=" + data.diagnosisID, null);
export const getThrepoticByDiagnosisId = data => api.post(url.GET_THREPOTIC_BY_DIAGNOSIS_ID + "?diagnosisId=" + data.diagnosisId, null);

/* Diagnosis Conditions API calls */
export const getDiagnosisConditions = data => api.get(url.GET_DIAGNOSIS_CONDITIONS, data);
export const deleteDiagnosis = data => api.post(url.DELETE_DIAGNOSIS, data);
export const createDiagnosis = data => api.post(url.CREATE_DIAGNOSIS, data);
export const updateDiagnosis = data => api.post(url.UPDATE_DIAGNOSIS, data);
export const getDiagnosisById = data => api.get(url.GET_DIAGNOSIS_BY_ID + '/' + data, data);
export const deleteDiagnosisRubric = data => api.post(url.DELETE_DIAGNOSIS_RUBRIC, data);


/* Doctor Dashboard */
export const getDoctorDashboardCount = data => nigahomeoAPI.post(url.GET_DOCTOR_DASHBOARD_COUNT, data);
export const getPatientStatsCharts = data => {
  let query = url.GET_PATIENT_STATS_CHARTS
    + "?userId=" + encodeURIComponent(data.userId)
    + "&period=" + encodeURIComponent(data.period || "ALL");

  if (data.fromDate && data.toDate) {
    query += "&fromDate=" + encodeURIComponent(data.fromDate);
    query += "&toDate=" + encodeURIComponent(data.toDate);
  }

  return nigahomeoAPI.get(query, null);
};
export const patientNewAppointment = data => nigahomeoAPI.post(url.PATIENT_NEW_APPOINTMENT, data);
export const updateAppointmentStatus = data => nigahomeoAPI.post(url.UPDATE_APPOINTMENT_STATUS, data);
export const updateAppointmentTime = data => nigahomeoAPI.post(url.UPDATE_APPOINTMENT_TIME, data);
export const getDailySchedule = async (params) => {
  try {
    return await nigahomeoAPI.get(url.GET_DAILY_SCHEDULE, params);
  } catch (error) {
    const message = typeof error === 'string' ? error : (error?.message || '');
    if (message.toLowerCase().includes('not found')) {
      return null;
    }
    throw error;
  }
};
export const saveDailySchedule = data => nigahomeoAPI.post(url.SAVE_DAILY_SCHEDULE, data);
export const getAppointmentSlots = (params) => nigahomeoAPI.get(url.GET_APPOINTMENT_SLOTS, params);
export const getPatientList = data => nigahomeoAPI.get(url.GET_PATIENT_LIST + "/" + data.userId, null);
export const getDoctorList = data => nigahomeoAPI.get(url.GET_DOCTOR_LIST + "/" + data.userId, null);
export const getAppointmentList = data => nigahomeoAPI.get(
  url.GET_APPOINTMENT_LIST + "?UserId=" + data.userId + "&Date=" + encodeURIComponent(data.appointmentDate),
  null
);
export const exportPatients = data => {
  const params = new URLSearchParams({
    userId: String(data.userId),
    scope: data.scope,
    format: data.format,
  });
  if (data.scope === 'today' && data.date) {
    params.set('date', data.date);
  }
  return nigahomeoAPI.get(`${url.EXPORT_PATIENTS}?${params.toString()}`, { responseType: 'blob' });
};
export const getAppointmentHistoryNotes = data => api.get(url.GET_APPOINTMENT_HISTORY_NOTES + "?PageNumber=" + (data.pageNumber || 1) + "&PageSize=" + (data.pageSize || 10) + (data.appointmentId ? "&AppointmentId=" + data.appointmentId : ""), null);
export const getAppointmentListByPatientId = data =>
  nigahomeoAPI.get(`${url.GET_APPOINTMENT_LIST_BY_PATIENT_ID}?PatientId=${data.patientId}`, null);
export const getPrescriptionDetailsByAppointmentId = data =>
  nigahomeoAPI.get(`${url.GET_PRESCRIPTION_DETAILS_BY_APPOINTMENT_ID}?AppointmentId=${data.appointmentId}`, null);
export const createPatient = data => nigahomeoAPI.post(url.CREATE_PATIENT, data);
export const deletePatient = data =>
  nigahomeoAPI.post(
    `${url.DELETE_PATIENT}?patientId=${data.patientId ?? data.patientID}`,
    null
  );
export const downloadPatientImportTemplate = (format = 'excel') =>
  nigahomeoAPI.get(`${url.DOWNLOAD_PATIENT_IMPORT_TEMPLATE}?format=${format}`, { responseType: 'blob' });
export const importPatients = (formData) =>
  nigahomeoMultipart.post(url.IMPORT_PATIENTS, formData);
export const getCountries = data => api.get(url.GET_COUNTRIES, data);
export const getStates = data => api.get(url.GET_STATES, data);
export const getPackages = data => nigahomeoAPI.get(url.PACKAGES, data);

/* Patient Board */
export const getAllopathicDrugForDropdown = data => nigahomeoAPI.get(url.GET_ALLOPATHIC_DRUG_FOR_DROPDOWN, data);
export const getAllopathicDrugForDropdownById = data => api.get(url.GET_ALLOPATHIC_DRUG_FOR_DROPDOWN_BY_ID + "/" + data, null);
export const getIntensitiesForPatient = data => api.get(url.CREATE_UPDATE_INTENSITY, null);
export const getDiagnosisKeywordByTab = data => api.post(url.GET_DIAGNOSIS_KEYWORD_BY_TAB + "?diagnosisId=" + data.diagnosisId + "&tabType=" + data.tabType, null);
export const getPatientBoardData = data => api.get(url.GET_PATIENT_BOARD_DATA + "/" + data.subSectionId, null);
export const getQuestionSectionsBySubSectionId = data => api.get(url.GET_QUESTION_SECTIONS_BY_SUB_SECTION_ID + "/" + data.subSectionId, null);
export const getRubricDetails = data => api.get(url.GET_RUBRIC_DETAILS + "/" + data.subSectionId, null);
export const getRubricByKeywordId = data => api.post(url.GET_RUBRIC_BY_KEYWORD_ID + "?keywordID=" + data.keywordID + "&tabType=" + data.tabType, null);
export const searchRubricsByKeyword = (params) => nigahomeoAPI.get(url.SEARCH_RUBRICS_BY_KEYWORD, params);
export const getRemedyCounts = data => api.get(url.GET_REMEDY_COUNTS + "/" + data.subSectionId, null);
export const getCommanUnCommanRubricsDetails = data => api.post(url.GET_COMMAN_UNCOMMAN_RUBRICS_DETAILS, data);
export const getDifferentialMateriaMedica = data => api.post(url.GET_DIFFERENTIAL_MATERIA_MEDICA, data);
export const generateOrderId = data => api.post(url.GENERATE_ORDER_ID, data);
export const saveUpdateSubscription = data => nigahomeoAPI.post(url.SAVE_UPDATE_SUBSCRIPTION, data);
export const getRepertorizarionRemedyForAccordion = data => api.get(url.GET_REPERTORIZARION_REMEDY_FOR_ACCORDION, data);
export const getMateriaMedicaHeadingByAuthorId = data => api.get(url.GET_MATERIA_MEDICA_HEADING_BY_AUTHOR_ID + "/" + data.authorId, null);
export const getEliminationData = data => api.post(url.GET_ELIMINATION_DATA, data);
export const getPatientLabTestDDL = data => api.get(url.GET_PATIENT_LAB_TEST_DDL, data);
export const getPatientLabOrder = data => api.get(url.GET_PATIENT_LAB_ORDER + "/" + data.patientId, null);
export const getPatientLabEntry = data => api.get(url.GET_PATIENT_LAB_ENTRY + "/" + data.patientId, null);
export const saveUpdateAppointmentHistoryNote = data => api.post(url.SAVE_UPDATE_APPOINTMENT_HISTORY_NOTE, data);
export const getPrescriptionRemedy = data => api.post(url.GET_PRESCRIPTION_REMEDY, data);
export const savePatientLabOrder = data => api.post(url.SAVE_PATIENT_LAB_ORDER, data);
export const savePatientLabEntry = data => api.post(url.SAVE_PATIENT_LAB_ENTRY, data);
export const savePrescriptionDetail = data => api.post(url.SAVE_PRESCRIPTION_DETAIL, data);

// Patient details
export const getPatientDetails = data => api.get(url.GET_PATIENT_DETAILS + "/" + data.patientId + "/" + data.caseId, null);

/* Role Master API calls */
export const getRoleMaster = data => api.get(url.GET_ROLE_MASTER, data);

/* Role Management API calls */
export const getRoleList = data => api.get(url.GET_ROLES, data);
export const getRoleById = roleId => api.get(url.GET_ROLE_BY_ID + "/" + roleId, null);
export const createRole = data => api.post(url.CREATE_ROLE, data);
export const updateRole = data => api.post(url.UPDATE_ROLE, data);
export const deleteRole = data => api.post(url.DELETE_ROLE, data);

/* Firm API calls */
export const getFirmDetails = data => api.get(url.GET_FIRM_DETAILS, data);

/* News API calls */
export const getAllNews = data => api.get(url.GET_NEWS, data);
export const getAllNewsCategories = data => api.get(url.GET_NEWS_CATEGORIES, data);
export const getNewsDetailsById = data => api.get(url.GET_NEWS_DETAILS_BY_ID + "/" + data.newsId, null);
export const saveNewsDetails = data => api.post(url.SAVE_NEWS_DETAILS, data);
export const updateNewsDetails = data => api.post(url.SAVE_NEWS_DETAILS, data);
export const deleteNewsDetails = data => api.post(url.DELETE_NEWS_DETAILS + "?newsId=" + data.newsId, {});

/* Blog API calls */
export const getAllBlogDetail = data => api.get(url.GET_ALL_BLOG_DETAIL, data);
export const saveBlogDetail = data => api.post(url.SAVE_BLOG_DETAIL, data);
export const getBlogDetailById = blogId => api.get(url.GET_BLOG_DETAIL_BY_ID + "/" + blogId, null);
export const deleteBlogDetail = data => api.post(url.DELETE_BLOG_DETAIL + "?blogId=" + data.blogId, {});

/* Masters API — languages for WhatsApp multi-language templates */
export const getLanguageMasters = (params) => nigahomeoAPI.get(url.GET_LANGUAGES_MASTERS, params);

/* WhatsApp API calls */
export const getWhatsAppTemplates = (params) => nigahomeoAPI.get(url.WHATSAPP_GET_TEMPLATES, params);
export const getWhatsAppTemplateById = (templateID) =>
  nigahomeoAPI.get(`${url.WHATSAPP_GET_TEMPLATE_BY_ID}/${templateID}`, null);
export const addWhatsAppTemplate = (data) => nigahomeoAPI.post(url.WHATSAPP_ADD_TEMPLATE, data);
export const updateWhatsAppTemplate = (data) => nigahomeoAPI.post(url.WHATSAPP_UPDATE_TEMPLATE, data);
export const sendWhatsAppHospitalServiceMessage = (data) =>
  nigahomeoAPI.post(url.WHATSAPP_SEND_HOSPITAL_SERVICE, data);
export const sendWhatsAppOfferMessage = (data) =>
  nigahomeoAPI.post(url.WHATSAPP_SEND_OFFER, data);
export const sendWhatsAppHealthTipMessage = (data) =>
  nigahomeoAPI.post(url.WHATSAPP_SEND_HEALTH_TIP, data);
export const sendWhatsAppBulkMessage = (data) => nigahomeoAPI.post(url.WHATSAPP_SEND_BULK, data);
export const getWhatsAppMessageHistory = (params) => nigahomeoAPI.get(url.WHATSAPP_GET_MESSAGE_HISTORY, params);
export const getWhatsAppMessageById = (messageId) =>
  nigahomeoAPI.get(`${url.WHATSAPP_GET_MESSAGE_BY_ID}/${messageId}`, null);
export const getWhatsAppCampaignHistory = (params) => nigahomeoAPI.get(url.WHATSAPP_GET_CAMPAIGN_HISTORY, params);
export const getWhatsAppCampaignDetails = (campaignId) =>
  nigahomeoAPI.get(`${url.WHATSAPP_GET_CAMPAIGN_DETAILS}/${campaignId}`, null);
export const getWhatsAppDashboard = (params) => nigahomeoAPI.get(url.WHATSAPP_GET_DASHBOARD, params);

/* Patient Board backup API calls (New_API on api1 / nigahomeo client) */
export const savePatientBoardBackup = (data) => nigahomeoAPI.post(url.PATIENT_BOARD_BACKUP_SAVE, data);
export const getPatientBoardBackupSummary = () => nigahomeoAPI.get(url.PATIENT_BOARD_BACKUP_SUMMARY, null);
export const getLatestPatientBoardBackup = () => nigahomeoAPI.get(url.PATIENT_BOARD_BACKUP_LATEST, null);
export const deletePatientBoardBackup = () => nigahomeoAPI.post(url.PATIENT_BOARD_BACKUP_DELETE, {});

/* Audio case taking API calls */
export const uploadAudioCaseTaking = (formData) =>
  nigahomeoMultipart.post(url.AUDIO_CASE_TAKING_UPLOAD, formData);
export const getAudioCaseTakingStatus = (sessionId) =>
  nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_STATUS}/${sessionId}/status`, null);
export const getAudioCaseTakingResult = (sessionId) =>
  nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_RESULT}/${sessionId}/result`, null);
export const downloadAudioCaseRecording = (sessionId) =>
  nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_DOWNLOAD}/${sessionId}/download`, { responseType: 'blob' });
export const reAnalyzeAudioCaseTaking = (sessionId, data) =>
  nigahomeoAPI.post(`${url.AUDIO_CASE_TAKING_REANALYZE}/${sessionId}/reanalyze`, data);
export const logAudioCaseDoctorAction = (sessionId, data) =>
  nigahomeoAPI.post(`${url.AUDIO_CASE_TAKING_DOCTOR_ACTION}/${sessionId}/doctor-action`, data);
export const getLatestAudioCaseSession = (patientId, caseId) => {
  const params = new URLSearchParams({ patientId: String(patientId) });
  if (caseId != null && caseId !== '') {
    params.append('caseId', String(caseId));
  }
  return nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_LATEST}?${params.toString()}`, null);
};
export const getAudioCaseTakingSessions = (patientId, { pageNumber = 1, pageSize = 50 } = {}) => {
  const params = new URLSearchParams({
    patientId: String(patientId),
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });
  return nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_SESSIONS}?${params.toString()}`, null);
};
export const getAudioCaseConcepts = (sessionId) =>
  nigahomeoAPI.get(`${url.AUDIO_CASE_TAKING_CONCEPTS}/${sessionId}/concepts`, null);
export const submitAudioCaseRubricFeedback = (sessionId, data) =>
  nigahomeoAPI.post(`${url.AUDIO_CASE_TAKING_RUBRIC_FEEDBACK}/${sessionId}/rubrics/feedback`, data);

export const getRubricBenchmarkSummary = (params) =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_BENCHMARK_SUMMARY, params);
export const getRubricBenchmarkTrends = (params) =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_BENCHMARK_TRENDS, params);
export const getRubricFeedbackQueue = (params) =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_FEEDBACK_QUEUE, params);
export const getRubricIntelligenceConfig = () =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_CONFIG, null);
export const updateRubricIntelligenceConfig = (data) =>
  nigahomeoAPI.put(url.RUBRIC_INTELLIGENCE_CONFIG, data);
export const getRubricIntelligenceRolloutStatus = () =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_ROLLOUT_STATUS, null);
export const getRepertoryMappingStatus = () =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_REPERTORY_STATUS, null);

/* Rubric intelligence admin */
export const getRubricMetaphors = (params) =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_METAPHORS, params);
export const createRubricMetaphor = (data) =>
  nigahomeoAPI.post(url.RUBRIC_INTELLIGENCE_METAPHORS, data);
export const updateRubricMetaphor = (id, data) =>
  nigahomeoAPI.put(`${url.RUBRIC_INTELLIGENCE_METAPHORS}/${id}`, data);
export const deleteRubricMetaphor = (id) =>
  nigahomeoAPI.delete(`${url.RUBRIC_INTELLIGENCE_METAPHORS}/${id}`, null);
export const approveRubricMetaphor = (id) =>
  nigahomeoAPI.post(`${url.RUBRIC_INTELLIGENCE_METAPHORS}/${id}/approve`, {});
export const rejectRubricMetaphor = (id) =>
  nigahomeoAPI.post(`${url.RUBRIC_INTELLIGENCE_METAPHORS}/${id}/reject`, {});

export const getRubricAliases = (params) =>
  nigahomeoAPI.get(url.RUBRIC_INTELLIGENCE_ALIASES, params);
export const createRubricAlias = (data) =>
  nigahomeoAPI.post(url.RUBRIC_INTELLIGENCE_ALIASES, data);
export const updateRubricAlias = (id, data) =>
  nigahomeoAPI.put(`${url.RUBRIC_INTELLIGENCE_ALIASES}/${id}`, data);
export const deleteRubricAlias = (id) =>
  nigahomeoAPI.delete(`${url.RUBRIC_INTELLIGENCE_ALIASES}/${id}`, null);