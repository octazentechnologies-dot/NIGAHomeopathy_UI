//REGISTER
export const POST_FAKE_REGISTER = "/auth/signup";

//LOGIN
export const POST_FAKE_LOGIN = "/auth/signin";
export const POST_FAKE_JWT_LOGIN = "/post-jwt-login";
export const POST_FAKE_PASSWORD_FORGET = "/auth/forgot-password";
export const POST_FAKE_JWT_PASSWORD_FORGET = "/jwt-forget-pwd";
export const SOCIAL_LOGIN = "/social-login";

//PROFILE
export const POST_EDIT_JWT_PROFILE = "/post-jwt-profile";
export const POST_EDIT_PROFILE = "/user";

// Calendar
export const GET_EVENTS = "/events";
export const GET_CATEGORIES = "/categories";
export const GET_UPCOMMINGEVENT = "/upcommingevents";
export const ADD_NEW_EVENT = "/add/event";
export const UPDATE_EVENT = "/update/event";
export const DELETE_EVENT = "/delete/event";

// Chat
export const GET_DIRECT_CONTACT = "/chat";
export const GET_MESSAGES = "/messages";
export const ADD_MESSAGE = "add/message";
export const GET_CHANNELS = "/channels";
export const DELETE_MESSAGE = "delete/message";

//Mailbox
export const GET_MAIL_DETAILS = "/mail";
export const DELETE_MAIL = "/delete/mail";

// Ecommerce
// Product
export const GET_PRODUCTS = "/apps/product";
export const DELETE_PRODUCT = "/apps/product";
export const ADD_NEW_PRODUCT = "/apps/product";
export const UPDATE_PRODUCT = "/apps/product";

// Orders
export const GET_ORDERS = "/apps/order";
export const ADD_NEW_ORDER = "/apps/order";
export const UPDATE_ORDER = "/apps/order";
export const DELETE_ORDER = "/apps/order";

// Customers
export const GET_CUSTOMERS = "/apps/customer";
export const ADD_NEW_CUSTOMER = "/apps/customer";
export const UPDATE_CUSTOMER = "/apps/customer";
export const DELETE_CUSTOMER = "/apps/customer";

// Sellers
export const GET_SELLERS = "/sellers";

// Project list
export const GET_PROJECT_LIST = "/project/list";

// Task
export const GET_TASK_LIST = "/apps/task";
export const ADD_NEW_TASK = "/apps/task";
export const UPDATE_TASK = "/apps/task";
export const DELETE_TASK = "/apps/task";

// CRM
// Conatct
export const GET_CONTACTS = "/apps/contact";
export const ADD_NEW_CONTACT = "/apps/contact";
export const UPDATE_CONTACT = "/apps/contact";
export const DELETE_CONTACT = "/apps/contact";

// Companies
export const GET_COMPANIES = "/apps/company";
export const ADD_NEW_COMPANIES = "/apps/company";
export const UPDATE_COMPANIES = "/apps/company";
export const DELETE_COMPANIES = "/apps/company";

// Lead
export const GET_LEADS = "/apps/lead";
export const ADD_NEW_LEAD = "/apps/lead";
export const UPDATE_LEAD = "/apps/lead";
export const DELETE_LEAD = "/apps/lead";

// Deals
export const GET_DEALS = "/deals";

// Crypto
export const GET_TRANSACTION_LIST = "/transaction-list";
export const GET_ORDRER_LIST = "/order-list";

// Invoice
export const GET_INVOICES = "/apps/invoice";
export const ADD_NEW_INVOICE = "/apps/invoice";
export const UPDATE_INVOICE = "/apps/invoice";
export const DELETE_INVOICE = "/apps/invoice";

// TicketsList
export const GET_TICKETS_LIST = "/apps/ticket";
export const ADD_NEW_TICKET = "/apps/ticket";
export const UPDATE_TICKET = "/apps/ticket";
export const DELETE_TICKET = "/apps/ticket";

// Dashboard Analytics

// Sessions by Countries
export const GET_ALL_DATA = "/all-data";
export const GET_HALFYEARLY_DATA = "/halfyearly-data";
export const GET_MONTHLY_DATA = "/monthly-data";

// Audiences Metrics
export const GET_ALLAUDIENCESMETRICS_DATA = "/allAudiencesMetrics-data";
export const GET_MONTHLYAUDIENCESMETRICS_DATA = "/monthlyAudiencesMetrics-data";
export const GET_HALFYEARLYAUDIENCESMETRICS_DATA = "/halfyearlyAudiencesMetrics-data";
export const GET_YEARLYAUDIENCESMETRICS_DATA = "/yearlyAudiencesMetrics-data";

