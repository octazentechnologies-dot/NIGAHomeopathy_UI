import { getAuthUserInfo } from './dashboard_helper';
import Swal from 'sweetalert2';

export const MAX_ACTIVE_PATIENT_SESSIONS = 5;

const AVATAR_COLORS = ['#e91e63', '#9c27b0', '#ffc107', '#2196f3', '#4caf50', '#ff5722', '#009688', '#673ab7'];

const serializeSet = (value) => (value instanceof Set ? Array.from(value) : []);

const deserializeSet = (value) => new Set(Array.isArray(value) ? value : []);

const serializeMap = (value) => {
  if (!(value instanceof Map)) {
    return {};
  }
  return Object.fromEntries(value.entries());
};

const deserializeMap = (value) => {
  if (!value || typeof value !== 'object') {
    return new Map();
  }
  return new Map(Object.entries(value));
};

export const getDoctorUserId = () => {
  const info = getAuthUserInfo();
  return info?.userId ?? info?.id ?? info?.UserId ?? null;
};

export const buildPatientBoardKey = ({
  patientId,
  caseId,
  patientAppId,
  userId = getDoctorUserId(),
} = {}) => {
  if (!patientId || !userId) {
    return null;
  }
  const parts = [
    String(userId),
    String(patientId),
    caseId != null && caseId !== '' ? String(caseId) : '_',
    patientAppId != null && patientAppId !== '' ? String(patientAppId) : '_',
  ];
  return parts.join('|');
};

export const buildPatientBoardResumePath = ({
  patientId,
  caseId,
  patientAppId,
  appointmentDate,
  patientName,
} = {}) => {
  const params = new URLSearchParams();
  if (patientId != null && patientId !== '') params.set('patientId', String(patientId));
  if (caseId != null && caseId !== '') params.set('caseId', String(caseId));
  if (patientAppId != null && patientAppId !== '') params.set('patientAppId', String(patientAppId));
  if (appointmentDate != null && appointmentDate !== '') params.set('appointmentDate', String(appointmentDate));
  if (patientName != null && String(patientName).trim() !== '') {
    params.set('patientName', String(patientName).trim());
  }
  const query = params.toString();
  return query ? `/doctor/patientboard?${query}` : '/doctor/patientboard';
};

export const buildPatientBoardPath = (patient = {}) => {
  const patientId = patient.patientID ?? patient.patientId ?? patient.PatientId ?? '';
  const caseId = patient.caseID ?? patient.caseId ?? patient.CaseId ?? '';
  const patientAppId =
    patient.patientAppId ?? patient.patientAppID ?? patient.PatientAppId ?? patient.appointmentId ?? patient.id ?? '';
  const appointmentDate = patient.appointmentDate ?? patient.AppointmentDate ?? '';
  const patientName = patient.patientName ?? patient.name ?? patient.PatientName ?? '';
  return buildPatientBoardResumePath({ patientId, caseId, patientAppId, appointmentDate, patientName });
};

export const buildPatientBoardAudioPath = (patient = {}) => {
  const base = buildPatientBoardPath(patient);
  const suffix = 'caseTakingMode=audio&caseTakingOrigin=audio';
  return base.includes('?') ? `${base}&${suffix}` : `${base}?${suffix}`;
};

export const buildPatientBoardKeyFromPatient = (patient = {}) => buildPatientBoardKey({
  patientId: patient.patientID ?? patient.patientId ?? patient.PatientId,
  caseId: patient.caseID ?? patient.caseId ?? patient.CaseId,
  patientAppId:
    patient.patientAppId
    ?? patient.patientAppID
    ?? patient.PatientAppId
    ?? patient.appointmentId
    ?? patient.id,
});

