import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// Authentication
import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";

//Calendar
import CalendarReducer from "./calendar/reducer";
//Chat
import chatReducer from "./chat/reducer";
//Ecommerce
import EcommerceReducer from "./ecommerce/reducer";

//Project
import ProjectsReducer from "./projects/reducer";

// Tasks
import TasksReducer from "./tasks/reducer";

//Crypto
import CryptoReducer from "./crypto/reducer";

//TicketsList
import TicketsReducer from "./tickets/reducer";
//Crm
import CrmReducer from "./crm/reducer";

//Invoice
import InvoiceReducer from "./invoice/reducer";

//Mailbox
import MailboxReducer from "./mailbox/reducer";

// Dashboard Analytics
import DashboardAnalyticsReducer from "./dashboardAnalytics/reducer";

// Dashboard CRM
import DashboardCRMReducer from "./dashboardCRM/reducer";

// Dashboard Ecommerce
import DashboardEcommerceReducer from "./dashboardEcommerce/reducer";

// Dashboard Cryto
import DashboardCryptoReducer from "./dashboardCrypto/reducer";

// Dashboard Cryto
import DashboardProjectReducer from "./dashboardProject/reducer";

// Dashboard NFT
import DashboardNFTReducer from "./dashboardNFT/reducer";

// Pages > Team
import TeamDataReducer from "./team/reducer";

// File Manager
import FileManagerReducer from "./fileManager/reducer";

// To do
import TodosReducer from "./todos/reducer";

// Job
import JobReducer from "./jobs/reducer";

// API Key
import APIKeyReducer from "./apiKey/reducer";

//Admin Section
import SectionReducer from "./admin/section/reducer";

//Admin Materia Medica Author
import AuthorReducer from "./admin/materiaMedica/author/reducer";

//Admin Materia Medica Head
import HeadReducer from "./admin/materiaMedica/head/reducer";

//Admin Materia Medica
import MateriaMedicaReducer from "./admin/materiaMedica/materialMedica/reducer";

//Admin Materia Medica Remedy
import MateriaMedicaRemedyReducer from "./admin/materiaMedica/materiaMedicaRemedies/reducer";

//Admin Repertory Rubric
import RubricReducer from "./admin/repertory/rubric/reducer";

//Clinical Questions
import ClinicalQuestionsReducer from "./admin/existancequestions/clinicalquestions/reducer";

//Language 
import LanguageReducer from "./admin/repertory/language/reducer";

//Intensity
import IntensityReducer from "./admin/repertory/intensity/reducer";

//Body Part
import BodyPartReducer from "./admin/repertory/bodypart/reducer";

//Remedy Grade 
import RemedyGradeReducer from "./admin/repertory/remedygrade/reducer";

//Remedical Rubric
import RemedicalRubricReducer from "./admin/repertory/remedialrubrics/reducer";

//Remedy
import RemedyReducer from "./admin/repertory/remedy/reducer";

//SubSection
import SubSectionReducer from "./admin/repertory/subsection/reducer";

import DrugSystemReducer from "./admin/drugsystem/reducer";

import DrugGroupReducer from "./admin/druggroup/reducer";

import AllopathicDrugReducer from "./admin/allopathicdrug/reducer";

import ExistanceReducer from "./admin/existance/reducer";

import QuestionGroupReducer from "./admin/questiongroup/reducer";

//Diagnosis System
import DiagnosisSystemReducer from "./admin/clinicalpattern/diagnosissystem/reducer";

//Diagnosis Therapeutics
import DiagnosisTherapeuticsReducer from "./admin/clinicalpattern/diagnosistherapeutics/reducer";

import PackageReducer from "./admin/packages/reducer";
import QualificationReducer from "./admin/qualifications/reducer";
import RoleReducer from "./admin/role/reducer";
import UserReducer from "./admin/users/reducer";

import LabTestReducer from "./admin/labtests/reducer";