// Users by Device
export const GET_TODAYDEVICE_DATA = "/todayDevice-data";
export const GET_LASTWEEKDEVICE_DATA = "/lastWeekDevice-data";
export const GET_LASTMONTHDEVICE_DATA = "/lastMonthDevice-data";
export const GET_CURRENTYEARDEVICE_DATA = "/currentYearDevice-data";

// Audiences Sessions by Country
export const GET_TODAYSESSION_DATA = "/todaySession-data";
export const GET_LASTWEEKSESSION_DATA = "/lastWeekSession-data";
export const GET_LASTMONTHSESSION_DATA = "/lastMonthSession-data";
export const GET_CURRENTYEARSESSION_DATA = "/currentYearSession-data";

// Dashboard CRM

// Balance Overview
export const GET_TODAYBALANCE_DATA = "/todayBalance-data";
export const GET_LASTWEEKBALANCE_DATA = "/lastWeekBalance-data";
export const GET_LASTMONTHBALANCE_DATA = "/lastMonthBalance-data";
export const GET_CURRENTYEARBALANCE_DATA = "/currentYearBalance-data";

// Deal type
export const GET_TODAYDEAL_DATA = "/todayDeal-data";
export const GET_WEEKLYDEAL_DATA = "/weeklyDeal-data";
export const GET_MONTHLYDEAL_DATA = "/monthlyDeal-data";
export const GET_YEARLYDEAL_DATA = "/yearlyDeal-data";

// Sales Forecast

export const GET_OCTSALES_DATA = "/octSales-data";
export const GET_NOVSALES_DATA = "/novSales-data";
export const GET_DECSALES_DATA = "/decSales-data";
export const GET_JANSALES_DATA = "/janSales-data";

// Dashboard Ecommerce
// Revenue
export const GET_ALLREVENUE_DATA = "/allRevenue-data";
export const GET_MONTHREVENUE_DATA = "/monthRevenue-data";
export const GET_HALFYEARREVENUE_DATA = "/halfYearRevenue-data";
export const GET_YEARREVENUE_DATA = "/yearRevenue-data";

// Dashboard Crypto
// Portfolio
export const GET_BTCPORTFOLIO_DATA = "/btcPortfolio-data";
export const GET_USDPORTFOLIO_DATA = "/usdPortfolio-data";
export const GET_EUROPORTFOLIO_DATA = "/euroPortfolio-data";

// Market Graph
export const GET_ALLMARKETDATA_DATA = "/allMarket-data";
export const GET_YEARMARKET_DATA = "/yearMarket-data";
export const GET_MONTHMARKET_DATA = "/monthMarket-data";
export const GET_WEEKMARKET_DATA = "/weekMarket-data";
export const GET_HOURMARKET_DATA = "/hourMarket-data";

// Dashboard Crypto
// Project Overview
export const GET_ALLPROJECT_DATA = "/allProject-data";
export const GET_MONTHPROJECT_DATA = "/monthProject-data";
export const GET_HALFYEARPROJECT_DATA = "/halfYearProject-data";
export const GET_YEARPROJECT_DATA = "/yearProject-data";

// Project Status
export const GET_ALLPROJECTSTATUS_DATA = "/allProjectStatus-data";
export const GET_WEEKPROJECTSTATUS_DATA = "/weekProjectStatus-data";
export const GET_MONTHPROJECTSTATUS_DATA = "/monthProjectStatus-data";
export const GET_QUARTERPROJECTSTATUS_DATA = "/quarterProjectStatus-data";

// Dashboard NFT
// Marketplace
export const GET_ALLMARKETPLACE_DATA = "/allMarketplace-data";
export const GET_MONTHMARKETPLACE_DATA = "/monthMarketplace-data";
export const GET_HALFYEARMARKETPLACE_DATA = "/halfYearMarketplace-data";
export const GET_YEARMARKETPLACE_DATA = "/yearMarketplace-data";

// Project
export const ADD_NEW_PROJECT = "/add/project";
export const UPDATE_PROJECT = "/update/project";
export const DELETE_PROJECT = "/delete/project";

// Pages > Team
export const GET_TEAMDATA = "/teamData";
export const DELETE_TEAMDATA = "/delete/teamData";
export const ADD_NEW_TEAMDATA = "/add/teamData";
export const UPDATE_TEAMDATA = "/update/teamData";

// File Manager
// Folder
export const GET_FOLDERS = "/folder";
export const DELETE_FOLDER = "/delete/folder";
export const ADD_NEW_FOLDER = "/add/folder";
export const UPDATE_FOLDER = "/update/folder";

// File
export const GET_FILES = "/file";
export const DELETE_FILE = "/delete/file";
export const ADD_NEW_FILE = "/add/file";
export const UPDATE_FILE = "/update/file";