export const getPatientInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getPatientAvatarColor = (name) => {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const getSortedPatientSessions = (sessions = []) => (
  [...sessions].sort((a, b) => (a.lastUpdatedAt ?? 0) - (b.lastUpdatedAt ?? 0))
);

export const findPatientSession = (sessions = [], patientKey) => (
  sessions.find((item) => item.patientKey === patientKey) ?? null
);

export const canOpenPatientSession = (sessions = [], patientKey) => {
  if (!patientKey) {
    return { allowed: true, isExisting: false, activeSessions: sessions };
  }

  const existing = findPatientSession(sessions, patientKey);
  if (existing) {
    return { allowed: true, isExisting: true, activeSessions: sessions };
  }

  if (sessions.length >= MAX_ACTIVE_PATIENT_SESSIONS) {
    return {
      allowed: false,
      isExisting: false,
      activeSessions: getSortedPatientSessions(sessions),
    };
  }

  return { allowed: true, isExisting: false, activeSessions: sessions };
};

export const showPatientSessionLimitAlert = (activeSessions = []) => {
  const patientList = getSortedPatientSessions(activeSessions)
    .map((session) => session.patientName)
    .filter(Boolean)
    .map((name) => `<li style="margin-bottom:4px;">${name}</li>`)
    .join('');

  Swal.fire({
    icon: 'info',
    title: 'Active patient limit reached',
    html: `
      <div style="text-align:left;font-size:14px;line-height:1.5;">
        <p style="margin-bottom:12px;">
          You can work on up to <strong>${MAX_ACTIVE_PATIENT_SESSIONS} patients</strong> at the same time.
          To open another patient, please complete an existing case by
          <strong>saving the Prescription</strong> from Patient Board.
        </p>
        <p style="margin-bottom:8px;font-weight:600;">Patients currently in progress:</p>
        <ul style="margin:0;padding-left:18px;">${patientList || '<li>No active patients listed</li>'}</ul>
      </div>
    `,
    confirmButtonText: 'Understood',
    confirmButtonColor: '#000000',
  });
};

export const collectPatientBoardSnapshot = (state) => ({
  activeTab: state.activeTab ?? 'Repertory',

  questionSearch: state.questionSearch ?? '',
  rubricSearch: state.rubricSearch ?? '',
  activePerticular: state.activePerticular ?? null,
  activeKeywordTab: state.activeKeywordTab ?? null,
  activeQuestion: state.activeQuestion ?? null,
  selectedSubGroupName: state.selectedSubGroupName ?? '',
  activeQuestionGroupId: state.activeQuestionGroupId ?? null,
  questionGroupsMap: state.questionGroupsMap ?? {},
  questionSubGroupsMap: state.questionSubGroupsMap ?? {},
  questionsRubricList: Array.isArray(state.questionsRubricList) ? state.questionsRubricList : [],
  questionsRubricPage: state.questionsRubricPage ?? 1,
  questionsRubricHasMore: Boolean(state.questionsRubricHasMore),

  differentialMainTab: state.differentialMainTab ?? 'COMMON',
  selectedDifferentialAuthorId: state.selectedDifferentialAuthorId ?? null,
  differentialSearchTerm: state.differentialSearchTerm ?? '',
  commonRemediesSearchTerm: state.commonRemediesSearchTerm ?? '',
  uncommonRemediesSearchTerm: state.uncommonRemediesSearchTerm ?? '',
  selectedDifferentialHeadingId: state.selectedDifferentialHeadingId ?? null,
  diagnosisData: state.diagnosisData ?? null,
  keywordsData: Array.isArray(state.keywordsData) ? state.keywordsData : [],
  selectedClinicalPattern: state.selectedClinicalPattern ?? null,
  activeKeyword: state.activeKeyword ?? null,
  keywordSearch: state.keywordSearch ?? '',
  rubricRemedySearch: state.rubricRemedySearch ?? '',
  therapeuticsFontSize: state.therapeuticsFontSize ?? 14,

  filledPyramidIcons: serializeSet(state.filledPyramidIcons),
  isKeynoteMethodActive: Boolean(state.isKeynoteMethodActive),
  isSmallRubricsActive: Boolean(state.isSmallRubricsActive),
  expandedCommonItems: serializeSet(state.expandedCommonItems),
  expandedUncommonItems: serializeSet(state.expandedUncommonItems),
  accordionDataMap: serializeMap(state.accordionDataMap),
  lastRequestedRemedyId: state.lastRequestedRemedyId ?? null,
  isKeynoteEnabled: Boolean(state.isKeynoteEnabled),
  isSmallRubricEnabled: Boolean(state.isSmallRubricEnabled),
  selectedRemedyFromCommonUncommon: state.selectedRemedyFromCommonUncommon ?? null,
  selectedThermalId: state.selectedThermalId ?? null,

  selectedRepertoryOption: state.selectedRepertoryOption ?? null,
  selectedSection: state.selectedSection ?? null,
  selectedSubSection: state.selectedSubSection ?? null,
  subSectionSearch: state.subSectionSearch ?? '',
  currentSubSectionPage: state.currentSubSectionPage ?? 1,
  sectionPageNumber: state.sectionPageNumber ?? 1,
  accumulatedSections: Array.isArray(state.accumulatedSections) ? state.accumulatedSections : [],
  subSectionPageNumber: state.subSectionPageNumber ?? 1,
  subSectionTreeData: Array.isArray(state.subSectionTreeData) ? state.subSectionTreeData : [],
  expandedSubSections: serializeSet(state.expandedSubSections),
  subSectionChildrenMap: serializeMap(state.subSectionChildrenMap),

  repertorizationRubrics: Array.isArray(state.repertorizationRubrics) ? state.repertorizationRubrics : [],
  selectedRepertorizeSectionIds: Array.isArray(state.selectedRepertorizeSectionIds)
    ? state.selectedRepertorizeSectionIds
    : [],
  selectedRepertorizeIntensity: state.selectedRepertorizeIntensity ?? null,

  audioCaseSessionId: state.audioCaseSessionId ?? null,
  audioSource: state.audioSource ?? null,
  audioTranscript: state.audioTranscript ?? null,
  audioConversationMessages: Array.isArray(state.audioConversationMessages) ? state.audioConversationMessages : [],
  audioSummary: state.audioSummary ?? null,
  audioSuggestedRubrics: Array.isArray(state.audioSuggestedRubrics) ? state.audioSuggestedRubrics : [],
  audioCaseStatus: state.audioCaseStatus ?? 'idle',

  selectedRemedy: state.selectedRemedy ?? null,
  selectedAuthor: state.selectedAuthor ?? null,
  mmFontSize: state.mmFontSize ?? 14,

  selectedAdverseType: state.selectedAdverseType ?? null,
  seriousEffectsSearch: state.seriousEffectsSearch ?? '',
  otherEffectsSearch: state.otherEffectsSearch ?? '',
  adverseReactionsSearch: state.adverseReactionsSearch ?? '',
  seriousEffectsPage: state.seriousEffectsPage ?? 1,
  otherEffectsPage: state.otherEffectsPage ?? 1,
  adverseReactionsPage: state.adverseReactionsPage ?? 1,

  prescriptionTab: state.prescriptionTab ?? 'Prescription',
  labsImagingTab: state.labsImagingTab ?? 'Ordered Labs & Imaging',
  prescriptionRemedyDetailList: Array.isArray(state.prescriptionRemedyDetailList)
    ? state.prescriptionRemedyDetailList
    : [],
  prescriptionRemedyDescription: state.prescriptionRemedyDescription ?? '',
  selectedPrescriptionRemedy: state.selectedPrescriptionRemedy ?? null,
  historyNotePlainText: state.historyNotePlainText ?? '',
  labOrderForm: state.labOrderForm ?? null,
  labEntryForm: state.labEntryForm ?? null,
});

export const applyPatientBoardSnapshot = (snapshot, setters) => {
  if (!snapshot || !setters) {
    return;
  }

  if (setters.setActiveTab) setters.setActiveTab(snapshot.activeTab ?? 'Repertory');

  if (setters.setQuestionSearch) setters.setQuestionSearch(snapshot.questionSearch ?? '');
  if (setters.setRubricSearch) setters.setRubricSearch(snapshot.rubricSearch ?? '');
  if (setters.setActivePerticular) setters.setActivePerticular(snapshot.activePerticular ?? null);
  if (setters.setActiveKeywordTab) setters.setActiveKeywordTab(snapshot.activeKeywordTab ?? null);
  if (setters.setActiveQuestion) setters.setActiveQuestion(snapshot.activeQuestion ?? null);
  if (setters.setSelectedSubGroupName) setters.setSelectedSubGroupName(snapshot.selectedSubGroupName ?? '');
  if (setters.setActiveQuestionGroupId) setters.setActiveQuestionGroupId(snapshot.activeQuestionGroupId ?? null);
  if (setters.setQuestionGroupsMap) setters.setQuestionGroupsMap(snapshot.questionGroupsMap ?? {});
  if (setters.setQuestionSubGroupsMap) setters.setQuestionSubGroupsMap(snapshot.questionSubGroupsMap ?? {});
  if (setters.setQuestionsRubricList) {
    setters.setQuestionsRubricList(Array.isArray(snapshot.questionsRubricList) ? snapshot.questionsRubricList : []);
  }
  if (setters.setQuestionsRubricPage) setters.setQuestionsRubricPage(snapshot.questionsRubricPage ?? 1);
  if (setters.setQuestionsRubricHasMore) setters.setQuestionsRubricHasMore(Boolean(snapshot.questionsRubricHasMore));

  if (setters.setDifferentialMainTab) setters.setDifferentialMainTab(snapshot.differentialMainTab ?? 'COMMON');
  if (setters.setSelectedDifferentialAuthorId) {
    setters.setSelectedDifferentialAuthorId(snapshot.selectedDifferentialAuthorId ?? null);
  }
  if (setters.setDifferentialSearchTerm) setters.setDifferentialSearchTerm(snapshot.differentialSearchTerm ?? '');
  if (setters.setCommonRemediesSearchTerm) {
    setters.setCommonRemediesSearchTerm(snapshot.commonRemediesSearchTerm ?? '');
  }
  if (setters.setUncommonRemediesSearchTerm) {
    setters.setUncommonRemediesSearchTerm(snapshot.uncommonRemediesSearchTerm ?? '');
  }
  if (setters.setSelectedDifferentialHeadingId) {
    setters.setSelectedDifferentialHeadingId(snapshot.selectedDifferentialHeadingId ?? null);
  }
  if (setters.setDiagnosisData) setters.setDiagnosisData(snapshot.diagnosisData ?? null);
  if (setters.setKeywordsData) setters.setKeywordsData(Array.isArray(snapshot.keywordsData) ? snapshot.keywordsData : []);
  if (setters.setSelectedClinicalPattern) setters.setSelectedClinicalPattern(snapshot.selectedClinicalPattern ?? null);
  if (setters.setActiveKeyword) setters.setActiveKeyword(snapshot.activeKeyword ?? null);
  if (setters.setKeywordSearch) setters.setKeywordSearch(snapshot.keywordSearch ?? '');
  if (setters.setRubricRemedySearch) setters.setRubricRemedySearch(snapshot.rubricRemedySearch ?? '');
  if (setters.setTherapeuticsFontSize) setters.setTherapeuticsFontSize(snapshot.therapeuticsFontSize ?? 14);

  if (setters.setFilledPyramidIcons) setters.setFilledPyramidIcons(deserializeSet(snapshot.filledPyramidIcons));
  if (setters.setIsKeynoteMethodActive) setters.setIsKeynoteMethodActive(Boolean(snapshot.isKeynoteMethodActive));
  if (setters.setIsSmallRubricsActive) setters.setIsSmallRubricsActive(Boolean(snapshot.isSmallRubricsActive));
  if (setters.setExpandedCommonItems) setters.setExpandedCommonItems(deserializeSet(snapshot.expandedCommonItems));
  if (setters.setExpandedUncommonItems) setters.setExpandedUncommonItems(deserializeSet(snapshot.expandedUncommonItems));
  if (setters.setAccordionDataMap) setters.setAccordionDataMap(deserializeMap(snapshot.accordionDataMap));
  if (setters.setLastRequestedRemedyId) setters.setLastRequestedRemedyId(snapshot.lastRequestedRemedyId ?? null);
  if (setters.setIsKeynoteEnabled) setters.setIsKeynoteEnabled(Boolean(snapshot.isKeynoteEnabled));
  if (setters.setIsSmallRubricEnabled) setters.setIsSmallRubricEnabled(Boolean(snapshot.isSmallRubricEnabled));
  if (setters.setSelectedRemedyFromCommonUncommon) {
    setters.setSelectedRemedyFromCommonUncommon(snapshot.selectedRemedyFromCommonUncommon ?? null);
  }
  if (setters.setSelectedThermalId) setters.setSelectedThermalId(snapshot.selectedThermalId ?? null);

  if (setters.setSelectedRepertoryOption) setters.setSelectedRepertoryOption(snapshot.selectedRepertoryOption ?? null);
  if (setters.setSelectedSection) setters.setSelectedSection(snapshot.selectedSection ?? null);
  if (setters.setSelectedSubSection) setters.setSelectedSubSection(snapshot.selectedSubSection ?? null);
  if (setters.setSubSectionSearch) setters.setSubSectionSearch(snapshot.subSectionSearch ?? '');
  if (setters.setCurrentSubSectionPage) setters.setCurrentSubSectionPage(snapshot.currentSubSectionPage ?? 1);
  if (setters.setSectionPageNumber) setters.setSectionPageNumber(snapshot.sectionPageNumber ?? 1);
  if (setters.setAccumulatedSections) {
    setters.setAccumulatedSections(Array.isArray(snapshot.accumulatedSections) ? snapshot.accumulatedSections : []);
  }
  if (setters.setSubSectionPageNumber) setters.setSubSectionPageNumber(snapshot.subSectionPageNumber ?? 1);
  if (setters.setSubSectionTreeData) {
    setters.setSubSectionTreeData(Array.isArray(snapshot.subSectionTreeData) ? snapshot.subSectionTreeData : []);
  }
  if (setters.setExpandedSubSections) setters.setExpandedSubSections(deserializeSet(snapshot.expandedSubSections));
  if (setters.setSubSectionChildrenMap) setters.setSubSectionChildrenMap(deserializeMap(snapshot.subSectionChildrenMap));

  if (setters.setRepertorizationRubrics) {
    setters.setRepertorizationRubrics(Array.isArray(snapshot.repertorizationRubrics) ? snapshot.repertorizationRubrics : []);
  }
  if (setters.setSelectedRepertorizeSectionIds) {
    setters.setSelectedRepertorizeSectionIds(
      Array.isArray(snapshot.selectedRepertorizeSectionIds) ? snapshot.selectedRepertorizeSectionIds : []
    );
  }
  if (setters.setSelectedRepertorizeIntensity) {
    setters.setSelectedRepertorizeIntensity(snapshot.selectedRepertorizeIntensity ?? null);
  }

  if (setters.setAudioCaseSessionId) setters.setAudioCaseSessionId(snapshot.audioCaseSessionId ?? null);
  if (setters.setAudioSource) setters.setAudioSource(snapshot.audioSource ?? null);
  if (setters.setAudioTranscript) setters.setAudioTranscript(snapshot.audioTranscript ?? null);
  if (setters.setAudioConversationMessages) {
    setters.setAudioConversationMessages(
      Array.isArray(snapshot.audioConversationMessages) ? snapshot.audioConversationMessages : []
    );
  }
  if (setters.setAudioSummary) setters.setAudioSummary(snapshot.audioSummary ?? null);
  if (setters.setAudioSuggestedRubrics) {
    setters.setAudioSuggestedRubrics(
      Array.isArray(snapshot.audioSuggestedRubrics) ? snapshot.audioSuggestedRubrics : []
    );
  }
  if (setters.setAudioCaseStatus) setters.setAudioCaseStatus(snapshot.audioCaseStatus ?? 'idle');

  if (setters.setSelectedRemedy) setters.setSelectedRemedy(snapshot.selectedRemedy ?? null);
  if (setters.setSelectedAuthor) setters.setSelectedAuthor(snapshot.selectedAuthor ?? null);
  if (setters.setMmFontSize) setters.setMmFontSize(snapshot.mmFontSize ?? 14);

  if (setters.setSelectedAdverseType) setters.setSelectedAdverseType(snapshot.selectedAdverseType ?? null);
  if (setters.setSeriousEffectsSearch) setters.setSeriousEffectsSearch(snapshot.seriousEffectsSearch ?? '');
  if (setters.setOtherEffectsSearch) setters.setOtherEffectsSearch(snapshot.otherEffectsSearch ?? '');
  if (setters.setAdverseReactionsSearch) setters.setAdverseReactionsSearch(snapshot.adverseReactionsSearch ?? '');
  if (setters.setSeriousEffectsPage) setters.setSeriousEffectsPage(snapshot.seriousEffectsPage ?? 1);
  if (setters.setOtherEffectsPage) setters.setOtherEffectsPage(snapshot.otherEffectsPage ?? 1);
  if (setters.setAdverseReactionsPage) setters.setAdverseReactionsPage(snapshot.adverseReactionsPage ?? 1);

  if (setters.setPrescriptionTab) setters.setPrescriptionTab(snapshot.prescriptionTab ?? 'Prescription');
  if (setters.setLabsImagingTab) setters.setLabsImagingTab(snapshot.labsImagingTab ?? 'Ordered Labs & Imaging');
  if (setters.setPrescriptionRemedyDetailList) {
    setters.setPrescriptionRemedyDetailList(
      Array.isArray(snapshot.prescriptionRemedyDetailList) ? snapshot.prescriptionRemedyDetailList : []
    );
  }
  if (setters.setPrescriptionRemedyDescription) {
    setters.setPrescriptionRemedyDescription(snapshot.prescriptionRemedyDescription ?? '');
  }
  if (setters.setSelectedPrescriptionRemedy) {
    setters.setSelectedPrescriptionRemedy(snapshot.selectedPrescriptionRemedy ?? null);
  }
  if (setters.setHistoryNotePlainText) {
    setters.setHistoryNotePlainText(snapshot.historyNotePlainText ?? '');
  }
  if (setters.setLabOrderForm && snapshot.labOrderForm) {
    setters.setLabOrderForm(snapshot.labOrderForm);
  }
  if (setters.setLabEntryForm && snapshot.labEntryForm) {
    setters.setLabEntryForm(snapshot.labEntryForm);
  }
};

export const hasPatientBoardWork = (snapshot) => {
  if (!snapshot) {
    return false;
  }
  if (Array.isArray(snapshot.repertorizationRubrics) && snapshot.repertorizationRubrics.length > 0) {
    return true;
  }
  if (snapshot.selectedSection || snapshot.selectedSubSection) {
    return true;
  }
  if (snapshot.selectedClinicalPattern || snapshot.activeQuestion || snapshot.activePerticular || snapshot.selectedSubGroupName) {
    return true;
  }
  if (snapshot.selectedRemedy || snapshot.selectedAdverseType) {
    return true;
  }
  if (snapshot.activeTab && snapshot.activeTab !== 'Repertory') {
    return true;
  }
  if (Array.isArray(snapshot.prescriptionRemedyDetailList) && snapshot.prescriptionRemedyDetailList.length > 0) {
    return true;
  }
  if (snapshot.prescriptionRemedyDescription && String(snapshot.prescriptionRemedyDescription).trim()) {
    return true;
  }
  if (snapshot.historyNotePlainText && String(snapshot.historyNotePlainText).trim()) {
    return true;
  }
  if (snapshot.labOrderForm && (
    snapshot.labOrderForm.patientLabTestId
    || snapshot.labOrderForm.testDate
    || snapshot.labOrderForm.labName
    || snapshot.labOrderForm.description
  )) {
    return true;
  }
  if (snapshot.labEntryForm && (
    snapshot.labEntryForm.patientLabTestId
    || snapshot.labEntryForm.testDate
    || snapshot.labEntryForm.parameterName
    || snapshot.labEntryForm.parameterValue
    || snapshot.labEntryForm.testDescription
  )) {
    return true;
  }
  return false;
};