import SubQuestionGroupReducer from "./admin/existancequestions/subquestiongroup/reducer";

import DiagnosisConditionReducer from "./admin/clinicalpattern/diagnosiscondition/reducer";
import DoctorDashboardReducer from "./doctor/dashboard/reducer";
import PatientDashboardReducer from "./doctor/patientdashboard/reducer";
import PatientBoardSessionReducer from "./doctor/patientBoardSession/reducer";
import PatientBoardBackupReducer from "./doctor/patientBoardBackup/reducer";
import AudioCaseTakingReducer from "./doctor/audioCaseTaking/reducer";

import NewsReducer from "./admin/news/reducer";

import BlogReducer from "./admin/blog/reducer";

import MeshKeyMasterReducer from "./admin/3dbodypart/meshkeymaster/reducer";
import AnatomySectionMasterReducer from "./admin/3dbodypart/sectionmaster/reducer";
import AnatomyHotspotReducer from "./admin/3dbodypart/hotspots/reducer";

const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Account: AccountReducer,
    ForgetPassword: ForgetPasswordReducer,
    Profile: ProfileReducer,
    Calendar: CalendarReducer,
    Chat: chatReducer,
    Projects: ProjectsReducer,
    Ecommerce: EcommerceReducer,
    Tasks: TasksReducer,
    Crypto: CryptoReducer,
    Tickets: TicketsReducer,
    Crm: CrmReducer,
    Invoice: InvoiceReducer,
    Mailbox: MailboxReducer,
    DashboardAnalytics: DashboardAnalyticsReducer,
    DashboardCRM: DashboardCRMReducer,
    DashboardEcommerce: DashboardEcommerceReducer,
    DashboardCrypto: DashboardCryptoReducer,
    DashboardProject: DashboardProjectReducer,
    DashboardNFT: DashboardNFTReducer,
    Team: TeamDataReducer,
    FileManager: FileManagerReducer,
    Todos: TodosReducer,
    Jobs: JobReducer,
    APIKey: APIKeyReducer,
    Section: SectionReducer,
    Author: AuthorReducer,
    Head: HeadReducer,
    MateriaMedica: MateriaMedicaReducer,
    MateriaMedicaRemedy: MateriaMedicaRemedyReducer,
    Rubric: RubricReducer,
    ClinicalQuestions: ClinicalQuestionsReducer,
    Language: LanguageReducer,
    Intensity: IntensityReducer,
    BodyPart: BodyPartReducer,
    RemedyGrade: RemedyGradeReducer,
    RemedicalRubric: RemedicalRubricReducer,
    Remedy: RemedyReducer,
    SubSection: SubSectionReducer,
    DrugSystem: DrugSystemReducer,
    DrugGroup: DrugGroupReducer,
    AllopathicDrug: AllopathicDrugReducer,
    Existance: ExistanceReducer,
    QuestionGroup: QuestionGroupReducer,
    DiagnosisSystem: DiagnosisSystemReducer,
    DiagnosisCondition: DiagnosisConditionReducer,
    DiagnosisTherapeutics: DiagnosisTherapeuticsReducer,
    Package: PackageReducer,
    Qualification: QualificationReducer,
    Role: RoleReducer,
    User: UserReducer,
    LabTest: LabTestReducer,
    SubQuestionGroup: SubQuestionGroupReducer,
    DoctorDashboard: DoctorDashboardReducer,
    PatientDashboard: PatientDashboardReducer,
    PatientBoardSession: PatientBoardSessionReducer,
    PatientBoardBackup: PatientBoardBackupReducer,
    AudioCaseTaking: AudioCaseTakingReducer,
    News: NewsReducer,
    Blog: BlogReducer,
    MeshKeyMaster: MeshKeyMasterReducer,
    AnatomySectionMaster: AnatomySectionMasterReducer,
    AnatomyHotspot: AnatomyHotspotReducer,
});

export default rootReducer;