// To do
export const GET_TODOS = "/todo";
export const DELETE_TODO = "/delete/todo";
export const ADD_NEW_TODO = "/add/todo";
export const UPDATE_TODO = "/update/todo";

// To do Project
export const GET_PROJECTS = "/projects";
export const ADD_NEW_TODO_PROJECT = "/add/project";

//JOB APPLICATION
export const GET_APPLICATION_LIST = "/application-list";

//JOB APPLICATION
export const GET_API_KEY = "/api-key";

// kanban
export const GET_TASKS = "/apps/tasks";
export const ADD_TASKS = "/add/tasks";
export const UPDATE_TASKS = "/update/tasks";
export const DELETE_TASKS = "/delete/tasks";


// actual api urls start from here /// add comment by Pranav on Date:12/02/25


//Login 
export const LOGIN = "/Account/Login";
export const SUBSCRIPTION_STATUS = "/Account/SubscriptionStatus";
export const CHECK_ACTIVATION = "/users/ActivateUser";
export const REGISTER_DOCTOR = "/users/RegisterDoctor";
export const REGISTRATION_COUNTRIES = "/registration/countries";
export const REGISTRATION_STATES = "/registration/states";
export const REGISTRATION_QUALIFICATIONS = "/registration/qualifications";

//User Api Urls
export const GET_USERS = "/Pagination/GetUser";
export const GET_USER_BY_ID = "/users";
export const CREATE_USER = "/users";
export const UPDATE_USER = "/users";

//Section Api Urls
export const GET_SECTIONS = "/Pagination/GetSections";
export const CREATE_SECTION = "/section";
export const DELETE_SECTION = "/section/DeleteSection";

//Author Api Urls
export const GET_AUTHORS = "/Pagination/GetAuthor";
export const CREATE_AUTHOR = "/Author";
export const DELETE_AUTHOR = "/Author/DeleteAuthor";

//Head Api Urls
export const GET_HEADS = "/Pagination/GetMateriaMedicaHead";
export const CREATE_HEAD = "/MateriaMedicaHead";
export const DELETE_HEAD = "/MateriaMedicaHead/DeleteMateriaMedicaHead";
export const UPDATE_DIFFERENTIAL_MATERIA_MEDICADDEFAULTSTATUS = "/MateriaMedicaHead/UpdateDifferentialMateriaMedicadDefaultStatus";

//Materia Medica Api Urls
export const GET_MATERIA_MEDICA = "/Pagination/GetMateriaMedica";
export const CREATE_MATERIA_MEDICA = "/MateriaMedicaMaster";
export const DELETE_MATERIA_MEDICA = "/MateriaMedicaMaster/DeleteMateriaMedica";
export const GET_AUTHOR_FOR_MATERIA_MEDICA_DDL = "/DropdownList/GetAuthorforMateriaMedicaDDL";
export const GET_REMEDY_DDL = "/MateriaMedicaMaster/GetRemedyDDL";
export const GET_AUTHOR_DDL = "/MateriaMedicaMaster/GetAuthorDDL";
export const GET_MATERIA_MEDICA_HEAD_BY_AUTHOR_ID = "/MateriaMedicaMaster/GetMateriaMedicaHeadByAuthorId/";

//Remedy Api Urls
export const GET_REMEDIES = "/remedy/GetRemedies";
export const GET_REMEDIES_FOR_REMEDIAL_RUBRICS = "/Pagination/GetRemedies";
export const CREATE_REMEDY = "/remedy";
export const GET_MATERIA_MEDICA_REMEDIES_DETAILS = "/MateriaMedicaRemediesDetails/GetMateriaMedicaRemediesDetails";

//Rubric Api Urls
export const GET_RUBRIC = "/Pagination/GetSubSectionForRubric";
export const GET_SECTION_FOR_SUBSECTION = "/mastersAPI/GetSections";
export const GET_GRADE_DETAILS = "/RubricRemedy/GetGradeDetails/";
export const GET_AUTHOR_FOR_RUBRIC = "/Author/GetData";
export const GET_SUB_SECTION = "/mastersAPI/GetSubsectionBySection";
export const GET_REMEDY_GRADES = "/mastersAPI/GetRemedyGrades";
export const GET_REMEDIES_BY_GRADE = "/mastersAPI/GetRemedies";
export const SAVE_UPDATE_RUBRIC_REMEDY = "/RubricRemedy/SaveUpdateRubricRemedy";
export const IMPORT_FROM_EXCEL = "/RubricRemedy/ImportFromExcel";
export const IMPORT_FROM_EXCEL_STATUS = "/RubricRemedy/ImportFromExcel/Status";
export const EXPORT_RUBRICS_TO_EXCEL = "/RubricRemedy/ExportRubricsToExcel";
export const GET_RUBRIC_REMEDY_BY_SECTION_ID_GREAD_ID = "/RubricRemedy/GetRubricRemedyBySectionIdGreadId";

//Clinical Question
export const GET_QUESTION_GROUP = "/DropdownList/GetQuestionGroupDDL";
export const GET_QUESTION_SUB_GROUP = "/DropdownList/GetQuestionSubGroupDDL";
export const DELETE_QUESTION_BODY_PART_DATA = "/clinicalquestions/DeleteQuestionBodyPartData";
export const GET_CLINICAL_QUESTION_BODY_PART = "/Pagination/GetClinicalQuestionBodyPart";
export const GET_CLINICAL_QUESTION_BODY_PART_DATA_BY_ID = "/clinicalquestions/GetClinicalQuestionBodyPartDataById";
export const GET_QUESTION_SECTIONS_DDL = "/DropdownList/GetQuestionSectionsDDL";
export const GET_SUB_QUESTION_GROUP_DDL = "/DropdownList/GetSubQuestionGroupByQGIDQSIDDDL";
export const GET_BODY_PARTS_BY_SECTION = "/bodypart/GetBodyPartsBySection";
export const ADD_EDIT_CLINICAL_QUESTIONS_BODY_PART = "/clinicalquestions/AddEditClinicalQuestionsBodyPart";

// 3D Body Part
export const GET_MESH_KEY_MASTER = "/threeDBodyPartMeshKeyMaster/GetThreeDBodyPartMeshKeyMasterList";
export const DELETE_MESH_KEY_MASTER = "/threeDBodyPartMeshKeyMaster/DeleteThreeDBodyPartMeshKeyMaster";
export const ADD_MESH_KEY_MASTER = "/threeDBodyPartMeshKeyMaster/AddThreeDBodyPartMeshKeyMaster";
export const UPDATE_MESH_KEY_MASTER = "/threeDBodyPartMeshKeyMaster/UpdateThreeDBodyPartMeshKeyMaster";

export const GET_ANATOMY_SECTION_MASTER = "/threeDBodyPartSectionMaster/GetThreeDBodyPartSectionMasterList";
export const GET_ANATOMY_SECTION_MASTER_BY_MESH_KEY_ID =
  "/threeDBodyPartSectionMaster/GetThreeDBodyPartSectionMasterByMeshKeyId";
export const DELETE_ANATOMY_SECTION_MASTER = "/threeDBodyPartSectionMaster/DeleteThreeDBodyPartSectionMaster";
export const ADD_ANATOMY_SECTION_MASTER = "/threeDBodyPartSectionMaster/AddThreeDBodyPartSectionMaster";
export const UPDATE_ANATOMY_SECTION_MASTER = "/threeDBodyPartSectionMaster/UpdateThreeDBodyPartSectionMaster";

export const GET_ANATOMY_HOTSPOT = "/threeDBodyPartSectionHotspot/GetThreeDBodyPartSectionHotspotList";
export const GET_ANATOMY_HOTSPOT_BY_SECTION_ID =
  "/threeDBodyPartSectionHotspot/GetThreeDBodyPartSectionHotspotBySectionId";
export const DELETE_ANATOMY_HOTSPOT = "/threeDBodyPartSectionHotspot/DeleteThreeDBodyPartSectionHotspot";
export const ADD_ANATOMY_HOTSPOT = "/threeDBodyPartSectionHotspot/AddThreeDBodyPartSectionHotspot";
export const UPDATE_ANATOMY_HOTSPOT = "/threeDBodyPartSectionHotspot/UpdateThreeDBodyPartSectionHotspot";


//language
export const GET_LANGUAGE = "/Pagination/GetLanguage";
export const DELETE_LANGUAGE = "/LanguageMaster/DeleteLanguage";
export const ADD_UPDATE_LANGUAGE = "/LanguageMaster";

//Intensity
export const GET_INTENSITIES = "/Pagination/GetIntensities";
export const DELETE_INTENSITY = "/intensity/DeleteIntensity";
export const CREATE_UPDATE_INTENSITY = "/intensity";

//Body Part
export const GET_BODY_PARTS = "/Pagination/GetBodyParts";
export const DELETE_BODY_PART = "/bodypart/DeleteBodyPart";
export const CREATE_UPDATE_BODYPART = "/bodypart";

//Remedy Grade
export const GET_REMEDY_GRADES_LIST = "/remedygrade/GetRemedyGrades";
export const DELETE_REMEDY_GRADE = "/remedygrade/DeleteRemedyGrade";
export const CREATE_UPDATE_REMEDY_GRADE = "/remedygrade";

//Remedical Rubric
export const GET_RUBRIC_REMEDY_DETAILS = "/RubricRemedy/GetRubricRemedyDetails";
export const UPDATE_ISSMALL_RUBRIC = "/RubricRemedy/UpdateIsSmallRubric";
export const UPDATE_ISCONFIRMATION_RUBRIC = "/RubricRemedy/UpdateIsConfirmationRubric";

//Remedy
export const GET_REMEDIES_LIST = "/Pagination/GetRemedies";
export const DELETE_REMEDY = "/remedy/DeleteRemedy";
export const GET_ALL_THERMAL_DDL = "/DropdownList/GetAllThermalDDL";

//Sub Section
export const GET_SUBSECTION_BY_SECTION_ID_AND_QUERY_STRING = "/Pagination/GetSubSectionBySectionIdAndQueryString";
export const DELETE_SUBSECTION = "/subsection/DeleteSubSection";
export const GET_SUBSECTION_BY_SECTION = "/DropdownList/GetSubsectionBySection";
export const CREATE_UPDATE_SUNSECTION = "/subsection";
export const EXPORT_SUBSECTIONS_TO_EXCEL = "/subsection/ExportSubSectionsToExcel";
export const IMPORT_SUBSECTIONS_FROM_EXCEL = "/subsection/ImportFromExcel";
export const UPDATE_SUBSECTIONS_FROM_EXCEL = "/subsection/UpdateSubSectionsFromExcel";
export const DOWNLOAD_REFERENCE_RUBRICS_TEMPLATE = "/subsection/DownloadReferenceRubricsTemplate";
export const IMPORT_REFERENCE_RUBRICS = "/subsection/ImportReferenceRubrics";
export const DELETE_REFERENCE_RUBRIC_DETAILS = "/subsection/DeleteReferenceRubricDetails";
export const DELETE_SUBSECTION_LANGUAGE_DETAILS = "/subsection/DeleteSubSectionLanguageDetails";
export const GET_MAIN_PARENT_SUBSECTIONS_WITH_CHILD_COUNT = "/subsection/GetMainParentSubSectionsWithChildCount";
export const GET_SUBSECTION_WITH_CHILDREN_COUNT = "/subsection/GetSubSectionWithChildrenCount";
export const SEARCH_SUBSECTION_BY_SECTION = "/subsection/SearchBySection";
export const SEARCH_SUBSECTION_GLOBAL = "/subsection/SearchGlobal";
export const SEARCH_SUBSECTION_BY_SECTION_PAGED = "/subsection/SearchBySectionPaged";
export const SEARCH_SUBSECTION_GLOBAL_PAGED = "/subsection/SearchGlobalPaged";
export const UPDATE_MAIN_PARENT_SUBSECTION = "/subsection/UpdateMainParentSubsection";
export const SEARCH_SUBSECTION_BY_HOTSPOT = "/subsection/SearchByHotspot";

//Diagnosis System
export const GET_DIAGNOSIS_SYSTEM = "/Pagination/GetDiagnosisSystem";
export const DELETE_DIAGNOSIS_SYSTEM = "/DiagnosisSystem/DeleteDiagnosisSystem";
export const SAVE_DIAGNOSIS_SYSTEM = "/DiagnosisSystem/SaveDiagnosisSystem";


export const GET_DRUG_SYSTEM = "/Pagination/GetDrugSystem";
export const DELETE_DRUG_SYSTEM = "/DrugSystem/DeleteDrugSystem";
export const CREATE_DRUG_SYSTEM = "/DrugSystem";

export const GET_DRUG_GROUP = "/Pagination/GetDrugGroup";
export const ADD_DRUG_GROUP = "/DrugGroup";
export const DELETE_DRUG_GROUP = "/DrugGroup/DeleteDrugGroup";
export const UPDATE_DRUG_GROUP = "/DrugGroup";
export const GET_DRUG_GROUP_BY_ID = "/DrugGroup";

export const GET_ALLOPATHIC_DRUG = "/Pagination/GetAllopathicDrug";
export const GET_ALLOPATHIC_DRUG_BY_ID = "/AllopathicDrug";
export const UPDATE_ALLOPATHIC_DRUG = "/AllopathicDrug";
export const DELETE_ALLOPATHIC_DRUG = "/AllopathicDrug/DeleteAllopathicDrug";

// Side Effect Delete URLs
export const DELETE_SERIOUS_SIDE_EFFECT = "/SeriousSideEffect/DeleteSeriousSideEffect";
export const DELETE_OTHER_SIDE_EFFECT = "/OtherSideEffect/DeleteOtherSideEffect";
export const DELETE_ADVERSE_REACTION = "/AdverseReaction/DeleteAdverseReaction";

// Question Section URLs
export const GET_QUESTION_SECTIONS = "/Pagination/GetQuestionSections";
export const DELETE_QUESTION_SECTION = "/questionsection/DeleteQuestionSection";
export const CREATE_QUESTION_SECTION = "/questionsection";
export const UPDATE_QUESTION_SECTION = "/questionsection";


// Question Group URLs
export const GET_QUESTION_GROUP_EXISTANCE = "/Pagination/GetQuestionGroupExistance";
export const DELETE_QUESTION_GROUP = "/questiongroup/DeleteQuestionGroup";
export const CREATE_QUESTION_GROUP = "/questiongroup";
export const GET_QUESTION_GROUP_BY_EXISTANCE_ID = "/questiongroup/GetQuestionGroupByExistanceId";

//Package Api Urls
export const GET_PACKAGES = "/package";
export const DELETE_PACKAGE = "/package/DeletePackage";
export const CREATE_PACKAGE = "/package";

// Qualification Master
export const GET_QUALIFICATIONS = "/qualification/GetQualificationList";
export const ADD_QUALIFICATION = "/qualification/AddQualification";
export const UPDATE_QUALIFICATION = "/qualification/UpdateQualificationDetails";
export const DELETE_QUALIFICATION = "/qualification/DeleteQualificationDetails";
export const GET_QUALIFICATION_BY_ID = "/qualification/GetQualificationDetailsById";

/* Lab Test API URLs */
export const GET_LAB_TESTS = "/Pagination/GetPatientLabTests";
export const ADD_EDIT_PATIENT_LAB_TEST = "/PatientLabTest/AddEditPatientLabTest";
export const GET_PATIENT_LAB_TEST_BY_ID = "/PatientLabTest/GetPatientLabTestById";

// Sub Question Group URLs
export const GET_QUESTION_SUB_GROUP_LIST = "/Pagination/GetQuestionSubGroup";
export const DELETE_QUESTION_SUB_GROUP = "/QuestionSubGroup/DeleteQuestionSubGroup";
export const CREATE_UPDATE_QUESTION_SUB_GROUP = "/QuestionSubGroup";
export const GET_SUB_QUESTION_GROUP_BY_QGID_QSID = "/DropdownList/GetSubQuestionGroupByQGIDQSIDDDL";
export const GET_CLINICAL_QUESTIONS_KEYWORD_BODY_PART = "/clinicalquestions/GetClinicalQuestionsKeyWordBodyPart";
export const GET_CLINICAL_RUBRIC_DATA = "/clinicalquestions/GetClinicalRubricData";
/* Diagnosis Therapeutics */
export const GET_DIAGNOSIS_THERAPEUTICS_DETAILS = "/Pagination/GetDiagnosisTherapeuticsDetails";
export const GET_DIAGNOSIS_FOR_CLINICAL_PATTERN = "/diagnosis/GetDiagnosisForClinicalPattern";
export const GET_DIAGNOSIS_THERAPEUTICS_DETAILS_BY_ID = "/Pagination/GetDiagnosisTherapeuticsDetailsById";
export const DIAGNOSIS_THERAPEUTICS_DETAIL = "/DiagnosisTherapeuticsDetail";
export const SAVE_DIAGNOSIS_THERAPEUTICS_DETAIL = "/DiagnosisTherapeuticsDetail/SaveDiagnosisTherapeuticsDetail";
export const DIAGNOSIS_SEARCH = "/diagnosis/DiagnosisSearch";
export const GET_THREPOTIC_BY_DIAGNOSIS_ID = "/diagnosis/GetThrepoticByDiagonisID";
/* Diagnosis Conditions */
export const GET_DIAGNOSIS_CONDITIONS = "/Pagination/GetDiagnosis";
export const DELETE_DIAGNOSIS = "/diagnosis/deletediagnosis";
export const CREATE_DIAGNOSIS = "/diagnosis";
export const UPDATE_DIAGNOSIS = "/diagnosis";
export const GET_DIAGNOSIS_BY_ID = "/diagnosis";
export const DELETE_DIAGNOSIS_RUBRIC = "/diagnosis/DeleteDiagnosisRubric";


// Doctor Dashboard
export const GET_DOCTOR_DASHBOARD_COUNT = "/doctorDashBoard/GetCountApp";
export const GET_PATIENT_STATS_CHARTS = "/doctorDashBoard/GetPatientStatsCharts";
export const PATIENT_NEW_APPOINTMENT = "/PatientApp";
export const UPDATE_APPOINTMENT_STATUS = "/PatientApp/UpdateAppointmentStatus";
export const UPDATE_APPOINTMENT_TIME = "/PatientAppointment/UpdateAppointmentTime";
export const GET_DAILY_SCHEDULE = "/PatientAppointment/GetDailySchedule";
export const SAVE_DAILY_SCHEDULE = "/PatientAppointment/SaveDailySchedule";
export const GET_APPOINTMENT_SLOTS = "/PatientAppointment/GetAppointmentSlots";
export const GET_PATIENT_LIST = "/patientApp/GetCasesByUser";
export const GET_DOCTOR_LIST = "/mastersAPI/GetDoctorDetails";
export const GET_APPOINTMENT_LIST = "/doctorDashBoard";
export const EXPORT_PATIENTS = "/doctorDashBoard/ExportPatients";
export const CREATE_PATIENT = "/patient";
export const DELETE_PATIENT = "/patient/Deletepatient";
export const DOWNLOAD_PATIENT_IMPORT_TEMPLATE = "/patient/DownloadImportTemplate";
export const IMPORT_PATIENTS = "/patient/ImportPatients";
export const GET_COUNTRIES = "/country";
export const GET_STATES = "/state/GetStates";
export const PACKAGES = "/mastersAPI/GetPackages";

//Patient Board
export const GET_ALLOPATHIC_DRUG_FOR_DROPDOWN = "/AllopathicDrug/GetAllopathicDrugfordropdown";
export const GET_ALLOPATHIC_DRUG_FOR_DROPDOWN_BY_ID = "/AllopathicDrug/GetAllopathicDrugById";
export const GET_DIAGNOSIS_KEYWORD_BY_TAB = "/diagnosis/GetDiagnosisKeywordByTab";
export const GET_PATIENT_BOARD_DATA = "/PatientBoard/GetPatientBoardData";
export const GET_QUESTION_SECTIONS_BY_SUB_SECTION_ID = "/questionsection/GetQuestionSectionsBySubSectionId";
export const GET_RUBRIC_DETAILS = "/RubricRemedy/GetRubricDetails";
export const GET_RUBRIC_BY_KEYWORD_ID = "/diagnosis/GetRubricByKeywordID";
export const SEARCH_RUBRICS_BY_KEYWORD = "/subsection/SearchRubricsByKeyword";
export const GET_REMEDY_COUNTS = "/RubricRemedy/GetRemedyCounts";
export const GET_COMMAN_UNCOMMAN_RUBRICS_DETAILS = "/clipboardRubrics/GetCommanUnCommanRubricsDetails";
export const GET_DIFFERENTIAL_MATERIA_MEDICA = "/RepertorizationPage/GetDifferentialMateriaMedica";
export const GENERATE_ORDER_ID = "/Order/GenerateOrderId";
export const SAVE_UPDATE_SUBSCRIPTION = "/Subscription/SaveUpdateSubscription";
export const GET_REPERTORIZARION_REMEDY_FOR_ACCORDION = "/Pagination/GetRepertorizarionRemedyForAccordion";
export const GET_MATERIA_MEDICA_HEADING_BY_AUTHOR_ID = "/RepertorizationPage/GetMateriaMedicaHeadingbyAuthorId";
export const GET_ELIMINATION_DATA = "/clipboardRubrics/GetEliminationData";
export const GET_PATIENT_LAB_TEST_DDL = "/DropdownList/GetPatientLabTestDDL";
export const GET_PATIENT_LAB_ORDER = "/PatientLab/GetPatientLabOrder";
export const GET_PATIENT_LAB_ENTRY = "/PatientLab/GetPatientLabEntry";
export const SAVE_UPDATE_APPOINTMENT_HISTORY_NOTE = "/AppointmentHistoryNote/SaveUpdateAppointmentHistoryNote";
export const GET_APPOINTMENT_HISTORY_NOTES = "/AppointmentHistoryNote/GetAllAppointmentHistoryNotes";
export const GET_APPOINTMENT_LIST_BY_PATIENT_ID = "/PatientAppointment/GetAppointmentListByPatientId";
export const GET_PRESCRIPTION_DETAILS_BY_APPOINTMENT_ID = "/Prescription/GetPrescriptionDetailsByAppointmentId";
export const GET_PRESCRIPTION_REMEDY = "/Prescription/GetPrescriptionRemedy";
export const SAVE_PATIENT_LAB_ORDER = "/PatientLab/SavePatientLabOrder";
export const SAVE_PATIENT_LAB_ENTRY = "/PatientLab/SavePatientLabEntry";
export const SAVE_PRESCRIPTION_DETAIL = "/Prescription/SavePrescriptionDetail";

// Patient details
export const GET_PATIENT_DETAILS = "/patient/GetPatientDetails";

//Role Master API URLs
export const GET_ROLE_MASTER = "/roleMaster/GetRoleMaster";
export const GET_ROLES = "/roleMaster/GetRoleMaster";
export const GET_ROLE_BY_ID = "/roleMaster";
export const CREATE_ROLE = "/roleMaster";
export const UPDATE_ROLE = "/roleMaster";
export const DELETE_ROLE = "/roleMaster/DeleteRoleMaster";

//Firm API URLs
export const GET_FIRM_DETAILS = "/mastersAPI/GetFirmDetails";

export const GET_NEWS = "/Pagination/GetAllNewsDetails";
export const GET_NEWS_CATEGORIES = "/NewsCategory/GetAllNewsCategory";
export const SAVE_NEWS_DETAILS = "/NewsDetail/SaveNewsDetails";
export const GET_NEWS_DETAILS_BY_ID = "/NewsDetail/GetNewsDetailsbyId";
export const DELETE_NEWS_DETAILS = "/NewsDetail/DeleteNewsDetails";

//Blog API URLs
export const GET_ALL_BLOG_DETAIL = "/Pagination/GetAllBlogDetail";
export const SAVE_BLOG_DETAIL = "/BlogDetail";
export const GET_BLOG_DETAIL_BY_ID = "/BlogDetail/GetBlogDetailById";
export const DELETE_BLOG_DETAIL = "/BlogDetail/DeleteBlogDetail";

// WhatsApp API URLs (base: /api/WhatsApp)
export const GET_LANGUAGES_MASTERS = "/mastersAPI/GetLanguages";
export const WHATSAPP_GET_TEMPLATES = "/WhatsApp/GetTemplates";
export const WHATSAPP_GET_TEMPLATE_BY_ID = "/WhatsApp/GetTemplateById";
export const WHATSAPP_ADD_TEMPLATE = "/WhatsApp/AddTemplate";
export const WHATSAPP_UPDATE_TEMPLATE = "/WhatsApp/UpdateTemplate";
export const WHATSAPP_SEND_HOSPITAL_SERVICE = "/WhatsApp/SendHospitalServiceMessage";
export const WHATSAPP_SEND_OFFER = "/WhatsApp/SendOfferMessage";
export const WHATSAPP_SEND_HEALTH_TIP = "/WhatsApp/SendHealthTipMessage";
export const WHATSAPP_SEND_BULK = "/WhatsApp/SendBulkMessage";
export const WHATSAPP_GET_MESSAGE_HISTORY = "/WhatsApp/GetMessageHistory";
export const WHATSAPP_GET_MESSAGE_BY_ID = "/WhatsApp/GetMessageById";
export const WHATSAPP_GET_CAMPAIGN_HISTORY = "/WhatsApp/GetCampaignHistory";
export const WHATSAPP_GET_CAMPAIGN_DETAILS = "/WhatsApp/GetCampaignDetails";
export const WHATSAPP_GET_DASHBOARD = "/WhatsApp/GetDashboard";

// Patient Board backup API URLs
export const PATIENT_BOARD_BACKUP_SAVE = "/PatientBoardBackup/Save";
export const PATIENT_BOARD_BACKUP_SUMMARY = "/PatientBoardBackup/Summary";
export const PATIENT_BOARD_BACKUP_LATEST = "/PatientBoardBackup/Latest";
export const PATIENT_BOARD_BACKUP_DELETE = "/PatientBoardBackup/Delete";

/* Audio case taking */
export const AUDIO_CASE_TAKING_UPLOAD = "/AudioCaseTaking/upload";
export const AUDIO_CASE_TAKING_STATUS = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_RESULT = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_DOWNLOAD = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_REANALYZE = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_DOCTOR_ACTION = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_LATEST = "/AudioCaseTaking/latest";
export const AUDIO_CASE_TAKING_SESSIONS = "/AudioCaseTaking/sessions";
export const AUDIO_CASE_TAKING_CONCEPTS = "/AudioCaseTaking";
export const AUDIO_CASE_TAKING_RUBRIC_FEEDBACK = "/AudioCaseTaking";

export const RUBRIC_INTELLIGENCE_BENCHMARK_SUMMARY = "/AudioCaseIntelligence/benchmark/summary";
export const RUBRIC_INTELLIGENCE_BENCHMARK_TRENDS = "/AudioCaseIntelligence/benchmark/trends";
export const RUBRIC_INTELLIGENCE_FEEDBACK_QUEUE = "/AudioCaseIntelligence/feedback/queue";
export const RUBRIC_INTELLIGENCE_CONFIG = "/AudioCaseIntelligence/config";
export const RUBRIC_INTELLIGENCE_ROLLOUT_STATUS = "/AudioCaseIntelligence/rollout/status";
export const RUBRIC_INTELLIGENCE_REPERTORY_STATUS = "/AudioCaseIntelligence/repertory/status";

/* Rubric intelligence admin */
export const RUBRIC_INTELLIGENCE_METAPHORS = "/AudioCaseIntelligence/admin/metaphors";
export const RUBRIC_INTELLIGENCE_ALIASES = "/AudioCaseIntelligence/admin/aliases";