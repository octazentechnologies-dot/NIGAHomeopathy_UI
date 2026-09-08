import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import { Card, CardBody, Button, Input, UncontrolledTooltip, Tooltip, Modal, ModalHeader, ModalBody, ModalFooter, Col, Row, Label, Spinner } from 'reactstrap';
import Select from "react-select";
import Swal from 'sweetalert2';
import ReactHtmlParser from 'html-react-parser';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// Import Draft.js components
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import moment from 'moment';
import img3 from "../../../assets/images/small/img-3.jpg";
import AnatomyViewer from "../../../Components/AnatomyViewer";
import RemedyScoreBar from "../../../Components/RemedyScoreBar";
import "../../../styles/anatomy.css";
import { useDispatch, useSelector } from 'react-redux';
import usePatientBoardSessionPersistence from '../../../hooks/usePatientBoardSessionPersistence';
import { collectPatientBoardSnapshot, buildPatientBoardKey, canOpenPatientSession, showPatientSessionLimitAlert } from '../../../helpers/patientBoardSessionHelper';
import AudioCasePanel from '../../../Components/CaseTaking/AudioCasePanel';
import { buildSummaryHistoryNoteText } from '../../../helpers/audioCaseTakingHelper';
import { completePatientBoardSession } from '../../../slices/doctor/patientBoardSession/reducer';
import { getHomeDashboardPath } from '../../../helpers/dashboard_helper';
import {
  getAllopathicDrugForDropdown,
  getAllopathicDrugForDropdownById,
  getRemedyDDLForPatient,
  getAuthorDDLForPatient,
  getMateriaMedicaRemediesDetails,
  getDiagnosisForClinicalPatternList,
  getIntensitiesForPatient,
  getThrepoticByDiagnosisId,
  getDiagnosisKeywordByTab,
  getPatientBoardData,
  getQuestionSectionsBySubSectionId,
  getRubricDetails,
  getRubricDetailsBySubSectionId,
  searchRubricsByKeyword,
  getRemedyCounts,
  getSectionList,
  getSubSectionsList,
  getQuestionSectionDll,
  getQuestionGroupByExistanceId,
  getSubQuestionGroupByQGIDQSID,
  getIntensitiesList,
  getCommanUnCommanRubricsDetails,
  getRepertorizarionRemedyForAccordion,
  getDifferentialMateriaMedica,
  getMateriaMedicaHeadingByAuthorId,
  getAuthorsForMateriaMedicaDDL,
  getEliminationData,
  getPatientLabTestDDL,
  saveUpdateAppointmentHistoryNote,
  getPrescriptionRemedy,
  savePatientLabOrder,
  savePatientLabEntry,
  savePrescriptionDetail,
  getPatientDetails
} from '../../../slices/thunks';
import { pageTitle } from '../../../common/brand';
import {
  diagnosisSearch,
  getMainParentSubSectionsWithChildCount,
  getSubSectionWithChildrenCount,
  searchSubSectionsBySection,
  searchSubSectionsGlobal,
  searchSubSectionsBySectionPaged,
  searchSubSectionsGlobalPaged,
  getRepertorizarionRemedyForAccordion as getRepertorizarionRemedyForAccordionApi,
  getRubricRemedyDetails as getRubricRemedyDetailsApi,
  searchRubricsByKeyword as searchRubricsByKeywordApi,
  getMateriaMedicaHeadingByAuthorId as getMateriaMedicaHeadingByAuthorIdApi,
} from '../../../helpers/realbackend_helper';
import {
  buildSubSectionSearchTree,
  getSubSectionSearchSuggestions,
  getSubSectionSuggestionDropdownLayout,
  getSubSectionTreeDisplayName,
  highlightSubSectionSuggestion,
  highlightSubSectionTreeLabel,
  mergeSubSectionSearchResultPages,
  CLINICAL_PATTERN_RUBRIC_PAGE_SIZE,
  getClinicalPatternRubricId,
  mergeClinicalPatternRubricPages,
  MAX_SUBSECTION_TREE_DEPTH,
  MIN_SUBSECTION_SEARCH_LENGTH,
  normalizeClinicalPatternRubricPagedResponse,
  normalizeSubSectionSearchPagedResponse,
  SUBSECTION_SEARCH_DEBOUNCE_MS,
  SUBSECTION_SEARCH_TOP,
  SUBSECTION_SUGGESTION_DISPLAY,
  SUBSECTION_TREE_PAGE_SIZE,
} from '../../../utils/subSectionSearchUtils';
import {
  collectSubSectionIdsFromTree,
  getCachedRubricDetails,
  INITIAL_RUBRIC_PREFETCH_LIMIT,
  SCROLL_RUBRIC_PREFETCH_BATCH,
} from '../../../utils/rubricDetailsCache';
import { cancelPendingPrefetches } from '../../../utils/rubricDetailsFetchQueue';
import {
  setAllopathicDrugForDropdownLoading,
  setAllopathicDrugForDropdownList,
  setAllopathicDrugForDropdownError,
  setRubricByKeywordIdList,
  setThrepoticByDiagnosisIdList,
  setCommanUnCommanRubricsDetailsList,
  setDifferentialMateriaMedicaList,
  setEliminationDataList,
  setRepertorizarionRemedyForAccordionList,
  setRubricDetailsList,
  setRubricDetailsError,
  setRubricDetailsLoading,
  setRubricDetailsRefreshing,
  setPatientDetails,
  setAllopathicDrugForDropdownByIdList,
  setPatientLabOrderList,
  setPatientLabEntryList,
} from '../../../slices/doctor/patientdashboard/reducer';
import {
  setMateriaMedicaLoading,
  setMateriaMedicaRemediesDetails,
} from '../../../slices/admin/materiaMedica/materiaMedicaRemedies/reducer';
import {
  setQuestionKeywordBodyPart,
  setQuestionRubricData,
} from '../../../slices/admin/existancequestions/clinicalquestions/reducer';

const mapQuestionGroupFromApi = (group) => ({
  id: group?.questionGroupId ?? group?.QuestionGroupId,
  name: group?.questionGroupName ?? group?.QuestionGroupName ?? '',
});

const mapQuestionSubGroupFromApi = (subGroup) => ({
  id: subGroup?.questionSubgroupId ?? subGroup?.QuestionSubgroupId,
  name:
    subGroup?.questionSubgroup1
    ?? subGroup?.QuestionSubgroup1
    ?? subGroup?.questionSubGroupName
    ?? subGroup?.QuestionSubGroupName
    ?? '',
  sectionIds: subGroup?.sectionIds ?? subGroup?.SectionIds ?? [],
});


const thermalCircles = [
  { id: 0, label: 'N/A', color: '#9a5b5d' },
  { id: 1, label: 'Extreme Chilly', color: '#2b8db0' },
  { id: 2, label: 'Chilly', color: '#9bbdcd' },
  { id: 3, label: 'Ambithermal', color: '#343a40' },
  { id: 4, label: 'Hot', color: '#da3a39' },
  { id: 5, label: 'Extreme Hot', color: '#8b1214' }
];

const ACCORDION_PAGE_SIZE = 10;
const MODAL_SELECT_MENU_Z = 10600;
const modalSelectPortalProps = {
  menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
  menuPosition: 'fixed',
};

const normalizeAccordionRemedyId = (remedyId) => {
  const normalized = Number(remedyId);
  return Number.isFinite(normalized) ? normalized : remedyId;
};
const ADVERSE_EFFECTS_PAGE_SIZE = 8;

const MATERIA_MEDICA_HEADING_ICON_BY_ID = {
  81: 'ri-book-open-line',
  82: 'ri-stethoscope-line',
  83: 'ri-shining-2-line',
  85: 'ri-git-branch-line',
  86: 'ri-mental-health-line',
  87: 'ri-user-3-line',
  88: 'ri-eye-line',
  89: 'ri-sound-module-line',
  90: 'ri-user-smile-line',
  91: 'ri-emotion-line',
  92: 'ri-emotion-happy-line',
  93: 'ri-speak-line',
  94: 'ri-mic-line',
  95: 'ri-restaurant-line',
  96: 'ri-capsule-line',
  97: 'ri-body-scan-line',
  98: 'ri-drop-line',
  99: 'ri-water-flash-line',
  100: 'ri-men-line',
  101: 'ri-women-line',
  102: 'ri-windy-line',
  103: 'ri-heart-2-line',
  104: 'ri-heart-pulse-line',
  105: 'ri-align-vertically',
  106: 'ri-run-line',
  107: 'ri-hand-heart-line',
  108: 'ri-footprint-line',
  109: 'ri-global-line',
  110: 'ri-contrast-drop-2-line',
  111: 'ri-moon-clear-line',
  112: 'ri-temp-hot-line',
};

const MATERIA_MEDICA_HEADING_ICON_KEYWORDS = [
  ['INTRODUCTION', 'ri-book-open-line'],
  ['CLINICAL', 'ri-stethoscope-line'],
  ['CHARACTERISTIC', 'ri-shining-2-line'],
  ['CAUSATION', 'ri-git-branch-line'],
  ['MIND', 'ri-mental-health-line'],
  ['HEAD', 'ri-user-3-line'],
  ['SENSORIUM', 'ri-user-3-line'],
  ['SCALP', 'ri-user-3-line'],
  ['EYE', 'ri-eye-line'],
  ['EAR', 'ri-sound-module-line'],
  ['NOSE', 'ri-user-smile-line'],
  ['FACE', 'ri-emotion-line'],
  ['TOOTH', 'ri-emotion-happy-line'],
  ['TEETH', 'ri-emotion-happy-line'],
  ['MOUTH', 'ri-speak-line'],
  ['THROAT', 'ri-mic-line'],
  ['APPETITE', 'ri-restaurant-line'],
  ['STOMACH', 'ri-capsule-line'],
  ['ABDOMEN', 'ri-body-scan-line'],
  ['STOOL', 'ri-drop-line'],
  ['ANUS', 'ri-drop-line'],
  ['URINARY', 'ri-water-flash-line'],
  ['MALE', 'ri-men-line'],
  ['FEMALE', 'ri-women-line'],
  ['RESPIRATORY', 'ri-windy-line'],
  ['CHEST', 'ri-heart-2-line'],
  ['HEART', 'ri-heart-pulse-line'],
  ['NECK', 'ri-align-vertically'],
  ['BACK', 'ri-align-vertically'],
  ['UPPER LIMB', 'ri-hand-heart-line'],
  ['LOWER LIMB', 'ri-footprint-line'],
  ['LIMB', 'ri-run-line'],
  ['GENERAL', 'ri-global-line'],
  ['SKIN', 'ri-contrast-drop-2-line'],
  ['SLEEP', 'ri-moon-clear-line'],
  ['FEVER', 'ri-temp-hot-line'],
  ['VERTIGO', 'ri-rotate-lock-line'],
  ['VISION', 'ri-eye-2-line'],
  ['HEARING', 'ri-sound-module-line'],
  ['EXTREMIT', 'ri-run-line'],
  ['COUGH', 'ri-windy-line'],
  ['EXPECTORATION', 'ri-drop-line'],
  ['RECTUM', 'ri-drop-line'],
  ['BLADDER', 'ri-water-flash-line'],
  ['KIDNEY', 'ri-water-flash-line'],
  ['URETHRA', 'ri-water-flash-line'],
  ['URINE', 'ri-water-flash-line'],
  ['LARYNX', 'ri-mic-line'],
  ['RESPIRATION', 'ri-windy-line'],
  ['CHILL', 'ri-temp-hot-line'],
  ['PERSPIRATION', 'ri-drop-line'],
  ['GENERALIT', 'ri-global-line'],
];

const getMateriaMedicaHeadingIcon = (heading) => {
  const headingId = Number(heading?.materiaMedicaHeadId ?? heading?.materiaMedicaHeadID);
  if (Number.isFinite(headingId) && MATERIA_MEDICA_HEADING_ICON_BY_ID[headingId]) {
    return MATERIA_MEDICA_HEADING_ICON_BY_ID[headingId];
  }

  const headingName = String(
    heading?.materiaMedicaHeadName ?? heading?.headingName ?? ''
  ).trim().toUpperCase();

  if (!headingName) {
    return 'ri-file-list-3-line';
  }

  const keywordMatch = MATERIA_MEDICA_HEADING_ICON_KEYWORDS.find(([keyword]) => (
    headingName.includes(keyword)
  ));

  return keywordMatch?.[1] ?? 'ri-plant-line';
};

/** Icons for repertory SECTION names (MIND, HEAD, EYE, …). */
const getRepertorySectionIcon = (sectionName) => {
  const name = String(sectionName ?? '').trim().toUpperCase();
  if (!name) return 'ri-list-check-2';
  const keywordMatch = MATERIA_MEDICA_HEADING_ICON_KEYWORDS.find(([keyword]) => (
    name.includes(keyword)
  ));
  return keywordMatch?.[1] ?? 'ri-list-check-2';
};

/** Icons for Questions tab → QUESTION SECTION names. */
const QUESTION_SECTION_ICON_KEYWORDS = [
  ['EMOTIONAL', 'ri-emotion-line'],
  ['INTELLECTUAL', 'ri-lightbulb-line'],
  ['DELUSIONAL', 'ri-ghost-line'],
  ['PSYCHE', 'ri-mental-health-line'],
  ['BODY LANGUAGE', 'ri-body-scan-line'],
  ['GENERAL', 'ri-global-line'],
  ['PARTICULAR', 'ri-focus-3-line'],
  ['ACUTE', 'ri-flashlight-line'],
  ['PREGNANCY', 'ri-parent-line'],
  ['PAEDIATRIC', 'ri-user-smile-line'],
  ['PEDIATRIC', 'ri-user-smile-line'],
  ['FAMILY', 'ri-group-line'],
  ['PAST', 'ri-history-line'],
  ['APPEARANCE', 'ri-user-3-line'],
  ['OBSERVATION', 'ri-stethoscope-line'],
  ['EXAMINATION', 'ri-stethoscope-line'],
];

const getQuestionSectionIcon = (sectionName) => {
  const name = String(sectionName ?? '').trim().toUpperCase();
  if (!name) return 'ri-list-check-2';
  const keywordMatch = QUESTION_SECTION_ICON_KEYWORDS.find(([keyword]) => (
    name.includes(keyword)
  ));
  return keywordMatch?.[1] ?? 'ri-list-check-2';
};

/** Icons for Clinical Pattern → CLINICAL SECTION tabs. */
const CLINICAL_SECTION_ICON_BY_TAB = {
  'Symptoms': 'ri-heart-pulse-line',
  'Monogram': 'ri-fingerprint-line',
  'Causations': 'ri-git-branch-line',
  'Pathology': 'ri-virus-line',
  'Emergencies': 'ri-alarm-warning-line',
  'Onset/Duration/Progress': 'ri-time-line',
  'Patterns': 'ri-flow-chart',
  'Location/Extention': 'ri-map-pin-line',
  'Sensation': 'ri-hand-heart-line',
  'Modalities': 'ri-equalizer-line',
  'Accompanied': 'ri-links-line',
  'Observations': 'ri-eye-line',
  'Before/After/During': 'ri-exchange-line',
};

const getClinicalSectionIcon = (tabName) => (
  CLINICAL_SECTION_ICON_BY_TAB[tabName] || 'ri-list-check-2'
);

const PATIENT_BOARD_INFO_COLOR = '#25a0e2';

const patientBoardSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: undefined,
    height: undefined,
    borderRadius: '0.25rem',
    borderColor: state.isFocused ? '#25a0e2' : '#dee2e6',
    borderWidth: '1px',
    boxShadow: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    '&:hover': {
      borderColor: state.isFocused ? '#25a0e2' : '#dee2e6',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    paddingTop: 0,
    paddingBottom: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#adb5bd',
    fontSize: '13px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#212529',
    fontSize: '13px',
    fontWeight: 600,
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    fontSize: '13px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? PATIENT_BOARD_INFO_COLOR : '#868e96',
    padding: '0 10px',
    '&:hover': {
      color: PATIENT_BOARD_INFO_COLOR,
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: '#868e96',
    padding: '0 4px',
    '&:hover': {
      color: '#dc3545',
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
    overflow: 'hidden',
    zIndex: 20,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '4px',
    maxHeight: '240px',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13px',
    borderRadius: '0',
    backgroundColor: 'transparent',
    color: state.isSelected || state.isFocused ? '#25a0e2' : '#212529',
    fontWeight: state.isSelected ? 500 : 400,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'transparent',
      color: '#25a0e2',
    },
    ':active': {
      backgroundColor: 'transparent',
      color: '#25a0e2',
    },
  }),
};

const AdverseEffectColumn = ({
  variant,
  title,
  items,
  totalItems,
  hasMore,
  onLoadMore,
  search,
  onSearchChange,
  loading,
  getItemId,
  getItemName,
  emptySearchMessage,
  emptyMessage,
  searchOpen,
  onToggleSearch,
  searchDisabled = false,
}) => {
  const loadLockRef = useRef(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (loading || !hasMore) return;

    const element = listRef.current;
    if (!element) return;

    if (element.scrollHeight <= element.clientHeight + 1) {
      onLoadMore();
    }
  }, [items.length, hasMore, loading, onLoadMore]);

  const handleScroll = (event) => {
    if (!hasMore || loading) return;

    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceFromBottom > 64 || loadLockRef.current) return;

    loadLockRef.current = true;
    onLoadMore();
    window.setTimeout(() => {
      loadLockRef.current = false;
    }, 200);
  };

  return (
    <div className={`pb-ae-column pb-ae-column--${variant}`}>
      <div className="pb-ae-column-header">
        <div className="pb-ae-column-header-left">
          <i className={`ri-alert-fill pb-ae-column-icon pb-ae-column-icon--${variant}`} aria-hidden="true" />
          <span className="pb-ae-column-title">{title}</span>
          <span className="pb-ae-column-badge">{totalItems}</span>
        </div>
        <button
          type="button"
          className={`pb-ae-filter-btn${searchOpen ? ' active' : ''}`}
          onClick={() => {
            if (searchDisabled) return;
            onToggleSearch();
          }}
          disabled={searchDisabled}
          aria-label={`Filter ${title.toLowerCase()}`}
          title={searchDisabled ? 'Select a drug to search' : 'Search / filter'}
        >
          <i className="ri-filter-3-line" aria-hidden="true" />
        </button>
      </div>
      {searchOpen && (
        <div className={`pb-ae-column-search${searchDisabled ? ' pb-ae-column-search--disabled' : ''}`}>
          <div className={`search-box pb-questions-search-box${search.trim() ? ' pb-questions-search-box--active' : ''}${searchDisabled ? ' pb-questions-search-box--disabled' : ''}`}>
            <Input
              bsSize="sm"
              className="pb-questions-search-input"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              disabled={searchDisabled}
              onChange={(e) => {
                if (searchDisabled) return;
                onSearchChange(e.target.value);
              }}
            />
            <i
              className={`ri-${search.trim() ? 'search-2-line' : 'search-line'} search-icon`}
              aria-hidden="true"
            />
            {search.trim() && !searchDisabled && (
              <button
                type="button"
                className="pb-questions-search-clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
      <div ref={listRef} className="pb-ae-column-list custom-scrollbar" onScroll={handleScroll}>
        {loading ? (
          <div className="pb-ae-column-state">
            <Spinner size="sm" className="me-2" />
            Loading effects...
          </div>
        ) : items.length > 0 ? (
          <>
            {items.map((item) => (
              <div key={getItemId(item)} className="pb-ae-effect-row">
                <span className="pb-ae-effect-name">{getItemName(item)}</span>
              </div>
            ))}
            {hasMore && (
              <div className="pb-ae-scroll-hint">
                <Spinner size="sm" className="me-2" />
                Scroll for more...
              </div>
            )}
          </>
        ) : (
          <div className="pb-ae-column-state">
            {search ? emptySearchMessage : emptyMessage}
          </div>
        )}
      </div>
      <div className="pb-ae-column-footer">
        <span className="pb-ae-item-count">
          <i className="ri-information-line" aria-hidden="true" />
          Showing {items.length} of {totalItems}
        </span>
        {hasMore && (
          <span className="pb-ae-scroll-indicator">
            <i className="ri-arrow-down-s-line" aria-hidden="true" />
            Scroll for more
          </span>
        )}
      </div>
    </div>
  );
};

const SUB_SECTION_DETAILS_UNAVAILABLE = 'Data not available';

const getSubSectionLanguageDetailsText = (languageDetails, languageKey) => {
  const list = Array.isArray(languageDetails) ? languageDetails : [];
  if (!list.length) return SUB_SECTION_DETAILS_UNAVAILABLE;

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const findByLanguage = () => {
    if (languageKey === 'english') {
      return list.find(
        (item) =>
          normalize(item?.languageName).includes('english') ||
          Number(item?.languageId) === 1
      );
    }
    return list.find(
      (item) =>
        normalize(item?.languageName).includes('marathi') ||
        Number(item?.languageId) === 2
    );
  };

  const entry = findByLanguage() ?? (languageKey === 'english' ? list[0] : list[1]);
  const text = String(entry?.subSectionDetails ?? '').trim();
  return text || SUB_SECTION_DETAILS_UNAVAILABLE;
};

// Helper to calculate age in years, months, and days
const calculateAgeYMD = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    // borrow days from previous month
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  if (years < 0) return null;

  return { years, months, days };
};

const resolveRemedyLists = (rawSource) => {
  if (!rawSource) {
    return null;
  }

  const candidates = [
    rawSource,
    rawSource?.data,
    rawSource?.resultObject,
    rawSource?.data?.resultObject
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }

    const commonList = candidate.commonRemedyList;
    const uncommonList = candidate.unCommonRemedyList;

    if (Array.isArray(commonList) || Array.isArray(uncommonList)) {
      return {
        common: Array.isArray(commonList) ? commonList : [],
        uncommon: Array.isArray(uncommonList) ? uncommonList : []
      };
    }
  }

  return null;
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Format alias once as [Cham.] for common/uncommon remedy rows */
const formatRemedyAliasBracket = (alias) => {
  const raw = String(alias || '').trim();
  if (!raw) return null;
  if (raw.startsWith('[') && raw.endsWith(']')) return raw;
  const core = raw.replace(/\.$/, '');
  return `[${core}.]`;
};

/** Strip alias from remedyName when shown separately to avoid [Cham.] [Cham.] */
const getRemedyListDisplay = (remedy) => {
  const remedyName = String(remedy?.remedyName || '').trim();
  const aliasRaw = String(remedy?.remedyAlies || remedy?.remedyAlias || '').trim();
  const score = remedy?.score;

  if (!aliasRaw) {
    return { name: remedyName, aliasBracket: null, score };
  }

  const aliasCore = aliasRaw.replace(/^\[|\]$/g, '').replace(/\.$/, '').trim();
  const aliasBracket = formatRemedyAliasBracket(aliasRaw);

  let name = remedyName;
  if (aliasCore) {
    const pattern = new RegExp(
      `\\s*\\[\\s*${escapeRegExp(aliasCore)}\\s*\\.?\\s*\\]`,
      'gi'
    );
    name = remedyName.replace(pattern, '').trim();
  }

  return {
    name: name || remedyName,
    aliasBracket,
    score,
  };
};

const extractRemedyTooltipData = (remedy) => ({
  remedyId: remedy?.remedyId ?? remedy?.RemedyId ?? null,
  remedyName: remedy?.remedyName ?? remedy?.RemedyName ?? null,
  remedyAlies: remedy?.remedyAlies ?? remedy?.remedyAlias ?? remedy?.RemedyAlias ?? null,
  score: remedy?.score ?? remedy?.Score ?? null,
  themesOrCharacteristics:
    remedy?.themesOrCharacteristics ??
    remedy?.themes ??
    remedy?.ThemesOrCharacteristics ??
    null,
  generals: remedy?.generals ?? remedy?.Generals ?? null,
  modalities: remedy?.modalities ?? remedy?.Modalities ?? null,
  particulars: remedy?.particulars ?? remedy?.Particulars ?? null,
});

const mergeRemedyTooltipData = (source, fallback) => {
  const extracted = extractRemedyTooltipData(source);
  const fallbackFields = extractRemedyTooltipData(fallback);
  return {
    ...extracted,
    remedyId: extracted.remedyId ?? fallbackFields.remedyId,
    remedyName: extracted.remedyName ?? fallbackFields.remedyName,
    remedyAlies: extracted.remedyAlies ?? fallbackFields.remedyAlies,
    score: extracted.score ?? fallbackFields.score,
  };
};

const hasRemedyTooltipContent = (data) =>
  [data?.themesOrCharacteristics, data?.generals, data?.modalities, data?.particulars].some(
    (value) => value != null && String(value).trim() !== ''
  );

/** Display alias as Nat-m. / Puls. — not NAT-M. / PULS. (grade styling keeps color/bold only) */
const formatRemedyAliasForDisplay = (alias) => {
  const raw = String(alias || '').trim();
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
};

const extractAccordionEntries = (rawSource) => {
  if (!rawSource) {
    return [];
  }

  if (Array.isArray(rawSource)) {
    return rawSource;
  }

  const candidateArrays = [
    rawSource?.resultObject,
    rawSource?.data,
    rawSource?.data?.resultObject,
    rawSource?.data?.data,
    rawSource?.rows,
    rawSource?.items,
  ];

  for (const candidate of candidateArrays) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  const nestedSources = [rawSource?.resultObject, rawSource?.data?.resultObject, rawSource?.data];
  for (const nested of nestedSources) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      continue;
    }
    const nestedArrays = [
      nested.items,
      nested.list,
      nested.records,
      nested.rows,
      nested.data,
      nested.remedyList,
      nested.rubricList,
      nested.subSectionList,
    ];
    for (const candidate of nestedArrays) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
};

const resolveAccordionSectionLabel = (entry) => {
  const candidateKeys = [
    'sectionName',
    'section',
    'sectionShortName',
    'sectionLabel',
    'sectionTitle',
    'sectionHeading',
    'sectionHead',
    'sectionCategory',
    'sectionGroupName',
    'categoryName',
    'category',
    'groupName',
    'group'
  ];

  for (const key of candidateKeys) {
    const value = entry?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  if (entry?.section && typeof entry.section === 'string' && entry.section.trim()) {
    return entry.section.trim();
  }

  if (entry?.section && typeof entry.section === 'object') {
    const nestedLabel = entry.section.name || entry.section.label || entry.section.title;
    if (typeof nestedLabel === 'string' && nestedLabel.trim()) {
      return nestedLabel.trim();
    }
  }

  return 'Others';
};

const filterAccordionEntries = (entries, selectedSections) => {
  if (!Array.isArray(entries)) {
    return [];
  }
  if (!selectedSections || selectedSections.size === 0) {
    return entries;
  }
  return entries.filter(entry => selectedSections.has(resolveAccordionSectionLabel(entry)));
};

const getAccordionEntrySectionId = (entry) => {
  const sectionId = Number(entry?.sectionId ?? entry?.SectionId);
  return Number.isFinite(sectionId) ? sectionId : null;
};

const getAccordionEntryGradeId = (entry) => {
  const gradeId = Number(entry?.gradeId ?? entry?.GradeId);
  return Number.isFinite(gradeId) ? gradeId : null;
};

/** UI grade button 1 maps to API gradeId 5; 2/3/4 map to the same gradeId. */
const mapRepertorizeIntensityToGradeId = (intensityNo) => {
  if (intensityNo == null) {
    return null;
  }
  const intensity = Number(intensityNo);
  if (!Number.isFinite(intensity)) {
    return null;
  }
  if (intensity === 1) {
    return 5;
  }
  return intensity;
};

const filterAccordionEntriesByRepertorizePanel = (entries, sectionIds, gradeId) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  let filtered = entries;
  if (sectionIds?.length > 0) {
    const sectionIdSet = new Set(sectionIds.map(Number));
    filtered = filtered.filter((entry) => {
      const entrySectionId = getAccordionEntrySectionId(entry);
      return entrySectionId != null && sectionIdSet.has(entrySectionId);
    });
  }

  if (gradeId != null) {
    const normalizedGradeId = Number(gradeId);
    filtered = filtered.filter((entry) => getAccordionEntryGradeId(entry) === normalizedGradeId);
  }

  return filtered;
};

const getAccordionEntryLabel = (entry) =>
  entry?.subSectionName || entry?.rubricName || entry?.subsectionName || entry?.name || "";

const filterAccordionEntriesBySearch = (entries, searchTerm) => {
  if (!Array.isArray(entries)) {
    return [];
  }
  const term = (searchTerm || "").trim().toLowerCase();
  if (!term) {
    return entries;
  }
  return entries.filter((entry) =>
    getAccordionEntryLabel(entry).toLowerCase().includes(term)
  );
};

const getAccordionFilteredEntriesFromState = (state, globalFilters = null) => {
  if (!state) {
    return [];
  }

  const sectionIds = globalFilters?.sectionIds ?? [];
  const gradeId = globalFilters?.gradeId ?? null;
  const useGlobalFilters = sectionIds.length > 0 || gradeId != null;

  const bySection = useGlobalFilters
    ? filterAccordionEntriesByRepertorizePanel(state.entries, sectionIds, gradeId)
    : filterAccordionEntries(state.entries, state.selectedSections);

  return filterAccordionEntriesBySearch(bySection, state.searchTerm);
};

const extractAccordionPaginationMeta = (rawSource) => {
  if (!rawSource || typeof rawSource !== "object") {
    return { totalCount: null, pageNumber: 1, pageSize: ACCORDION_PAGE_SIZE };
  }

  const totalCount =
    rawSource.totalCount ??
    rawSource.totalRecords ??
    rawSource.recordCount ??
    rawSource.data?.totalCount ??
    rawSource.resultObject?.totalCount ??
    null;

  const pageNumber =
    rawSource.pageNumber ??
    rawSource.currentPage ??
    rawSource.pageNo ??
    1;

  const pageSize = rawSource.pageSize ?? ACCORDION_PAGE_SIZE;

  return {
    totalCount: totalCount != null ? Number(totalCount) : null,
    pageNumber: Number(pageNumber) || 1,
    pageSize: Number(pageSize) || ACCORDION_PAGE_SIZE,
  };
};

const computeAccordionHasMoreServer = (state) => {
  if (!state || state.reachedEndOfServer) {
    return false;
  }

  const totalCount = state.totalCount != null ? Number(state.totalCount) : null;
  if (totalCount != null && state.entries.length >= totalCount) {
    return false;
  }

  if (totalCount != null) {
    return state.entries.length < totalCount;
  }

  return Boolean(state.lastPageFull);
};

const getAccordionSublistView = (state, globalFilters = null) => {
  if (!state) {
    return {
      filteredEntries: [],
      visibleEntries: [],
      totalLoadedCount: 0,
      hasMoreEntries: false,
      isAtEnd: false,
    };
  }

  const filteredEntries = getAccordionFilteredEntriesFromState(state, globalFilters);
  const visibleEntries = filteredEntries.slice(0, state.visibleCount);
  const hasMoreClient = state.visibleCount < filteredEntries.length;
  const hasMoreServer = computeAccordionHasMoreServer(state);
  const hasMoreEntries = hasMoreClient || hasMoreServer;
  const totalLoadedCount = state.entries?.length ?? 0;

  return {
    filteredEntries,
    visibleEntries,
    totalLoadedCount,
    hasMoreEntries,
    isAtEnd: totalLoadedCount > 0 && !hasMoreEntries,
  };
};

const mergeAccordionEntries = (existing, incoming) => {
  const seen = new Set();
  const merged = [];

  [...(existing || []), ...(incoming || [])].forEach((entry) => {
    const id = entry?.rubricId ?? entry?.subSectionId ?? entry?.subsectionId ?? entry?.id;
    const key = id != null ? `id:${id}` : `label:${getAccordionEntryLabel(entry)}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(entry);
  });

  return merged;
};

const mapAccordionEntryToRubricData = (item) => {
  const rubricId =
    item?.subSectionId ?? item?.subsectionId ?? item?.rubricId ?? item?.id ?? null;
  const rubricName =
    item?.subSectionName || item?.rubricName || item?.subsectionName || item?.name || "";

  return {
    rubricId,
    rubricName,
    subSectionId: rubricId,
    subSectionName: rubricName,
    remedyCount: item?.remedyCount ?? item?.remedyCountForSort ?? 0,
  };
};

const buildAccordionStateObject = (rawResponse, previousState = null, options = {}) => {
  const { append = false } = options;
  const newEntries = extractAccordionEntries(rawResponse);
  const meta = extractAccordionPaginationMeta(rawResponse);
  const entries =
    append && previousState?.entries
      ? mergeAccordionEntries(previousState.entries, newEntries)
      : newEntries;

  const sectionCounts = new Map();
  entries.forEach((entry) => {
    const label = resolveAccordionSectionLabel(entry);
    sectionCounts.set(label, (sectionCounts.get(label) || 0) + 1);
  });

  const availableSections = Array.from(sectionCounts.entries())
    .map(([label, count]) => ({
      value: label,
      label,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const previousSelected = previousState?.selectedSections ?? new Set();
  const normalizedSelected = new Set(
    Array.from(previousSelected).filter((section) => sectionCounts.has(section))
  );

  const searchTerm = previousState?.searchTerm ?? "";
  const filteredEntries = getAccordionFilteredEntriesFromState({
    entries,
    selectedSections: normalizedSelected,
    searchTerm,
  });

  const pageNumber = append ? meta.pageNumber : meta.pageNumber || 1;
  const pageSize = meta.pageSize || ACCORDION_PAGE_SIZE;
  const previousEntriesLength = append ? (previousState?.entries?.length ?? 0) : 0;
  const gainedCount = append ? entries.length - previousEntriesLength : newEntries.length;
  const lastPageFull = newEntries.length >= pageSize;

  let totalCount = meta.totalCount != null ? Number(meta.totalCount) : null;
  if (totalCount == null && append) {
    totalCount = previousState?.totalCount ?? null;
  }
  if (totalCount == null && !append) {
    totalCount = entries.length;
  }

  let reachedEndOfServer = append ? Boolean(previousState?.reachedEndOfServer) : false;
  if (!append) {
    reachedEndOfServer = newEntries.length < pageSize;
  } else if (gainedCount === 0 || newEntries.length < pageSize) {
    reachedEndOfServer = true;
  }
  if (totalCount != null && entries.length >= totalCount) {
    reachedEndOfServer = true;
  }

  let visibleCount;
  if (reachedEndOfServer) {
    visibleCount = filteredEntries.length;
  } else if (append) {
    visibleCount = Math.min(
      filteredEntries.length,
      (previousState?.visibleCount ?? ACCORDION_PAGE_SIZE) + ACCORDION_PAGE_SIZE
    );
  } else {
    visibleCount = Math.min(
      filteredEntries.length,
      Math.max(previousState?.visibleCount ?? ACCORDION_PAGE_SIZE, ACCORDION_PAGE_SIZE)
    );
  }

  return {
    raw: rawResponse,
    entries,
    availableSections,
    selectedSections: normalizedSelected,
    searchTerm,
    visibleCount,
    pageNumber,
    pageSize,
    totalCount,
    lastPageFull,
    reachedEndOfServer,
  };
};



const PatientBoard = () => {
  document.title = pageTitle('Patient Board');

  const [questionSearch, setQuestionSearch] = useState('');
  const [rubricSearch, setRubricSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Repertory');
  const [activePerticular, setActivePerticular] = useState(null);
  const [activeKeywordTab, setActiveKeywordTab] = useState(null);
  const [differentialMainTab, setDifferentialMainTab] = useState('COMMON');
  const [selectedDifferentialAuthorId, setSelectedDifferentialAuthorId] = useState(null);
  const [differentialSearchTerm, setDifferentialSearchTerm] = useState('');
  const [commonRemediesSearchTerm, setCommonRemediesSearchTerm] = useState('');
  const [uncommonRemediesSearchTerm, setUncommonRemediesSearchTerm] = useState('');

  // ###### Dj UI Code Start - Pyramid Icon Toggle State ######
  const [filledPyramidIcons, setFilledPyramidIcons] = useState(new Set());
  // ###### Dj UI Code End - Pyramid Icon Toggle State ######
  // ###### Dj UI Code Start - Keynote Method and Small Rubrics Toggle States ######
  const [isKeynoteMethodActive, setIsKeynoteMethodActive] = useState(false);
  const [isSmallRubricsActive, setIsSmallRubricsActive] = useState(false);
  const [expandedCommonItems, setExpandedCommonItems] = useState(new Set());
  const [expandedUncommonItems, setExpandedUncommonItems] = useState(new Set());
  const [accordionDataMap, setAccordionDataMap] = useState(new Map()); // Store accordion data per remedy
  const [lastRequestedRemedyId, setLastRequestedRemedyId] = useState(null); // Track last requested remedy for storing response
  const [accordionLoadingMoreRemedyId, setAccordionLoadingMoreRemedyId] = useState(null);
  const lastAccordionRequestRef = useRef({ remedyId: null, pageNumber: 1, append: false });
  const accordionSearchDebounceRef = useRef(null);
  // ###### Dj UI Code End - Keynote Method and Small Rubrics Toggle States ######

  // Repertorize SECTION column: filter COMMON / UNCOMMON by section + intensity
  const [selectedRepertorizeSectionIds, setSelectedRepertorizeSectionIds] = useState([]);
  const [selectedRepertorizeIntensity, setSelectedRepertorizeIntensity] = useState(null);
  const isRestoringPatientBoardSessionRef = useRef(false);
  const sessionAfterRestoreRef = useRef(null);
  const skipPatientSessionPersistRef = useRef(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activePatientSessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
  const sessionAccessCheckedRef = useRef(false);
  const allopathicDrugForDropdown = useSelector((state) => state?.PatientDashboard?.allopathicDrugForDropdownList);
  const allopathicDrugForDropdownByIdList = useSelector((state) => state?.PatientDashboard?.allopathicDrugForDropdownByIdList);
  const allopathicDrugForDropdownLoading = useSelector((state) => state?.PatientDashboard?.allopathicDrugForDropdownLoading);
  const allopathicDrugForDropdownError = useSelector((state) => state?.PatientDashboard?.allopathicDrugForDropdownError);
  const drugDetails = useSelector((state) => state?.PatientDashboard?.drugDetails);
  const drugDetailsLoading = useSelector((state) => state?.PatientDashboard?.drugDetailsLoading);
  const remedyDDLList = useSelector((state) => state?.PatientDashboard?.remedyDDLList);
  const remedyDDLLoading = useSelector((state) => state?.PatientDashboard?.remedyDDLLoading);
  const authorDDLList = useSelector((state) => state?.PatientDashboard?.authorDDLList);
  const authorDDLLoading = useSelector((state) => state?.PatientDashboard?.authorDDLLoading);
  const materiaMedicaDetails = useSelector((state) => state?.MateriaMedicaRemedy?.materiaMedicaRemediesDetails);
  const materiaMedicaDetailsLoading = useSelector((state) => state?.MateriaMedicaRemedy?.materiaMedicaRemediesLoading);
  const materiaMedicaAuthorsFromRemedy = useSelector((state) => state?.MateriaMedicaRemedy?.materiaMedicaAuthors);
  const materiaMedicaAuthorsFromAdmin = useSelector((state) => state?.MateriaMedica?.materiaMedicaAuthors);
  const differentialMateriaMedicaList = useSelector((state) => state?.PatientDashboard?.differentialMateriaMedicaList);
  const differentialMateriaMedicaLoading = useSelector((state) => state?.PatientDashboard?.differentialMateriaMedicaLoading);
  const materiaMedicaHeadingByAuthorIdList = useSelector((state) => state?.PatientDashboard?.materiaMedicaHeadingByAuthorIdList);
  const materiaMedicaHeadingByAuthorIdLoading = useSelector((state) => state?.PatientDashboard?.materiaMedicaHeadingByAuthorIdLoading);
  const diagnosisForClinicalPatternList = useSelector((state) => state?.DiagnosisTherapeutics?.diagnosisListForClinicalPattern);
  const diagnosisForClinicalPatternLoading = useSelector((state) => state?.DiagnosisTherapeutics?.diagnosisTherapeuticsLoading);
  const rubricDetailsList = useSelector((state) => state?.PatientDashboard?.rubricDetailsList);
  const rubricDetailsLoading = useSelector((state) => state?.PatientDashboard?.rubricDetailsLoading);
  const rubricDetailsRefreshing = useSelector((state) => state?.PatientDashboard?.rubricDetailsRefreshing);
  const rubricByKeywordIdList = useSelector((state) => state?.PatientDashboard?.rubricByKeywordIdList);
  const rubricByKeywordIdLoading = useSelector((state) => state?.PatientDashboard?.rubricByKeywordIdLoading);
  const diagnosisKeywordByTabLoading = useSelector((state) => state?.PatientDashboard?.diagnosisKeywordByTabLoading);
  const threpoticByDiagnosisId = useSelector((state) => state?.PatientDashboard?.threpoticByDiagnosisIdList);
  const threpoticByDiagnosisIdLoading = useSelector((state) => state?.PatientDashboard?.threpoticByDiagnosisIdLoading);
  const sectionList = useSelector((state) => state?.Section?.sectionList);
  const sectionLoading = useSelector((state) => state?.Section?.sectionLoading);
  const subSectionList = useSelector((state) => state?.SubSection?.subSectionList);
  const subSectionLoading = useSelector((state) => state?.SubSection?.subSectionLoading);
  const questionSectionDDL = useSelector((state) => state?.ClinicalQuestions?.questionSectionDDL);
  const questionGroupByExistanceId = useSelector((state) => state?.ClinicalQuestions?.questionGroupByExistanceId);
  const questionSubSectionDDLByQGIDQSID = useSelector((state) => state?.ClinicalQuestions?.questionSubSectionDDLByQGIDQSID);
  const questionsSectionLoading = useSelector((state) => state?.ClinicalQuestions?.questionsLoading);
  const questionKeywordBodyPart = useSelector((state) => state?.ClinicalQuestions?.questionKeywordBodyPart);
  const intensitiesForPatientList = useSelector((state) => state?.PatientDashboard?.intensitiesForPatientList);
  const commanUnCommanRubricsDetailsList = useSelector((state) => state?.PatientDashboard?.commanUnCommanRubricsDetailsList);
  const commanUnCommanRubricsDetailsLoading = useSelector((state) => state?.PatientDashboard?.commanUnCommanRubricsDetailsLoading);
  const remedyCountsList = useSelector((state) => state?.PatientDashboard?.remedyCountsList);
  const repertorizarionRemedyForAccordionList = useSelector((state) => state?.PatientDashboard?.repertorizarionRemedyForAccordionList);
  const repertorizarionRemedyForAccordionLoading = useSelector((state) => state?.PatientDashboard?.repertorizarionRemedyForAccordionLoading);
  const eliminationDataList = useSelector((state) => state?.PatientDashboard?.eliminationDataList);
  const eliminationDataLoading = useSelector((state) => state?.PatientDashboard?.eliminationDataLoading);
  const patientLabTestDDLList = useSelector((state) => state?.PatientDashboard?.patientLabTestDDLList);
  const patientLabTestDDLLoading = useSelector((state) => state?.PatientDashboard?.patientLabTestDDLLoading);
  const patientLabOrderLoading = useSelector((state) => state?.PatientDashboard?.patientLabOrderLoading);
  const patientLabEntryLoading = useSelector((state) => state?.PatientDashboard?.patientLabEntryLoading);
  const appointmentHistoryNoteLoading = useSelector((state) => state?.PatientDashboard?.appointmentHistoryNoteLoading);
  const prescriptionRemedyList = useSelector((state) => state?.PatientDashboard?.prescriptionRemedyList);
  const prescriptionRemedyLoading = useSelector((state) => state?.PatientDashboard?.prescriptionRemedyLoading);
  const patientDetails = useSelector((state) => state?.PatientDashboard?.patientDetails);
  const patientDetailsLoading = useSelector((state) => state?.PatientDashboard?.patientDetailsLoading);

  // Get patientId and caseId (and legacy patientAppId) from URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const caseId = searchParams.get('caseId');
  const patientAppId = searchParams.get('patientAppId');
  const appointmentDateParam = searchParams.get('appointmentDate');
  const patientNameParam = searchParams.get('patientName');
  const caseTakingMode = searchParams.get('caseTakingMode');
  const caseTakingOrigin = searchParams.get('caseTakingOrigin');
  const showAudioCasePanel = caseTakingMode === 'audio';

  const [audioCaseSessionId, setAudioCaseSessionId] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState(null);
  const [audioConversationMessages, setAudioConversationMessages] = useState([]);
  const [audioSummary, setAudioSummary] = useState(null);
  const [audioSuggestedRubrics, setAudioSuggestedRubrics] = useState([]);
  const [audioCaseStatus, setAudioCaseStatus] = useState('idle');

  const handleOpenRepertorizeFromAudio = useCallback(() => {
    setActiveTab('Repertorize');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('caseTakingMode');
    nextParams.set('caseTakingOrigin', 'audio');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleReturnToAudioCaseTaking = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('caseTakingMode', 'audio');
    nextParams.set('caseTakingOrigin', 'audio');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleAudioAnalysisStateChange = useCallback((nextState = {}) => {
    setAudioCaseSessionId(nextState.sessionId ?? null);
    setAudioSource(nextState.audioSource ?? null);
    setAudioTranscript(nextState.transcript ?? null);
    setAudioConversationMessages(Array.isArray(nextState.messages) ? nextState.messages : []);
    setAudioSummary(nextState.summary ?? null);
    setAudioSuggestedRubrics(Array.isArray(nextState.suggestedRubrics) ? nextState.suggestedRubrics : []);
    setAudioCaseStatus(nextState.status ?? 'idle');
  }, []);

  const handleAppendAudioSummaryToHistoryNote = useCallback((summary) => {
    const noteText = buildSummaryHistoryNoteText(summary);
    if (!noteText) {
      return;
    }
    setHistoryNoteContent((prev) => {
      const currentText = prev.getCurrentContent().getPlainText();
      const separator = currentText.trim() ? '\n\n' : '';
      const contentState = ContentState.createFromText(`${currentText}${separator}${noteText}`);
      return EditorState.createWithContent(contentState);
    });
  }, []);

  const currentPatientKey = useMemo(
    () => buildPatientBoardKey({ patientId, caseId, patientAppId }),
    [patientId, caseId, patientAppId]
  );

  const resolvedPatientName = useMemo(() => {
    const detailsPatientId = patientDetails?.patientID ?? patientDetails?.patientId ?? patientDetails?.PatientId;
    const detailsName = patientDetails?.patientName;
    if (
      detailsName
      && patientId
      && detailsPatientId != null
      && String(detailsPatientId) === String(patientId)
    ) {
      return detailsName;
    }
    return patientNameParam || '';
  }, [patientDetails, patientId, patientNameParam]);

  useEffect(() => {
    dispatch(setPatientDetails(null));
    dispatch(setAllopathicDrugForDropdownByIdList(null));
  }, [currentPatientKey, dispatch]);

  useEffect(() => {
    if (sessionAccessCheckedRef.current || !currentPatientKey) {
      return;
    }
    sessionAccessCheckedRef.current = true;
    const access = canOpenPatientSession(activePatientSessions, currentPatientKey);
    if (!access.allowed) {
      showPatientSessionLimitAlert(access.activeSessions);
      navigate(getHomeDashboardPath());
    }
  }, [activePatientSessions, currentPatientKey, navigate]);

  const formattedAppointmentDate = useMemo(() => {
    if (!appointmentDateParam) return '';
    const parsed = String(appointmentDateParam).includes('T')
      ? moment.utc(appointmentDateParam)
      : moment(appointmentDateParam, ['YYYY-MM-DD', 'DD-MM-YYYY', 'D-M-YYYY'], true);
    return parsed.isValid() ? parsed.format('Do MMMM, YYYY') : '';
  }, [appointmentDateParam]);

  const eliminationRemedyData = useMemo(() => resolveRemedyLists(eliminationDataList), [eliminationDataList]);
  const baseRemedyData = useMemo(() => resolveRemedyLists(commanUnCommanRubricsDetailsList), [commanUnCommanRubricsDetailsList]);
  const effectiveRemedyData = useMemo(() => {
    if (eliminationRemedyData) {
      return eliminationRemedyData;
    }
    if (baseRemedyData) {
      return baseRemedyData;
    }
    return { common: [], uncommon: [] };
  }, [baseRemedyData, eliminationRemedyData]);
  const isRemedyDataLoading = commanUnCommanRubricsDetailsLoading || eliminationDataLoading;

  // State declarations
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  // Fetch patient header details
  useEffect(() => {
    if (patientId && caseId) {
      dispatch(getPatientDetails({ patientId: patientId, caseId: caseId }));
    }
  }, [dispatch, patientId, caseId]);

  const buildRemedyIndexModelList = (remedies = []) => {
    if (!Array.isArray(remedies)) {
      return [];
    }

    return remedies
      .map((element, idx) => {
        const resolvedRemedyId = Number(element?.remedyId ?? element?.id);
        if (!Number.isFinite(resolvedRemedyId)) {
          return null;
        }

        const resolvedIndex = Number(
          element?.index ??
          element?.remedyIndex ??
          element?.rank ??
          element?.remedyRank ??
          element?.sequence ??
          idx + 1
        );

        const resolvedScore = element?.score ?? element?.final ?? element?.totalScore ?? element?.finalScore ?? null;

        return {
          remedyId: resolvedRemedyId,
          index: Number.isFinite(resolvedIndex) ? resolvedIndex : idx + 1,
          score: resolvedScore
        };
      })
      .filter(Boolean);
  };

  useEffect(() => {
    dispatch(getAllopathicDrugForDropdown());
    dispatch(getRemedyDDLForPatient());
    dispatch(getAuthorDDLForPatient());
    dispatch(getAuthorsForMateriaMedicaDDL());
    dispatch(getDiagnosisForClinicalPatternList());
  }, [dispatch]);

  const materiaMedicaAuthors = useMemo(() => {
    const candidateSources = [
      materiaMedicaAuthorsFromRemedy,
      materiaMedicaAuthorsFromAdmin,
    ];

    for (const source of candidateSources) {
      if (!source) {
        continue;
      }

      if (Array.isArray(source) && source.length > 0) {
        return source;
      }

      if (Array.isArray(source?.data) && source.data.length > 0) {
        return source.data;
      }

      if (Array.isArray(source?.resultObject) && source.resultObject.length > 0) {
        return source.resultObject;
      }

      if (Array.isArray(source?.data?.resultObject) && source.data.resultObject.length > 0) {
        return source.data.resultObject;
      }
    }

    return [];
  }, [materiaMedicaAuthorsFromRemedy, materiaMedicaAuthorsFromAdmin]);

  useEffect(() => {
    if (!materiaMedicaAuthors || materiaMedicaAuthors.length === 0) {
      return;
    }

    if (!selectedDifferentialAuthorId) {
      setSelectedDifferentialAuthorId(materiaMedicaAuthors[0]?.authorId ?? null);
      return;
    }

    const authorExists = materiaMedicaAuthors.some(author => author?.authorId === selectedDifferentialAuthorId);
    if (!authorExists) {
      setSelectedDifferentialAuthorId(materiaMedicaAuthors[0]?.authorId ?? null);
    }
  }, [materiaMedicaAuthors, selectedDifferentialAuthorId]);

  useEffect(() => {
    if (!selectedDifferentialAuthorId) {
      return;
    }

    dispatch(getMateriaMedicaHeadingByAuthorId({ authorId: selectedDifferentialAuthorId }));
  }, [dispatch, selectedDifferentialAuthorId]);

  // Call getMateriaMedicaRemediesDetails when both remedy and author are selected
  useEffect(() => {
    if (selectedRemedy && selectedAuthor) {
      console.log(selectedRemedy.value, selectedAuthor.value);
      dispatch(getMateriaMedicaRemediesDetails({
        remedyId: selectedRemedy.value || 0,
        authorId: selectedAuthor.value || 0,
      }));
    }
  }, [selectedRemedy, selectedAuthor, dispatch]);

  // Call getIntensitiesForPatient when Clinical Pattern tab is active
  useEffect(() => {
    //if (activeTab === 'Clinical Pattern') {
    dispatch(getIntensitiesForPatient());
    //}
  }, [activeTab, dispatch]);

  // Call getQuestionSectionDll when Questions tab is active
  useEffect(() => {
    if (activeTab === 'Questions') {
      dispatch(getQuestionSectionDll());
    }
  }, [activeTab, dispatch]);

  // Clinical Pattern particulars row (legacy shared Redux source)
  const questions = useMemo(() => {
    if (questionKeywordBodyPart && Array.isArray(questionKeywordBodyPart) && questionKeywordBodyPart.length > 0) {
      return questionKeywordBodyPart.map((item) => ({
        value: item.questionKeyWordBodyPartID,
        label: item.questionKeyWordBodyPart,
        bodyPartID: item.bodyPartID,
      }));
    }
    return [];
  }, [questionKeywordBodyPart]);

  const [activeQuestion, setActiveQuestion] = useState(null);

  // Keyword tabs array
  const keywordTabs = [
    'Symptoms',
    'Monogram',
    'Causations',
    'Pathology',
    'Emergencies',
    'Onset/Duration/Progress',
    'Patterns',
    'Location/Extention',
    'Sensation',
    'Modalities',
    'Accompanied',
    'Observations',
    'Before/After/During'
  ];

  // Create remedy options from real API data
  const remedyOptions = useMemo(() => {
    if (!remedyDDLList || !Array.isArray(remedyDDLList)) {
      return [];
    }
    return remedyDDLList.map((remedy) => ({
      value: remedy.remedyId || remedy.id,
      label: remedy.remedyName || remedy.name || ''
    }));
  }, [remedyDDLList]);

  // Create author options from real API data
  const authorOptions = useMemo(() => {
    if (!authorDDLList || !Array.isArray(authorDDLList)) {
      return [];
    }
    return authorDDLList.map((author) => ({
      value: author.authorId || author.id,
      label: author.authorName?.trim() || ''
    }));
  }, [authorDDLList]);

  // Create lab test options from real API data
  const labTestOptions = useMemo(() => {
    if (!patientLabTestDDLList || !Array.isArray(patientLabTestDDLList)) {
      return [];
    }
    return patientLabTestDDLList.map((labTest) => ({
      value: labTest.patientLabTestId,
      label: labTest.labTestName || ''
    }));
  }, [patientLabTestDDLList]);

  const [selectedDifferentialHeadingId, setSelectedDifferentialHeadingId] = useState(null);
  const [selectedMateriaMedicaHeadingId, setSelectedMateriaMedicaHeadingId] = useState(null);
  const [mmTabHeadings, setMmTabHeadings] = useState([]);
  const [mmTabHeadingsLoading, setMmTabHeadingsLoading] = useState(false);
  const mmContentScrollRef = useRef(null);

  useEffect(() => {
    setSelectedMateriaMedicaHeadingId(null);
    if (mmContentScrollRef.current) {
      mmContentScrollRef.current.scrollTo({ top: 0 });
    }
  }, [selectedRemedy, selectedAuthor]);

  const materiaMedicaHeadingItems = useMemo(() => {
    if (!materiaMedicaHeadingByAuthorIdList) {
      return [];
    }

    if (Array.isArray(materiaMedicaHeadingByAuthorIdList)) {
      return materiaMedicaHeadingByAuthorIdList;
    }

    if (Array.isArray(materiaMedicaHeadingByAuthorIdList?.resultObject)) {
      return materiaMedicaHeadingByAuthorIdList.resultObject;
    }

    return [];
  }, [materiaMedicaHeadingByAuthorIdList]);

  // Materia Medica tab: load HEADINGS only when Author is selected; reload on author change
  useEffect(() => {
    if (activeTab !== 'Materia Medica') {
      return;
    }

    const authorId = selectedAuthor?.value ?? null;
    if (!authorId) {
      setMmTabHeadings([]);
      setMmTabHeadingsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadMmTabHeadings = async () => {
      setMmTabHeadingsLoading(true);
      try {
        const response = await getMateriaMedicaHeadingByAuthorIdApi({ authorId });
        if (isCancelled) {
          return;
        }

        const items = Array.isArray(response)
          ? response
          : (Array.isArray(response?.resultObject) ? response.resultObject : []);
        setMmTabHeadings(items);
      } catch (error) {
        if (!isCancelled) {
          setMmTabHeadings([]);
        }
      } finally {
        if (!isCancelled) {
          setMmTabHeadingsLoading(false);
        }
      }
    };

    loadMmTabHeadings();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, selectedAuthor]);

  const filteredMateriaMedicaHeadingItems = useMemo(() => {
    if (!Array.isArray(materiaMedicaHeadingItems) || materiaMedicaHeadingItems.length === 0) {
      return [];
    }

    if (selectedDifferentialAuthorId === null || selectedDifferentialAuthorId === undefined || selectedDifferentialAuthorId === '') {
      return materiaMedicaHeadingItems;
    }

    const normalizedSelectedAuthorId = String(selectedDifferentialAuthorId).trim();

    const getCandidateAuthorIds = (heading) => {
      if (!heading || typeof heading !== 'object') {
        return [];
      }

      const candidates = [
        heading.authorId,
        heading.authorID,
        heading.materiaMedicaAuthorId,
        heading.materiaMedicaAuthorID,
        heading?.author?.authorId,
        heading?.author?.authorID,
        heading?.authorDetails?.authorId,
        heading?.authorDetails?.authorID
      ];

      return candidates
        .map((candidate) => {
          if (candidate === null || candidate === undefined) {
            return null;
          }

          const stringValue = String(candidate).trim();
          return stringValue.length > 0 ? stringValue : null;
        })
        .filter(Boolean);
    };

    return materiaMedicaHeadingItems.filter((heading) => {
      const candidateAuthorIds = getCandidateAuthorIds(heading);

      if (candidateAuthorIds.length === 0) {
        // If the API response does not include author identifiers, keep the item by default.
        return true;
      }

      return candidateAuthorIds.some((candidate) => candidate === normalizedSelectedAuthorId);
    });
  }, [materiaMedicaHeadingItems, selectedDifferentialAuthorId]);

  useEffect(() => {
    if (!Array.isArray(filteredMateriaMedicaHeadingItems) || filteredMateriaMedicaHeadingItems.length === 0) {
      setSelectedDifferentialHeadingId(null);
      return;
    }

    const normalizedSelectedId = Number(selectedDifferentialHeadingId);
    const hasSelectedHeading = filteredMateriaMedicaHeadingItems.some((heading) => {
      const headingId = Number(heading?.materiaMedicaHeadId ?? heading?.materiaMedicaHeadID);
      return Number.isFinite(headingId) && headingId === normalizedSelectedId;
    });

    if (hasSelectedHeading) {
      return;
    }

    const fallbackHeading = filteredMateriaMedicaHeadingItems.find((heading) => heading?.differentialMM)
      ?? filteredMateriaMedicaHeadingItems[0];

    const fallbackHeadingId = Number(fallbackHeading?.materiaMedicaHeadId ?? fallbackHeading?.materiaMedicaHeadID);

    if (Number.isFinite(fallbackHeadingId)) {
      setSelectedDifferentialHeadingId(fallbackHeadingId);
    } else {
      setSelectedDifferentialHeadingId(null);
    }
  }, [filteredMateriaMedicaHeadingItems, selectedDifferentialHeadingId]);

  const differentialMateriaMedicaHeadIds = useMemo(() => {
    if (Number.isFinite(Number(selectedDifferentialHeadingId))) {
      return [Number(selectedDifferentialHeadingId)];
    }

    return filteredMateriaMedicaHeadingItems
      .filter((item) => item?.differentialMM)
      .map((item) => Number(item?.materiaMedicaHeadId ?? item?.materiaMedicaHeadID))
      .filter((id) => Number.isFinite(id));
  }, [filteredMateriaMedicaHeadingItems, selectedDifferentialHeadingId]);

  const handleDifferentialHeadingSelect = useCallback((headingId) => {
    if (!Number.isFinite(headingId)) {
      setSelectedDifferentialHeadingId(null);
      return;
    }

    setSelectedDifferentialHeadingId(headingId);
  }, []);

  // Sort intensities in descending order by intensityNo and render chips
  const renderIntensityChips = (rubricData, onChipClick, currentIntensity) => {
    if (!intensitiesForPatientList || !Array.isArray(intensitiesForPatientList)) {
      return null;
    }

    const sortedIntensities = [...intensitiesForPatientList].sort((a, b) => b.intensityNo - a.intensityNo);

    return (
      <>
        {sortedIntensities.map((intensity) => {
          const isSelected = currentIntensity && intensity.intensityNo === currentIntensity.intensityNo;
          return (
            <span
              key={intensity.intensityId}
              className="pb-chip"
              style={{
                backgroundColor: isSelected ? '#000000' : undefined,
                color: isSelected ? 'white' : undefined
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onChipClick && rubricData) {
                  onChipClick(rubricData, intensity);
                }
              }}
            >
              {intensity.intensityNo}
            </span>
          );
        })}
      </>
    );
  };

  /** Repertory subsection list only: hover chips + green grade after add to repertorize */
  const renderRepertorySubSectionIntensityChips = (item) => {
    if (!intensitiesForPatientList || !Array.isArray(intensitiesForPatientList)) {
      return null;
    }

    const rubricData = {
      subSectionId: item.subSectionId,
      subSectionName: item.subSectionName,
      rubricId: item.subSectionId,
      rubricName: item.subSectionName,
    };

    const repertorized = repertorizationRubrics.find(
      (r) => String(r.rubricId ?? r.subsectionId ?? r.subSectionId) === String(item.subSectionId)
    );
    const activeIntensityNo = repertorized?.intensityNo ?? null;

    const sortedIntensities = [...intensitiesForPatientList].sort(
      (a, b) => b.intensityNo - a.intensityNo
    );

    return sortedIntensities.map((intensity) => {
      const isSelected =
        activeIntensityNo != null && intensity.intensityNo === activeIntensityNo;
      return (
        <span
          key={intensity.intensityId}
          className={`pb-chip pb-chip--repertory${isSelected ? ' pb-chip--repertory-selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleIntensityChipClick(rubricData, intensity);
          }}
        >
          {intensity.intensityNo}
        </span>
      );
    });
  };

  /** Questions tab rubrics: same chip behavior as Clinical Pattern */
  const renderQuestionRubricIntensityChips = (item) => {
    const rubricData = {
      subSectionId: item.subsectionId,
      subSectionName: item.subsectionName,
      subsectionId: item.subsectionId,
      subsectionName: item.subsectionName,
      rubricId: item.subsectionId,
      rubricName: item.subsectionName,
      remedyCount: item.remedyCountForSort,
      remedyCountForSort: item.remedyCountForSort,
    };
    const activeIntensityNo = getQuestionRubricActiveIntensityNo(item.subsectionId);
    return renderIntensityChips(
      rubricData,
      handleIntensityChipClick,
      activeIntensityNo != null ? { intensityNo: activeIntensityNo } : null
    );
  };

  const getQuestionRubricActiveIntensityNo = (subsectionId) => {
    const repertorized = repertorizationRubrics.find(
      (r) => String(r.rubricId ?? r.subsectionId ?? r.subSectionId) === String(subsectionId)
    );
    return repertorized?.intensityNo ?? null;
  };

  const [mmFontSize, setMmFontSize] = useState(14);

  const handleMateriaMedicaHeadingSelect = useCallback((headingId) => {
    if (!Number.isFinite(headingId)) {
      return;
    }

    setSelectedMateriaMedicaHeadingId((current) => (current === headingId ? null : headingId));
    if (mmContentScrollRef.current) {
      mmContentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleMateriaMedicaReset = useCallback(() => {
    setSelectedRemedy(null);
    setSelectedAuthor(null);
    setSelectedMateriaMedicaHeadingId(null);
    setMmTabHeadings([]);
    setMmTabHeadingsLoading(false);
    dispatch(setMateriaMedicaRemediesDetails(null));
    dispatch(setMateriaMedicaLoading(false));
  }, [dispatch]);

  const displayedMateriaMedicaSections = useMemo(() => {
    const sections = materiaMedicaDetails?.lstRemedy ?? [];
    if (!selectedMateriaMedicaHeadingId) {
      return sections;
    }

    return sections.filter((remedy) => {
      const sectionId = Number(remedy.materiaMedicaHeadId ?? remedy.materiaMedicaHeadID);
      return sectionId === selectedMateriaMedicaHeadingId;
    });
  }, [materiaMedicaDetails, selectedMateriaMedicaHeadingId]);

  const [showRemedyInfo, setShowRemedyInfo] = useState(false);
  const [showRemedyAuthors, setShowRemedyAuthors] = useState(false);
  const [hoveredRemedyInfo, setHoveredRemedyInfo] = useState(null);
  /** @deprecated Use hoveredRemedyInfo; kept so legacy JSX / HMR bundles do not throw ReferenceError */
  const showInfoTooltip = hoveredRemedyInfo != null;
  const hoveredRemedyInfoIdRef = useRef(null);
  const remedyInfoCacheRef = useRef(new Map());
  const remedyInfoTooltipTimeoutRef = useRef(null);
  const [showEnglishTooltip, setShowEnglishTooltip] = useState(false);
  const [showMarathiTooltip, setShowMarathiTooltip] = useState(false);
  const [rubricRemedyModalOpen, setRubricRemedyModalOpen] = useState(false);
  const [questionRubricModalOpen, setQuestionRubricModalOpen] = useState(false);
  const [selectedRepertoryOption, setSelectedRepertoryOption] = useState(null);
  const [globalSubSectionSearch, setGlobalSubSectionSearch] = useState('');
  const [globalSubSectionSearchResults, setGlobalSubSectionSearchResults] = useState([]);
  const [isGlobalSubSectionSearchActive, setIsGlobalSubSectionSearchActive] = useState(false);
  const [showGlobalSubSectionSuggestions, setShowGlobalSubSectionSuggestions] = useState(false);
  const [globalSubSectionSearchLoading, setGlobalSubSectionSearchLoading] = useState(false);
  const [globalSubSectionSearchTreePage, setGlobalSubSectionSearchTreePage] = useState(1);
  const [globalSubSectionSearchTreeHasMore, setGlobalSubSectionSearchTreeHasMore] = useState(false);
  const [globalSubSectionSearchTreeResults, setGlobalSubSectionSearchTreeResults] = useState([]);
  const [globalSubSectionSearchTreeLoadingMore, setGlobalSubSectionSearchTreeLoadingMore] = useState(false);
  const globalSubSectionSearchRequestRef = useRef(0);
  const globalSubSectionSearchAnchorRef = useRef(null);
  const globalSubSectionSearchInputRef = useRef(null);
  const globalSubSectionSearchFocusedRef = useRef(false);
  const globalSubSectionSuggestionsPortalRef = useRef(null);
  const [globalSubSectionDropdownLayout, setGlobalSubSectionDropdownLayout] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [subSectionSearch, setSubSectionSearch] = useState('');
  const [subSectionSearchResults, setSubSectionSearchResults] = useState([]);
  const [isSubSectionSearchActive, setIsSubSectionSearchActive] = useState(false);
  const [showSubSectionSuggestions, setShowSubSectionSuggestions] = useState(false);
  const [subSectionSearchTreePage, setSubSectionSearchTreePage] = useState(1);
  const [subSectionSearchTreeHasMore, setSubSectionSearchTreeHasMore] = useState(false);
  const [subSectionSearchTreeResults, setSubSectionSearchTreeResults] = useState([]);
  const [subSectionSearchTreeLoading, setSubSectionSearchTreeLoading] = useState(false);
  const [subSectionSearchTreeLoadingMore, setSubSectionSearchTreeLoadingMore] = useState(false);
  const subSectionTreeScrollRef = useRef(null);
  const baselineSubSectionStateRef = useRef({
    treeData: [],
    childrenMap: new Map(),
    expanded: new Set(),
  });
  const subSectionSearchRequestRef = useRef(0);
  const subSectionSearchAnchorRef = useRef(null);
  const subSectionSearchInputRef = useRef(null);
  const subSectionSuggestionsPortalRef = useRef(null);
  const [subSectionDropdownLayout, setSubSectionDropdownLayout] = useState(null);
  const [selectedClinicalPattern, setSelectedClinicalPattern] = useState(null);
  const [activeKeyword, setActiveKeyword] = useState(null);
  const [activeKeywordSectionIds, setActiveKeywordSectionIds] = useState(null);
  const [clinicalPatternRubricPage, setClinicalPatternRubricPage] = useState(1);
  const [clinicalPatternRubricHasMore, setClinicalPatternRubricHasMore] = useState(false);
  const [clinicalPatternRubricLoadingMore, setClinicalPatternRubricLoadingMore] = useState(false);
  const [selectedRubricRemedy, setSelectedRubricRemedy] = useState(null);
  const [selectedQuestionRubric, setSelectedQuestionRubric] = useState(null);
  const [therapeuticsFontSize, setTherapeuticsFontSize] = useState(14);
  const [selectedSubSection, setSelectedSubSection] = useState(null);
  const rubricDetailsPrefetchObserverRef = useRef(null);
  const rubricDetailsScrollPrefetchTimerRef = useRef(null);

  const queueRubricDetailsPrefetch = useCallback(
    (ids, limit = SCROLL_RUBRIC_PREFETCH_BATCH) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      const uniqueIds = [];
      ids.forEach((rawId) => {
        const subSectionId = Number(rawId);
        if (
          Number.isFinite(subSectionId) &&
          subSectionId > 0 &&
          !uniqueIds.includes(subSectionId) &&
          !getCachedRubricDetails(subSectionId)
        ) {
          uniqueIds.push(subSectionId);
        }
      });
      uniqueIds.slice(0, limit).forEach((subSectionId) => {
        dispatch(getRubricDetails({ subSectionId, prefetchOnly: true }));
      });
    },
    [dispatch]
  );

  const clearRepertoryRubricDetails = useCallback(({ clearSelection = false } = {}) => {
    dispatch(setRubricDetailsList(null));
    dispatch(setRubricDetailsError(null));
    dispatch(setRubricDetailsLoading(false));
    dispatch(setRubricDetailsRefreshing(false));
    hoveredRemedyInfoIdRef.current = null;
    setHoveredRemedyInfo(null);
    if (clearSelection) {
      setSelectedSubSection(null);
    }
  }, [dispatch]);

  const [currentSubSectionPage, setCurrentSubSectionPage] = useState(1);
  const [repertorizationRubrics, setRepertorizationRubrics] = useState([]);
  const [sectionPageNumber, setSectionPageNumber] = useState(1);
  const [accumulatedSections, setAccumulatedSections] = useState([]);
  const [sectionLoadingMore, setSectionLoadingMore] = useState(false);
  const [subSectionPageNumber, setSubSectionPageNumber] = useState(1);
  // Multi-level tree state
  const [subSectionTreeData, setSubSectionTreeData] = useState([]);
  const [expandedSubSections, setExpandedSubSections] = useState(new Set());
  const [subSectionChildrenMap, setSubSectionChildrenMap] = useState(new Map());
  const [subSectionTreeLoading, setSubSectionTreeLoading] = useState(false);
  const [isKeynoteEnabled, setIsKeynoteEnabled] = useState(false);
  const [isSmallRubricEnabled, setIsSmallRubricEnabled] = useState(false);
  const [selectedRemedyFromCommonUncommon, setSelectedRemedyFromCommonUncommon] = useState(null);
  const [selectedThermalId, setSelectedThermalId] = useState(null);
  // ###### Dj UI Code Start - Remedy Abbreviation Hover Tooltip State ######
  const [hoveredRemedyAbbrev, setHoveredRemedyAbbrev] = useState(null);
  const hoveredRemedyAbbrevIdRef = useRef(null);
  // ###### Dj UI Code End - Remedy Abbreviation Hover Tooltip State ######
  // ###### Dj UI Code Start - Repertorization Rubric Modal State ######
  const [repertorizationRubricModalOpen, setRepertorizationRubricModalOpen] = useState(false);
  const [selectedRepertorizationRubric, setSelectedRepertorizationRubric] = useState(null);
  // ###### Dj UI Code End - Repertorization Rubric Modal State ######
  // Prescription Modal State
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionTab, setPrescriptionTab] = useState('Prescription');
  const [prescriptionRemedyDetailList, setPrescriptionRemedyDetailList] = useState([]);
  const [selectedPrescriptionRemedy, setSelectedPrescriptionRemedy] = useState(null);
  const [prescriptionRemedyDescription, setPrescriptionRemedyDescription] = useState('');
  const [historyNoteContent, setHistoryNoteContent] = useState(() => {
    const contentState = ContentState.createFromText('');
    return EditorState.createWithContent(contentState);
  });
  const [labsImagingTab, setLabsImagingTab] = useState('Ordered Labs & Imaging');

  // Lab Order Form State
  const [labOrderForm, setLabOrderForm] = useState({
    patientLabTestId: null,
    testDate: '',
    labName: '',
    description: ''
  });

  // Lab Entry Form State
  const [labEntryForm, setLabEntryForm] = useState({
    patientLabTestId: null,
    testDate: '',
    parameterName: '',
    parameterValue: '',
    testDescription: ''
  });

  // Session-only lab rows for this Prescription modal visit (not API history)
  const [sessionLabOrderList, setSessionLabOrderList] = useState([]);
  const [sessionLabEntryList, setSessionLabEntryList] = useState([]);

  // Call getPatientLabTestDDL when Labs & Imaging tab is active
  useEffect(() => {
    if (prescriptionTab === 'Labs & Imaging') {
      dispatch(getPatientLabTestDDL());
    }
  }, [prescriptionTab, dispatch]);

  // Clear historical lab lists / session drafts when Prescription modal opens or closes
  useEffect(() => {
    if (prescriptionModalOpen) {
      setSessionLabOrderList([]);
      setSessionLabEntryList([]);
      dispatch(setPatientLabOrderList(null));
      dispatch(setPatientLabEntryList(null));
    } else {
      setSessionLabOrderList([]);
      setSessionLabEntryList([]);
      dispatch(setPatientLabOrderList(null));
      dispatch(setPatientLabEntryList(null));
    }
  }, [prescriptionModalOpen, dispatch]);

  // Call getPrescriptionRemedy when Prescription modal opens
  useEffect(() => {
    if (prescriptionModalOpen && repertorizationRubrics && repertorizationRubrics.length > 0) {
      // Extract subsection IDs from repertorizationRubrics
      const subsectionIds = repertorizationRubrics.map(rubric => rubric.rubricId || rubric.subsectionId || rubric.subSectionId).filter(id => id != null);

      if (subsectionIds.length > 0) {
        dispatch(getPrescriptionRemedy(subsectionIds));
      }
    }
  }, [prescriptionModalOpen, repertorizationRubrics, dispatch]);

  const sectionPageSize = 20;
  const subSectionPageSize = 10;

  // Helper function to get CSS style for remedyAlias / rubric labels based on API response
  const getRemedyAliasStyle = (remedy, options = {}) => {
    // Get fontStyle and fontColor from API response, default to "Normal" and "Black"
    const fontStyle = remedy?.fontStyle || 'Normal';
    const fontColor = remedy?.fontColor || 'Black';
    const fontName = remedy?.fontName || '';
    const gradeNo = Number(remedy?.gradeNo ?? remedy?.gradeId ?? 0);

    // Map fontColor to CSS color (case-insensitive)
    const colorMap = {
      'Black': '#000000',
      'Red': '#dc3545',
      'Blue': '#0d6efd',
      'Green': '#198754',
      'White': '#ffffff',
      'Yellow': '#ffc107',
      'Orange': '#fd7e14',
      'Purple': '#6f42c1'
    };
    const colorKey = Object.keys(colorMap).find(
      (key) => key.toLowerCase() === String(fontColor).toLowerCase()
    );

    // Convert fontStyle to CSS properties
    let cssStyle = {
      color: colorKey ? colorMap[colorKey] : (String(fontColor).toLowerCase() || '#000000'),
      fontStyle: 'normal',
      fontWeight: 'normal',
      textTransform: 'none'
    };

    if (fontName) {
      cssStyle.fontFamily = `"${fontName}", sans-serif`;
    }

    // Handle fontStyle (CAPITAL, Bold, Italic, etc.)
    if (fontStyle) {
      const styleLower = fontStyle.toLowerCase();
      if (styleLower.includes('italic')) {
        cssStyle.fontStyle = 'italic';
      } else if (styleLower.includes('oblique')) {
        cssStyle.fontStyle = 'oblique';
      }

      if (styleLower.includes('capital') || styleLower.includes('upper')) {
        cssStyle.textTransform = 'uppercase';
      } else if (styleLower.includes('lower')) {
        cssStyle.textTransform = 'lowercase';
      }

      if (styleLower.includes('bold')) {
        cssStyle.fontWeight = 'bold';
      } else if (styleLower.includes('normal')) {
        cssStyle.fontWeight = 'normal';
      }
    }

    const resolveFontWeightNumber = (weight) => {
      if (weight === 'bold' || weight === 'bolder') return 700;
      if (weight === 'lighter') return 300;
      const numeric = Number(weight);
      return Number.isFinite(numeric) ? numeric : 400;
    };

    // Grade 2: optional +10% font weight in Repertory RUBRIC DETAILS
    if (gradeNo === 2 && options.boostGrade2Weight) {
      const boostedWeight = Math.min(900, Math.round(resolveFontWeightNumber(cssStyle.fontWeight) * 1.1));
      cssStyle.fontWeight = boostedWeight;
    }

    // Grade 4: bold; optional +10% font size in Repertory RUBRIC DETAILS
    if (gradeNo === 4) {
      cssStyle.fontWeight = 'bold';
      if (options.boostGrade4Font) {
        cssStyle.fontSize = '110%';
      }
    }

    return cssStyle;
  };

  const getRemedyAuthorAliases = (remedy) => {
    const rawValues = [
      remedy?.authorAlias,
      remedy?.AuthorAlias,
      remedy?.authors,
      remedy?.Authors,
    ];
    const aliases = [];
    rawValues.forEach((raw) => {
      if (raw == null || raw === '') return;
      if (Array.isArray(raw)) {
        raw.forEach((entry) => {
          const text = String(entry ?? '').trim();
          if (text) aliases.push(text);
        });
        return;
      }
      String(raw)
        .split(/[,;|]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => aliases.push(part));
    });
    return [...new Set(aliases)];
  };

  const getRemedyAuthorAlias = (remedy) => {
    const aliases = getRemedyAuthorAliases(remedy);
    if (!aliases.length) return null;
    return aliases.join(',');
  };

  const renderRemedyAliasWithAuthorSubscript = (remedy, showAuthor = false, { wrapAuthors = false } = {}) => {
    const remedyAlias = formatRemedyAliasForDisplay(remedy?.remedyAlias || remedy?.remedyAlies || '');
    const authorAliases = getRemedyAuthorAliases(remedy);

    return (
      <>
        {remedyAlias}
        {showAuthor && authorAliases.length > 0 ? (
          wrapAuthors ? (
            <span
              className="remedy-author-sub-block"
              aria-label={`Authors ${authorAliases.join(', ')}`}
            >
              ({authorAliases.join(',')})
            </span>
          ) : (
            <sub
              className="remedy-author-sub-block"
              aria-label={`Authors ${authorAliases.join(', ')}`}
            >
              ({authorAliases.join(',')})
            </sub>
          )
        ) : null}
      </>
    );
  };

  // ###### Dj UI Code Start - Remedy Abbreviation Hover Tooltip Functions ######
  // Remedy abbreviation hover tooltip functions
  const handleRemedyAbbrevHover = (remedy) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const remedyId = remedy?.remedyId ?? remedy?.RemedyId ?? null;
    hoveredRemedyAbbrevIdRef.current = remedyId;

    const inline = extractRemedyTooltipData(remedy);
    const base = { ...remedy, ...inline };

    if (hasRemedyTooltipContent(inline)) {
      setHoveredRemedyAbbrev(base);
      return;
    }

    if (remedyId != null && remedyInfoCacheRef.current.has(remedyId)) {
      setHoveredRemedyAbbrev(remedyInfoCacheRef.current.get(remedyId));
      return;
    }

    setHoveredRemedyAbbrev(base);

    if (remedyId == null) {
      return;
    }

    getRubricRemedyDetailsApi({ remedyId })
      .then((response) => {
        const payload = response?.resultObject ?? response?.data ?? response;
        const fetched = extractRemedyTooltipData(payload);
        const merged = { ...remedy, ...fetched };
        remedyInfoCacheRef.current.set(remedyId, merged);
        if (hoveredRemedyAbbrevIdRef.current === remedyId) {
          setHoveredRemedyAbbrev(merged);
        }
      })
      .catch(() => {
        /* keep inline / no-data state */
      });
  };

  const handleRemedyAbbrevLeave = () => {
    hoveredRemedyAbbrevIdRef.current = null;
    tooltipTimeoutRef.current = setTimeout(() => {
      setHoveredRemedyAbbrev(null);
    }, 300);
  };
  // ###### Dj UI Code End - Remedy Abbreviation Hover Tooltip Functions ######

  const handleRemedyInfoEnter = (remedy) => {
    if (remedyInfoTooltipTimeoutRef.current) {
      clearTimeout(remedyInfoTooltipTimeoutRef.current);
    }

    const remedyId = remedy?.remedyId ?? remedy?.RemedyId ?? null;
    hoveredRemedyInfoIdRef.current = remedyId;

    const inline = extractRemedyTooltipData(remedy);
    if (hasRemedyTooltipContent(inline)) {
      setHoveredRemedyInfo(inline);
      return;
    }

    if (remedyId != null && remedyInfoCacheRef.current.has(remedyId)) {
      setHoveredRemedyInfo(remedyInfoCacheRef.current.get(remedyId));
      return;
    }

    setHoveredRemedyInfo(inline);

    if (remedyId == null) {
      return;
    }

    getRubricRemedyDetailsApi({ remedyId })
      .then((response) => {
        const payload = response?.resultObject ?? response?.data ?? response;
        const fetched = mergeRemedyTooltipData(payload, remedy);
        remedyInfoCacheRef.current.set(remedyId, fetched);
        if (hoveredRemedyInfoIdRef.current === remedyId) {
          setHoveredRemedyInfo(fetched);
        }
      })
      .catch(() => {
        /* keep inline / no-data state */
      });
  };

  const handleRemedyInfoLeave = () => {
    hoveredRemedyInfoIdRef.current = null;
    remedyInfoTooltipTimeoutRef.current = setTimeout(() => {
      setHoveredRemedyInfo(null);
    }, 300);
  };

  const renderRemedyInfoIcon = (remedy) => {
    if (!showRemedyInfo) {
      return null;
    }
    return (
      <span
        className="remedy-info-icon"
        onMouseEnter={(e) => {
          e.stopPropagation();
          handleRemedyInfoEnter(remedy);
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          handleRemedyInfoLeave();
        }}
      >
        i
      </span>
    );
  };

  useEffect(() => {
    if (!showRemedyInfo) {
      hoveredRemedyInfoIdRef.current = null;
      setHoveredRemedyInfo(null);
    }
  }, [showRemedyInfo]);

  useEffect(() => {
    remedyInfoCacheRef.current.clear();
    hoveredRemedyInfoIdRef.current = null;
    setHoveredRemedyInfo(null);
  }, [
    rubricDetailsList?.subSectionId,
    rubricDetailsList?.subSectionID,
    rubricDetailsList?.subsectionId,
    selectedSubSection?.subSectionId,
  ]);

  // Debug therapeutics font size changes
  useEffect(() => {
    console.log('therapeuticsFontSize changed to:', therapeuticsFontSize);
  }, [therapeuticsFontSize]);

  // Reset section pagination when entering Repertory / Repertorize
  useEffect(() => {
    if (isRestoringPatientBoardSessionRef.current) {
      return;
    }
    if (activeTab === 'Repertory' || activeTab === 'Repertorize') {
      setSectionPageNumber(1);
      setAccumulatedSections([]);
      setSectionLoadingMore(false);
    }
  }, [activeTab]);

  const prevActiveTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevActiveTabRef.current === 'Repertory' && activeTab !== 'Repertory') {
      clearRepertoryRubricDetails({ clearSelection: true });
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, clearRepertoryRubricDetails]);

  // Call getSectionList when Repertory or Repertorize tab is active
  useEffect(() => {
    if (activeTab === 'Repertory' || activeTab === 'Repertorize') {
      dispatch(getSectionList({ PageNumber: sectionPageNumber, PageSize: sectionPageSize }));
    }
  }, [activeTab, sectionPageNumber, dispatch]);

  // Append paginated section results for infinite scroll
  useEffect(() => {
    const sections = sectionList?.resultObject;
    if (!Array.isArray(sections)) {
      if (sectionPageNumber === 1) {
        setAccumulatedSections([]);
      }
      setSectionLoadingMore(false);
      return;
    }

    setAccumulatedSections((prev) => {
      if (sectionPageNumber === 1) {
        return sections;
      }
      const existingIds = new Set(prev.map((section) => section.sectionId));
      const nextSections = sections.filter((section) => !existingIds.has(section.sectionId));
      return [...prev, ...nextSections];
    });
    setSectionLoadingMore(false);
  }, [sectionList, sectionPageNumber]);

  const sectionTotalPages = useMemo(() => {
    const totalPages = Number(sectionList?.totalPageCount);
    if (Number.isFinite(totalPages) && totalPages > 0) {
      return totalPages;
    }
    const totalCount = Number(sectionList?.totalCount);
    if (Number.isFinite(totalCount) && totalCount > 0) {
      return Math.ceil(totalCount / sectionPageSize);
    }
    return 1;
  }, [sectionList, sectionPageSize]);

  const hasMoreSections = sectionPageNumber < sectionTotalPages;

  const handleSectionScroll = useCallback((event) => {
    const target = event?.target;
    if (!target || sectionLoadingMore || !hasMoreSections) {
      return;
    }

    if (target.scrollTop + target.clientHeight < target.scrollHeight - 12) {
      return;
    }

    setSectionLoadingMore(true);
    setSectionPageNumber((prev) => prev + 1);
  }, [sectionLoadingMore, hasMoreSections]);

  const repertorizeSectionMetaById = useMemo(() => {
    const map = new Map();
    const sections = accumulatedSections.length > 0
      ? accumulatedSections
      : sectionList?.resultObject;
    if (!Array.isArray(sections)) {
      return map;
    }
    sections.forEach((section) => {
      if (section?.sectionId == null) {
        return;
      }
      map.set(Number(section.sectionId), {
        sectionId: Number(section.sectionId),
        sectionName: String(section.sectionName || "").trim().toUpperCase(),
      });
    });
    return map;
  }, [accumulatedSections, sectionList]);

  const rubricBelongsToRepertorizeSection = useCallback(
    (rubric, sectionId) => {
      if (rubric?.sectionId != null && Number(rubric.sectionId) === Number(sectionId)) {
        return true;
      }
      const meta = repertorizeSectionMetaById.get(Number(sectionId));
      if (!meta?.sectionName) {
        return false;
      }
      const rubricName = String(rubric?.rubricName || "").trim().toUpperCase();
      if (!rubricName) {
        return false;
      }
      return (
        rubricName === meta.sectionName ||
        rubricName.startsWith(`${meta.sectionName}-`) ||
        rubricName.startsWith(`${meta.sectionName} `)
      );
    },
    [repertorizeSectionMetaById]
  );

  const buildCommanUncommonRequestDataFrom = useCallback((rubrics) => {
    if (!rubrics?.length) {
      return [];
    }

    return rubrics.map((rubric) => ({
      subsectionId: rubric.rubricId,
      intensity: rubric.intensityNo,
    }));
  }, []);

  const buildCommanUncommonRequestData = useCallback(
    () => buildCommanUncommonRequestDataFrom(repertorizationRubrics),
    [buildCommanUncommonRequestDataFrom, repertorizationRubrics]
  );

  const repertorizeAccordionGlobalFilters = useMemo(
    () => ({
      sectionIds: selectedRepertorizeSectionIds,
      gradeId: mapRepertorizeIntensityToGradeId(selectedRepertorizeIntensity),
    }),
    [selectedRepertorizeSectionIds, selectedRepertorizeIntensity]
  );

  const resetRepertorizeAccordionExpansion = useCallback(() => {
    setExpandedCommonItems(new Set());
    setExpandedUncommonItems(new Set());
    setAccordionDataMap(new Map());
    setLastRequestedRemedyId(null);
    setAccordionLoadingMoreRemedyId(null);
    dispatch(setRepertorizarionRemedyForAccordionList(null));
  }, [dispatch]);

  const clearRepertorizeSectionFilters = useCallback(() => {
    setSelectedRepertorizeSectionIds([]);
    setSelectedRepertorizeIntensity(null);
  }, []);

  // Call getCommanUnCommanRubricsDetails when rubrics or section filters change
  useEffect(() => {
    if (skipCommanUncommanRefreshRef.current) {
      skipCommanUncommanRefreshRef.current = false;
      return;
    }

    const requestData = buildCommanUncommonRequestData();

    if (requestData.length > 0) {
      dispatch(getCommanUnCommanRubricsDetails(requestData));
    } else if (repertorizationRubrics?.length > 0) {
      dispatch(setCommanUnCommanRubricsDetailsList({ commonRemedyList: [], unCommonRemedyList: [] }));
      setSelectedRemedyFromCommonUncommon(null);
    } else {
      dispatch(setCommanUnCommanRubricsDetailsList(null));
      setSelectedRemedyFromCommonUncommon(null);
    }
  }, [repertorizationRubrics, buildCommanUncommonRequestData, dispatch]);

  useEffect(() => {
    if (!filledPyramidIcons || filledPyramidIcons.size === 0) {
      return;
    }
    if (!Array.isArray(repertorizationRubrics) || repertorizationRubrics.length === 0) {
      setFilledPyramidIcons(new Set());
      dispatch(setEliminationDataList(null));
    }
  }, [dispatch, filledPyramidIcons, repertorizationRubrics]);

  // Update remedy count in repertorization rubrics when remedyCountsList changes
  useEffect(() => {
    if (remedyCountsList && remedyCountsList.remedyCount !== undefined) {
      setRepertorizationRubrics(prevRubrics =>
        prevRubrics.map(rubric => {
          // Find the rubric that matches the subsectionId from the response
          if (rubric.rubricId === remedyCountsList.subSectionId) {
            return { ...rubric, remedyCount: remedyCountsList.remedyCount };
          }
          return rubric;
        })
      );
    }
  }, [remedyCountsList]);

  // Clear selected remedy when API data changes
  useEffect(() => {
    if (!selectedRemedyFromCommonUncommon) {
      return;
    }

    const allRemedies = [
      ...(effectiveRemedyData.common || []),
      ...(effectiveRemedyData.uncommon || [])
    ];

    if (!allRemedies.find(r => r.remedyId === selectedRemedyFromCommonUncommon.remedyId)) {
      setSelectedRemedyFromCommonUncommon(null);
    }
  }, [effectiveRemedyData, selectedRemedyFromCommonUncommon]);

  // Filter COMMON and UNCOMMON lists based on selected thermalId
  // (text search is applied separately for list display — DMM still uses the full thermal-filtered set)
  const filteredCommonRemedies = useMemo(() => {
    const commonList = effectiveRemedyData.common || [];
    if (selectedThermalId === null) {
      return commonList;
    }
    return commonList.filter(remedy => remedy.thermalId === selectedThermalId);
  }, [effectiveRemedyData, selectedThermalId]);

  const filteredUncommonRemedies = useMemo(() => {
    const uncommonList = effectiveRemedyData.uncommon || [];
    if (selectedThermalId === null) {
      return uncommonList;
    }
    return uncommonList.filter(remedy => remedy.thermalId === selectedThermalId);
  }, [effectiveRemedyData, selectedThermalId]);

  const matchRemedySearchTerm = useCallback((remedy, searchTerm) => {
    const query = String(searchTerm || '').trim().toLowerCase();
    if (!query) {
      return true;
    }
    const display = getRemedyListDisplay(remedy);
    const haystacks = [
      display.name,
      display.aliasBracket,
      remedy?.remedyName,
      remedy?.remedyAlies,
      remedy?.remedyAlias,
      remedy?.score,
      remedy?.final,
    ];
    return haystacks.some((value) => String(value || '').toLowerCase().includes(query));
  }, []);

  const displayedCommonRemedies = useMemo(
    () => filteredCommonRemedies.filter((remedy) => matchRemedySearchTerm(remedy, commonRemediesSearchTerm)),
    [filteredCommonRemedies, commonRemediesSearchTerm, matchRemedySearchTerm]
  );

  const displayedUncommonRemedies = useMemo(
    () => filteredUncommonRemedies.filter((remedy) => matchRemedySearchTerm(remedy, uncommonRemediesSearchTerm)),
    [filteredUncommonRemedies, uncommonRemediesSearchTerm, matchRemedySearchTerm]
  );

  const activeDifferentialRemedies = useMemo(() => {
    return differentialMainTab === 'COMMON' ? filteredCommonRemedies : filteredUncommonRemedies;
  }, [differentialMainTab, filteredCommonRemedies, filteredUncommonRemedies]);

  const differentialMateriaMedicaItems = useMemo(() => {
    if (!differentialMateriaMedicaList) {
      return [];
    }

    if (Array.isArray(differentialMateriaMedicaList)) {
      return differentialMateriaMedicaList;
    }

    if (Array.isArray(differentialMateriaMedicaList?.resultObject)) {
      return differentialMateriaMedicaList.resultObject;
    }

    return [];
  }, [differentialMateriaMedicaList]);

  const groupedDifferentialMateriaMedica = useMemo(() => {
    if (!Array.isArray(differentialMateriaMedicaItems) || differentialMateriaMedicaItems.length === 0) {
      return [];
    }

    const groupedMap = new Map();

    differentialMateriaMedicaItems.forEach((item, index) => {
      if (!item) {
        return;
      }

      const key = `${item.remedyId ?? ''}-${item.remedyName ?? index}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          remedyId: item.remedyId ?? index,
          remedyName: item.remedyName ?? 'Unknown Remedy',
          score: item.score ?? null,
          entries: []
        });
      }

      groupedMap.get(key).entries.push({
        materiaMedicaHeadName: item.materiaMedicaHeadName ?? 'N/A',
        materiaMedica: item.materiaMedica ?? ''
      });
    });

    return Array.from(groupedMap.values());
  }, [differentialMateriaMedicaItems]);

  const filteredDifferentialMateriaMedica = useMemo(() => {
    if (!differentialSearchTerm || !differentialSearchTerm.trim()) {
      return groupedDifferentialMateriaMedica;
    }

    const query = differentialSearchTerm.trim().toLowerCase();

    const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ');

    return groupedDifferentialMateriaMedica.filter((remedy) => {
      if ((remedy.remedyName || '').toLowerCase().includes(query)) {
        return true;
      }

      if ((remedy.score || '').toString().toLowerCase().includes(query)) {
        return true;
      }

      return remedy.entries.some((entry) => {
        if ((entry.materiaMedicaHeadName || '').toLowerCase().includes(query)) {
          return true;
        }

        const plainText = stripHtml(entry.materiaMedica || '');
        return plainText.toLowerCase().includes(query);
      });
    });
  }, [groupedDifferentialMateriaMedica, differentialSearchTerm]);

  const activeDifferentialAuthor = useMemo(() => {
    if (!Array.isArray(materiaMedicaAuthors)) {
      return null;
    }

    return materiaMedicaAuthors.find((author) => author?.authorId === selectedDifferentialAuthorId) || null;
  }, [materiaMedicaAuthors, selectedDifferentialAuthorId]);

  useEffect(() => {
    if (!selectedDifferentialAuthorId) {
      dispatch(setDifferentialMateriaMedicaList(null));
      return;
    }

    if (materiaMedicaHeadingByAuthorIdLoading) {
      return;
    }

    if (!Array.isArray(differentialMateriaMedicaHeadIds) || differentialMateriaMedicaHeadIds.length === 0) {
      dispatch(setDifferentialMateriaMedicaList(null));
      return;
    }

    if (!Array.isArray(activeDifferentialRemedies) || activeDifferentialRemedies.length === 0) {
      dispatch(setDifferentialMateriaMedicaList(null));
      return;
    }

    const remedyIndexModelList = buildRemedyIndexModelList(activeDifferentialRemedies);

    if (remedyIndexModelList.length === 0) {
      dispatch(setDifferentialMateriaMedicaList(null));
      return;
    }

    dispatch(getDifferentialMateriaMedica({
      authorId: selectedDifferentialAuthorId,
      materiaMedicaHeadIds: differentialMateriaMedicaHeadIds,
      remedyIndexModelList: remedyIndexModelList
    }));
  }, [
    dispatch,
    selectedDifferentialAuthorId,
    differentialMateriaMedicaHeadIds,
    activeDifferentialRemedies,
    materiaMedicaHeadingByAuthorIdLoading
  ]);

  const tooltipTimeoutRef = useRef(null);

  // Questions tab — column selection state (Repertory-style layout)
  const [questionGroupsMap, setQuestionGroupsMap] = useState({});
  const [questionSubGroupsMap, setQuestionSubGroupsMap] = useState({});
  const [selectedQuestionSection, setSelectedQuestionSection] = useState(null);
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState(null);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState(null);
  const [selectedSubGroupName, setSelectedSubGroupName] = useState('');
  const [selectedSubGroupSectionIds, setSelectedSubGroupSectionIds] = useState(null);
  const [questionSectionSearch, setQuestionSectionSearch] = useState('');
  const [questionGroupSearch, setQuestionGroupSearch] = useState('');
  const [subQuestionGroupSearch, setSubQuestionGroupSearch] = useState('');
  const lastRequestedSubGroupKeyRef = useRef(null);
  const lastRequestedQuestionSectionIdRef = useRef(null);
  const subGroupFetchSeqRef = useRef(0);
  const activeSubGroupFetchRef = useRef({ seq: 0, key: null });
  const groupFetchSeqRef = useRef(0);
  const activeGroupFetchRef = useRef({ seq: 0, sectionId: null });
  const skipCommanUncommanRefreshRef = useRef(false);
  const [activeQuestionGroupId, setActiveQuestionGroupId] = useState(null);
  const [questionSubGroupsLoadingKey, setQuestionSubGroupsLoadingKey] = useState(null);
  const [questionGroupsLoadingSectionId, setQuestionGroupsLoadingSectionId] = useState(null);

  // Questions tab rubric search state (SubSectionMaster via NigaHomeopathy-API)
  const [questionsRubricList, setQuestionsRubricList] = useState([]);
  const [questionsRubricLoading, setQuestionsRubricLoading] = useState(false);
  const [questionsRubricPage, setQuestionsRubricPage] = useState(1);
  const [questionsRubricHasMore, setQuestionsRubricHasMore] = useState(false);
  const [questionsRubricLoadingMore, setQuestionsRubricLoadingMore] = useState(false);
  const questionsRubricFetchSeqRef = useRef(0);

  const resetQuestionsRubricsResults = useCallback(() => {
    questionsRubricFetchSeqRef.current += 1;
    setQuestionsRubricList([]);
    setSelectedSubGroupName('');
    setSelectedSubGroupId(null);
    setRubricSearch('');
    setQuestionsRubricPage(1);
    setQuestionsRubricHasMore(false);
    setQuestionsRubricLoading(false);
    setQuestionsRubricLoadingMore(false);
  }, []);
  const filteredQuestionSections = useMemo(() => {
    if (!questionSectionDDL || !Array.isArray(questionSectionDDL)) {
      return [];
    }
    const query = questionSectionSearch.trim().toLowerCase();
    if (!query) {
      return questionSectionDDL;
    }
    return questionSectionDDL.filter((section) =>
      section.questionSectionName?.toLowerCase().includes(query)
    );
  }, [questionSectionDDL, questionSectionSearch]);

  const activeQuestionGroups = selectedQuestionSection
    ? questionGroupsMap[selectedQuestionSection.questionSectionId] || []
    : [];

  const filteredQuestionGroups = useMemo(() => {
    const query = questionGroupSearch.trim().toLowerCase();
    if (!query) {
      return activeQuestionGroups;
    }
    return activeQuestionGroups.filter((group) => group.name?.toLowerCase().includes(query));
  }, [activeQuestionGroups, questionGroupSearch]);

  const activeQuestionSubGroupKey = selectedQuestionSection && selectedQuestionGroup
    ? `${selectedQuestionSection.questionSectionId}-${selectedQuestionGroup.id}`
    : null;

  const activeQuestionSubGroups = activeQuestionSubGroupKey
    ? questionSubGroupsMap[activeQuestionSubGroupKey] || []
    : [];

  const filteredQuestionSubGroups = useMemo(() => {
    const query = subQuestionGroupSearch.trim().toLowerCase();
    if (!query) {
      return activeQuestionSubGroups;
    }
    return activeQuestionSubGroups.filter((subGroup) => subGroup.name?.toLowerCase().includes(query));
  }, [activeQuestionSubGroups, subQuestionGroupSearch]);

  const isQuestionGroupsLoading = Boolean(
    selectedQuestionSection
    && questionGroupsLoadingSectionId === selectedQuestionSection.questionSectionId
  );

  const isQuestionSubGroupsLoading = Boolean(
    activeQuestionSubGroupKey
    && questionSubGroupsLoadingKey === activeQuestionSubGroupKey
  );

  const ensureQuestionGroupsLoaded = useCallback((sectionId) => {
    if (!sectionId || questionGroupsMap[sectionId] !== undefined) {
      return;
    }
    const seq = ++groupFetchSeqRef.current;
    activeGroupFetchRef.current = { seq, sectionId };
    lastRequestedQuestionSectionIdRef.current = sectionId;
    setQuestionGroupsLoadingSectionId(sectionId);
    dispatch(getQuestionGroupByExistanceId({ questionSectionId: sectionId }));
  }, [dispatch, questionGroupsMap]);

  const ensureQuestionSubGroupsLoaded = useCallback((sectionId, groupId) => {
    if (!sectionId || !groupId) {
      return;
    }
    const key = `${sectionId}-${groupId}`;
    if (questionSubGroupsMap[key] !== undefined) {
      return;
    }
    const seq = ++subGroupFetchSeqRef.current;
    activeSubGroupFetchRef.current = { seq, key };
    lastRequestedSubGroupKeyRef.current = key;
    setQuestionSubGroupsLoadingKey(key);
    dispatch(getSubQuestionGroupByQGIDQSID({
      questionSectionId: sectionId,
      questionGroupId: groupId,
    }));
  }, [dispatch, questionSubGroupsMap]);

  const handleQuestionSectionSelect = useCallback((section) => {
    if (!section?.questionSectionId) {
      return;
    }
    const isNewSection = selectedQuestionSection?.questionSectionId !== section.questionSectionId;
    setSelectedQuestionSection(section);
    if (isNewSection) {
      resetQuestionsRubricsResults();
      setSelectedQuestionGroup(null);
      setActiveQuestionGroupId(null);
      setQuestionGroupSearch('');
      setSubQuestionGroupSearch('');
    }
    ensureQuestionGroupsLoaded(section.questionSectionId);
  }, [ensureQuestionGroupsLoaded, resetQuestionsRubricsResults, selectedQuestionSection]);

  const handleQuestionGroupSelect = useCallback((group) => {
    if (!group?.id || !selectedQuestionSection?.questionSectionId) {
      return;
    }
    const isNewGroup = selectedQuestionGroup?.id !== group.id;
    setSelectedQuestionGroup(group);
    setActiveQuestionGroupId(group.id);
    if (isNewGroup) {
      resetQuestionsRubricsResults();
      setSubQuestionGroupSearch('');
    }
    ensureQuestionSubGroupsLoaded(selectedQuestionSection.questionSectionId, group.id);
  }, [ensureQuestionSubGroupsLoaded, resetQuestionsRubricsResults, selectedQuestionGroup, selectedQuestionSection]);

  const renderQuestionsSearchInput = (value, onChange, { disabled = false, placeholder = 'Search...', onClear } = {}) => (
    <div className={`search-box pb-questions-search-box${value.trim() ? ' pb-questions-search-box--active' : ''}${disabled ? ' pb-questions-search-box--disabled' : ''}`}>
      <Input
        bsSize="sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pb-questions-search-input"
      />
      <i className={`ri-${value.trim() ? 'search-2-line' : 'search-line'} search-icon`} aria-hidden="true" />
      {value.trim() && !disabled && (
        <button
          type="button"
          className="pb-questions-search-clear"
          onClick={() => onClear?.()}
          aria-label="Clear search"
        >
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  const fetchQuestionsRubricsBySubgroup = useCallback(async (subGroupName, { pageNumber = 1, append = false, sectionIds } = {}) => {
    const trimmedKeyword = subGroupName?.trim();
    if (!trimmedKeyword) {
      if (!append) {
        setQuestionsRubricList([]);
        setQuestionsRubricPage(1);
        setQuestionsRubricHasMore(false);
      }
      return null;
    }

    const requestSeq = append
      ? questionsRubricFetchSeqRef.current
      : ++questionsRubricFetchSeqRef.current;

    if (append) {
      setQuestionsRubricLoadingMore(true);
    } else {
      setQuestionsRubricLoading(true);
    }

    try {
      const response = await searchRubricsByKeywordApi({
        keyword: trimmedKeyword,
        pageNumber,
        pageSize: CLINICAL_PATTERN_RUBRIC_PAGE_SIZE,
        sectionIds,
      });

      if (!append && requestSeq !== questionsRubricFetchSeqRef.current) {
        return null;
      }

      const paged = normalizeClinicalPatternRubricPagedResponse(response);
      const items = Array.isArray(paged.items) ? paged.items : [];

      if (append) {
        if (requestSeq !== questionsRubricFetchSeqRef.current) {
          return null;
        }
        setQuestionsRubricList((existing) => mergeClinicalPatternRubricPages(existing, items));
      } else {
        setQuestionsRubricList(items);
      }

      setQuestionsRubricPage(paged.pageNumber ?? pageNumber);
      setQuestionsRubricHasMore(paged.hasMore ?? false);
      return paged;
    } catch (error) {
      console.error('Error fetching questions rubrics by subgroup:', error);
      if (!append && requestSeq === questionsRubricFetchSeqRef.current) {
        setQuestionsRubricList([]);
        setQuestionsRubricPage(1);
        setQuestionsRubricHasMore(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch rubrics for the selected sub-group',
        });
      }
      throw error;
    } finally {
      if (append) {
        if (requestSeq === questionsRubricFetchSeqRef.current) {
          setQuestionsRubricLoadingMore(false);
        }
      } else if (requestSeq === questionsRubricFetchSeqRef.current) {
        setQuestionsRubricLoading(false);
      }
    }
  }, []);

  // Handle sub-group click to search rubrics in SubSectionMaster
  const handleSubGroupClick = async (sectionId, groupId, subGroupId, subGroupName, sectionIds) => {
    const trimmedSubGroupName = subGroupName?.trim();
    if (!trimmedSubGroupName) {
      return;
    }

    const isNewSubGroup = selectedSubGroupId !== subGroupId;
    if (isNewSubGroup) {
      questionsRubricFetchSeqRef.current += 1;
      setQuestionsRubricList([]);
      setRubricSearch('');
      setQuestionsRubricPage(1);
      setQuestionsRubricHasMore(false);
      setQuestionsRubricLoadingMore(false);
      setQuestionsRubricLoading(true);
    }

    setSelectedSubGroupId(subGroupId);
    setSelectedSubGroupName(trimmedSubGroupName);
    setSelectedSubGroupSectionIds(sectionIds);
    setActiveQuestionGroupId(groupId);
    setActiveQuestion(null);
    dispatch(setQuestionKeywordBodyPart([]));
    dispatch(setQuestionRubricData([]));

    const validSectionIds = Array.isArray(sectionIds) && sectionIds.length > 0 ? sectionIds : undefined;
    await fetchQuestionsRubricsBySubgroup(trimmedSubGroupName, { pageNumber: 1, append: false, sectionIds: validSectionIds });
  };

  const loadMoreQuestionsRubrics = useCallback(async () => {
    const trimmedKeyword = selectedSubGroupName?.trim();
    if (
      !trimmedKeyword
      || !questionsRubricHasMore
      || questionsRubricLoadingMore
      || questionsRubricLoading
    ) {
      return;
    }

    const validSectionIds = Array.isArray(selectedSubGroupSectionIds) && selectedSubGroupSectionIds.length > 0 ? selectedSubGroupSectionIds : undefined;
    await fetchQuestionsRubricsBySubgroup(trimmedKeyword, {
      pageNumber: questionsRubricPage + 1,
      append: true,
      sectionIds: validSectionIds,
    });
  }, [
    selectedSubGroupName,
    selectedSubGroupSectionIds,
    questionsRubricHasMore,
    questionsRubricLoadingMore,
    questionsRubricLoading,
    questionsRubricPage,
    fetchQuestionsRubricsBySubgroup,
  ]);

  const handleQuestionsRubricsScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) return;

    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
    if (nearBottom) {
      loadMoreQuestionsRubrics();
    }
  }, [loadMoreQuestionsRubrics]);

  // Handle question rubric click to fetch rubric details
  const handleQuestionRubricClick = async (rubric) => {
    try {
      setSelectedQuestionRubric(rubric);
      // Call API to get rubric details with remedies
      await dispatch(getRubricDetails({ subSectionId: rubric.subsectionId }));
      // Open the modal
      setQuestionRubricModalOpen(true);
    } catch (error) {
      console.error('Error fetching rubric details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch rubric details'
      });
    }
  };

  // Handle intensity chip click to add rubric to repertorization
  const handleIntensityChipClick = async (rubricData, intensity, options = {}) => {
    const rubricName = rubricData.rubricName || rubricData.subsectionName || rubricData.subSectionName || rubricData.name;
    const rubricId = rubricData.rubricId || rubricData.subsectionId || rubricData.subSectionId || rubricData.id;
    const remedyCountForSort = rubricData.remedyCount || rubricData.remedyCountForSort || 0;

    if (options.skipCommanUncommanRefresh) {
      skipCommanUncommanRefreshRef.current = true;
    }

    // Check if rubric already exists in repertorization list
    const existingIndex = repertorizationRubrics.findIndex(
      (r) => String(r.rubricId ?? r.subsectionId ?? r.subSectionId) === String(rubricId)
    );

    if (existingIndex !== -1) {
      // Update existing rubric with new intensity
      const updatedRubrics = [...repertorizationRubrics];
      updatedRubrics[existingIndex] = {
        ...updatedRubrics[existingIndex],
        intensityNo: intensity.intensityNo,
        intensityId: intensity.intensityId,
        remedyCount: remedyCountForSort
      };
      setRepertorizationRubrics(updatedRubrics);
    } else {
      // Check if maximum limit reached (20 items)
      if (repertorizationRubrics.length >= 20) {
        Swal.fire({
          icon: 'warning',
          title: 'Maximum Limit Reached',
          text: 'You can only add up to 20 rubrics to the repertorization list.',
          confirmButtonColor: '#000000'
        });
        return;
      }

      // Add new rubric to repertorization list
      const sectionIdFromRubric =
        rubricData.sectionId ??
        rubricData.SectionId ??
        rubricData.section?.sectionId ??
        null;

      setRepertorizationRubrics(prev => [...prev, {
        rubricId,
        rubricName,
        intensityNo: intensity.intensityNo,
        intensityId: intensity.intensityId,
        remedyCount: remedyCountForSort,
        ...(sectionIdFromRubric != null ? { sectionId: sectionIdFromRubric } : {}),
      }]);

      // If remedyCountForSort is 0 or not available, fetch from API (skip when adding from accordion)
      if (!options.skipCommanUncommanRefresh && !remedyCountForSort && rubricId) {
        try {
          await dispatch(getRemedyCounts({ subSectionId: rubricId }));
        } catch (error) {
          console.error('Error fetching remedy count:', error);
        }
      }
    }
  };

  const handleBodyPartRubricGrade = (rubricData, gradeNo) => {
    const intensity =
      intensitiesForPatientList?.find((i) => i.intensityNo === gradeNo) || {
        intensityNo: gradeNo,
        intensityId: gradeNo,
      };
    handleIntensityChipClick(rubricData, intensity);
  };

  const renderAccordionSublistIntensityChips = (rubricData, currentIntensity, rowIndex) => {
    const intensitySource =
      intensitiesForPatientList && Array.isArray(intensitiesForPatientList) && intensitiesForPatientList.length > 0
        ? [...intensitiesForPatientList].sort((a, b) => b.intensityNo - a.intensityNo)
        : [4, 3, 2, 1].map((intensityNo) => ({ intensityNo, intensityId: intensityNo }));

    return intensitySource.map((intensity) => {
      const isSelected =
        currentIntensity && intensity.intensityNo === currentIntensity.intensityNo;
      return (
        <span
          key={`accordion-intensity-${rowIndex}-${intensity.intensityId ?? intensity.intensityNo}`}
          className={`pb-chip pb-chip--repertory${isSelected ? " pb-chip--repertory-selected" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleIntensityChipClick(rubricData, intensity, {
              skipCommanUncommanRefresh: true,
            });
          }}
        >
          {intensity.intensityNo}
        </span>
      );
    });
  };

  const renderAccordionSublistEntryRow = (item, index) => {
    const rubricData = mapAccordionEntryToRubricData(item);
    const rubricKey = rubricData.rubricId ?? `accordion-entry-${index}`;
    const repertorized = repertorizationRubrics.find(
      (r) =>
        String(r.rubricId ?? r.subsectionId ?? r.subSectionId) === String(rubricData.rubricId)
    );
    const currentIntensity = repertorized
      ? { intensityNo: repertorized.intensityNo, intensityId: repertorized.intensityId }
      : null;

    // Apply grade font styles from API (fontName / fontColor / fontStyle e.g. Poppins, Red, CAPITAL)
    const fontStyleObj = {
      ...getRemedyAliasStyle(item),
      fontSize: "12px",
    };

    const rubricLabel =
      item?.subSectionName || item?.rubricName || item?.name || "N/A";

    return (
      <div
        key={`${rubricKey}-${index}`}
        className={`p-2 border-bottom pb-accordion-sublist-row${
          repertorized ? " pb-accordion-sublist-row--has-grade" : ""
        }`}
      >
        <div className="d-flex align-items-center pb-accordion-sublist-entry">
          <span
            className="pb-accordion-sublist-label"
            title={rubricLabel}
            style={fontStyleObj}
          >
            {rubricLabel}
          </span>
          <div className="pb-accordion-sublist-chips-slot">
            <div
              className="pb-rubric-badges pb-rubric-badges--accordion"
              onClick={(e) => e.stopPropagation()}
            >
              {renderAccordionSublistIntensityChips(rubricData, currentIntensity, index)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRemedyAccordionSublist = (remedy) => {
    const remedyId = normalizeAccordionRemedyId(remedy.remedyId);
    const accordionState = accordionDataMap.get(remedyId);
    const selectedSectionSet = accordionState?.selectedSections;
    const availableSections = accordionState?.availableSections ?? [];
    const {
      filteredEntries,
      visibleEntries,
      totalLoadedCount,
      hasMoreEntries,
      isAtEnd,
    } = getAccordionSublistView(accordionState, repertorizeAccordionGlobalFilters);
    const isLoadingAccordion =
      !accordionState && repertorizarionRemedyForAccordionLoading;
    const hasGlobalSectionGradeFilter =
      repertorizeAccordionGlobalFilters.sectionIds.length > 0 ||
      repertorizeAccordionGlobalFilters.gradeId != null;
    const isLoadingMore =
      accordionLoadingMoreRemedyId === remedyId && repertorizarionRemedyForAccordionLoading;
    const isAccordionEmpty =
      !isLoadingAccordion && accordionState && filteredEntries.length === 0;

    if (isLoadingAccordion) {
      return (
        <div className="text-center p-2">
          <p className="text-muted small">Loading...</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <div className="search-box">
            <Input
              bsSize="sm"
              placeholder="Search rubrics..."
              value={accordionState?.searchTerm ?? ""}
              onChange={(e) => handleAccordionSearchChange(remedyId, e.target.value)}
            />
            <i className="ri-search-line search-icon" />
          </div>
        </div>

        {isKeynoteMethodActive && !hasGlobalSectionGradeFilter && availableSections.length > 0 && (
          <div className="mb-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              {availableSections.map((section) => {
                const isActive = selectedSectionSet?.has?.(section.value);
                return (
                  <span
                    key={section.value}
                    className={`badge rounded-pill ${isActive ? "bg-primary" : "bg-light text-dark border"} px-3 py-2`}
                    style={{ cursor: "pointer", fontSize: "11px" }}
                    onClick={() => handleToggleAccordionSectionFilter(remedyId, section.value)}
                  >
                    {section.label}
                    <span className="ms-1 text-muted">({section.count})</span>
                  </span>
                );
              })}
              {selectedSectionSet && selectedSectionSet.size > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={() => handleClearAccordionSectionFilter(remedyId)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className="custom-scrollbar"
          style={{ maxHeight: "220px", overflowY: "auto" }}
          onScroll={(event) => handleAccordionScroll(remedyId, event)}
        >
          {visibleEntries.length > 0 ? (
            visibleEntries.map((item, index) => renderAccordionSublistEntryRow(item, index))
          ) : (
            <div className="text-center p-2">
              <p className="text-muted small">
                {isAccordionEmpty
                  ? accordionState?.searchTerm
                    ? "No rubrics match your search"
                    : hasGlobalSectionGradeFilter
                      ? "No rubrics match selected section/grade"
                      : "No data available for selected sections"
                  : "No data available"}
              </p>
            </div>
          )}
        </div>

        {(hasMoreEntries || isAtEnd) && (
          <div className="text-center py-2 border-top mt-1">
            {hasMoreEntries ? (
              isLoadingMore ? (
                <small className="text-muted">Loading more…</small>
              ) : (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccordionLoadMore(remedyId);
                  }}
                >
                  Load more
                </button>
              )
            ) : (
              <small className="text-muted">
                End of list ({totalLoadedCount}{" "}
                {totalLoadedCount === 1 ? "rubric" : "rubrics"})
              </small>
            )}
          </div>
        )}
      </>
    );
  };

  // Handle delete rubric from repertorization
  const handleDeleteRepertorizationRubric = (rubricId) => {
    const isEliminationRubric = filledPyramidIcons.has(rubricId);
    setRepertorizationRubrics(prev => prev.filter(r => r.rubricId !== rubricId));
    if (isEliminationRubric) {
      setFilledPyramidIcons(new Set());
      dispatch(setEliminationDataList(null));
    }
  };

  const handleEliminationToggle = async (event, rubric) => {
    event.stopPropagation();

    const rubricId = rubric?.rubricId ?? rubric?.subsectionId ?? rubric?.subSectionId ?? null;
    if (!rubricId) {
      return;
    }

    const isAlreadySelected = filledPyramidIcons.has(rubricId);

    if (!isAlreadySelected) {
      dispatch(setDifferentialMateriaMedicaList(null));
    }

    if (isAlreadySelected) {
      setFilledPyramidIcons(new Set());
      dispatch(setEliminationDataList(null));
      dispatch(setDifferentialMateriaMedicaList(null));
      return;
    }

    setFilledPyramidIcons(new Set([rubricId]));
    dispatch(setEliminationDataList(null));

    const withoutEliminateRubric = (repertorizationRubrics || []).map(item => ({
      subsectionId: item.rubricId,
      intensity: item.intensityNo
    }));

    const withEliminateRubric = [{
      subSectionId: rubricId,
      intensity: rubric.intensityNo,
      rubriccount: rubric.remedyCount ?? 0
    }];

    const requestParams = {
      withoutEliminateRubric: withoutEliminateRubric,
      withEliminateRubric: withEliminateRubric
    };

    try {
      const response = await dispatch(getEliminationData(requestParams));

      const responseRemedyData = resolveRemedyLists(response);
      const fallbackRemedyData = responseRemedyData ?? {
        common: [],
        uncommon: []
      };

      const sourceRemedies = differentialMainTab === 'COMMON'
        ? fallbackRemedyData.common
        : fallbackRemedyData.uncommon;

      const remedyIndexModelList = buildRemedyIndexModelList(sourceRemedies);

      if (
        selectedDifferentialAuthorId &&
        Array.isArray(differentialMateriaMedicaHeadIds) &&
        differentialMateriaMedicaHeadIds.length > 0 &&
        remedyIndexModelList.length > 0
      ) {
        dispatch(getDifferentialMateriaMedica({
          authorId: selectedDifferentialAuthorId,
          materiaMedicaHeadIds: differentialMateriaMedicaHeadIds,
          remedyIndexModelList: remedyIndexModelList
        }));
      } else if (remedyIndexModelList.length === 0) {
        dispatch(setDifferentialMateriaMedicaList(null));
      }
    } catch (error) {
      console.error('Error fetching elimination data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch elimination data. Please try again.',
        confirmButtonColor: '#000000'
      });
      setFilledPyramidIcons(new Set());
      dispatch(setEliminationDataList(null));
    }
  };

  // Handle move rubric up in repertorization list
  const handleMoveRubricUp = (index) => {
    if (index === 0) return;
    const updatedRubrics = [...repertorizationRubrics];
    [updatedRubrics[index - 1], updatedRubrics[index]] = [updatedRubrics[index], updatedRubrics[index - 1]];
    setRepertorizationRubrics(updatedRubrics);
  };

  // Handle move rubric down in repertorization list
  const handleMoveRubricDown = (index) => {
    if (index === repertorizationRubrics.length - 1) return;
    const updatedRubrics = [...repertorizationRubrics];
    [updatedRubrics[index], updatedRubrics[index + 1]] = [updatedRubrics[index + 1], updatedRubrics[index]];
    setRepertorizationRubrics(updatedRubrics);
  };

  const mergeSectionRubricsIntoRepertorization = useCallback(
    async (currentRubrics, sectionIds, intensityNo) => {
      if (!sectionIds?.length || intensityNo == null) {
        return currentRubrics;
      }

      const requiredType = isKeynoteMethodActive ? "KolkattaKeynoteMethod" : "SmallRubric";
      const intensity =
        intensitiesForPatientList?.find((item) => item.intensityNo === intensityNo) || {
          intensityNo: intensityNo,
          intensityId: intensityNo,
        };

      const collected = [];
      for (const sectionId of sectionIds) {
        try {
          const response = await getRepertorizarionRemedyForAccordionApi({
            SectionId: sectionId,
            sectionId,
            GradeId: intensityNo,
            Intensity: intensityNo,
            RequiredType: requiredType,
            PageNumber: 1,
            PageSize: 500,
          });
          collected.push(...extractAccordionEntries(response));
        } catch (error) {
          console.error("Failed to load rubrics for section", sectionId, error);
        }
      }

      if (collected.length === 0) {
        return currentRubrics;
      }

      const next = [...(currentRubrics || [])];
      collected.forEach((item) => {
        const rubricData = mapAccordionEntryToRubricData(item);
        const rubricId = rubricData.rubricId;
        if (!rubricId) {
          return;
        }

        const entry = {
          rubricId,
          rubricName: rubricData.rubricName || rubricData.subSectionName,
          intensityNo: intensity.intensityNo,
          intensityId: intensity.intensityId,
          remedyCount: rubricData.remedyCount || 0,
          sectionId: item?.sectionId ?? item?.SectionId ?? sectionIds[0] ?? null,
        };

        const existingIndex = next.findIndex((r) => r.rubricId === rubricId);
        if (existingIndex !== -1) {
          next[existingIndex] = { ...next[existingIndex], ...entry };
        } else if (next.length < 20) {
          next.push(entry);
        }
      });

      return next;
    },
    [isKeynoteMethodActive, intensitiesForPatientList]
  );

  const handleRepertorizeSectionCheckboxChange = useCallback(
    (sectionId, checked) => {
      if (!isKeynoteMethodActive && !isSmallRubricsActive) {
        return;
      }

      setSelectedRepertorizeSectionIds((prev) => {
        const next = new Set(prev.map(Number));
        if (checked) {
          next.add(Number(sectionId));
        } else {
          next.delete(Number(sectionId));
        }
        const nextSectionIds = Array.from(next);
        if (nextSectionIds.length === 0) {
          setSelectedRepertorizeIntensity(null);
        }
        return nextSectionIds;
      });
    },
    [isKeynoteMethodActive, isSmallRubricsActive]
  );

  const handleRepertorizeSectionIntensityClick = useCallback(
    (intensityNo) => {
      if (!isKeynoteMethodActive && !isSmallRubricsActive) {
        return;
      }
      if (selectedRepertorizeSectionIds.length === 0) {
        return;
      }

      setSelectedRepertorizeIntensity((prev) => (prev === intensityNo ? null : intensityNo));
    },
    [isKeynoteMethodActive, isSmallRubricsActive, selectedRepertorizeSectionIds.length]
  );

  // Handle Keynote Method button click
  const handleKeynoteMethodClick = () => {
    const newState = !isKeynoteMethodActive;
    setIsKeynoteMethodActive(newState);
    if (newState) {
      setIsSmallRubricsActive(false);
    }
    clearRepertorizeSectionFilters();
    resetRepertorizeAccordionExpansion();
  };

  // Handle Small Rubrics button click
  const handleSmallRubricClick = () => {
    const newState = !isSmallRubricsActive;
    setIsSmallRubricsActive(newState);
    if (newState) {
      setIsKeynoteMethodActive(false);
    }
    clearRepertorizeSectionFilters();
    resetRepertorizeAccordionExpansion();
  };

  // ###### Dj UI Code Start - Reset Handler for Common and Uncommon Cards ######
  // Reset handler
  const handleReset = () => {
    setIsKeynoteMethodActive(false);
    setIsSmallRubricsActive(false);
    clearRepertorizeSectionFilters();
    resetRepertorizeAccordionExpansion();
  };
  // ###### Dj UI Code End - Reset Handler for Common and Uncommon Cards ######

  const fetchAccordionData = useCallback(
    (remedyId, { pageNumber = 1, append = false, searchTerm = "" } = {}) => {
      const normalizedRemedyId = normalizeAccordionRemedyId(remedyId);
      const requiredType = isKeynoteMethodActive ? "KolkattaKeynoteMethod" : "SmallRubric";
      const requestData = {
        remedyID: normalizedRemedyId,
        RequiredType: requiredType,
        PageNumber: pageNumber,
        PageSize: ACCORDION_PAGE_SIZE,
      };

      const trimmedSearch = (searchTerm || "").trim();
      if (trimmedSearch) {
        requestData.SearchTerm = trimmedSearch;
      }

      lastAccordionRequestRef.current = {
        remedyId: normalizedRemedyId,
        pageNumber,
        append,
      };
      setLastRequestedRemedyId(normalizedRemedyId);
      if (append) {
        setAccordionLoadingMoreRemedyId(normalizedRemedyId);
      } else {
        dispatch(setRepertorizarionRemedyForAccordionList(null));
      }
      dispatch(getRepertorizarionRemedyForAccordion(requestData));
    },
    [dispatch, isKeynoteMethodActive]
  );

  const handleAccordionLoadMore = useCallback(
    (remedyId) => {
      const normalizedRemedyId = normalizeAccordionRemedyId(remedyId);
      const currentState = accordionDataMap.get(normalizedRemedyId);
      if (!currentState) {
        return;
      }

      const sublistView = getAccordionSublistView(currentState, repertorizeAccordionGlobalFilters);

      if (currentState.visibleCount < sublistView.filteredEntries.length) {
        setAccordionDataMap((prevMap) => {
          const state = prevMap.get(normalizedRemedyId);
          if (!state) {
            return prevMap;
          }
          const filtered = getAccordionFilteredEntriesFromState(state, repertorizeAccordionGlobalFilters);
          const newMap = new Map(prevMap);
          newMap.set(normalizedRemedyId, {
            ...state,
            visibleCount: Math.min(
              filtered.length,
              state.visibleCount + ACCORDION_PAGE_SIZE
            ),
          });
          return newMap;
        });
        return;
      }

      if (
        computeAccordionHasMoreServer(currentState) &&
        !repertorizarionRemedyForAccordionLoading &&
        accordionLoadingMoreRemedyId !== normalizedRemedyId
      ) {
        fetchAccordionData(normalizedRemedyId, {
          pageNumber: (currentState.pageNumber ?? 1) + 1,
          append: true,
          searchTerm: currentState.searchTerm,
        });
      }
    },
    [
      accordionDataMap,
      accordionLoadingMoreRemedyId,
      fetchAccordionData,
      repertorizarionRemedyForAccordionLoading,
      repertorizeAccordionGlobalFilters,
    ]
  );

  const handleAccordionScroll = useCallback(
    (remedyId, event) => {
      const target = event?.target;
      if (!target) {
        return;
      }

      if (target.scrollTop + target.clientHeight < target.scrollHeight - 12) {
        return;
      }

      handleAccordionLoadMore(remedyId);
    },
    [handleAccordionLoadMore]
  );

  const handleAccordionSearchChange = useCallback(
    (remedyId, value) => {
      setAccordionDataMap((prevMap) => {
        const currentState = prevMap.get(remedyId);
        if (!currentState) {
          return prevMap;
        }
        const newMap = new Map(prevMap);
        newMap.set(remedyId, {
          ...currentState,
          searchTerm: value,
          visibleCount: ACCORDION_PAGE_SIZE,
        });
        return newMap;
      });

      if (accordionSearchDebounceRef.current) {
        clearTimeout(accordionSearchDebounceRef.current);
      }

      accordionSearchDebounceRef.current = setTimeout(() => {
        fetchAccordionData(remedyId, {
          pageNumber: 1,
          append: false,
          searchTerm: value,
        });
      }, 400);
    },
    [fetchAccordionData]
  );

  // ###### Dj UI Code Start - Handle Accordion Item Click ######
  const handleRemedyAccordionClick = async (remedy, isCommon) => {
    if (!isKeynoteMethodActive && !isSmallRubricsActive) {
      setSelectedRemedyFromCommonUncommon(remedy);
      return;
    }

    const remedyId = normalizeAccordionRemedyId(remedy.remedyId);
    const setExpandedItems = isCommon ? setExpandedCommonItems : setExpandedUncommonItems;
    const expandedItems = isCommon ? expandedCommonItems : expandedUncommonItems;

    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(remedyId)) {
      newExpanded.delete(remedyId);
    } else {
      newExpanded.add(remedyId);

      if (!accordionDataMap.has(remedyId)) {
        fetchAccordionData(remedyId, { pageNumber: 1, append: false, searchTerm: "" });
      }
    }
    setExpandedItems(newExpanded);
  };
  // ###### Dj UI Code End - Handle Accordion Item Click ######

  const handleToggleAccordionSectionFilter = useCallback((remedyId, sectionValue) => {
    setAccordionDataMap(prevMap => {
      const currentState = prevMap.get(remedyId);
      if (!currentState) {
        return prevMap;
      }

      const updatedSelectedSections = new Set(currentState.selectedSections ?? []);
      if (updatedSelectedSections.has(sectionValue)) {
        updatedSelectedSections.delete(sectionValue);
      } else {
        updatedSelectedSections.add(sectionValue);
      }

      const filteredEntries = getAccordionFilteredEntriesFromState({
        ...currentState,
        selectedSections: updatedSelectedSections,
      });
      const baselineVisibleTarget =
        updatedSelectedSections.size === 0
          ? Math.max(currentState.visibleCount, ACCORDION_PAGE_SIZE)
          : ACCORDION_PAGE_SIZE;
      const nextVisibleCount = Math.min(filteredEntries.length, baselineVisibleTarget);

      const newMap = new Map(prevMap);
      newMap.set(remedyId, {
        ...currentState,
        selectedSections: updatedSelectedSections,
        visibleCount: nextVisibleCount
      });
      return newMap;
    });
  }, []);

  const handleClearAccordionSectionFilter = useCallback((remedyId) => {
    setAccordionDataMap(prevMap => {
      const currentState = prevMap.get(remedyId);
      if (!currentState || !currentState.selectedSections || currentState.selectedSections.size === 0) {
        return prevMap;
      }

      const filteredEntries = getAccordionFilteredEntriesFromState({
        ...currentState,
        selectedSections: new Set(),
      });
      const nextVisibleCount = Math.min(
        filteredEntries.length,
        Math.max(currentState.visibleCount, ACCORDION_PAGE_SIZE)
      );

      const newMap = new Map(prevMap);
      newMap.set(remedyId, {
        ...currentState,
        selectedSections: new Set(),
        visibleCount: nextVisibleCount
      });
      return newMap;
    });
  }, []);

  // Store accordion data only after the matching API request finishes
  useEffect(() => {
    if (repertorizarionRemedyForAccordionLoading) {
      return;
    }

    const { remedyId, append } = lastAccordionRequestRef.current || {};
    if (!remedyId || !repertorizarionRemedyForAccordionList) {
      return;
    }

    setAccordionDataMap((prevMap) => {
      const newMap = new Map(prevMap);
      const previousState = prevMap.get(remedyId);
      newMap.set(
        remedyId,
        buildAccordionStateObject(repertorizarionRemedyForAccordionList, previousState, {
          append,
        })
      );
      return newMap;
    });
    lastAccordionRequestRef.current = { remedyId: null, pageNumber: 1, append: false };
    setLastRequestedRemedyId(null);
    setAccordionLoadingMoreRemedyId(null);
  }, [repertorizarionRemedyForAccordionList, repertorizarionRemedyForAccordionLoading]);

  // Update question groups map when API response arrives
  useEffect(() => {
    const { seq, sectionId } = activeGroupFetchRef.current;
    if (!sectionId || seq !== groupFetchSeqRef.current || !Array.isArray(questionGroupByExistanceId)) {
      return;
    }

    const groups = questionGroupByExistanceId
      .map(mapQuestionGroupFromApi)
      .filter((group) => group.id != null && group.name);

    setQuestionGroupsMap((prev) => ({
      ...prev,
      [sectionId]: groups,
    }));
    setQuestionGroupsLoadingSectionId(null);
  }, [questionGroupByExistanceId]);

  // Update question sub-groups map when API response arrives
  useEffect(() => {
    const { seq, key } = activeSubGroupFetchRef.current;
    if (!key || seq !== subGroupFetchSeqRef.current || !Array.isArray(questionSubSectionDDLByQGIDQSID)) {
      return;
    }

    const subGroups = questionSubSectionDDLByQGIDQSID
      .map(mapQuestionSubGroupFromApi)
      .filter((subGroup) => subGroup.id != null && subGroup.name);

    setQuestionSubGroupsMap((prev) => ({
      ...prev,
      [key]: subGroups,
    }));
    setQuestionSubGroupsLoadingKey(null);
  }, [questionSubSectionDDLByQGIDQSID]);

  const getInfoTooltipRubricName = () =>
    rubricDetailsList?.subSectionName
    ?? rubricDetailsList?.SubSectionName
    ?? repertoryRubricDetailsHeader?.name
    ?? selectedQuestionRubric?.subsectionName
    ?? selectedQuestionRubric?.subSectionName
    ?? rubricDetailsList?.subSectionName
    ?? 'Rubric Name';

  const getRemedyTooltipBadgeLabel = (remedy) => {
    if (!remedy) {
      return 'Remedy';
    }
    const display = getRemedyListDisplay(remedy);
    const parts = [display.name];
    if (display.aliasBracket) {
      parts.push(display.aliasBracket);
    }
    if (display.score != null && display.score !== '') {
      parts.push(`[${display.score}]`);
    }
    return parts.filter(Boolean).join(' ').trim() || remedy?.remedyName || 'Remedy';
  };

  const getRemedyInfoTooltipTitle = (remedy) => {
    const remedyName = String(remedy?.remedyName ?? remedy?.RemedyName ?? '').trim();
    return remedyName || getRemedyTooltipBadgeLabel(remedy);
  };

  const formatInfoTooltipSection = (value) =>
    value != null && String(value).trim() !== '' ? ReactHtmlParser(String(value)) : 'No data found.';

  const renderInfoTooltipPopupContent = (remedyOverride = null, { useRemedyName = false, useRemedyInfoTitle = false } = {}) => {
    const remedy = remedyOverride ?? hoveredRemedyInfo;
    const badgeLabel = useRemedyInfoTitle
      ? getRemedyInfoTooltipTitle(remedy)
      : useRemedyName
        ? getRemedyTooltipBadgeLabel(remedy)
        : getInfoTooltipRubricName();

    return (
      <>
        <div className="info-tooltip-rubric-badge-wrap">
          <span className="info-tooltip-rubric-badge" title={badgeLabel}>
            {badgeLabel}
          </span>
        </div>
        <div className="info-tooltip__sections">
          <div className="section section-themes">
            <div className="section-title">Themes/Characteristics :</div>
            <div className="text-muted info-tooltip__section-body">{formatInfoTooltipSection(remedy?.themesOrCharacteristics ?? remedy?.themes)}</div>
          </div>
          <div className="section section-generals">
            <div className="section-title">Generals :</div>
            <div className="text-muted info-tooltip__section-body">{formatInfoTooltipSection(remedy?.generals)}</div>
          </div>
          <div className="section section-modalities">
            <div className="section-title">Modalities :</div>
            <div className="text-muted info-tooltip__section-body">{formatInfoTooltipSection(remedy?.modalities)}</div>
          </div>
          <div className="section section-particulars mb-0">
            <div className="section-title">Particulars :</div>
            <div className="text-muted info-tooltip__section-body">{formatInfoTooltipSection(remedy?.particulars)}</div>
          </div>
        </div>
      </>
    );
  };

  const renderInfoTooltipPopup = (remedyOverride = null, { interactive = false } = {}) => (
    <div className={`info-tooltip custom-scrollbar${interactive ? ' info-tooltip--interactive' : ''}`} role="tooltip">
      {renderInfoTooltipPopupContent(remedyOverride)}
    </div>
  );

  const renderRemedyInfoTooltip = () => {
    if (!hoveredRemedyInfo || typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <div
        className="info-tooltip custom-scrollbar info-tooltip--interactive"
        role="tooltip"
        onMouseEnter={() => {
          if (remedyInfoTooltipTimeoutRef.current) {
            clearTimeout(remedyInfoTooltipTimeoutRef.current);
          }
        }}
        onMouseLeave={handleRemedyInfoLeave}
      >
        {renderInfoTooltipPopupContent(hoveredRemedyInfo, { useRemedyInfoTitle: true })}
      </div>,
      document.body
    );
  };

  const renderRemedyAbbrevTooltip = () => {
    if (!hoveredRemedyAbbrev || typeof document === 'undefined') {
      return null;
    }

    return createPortal(
      <div
        className="info-tooltip custom-scrollbar info-tooltip--interactive"
        role="tooltip"
        onMouseEnter={() => {
          if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
          }
        }}
        onMouseLeave={handleRemedyAbbrevLeave}
      >
        {renderInfoTooltipPopupContent(hoveredRemedyAbbrev, { useRemedyName: true })}
      </div>,
      document.body
    );
  };

  // Repertory global search drives SUB SECTION results (replaces old rubric dropdown).
  const sectionOptions = useMemo(() => {
    if (!Array.isArray(accumulatedSections) || accumulatedSections.length === 0) {
      return [];
    }
    return accumulatedSections.map((section) => ({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      sectionAlias: section.sectionAlias,
    }));
  }, [accumulatedSections]);

  // Clinical Pattern options
  const clinicalPatternOptions = useMemo(() => {
    if (!diagnosisForClinicalPatternList || !Array.isArray(diagnosisForClinicalPatternList)) {
      return [];
    }
    return diagnosisForClinicalPatternList.map((diagnosis) => ({
      value: diagnosis.diagnosisID,
      label: diagnosis.diagnosisName,
      details: diagnosis.diagnosisName, // You can add more details if needed
      category: diagnosis.category || 'General' // Add category if available in API response
    }));
  }, [diagnosisForClinicalPatternList]);

  // Sub-section options from Redux state
  const subSectionOptions = useMemo(() => {
    if (subSectionList && subSectionList.resultObject && Array.isArray(subSectionList.resultObject)) {
      return subSectionList.resultObject.map(subSection => ({
        subSectionId: subSection.subSectionId,
        subSectionName: subSection.subSectionName,
        subSectionNameAlias: subSection.subSectionNameAlias
      }));
    }
    return [];
  }, [subSectionList]);

  // Old dummy data - keeping for reference
  const _oldSubSectionOptions = useMemo(() => {
    return [
      'Sub-section 1',
      'Sub-section 2',
      'Sub-section 3',
      'Sub-section 4',
      'Sub-section 5',
      'Sub-section 6',
      'Sub-section 7',
      'Sub-section 8',
      'Sub-section 9',
      'Sub-section 10',
      'Sub-section 11',
      'Sub-section 12',
      'Sub-section 13',
      'Sub-section 14',
      'Sub-section 15',
      'Sub-section 16',
      'Sub-section 17',
      'Sub-section 18',
      'Sub-section 19',
      'Sub-section 20'
    ];
  }, []);

  // No frontend filtering or pagination - API handles both
  const filteredSubSections = subSectionOptions;
  const paginatedSubSectionOptions = subSectionOptions;
  const totalSubSectionPages = Math.ceil((subSectionList?.totalCount || 0) / subSectionPageSize);

  const normalizeSubSectionSearchApiResults = (response) => (
    Array.isArray(response) ? response : (response?.data || response?.resultObject || [])
  );

  const applySubSectionSearchResultsToTree = (results) => {
    const { treeData, childrenMap, expandedIds } = buildSubSectionSearchTree(results);
    setSubSectionTreeData(treeData);
    setSubSectionChildrenMap(childrenMap);
    setExpandedSubSections(expandedIds);
  };

  const restoreBaselineSubSectionTree = () => {
    const baseline = baselineSubSectionStateRef.current;
    if (baseline.treeData.length > 0) {
      setSubSectionTreeData(baseline.treeData);
      setSubSectionChildrenMap(new Map(baseline.childrenMap));
      setExpandedSubSections(new Set(baseline.expanded));
    } else {
      setSubSectionTreeData([]);
      setSubSectionChildrenMap(new Map());
      setExpandedSubSections(new Set());
    }
  };

  const clearSubSectionLocalSearch = useCallback(() => {
    subSectionSearchRequestRef.current += 1;
    setSubSectionSearch('');
    setSubSectionSearchResults([]);
    setSubSectionSearchTreeResults([]);
    setSubSectionSearchTreePage(1);
    setSubSectionSearchTreeHasMore(false);
    setSubSectionSearchTreeLoading(false);
    setSubSectionSearchTreeLoadingMore(false);
    setIsSubSectionSearchActive(false);
    setShowSubSectionSuggestions(false);
  }, []);

  const clearGlobalSubSectionSearch = useCallback(() => {
    globalSubSectionSearchRequestRef.current += 1;
    setGlobalSubSectionSearch('');
    setGlobalSubSectionSearchResults([]);
    setGlobalSubSectionSearchTreeResults([]);
    setGlobalSubSectionSearchTreePage(1);
    setGlobalSubSectionSearchTreeHasMore(false);
    setGlobalSubSectionSearchTreeLoadingMore(false);
    setIsGlobalSubSectionSearchActive(false);
    setShowGlobalSubSectionSuggestions(false);
    setGlobalSubSectionSearchLoading(false);
  }, []);

  const handleRepertoryGlobalSearchChange = (value) => {
    if (value.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH) {
      if (subSectionSearch.trim().length > 0 || isSubSectionSearchActive) {
        clearSubSectionLocalSearch();
      }
      setShowGlobalSubSectionSuggestions(true);
      setShowSubSectionSuggestions(false);
    } else {
      setShowGlobalSubSectionSuggestions(false);
      setIsGlobalSubSectionSearchActive(false);
      setGlobalSubSectionSearchResults([]);
      if (subSectionSearch.trim().length < MIN_SUBSECTION_SEARCH_LENGTH) {
        restoreBaselineSubSectionTree();
      }
    }
    setGlobalSubSectionSearch(value);
  };

  const handleSubSectionSearchChange = (value) => {
    if (value.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH) {
      if (globalSubSectionSearch.trim().length > 0 || isGlobalSubSectionSearchActive) {
        clearGlobalSubSectionSearch();
        restoreBaselineSubSectionTree();
      }
      setShowSubSectionSuggestions(true);
      setShowGlobalSubSectionSuggestions(false);
    } else {
      setShowSubSectionSuggestions(false);
      setIsSubSectionSearchActive(false);
      setSubSectionSearchResults([]);
      if (globalSubSectionSearch.trim().length < MIN_SUBSECTION_SEARCH_LENGTH) {
        restoreBaselineSubSectionTree();
      }
    }
    setSubSectionSearch(value);
  };

  // Handle repertory selection (legacy session field)
  const handleRepertorySelect = (selectedOption) => {
    setSelectedRepertoryOption(selectedOption);
  };

  // Handle section selection
  const handleSectionSelect = async (section) => {
    console.log('Section selected:', section);
    setSelectedSection(section);
    setSubSectionPageNumber(1); // Reset to first page when changing section
    setSubSectionTreeData([]);
    setExpandedSubSections(new Set());
    setSubSectionChildrenMap(new Map());
    clearRepertoryRubricDetails({ clearSelection: true });
    cancelPendingPrefetches();
    setSubSectionSearch('');
    setSubSectionSearchResults([]);
    setSubSectionSearchTreeResults([]);
    setSubSectionSearchTreePage(1);
    setSubSectionSearchTreeHasMore(false);
    setSubSectionSearchTreeLoading(false);
    setSubSectionSearchTreeLoadingMore(false);
    setIsSubSectionSearchActive(false);
    setShowSubSectionSuggestions(false);
    setGlobalSubSectionSearch('');
    setGlobalSubSectionSearchResults([]);
    setGlobalSubSectionSearchTreeResults([]);
    setGlobalSubSectionSearchTreePage(1);
    setGlobalSubSectionSearchTreeHasMore(false);
    setGlobalSubSectionSearchTreeLoadingMore(false);
    setIsGlobalSubSectionSearchActive(false);
    setShowGlobalSubSectionSuggestions(false);
    baselineSubSectionStateRef.current = {
      treeData: [],
      childrenMap: new Map(),
      expanded: new Set(),
    };

    // Load subsections for the selected section using new API
    if (section && section.sectionId) {
      setSubSectionTreeLoading(true);
      try {
        const response = await getMainParentSubSectionsWithChildCount(section.sectionId);
        let nextTreeData = [];
        if (response && Array.isArray(response)) {
          nextTreeData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          nextTreeData = response.data;
        } else if (response?.resultObject && Array.isArray(response.resultObject)) {
          nextTreeData = response.resultObject;
        }
        setSubSectionTreeData(nextTreeData);
        baselineSubSectionStateRef.current = {
          treeData: nextTreeData,
          childrenMap: new Map(),
          expanded: new Set(),
        };
      } catch (error) {
        console.error('Error fetching subsections:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch subsections' });
        setSubSectionTreeData([]);
      } finally {
        setSubSectionTreeLoading(false);
      }
    }
  };

  useEffect(() => {
    const term = globalSubSectionSearch.trim();
    if (term.length < MIN_SUBSECTION_SEARCH_LENGTH) {
      setGlobalSubSectionSearchLoading(false);
      return undefined;
    }

    const requestId = globalSubSectionSearchRequestRef.current + 1;
    globalSubSectionSearchRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      setGlobalSubSectionSearchLoading(true);
      try {
        const [suggestionsResponse, treeResponse] = await Promise.all([
          searchSubSectionsGlobal({
            query: term,
            top: SUBSECTION_SEARCH_TOP,
          }),
          searchSubSectionsGlobalPaged({
            query: term,
            pageNumber: 1,
            pageSize: SUBSECTION_TREE_PAGE_SIZE,
          }),
        ]);

        if (requestId !== globalSubSectionSearchRequestRef.current) {
          return;
        }

        const results = normalizeSubSectionSearchApiResults(suggestionsResponse);
        const pagedTree = normalizeSubSectionSearchPagedResponse(treeResponse);

        setGlobalSubSectionSearchResults(results);
        setGlobalSubSectionSearchTreeResults(pagedTree.items);
        setGlobalSubSectionSearchTreePage(pagedTree.pageNumber);
        setGlobalSubSectionSearchTreeHasMore(pagedTree.hasMore);
        setIsGlobalSubSectionSearchActive(true);
        setShowGlobalSubSectionSuggestions(true);
        applySubSectionSearchResultsToTree(pagedTree.items);
      } catch (error) {
        if (requestId === globalSubSectionSearchRequestRef.current) {
          console.error('Error in global subsection search:', error);
          setGlobalSubSectionSearchResults([]);
          setGlobalSubSectionSearchTreeResults([]);
          setGlobalSubSectionSearchTreeHasMore(false);
          setIsGlobalSubSectionSearchActive(false);
          setShowGlobalSubSectionSuggestions(false);
          Swal.fire({
            icon: 'error',
            title: 'Search failed',
            text: 'Global subsection search timed out or failed. Please ensure SearchNormalized is configured on the server, or try a more specific term.',
          });
        }
      } finally {
        if (requestId === globalSubSectionSearchRequestRef.current) {
          setGlobalSubSectionSearchLoading(false);
          if (globalSubSectionSearchFocusedRef.current && globalSubSectionSearchInputRef.current) {
            requestAnimationFrame(() => {
              globalSubSectionSearchInputRef.current?.focus({ preventScroll: true });
            });
          }
        }
      }
    }, SUBSECTION_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [globalSubSectionSearch]);

  useEffect(() => {
    const term = subSectionSearch.trim();
    if (globalSubSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH) {
      return undefined;
    }

    if (!selectedSection?.sectionId || term.length < MIN_SUBSECTION_SEARCH_LENGTH) {
      setIsSubSectionSearchActive(false);
      setSubSectionSearchResults([]);
      setShowSubSectionSuggestions(false);

      if (!isGlobalSubSectionSearchActive) {
        restoreBaselineSubSectionTree();
      }
      return undefined;
    }

    const requestId = subSectionSearchRequestRef.current + 1;
    subSectionSearchRequestRef.current = requestId;

    const timer = setTimeout(async () => {
      setSubSectionSearchTreeLoading(true);
      try {
        const [suggestionsResponse, treeResponse] = await Promise.all([
          searchSubSectionsBySection({
            sectionId: selectedSection.sectionId,
            query: term,
            top: SUBSECTION_SEARCH_TOP,
          }),
          searchSubSectionsBySectionPaged({
            sectionId: selectedSection.sectionId,
            query: term,
            pageNumber: 1,
            pageSize: SUBSECTION_TREE_PAGE_SIZE,
          }),
        ]);

        if (requestId !== subSectionSearchRequestRef.current) {
          return;
        }

        const results = normalizeSubSectionSearchApiResults(suggestionsResponse);
        const pagedTree = normalizeSubSectionSearchPagedResponse(treeResponse);

        setSubSectionSearchResults(results);
        setSubSectionSearchTreeResults(pagedTree.items);
        setSubSectionSearchTreePage(pagedTree.pageNumber);
        setSubSectionSearchTreeHasMore(pagedTree.hasMore);
        setIsSubSectionSearchActive(true);
        setShowSubSectionSuggestions(true);
        applySubSectionSearchResultsToTree(pagedTree.items);
      } catch (error) {
        if (requestId === subSectionSearchRequestRef.current) {
          console.error('Error searching subsections:', error);
          setSubSectionSearchResults([]);
          setSubSectionSearchTreeResults([]);
          setSubSectionSearchTreeHasMore(false);
        }
      } finally {
        if (requestId === subSectionSearchRequestRef.current) {
          setSubSectionSearchTreeLoading(false);
        }
      }
    }, SUBSECTION_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [subSectionSearch, selectedSection?.sectionId, globalSubSectionSearch, isGlobalSubSectionSearchActive]);

  const subSectionSearchSuggestions = useMemo(
    () => getSubSectionSearchSuggestions(subSectionSearchResults, SUBSECTION_SUGGESTION_DISPLAY),
    [subSectionSearchResults]
  );

  const globalSubSectionSearchSuggestions = useMemo(
    () => getSubSectionSearchSuggestions(globalSubSectionSearchResults, SUBSECTION_SUGGESTION_DISPLAY),
    [globalSubSectionSearchResults]
  );

  const loadMoreGlobalSubSectionSearchTree = useCallback(async () => {
    const term = globalSubSectionSearch.trim();
    if (
      term.length < MIN_SUBSECTION_SEARCH_LENGTH
      || !globalSubSectionSearchTreeHasMore
      || globalSubSectionSearchTreeLoadingMore
      || globalSubSectionSearchLoading
    ) {
      return;
    }

    const requestId = globalSubSectionSearchRequestRef.current;
    const nextPage = globalSubSectionSearchTreePage + 1;

    setGlobalSubSectionSearchTreeLoadingMore(true);
    try {
      const response = await searchSubSectionsGlobalPaged({
        query: term,
        pageNumber: nextPage,
        pageSize: SUBSECTION_TREE_PAGE_SIZE,
      });

      if (requestId !== globalSubSectionSearchRequestRef.current) {
        return;
      }

      const pagedTree = normalizeSubSectionSearchPagedResponse(response);
      const mergedResults = mergeSubSectionSearchResultPages(
        globalSubSectionSearchTreeResults,
        pagedTree.items
      );

      setGlobalSubSectionSearchTreeResults(mergedResults);
      setGlobalSubSectionSearchTreePage(pagedTree.pageNumber);
      setGlobalSubSectionSearchTreeHasMore(pagedTree.hasMore);
      applySubSectionSearchResultsToTree(mergedResults);
    } catch (error) {
      console.error('Error loading more global subsection search results:', error);
    } finally {
      if (requestId === globalSubSectionSearchRequestRef.current) {
        setGlobalSubSectionSearchTreeLoadingMore(false);
      }
    }
  }, [
    globalSubSectionSearch,
    globalSubSectionSearchTreeHasMore,
    globalSubSectionSearchTreeLoadingMore,
    globalSubSectionSearchLoading,
    globalSubSectionSearchTreePage,
    globalSubSectionSearchTreeResults,
  ]);

  const loadMoreSectionSubSectionSearchTree = useCallback(async () => {
    const term = subSectionSearch.trim();
    if (
      !selectedSection?.sectionId
      || term.length < MIN_SUBSECTION_SEARCH_LENGTH
      || !subSectionSearchTreeHasMore
      || subSectionSearchTreeLoadingMore
      || subSectionSearchTreeLoading
    ) {
      return;
    }

    const requestId = subSectionSearchRequestRef.current;
    const nextPage = subSectionSearchTreePage + 1;

    setSubSectionSearchTreeLoadingMore(true);
    try {
      const response = await searchSubSectionsBySectionPaged({
        sectionId: selectedSection.sectionId,
        query: term,
        pageNumber: nextPage,
        pageSize: SUBSECTION_TREE_PAGE_SIZE,
      });

      if (requestId !== subSectionSearchRequestRef.current) {
        return;
      }

      const pagedTree = normalizeSubSectionSearchPagedResponse(response);
      const mergedResults = mergeSubSectionSearchResultPages(
        subSectionSearchTreeResults,
        pagedTree.items
      );

      setSubSectionSearchTreeResults(mergedResults);
      setSubSectionSearchTreePage(pagedTree.pageNumber);
      setSubSectionSearchTreeHasMore(pagedTree.hasMore);
      applySubSectionSearchResultsToTree(mergedResults);
    } catch (error) {
      console.error('Error loading more section subsection search results:', error);
    } finally {
      if (requestId === subSectionSearchRequestRef.current) {
        setSubSectionSearchTreeLoadingMore(false);
      }
    }
  }, [
    subSectionSearch,
    selectedSection?.sectionId,
    subSectionSearchTreeHasMore,
    subSectionSearchTreeLoadingMore,
    subSectionSearchTreeLoading,
    subSectionSearchTreePage,
    subSectionSearchTreeResults,
  ]);

  const handleSubSectionTreeScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) return;

    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
    if (!nearBottom) return;

    if (isGlobalSubSectionSearchActive && globalSubSectionSearchTreeHasMore) {
      loadMoreGlobalSubSectionSearchTree();
      return;
    }

    if (isSubSectionSearchActive && subSectionSearchTreeHasMore) {
      loadMoreSectionSubSectionSearchTree();
    }
  }, [
    isGlobalSubSectionSearchActive,
    globalSubSectionSearchTreeHasMore,
    loadMoreGlobalSubSectionSearchTree,
    isSubSectionSearchActive,
    subSectionSearchTreeHasMore,
    loadMoreSectionSubSectionSearchTree,
  ]);

  const isGlobalSubSectionSearchMode = globalSubSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH
    || isGlobalSubSectionSearchActive;
  const isSectionSubSectionSearchMode = Boolean(selectedSection?.sectionId)
    && subSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH;
  const showSubSectionSelectHint = !selectedSection?.sectionId && subSectionSearch.trim().length > 0;

  const updateSubSectionSuggestionPosition = useCallback(() => {
    const anchor = subSectionSearchAnchorRef.current;
    if (!anchor || typeof window === 'undefined') return null;
    return getSubSectionSuggestionDropdownLayout(anchor.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!showSubSectionSuggestions) {
      setSubSectionDropdownLayout(null);
      return undefined;
    }

    const syncLayout = () => {
      const layout = updateSubSectionSuggestionPosition();
      if (layout) {
        setSubSectionDropdownLayout(layout);
      }
    };

    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, [
    showSubSectionSuggestions,
    subSectionSearchSuggestions,
    subSectionSearch,
    updateSubSectionSuggestionPosition,
  ]);

  const updateGlobalSubSectionSuggestionPosition = useCallback(() => {
    const anchor = globalSubSectionSearchAnchorRef.current;
    if (!anchor || typeof window === 'undefined') return null;
    return getSubSectionSuggestionDropdownLayout(anchor.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!showGlobalSubSectionSuggestions) {
      setGlobalSubSectionDropdownLayout(null);
      return undefined;
    }

    const syncLayout = () => {
      const layout = updateGlobalSubSectionSuggestionPosition();
      if (layout) {
        setGlobalSubSectionDropdownLayout(layout);
      }
    };

    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, [
    showGlobalSubSectionSuggestions,
    globalSubSectionSearchSuggestions,
    globalSubSectionSearch,
    updateGlobalSubSectionSuggestionPosition,
  ]);

  useEffect(() => {
    if (!showSubSectionSuggestions && !showGlobalSubSectionSuggestions) {
      return undefined;
    }

    const handlePointerDownOutside = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (subSectionSearchAnchorRef.current?.contains(target)) return;
      if (globalSubSectionSearchAnchorRef.current?.contains(target)) return;
      if (subSectionSuggestionsPortalRef.current?.contains(target)) return;
      if (globalSubSectionSuggestionsPortalRef.current?.contains(target)) return;
      setShowSubSectionSuggestions(false);
      setShowGlobalSubSectionSuggestions(false);
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    return () => document.removeEventListener('mousedown', handlePointerDownOutside);
  }, [showSubSectionSuggestions, showGlobalSubSectionSuggestions]);

  // Old useEffect removed - now using new API in handleSectionSelect for multi-level tree structure

  // Handle clinical pattern selection
  const handleClinicalPatternSelect = async (selectedOption) => {
    setSelectedClinicalPattern(selectedOption);

    // Reset all Clinical Pattern tab data (also when dropdown is cleared)
    dispatch(setRubricByKeywordIdList([]));
    setClinicalPatternRubricPage(1);
    setClinicalPatternRubricHasMore(false);
    setClinicalPatternRubricLoadingMore(false);
    dispatch(setThrepoticByDiagnosisIdList(null));
    setActiveKeyword(null);
    setActiveQuestion(null);
    setActivePerticular(null);
    setActiveKeywordTab(null);
    setKeywordsData([]);
    setDiagnosisData(null);
    setKeywordSearch('');
    setRubricRemedySearch('');

    // Call diagnosisSearch API with selected value
    if (selectedOption && selectedOption.value) {
      try {
        const response = await diagnosisSearch({ diagnosisID: selectedOption.value });
        console.log('Diagnosis Search Response:', response);

        // Store the diagnosis data in state
        setDiagnosisData(response);

        const threpoticResponse = dispatch(getThrepoticByDiagnosisId({ diagnosisId: selectedOption.value }));
        console.log('Threpotic Response:', threpoticResponse);
      } catch (error) {
        console.error('Error searching diagnosis:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to search diagnosis details'
        });
      }
    }
  };

  // Handle keyword tab selection
  const handleKeywordTabSelect = async (tabType) => {
    console.log('handleKeywordTabSelect called with:', tabType);
    console.log('selectedClinicalPattern:', selectedClinicalPattern);

    setActiveKeywordTab(tabType);

    // Clear keyword-based rubrics, keywords, and active keyword when changing tab
    dispatch(setRubricByKeywordIdList([]));
    setClinicalPatternRubricPage(1);
    setClinicalPatternRubricHasMore(false);
    setClinicalPatternRubricLoadingMore(false);
    setActiveKeyword(null);
    setKeywordsData([]); // Clear old keywords immediately

    // Call getDiagnosisKeywordByTab API if diagnosis is selected
    if (selectedClinicalPattern && selectedClinicalPattern.value) {
      try {
        console.log('Calling API with:', {
          diagnosisId: selectedClinicalPattern.value,
          tabType: tabType
        });

        console.log('About to dispatch getDiagnosisKeywordByTab...');
        const response = await dispatch(getDiagnosisKeywordByTab({
          diagnosisId: selectedClinicalPattern.value,
          tabType: tabType
        }));

        console.log('Keywords Response:', response);
        console.log('Response payload:', response?.payload);

        // Store the keywords data in state
        if (response && response.payload) {
          setKeywordsData(response.payload);
          console.log('Keywords set to state:', response.payload);
        } else {
          console.log('No payload found in response');
          setKeywordsData([]);
        }
      } catch (error) {
        console.error('Error fetching keywords:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch keywords'
        });
        setKeywordsData([]);
      }
    } else {
      console.log('No clinical pattern selected - selectedClinicalPattern:', selectedClinicalPattern);
      setKeywordsData([]);
    }
  };

  // Handle question tab selection
  const handleQuestionTabSelect = async (questionLabel) => {
    console.log('handleQuestionTabSelect called with:', questionLabel);
    console.log('selectedClinicalPattern:', selectedClinicalPattern);

    setActiveQuestion(questionLabel);

    // Clear keyword-based rubrics when changing pattern type tab
    dispatch(setRubricByKeywordIdList(null));
    setClinicalPatternRubricPage(1);
    setClinicalPatternRubricHasMore(false);
    setClinicalPatternRubricLoadingMore(false);
    setActiveKeyword(null);

    // Call getDiagnosisKeywordByTab API if diagnosis is selected
    if (selectedClinicalPattern && selectedClinicalPattern.value) {
      try {
        console.log('Calling API with:', {
          diagnosisId: selectedClinicalPattern.value,
          tabType: questionLabel
        });

        console.log('About to dispatch getDiagnosisKeywordByTab...');
        const response = await dispatch(getDiagnosisKeywordByTab({
          diagnosisId: selectedClinicalPattern.value,
          tabType: questionLabel
        }));

        console.log('Keywords Response:', response);
        console.log('Response payload:', response?.payload);

        // Store the keywords data in state
        if (response && response.payload) {
          setKeywordsData(response.payload);
          console.log('Keywords set to state:', response.payload);
        } else {
          console.log('No payload found in response');
        }
      } catch (error) {
        console.error('Error fetching keywords:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch keywords'
        });
      }
    } else {
      console.log('No clinical pattern selected - selectedClinicalPattern:', selectedClinicalPattern);
    }
  };

  // Handle rubric remedy click
  const handleRubricRemedyClick = async (rubricRemedy, subSectionId) => {
    console.log('Rubric Remedy clicked:', rubricRemedy, 'subSectionId:', subSectionId);
    setSelectedRubricRemedy(rubricRemedy);
    setRubricRemedyModalOpen(true);

    if (subSectionId) {
      try {
        console.log('Calling getRubricDetails with subSectionId:', subSectionId);
        await dispatch(getRubricDetails({ subSectionId: subSectionId }));
        console.log('getRubricDetails dispatched successfully');
      } catch (error) {
        console.error('Error fetching rubric details:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch rubric details'
        });
      }
    }
  };

  // Handle keyword selection
  const handleKeywordClick = async (keyword, sectionIds) => {
    setActiveKeyword(keyword);
    setActiveKeywordSectionIds(sectionIds);
    dispatch(setRubricByKeywordIdList([]));
    setClinicalPatternRubricPage(1);
    setClinicalPatternRubricHasMore(false);
    setClinicalPatternRubricLoadingMore(false);

    const trimmedKeyword = keyword?.trim();
    if (!trimmedKeyword) {
      return;
    }

    const validSectionIds = Array.isArray(sectionIds) && sectionIds.length > 0 ? sectionIds : undefined;

    try {
      const result = await dispatch(searchRubricsByKeyword({
        keyword: trimmedKeyword,
        pageNumber: 1,
        pageSize: CLINICAL_PATTERN_RUBRIC_PAGE_SIZE,
        append: false,
        sectionIds: validSectionIds,
      }));
      if (result?.payload) {
        setClinicalPatternRubricPage(result.payload.pageNumber ?? 1);
        setClinicalPatternRubricHasMore(result.payload.hasMore ?? false);
      }
    } catch (error) {
      console.error('Error fetching rubrics by keyword:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch rubrics'
      });
    }
  };

  const loadMoreClinicalPatternRubrics = useCallback(async () => {
    const trimmedKeyword = activeKeyword?.trim();
    if (
      !trimmedKeyword
      || !clinicalPatternRubricHasMore
      || clinicalPatternRubricLoadingMore
      || rubricByKeywordIdLoading
    ) {
      return;
    }

    const nextPage = clinicalPatternRubricPage + 1;
    setClinicalPatternRubricLoadingMore(true);
    try {
      const validSectionIds = Array.isArray(activeKeywordSectionIds) && activeKeywordSectionIds.length > 0 ? activeKeywordSectionIds : undefined;
      const result = await dispatch(searchRubricsByKeyword({
        keyword: trimmedKeyword,
        pageNumber: nextPage,
        pageSize: CLINICAL_PATTERN_RUBRIC_PAGE_SIZE,
        append: true,
        sectionIds: validSectionIds,
      }));
      if (result?.payload) {
        setClinicalPatternRubricPage(result.payload.pageNumber ?? nextPage);
        setClinicalPatternRubricHasMore(result.payload.hasMore ?? false);
      }
    } catch (error) {
      console.error('Error loading more clinical pattern rubrics:', error);
    } finally {
      setClinicalPatternRubricLoadingMore(false);
    }
  }, [
    activeKeyword,
    activeKeywordSectionIds,
    clinicalPatternRubricHasMore,
    clinicalPatternRubricLoadingMore,
    clinicalPatternRubricPage,
    rubricByKeywordIdLoading,
    dispatch,
  ]);

  const handleClinicalPatternRubricsScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) return;

    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 80;
    if (nearBottom) {
      loadMoreClinicalPatternRubrics();
    }
  }, [loadMoreClinicalPatternRubrics]);

  // Create options from real allopathic drug data
  const adverseTypeOptions = useMemo(() => {
    if (!allopathicDrugForDropdown || !Array.isArray(allopathicDrugForDropdown)) {
      return [];
    }
    return allopathicDrugForDropdown.map((drug) => ({
      value: drug.allopathicDrugId,
      label: `${drug.allopathicDrugName?.trim() || ''}`,
      system: drug.drugSystemName?.trim() || '',
      category: drug.drugGroupName?.trim() || '',
    }));
  }, [allopathicDrugForDropdown]);

  const [selectedAdverseType, setSelectedAdverseType] = useState(null);

  // Search and pagination state for each table
  const [seriousEffectsSearch, setSeriousEffectsSearch] = useState('');
  const [otherEffectsSearch, setOtherEffectsSearch] = useState('');
  const [adverseReactionsSearch, setAdverseReactionsSearch] = useState('');

  const [seriousEffectsPage, setSeriousEffectsPage] = useState(1);
  const [otherEffectsPage, setOtherEffectsPage] = useState(1);
  const [adverseReactionsPage, setAdverseReactionsPage] = useState(1);
  const [seriousEffectsSearchOpen, setSeriousEffectsSearchOpen] = useState(false);
  const [otherEffectsSearchOpen, setOtherEffectsSearchOpen] = useState(false);
  const [adverseReactionsSearchOpen, setAdverseReactionsSearchOpen] = useState(false);
  const [adverseReferenceModalOpen, setAdverseReferenceModalOpen] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState('');
  const [rubricRemedySearch, setRubricRemedySearch] = useState('');
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [keywordsData, setKeywordsData] = useState([]);

  const getPatientBoardSessionState = useCallback(() => ({
    activeTab,
    questionSearch,
    rubricSearch,
    activePerticular,
    activeKeywordTab,
    activeQuestion,
    selectedSubGroupName,
    activeQuestionGroupId,
    questionGroupsMap,
    questionSubGroupsMap,
    questionsRubricList,
    questionsRubricPage,
    questionsRubricHasMore,
    differentialMainTab,
    selectedDifferentialAuthorId,
    differentialSearchTerm,
    commonRemediesSearchTerm,
    uncommonRemediesSearchTerm,
    selectedDifferentialHeadingId,
    diagnosisData,
    keywordsData,
    selectedClinicalPattern,
    activeKeyword,
    keywordSearch,
    rubricRemedySearch,
    therapeuticsFontSize,
    filledPyramidIcons,
    isKeynoteMethodActive,
    isSmallRubricsActive,
    expandedCommonItems,
    expandedUncommonItems,
    accordionDataMap,
    lastRequestedRemedyId,
    isKeynoteEnabled,
    isSmallRubricEnabled,
    selectedRemedyFromCommonUncommon,
    selectedThermalId,
    selectedRepertoryOption,
    selectedSection,
    selectedSubSection,
    subSectionSearch,
    currentSubSectionPage,
    sectionPageNumber,
    accumulatedSections,
    subSectionPageNumber,
    subSectionTreeData,
    expandedSubSections,
    subSectionChildrenMap,
    repertorizationRubrics,
    selectedRepertorizeSectionIds,
    selectedRepertorizeIntensity,
    selectedRemedy,
    selectedAuthor,
    mmFontSize,
    selectedAdverseType,
    seriousEffectsSearch,
    otherEffectsSearch,
    adverseReactionsSearch,
    seriousEffectsPage,
    otherEffectsPage,
    adverseReactionsPage,
    prescriptionTab,
    labsImagingTab,
    prescriptionRemedyDetailList,
    selectedPrescriptionRemedy,
    prescriptionRemedyDescription,
    historyNotePlainText: historyNoteContent?.getCurrentContent
      ? historyNoteContent.getCurrentContent().getPlainText()
      : '',
    labOrderForm,
    labEntryForm,
    sessionLabOrderList,
    sessionLabEntryList,
    audioCaseSessionId,
    audioSource,
    audioTranscript,
    audioConversationMessages,
    audioSummary,
    audioSuggestedRubrics,
    audioCaseStatus,
  }), [
    activeTab,
    questionSearch,
    rubricSearch,
    activePerticular,
    activeKeywordTab,
    activeQuestion,
    selectedSubGroupName,
    activeQuestionGroupId,
    questionGroupsMap,
    questionSubGroupsMap,
    questionsRubricList,
    questionsRubricPage,
    questionsRubricHasMore,
    differentialMainTab,
    selectedDifferentialAuthorId,
    differentialSearchTerm,
    commonRemediesSearchTerm,
    uncommonRemediesSearchTerm,
    selectedDifferentialHeadingId,
    diagnosisData,
    keywordsData,
    selectedClinicalPattern,
    activeKeyword,
    keywordSearch,
    rubricRemedySearch,
    therapeuticsFontSize,
    filledPyramidIcons,
    isKeynoteMethodActive,
    isSmallRubricsActive,
    expandedCommonItems,
    expandedUncommonItems,
    accordionDataMap,
    lastRequestedRemedyId,
    isKeynoteEnabled,
    isSmallRubricEnabled,
    selectedRemedyFromCommonUncommon,
    selectedThermalId,
    selectedRepertoryOption,
    selectedSection,
    selectedSubSection,
    subSectionSearch,
    currentSubSectionPage,
    sectionPageNumber,
    accumulatedSections,
    subSectionPageNumber,
    subSectionTreeData,
    expandedSubSections,
    subSectionChildrenMap,
    repertorizationRubrics,
    selectedRepertorizeSectionIds,
    selectedRepertorizeIntensity,
    selectedRemedy,
    selectedAuthor,
    mmFontSize,
    selectedAdverseType,
    seriousEffectsSearch,
    otherEffectsSearch,
    adverseReactionsSearch,
    seriousEffectsPage,
    otherEffectsPage,
    adverseReactionsPage,
    prescriptionTab,
    labsImagingTab,
    prescriptionRemedyDetailList,
    selectedPrescriptionRemedy,
    prescriptionRemedyDescription,
    historyNoteContent,
    labOrderForm,
    labEntryForm,
    sessionLabOrderList,
    sessionLabEntryList,
    audioCaseSessionId,
    audioSource,
    audioTranscript,
    audioConversationMessages,
    audioSummary,
    audioSuggestedRubrics,
    audioCaseStatus,
  ]);

  const patientBoardSessionSetters = useMemo(() => ({
    setActiveTab,
    setQuestionSearch,
    setRubricSearch,
    setActivePerticular,
    setActiveKeywordTab,
    setActiveQuestion,
    setSelectedSubGroupName,
    setActiveQuestionGroupId,
    setQuestionGroupsMap,
    setQuestionSubGroupsMap,
    setQuestionsRubricList,
    setQuestionsRubricPage,
    setQuestionsRubricHasMore,
    setDifferentialMainTab,
    setSelectedDifferentialAuthorId,
    setDifferentialSearchTerm,
    setCommonRemediesSearchTerm,
    setUncommonRemediesSearchTerm,
    setSelectedDifferentialHeadingId,
    setDiagnosisData,
    setKeywordsData,
    setSelectedClinicalPattern,
    setActiveKeyword,
    setKeywordSearch,
    setRubricRemedySearch,
    setTherapeuticsFontSize,
    setFilledPyramidIcons,
    setIsKeynoteMethodActive,
    setIsSmallRubricsActive,
    setExpandedCommonItems,
    setExpandedUncommonItems,
    setAccordionDataMap,
    setLastRequestedRemedyId,
    setIsKeynoteEnabled,
    setIsSmallRubricEnabled,
    setSelectedRemedyFromCommonUncommon,
    setSelectedThermalId,
    setSelectedRepertoryOption,
    setSelectedSection,
    setSelectedSubSection,
    setSubSectionSearch,
    setCurrentSubSectionPage,
    setSectionPageNumber,
    setAccumulatedSections,
    setSubSectionPageNumber,
    setSubSectionTreeData,
    setExpandedSubSections,
    setSubSectionChildrenMap,
    setRepertorizationRubrics,
    setSelectedRepertorizeSectionIds,
    setSelectedRepertorizeIntensity,
    setSelectedRemedy,
    setSelectedAuthor,
    setMmFontSize,
    setSelectedAdverseType,
    setSeriousEffectsSearch,
    setOtherEffectsSearch,
    setAdverseReactionsSearch,
    setSeriousEffectsPage,
    setOtherEffectsPage,
    setAdverseReactionsPage,
    setPrescriptionTab,
    setLabsImagingTab,
    setPrescriptionRemedyDetailList,
    setSelectedPrescriptionRemedy,
    setPrescriptionRemedyDescription,
    setHistoryNotePlainText: (text) => {
      const contentState = ContentState.createFromText(text || '');
      setHistoryNoteContent(EditorState.createWithContent(contentState));
    },
    setLabOrderForm,
    setLabEntryForm,
    setSessionLabOrderList,
    setSessionLabEntryList,
    setAudioCaseSessionId,
    setAudioSource,
    setAudioTranscript,
    setAudioConversationMessages,
    setAudioSummary,
    setAudioSuggestedRubrics,
    setAudioCaseStatus,
  }), []);

  const patientBoardSessionWatchSignature = useMemo(
    () => JSON.stringify(collectPatientBoardSnapshot(getPatientBoardSessionState())),
    [getPatientBoardSessionState]
  );

  sessionAfterRestoreRef.current = async (snapshot) => {
    if (snapshot.selectedSubSection?.subSectionId) {
      await dispatch(getRubricDetails({ subSectionId: snapshot.selectedSubSection.subSectionId }));
    }

    if (
      snapshot.selectedSection?.sectionId &&
      (!Array.isArray(snapshot.subSectionTreeData) || snapshot.subSectionTreeData.length === 0)
    ) {
      try {
        const response = await getMainParentSubSectionsWithChildCount(snapshot.selectedSection.sectionId);
        if (response && Array.isArray(response)) {
          setSubSectionTreeData(response);
        } else if (response?.data && Array.isArray(response.data)) {
          setSubSectionTreeData(response.data);
        } else if (response?.resultObject && Array.isArray(response.resultObject)) {
          setSubSectionTreeData(response.resultObject);
        }
      } catch (error) {
        console.error('Error restoring subsection tree:', error);
      }
    }

    if (snapshot.selectedClinicalPattern?.value) {
      dispatch(getThrepoticByDiagnosisId({ diagnosisId: snapshot.selectedClinicalPattern.value }));
    }

    const remedyId = snapshot.selectedRemedy?.value ?? snapshot.selectedRemedy?.remedyId;
    const authorId = snapshot.selectedAuthor?.value ?? snapshot.selectedAuthor?.authorId ?? snapshot.selectedAuthor;
    if (remedyId && authorId) {
      dispatch(getMateriaMedicaRemediesDetails({
        remedyId: Number(remedyId) || 0,
        authorId: Number(authorId) || 0,
      }));
    }

    if (snapshot.selectedAdverseType?.value) {
      dispatch(getAllopathicDrugForDropdownById(snapshot.selectedAdverseType.value));
    }

    if (
      snapshot.selectedSubGroupName
      && (!Array.isArray(snapshot.questionsRubricList) || snapshot.questionsRubricList.length === 0)
    ) {
      try {
        await fetchQuestionsRubricsBySubgroup(snapshot.selectedSubGroupName, { pageNumber: 1, append: false });
      } catch (error) {
        console.error('Error restoring questions rubrics:', error);
      }
    }
  };

  usePatientBoardSessionPersistence({
    patientId,
    caseId,
    patientAppId,
    appointmentDate: appointmentDateParam,
    patientName: resolvedPatientName,
    getState: getPatientBoardSessionState,
    setters: patientBoardSessionSetters,
    afterRestoreRef: sessionAfterRestoreRef,
    watchSignature: patientBoardSessionWatchSignature,
    isRestoringRef: isRestoringPatientBoardSessionRef,
    skipPersistRef: skipPatientSessionPersistRef,
    dispatch,
  });


  // Dynamic rubrics from SubSectionMaster search (Questions tab)
  const rubrics = useMemo(() => {
    if (questionsRubricList && Array.isArray(questionsRubricList) && questionsRubricList.length > 0) {
      return questionsRubricList.map((item) => ({
        subsectionId: getClinicalPatternRubricId(item),
        subsectionName: item.subSectionName || item.subSectionNameAlias || item.SubSectionName || item.SubSectionNameAlias,
        remedyCountForSort: item.remedyCountForSort || 0,
      }));
    }
    return [];
  }, [questionsRubricList]);

  // Get keywords from API response
  const keywords = useMemo(() => {
    if (keywordsData && keywordsData.length > 0) {
      return keywordsData.map(item => ({
        keyword: item.keyword,
        keywordId: item.keywordId,
        sectionIds: item.sectionIds || item.SectionIds || [],
      })).filter(item => item.keyword != null);
    }
    return [];
  }, [keywordsData]);

  const filteredKeywords = keywords.filter(k => k && k.keyword && k.keyword.toLowerCase().includes(keywordSearch.toLowerCase()));

  // Get rubric remedies from keyword API or diagnosis data
  const rubricRemedies = useMemo(() => {
    // If a keyword tab is selected or a keyword is selected, only show keyword-based rubrics (even if empty)
    if (activeKeywordTab || activeKeyword) {
      if (rubricByKeywordIdList && rubricByKeywordIdList.length > 0) {
        return rubricByKeywordIdList.map(item => ({
          subSectionName: item.subSectionName || item.subSectionNameAlias || item.SubSectionName || item.SubSectionNameAlias,
          subSectionId: item.subSectionID || item.subSectionId || item.SubSectionID,
          remedyCountForSort: item.remedyCountForSort || 0
        }));
      }
      // Return empty array if keyword tab/keyword is selected but no data available
      return [];
    }

    // Show diagnosis rubrics only when no keyword tab/keyword is selected and no pattern type tab is selected
    if (!activeQuestion && !activeKeywordTab && diagnosisData && diagnosisData.diagnosisRemediesModels) {
      return diagnosisData.diagnosisRemediesModels.map(item => ({
        subSectionName: item.subSectionName,
        subSectionId: item.subSectionId,
        remedyCountForSort: item.remedyCountForSort
      }));
    }
    return [];
  }, [rubricByKeywordIdList, diagnosisData, activeQuestion, activeKeyword, activeKeywordTab]);

  const filteredRubricRemedies = rubricRemedies.filter(r => r && r.subSectionName && r.subSectionName.toLowerCase().includes(rubricRemedySearch.toLowerCase()));

  const filteredRubrics = rubrics.filter(r => r && r.subsectionName && r.subsectionName.toLowerCase().includes(rubricSearch.toLowerCase()));

  // Handle drug selection
  const handleDrugSelection = (selectedOption) => {
    setSelectedAdverseType(selectedOption);
    if (selectedOption && selectedOption.value) {
      dispatch(getAllopathicDrugForDropdownById(selectedOption.value));
    } else {
      dispatch(setAllopathicDrugForDropdownByIdList(null));
    }
    // Reset pagination when drug changes
    setSeriousEffectsPage(1);
    setOtherEffectsPage(1);
    setAdverseReactionsPage(1);
    setSeriousEffectsSearchOpen(false);
    setOtherEffectsSearchOpen(false);
    setAdverseReactionsSearchOpen(false);
  };

  const selectedAdverseDrugId = selectedAdverseType?.value != null
    ? Number(selectedAdverseType.value)
    : null;

  const adverseDrugDetails = useMemo(() => {
    if (!selectedAdverseDrugId || !allopathicDrugForDropdownByIdList) {
      return null;
    }

    const loadedDrugId = Number(
      allopathicDrugForDropdownByIdList.allopathicDrugId
      ?? allopathicDrugForDropdownByIdList.allopathicDrugID
      ?? allopathicDrugForDropdownByIdList.id
    );

    if (!Number.isFinite(loadedDrugId) || loadedDrugId !== selectedAdverseDrugId) {
      return null;
    }

    return allopathicDrugForDropdownByIdList;
  }, [allopathicDrugForDropdownByIdList, selectedAdverseDrugId]);

  // Filter and paginate data for each table
  const filteredSeriousEffects = (adverseDrugDetails?.seriousSideEffectModelList || []).filter(effect =>
    effect.seriousSideEffectName?.toLowerCase().includes(seriousEffectsSearch.toLowerCase())
  );
  const seriousEffectsVisibleCount = seriousEffectsPage * ADVERSE_EFFECTS_PAGE_SIZE;
  const seriousEffectsPageData = filteredSeriousEffects.slice(0, seriousEffectsVisibleCount);
  const hasMoreSeriousEffects = seriousEffectsPageData.length < filteredSeriousEffects.length;

  const filteredOtherEffects = (adverseDrugDetails?.otherSideEffectModelList || []).filter(effect =>
    effect.otherSideEffectName?.toLowerCase().includes(otherEffectsSearch.toLowerCase())
  );
  const otherEffectsVisibleCount = otherEffectsPage * ADVERSE_EFFECTS_PAGE_SIZE;
  const otherEffectsPageData = filteredOtherEffects.slice(0, otherEffectsVisibleCount);
  const hasMoreOtherEffects = otherEffectsPageData.length < filteredOtherEffects.length;

  const filteredAdverseReactions = (adverseDrugDetails?.adverseReactionModelList || []).filter(reaction =>
    reaction.adverseReactionName?.toLowerCase().includes(adverseReactionsSearch.toLowerCase())
  );
  const adverseReactionsVisibleCount = adverseReactionsPage * ADVERSE_EFFECTS_PAGE_SIZE;
  const adverseReactionsPageData = filteredAdverseReactions.slice(0, adverseReactionsVisibleCount);
  const hasMoreAdverseReactions = adverseReactionsPageData.length < filteredAdverseReactions.length;

  const headerStyles = `
    .pb-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #e9ecef; background:#fff; position:sticky; top:0; z-index:2; }
    .pb-logo { font-weight:700; letter-spacing:1px; }
    .pb-logo-wrapper { position:absolute; left:0; right:0; top:10px; display:flex; justify-content:center; pointer-events:none; }
    .pb-logo-inner { pointer-events:auto; }
    .pb-actions { gap:8px; }
    .pb-search { width:260px; }
    .pb-circle { width:22px; height:22px; border-radius:50%; background:#f1f3f5; border:1px solid #dee2e6; display:inline-flex; align-items:center; justify-content:center; margin-left:10px; font-size:8px; font-weight:500; vertical-align:middle; line-height:1; }
    .pb-chip { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:3px; border:1px solid #000000; background:#000000; color:#fff; font-size:10px; font-weight:400; margin-left:6px; cursor:pointer; transition:background-color .15s ease, border-color .15s ease; }
    .pb-chip:hover { background:#495057; border-color:#495057; }
    .pb-remedy-score-bar { position:relative; flex-shrink:0; width:88px; min-width:88px; margin-left:8px; }
    .pb-remedy-score-bar__track {
      position:relative;
      height:7px;
      border-radius:999px;
      background:linear-gradient(180deg, #eef2f6 0%, #e2e8f0 100%);
      box-shadow:inset 0 1px 2px rgba(15, 23, 42, 0.06);
      overflow:visible;
    }
    .pb-remedy-score-bar__fill {
      position:absolute;
      left:0;
      top:0;
      height:100%;
      min-width:0;
      border-radius:999px;
      background:linear-gradient(90deg, #1e88e5 0%, #0b5cab 100%);
      box-shadow:0 0 0 1px rgba(11, 92, 171, 0.12);
      transition:width .22s cubic-bezier(.22, 1, .36, 1);
      pointer-events:none;
    }
    .pb-remedy-score-bar__thumb {
      position:absolute;
      top:50%;
      transform:translate(-50%, -50%);
      z-index:2;
      display:flex;
      align-items:center;
      justify-content:center;
      transition:left .22s cubic-bezier(.22, 1, .36, 1);
    }
    .pb-remedy-score-bar__dot {
      min-width:22px;
      height:22px;
      padding:0 5px;
      border-radius:999px;
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border:2px solid #fff;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.35), 0 0 0 1px rgba(11, 92, 171, 0.15);
      box-sizing:border-box;
      flex-shrink:0;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:10px;
      font-weight:700;
      letter-spacing:-0.02em;
      line-height:1;
      color:#fff;
    }
    .pb-remedy-list-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:9px 12px;
      border-bottom:1px solid #eef2f6;
      cursor:pointer;
      background:transparent;
      transition:background-color .14s ease;
    }
    .pb-remedy-list-row:hover { background:#f5faff; }
    .pb-remedy-list-row--selected {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      box-shadow:inset 3px 0 0 #1e88e5;
    }
    .pb-remedy-list-row__meta {
      display:flex;
      align-items:center;
      gap:6px;
      min-width:0;
      flex:1 1 auto;
    }
    .pb-remedy-list-row__name {
      font-size:12.5px;
      font-weight:600;
      color:#0f172a;
      letter-spacing:-0.01em;
      line-height:1.3;
    }
    .pb-remedy-list-row__alias {
      flex-shrink:0;
      color:#64748b;
      font-size:11px;
      font-weight:500;
      cursor:pointer;
    }
    .pb-remedy-list-row__alias:hover { color:#0b5cab; }
    .pb-remedy-list-row__ratio {
      flex-shrink:0;
      color:#0b5cab;
      font-size:11px;
      font-weight:700;
      letter-spacing:-0.01em;
    }
    .pb-remedy-list-row__chevron {
      flex-shrink:0;
      font-size:14px;
      color:#94a3b8;
    }
    .pb-rubric-row { position:relative; }
    .pb-rubric-row:hover { background-color:#f6f8fa; }
    .pb-rubric-badges { position:absolute; right:8px; top:50%; transform:translateY(-50%); display:none; flex-direction:row; align-items:center; gap:4px; flex-wrap:nowrap; }
    .pb-rubric-row:hover .pb-rubric-badges { display:flex !important; }
    .pb-accordion-sublist-row { position:relative; overflow:hidden; cursor:default; }
    .pb-accordion-sublist-row:hover { background-color:#f6f8fa; }
    .pb-accordion-sublist-entry { width:100%; min-width:0; }
    .pb-accordion-sublist-label {
      flex:1 1 auto;
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      line-height:1.35;
      padding-right:4px;
    }
    .pb-accordion-sublist-chips-slot {
      flex:0 0 96px;
      width:96px;
      min-width:96px;
      display:flex;
      justify-content:flex-end;
      align-items:center;
    }
    .pb-rubric-badges--accordion {
      position:static !important;
      transform:none !important;
      display:none;
      flex-direction:row;
      align-items:center;
      justify-content:flex-end;
      gap:4px;
      flex-wrap:nowrap;
      margin-left:0;
    }
    .pb-accordion-sublist-row:hover .pb-rubric-badges--accordion,
    .pb-accordion-sublist-row.pb-accordion-sublist-row--has-grade .pb-rubric-badges--accordion {
      display:flex !important;
    }
    .pb-rubric-badges--accordion .pb-chip { margin-left:0; }
    .pb-rubric-row--repertory-subsection {
      overflow:hidden;
      border:none !important;
      border-bottom:1px solid #f1f3f5 !important;
      padding:7px 8px 7px 10px !important;
      margin:0;
      transition:background-color .15s ease;
    }
    .pb-rubric-row--repertory-subsection:hover {
      background-color:#f8fafc !important;
    }
    .pb-rubric-row--repertory-subsection-selected {
      background-color:#eef4ff !important;
      box-shadow:inset 3px 0 0 #3b82f6;
    }
    .pb-rubric-row--repertory-subsection-selected:hover {
      background-color:#e8f0fe !important;
    }
    .pb-subsection-tree {
      width:100%;
      max-width:100%;
      overflow-x:hidden;
    }
    .pb-subsection-tree-node {
      width:100%;
      max-width:100%;
    }
    .pb-subsection-tree-children {
      margin-left:8px;
      padding-left:10px;
      border-left:2px solid #edf2f7;
    }
    .pb-repertory-subsection-row {
      width:100%;
      min-width:0;
      max-width:100%;
      gap:6px;
      align-items:flex-start;
    }
    .pb-subsection-tree-toggle {
      width:18px;
      height:18px;
      flex-shrink:0;
      margin-top:1px;
      padding:0;
      border:1px solid #d0d7de;
      border-radius:4px;
      background:#fff;
      color:#495057;
      font-size:12px;
      font-weight:700;
      line-height:1;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      transition:background-color .15s ease, border-color .15s ease;
    }
    .pb-subsection-tree-toggle:hover,
    .pb-subsection-tree-toggle:focus {
      background:#f6f8fa;
      border-color:#adb5bd;
      outline:none;
    }
    .pb-subsection-tree-toggle-spacer {
      width:18px;
      flex-shrink:0;
    }
    .pb-repertory-subsection-label {
      flex:1 1 auto;
      min-width:0;
      max-width:100%;
      overflow:hidden;
      white-space:normal;
      word-break:break-word;
      overflow-wrap:break-word;
      font-size:13px;
      line-height:1.45;
      padding-right:2px;
      color:#495057;
    }
    .pb-rubric-row--repertory-subsection-parent .pb-repertory-subsection-label {
      font-weight:600;
      color:#212529;
      font-size:13px;
    }
    .pb-rubric-row--repertory-subsection-leaf .pb-repertory-subsection-label {
      font-weight:400;
      color:#495057;
      font-size:12.5px;
    }
    .pb-repertory-subsection-chips-slot {
      flex:0 0 auto;
      min-width:0;
      max-width:84px;
      display:flex;
      justify-content:flex-end;
      align-items:flex-start;
      align-self:flex-start;
      padding-top:1px;
    }
    .pb-subsection-search-wrap { position:relative; min-width:150px; flex-shrink:0; }
    .pb-subsection-search-tooltip.tooltip .tooltip-inner {
      max-width:220px;
      padding:6px 10px;
      font-size:11px;
      font-weight:500;
      line-height:1.35;
      color:#92400e;
      background:#fffbeb;
      border:1px solid #fcd34d;
      text-align:left;
      box-shadow:0 4px 14px rgba(15,23,42,0.12);
    }
    .pb-subsection-search-tooltip.tooltip.bs-tooltip-bottom .tooltip-arrow::before {
      border-bottom-color:#fcd34d;
    }
    .pb-repertory-global-search-wrap {
      position:relative;
      width:100%;
      max-width:340px;
    }
    .pb-subsection-search-suggestions {
      background:#fff;
      border:1px solid #d0d7de;
      border-radius:8px;
      box-shadow:0 10px 28px rgba(15,23,42,0.14);
      overflow-x:hidden;
      overflow-y:auto;
      overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;
      pointer-events:auto;
    }
    .pb-subsection-search-suggestions--above {
      box-shadow:0 -8px 24px rgba(15,23,42,0.12);
    }
    .pb-subsection-search-suggestions--below {
      box-shadow:0 10px 28px rgba(15,23,42,0.14);
    }
    .pb-subsection-search-suggestions--portal {
      min-width:0;
    }
    .pb-subsection-search-suggestions-header {
      position:sticky;
      top:0;
      z-index:2;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:7px 12px;
      font-size:11px;
      font-weight:700;
      letter-spacing:0.35px;
      text-transform:uppercase;
      color:#6c757d;
      background:#f8f9fa;
      border-bottom:1px solid #e9ecef;
    }
    .pb-subsection-search-suggestions-count {
      font-size:10px;
      font-weight:600;
      color:#868e96;
      text-transform:none;
      letter-spacing:0;
    }
    .pb-subsection-search-suggestions-list {
      display:block;
    }
    .pb-subsection-search-suggestions::-webkit-scrollbar {
      width: var(--app-scrollbar-size);
    }
    .pb-subsection-search-suggestions::-webkit-scrollbar-track {
      background: var(--app-scrollbar-track);
      border-radius:0 8px 8px 0;
    }
    .pb-subsection-search-suggestions::-webkit-scrollbar-thumb {
      background: var(--app-scrollbar-thumb);
      border-radius:4px;
    }
    .pb-subsection-search-suggestion {
      display:block;
      width:100%;
      padding:10px 12px;
      border:none;
      border-bottom:1px solid #f1f3f5;
      background:#fff;
      color:#212529;
      text-align:left;
      font-size:12px;
      line-height:1.45;
      cursor:pointer;
      white-space:normal;
      word-break:break-word;
    }
    .pb-subsection-search-suggestion:last-child { border-bottom:none; }
    .pb-subsection-search-suggestion:hover,
    .pb-subsection-search-suggestion:focus {
      background:#eef4ff;
      outline:none;
    }
    .pb-subsection-search-suggestion-match,
    .pb-repertory-subsection-label-match {
      font-weight:700;
      color:#0d6efd;
      background:rgba(13,110,253,0.08);
      border-radius:2px;
      padding:0 1px;
    }
    .pb-rubric-row--repertory-subsection .pb-rubric-badges--repertory {
      position:static;
      transform:none;
      display:none;
      flex-direction:row;
      align-items:center;
      justify-content:flex-end;
      gap:4px;
      flex-wrap:nowrap;
    }
    .pb-rubric-row--repertory-subsection:hover .pb-rubric-badges--repertory,
    .pb-rubric-row--repertory-subsection.pb-rubric-row--repertory-has-grade .pb-rubric-badges--repertory {
      display:flex !important;
    }
    .pb-chip--repertory-selected {
      background:#3cd188 !important;
      border-color:#2aad6f !important;
      color:#fff !important;
    }
    .pb-chip--repertory-selected:hover {
      background:#2fb875 !important;
      border-color:#269e6a !important;
      color:#fff !important;
    }
    .pb-repertorization-rubric-row {
      overflow:hidden;
      min-width:0;
      max-width:100%;
      gap:8px;
      flex-wrap:nowrap;
      align-items:center;
    }
    .pb-repertorization-rubric-label {
      flex:1 1 auto;
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      font-size:14px;
      line-height:1.35;
    }
    .pb-repertorization-rubric-actions { flex:0 0 auto; gap:6px; }
    .pb-repertorization-chips-slot {
      flex:0 0 auto;
      display:flex;
      justify-content:flex-end;
      align-items:center;
      min-height:20px;
    }
    .pb-repertorization-rubric-row .pb-rubric-badges--repertorization {
      position:static;
      transform:none;
      display:none;
      flex-direction:row;
      align-items:center;
      justify-content:flex-end;
      gap:4px;
      flex-wrap:nowrap;
    }
    .pb-repertorization-rubric-row:hover .pb-rubric-badges--repertorization {
      display:flex !important;
    }
    .pb-repertorization-rubric-row:hover .pb-repertorization-intensity-badge {
      display:none;
    }
    .pb-tabs-nav {
      border-bottom:none;
      padding-bottom:0;
      gap:4px;
    }
    .pb-main-toolbar {
      display:flex;
      align-items:center;
      gap:10px 12px;
      margin-top:0.5rem;
      margin-bottom:0.5rem;
      min-height:42px;
      flex-wrap:nowrap;
    }
    .pb-main-toolbar__left,
    .pb-main-toolbar__right {
      display:flex;
      align-items:center;
      flex:0 0 auto;
      gap:8px;
    }
    .pb-main-toolbar__right {
      margin-left:auto;
      min-width:0;
    }
    .pb-main-toolbar__center {
      flex:1 1 auto;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-wrap:wrap;
      gap:4px;
      min-width:0;
    }
    @media (max-width: 1199.98px) {
      .pb-main-toolbar {
        flex-wrap:wrap;
      }
      .pb-main-toolbar__center {
        order:3;
        flex:1 1 100%;
        justify-content:flex-start;
      }
      .pb-main-toolbar__right {
        margin-left:0;
      }
    }
    .pb-tab {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:7px 12px;
      margin-right:0;
      font-size:0.875rem;
      font-weight:500;
      color:#64748b;
      cursor:pointer;
      text-decoration:none;
      border:none;
      background:transparent;
      border-radius:999px;
      transition:color .15s ease, background-color .15s ease, box-shadow .15s ease;
      line-height:1.2;
      white-space:nowrap;
    }
    .pb-tab i {
      font-size:15px;
      line-height:1;
      opacity:0.85;
    }
    .pb-tab:hover:not(.active) {
      color:#0b5cab;
      background:#f0f7ff;
      text-decoration:none;
    }
    .pb-tab.active,
    .pb-tab.active:hover {
      color:#0b5cab;
      background:linear-gradient(180deg, #eaf5ff 0%, #d9ecff 100%);
      box-shadow:inset 0 0 0 1px #b6d8f7;
      text-decoration:none;
      font-weight:600;
    }
    .pb-tab--audio {
      color:#0b5cab !important;
      background:linear-gradient(180deg, #f5faff 0%, #eaf5ff 100%) !important;
      box-shadow:inset 0 0 0 1px #7ec2f5;
      font-weight:600;
    }
    .pb-tab--audio:hover {
      color:#fff !important;
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      box-shadow:0 2px 8px rgba(30, 136, 229, 0.28);
    }
    .pb-tab--audio i {
      opacity:1;
    }
    .pb-dmm-author-row { display:flex; width:100%; gap:4px; flex-wrap:nowrap; }
    .pb-dmm-author-tab { flex:1 1 0; min-width:0; margin:0; padding:6px 4px; font-weight:700; font-size:12px; text-align:center; cursor:pointer; color:#495057; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pb-dmm-author-tab.active { color:#000000; text-decoration:underline; text-underline-offset:6px; }
    .pb-repertorize-tab-btn {
      position:relative !important;
      display:inline-flex !important;
      align-items:center;
      gap:7px;
      min-height:34px;
      padding:6px 14px 6px 12px !important;
      border-radius:10px !important;
      background:linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%) !important;
      border:1px solid #d7e3ef !important;
      color:#475569 !important;
      font-weight:700 !important;
      font-size:13px !important;
      letter-spacing:0.01em;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.05);
      transition:background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .pb-repertorize-tab-btn i {
      font-size:15px;
      line-height:1;
    }
    .pb-repertorize-tab-btn:hover:not(.active) {
      background:linear-gradient(180deg, #fff 0%, #f1f5f9 100%) !important;
      border-color:#93c5fd !important;
      color:#0b5cab !important;
      box-shadow:0 2px 6px rgba(30, 136, 229, 0.12);
    }
    .pb-repertorize-tab-btn.active,
    .pb-repertorize-tab-btn.active:hover,
    .pb-repertorize-tab-btn.active:focus {
      background:linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
      border-color:#0f172a !important;
      color:#ffffff !important;
      box-shadow:0 4px 12px rgba(15, 23, 42, 0.28) !important;
    }
    .pb-repertorize-count-badge {
      position:absolute;
      top:-8px;
      right:-8px;
      display:flex;
      align-items:center;
      justify-content:center;
      min-width:20px;
      height:20px;
      padding:0 5px;
      border-radius:999px;
      background:linear-gradient(180deg, #f97363 0%, #e74c3c 100%);
      color:#fff;
      font-size:10px;
      font-weight:700;
      line-height:1;
      border:2px solid #fff;
      box-sizing:border-box;
      pointer-events:none;
      font-variant-numeric:tabular-nums;
      box-shadow:0 2px 4px rgba(231, 76, 60, 0.35);
    }
    .pb-repertorize-tab-btn.active .pb-repertorize-count-badge {
      border-color:#0f172a;
    }
    .pb-prescription-tab-btn,
    .pb-prescription-tab-btn:hover,
    .pb-prescription-tab-btn:focus,
    .pb-prescription-tab-btn:active,
    .pb-prescription-tab-btn.active {
      display:inline-flex !important;
      align-items:center;
      gap:7px;
      min-height:34px;
      padding:6px 14px 6px 12px !important;
      border-radius:10px !important;
      background:linear-gradient(180deg, #f5faff 0%, #eaf5ff 100%) !important;
      background-image:linear-gradient(180deg, #f5faff 0%, #eaf5ff 100%) !important;
      border:1px solid #7ec2f5 !important;
      color:#0b5cab !important;
      font-weight:700 !important;
      font-size:13px !important;
      letter-spacing:0.01em;
      box-shadow:0 1px 2px rgba(30, 136, 229, 0.1) !important;
      transition:background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease;
    }
    .pb-prescription-tab-btn i {
      font-size:15px;
      line-height:1;
    }
    .pb-prescription-tab-btn:hover,
    .pb-prescription-tab-btn:focus {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      background-image:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      border-color:#0b5cab !important;
      color:#fff !important;
      box-shadow:0 4px 12px rgba(30, 136, 229, 0.3) !important;
    }
    /* Prescription modal — premium shell (Prescription / Labs / History) */
    .pb-prescription-modal .modal-content {
      border:1px solid #e2ebf3;
      border-radius:14px;
      box-shadow:0 16px 40px rgba(15, 23, 42, 0.14);
      overflow:hidden;
    }
    .pb-prescription-modal__body {
      padding:20px !important;
      display:flex;
      flex-direction:column;
      height:80vh;
      overflow:hidden;
      background:linear-gradient(180deg, #fbfdff 0%, #fff 120px);
    }
    .pb-prescription-modal__tabs {
      display:flex;
      width:100%;
      gap:8px;
      flex-shrink:0;
      margin-bottom:1rem;
      padding:6px;
      border-radius:12px;
      background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border:1px solid #e2ebf3;
    }
    .pb-prescription-modal__tab {
      flex:1 1 0;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
      gap:7px;
      min-height:40px;
      padding:8px 10px !important;
      border-radius:10px !important;
      border:1px solid transparent !important;
      background:transparent !important;
      color:#475569 !important;
      font-size:13px !important;
      font-weight:700 !important;
      letter-spacing:0.01em;
      box-shadow:none !important;
      transition:background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .pb-prescription-modal__tab i { font-size:15px; line-height:1; }
    .pb-prescription-modal__tab:hover:not(.is-active) {
      background:#fff !important;
      border-color:#d7e3ef !important;
      color:#0b5cab !important;
    }
    .pb-prescription-modal__tab.is-active {
      background:linear-gradient(180deg, #1e293b 0%, #0f172a 100%) !important;
      border-color:#0f172a !important;
      color:#fff !important;
      box-shadow:0 4px 12px rgba(15, 23, 42, 0.24) !important;
    }
    .pb-prescription-modal__panel {
      display:flex;
      flex-direction:column;
      flex:1;
      overflow:hidden;
      min-height:0;
    }
    .pb-prescription-modal__form-row {
      display:flex;
      align-items:center;
      gap:10px;
      flex-shrink:0;
      margin-bottom:1rem;
      padding:12px;
      border-radius:12px;
      background:#fff;
      border:1px solid #e2ebf3;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-prescription-modal__form-row .form-control,
    .pb-prescription-modal__form-row textarea {
      border-radius:10px !important;
      border-color:#e2ebf3 !important;
    }
    .pb-prescription-modal__add-btn {
      min-width:40px !important;
      height:38px !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
      border-radius:10px !important;
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      border:1px solid #0b5cab !important;
      box-shadow:0 2px 8px rgba(30, 136, 229, 0.28);
    }
    .pb-prescription-modal__add-btn i { font-size:18px; color:#fff; }
    .pb-prescription-modal__table-wrap {
      flex:1;
      overflow:auto;
      border:1px solid #e2ebf3;
      border-radius:12px;
      background:#fff;
      min-height:0;
    }
    .pb-prescription-modal__table {
      margin-bottom:0 !important;
      font-size:12.5px;
    }
    .pb-prescription-modal__table thead th {
      background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
      border-bottom:1px solid #e2ebf3 !important;
      color:#334155;
      font-size:11px;
      font-weight:700;
      letter-spacing:0.04em;
      text-transform:uppercase;
      padding:10px 12px !important;
      position:sticky;
      top:0;
      z-index:10;
      white-space:nowrap;
    }
    .pb-prescription-modal__table thead th i {
      color:#0b5cab;
      margin-right:5px;
      font-size:13px;
      vertical-align:-1px;
    }
    .pb-prescription-modal__table tbody td {
      padding:10px 12px !important;
      border-color:#eef2f6 !important;
      vertical-align:middle;
      color:#0f172a;
    }
    .pb-prescription-modal__empty {
      text-align:center;
      padding:2.5rem 1rem !important;
      color:#64748b !important;
    }
    .pb-prescription-modal__empty-inner {
      display:inline-flex;
      flex-direction:column;
      align-items:center;
      gap:10px;
      font-weight:500;
    }
    .pb-prescription-modal__empty-icon {
      width:44px;
      height:44px;
      border-radius:12px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      font-size:1.25rem;
    }
    .pb-prescription-modal__subtabs {
      display:flex;
      gap:6px;
      flex-shrink:0;
      margin-bottom:1rem;
      padding:5px;
      border-radius:12px;
      background:#f8fafc;
      border:1px solid #e2ebf3;
    }
    .pb-prescription-modal__subtab {
      flex:1;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      padding:8px 12px;
      border-radius:9px;
      cursor:pointer;
      font-size:12.5px;
      font-weight:600;
      color:#64748b;
      text-align:center;
      margin:0 !important;
      transition:background .15s ease, color .15s ease, box-shadow .15s ease;
    }
    .pb-prescription-modal__subtab:hover:not(.active) {
      color:#0b5cab;
      background:#fff;
    }
    .pb-prescription-modal__subtab.active {
      background:#fff;
      color:#0b5cab;
      box-shadow:0 1px 3px rgba(15, 23, 42, 0.08), inset 0 0 0 1px #cfe3f7;
      text-decoration:none !important;
    }
    .pb-prescription-modal__history {
      flex:1;
      min-height:100px;
      border:1px solid #e2ebf3;
      border-radius:12px;
      overflow:hidden;
      background:#fff;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-prescription-modal__footer {
      border-top:1px solid #eef2f6;
      padding:0.5rem;
      background:#fff;
      gap:0.5rem !important;
    }
    .pb-link { text-decoration:underline; }
    .pb-muted { color:#6c757d; }
    .pb-section-title { font-weight:700; color:#000000; letter-spacing:.3px; }
    .pb-panel-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:nowrap; gap:0.5rem; min-height:28px; height:28px; flex-shrink:0; }
    .pb-panel-header .pb-section-title { margin:0 !important; line-height:28px; }
    .pb-panel-header-actions { display:flex; align-items:center; gap:0.25rem; flex-shrink:0; }
    .pb-tab-card,
    .pb-repertory-card,
    .pb-repertorize-card {
      display:flex;
      flex-direction:column;
      padding:0.5rem;
      border:1px solid var(--minimal-card-border, #b9b9b9) !important;
      box-shadow:none !important;
      background-color:#fff;
    }
    .pb-tab-card--500,
    .pb-repertorize-card--500 {
      height:100%;
      max-height:100%;
      min-height:0;
      overflow:hidden;
    }
    .pb-tab-card-scroll,
    .pb-tab-card--500 .pb-tab-card-scroll,
    .pb-tab-card--544 .pb-tab-card-scroll,
    .pb-tab-card--580 .pb-tab-card-scroll,
    .pb-repertorize-card--500 .pb-tab-card-scroll {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
    }
    .pb-tab-card-content {
      flex:1 1 auto;
      min-height:0;
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }
    .pb-tab-card-divider {
      flex-shrink:0;
      border-top:1px solid var(--minimal-card-border, #b9b9b9);
      margin-top:0.5rem;
      margin-bottom:0.5rem;
    }
    .pb-section-divider {
      border-top:1px solid var(--minimal-card-border, #b9b9b9);
    }
    .pb-keyword-tabs-wrap {
      border:1px solid var(--minimal-card-border, #b9b9b9);
      border-radius:8px;
      padding:8px 12px;
      background-color:#fff;
    }
    .pb-repertorize-top-row {
      flex-wrap:nowrap;
      align-items:stretch;
      height:100%;
      margin:0 !important;
    }
    .pb-repertorize-top-row > [class*="col-"] {
      min-width:0;
      height:100%;
    }
    .pb-repertorize-layout {
      display:grid;
      grid-template-columns:minmax(0, 1fr) minmax(160px, 12%);
      grid-template-rows:500px 580px;
      grid-template-areas:
        "top section"
        "dmm headings";
      gap:8px;
      align-items:stretch;
      width:100%;
      min-width:0;
    }
    .pb-repertorize-layout__top {
      grid-area:top;
      min-width:0;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-repertorize-layout__dmm {
      grid-area:dmm;
      min-width:0;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-repertorize-layout__section {
      grid-area:section;
      min-width:0;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-repertorize-layout__headings {
      grid-area:headings;
      min-width:0;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-repertorize-layout__top > .pb-repertorize-top-row,
    .pb-repertorize-layout__dmm > .pb-repertorize-bottom-row {
      flex:1 1 auto;
      width:100%;
      min-height:0;
      height:100%;
      margin:0 !important;
    }
    .pb-repertorize-rubrics-col,
    .pb-repertorize-common-col,
    .pb-repertorize-uncommon-col {
      flex:0 0 33.333% !important;
      max-width:33.333%;
    }
    .pb-repertorize-dmm-col {
      flex:0 0 100% !important;
      max-width:100%;
      min-width:0;
      height:100%;
    }
    .pb-repertorize-section-col {
      flex:0 0 12% !important;
      max-width:12%;
    }
    @media (max-width: 991px) {
      .pb-tab-cards-row--fill { flex-wrap:wrap !important; }
      .pb-repertorize-layout {
        grid-template-columns:minmax(0, 1fr);
        grid-template-rows:auto;
        grid-template-areas:
          "top"
          "section"
          "dmm"
          "headings";
      }
      .pb-repertorize-top-row { flex-wrap:wrap; height:auto; }
      .pb-repertorize-rubrics-col,
      .pb-repertorize-common-col,
      .pb-repertorize-uncommon-col,
      .pb-repertorize-section-col,
      .pb-repertorize-dmm-col {
        flex:0 0 100% !important;
        max-width:100%;
      }
    }
    .pb-tab-card--544,
    .pb-repertory-card--544,
    .pb-tab-card--580,
    .pb-repertorize-card--580 {
      height:100%;
      max-height:100%;
      min-height:0;
      overflow:hidden;
    }
    .patient-board-page .pb-tab-cards-row { --bs-gutter-x:0.25rem; --bs-gutter-y:0.25rem; }

    /* Body Parts (AnatomyViewer) — match Repertory cards spacing/radius */
    .patient-board-page .pb-body-part-tab .anatomy-header,
    .patient-board-page .pb-body-part-tab .anatomy-viewer-card,
    .patient-board-page .pb-body-part-tab .anatomy-panel,
    .patient-board-page .pb-body-part-tab .anatomy-panel-card,
    .patient-board-page .pb-body-part-tab .anatomy-canvas-wrap {
      border-radius: 0.25rem !important;
      box-shadow: none !important;
      border-color: var(--minimal-card-border, #b9b9b9) !important;
    }
    .patient-board-page .pb-body-part-tab .anatomy-header {
      margin-bottom: 0.5rem !important;
      padding: 0.5rem !important;
    }
    .patient-board-page .pb-body-part-tab .anatomy-grid {
      gap: 0.25rem !important;
    }
    .patient-board-page .pb-body-part-tab .anatomy-panel-card {
      padding: 0.5rem !important;
    }
    .patient-board-page .pb-body-part-tab .anatomy-panel-card--scroll {
      gap: 0.5rem !important;
    }
    .pb-info {
      padding:10px 12px;
      position:relative;
      border-radius:12px;
      background:linear-gradient(180deg, #fbfdff 0%, #f5f8fb 100%);
      border:1px solid #e2ebf3;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
      gap:12px;
    }
    .pb-info__identity {
      display:flex;
      align-items:center;
      gap:12px;
      min-width:0;
      flex:1 1 auto;
    }
    .pb-info__avatar-wrap {
      position:relative;
      flex-shrink:0;
      width:44px;
      height:44px;
    }
    .pb-info__avatar {
      width:44px;
      height:44px;
      border-radius:50%;
      object-fit:cover;
      border:2px solid #fff;
      box-shadow:0 0 0 1px #d7e3ef, 0 2px 6px rgba(15, 23, 42, 0.08);
    }
    .pb-info__avatar-status {
      position:absolute;
      right:0;
      bottom:0;
      width:12px;
      height:12px;
      border-radius:50%;
      background:#10b981;
      border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(16, 185, 129, 0.25);
    }
    .pb-info__details {
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      min-width:0;
    }
    .pb-info__name {
      font-size:15px;
      font-weight:700;
      letter-spacing:0.02em;
      color:#0f172a;
      line-height:1.2;
    }
    .pb-info__meta {
      display:inline-flex;
      align-items:center;
      gap:5px;
      padding:4px 9px;
      border-radius:999px;
      background:#fff;
      border:1px solid #e2ebf3;
      color:#64748b;
      font-size:12px;
      font-weight:500;
      line-height:1.2;
    }
    .pb-info__meta i {
      font-size:13px;
      color:#0b5cab;
      line-height:1;
    }
    .pb-info__meta-sep {
      color:#cbd5e1;
      font-weight:400;
      user-select:none;
    }
    .pb-info__actions {
      display:flex;
      align-items:center;
      gap:8px;
      flex-shrink:0;
    }
    .pb-info__actions .btn-icon {
      width:34px;
      height:34px;
      padding:0;
      border-radius:10px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.06);
      transition:transform .15s ease, box-shadow .15s ease;
    }
    .pb-info__actions .btn-icon:hover {
      transform:translateY(-1px);
      box-shadow:0 3px 8px rgba(15, 23, 42, 0.12);
    }
    .pb-info__actions .btn-icon i {
      font-size:16px;
      line-height:1;
    }
    .pb-info__aside {
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
      justify-content:flex-end;
      margin-left:auto;
    }
    .pb-appointment-date {
      position:static;
      left:auto;
      transform:none;
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:5px 10px;
      border-radius:999px;
      background:#fff;
      border:1px solid #e2ebf3;
      color:#475569;
      font-size:12px;
      font-weight:600;
      white-space:nowrap;
    }
    .pb-appointment-date i {
      color:#0b5cab;
      font-size:14px;
      line-height:1;
    }
    .pb-info__status {
      display:inline-flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
    }
    .pb-info__chip {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:5px 10px;
      border-radius:999px;
      background:#fff;
      border:1px solid #e2ebf3;
      color:#64748b;
      font-size:12px;
      font-weight:500;
      white-space:nowrap;
    }
    .pb-info__chip i {
      font-size:14px;
      line-height:1;
      color:#94a3b8;
    }
    .pb-info__chip--due {
      color:#0f172a;
      font-weight:600;
      border-color:#cfe3f7;
      background:linear-gradient(180deg, #f5faff 0%, #eaf5ff 100%);
    }
    .pb-info__chip--due i {
      color:#0b5cab;
    }
    @media (max-width: 991.98px) {
      .pb-info__aside {
        width:100%;
        justify-content:flex-start;
        margin-left:0;
      }
    }
    .pb-part-item { padding:2px 6px; cursor:pointer; font-weight:500; color:#495057; }
    .pb-part-item.active { color:#000000; text-decoration:underline; text-underline-offset:6px; }
    .pb-keyword-tab { padding:6px 12px; border:1px solid #d1d5db; border-radius:4px; cursor:pointer; font-weight:500; color:#495057; transition:all 0.2s ease; font-size:13px; }
    .pb-keyword-tab:hover:not(.disabled) { background-color:#f6f8fa; border-color:#000000; }
    .pb-keyword-tab.active { color:#000000; border-color:#000000; background-color:#f6f8fa; font-weight:600; }
    .pb-keyword-tab.disabled { opacity:0.5; cursor:not-allowed; background-color:#f5f5f5; }
    /* Questions SUB QUESTION GROUP + Clinical Pattern KEYWORDS — shared pill chips */
    .pb-questions-keywords-card .pb-keyword-tab,
    .pb-clinical-keywords-card .pb-keyword-tab {
      display:inline-flex;
      align-items:center;
      gap:4px;
      padding:6px 12px;
      border-radius:999px;
      border:1px solid #cfd8e3;
      background:#fff;
      color:#212529;
      font-size:13px;
      font-weight:600;
      line-height:1.25;
      box-shadow:0 1px 2px rgba(16, 24, 40, 0.04);
      transition:background-color .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    .pb-clinical-keywords-card .pb-keyword-tab {
      padding:5px 11px;
      font-size:12.5px;
      gap:3px;
    }
    .pb-questions-keywords-card .pb-keyword-tab:hover:not(.disabled),
    .pb-clinical-keywords-card .pb-keyword-tab:hover:not(.disabled) {
      background:#f8fbfd;
      border-color:#b8e2f4;
      color:#1f4e8c;
      box-shadow:0 1px 3px rgba(30, 136, 229, 0.12);
    }
    .pb-questions-keywords-card .pb-keyword-tab.active,
    .pb-clinical-keywords-card .pb-keyword-tab.active {
      background:var(--bs-info-bg-subtle, #dff0fa);
      border-color:#b8e2f4;
      color:#1f4e8c;
      font-weight:700;
      box-shadow:inset 0 0 0 1px rgba(30, 136, 229, 0.08);
    }
    .pb-qwrap { display:flex; flex-wrap:wrap; gap:24px 36px; }
    .pb-qitem { color:#495057; font-weight:500; cursor:pointer; text-decoration:none; }
    .pb-qitem.active { color:#000000; text-decoration:underline; text-underline-offset:6px; }
    .search-box .form-control:focus { background-color:#f6f8fa; border-color:#25a0e2; box-shadow:none !important; }
    .form-control:focus,
    .form-control:focus-visible,
    .form-select:focus,
    .form-select:focus-visible { box-shadow:none !important; }
    .search-box:focus-within { background-color:transparent; }
    .form-select:focus { background-color:#fff; border-color:#25a0e2; box-shadow:none; }
    .choices.is-focused .choices__inner { border-color:#25a0e2 !important; box-shadow:none !important; }
    .react-select-container .react-select__control--is-focused { border-color:#25a0e2 !important; box-shadow:none !important; }
    .react-select-container .react-select__control { padding-left: 25px !important; }
    
    /* Custom scrollbar styling */
    .custom-scrollbar::-webkit-scrollbar {
      width: var(--app-scrollbar-size);
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: var(--app-scrollbar-track);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: var(--app-scrollbar-thumb);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: var(--app-scrollbar-thumb-hover);
    }
    .choices__inner { background:#fff; }
    .pb-tab-card--mm {
      height:100%;
      min-height:0;
      max-height:100%;
      overflow:hidden;
    }
    .pb-tab-card--mm .mm-info-scroll {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
    }
    .pb-tab-panel--adverse {
      gap:8px;
    }
    .pb-ae-header-bar {
      display:flex;
      align-items:center;
      gap:12px;
      padding:7px 12px;
      background:linear-gradient(180deg, #ffffff 0%, #fbfbfe 100%);
      border:1px solid #e3e8ee;
      border-radius:12px;
      box-shadow:0 1px 2px rgba(16,24,40,0.04);
      flex-shrink:0;
      min-height:46px;
    }
    .pb-ae-header-bar__icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:32px;
      height:32px;
      border-radius:8px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      color:#0b5cab;
      border:1px solid #cfe3f7;
      font-size:16px;
      flex-shrink:0;
    }
    .pb-ae-header-bar__select-wrap {
      flex:0 0 220px;
      min-width:180px;
      max-width:240px;
    }
    .pb-ae-header-bar__select-label {
      display:none;
    }
    .pb-ae-header-bar__divider {
      width:1px;
      align-self:center;
      height:24px;
      min-height:24px;
      background:#e9ecef;
      flex-shrink:0;
    }
    .pb-ae-header-bar__info {
      flex:1 1 auto;
      min-width:0;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-wrap:wrap;
      gap:2px 6px;
      text-align:center;
      font-size:13px;
      line-height:1.3;
      padding:0 6px;
    }
    .pb-ae-header-bar__category {
      flex:0 0 auto;
      max-width:220px;
      text-align:right;
      font-size:12px;
      line-height:1.25;
      padding-left:4px;
      align-self:center;
    }
    .pb-ae-header-bar__select-wrap .pb-ae-select__control {
      min-height:32px !important;
      border-radius:8px;
    }
    .pb-ae-header-bar__select-wrap .pb-ae-select__value-container {
      padding:0 8px;
    }
    .pb-ae-header-bar__select-wrap .pb-ae-select__indicators {
      height:32px;
    }
    .pb-ae-header-bar__select-wrap .pb-ae-select__dropdown-indicator,
    .pb-ae-header-bar__select-wrap .pb-ae-select__clear-indicator {
      padding:4px 8px;
    }
    .pb-ae-select-option__name {
      font-size:13px;
      font-weight:600;
      color:#212529;
      line-height:1.2;
    }
    .pb-ae-select-option__meta {
      font-size:11px;
      color:#868e96;
      line-height:1.2;
      margin-top:1px;
    }
    .pb-ae-columns-wrapper {
      flex:1 1 auto;
      min-height:0;
      overflow:hidden;
    }
    .pb-ae-columns-row {
      height:100%;
      min-height:0;
      margin:0;
    }
    .pb-ae-columns-row > [class*="col-"] {
      height:100%;
      min-height:0;
      display:flex;
      flex-direction:column;
      padding-left:6px;
      padding-right:6px;
    }
    .pb-ae-column {
      display:flex;
      flex-direction:column;
      height:100%;
      min-height:0;
      border:1px solid #e9ecef;
      border-radius:8px;
      background:#fff;
      overflow:hidden;
      box-shadow:0 1px 2px rgba(16,24,40,0.04);
    }
    .pb-ae-column-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:10px 12px;
      border-bottom:1px solid #e9ecef;
      flex-shrink:0;
    }
    .pb-ae-column-header-left {
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    }
    .pb-ae-column--serious .pb-ae-column-header { background:#fff5f5; }
    .pb-ae-column--other .pb-ae-column-header { background:#fff8f0; }
    .pb-ae-column--adverse .pb-ae-column-header { background:#fff5f5; }
    .pb-ae-column-icon { font-size:16px; flex-shrink:0; }
    .pb-ae-column-icon--serious,
    .pb-ae-column-icon--adverse { color:#dc3545; }
    .pb-ae-column-icon--other { color:#fd7e14; }
    .pb-ae-column-title {
      font-size:12px;
      font-weight:700;
      letter-spacing:0.4px;
      color:#212529;
      white-space:nowrap;
    }
    .pb-ae-column-badge {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:22px;
      height:22px;
      padding:0 6px;
      border-radius:999px;
      font-size:11px;
      font-weight:700;
      color:#fff;
      flex-shrink:0;
    }
    .pb-ae-column--serious .pb-ae-column-badge,
    .pb-ae-column--adverse .pb-ae-column-badge { background:#dc3545; }
    .pb-ae-column--other .pb-ae-column-badge { background:#fd7e14; }
    .pb-ae-filter-btn {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:30px;
      height:30px;
      padding:0;
      border:1px solid transparent;
      border-radius:6px;
      background:transparent;
      color:#6c757d;
      cursor:pointer;
      transition:background-color .15s ease, color .15s ease, border-color .15s ease;
      flex-shrink:0;
    }
    .pb-ae-filter-btn:hover,
    .pb-ae-filter-btn.active {
      background:#fff;
      border-color:#dee2e6;
      color:#495057;
    }
    .pb-ae-column-search {
      padding:8px 12px;
      border-bottom:1px solid #eef2f6;
      flex-shrink:0;
      background:linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
    }
    .pb-ae-column-search .pb-questions-search-box {
      width:100%;
    }
    .pb-ae-column-search .pb-questions-search-input {
      border-radius:999px !important;
      border-color:#d7e3ef !important;
      background:#f8fafc !important;
      font-size:12px;
      height:28px !important;
      min-height:28px !important;
      padding-left:30px !important;
      line-height:28px !important;
    }
    .pb-ae-column-search .pb-questions-search-input:focus {
      background:#fff !important;
      border-color:#93c5fd !important;
      box-shadow:0 0 0 3px rgba(30, 136, 229, 0.12);
    }
    .pb-ae-column-search .pb-questions-search-box .search-icon {
      top:50%;
      transform:translateY(-50%);
      height:auto;
      line-height:1;
    }
    .pb-ae-column-search--disabled {
      opacity:0.72;
    }
    .pb-ae-column-search--disabled .pb-questions-search-input:disabled {
      background:#f1f5f9 !important;
      cursor:not-allowed;
      color:#94a3b8;
    }
    .pb-ae-column-list {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
      padding:8px;
      background:#fcfcfd;
    }
    .pb-ae-column-state {
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:120px;
      padding:16px;
      text-align:center;
      color:#868e96;
      font-size:13px;
    }
    .pb-ae-effect-row {
      display:block;
      padding:10px 12px;
      margin-bottom:6px;
      background:#fff;
      border:1px solid #e9ecef;
      border-radius:6px;
      font-size:13px;
      font-weight:500;
      color:#212529;
      transition:background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
    }
    .pb-ae-effect-row:last-child { margin-bottom:0; }
    .pb-ae-effect-row:hover {
      background:#f8f9fa;
      border-color:#dee2e6;
      box-shadow:0 1px 2px rgba(16,24,40,0.05);
    }
    .pb-ae-effect-name {
      display:block;
      min-width:0;
      line-height:1.35;
    }
    .pb-ae-column-footer {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:8px 12px;
      border-top:1px solid #e9ecef;
      background:#f8f9fa;
      flex-shrink:0;
      flex-wrap:wrap;
    }
    .pb-ae-item-count {
      display:inline-flex;
      align-items:center;
      gap:4px;
      font-size:12px;
      color:#6c757d;
      white-space:nowrap;
    }
    .pb-ae-scroll-indicator {
      display:inline-flex;
      align-items:center;
      gap:4px;
      margin-left:auto;
      font-size:11px;
      font-weight:600;
      color:#6f42c1;
      white-space:nowrap;
    }
    .pb-ae-scroll-hint {
      display:flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      padding:10px 8px 4px;
      font-size:12px;
      color:#868e96;
    }
    .pb-ae-footer {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:4px 2px 0;
      flex-shrink:0;
      flex-wrap:wrap;
    }
    .pb-ae-disclaimer {
      margin:0;
      font-size:12px;
      color:#868e96;
      font-style:italic;
      line-height:1.4;
    }
    .pb-ae-reference-btn {
      display:inline-flex;
      align-items:center;
      gap:6px;
      white-space:nowrap;
      flex-shrink:0;
    }
    .pb-ae-reference-summary {
      display:grid;
      gap:8px;
      font-size:14px;
      color:#212529;
    }
    .pb-ae-reference-summary strong {
      color:#1f4e8c;
    }
    .mm-info { color:#000000; }
    .mm-info-scroll,
    .mm-info-scroll p,
    .mm-info-scroll div,
    .mm-info-scroll li,
    .mm-info-scroll span,
    .mm-info-scroll td,
    .mm-info-scroll font,
    .mm-info-scroll strong,
    .mm-info-scroll h1,
    .mm-info-scroll h2,
    .mm-info-scroll h3,
    .mm-info-scroll h4,
    .mm-info-scroll h5,
    .mm-info-scroll h6 { color:#000000 !important; }
    .pb-tab-panel--materia-medica {
      gap:8px;
    }
    .pb-mm-header-bar {
      display:flex;
      align-items:center;
      gap:14px;
      padding:10px 14px;
      background:linear-gradient(180deg, #ffffff 0%, #fbfbfe 100%);
      border:1px solid #e3e8ee;
      border-radius:12px;
      box-shadow:0 1px 2px rgba(16,24,40,0.04);
      flex-shrink:0;
      flex-wrap:wrap;
    }
    .pb-mm-header-bar__fields {
      display:grid;
      grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);
      gap:14px;
      flex:1 1 auto;
      min-width:0;
    }
    .pb-mm-header-bar__select-group {
      display:flex;
      align-items:stretch;
      gap:10px;
      min-width:0;
    }
    .pb-mm-header-bar__icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:32px;
      height:32px;
      border-radius:8px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      color:#0b5cab;
      border:1px solid #cfe3f7;
      font-size:16px;
      flex-shrink:0;
      margin-top:0;
    }
    .pb-mm-header-bar__select-wrap {
      flex:1 1 auto;
      min-width:0;
    }
    .pb-mm-header-bar__select-label {
      display:block;
      margin:0 0 6px;
      font-size:10px;
      font-weight:700;
      letter-spacing:0.6px;
      text-transform:uppercase;
      color:#868e96;
      line-height:1;
    }
    .pb-mm-header-bar__select-wrap .pb-mm-select__control {
      min-height:32px !important;
      border-radius:999px;
    }
    .pb-mm-header-bar__select-wrap .pb-mm-select__value-container {
      padding:0 10px;
    }
    .pb-mm-header-bar__select-wrap .pb-mm-select__indicators {
      height:32px;
    }
    .pb-mm-header-bar__select-wrap .pb-mm-select__dropdown-indicator,
    .pb-mm-header-bar__select-wrap .pb-mm-select__clear-indicator {
      padding:4px 8px;
    }
    .pb-mm-header-bar__divider {
      width:1px;
      align-self:center;
      height:36px;
      min-height:36px;
      background:#e9ecef;
      flex-shrink:0;
    }
    .pb-mm-header-bar__title {
      flex:1 1 220px;
      min-width:200px;
      text-align:right;
      font-size:13px;
      font-weight:700;
      color:#1f4e8c;
      line-height:1.35;
      align-self:center;
      padding-left:8px;
    }
    .pb-mm-header-bar__author-row {
      display:flex;
      align-items:center;
      gap:8px;
      width:100%;
      min-width:0;
      min-height:32px;
    }
    .pb-mm-header-bar__author-select {
      flex:1 1 0;
      min-width:0;
    }
    .pb-mm-header-bar__action-spacer {
      width:32px;
      flex-shrink:0;
    }
    .pb-mm-reset-btn {
      width:32px !important;
      height:32px !important;
      min-width:32px;
      padding:0 !important;
      border-radius:8px !important;
      background:#f3f6f9 !important;
      border:1px solid #ced4da !important;
      color:#495057 !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
    }
    .pb-mm-reset-btn i {
      font-size:15px;
      line-height:1;
    }
    .pb-mm-layout {
      display:flex;
      gap:8px;
      flex:1 1 auto;
      min-height:0;
      overflow:hidden;
      align-items:stretch;
    }
    .pb-mm-headings-panel,
    .pb-mm-content-panel {
      display:flex;
      flex-direction:column;
      border:1px solid #e3e8ee;
      border-radius:12px;
      background:#fff;
      overflow:hidden;
      box-shadow:0 1px 2px rgba(16,24,40,0.04);
      min-height:0;
    }
    .pb-mm-headings-panel {
      flex:0 0 250px;
      min-width:220px;
      max-width:280px;
    }
    .pb-mm-content-panel {
      flex:1 1 auto;
      min-width:0;
    }
    /* Shared one-level headers: HEADINGS + Materia Medica */
    .pb-mm-panel-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      min-height:44px;
      padding:0 12px;
      box-sizing:border-box;
      flex-shrink:0;
      background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
    }
    .pb-mm-headings-panel > .pb-mm-panel-header {
      height:44px;
    }
    .pb-mm-panel-divider {
      flex-shrink:0;
      border-top:1px solid #eef1f4;
      margin:0;
    }
    .pb-mm-panel-title-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:20px;
      height:20px;
      border-radius:6px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      font-size:12px;
      line-height:1;
      flex-shrink:0;
    }
    .pb-mm-headings-title {
      display:inline-flex;
      align-items:center;
      gap:7px;
      margin:0;
      padding:0;
      font-size:11px;
      font-weight:700;
      letter-spacing:0.06em;
      text-transform:uppercase;
      color:#111827;
      line-height:1.2;
      white-space:nowrap;
    }
    .pb-mm-headings-list {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
      padding:6px 8px;
    }
    .pb-mm-heading-item {
      display:flex;
      align-items:center;
      gap:10px;
      width:100%;
      padding:8px 10px;
      margin-bottom:6px;
      border:1px solid transparent;
      border-radius:8px;
      background:transparent;
      color:#495057;
      font-size:12px;
      font-weight:500;
      text-align:left;
      cursor:pointer;
      transition:background-color .15s ease, color .15s ease, border-color .15s ease;
    }
    .pb-mm-heading-item:last-child { margin-bottom:0; }
    .pb-mm-heading-item:hover {
      background:#f8f9fa;
      border-color:#e9ecef;
    }
    .pb-mm-heading-item.active {
      background:var(--bs-info-bg-subtle, #dff0fa);
      border-color:rgba(var(--bs-info-rgb, 50, 204, 255), 0.35);
      color:var(--bs-info, #32ccff);
      font-weight:600;
    }
    .pb-mm-heading-item__icon-wrap {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:34px;
      height:34px;
      border-radius:8px;
      background:var(--bs-info-bg-subtle, #dff0fa);
      color:var(--bs-info, #32ccff);
      border:1px solid rgba(var(--bs-info-rgb, 50, 204, 255), 0.25);
      flex-shrink:0;
      transition:background-color .15s ease, color .15s ease, border-color .15s ease;
    }
    .pb-mm-heading-item.active .pb-mm-heading-item__icon-wrap {
      background:var(--bs-info-bg-subtle, #dff0fa);
      color:var(--bs-info, #32ccff);
      border-color:rgba(var(--bs-info-rgb, 50, 204, 255), 0.45);
    }
    .pb-mm-heading-item__icon {
      font-size:20px;
      line-height:1;
    }
    .pb-mm-heading-item__label {
      min-width:0;
      line-height:1.3;
    }
    .pb-mm-content-header {
      align-items:center;
      min-height:44px;
      height:auto;
      padding-top:8px;
      padding-bottom:8px;
      flex-wrap:nowrap;
    }
    .pb-mm-content-heading {
      min-width:0;
      flex:1 1 auto;
      display:flex;
      flex-direction:column;
      justify-content:center;
      gap:2px;
    }
    .pb-mm-content-title {
      display:inline-flex;
      align-items:center;
      gap:7px;
      font-size:13px;
      font-weight:700;
      letter-spacing:-0.01em;
      text-transform:none;
      color:#111827;
      line-height:1.25;
      margin:0;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width:100%;
    }
    .pb-mm-content-subtitle {
      margin:0;
      padding-left:27px;
      font-size:11px;
      color:#868e96;
      line-height:1.2;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .pb-mm-content-tools {
      display:inline-flex;
      align-items:center;
      gap:6px;
      flex-shrink:0;
    }
    .pb-mm-zoom-btn {
      width:28px !important;
      height:28px !important;
      min-width:28px;
      padding:0 !important;
      border-radius:7px !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
    }
    .pb-mm-zoom-btn i {
      font-size:14px !important;
      line-height:1;
    }
    .pb-mm-zoom-btn--in {
      background:#e8f7f1 !important;
      border:1px solid #0ab39c !important;
      color:#0ab39c !important;
    }
    .pb-mm-zoom-btn--out {
      background:#fff4e8 !important;
      border:1px solid #f7b84b !important;
      color:#f7b84b !important;
    }
    .pb-mm-zoom-size {
      font-size:11px;
      color:#868e96;
      min-width:30px;
      text-align:center;
      line-height:1;
    }
    .pb-mm-section-block {
      scroll-margin-top:12px;
      margin-bottom:18px;
    }
    .pb-mm-section-block:last-child {
      margin-bottom:0;
    }
    .pb-mm-section-heading {
      font-size:13px;
      font-weight:700;
      letter-spacing:0.4px;
      text-transform:uppercase;
      color:#212529;
      margin:0 0 8px;
      padding-bottom:6px;
      border-bottom:1px solid #e9ecef;
    }
    .pb-mm-content-scroll {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
      padding:0 14px 14px;
    }
    .pb-adverse-effects-columns > [class*="col-"] {
      padding-left:0.75rem;
      padding-right:0.75rem;
    }
    .ae-name { color:#1f4e8c; font-weight:700; letter-spacing:.2px; }
    .ae-system { color:#000000; font-weight:700; }
    .ae-category { color:#6f42c1; font-weight:700; font-style:italic; }
    .cp-category { color:#6f42c1; font-weight:700; }
    .modal-header-btn {
      background:#fff;
      border:1px solid #e2ebf3;
      color:#475569;
      width:32px;
      height:32px;
      padding:0;
      transition:background .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease;
      border-radius:9px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:3px;
      font-size:12px;
      font-weight:700;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
      line-height:1;
    }
    .modal-header-btn i { font-size:15px; line-height:1; }
    .modal-header-btn:hover {
      background:#f4faff;
      border-color:#93c5fd;
      color:#0b5cab;
      box-shadow:0 2px 6px rgba(30, 136, 229, 0.12);
      transform:translateY(-1px);
    }
    .modal-header-btn.active {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
      box-shadow:0 2px 8px rgba(11, 92, 171, 0.28);
    }
    .modal-header-btn.modal-header-btn--lang {
      width:auto;
      min-width:32px;
      padding:0 9px;
      letter-spacing:0.02em;
    }
    .pb-rubric-tools {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:4px;
      border-radius:12px;
      background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border:1px solid #e2ebf3;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .pb-rubric-tools__divider {
      width:1px;
      height:18px;
      background:#d7e3ef;
      margin:0 2px;
      flex-shrink:0;
    }
    .marathi-tooltip { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.9); color:#fff; padding:20px 30px; border-radius:8px; max-width:600px; z-index:9999; line-height:1.8; font-size:14px; box-shadow:0 4px 20px rgba(0,0,0,0.3); animation:fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.9); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
    .remedy-item { cursor:pointer; transition:color 0.2s ease, background-color 0.15s ease, box-shadow 0.15s ease; margin-right:1px; display:inline-block; padding:4px 4px; border-radius:4px; line-height:1; }
    .remedy-item:hover { color:#000000; background-color:#f6f8fa; box-shadow:inset 0 0 0 1px #dee2e6; }
    .remedy-author-sub-block {
      font-size:0.72em;
      line-height:0;
      vertical-align:sub;
      color:#000000 !important;
      font-weight:400 !important;
      font-style:normal !important;
      text-transform:none !important;
      margin-left:1px;
    }
    /* Rubric remedy modal — authors must wrap fully (long author lists) */
    .pb-rubric-remedy-modal__remedy-wrap--authors {
      display:flex;
      flex-direction:column;
      align-items:stretch;
      gap:6px;
      line-height:1.45;
      word-spacing:normal;
    }
    .pb-rubric-remedy-modal__remedy-wrap--authors .remedy-item {
      display:block;
      width:100%;
      max-width:100%;
      box-sizing:border-box;
      white-space:normal;
      overflow:visible;
      line-height:1.45;
      padding:8px 10px;
      margin:0;
      border-radius:10px;
      background:#fafcfe;
      box-shadow:inset 0 0 0 1px #e8eef5;
    }
    .pb-rubric-remedy-modal__remedy-wrap--authors .remedy-item:hover {
      background-color:#f4faff;
      box-shadow:inset 0 0 0 1px #cfe9ff;
      transform:none;
    }
    .pb-rubric-remedy-modal__remedy-wrap--authors .remedy-author-sub-block {
      display:inline;
      font-size:0.8em;
      line-height:1.45 !important;
      vertical-align:baseline;
      white-space:normal;
      word-break:break-word;
      overflow-wrap:anywhere;
      margin-left:4px;
    }
    .pb-rubric-remedy-modal__remedies--authors {
      max-height:min(52vh, 520px);
    }
    .pb-reference-rubric-section { border-bottom:1px solid #e9ecef; padding-bottom:calc(8px * 0.8); margin-bottom:calc(8px * 0.8); }
    .pb-reference-rubric-list {
      max-height:110px;
      min-height:48px;
      overflow-y:auto;
      overflow-x:hidden;
      margin-top:6px;
      font-size:11px;
      line-height:1.4;
    }
    .pb-reference-rubric-item {
      padding:2px 0;
      word-break:break-word;
      color:#0d6efd !important;
      cursor:default;
      font-weight:400;
      font-style:normal;
    }
    .patient-board-page .pb-reference-rubric-item {
      color:#0d6efd !important;
    }
    .pb-rubric-data-header {
      flex-shrink:0;
      border-top:1px solid #e9ecef;
      border-bottom:1px solid #e9ecef;
      padding-top:calc(8px * 0.8);
      padding-bottom:calc(8px * 0.8);
      margin-top:calc(8px * 0.8);
      margin-bottom:calc(8px * 0.8);
    }
    .pb-reference-rubric-section + .pb-rubric-data-header {
      margin-top:0;
      border-top:none;
      padding-top:0;
    }
    .pb-rubric-data-scroll {
      line-height:calc(2.2 * 0.98);
      word-spacing:calc(1px * 0.98);
    }
    .pb-reference-rubric-item + .pb-reference-rubric-item { border-top:1px solid #f0f2f5; }
    .remedy-info-icon { color:#1e88e5; font-size:13px; margin-left:3px; font-style:normal; font-weight:800; letter-spacing:0.2px; display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; cursor:pointer; border-radius:50%; background:#f0f7ff; transition:background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease; }
    .remedy-info-icon:hover { background-color:#e3f2fd; color:#1565c0; box-shadow:inset 0 0 0 1px #90caf9; }
    .info-tooltip {
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      display:flex;
      flex-direction:column;
      gap:0;
      background:linear-gradient(180deg, #f7fafc 0%, #eef3f8 100%);
      color:#000;
      padding:14px;
      border-radius:14px;
      min-width:320px;
      max-width:900px;
      width:min(900px, 90vw);
      max-height:calc(100vh - 48px);
      overflow-y:auto;
      overflow-x:hidden;
      overscroll-behavior:contain;
      box-sizing:border-box;
      z-index:10050;
      box-shadow:0 18px 50px rgba(15, 23, 42, 0.28), 0 2px 8px rgba(15, 23, 42, 0.12);
      border:1px solid rgba(148, 163, 184, 0.35);
      animation:fadeIn 0.25s ease;
      pointer-events:none;
    }
    .info-tooltip-rubric-badge-wrap {
      margin:0 0 12px;
      max-width:100%;
      padding:10px 14px;
      border-radius:10px;
      background:#fff;
      border:1px solid #e2e8f0;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .info-tooltip-rubric-badge {
      display:block;
      max-width:100%;
      padding:0;
      font-size:15px;
      font-weight:700;
      letter-spacing:0.01em;
      line-height:1.35;
      color:#0f172a;
      background:transparent;
      border:none;
      border-radius:0;
      white-space:normal;
      overflow:hidden;
      text-overflow:ellipsis;
      word-break:break-word;
    }
    .info-tooltip__sections {
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .info-tooltip--interactive { pointer-events:auto; }
    .info-tooltip .section,
    .info-tooltip .section-themes,
    .info-tooltip .section-generals,
    .info-tooltip .section-modalities,
    .info-tooltip .section-particulars {
      border-radius:10px;
      padding:12px 14px;
      margin-bottom:0;
      background:linear-gradient(165deg, #1f2937 0%, #111827 100%) !important;
      border:1px solid #374151 !important;
      color:#ffffff !important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.18);
    }
    .info-tooltip .section-particulars { margin-bottom:0 !important; }
    .info-tooltip .text-muted,
    .info-tooltip .info-tooltip__section-body {
      color:#e5e7eb !important;
      word-wrap:break-word;
      overflow-wrap:break-word;
      line-height:1.55;
      font-size:13px;
    }
    .info-tooltip .section-title {
      font-weight:700;
      font-size:12px;
      letter-spacing:0.04em;
      text-transform:uppercase;
      color:#93c5fd !important;
      margin-bottom:8px;
      padding-bottom:6px;
      border-bottom:1px solid rgba(148, 163, 184, 0.28);
    }
    .patient-board-page {
      --pb-tab-view-height:calc(100vh - 285px);
      min-height:100vh;
    }
    .patient-board-page > .card.mt-3 {
      display:flex;
      flex-direction:column;
      flex:1 1 auto;
      min-height:calc(100vh - 72px);
      margin-bottom:0 !important;
    }
    .pb-tab-main-view {
      flex:1 1 0;
      min-height:0;
      height:auto;
      max-height:none;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      padding-bottom:0;
      margin-bottom:0;
    }
    .pb-tab-main-view > .pb-tab-panel {
      flex:1 1 auto;
      min-height:0;
      width:100%;
      height:100%;
      align-self:stretch;
    }
    .pb-tab-panel {
      flex:1 1 auto;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }
    .pb-tab-panel--questions {
      height:100%;
      min-height:0;
      width:100%;
      max-width:100%;
      overflow:hidden;
      padding-bottom:0;
      margin-bottom:0;
      gap:8px;
    }
    .pb-tab-sub-view--questions {
      flex:1 1 0;
      min-height:0;
      width:100%;
      max-width:100%;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      margin-top:0;
    }
    .pb-tab-sub-view--questions > .pb-tab-cards-row--fill {
      flex:1 1 0;
      min-height:0;
      min-width:0;
      display:grid !important;
      grid-template-columns:minmax(0, 2fr) minmax(0, 4fr) minmax(0, 6fr);
      gap:0 8px;
      width:100%;
      max-width:100%;
      height:100%;
      margin:0 !important;
      --bs-gutter-x:0;
      --bs-gutter-y:0;
    }
    .pb-tab-sub-view--questions > .pb-tab-cards-row--fill > [class*="col-"] {
      padding:0 !important;
      margin:0 !important;
      min-width:0;
      max-width:100%;
      width:100% !important;
      flex:none !important;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-tab-sub-view--questions .pb-tab-card--544,
    .pb-tab-sub-view--questions .pb-tab-card--fill {
      flex:1 1 0;
      min-height:0;
      height:auto;
      max-height:none;
      width:100%;
      max-width:100%;
      min-width:0;
      box-sizing:border-box;
      overflow:hidden;
    }
    .pb-tab-panel--questions .pb-questions-col-card {
      border:1px solid #e3e8ee !important;
      border-radius:12px !important;
      box-shadow:0 1px 2px rgba(16, 24, 40, 0.04);
      background:#fff;
      padding:0 !important;
    }
    .pb-tab-panel--questions .pb-questions-section-scroll,
    .pb-tab-panel--questions .pb-questions-group-scroll,
    .pb-tab-panel--questions .pb-questions-keywords-scroll,
    .pb-tab-panel--questions .pb-questions-rubrics-card .pb-tab-card-scroll {
      padding:8px;
      box-sizing:border-box;
      scrollbar-gutter:stable;
    }
    .pb-tab-panel--questions .pb-tab-card-divider {
      border-top-color:#eef1f4 !important;
      margin:0 !important;
    }
    .pb-questions-right-stack {
      display:grid;
      grid-template-rows:minmax(0, 38%) minmax(0, 62%);
      gap:8px;
      min-height:0;
      height:100%;
      width:100%;
    }
    .pb-questions-keywords-card,
    .pb-questions-rubrics-card {
      min-height:0;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      margin-bottom:0 !important;
    }
    .pb-questions-keywords-scroll {
      flex:1 1 0;
      min-height:0;
    }
    .pb-questions-row--active {
      background:var(--bs-info-bg-subtle, #dff0fa) !important;
      color:#1f4e8c;
      border-color:#b8e2f4 !important;
    }
    .pb-questions-path-bar {
      display:flex;
      align-items:center;
      flex-wrap:wrap;
      gap:6px;
      padding:8px 12px;
      background:linear-gradient(180deg, #f8fafc 0%, #f3f6f9 100%);
      border:1px solid #e3e8ee;
      border-radius:10px;
    }
    .pb-questions-path-label {
      font-size:10px;
      font-weight:700;
      letter-spacing:0.06em;
      text-transform:uppercase;
      color:#868e96;
      margin-right:4px;
    }
    .pb-questions-path-item {
      font-size:12px;
      font-weight:600;
      color:#495057;
      padding:2px 8px;
      border-radius:999px;
      background:#fff;
      border:1px solid #e9ecef;
    }
    .pb-questions-path-item--active {
      color:#1f4e8c;
      border-color:#b8e2f4;
      background:var(--bs-info-bg-subtle, #dff0fa);
    }
    .pb-questions-path-sep {
      font-size:14px;
      color:#adb5bd;
      line-height:1;
    }
    .pb-questions-panel-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      flex-shrink:0;
      min-height:44px;
      height:44px;
      padding:8px 12px;
      box-sizing:border-box;
      background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border-top-left-radius:11px;
      border-top-right-radius:11px;
      flex-wrap:nowrap;
      overflow:visible;
    }
    .pb-questions-panel-header .pb-section-title {
      display:inline-flex !important;
      align-items:center;
      gap:7px;
      margin:0 !important;
      padding:0 !important;
      line-height:1.2 !important;
      height:28px;
      letter-spacing:0.06em;
      font-size:11px;
      font-weight:700;
      color:#111827;
      white-space:nowrap;
      flex-shrink:0;
      min-width:0;
    }
    .pb-questions-panel-header .pb-questions-search-wrap {
      display:flex;
      align-items:center;
      align-self:center;
      min-width:120px;
      max-width:210px;
      flex:1 1 120px;
      height:28px;
      min-height:28px;
      max-height:28px;
      margin:0 !important;
      padding:0 !important;
    }
    .pb-tab-panel--questions .pb-questions-panel-header .pb-questions-search-box .pb-questions-search-input {
      min-height:28px;
      height:28px;
      padding-top:2px;
      padding-bottom:2px;
      font-size:12px;
      border-radius:999px;
    }
    .pb-questions-search-box {
      position:relative;
      min-width:0;
      width:100%;
      flex:1 1 auto;
    }
    .pb-questions-search-box .pb-questions-search-input {
      padding-right: 30px;
      border-radius:8px;
      border-color:#dfe3e8;
      transition:border-color .15s ease, box-shadow .15s ease;
    }
    .pb-questions-search-box--active .pb-questions-search-input {
      border-color:#7dd3fc;
      box-shadow:0 0 0 2px rgba(50, 204, 255, 0.15);
    }
    .pb-questions-search-box--active .search-icon {
      color:#25a0e2;
    }
    .pb-questions-search-box--disabled {
      opacity:0.72;
      pointer-events:none;
    }
    .pb-questions-search-box--disabled .pb-questions-search-input,
    .pb-questions-search-box .pb-questions-search-input:disabled {
      background:#f1f5f9 !important;
      cursor:not-allowed;
      color:#94a3b8;
    }
    .pb-repertory-search--disabled,
    .pb-repertory-search--disabled .form-control,
    .pb-repertory-search--disabled input {
      opacity:0.72;
    }
    .pb-repertory-search--disabled input:disabled,
    .pb-repertory-search--disabled .form-control:disabled {
      background:#f1f5f9 !important;
      cursor:not-allowed;
      color:#94a3b8;
    }
    .pb-ae-filter-btn:disabled {
      opacity:0.45;
      cursor:not-allowed;
    }
    .pb-questions-search-clear {
      position:absolute;
      right:8px;
      top:50%;
      transform:translateY(-50%);
      border:0;
      background:transparent;
      padding:0;
      width:18px;
      height:18px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#868e96;
      cursor:pointer;
      z-index:2;
    }
    .pb-questions-search-clear:hover {
      color:#495057;
    }
    .pb-tab-panel--questions .pb-repertory-section-title-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:20px;
      height:20px;
      border-radius:6px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      font-size:12px;
      line-height:1;
      flex-shrink:0;
      margin-right:0;
      vertical-align:middle;
    }
    .pb-tab-panel--questions .pb-questions-section-item,
    .pb-tab-panel--questions .pb-questions-group-item {
      display:flex;
      align-items:center;
      gap:8px;
      border-left:0 !important;
      border-right:0 !important;
      border-top:0 !important;
      border-bottom-color:#eef2f6 !important;
      border-radius:0;
      margin:0;
      padding:9px 10px !important;
      font-size:12.5px !important;
      font-weight:600;
      letter-spacing:0.02em;
      color:#0f172a;
      cursor:pointer;
      white-space:normal;
      word-break:break-word;
      overflow-wrap:anywhere;
      transition:background-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    .pb-tab-panel--questions .pb-questions-section-item__icon,
    .pb-tab-panel--questions .pb-questions-group-item__icon {
      width:24px;
      height:24px;
      border-radius:7px;
      flex-shrink:0;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-tab-panel--questions .pb-questions-section-item__icon i,
    .pb-tab-panel--questions .pb-questions-group-item__icon i {
      font-size:13px;
      line-height:1;
    }
    .pb-tab-panel--questions .pb-questions-section-item__label,
    .pb-tab-panel--questions .pb-questions-group-item__label {
      min-width:0;
      flex:1 1 auto;
      line-height:1.25;
    }
    .pb-tab-panel--questions .pb-questions-section-item:last-child,
    .pb-tab-panel--questions .pb-questions-group-item:last-child {
      border-bottom:0 !important;
    }
    .pb-tab-panel--questions .pb-questions-section-item:hover:not(.pb-questions-section-item--active),
    .pb-tab-panel--questions .pb-questions-group-item:hover:not(.pb-questions-group-item--active) {
      background:#f5faff !important;
    }
    .pb-tab-panel--questions .pb-questions-section-item--active,
    .pb-tab-panel--questions .pb-questions-group-item--active {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      color:#0b5cab !important;
      box-shadow:inset 3px 0 0 #1e88e5;
      font-weight:700 !important;
    }
    .pb-tab-panel--questions .pb-questions-section-item--active .pb-questions-section-item__icon,
    .pb-tab-panel--questions .pb-questions-group-item--active .pb-questions-group-item__icon {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.28);
    }
    .pb-tab-panel--questions .pb-questions-section-scroll {
      scrollbar-gutter:stable;
    }
    .pb-questions-list-item {
      cursor:pointer;
      font-size:13px;
      line-height:1.4;
      white-space:normal;
      word-break:break-word;
      overflow-wrap:anywhere;
      padding:10px 12px !important;
      border-radius:0;
      transition:background-color .12s ease, border-color .12s ease;
    }
    .pb-questions-list-item:hover:not(.pb-questions-row--active) {
      background:#f8f9fa;
    }
    .pb-questions-search-hint {
      font-size:11px;
      color:#868e96;
      margin-top:2px;
    }
    .pb-tab-panel-scroll {
      overflow-y:auto;
      overflow-x:hidden;
    }
    .pb-tab-sub-view {
      flex:1 1 0;
      min-height:0;
      width:100%;
      max-width:100%;
      height:auto;
      max-height:none;
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }
    .pb-tab-panel--clinical {
      height:100%;
      min-height:0;
      width:100%;
      max-width:100%;
      overflow:hidden;
      padding-bottom:0;
      margin-bottom:0;
    }
    .pb-clinical-top-bar {
      padding-bottom:2px;
    }
    /* Compact Clinical Pattern top bar — single-row align, no label */
    .pb-clinical-header-bar {
      padding:7px 12px;
      gap:12px;
      min-height:46px;
      align-items:center;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__icon {
      width:32px;
      height:32px;
      border-radius:8px;
      font-size:16px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap {
      flex:0 0 220px;
      min-width:180px;
      max-width:240px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap .pb-ae-select__control {
      min-height:32px !important;
      border-radius:8px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap .pb-ae-select__value-container {
      padding:0 8px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap .pb-ae-select__indicators {
      height:32px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap .pb-ae-select__dropdown-indicator,
    .pb-clinical-header-bar .pb-ae-header-bar__select-wrap .pb-ae-select__clear-indicator {
      padding:4px 8px;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__divider {
      min-height:24px;
      height:24px;
      align-self:center;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__info {
      display:flex;
      align-items:center;
      justify-content:center;
      flex-wrap:wrap;
      gap:2px 6px;
      padding:0 6px;
      font-size:13px;
      line-height:1.3;
      text-align:center;
    }
    .pb-clinical-header-bar .ae-name {
      font-size:13px;
      line-height:1.25;
    }
    .pb-clinical-header-desc {
      color:#495057;
      font-weight:500;
      font-size:12.5px;
      line-height:1.3;
    }
    .pb-clinical-header-bar .pb-ae-header-bar__category {
      font-size:12px;
      line-height:1.25;
      padding-left:4px;
      max-width:240px;
    }
    /* Align CLINICAL SECTION / KEYWORDS / THERAPEUTICS headers on one level (Repertory style) */
    .pb-tab-panel--clinical .pb-clinical-section-card > .pb-questions-panel-header,
    .pb-tab-panel--clinical .pb-clinical-keywords-card > .pb-questions-panel-header,
    .pb-tab-panel--clinical .pb-clinical-rubrics-card > .pb-questions-panel-header,
    .pb-tab-panel--clinical .pb-clinical-therapeutics-card > .pb-questions-panel-header {
      min-height:44px;
      height:44px;
      padding:8px 12px;
      box-sizing:border-box;
      align-items:center;
      background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border-top-left-radius:11px;
      border-top-right-radius:11px;
    }
    .pb-tab-panel--clinical .pb-clinical-rubrics-card > .pb-questions-panel-header.pb-questions-rubrics-header {
      height:auto;
      min-height:44px;
      flex-wrap:wrap;
    }
    .pb-tab-panel--clinical .pb-clinical-section-card > .pb-questions-panel-header .pb-section-title,
    .pb-tab-panel--clinical .pb-clinical-keywords-card > .pb-questions-panel-header .pb-section-title,
    .pb-tab-panel--clinical .pb-clinical-rubrics-card > .pb-questions-panel-header .pb-section-title,
    .pb-tab-panel--clinical .pb-clinical-therapeutics-card > .pb-questions-panel-header .pb-section-title {
      display:inline-flex !important;
      align-items:center;
      gap:7px;
      font-size:11px;
      letter-spacing:0.06em;
      line-height:1.2;
      white-space:nowrap;
      font-weight:700;
      color:#111827;
    }
    .pb-tab-panel--clinical .pb-repertory-section-title-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:20px;
      height:20px;
      border-radius:6px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      font-size:12px;
      line-height:1;
      flex-shrink:0;
    }
    .pb-tab-panel--clinical .pb-questions-search-wrap {
      display:flex;
      align-items:center;
      min-width:120px;
      max-width:210px;
      flex:1 1 120px;
      height:28px;
    }
    .pb-tab-panel--clinical .pb-clinical-keywords-card .pb-questions-search-box .pb-questions-search-input {
      min-height:28px;
      height:28px;
      padding-top:2px;
      padding-bottom:2px;
      font-size:12px;
      border-radius:999px;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item {
      display:flex;
      align-items:center;
      gap:8px;
      border-left:0 !important;
      border-right:0 !important;
      border-top:0 !important;
      border-bottom-color:#eef2f6 !important;
      border-radius:0;
      margin:0;
      padding:9px 10px !important;
      font-size:12.5px !important;
      font-weight:600;
      letter-spacing:0.02em;
      color:#0f172a;
      cursor:pointer;
      white-space:normal;
      word-break:break-word;
      overflow-wrap:anywhere;
      transition:background-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item__icon {
      width:24px;
      height:24px;
      border-radius:7px;
      flex-shrink:0;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-tab-panel--clinical .pb-clinical-section-item__icon i {
      font-size:13px;
      line-height:1;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item__label {
      min-width:0;
      flex:1 1 auto;
      line-height:1.25;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item:last-child {
      border-bottom:0 !important;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item:hover:not(.pb-clinical-section-item--active):not(.pb-clinical-section-item--disabled) {
      background:#f5faff !important;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item--active {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      color:#0b5cab !important;
      box-shadow:inset 3px 0 0 #1e88e5;
      font-weight:700 !important;
    }
    .pb-tab-panel--clinical .pb-clinical-section-item--active .pb-clinical-section-item__icon {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.28);
    }
    .pb-tab-panel--clinical .pb-clinical-section-scroll {
      padding:8px;
      box-sizing:border-box;
      scrollbar-gutter:stable;
    }
    .pb-tab-panel--clinical .pb-tab-card-divider {
      border-top-color:#eef1f4 !important;
      margin:0 !important;
    }
    .pb-tab-panel--clinical .pb-clinical-zoom-tools {
      gap:6px !important;
    }
    .pb-tab-panel--clinical .pb-clinical-zoom-tools .btn {
      width:28px !important;
      height:28px !important;
      min-width:28px;
      padding:0 !important;
      border-radius:7px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
    }
    .pb-tab-panel--clinical .pb-clinical-zoom-tools .btn i {
      font-size:14px !important;
    }
    .pb-tab-panel--clinical .pb-clinical-zoom-tools .text-muted {
      font-size:11px !important;
      min-width:30px !important;
      line-height:1;
    }
    .pb-clinical-particulars-bar {
      padding:6px 10px;
      border:1px solid #e3e8ee;
      border-radius:10px;
      background:linear-gradient(180deg, #f8fafc 0%, #f3f6f9 100%);
    }
    .pb-tab-sub-view--clinical {
      display:grid !important;
      grid-template-rows:minmax(0, 1fr) minmax(96px, 22%);
      grid-template-columns:minmax(0, 1fr);
      gap:8px;
      flex:1 1 0;
      min-height:0;
      width:100%;
      max-width:100%;
      height:auto;
      overflow:hidden;
      padding-bottom:0;
      margin-top:0.3rem;
      margin-bottom:0;
    }
    .pb-tab-sub-view--clinical > .pb-clinical-main-row {
      display:grid !important;
      grid-template-columns:minmax(0, 2fr) minmax(0, 5fr) minmax(0, 5fr);
      gap:0 8px;
      flex:none;
      min-height:0;
      min-width:0;
      width:100%;
      max-width:100%;
      height:100%;
      max-height:100%;
      overflow:hidden;
      margin:0 !important;
      --bs-gutter-x:0;
      --bs-gutter-y:0;
    }
    .pb-tab-sub-view--clinical > .pb-clinical-main-row > [class*="col-"] {
      padding:0 !important;
      margin:0 !important;
      min-width:0;
      max-width:100%;
      width:100% !important;
      flex:none !important;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-tab-sub-view--clinical .pb-clinical-center-stack {
      display:grid;
      grid-template-rows:minmax(0, 38%) minmax(0, 62%);
      gap:8px;
      min-height:0;
      height:100%;
      width:100%;
    }
    .pb-clinical-keywords-card,
    .pb-clinical-rubrics-card,
    .pb-clinical-section-card,
    .pb-clinical-therapeutics-card {
      min-height:0;
      display:flex;
      flex-direction:column;
      overflow:hidden;
      margin-bottom:0 !important;
      border:1px solid #e3e8ee !important;
      border-radius:12px !important;
      box-shadow:0 1px 2px rgba(16, 24, 40, 0.04);
      background:#fff;
      padding:0 !important;
    }
    .pb-clinical-keywords-scroll,
    .pb-clinical-rubrics-scroll {
      flex:1 1 0;
      min-height:0;
      padding:8px;
      box-sizing:border-box;
      scrollbar-gutter:stable;
    }
    .pb-clinical-section-item--disabled {
      pointer-events:none;
    }
    .pb-clinical-therapeutics-card .therapeutics-content,
    .pb-clinical-therapeutics-card .therapeutics-content p,
    .pb-clinical-therapeutics-card .therapeutics-content span,
    .pb-clinical-therapeutics-card .therapeutics-content div {
      color:#000 !important;
    }
    .pb-clinical-bottom-strip {
      min-height:0;
      min-width:0;
      width:100%;
      max-width:100%;
      height:100%;
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }
    .pb-tab-sub-view--clinical .pb-clinical-table-wrap {
      flex:1 1 0;
      min-height:0;
      min-width:0;
      width:100%;
      max-width:100%;
      height:100%;
      overflow:auto;
      border:1px solid #dbe7f3;
      border-radius:12px;
      box-sizing:border-box;
      background:#fff;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-tab-sub-view--clinical .pb-clinical-table-wrap table,
    .pb-clinical-bottom-table {
      width:100%;
      max-width:100%;
      height:100%;
      table-layout:fixed;
      margin-bottom:0;
    }
    .pb-tab-sub-view--clinical .pb-clinical-table-wrap th,
    .pb-tab-sub-view--clinical .pb-clinical-table-wrap td {
      word-wrap:break-word;
      overflow-wrap:break-word;
    }
    .pb-clinical-bottom-table thead th {
      height:auto;
    }
    .pb-clinical-bottom-table tbody,
    .pb-clinical-bottom-table tbody tr,
    .pb-clinical-bottom-table tbody td {
      height:100%;
    }
    .pb-clinical-th {
      font-weight:700 !important;
      text-align:center !important;
      width:25%;
      font-size:11px;
      letter-spacing:0.04em;
      padding:10px 12px !important;
      border-color:#e2ebf3 !important;
      background:#fff !important;
      color:#000 !important;
    }
    .pb-clinical-th--investigation,
    .pb-clinical-th--allopathic,
    .pb-clinical-th--examination,
    .pb-clinical-th--systems {
      color:#000 !important;
      background:#fff !important;
    }
    .pb-clinical-td {
      padding:10px 12px !important;
      font-size:12px;
      line-height:1.45;
      vertical-align:top;
      border-color:#e2ebf3 !important;
      background:#fff !important;
      color:#000 !important;
    }
    .pb-tab-sub-view--clinical > .pb-clinical-main-row .pb-tab-card--fill {
      flex:1 1 0;
      min-height:0;
      height:auto;
      max-height:none;
      overflow:hidden;
    }
    .pb-tab-cards-row--fill {
      flex:1 1 auto;
      min-height:0;
      height:100%;
      display:flex !important;
      flex-wrap:nowrap;
      align-items:stretch !important;
    }
    .pb-tab-cards-row--fill > [class*="col-"] {
      display:flex;
      flex-direction:column;
      min-height:0;
      height:100%;
    }
    .pb-tab-cards-row--fill .pb-tab-card,
    .pb-tab-panel .pb-tab-card--fill {
      flex:1 1 auto;
      min-height:0;
      height:100%;
      max-height:100%;
      overflow:hidden;
      box-sizing:border-box;
    }
    .pb-tab-sub-view--clinical .pb-tab-card--fill {
      box-sizing:border-box;
      min-width:0;
      max-width:100%;
      width:100%;
    }
    .pb-tab-sub-view .pb-tab-cards-row--split {
      flex:1 1 0;
      min-height:0;
    }
    .pb-tab-panel--repertory {
      height:100%;
      min-height:0;
      width:100%;
      max-width:100%;
      overflow:hidden;
      /* Cancel section-divider mb-1 so global search has equal space above/below */
      margin-top:-0.25rem;
    }
    .pb-tab-sub-view--repertory {
      flex:1 1 0;
      min-height:0;
      width:100%;
      max-width:100%;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      margin-top:0;
    }
    .pb-tab-sub-view--repertory > .pb-tab-cards-row--fill {
      flex:1 1 0;
      min-height:0;
      min-width:0;
      display:grid !important;
      grid-template-columns:minmax(0, 2fr) minmax(0, 4fr) minmax(0, 6fr);
      gap:0 8px;
      width:100%;
      max-width:100%;
      height:100%;
      margin:0 !important;
      --bs-gutter-x:0;
      --bs-gutter-y:0;
    }
    .pb-tab-sub-view--repertory > .pb-tab-cards-row--fill > [class*="col-"] {
      padding:0 !important;
      margin:0 !important;
      min-width:0;
      max-width:100%;
      width:100% !important;
      flex:none !important;
      min-height:0;
      height:100%;
      display:flex;
      flex-direction:column;
    }
    .pb-tab-sub-view--repertory .pb-tab-card--544,
    .pb-tab-sub-view--repertory .pb-tab-card--fill {
      flex:1 1 0;
      min-height:0;
      height:auto;
      max-height:none;
      width:100%;
      max-width:100%;
      min-width:0;
      box-sizing:border-box;
      overflow:hidden;
    }
    /* Premium Repertory UI (visual only — same flow) */
    .pb-tab-panel--repertory .pb-repertory-toolbar {
      --bs-gutter-x:0.5rem;
      --bs-gutter-y:0;
      margin:0;
      /* Equal space above + below global search */
      padding-top:10px;
      padding-bottom:10px;
      align-items:center;
    }
    .pb-tab-panel--repertory .pb-repertory-toolbar > [class*="col"] {
      padding-top:0 !important;
      padding-bottom:0 !important;
    }
    .pb-tab-panel--repertory .pb-repertory-global-search-wrap {
      max-width:360px;
      display:flex;
      align-items:center;
    }
    .pb-tab-panel--repertory .pb-repertory-global-search-wrap .form-control {
      height:32px;
      min-height:32px;
      margin:0;
      padding-top:0;
      padding-bottom:0;
      line-height:1.2;
      font-size:13px;
      border-radius:999px;
      border-color:#dfe3e8;
      transition:border-color .15s ease, box-shadow .15s ease;
    }
    .pb-tab-panel--repertory .pb-repertory-global-search-wrap .search-icon {
      height:32px;
      line-height:32px;
      display:flex;
      align-items:center;
    }
    .pb-tab-panel--repertory .pb-repertory-global-search-wrap .form-control,
    .pb-tab-panel--repertory .pb-subsection-search-wrap .form-control {
      border-color:#dfe3e8;
      transition:border-color .15s ease, box-shadow .15s ease;
    }
    .pb-tab-panel--repertory .pb-repertory-search--active .form-control {
      border-color:#7dd3fc;
      box-shadow:0 0 0 2px rgba(50, 204, 255, 0.14);
    }
    .pb-tab-panel--repertory .pb-repertory-search--active .search-icon {
      color:#25a0e2;
    }
    .pb-tab-panel--repertory .pb-repertory-col-card {
      border:1px solid #e3e8ee !important;
      border-radius:12px !important;
      box-shadow:0 1px 2px rgba(16, 24, 40, 0.04);
      background:#fff;
      /* Flush header to card edge so search spacing is measured against top + divider only */
      padding:0 !important;
    }
    .pb-tab-panel--repertory .pb-repertory-section-scroll,
    .pb-tab-panel--repertory .pb-repertory-subsection-scroll,
    .pb-tab-panel--repertory .pb-tab-card-content {
      padding:8px;
      box-sizing:border-box;
    }
    /* One-level headers: SECTION / SUB SECTION / RUBRIC DETAILS
       Equal distance above/below search via exact padding + control height */
    .pb-tab-panel--repertory .pb-repertory-panel-header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      /* 8 + 28 + 8 = 44 → equal space above/below the search control */
      min-height:44px;
      height:44px;
      padding:8px 12px;
      box-sizing:border-box;
      background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
      border-top-left-radius:11px;
      border-top-right-radius:11px;
      flex-wrap:nowrap;
      overflow:visible;
    }
    .pb-tab-panel--repertory .pb-repertory-panel-header .pb-section-title {
      display:inline-flex !important;
      align-items:center;
      gap:7px;
      margin:0 !important;
      padding:0 !important;
      line-height:1.2 !important;
      height:28px;
      letter-spacing:0.06em;
      font-size:11px;
      font-weight:700;
      color:#111827;
      white-space:nowrap;
      flex-shrink:0;
      min-width:0;
    }
    .pb-tab-panel--repertory .pb-subsection-search-wrap {
      display:flex;
      align-items:center;
      align-self:center;
      min-width:150px;
      max-width:210px;
      flex:1 1 150px;
      height:28px;
      min-height:28px;
      max-height:28px;
      margin:0 !important;
      padding:0 !important;
    }
    .pb-tab-panel--repertory .pb-subsection-search-wrap .search-box {
      position:relative;
      width:100%;
      height:28px;
      min-height:28px;
      margin:0 !important;
      padding:0 !important;
      display:block;
    }
    .pb-tab-panel--repertory .pb-subsection-search-wrap .form-control {
      height:28px !important;
      min-height:28px !important;
      max-height:28px !important;
      margin:0 !important;
      padding-top:0 !important;
      padding-bottom:0 !important;
      font-size:12px;
      line-height:28px !important;
      border-radius:999px;
      box-sizing:border-box !important;
    }
    .pb-tab-panel--repertory .pb-subsection-search-wrap .search-icon {
      position:absolute;
      top:50%;
      transform:translateY(-50%);
      left:10px;
      height:auto;
      line-height:1;
      display:flex;
      align-items:center;
      margin:0;
      padding:0;
    }
    .pb-tab-panel--repertory .pb-repertory-section-title-icon {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:20px;
      height:20px;
      border-radius:6px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      font-size:12px;
      line-height:1;
      flex-shrink:0;
    }
    .pb-tab-panel--repertory .pb-tab-card-divider {
      border-top-color:#eef1f4 !important;
      margin:0 !important;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item {
      display:flex;
      align-items:center;
      gap:8px;
      border-left:0 !important;
      border-right:0 !important;
      border-top:0 !important;
      border-bottom-color:#eef2f6 !important;
      border-radius:0;
      margin:0;
      padding:9px 10px !important;
      font-size:12.5px !important;
      font-weight:600;
      letter-spacing:0.02em;
      color:#0f172a;
      transition:background-color .12s ease, color .12s ease, box-shadow .12s ease;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item__icon {
      width:24px;
      height:24px;
      border-radius:7px;
      flex-shrink:0;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-tab-panel--repertory .pb-repertory-section-item__icon i {
      font-size:13px;
      line-height:1;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item__label {
      min-width:0;
      flex:1 1 auto;
      line-height:1.25;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item:last-child {
      border-bottom:0 !important;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item:hover:not(.pb-repertory-section-item--active) {
      background:#f5faff !important;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item--active {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      color:#0b5cab !important;
      box-shadow:inset 3px 0 0 #1e88e5;
      font-weight:700 !important;
    }
    .pb-tab-panel--repertory .pb-repertory-section-item--active .pb-repertory-section-item__icon {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.28);
    }
    .pb-tab-panel--repertory .pb-repertory-section-scroll {
      scrollbar-gutter:stable;
    }
    .pb-tab-panel--repertory .pb-rubric-row--repertory-subsection {
      border-radius:0;
      margin:0;
      padding:8px 10px !important;
      transition:background-color .12s ease;
    }
    .pb-tab-panel--repertory .pb-rubric-row--repertory-subsection-selected {
      background-color:var(--bs-info-bg-subtle, #dff0fa) !important;
      box-shadow:inset 3px 0 0 #32ccff;
    }
    .pb-tab-panel--repertory .pb-rubric-row--repertory-subsection-selected:hover {
      background-color:#d4ebf7 !important;
    }
    .pb-tab-panel--repertory .pb-subsection-tree-toggle {
      border-radius:6px;
      border-color:#d0d7de;
      background:#fff;
      color:#1e88e5;
      width:18px;
      height:18px;
    }
    .pb-tab-panel--repertory .pb-subsection-tree-toggle:hover,
    .pb-tab-panel--repertory .pb-subsection-tree-toggle:focus {
      background:#e8f5ff;
      border-color:#b3dbff;
      color:#1976d2;
    }
    .pb-tab-panel--repertory .pb-subsection-tree-children {
      border-left-color:#e8eef4;
      margin-left:10px;
      padding-left:12px;
    }
    .pb-tab-panel--repertory .pb-repertory-empty-hint {
      padding-top:2rem !important;
      padding-bottom:2rem !important;
    }
    .pb-tab-panel--repertory .pb-repertory-details-title-bar {
      border-bottom:1px solid #eef1f4 !important;
      padding:8px 4px 10px !important;
      margin-bottom:8px !important;
    }
    .pb-tab-panel--repertory .pb-repertory-details-title {
      color:#111827 !important;
      font-size:13.5px !important;
      line-height:1.35;
      display:flex;
      flex-wrap:wrap;
      align-items:baseline;
      gap:6px;
    }
    .pb-tab-panel--repertory .pb-repertory-details-name {
      font-weight:700;
    }
    .pb-tab-panel--repertory .pb-repertory-details-count {
      font-weight:600;
      font-size:12px;
      color:#1e88e5;
      background:#e8f5ff;
      border:1px solid #cfe9ff;
      border-radius:999px;
      padding:1px 8px;
    }
    .pb-tab-panel--repertory .pb-repertory-subheading {
      font-size:11px;
      letter-spacing:0.04em;
      text-transform:uppercase;
      color:#6b7280;
    }
    .pb-tab-panel--repertory .pb-reference-rubric-section {
      border-bottom:1px solid #eef1f4;
      padding-bottom:10px;
      margin-bottom:8px;
    }
    .pb-tab-panel--repertory .pb-reference-rubric-list {
      max-height:120px;
      margin-top:8px;
      display:flex;
      flex-direction:column;
      gap:2px;
    }
    .pb-tab-panel--repertory .pb-reference-rubric-item {
      padding:5px 8px;
      border-radius:6px;
      font-size:12px;
      line-height:1.35;
      color:#1e88e5 !important;
      transition:background-color .12s ease;
    }
    .pb-tab-panel--repertory .pb-reference-rubric-item + .pb-reference-rubric-item {
      border-top:none;
    }
    .pb-tab-panel--repertory .pb-reference-rubric-item:hover {
      background:#f4faff;
    }
    .pb-tab-panel--repertory .pb-rubric-data-header {
      border-top:none;
      border-bottom:1px solid #eef1f4;
      padding:6px 2px 8px;
      margin:4px 0 8px;
    }
    .pb-tab-panel--repertory .pb-repertory-remedy-wrap {
      line-height:2;
      word-spacing:2px;
      padding:2px 2px 8px;
    }
    .pb-tab-panel--repertory .remedy-item {
      border-radius:6px;
      padding:3px 5px;
      margin:1px 2px;
    }
    .pb-tab-panel--repertory .remedy-item:hover {
      background-color:#f4faff;
      box-shadow:inset 0 0 0 1px #cfe9ff;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions {
      display:flex;
      align-items:center;
      flex-shrink:0;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .pb-rubric-tools {
      padding:3px;
      gap:5px;
      border-radius:10px;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .modal-header-btn {
      border-radius:8px;
      width:28px;
      height:28px;
      min-width:28px;
      padding:0;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .modal-header-btn.modal-header-btn--lang {
      width:auto;
      min-width:32px;
      height:28px;
      padding:0 8px;
      font-size:11px;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .modal-header-btn.active {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .modal-header-btn:hover {
      background:#f4faff;
      border-color:#93c5fd;
      color:#0b5cab;
    }
    .pb-tab-panel--repertory .pb-panel-header-actions .modal-header-btn.active:hover {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
    }
    .pb-tab-panel--repertory .pb-repertory-details-card .pb-repertory-panel-header .pb-section-title {
      display:inline-flex;
      align-items:center;
      gap:7px;
      font-size:11px;
      letter-spacing:0.06em;
    }
    .pb-tab-main-view--scroll {
      overflow:visible;
      height:auto;
      flex:1 1 auto;
      min-height:0;
      max-height:none;
    }
    .pb-tab-main-view--scroll > .pb-tab-panel--repertorize {
      height:auto;
      min-height:0;
      flex:none;
      overflow:visible;
    }
    .pb-tab-panel--repertorize {
      height:auto;
      overflow:visible;
      flex:none;
      padding-bottom:0.5rem;
      gap:0;
    }
    .pb-repertorize-toolbar {
      --bs-gutter-x:0.5rem;
      --bs-gutter-y:0;
      padding:6px 10px;
      margin-left:0 !important;
      margin-right:0 !important;
      margin-bottom:6px !important;
      min-height:40px;
      align-items:center;
      border:1px solid #dbe7f3;
      border-radius:12px;
      background:linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-repertorize-toolbar > [class*="col"] {
      padding-top:0 !important;
      padding-bottom:0 !important;
      display:flex;
      align-items:center;
    }
    .pb-repertorize-toolbar__thermals {
      gap:6px !important;
    }
    .pb-repertorize-toolbar__thermals .pb-circle {
      width:20px;
      height:20px;
      margin-left:0;
      font-size:7px;
    }
    .pb-repertorize-toolbar__actions {
      gap:6px !important;
    }
    .pb-repertorize-toolbar .btn-sm,
    .pb-repertorize-toolbar__add,
    .pb-repertorize-toolbar__reset,
    .pb-repertorize-toolbar__keynote,
    .pb-repertorize-toolbar__small {
      height:28px !important;
      min-height:28px;
      padding:0 10px !important;
      font-size:11px !important;
      line-height:1 !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
      border-radius:8px !important;
    }
    .pb-repertorize-toolbar__add {
      background:#38bdf8 !important;
      border-color:#0ea5e9 !important;
      color:#0c4a6e !important;
      font-weight:700;
      box-shadow:0 1px 2px rgba(14, 165, 233, 0.2);
    }
    .pb-repertorize-toolbar__add:hover {
      background:#0ea5e9 !important;
      border-color:#0284c7 !important;
      color:#fff !important;
    }
    .pb-repertorize-toolbar__reset {
      background:#eef2f7 !important;
      border:1px solid #d5dde8 !important;
      color:#334155 !important;
      font-weight:600;
    }
    .pb-repertorize-toolbar__keynote {
      background:#fff !important;
      border:1px solid #c7d2fe !important;
      color:#4338ca !important;
      font-weight:600;
      transition:background-color .15s ease, border-color .15s ease, box-shadow .15s ease, color .15s ease;
    }
    .pb-repertorize-toolbar__keynote:hover {
      background:#eef2ff !important;
      border-color:#a5b4fc !important;
    }
    .pb-repertorize-toolbar__keynote.is-active {
      background:linear-gradient(180deg, #eef2ff 0%, #e0e7ff 100%) !important;
      border-color:#6366f1 !important;
      color:#312e81 !important;
      box-shadow:0 0 0 3px rgba(99, 102, 241, 0.16);
    }
    .pb-repertorize-toolbar__small {
      background:#fff !important;
      border:1px solid #a7f3d0 !important;
      color:#047857 !important;
      font-weight:600;
      transition:background-color .15s ease, border-color .15s ease, box-shadow .15s ease, color .15s ease;
    }
    .pb-repertorize-toolbar__small:hover {
      background:#ecfdf5 !important;
      border-color:#6ee7b7 !important;
    }
    .pb-repertorize-toolbar__small.is-active {
      background:linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%) !important;
      border-color:#10b981 !important;
      color:#065f46 !important;
      box-shadow:0 0 0 3px rgba(16, 185, 129, 0.16);
    }
    /* Keynote / Small Rubrics list surfaces — no pink wash */
    .pb-tab-panel--repertorize .pb-tab-card-scroll.keynote-active {
      background:linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
      box-shadow:inset 0 0 0 1px #e2e8f0;
      border-radius:8px;
    }
    .pb-tab-panel--repertorize .pb-tab-card-scroll.small-rubrics-active {
      background:linear-gradient(180deg, #f8fffc 0%, #ecfdf5 100%) !important;
      box-shadow:inset 0 0 0 1px #d1fae5;
      border-radius:8px;
    }
    .pb-tab-panel--repertorize .pb-tab-card-scroll.keynote-active > div > .pb-remedy-list-row,
    .pb-tab-panel--repertorize .pb-tab-card-scroll.small-rubrics-active > div > .pb-remedy-list-row {
      background:rgba(255,255,255,0.72);
      border-bottom-color:#e8eef5 !important;
    }
    .pb-tab-panel--repertorize .pb-tab-card-scroll.keynote-active > div > .pb-remedy-list-row:hover,
    .pb-tab-panel--repertorize .pb-tab-card-scroll.small-rubrics-active > div > .pb-remedy-list-row:hover {
      background:#fff !important;
    }
    .pb-repertorize-accordion-panel {
      margin:4px 8px 10px;
      padding:10px 12px !important;
      border-radius:10px;
      background:#fff !important;
      border:1px solid #e2ebf3 !important;
      border-left:3px solid #64748b !important;
      box-shadow:0 1px 3px rgba(15, 23, 42, 0.06);
    }
    .keynote-active .pb-repertorize-accordion-panel {
      border-left-color:#6366f1 !important;
      border-color:#e0e7ff !important;
      background:linear-gradient(180deg, #ffffff 0%, #f8faff 100%) !important;
    }
    .small-rubrics-active .pb-repertorize-accordion-panel {
      border-left-color:#10b981 !important;
      border-color:#d1fae5 !important;
      background:linear-gradient(180deg, #ffffff 0%, #f6fffb 100%) !important;
    }
    .keynote-active .pb-accordion-sublist-label,
    .small-rubrics-active .pb-accordion-sublist-label {
      font-weight:600;
      letter-spacing:0.01em;
      line-height:1.4;
    }
    .keynote-active .pb-accordion-sublist-row,
    .small-rubrics-active .pb-accordion-sublist-row {
      border-bottom-color:#eef2f7 !important;
      border-radius:6px;
      margin:0 0 2px;
    }
    .keynote-active .pb-accordion-sublist-row:hover,
    .small-rubrics-active .pb-accordion-sublist-row:hover {
      background:#f8fafc !important;
    }
    .pb-tab-panel--repertorize .keynote-active .ri-arrow-right-s-line,
    .pb-tab-panel--repertorize .keynote-active .ri-arrow-down-s-line {
      color:#6366f1;
    }
    .pb-tab-panel--repertorize .small-rubrics-active .ri-arrow-right-s-line,
    .pb-tab-panel--repertorize .small-rubrics-active .ri-arrow-down-s-line {
      color:#059669;
    }
    .pb-repertorize-panel-card {
      border-color:#dbe7f3 !important;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
      background:#fff;
      border-radius:12px !important;
      padding:0 !important;
    }
    /* One-level headers: Repertorization / COMMON / UNCOMMON / SECTION
       + DIFFERENTIAL MATERIA MEDICA / HEADINGS — shared locked row */
    .pb-tab-panel--repertorize .pb-repertorize-panel-header,
    .pb-tab-panel--repertorize .pb-repertorize-side-header {
      display:flex !important;
      align-items:center !important;
      justify-content:space-between;
      gap:8px;
      min-height:44px !important;
      height:44px !important;
      max-height:44px !important;
      padding:0 12px !important;
      box-sizing:border-box !important;
      flex-wrap:nowrap !important;
      flex-shrink:0 !important;
      overflow:hidden;
      margin:0 !important;
      background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%) !important;
      border-top-left-radius:11px;
      border-top-right-radius:11px;
      border-bottom:none !important;
    }
    /* Keep all four top cards + DMM/HEADINGS headers on exact same baseline */
    .pb-tab-panel--repertorize .pb-repertorize-panel-card,
    .pb-tab-panel--repertorize .pb-repertorize-section-card,
    .pb-tab-panel--repertorize .pb-repertorize-dmm-card,
    .pb-tab-panel--repertorize .pb-repertorize-headings-card {
      display:flex !important;
      flex-direction:column !important;
      padding:0 !important;
      overflow:hidden;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-card > .pb-repertorize-panel-header,
    .pb-tab-panel--repertorize .pb-repertorize-section-card > .pb-repertorize-panel-header,
    .pb-tab-panel--repertorize .pb-repertorize-dmm-card > .pb-repertorize-panel-header,
    .pb-tab-panel--repertorize .pb-repertorize-headings-card > .pb-repertorize-panel-header {
      order:0;
      width:100%;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-card > .pb-section-divider,
    .pb-tab-panel--repertorize .pb-repertorize-section-card > .pb-section-divider,
    .pb-tab-panel--repertorize .pb-repertorize-dmm-card > .pb-section-divider,
    .pb-tab-panel--repertorize .pb-repertorize-headings-card > .pb-section-divider {
      order:1;
      width:100%;
    }
    .pb-tab-panel--repertorize .pb-section-divider {
      margin:0 !important;
      border-top:1px solid #eef1f4 !important;
      flex-shrink:0;
    }
    .pb-repertorize-count-pill {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:20px;
      height:18px;
      margin-left:6px;
      padding:0 6px;
      border-radius:999px;
      font-size:10px;
      font-weight:700;
      color:#0b5cab;
      background:linear-gradient(180deg, #eaf5ff 0%, #d9ecff 100%);
      border:1px solid #b6d8f7;
      vertical-align:middle;
      line-height:1;
    }
    .pb-tab-panel--repertorize .pb-repertorization-rubric-row {
      border-radius:0;
      padding:10px 12px !important;
      border-bottom-color:#eef2f6 !important;
      transition:background-color .12s ease;
    }
    .pb-tab-panel--repertorize .pb-repertorization-rubric-row:hover {
      background:#f5faff;
    }
    .pb-tab-panel--repertorize .pb-repertorization-rubric-label {
      font-size:12.5px;
      font-weight:600;
      color:#0f172a;
      letter-spacing:-0.01em;
    }
    .pb-tab-panel--repertorize .pb-repertorize-common-col .pb-remedy-list-row,
    .pb-tab-panel--repertorize .pb-repertorize-uncommon-col .pb-remedy-list-row {
      transition:background-color .14s ease, box-shadow .14s ease;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-header .pb-section-title,
    .pb-tab-panel--repertorize .pb-repertorize-side-header .pb-section-title {
      display:inline-flex !important;
      align-items:center !important;
      gap:7px;
      margin:0 !important;
      padding:0 !important;
      line-height:1.2 !important;
      height:28px !important;
      min-height:28px;
      max-height:28px;
      font-size:11px !important;
      font-weight:700 !important;
      letter-spacing:0.06em;
      text-transform:uppercase;
      color:#0f172a !important;
      white-space:nowrap;
      flex-shrink:1;
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .pb-repertorize-side-header__icon {
      width:20px !important;
      height:20px !important;
      min-width:20px;
      border-radius:6px !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%) !important;
      border:1px solid #cfe3f7 !important;
      color:#0b5cab !important;
      font-size:12px !important;
      line-height:1;
      flex-shrink:0;
    }
    .pb-repertorize-header-search {
      min-width:140px;
      max-width:180px;
      flex:0 1 160px;
      display:flex;
      align-items:center;
      height:28px;
      margin:0;
      padding:0;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-header .pb-questions-search-box,
    .pb-repertorize-header-search .pb-questions-search-box {
      width:100%;
      height:28px;
      min-height:28px;
      margin:0;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-header .pb-questions-search-input {
      border-radius:999px !important;
      border-color:#d7e3ef !important;
      background:#f8fafc !important;
      font-size:12px;
      height:28px !important;
      min-height:28px !important;
      max-height:28px !important;
      margin:0 !important;
      padding-top:0 !important;
      padding-bottom:0 !important;
      padding-left:30px !important;
      line-height:28px !important;
      box-sizing:border-box !important;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-header .pb-questions-search-box .search-icon {
      top:50%;
      transform:translateY(-50%);
      height:auto;
      line-height:1;
    }
    .pb-tab-panel--repertorize .pb-repertorize-panel-header .pb-questions-search-input:focus {
      background:#fff !important;
      border-color:#93c5fd !important;
      box-shadow:0 0 0 3px rgba(30, 136, 229, 0.12);
    }
    .pb-repertorize-dmm-tab {
      flex:1 1 0;
      background:#fff !important;
      border:1px solid #d7e6f5 !important;
      color:#334155 !important;
      font-size:11px;
      font-weight:700;
      letter-spacing:0.04em;
      padding:0 8px !important;
      height:30px;
      min-height:30px;
      border-radius:8px !important;
      display:inline-flex !important;
      align-items:center;
      justify-content:center;
    }
    .pb-repertorize-dmm-tab.is-active {
      background:#0f172a !important;
      border-color:#0f172a !important;
      color:#fff !important;
    }
    .pb-tab-panel--repertorize .pb-repertorize-dmm-tabs {
      width:100%;
      gap:6px;
      margin:8px 0 0;
      flex-shrink:0;
    }
    .pb-tab-panel--repertorize .pb-dmm-author-row {
      gap:6px;
      padding:8px 10px;
      margin:0 !important;
      flex-wrap:wrap;
      flex-shrink:0;
    }
    .pb-tab-panel--repertorize .pb-dmm-author-tab {
      flex:0 1 auto;
      min-width:0;
      padding:5px 10px;
      border-radius:999px;
      border:1px solid #cfd8e3;
      background:#fff;
      color:#475569;
      font-size:11px;
      font-weight:600;
      text-decoration:none;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-tab-panel--repertorize .pb-dmm-author-tab:hover {
      border-color:#b8e2f4;
      color:#1f4e8c;
      background:#f8fbfd;
    }
    .pb-tab-panel--repertorize .pb-dmm-author-tab.active {
      background:var(--bs-info-bg-subtle, #dff0fa);
      border-color:#b8e2f4;
      color:#1f4e8c;
      text-decoration:none;
    }
    .pb-tab-panel--repertorize .pb-repertorize-section-row,
    .pb-tab-panel--repertorize .pb-repertorize-heading-row {
      transition:background-color .12s ease, box-shadow .12s ease;
    }
    .pb-tab-panel--repertorize .pb-repertorize-section-row:hover,
    .pb-tab-panel--repertorize .pb-repertorize-heading-row:hover {
      background:#f5faff;
    }
    .pb-tab-panel--repertorize .pb-tab-card--500 {
      height:100%;
      max-height:100%;
      min-height:0;
      overflow:hidden;
      flex:1 1 auto;
    }
    .pb-tab-panel--repertorize .pb-tab-card--580:not(.pb-tab-card--headings) {
      height:100%;
      max-height:100%;
      min-height:0;
      overflow:hidden;
      flex:1 1 auto;
    }
    .pb-tab-panel--repertorize .pb-tab-card--580:not(.pb-tab-card--headings) .pb-tab-card-scroll {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
    }
    .pb-tab-panel--repertorize .pb-repertorize-section-card,
    .pb-tab-panel--repertorize .pb-repertorize-headings-card,
    .pb-tab-panel--repertorize .pb-repertorize-dmm-card {
      display:flex;
      flex-direction:column;
      min-height:0;
      overflow:hidden;
      border-color:#dbe7f3 !important;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
      background:#fff;
      height:100%;
      max-height:100%;
      flex:1 1 auto;
      width:100%;
      padding:0 !important;
      border-radius:12px !important;
    }
    .pb-tab-panel--repertorize .pb-tab-card--580.pb-tab-card--headings {
      height:100%;
      max-height:100%;
      min-height:0;
      overflow:hidden;
      flex:1 1 auto;
      align-self:stretch;
    }
    .pb-tab-panel--repertorize .pb-tab-card--headings .pb-tab-card-scroll,
    .pb-tab-panel--repertorize .pb-repertorize-section-card .pb-tab-card-scroll {
      flex:1 1 auto;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
    }
    .pb-tab-panel--repertorize .pb-repertorize-section-card {
      padding:0 !important;
    }
    .pb-repertorize-side-header {
      flex-shrink:0;
    }
    .pb-repertorize-section-grades {
      flex-shrink:0;
      border-top:1px solid #eef1f4;
      padding:8px 8px 10px;
      background:linear-gradient(180deg, #fafbfc 0%, #fff 100%);
    }
    .pb-repertorize-section-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:9px 12px !important;
      border-bottom:1px solid #eef2f6 !important;
      transition:background-color .14s ease, box-shadow .14s ease;
    }
    .pb-repertorize-section-row__label {
      display:inline-flex;
      align-items:center;
      gap:10px;
      min-width:0;
      flex:1 1 auto;
      font-size:12.5px;
      font-weight:600;
      color:#0f172a;
      letter-spacing:0.02em;
      line-height:1.3;
    }
    .pb-repertorize-section-icon {
      width:28px;
      height:28px;
      border-radius:8px;
      flex-shrink:0;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%);
      border:1px solid #cfe3f7;
      color:#0b5cab;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-repertorize-section-icon i {
      font-size:15px;
      line-height:1;
    }
    .pb-repertorize-section-row .form-check-input,
    .pb-repertorize-heading-row .form-check-input {
      width:16px;
      height:16px;
      margin:0;
      flex-shrink:0;
      border-radius:4px;
      border-color:#cbd5e1;
      cursor:inherit;
      box-shadow:none;
    }
    .pb-repertorize-section-row .form-check-input:checked,
    .pb-repertorize-heading-row .form-check-input:checked {
      background-color:#1e88e5;
      border-color:#1e88e5;
    }
    .pb-repertorize-section-row .form-check-input:focus,
    .pb-repertorize-heading-row .form-check-input:focus {
      box-shadow:0 0 0 3px rgba(30, 136, 229, 0.18);
      border-color:#93c5fd;
    }
    .pb-repertorize-section-row--active {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      box-shadow:inset 3px 0 0 #1e88e5;
    }
    .pb-repertorize-section-row--active .pb-repertorize-section-icon,
    .pb-repertorize-heading-row--active .pb-repertorize-heading-icon {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%);
      border-color:#0b5cab;
      color:#fff;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.28);
    }
    .pb-repertorize-section-row--active .pb-repertorize-section-row__label {
      color:#0b5cab;
    }
    .pb-repertorize-grade-btn {
      width:26px !important;
      height:26px !important;
      min-width:26px;
      padding:0 !important;
      font-size:11px !important;
      font-weight:700;
      line-height:1;
      border-radius:8px !important;
      border:1px solid #d7e3ef !important;
      background:#fff !important;
      color:#475569 !important;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
      transition:background-color .14s ease, border-color .14s ease, color .14s ease, box-shadow .14s ease;
    }
    .pb-repertorize-grade-btn:hover:not(:disabled) {
      border-color:#93c5fd !important;
      color:#0b5cab !important;
      background:#f5faff !important;
    }
    .pb-repertorize-grade-btn.is-active {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      border-color:#0b5cab !important;
      color:#fff !important;
      box-shadow:0 1px 3px rgba(11, 92, 171, 0.3);
    }
    .pb-repertorize-grade-btn:disabled {
      opacity:0.45;
      cursor:not-allowed;
    }
    .pb-repertorize-heading-row--active {
      background:linear-gradient(90deg, #f0f7ff 0%, #f8fbff 100%) !important;
      box-shadow:inset 3px 0 0 #1e88e5;
    }
    .pb-tab-panel--repertorize .pb-repertorize-heading-row {
      padding:9px 12px !important;
      border-bottom-color:#eef2f6 !important;
      margin:0;
      border-radius:0;
    }
    .pb-repertorize-heading-icon {
      width:28px;
      height:28px;
      border-radius:8px;
      background:linear-gradient(180deg, #f0f7ff 0%, #e3f0fc 100%) !important;
      border:1px solid #cfe3f7 !important;
      color:#0b5cab !important;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-repertorize-heading-row--active .pb-repertorize-heading-icon {
      background:linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%) !important;
      border-color:#0b5cab !important;
      color:#fff !important;
    }
    .pb-tab-panel--repertorize .pb-repertorize-dmm-card .pb-tab-card-scroll,
    .pb-tab-panel--repertorize .pb-repertorize-headings-card .pb-tab-card-scroll {
      padding:4px 0;
    }
    .pb-tab-panel--repertorize .pb-repertorize-bottom-row {
      align-items:stretch;
      height:100%;
      margin:0 !important;
    }
    .pb-tab-panel--repertorize .pb-repertorize-bottom-row > [class*="col-"] {
      display:flex;
      flex-direction:column;
      height:100%;
    }
    .pb-questions-rubrics-card {
      min-height:0;
      height:100%;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      margin-bottom:0 !important;
    }
    .pb-questions-rubrics-scroll {
      flex:1 1 0;
      min-height:0;
      height:0;
      display:block;
      margin:0 !important;
      overflow-y:auto;
      overflow-x:hidden;
      padding:4px 0;
    }
    .pb-questions-rubrics-list {
      display:flex;
      flex-direction:column;
      width:100%;
    }
    .pb-questions-rubric-item {
      display:block;
      width:100%;
      word-break:break-word;
      overflow-wrap:anywhere;
      white-space:normal;
      line-height:1.35;
      font-size:12.5px;
      min-height:0;
      box-sizing:border-box;
      padding:5px 12px !important;
      border-left:0 !important;
      border-right:0 !important;
      border-top:0 !important;
      transition:padding-right .15s ease, background-color .15s ease;
    }
    .pb-questions-rubric-item:last-child {
      border-bottom:0 !important;
    }
    .pb-questions-rubric-item:hover {
      background:#f8fbfd;
      padding-right:80px !important;
    }
    .pb-questions-rubric-label {
      display:block;
      color:#212529;
      font-weight:500;
      line-height:1.35;
    }
    /* Clinical Pattern rubrics — denser rows for better space use */
    .pb-clinical-rubrics-card .pb-questions-rubric-item {
      padding:4px 10px !important;
      font-size:12px;
      line-height:1.3;
    }
    .pb-clinical-rubrics-card .pb-questions-rubric-item:hover {
      padding-right:72px !important;
    }
    .pb-clinical-rubrics-card .pb-questions-rubric-label {
      line-height:1.3;
    }
    .pb-questions-rubrics-footer {
      flex-shrink:0;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      flex-wrap:wrap;
      padding:8px 12px;
      border-top:1px solid #eef1f4;
      background:linear-gradient(180deg, #fafbfc 0%, #fff 100%);
      font-size:11px;
      color:#6c757d;
    }
    .pb-questions-rubrics-footer strong {
      color:#495057;
      font-weight:600;
    }
    .pb-questions-rubrics-list__status {
      width:100%;
      text-align:center;
      padding:10px 12px;
    }
    .pb-questions-context-bar {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
      padding:10px 14px;
      background:linear-gradient(180deg, #f8fafc 0%, #f3f6f9 100%);
      border:1px solid #e3e8ee;
      border-radius:10px;
    }
    .pb-questions-context-label {
      font-size:11px;
      font-weight:700;
      letter-spacing:0.06em;
      text-transform:uppercase;
      color:#6c757d;
      margin-bottom:4px;
    }
    .pb-questions-subgroup-pill {
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding:6px 12px;
      border-radius:999px;
      background:#fff;
      border:1px solid #cfd8e3;
      color:#212529;
      font-size:13px;
      font-weight:600;
      box-shadow:0 1px 2px rgba(16, 24, 40, 0.04);
    }
    .pb-questions-subgroup-pill i {
      color:#25a0e2;
      font-size:15px;
    }
    .pb-questions-result-count {
      font-size:11px;
      font-weight:600;
      color:#25a0e2;
      background:var(--bs-info-bg-subtle, #dff0fa);
      border:1px solid #b8e2f4;
      border-radius:999px;
      padding:3px 10px;
      white-space:nowrap;
    }
    .pb-questions-rubrics-header {
      height:auto;
      min-height:44px;
      padding-top:8px;
      padding-bottom:8px;
      flex-wrap:wrap;
    }
    .pb-body-part-tab {
      flex:1 1 auto;
      min-height:0;
      height:100%;
      overflow:hidden;
    }
    .da-container {
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      flex:1 1 auto;
      min-height:100%;
      border:1px solid var(--minimal-card-border, #b9b9b9);
      border-radius:0.375rem;
      background-color:#fff;
      box-shadow:none;
    }
    .da-icon-wrapper { position:relative; width:80px; height:80px; margin-bottom:20px; }
    .da-pulse { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:50px; height:50px; border-radius:50%; background:#000000; animation:pulse 2s infinite; }
    .da-spin { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:65px; height:65px; border:3px solid #f1f3f5; border-top:3px solid #000000; border-radius:50%; animation:spin 1.5s linear infinite; }
    .da-text { font-size:1.1rem; font-weight:600; color:#000000; animation:fadeInOut 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity:0.4; transform:translate(-50%,-50%) scale(0.8); } 50% { opacity:1; transform:translate(-50%,-50%) scale(1); } }
    @keyframes spin { 0% { transform:translate(-50%,-50%) rotate(0deg); } 100% { transform:translate(-50%,-50%) rotate(360deg); } }
    @keyframes fadeInOut { 0%, 100% { opacity:0.5; } 50% { opacity:1; } }
    .rrd-body, .rrd-body p { text-align:justify; }
    /* Premium Clinical Pattern / Questions rubric remedy modal */
    .pb-rubric-remedy-modal .modal-dialog {
      max-width:min(1100px, 94vw);
    }
    .pb-rubric-remedy-modal__content {
      border:1px solid #dbe7f3 !important;
      border-radius:16px !important;
      overflow:hidden;
      box-shadow:0 22px 60px rgba(15, 23, 42, 0.22), 0 2px 10px rgba(15, 23, 42, 0.08) !important;
      background:
        linear-gradient(180deg, #ffffff 0%, #f8fbff 48%, #f3f7fb 100%) !important;
      /* patient-board-page also sets min-height:100vh — kill that on modal content */
      min-height:0 !important;
      height:auto !important;
      max-height:min(88vh, 860px);
      display:flex;
      flex-direction:column;
    }
    .modal-content.pb-rubric-remedy-modal__content.patient-board-page {
      min-height:0 !important;
      height:auto !important;
    }
    .pb-rubric-remedy-modal__toolbar {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:12px 16px;
      background:linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%);
      border-bottom:1px solid #dbe7f3;
    }
    .pb-rubric-remedy-modal__toolbar-group {
      display:flex;
      align-items:center;
      gap:8px;
    }
    .pb-rubric-remedy-modal__toolbar .modal-header-btn {
      width:auto;
      min-width:32px;
      height:32px;
      padding:0 8px;
      border-radius:10px;
      border:1px solid #d7e6f5;
      background:#fff;
      color:#334155;
      box-shadow:0 1px 2px rgba(15, 23, 42, 0.04);
    }
    .pb-rubric-remedy-modal__toolbar .modal-header-btn:hover {
      background:#f4faff;
      border-color:#b6d8f7;
      color:#1e88e5;
    }
    .pb-rubric-remedy-modal__toolbar .modal-header-btn.active {
      background:#e8f5ff;
      border-color:#90caf9;
      color:#1565c0;
      box-shadow:inset 0 0 0 1px rgba(30, 136, 229, 0.12);
    }
    .pb-rubric-remedy-modal__body {
      padding:18px 20px 12px !important;
      display:flex;
      flex-direction:column;
      gap:0;
      max-height:min(68vh, 720px);
      overflow:hidden;
      flex:0 1 auto;
    }
    .pb-rubric-remedy-modal__title-bar {
      padding-bottom:12px;
      margin-bottom:10px;
      border-bottom:1px solid #e2ebf3;
      flex-shrink:0;
    }
    .pb-rubric-remedy-modal__title {
      color:#0f172a !important;
      font-size:16px !important;
      font-weight:700 !important;
      letter-spacing:0.01em;
      line-height:1.35;
      word-break:break-word;
    }
    .pb-rubric-remedy-modal__meta {
      margin-bottom:12px;
      padding:10px 12px;
      border-radius:10px;
      background:#f8fafc;
      border:1px solid #e8eef5;
      flex-shrink:0;
    }
    .pb-rubric-remedy-modal__description {
      font-size:13px;
      line-height:1.5;
      color:#64748b !important;
      margin:0;
    }
    .pb-rubric-remedy-modal__count-bar {
      display:flex;
      align-items:center;
      gap:10px;
      margin-bottom:14px;
      padding-bottom:12px;
      border-bottom:1px solid #e2ebf3;
      flex-shrink:0;
    }
    .pb-rubric-remedy-modal__count-label {
      font-size:13px;
      font-weight:700;
      color:#0f172a;
      letter-spacing:0.02em;
    }
    .pb-rubric-remedy-modal__count-pill {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-width:34px;
      height:26px;
      padding:0 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:700;
      color:#0b5cab;
      background:linear-gradient(180deg, #eaf5ff 0%, #d9ecff 100%);
      border:1px solid #b6d8f7;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.75);
    }
    .pb-rubric-remedy-modal__remedies {
      flex:0 1 auto;
      min-height:0;
      max-height:min(42vh, 420px);
      overflow-y:auto;
      overflow-x:hidden;
      padding:2px 2px 4px;
      margin:0 -2px;
    }
    .pb-rubric-remedy-modal__remedy-wrap {
      line-height:2.15;
      word-spacing:4px;
      padding:2px 4px 4px;
    }
    .pb-rubric-remedy-modal__remedy-wrap .remedy-item {
      border-radius:8px;
      padding:5px 7px;
      margin:2px 3px;
      transition:background-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
    }
    .pb-rubric-remedy-modal__remedy-wrap .remedy-item:hover {
      background-color:#f4faff;
      box-shadow:inset 0 0 0 1px #cfe9ff;
      transform:translateY(-1px);
    }
    .pb-rubric-remedy-modal__footer {
      border-top:1px solid #e2ebf3 !important;
      background:linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
      padding:12px 16px !important;
      margin-top:0 !important;
      flex-shrink:0;
    }
    .pb-rubric-remedy-modal__footer .btn-ghost-danger {
      border-radius:10px;
      font-weight:600;
      padding:6px 14px;
    }
    .patient-board-page .text-primary { color:#000 !important; }
    .patient-board-page .spinner-border.text-primary { color:#000 !important; }
    .patient-board-page > .card > .pb-main-card-body {
      flex:1 1 auto;
      display:flex;
      flex-direction:column;
      min-height:0;
      padding-left:0.25rem;
      padding-right:0.25rem;
      padding-bottom:0.25rem;
    }
    .pb-main-card-body > *:not(.pb-tab-main-view) {
      flex-shrink:0;
    }
  `;

  // Handle sub section click to load rubric details
  // Handle expanding/collapsing tree items
  const handleSubSectionExpand = async (subSection) => {
    if (!subSection || !subSection.subSectionId) return;

    const subSectionId = subSection.subSectionId;
    const isExpanded = expandedSubSections.has(subSectionId);

    if (isExpanded) {
      // Collapse: remove from expanded set
      const newExpanded = new Set(expandedSubSections);
      newExpanded.delete(subSectionId);
      setExpandedSubSections(newExpanded);
    } else {
      // Expand: add to expanded set and fetch children if not already loaded
      const newExpanded = new Set(expandedSubSections);
      newExpanded.add(subSectionId);
      setExpandedSubSections(newExpanded);

      // Check if children are already loaded
      if (!subSectionChildrenMap.has(subSectionId)) {
        try {
          const response = await getSubSectionWithChildrenCount(subSectionId);
          let children = [];
          if (response && Array.isArray(response)) {
            children = response;
          } else if (response?.data && Array.isArray(response.data)) {
            children = response.data;
          } else if (response?.resultObject && Array.isArray(response.resultObject)) {
            children = response.resultObject;
          }

          // Filter out the parent item from children (first item with same subSectionId)
          const filteredChildren = children.filter(child => child.subSectionId !== subSectionId);

          // Update children map
          const newChildrenMap = new Map(subSectionChildrenMap);
          newChildrenMap.set(subSectionId, filteredChildren);
          setSubSectionChildrenMap(newChildrenMap);
          queueRubricDetailsPrefetch(
            filteredChildren.map((child) => child?.subSectionId).filter(Boolean),
            SCROLL_RUBRIC_PREFETCH_BATCH
          );
        } catch (error) {
          console.error('Error fetching subsection children:', error);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch subsection children' });
        }
      }
    }
  };

  // Handle subsection click (for selecting and loading rubric details)
  const handleSubSectionClick = (subSection) => {
    setSelectedSubSection(subSection);
    const subSectionId = subSection?.subSectionId;
    if (!subSectionId) return;

    const cached = getCachedRubricDetails(subSectionId);
    if (cached) {
      dispatch(setRubricDetailsList(cached));
      dispatch(setRubricDetailsError(null));
      dispatch(setRubricDetailsLoading(false));
    }

    dispatch(getRubricDetails({ subSectionId })).catch(() => {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch rubric details' });
    });
  };

  const prefetchRubricDetails = useCallback(
    (subSectionId) => {
      if (!subSectionId) return;
      dispatch(getRubricDetails({ subSectionId, prefetchOnly: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    if (activeTab !== 'Repertory' || !Array.isArray(subSectionTreeData) || subSectionTreeData.length === 0) {
      return;
    }
    queueRubricDetailsPrefetch(
      collectSubSectionIdsFromTree(subSectionTreeData, INITIAL_RUBRIC_PREFETCH_LIMIT),
      INITIAL_RUBRIC_PREFETCH_LIMIT
    );
  }, [activeTab, subSectionTreeData, queueRubricDetailsPrefetch]);

  useEffect(() => {
    const root = subSectionTreeScrollRef.current;
    if (!root || activeTab !== 'Repertory') {
      return undefined;
    }

    if (rubricDetailsPrefetchObserverRef.current) {
      rubricDetailsPrefetchObserverRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleIds = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.dataset.subsectionId))
          .filter((id) => Number.isFinite(id) && id > 0);
        if (visibleIds.length === 0) return;

        if (rubricDetailsScrollPrefetchTimerRef.current) {
          clearTimeout(rubricDetailsScrollPrefetchTimerRef.current);
        }
        rubricDetailsScrollPrefetchTimerRef.current = setTimeout(() => {
          queueRubricDetailsPrefetch(visibleIds, SCROLL_RUBRIC_PREFETCH_BATCH);
        }, 80);
      },
      { root, rootMargin: '200px 0px', threshold: 0.01 }
    );

    rubricDetailsPrefetchObserverRef.current = observer;
    root.querySelectorAll('[data-subsection-id]').forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      if (rubricDetailsScrollPrefetchTimerRef.current) {
        clearTimeout(rubricDetailsScrollPrefetchTimerRef.current);
      }
    };
  }, [
    activeTab,
    subSectionTreeData,
    expandedSubSections,
    subSectionChildrenMap,
    isGlobalSubSectionSearchActive,
    isSubSectionSearchActive,
    globalSubSectionSearchTreeResults,
    subSectionSearchTreeResults,
    queueRubricDetailsPrefetch,
  ]);

  const rubricDetailsMatchesSelection = useMemo(() => {
    const selId = selectedSubSection?.subSectionId ?? selectedSubSection?.SubSectionId;
    const loadedId =
      rubricDetailsList?.subSectionId ??
      rubricDetailsList?.subSectionID ??
      rubricDetailsList?.subsectionId ??
      rubricDetailsList?.SubSectionId;
    return selId != null && loadedId != null && String(selId) === String(loadedId);
  }, [rubricDetailsList, selectedSubSection]);

  const displayRubricDetails = useMemo(() => {
    if (rubricDetailsMatchesSelection && rubricDetailsList) {
      return rubricDetailsList;
    }
    const selId = selectedSubSection?.subSectionId ?? selectedSubSection?.SubSectionId;
    if (selId != null) {
      const cached = getCachedRubricDetails(selId);
      if (cached) return cached;
    }
    return rubricDetailsMatchesSelection ? rubricDetailsList : null;
  }, [rubricDetailsList, rubricDetailsMatchesSelection, selectedSubSection]);

  // RUBRIC DETAILS header: badge count matches Rubric Data To Display (remediesList)
  const repertoryRubricDetailsHeader = useMemo(() => {
    const displayed = displayRubricDetails;
    const sel = selectedSubSection;
    const displayedLen = Array.isArray(displayed?.remediesList) ? displayed.remediesList.length : null;
    const selName = sel?.subSectionName ?? sel?.SubSectionName;
    const loadedName = displayed?.subSectionName ?? displayed?.SubSectionName ?? rubricDetailsList?.subSectionName ?? rubricDetailsList?.SubSectionName;
    const parseCount = (...values) => {
      for (const raw of values) {
        if (raw == null || raw === '') continue;
        const n = Number(raw);
        if (Number.isFinite(n)) return n;
      }
      return null;
    };
    const treeRemedy = parseCount(
      sel?.remedyCount,
      sel?.remedyCountForSort,
      sel?.totalRemedyCount,
      sel?.RemedyCount,
      sel?.RemedyCountForSort,
      sel?.TotalRemedyCount
    );
    return {
      name: selName || loadedName || 'Rubric Name',
      remedyCount: displayedLen != null ? displayedLen : (treeRemedy ?? 0)
    };
  }, [displayRubricDetails, rubricDetailsList, selectedSubSection]);

  const showRubricDetailsSpinner = rubricDetailsLoading && !displayRubricDetails;
  const showRubricDetailsInlineLoader = rubricDetailsRefreshing && !displayRubricDetails;

  const matchesSubSectionSearch = (item, term, visited = new Set()) => {
    if (!term) return true;
    const id = item?.subSectionId;
    if (id != null) {
      const key = String(id);
      if (visited.has(key)) return false;
      visited.add(key);
    }
    const name = (item.subSectionName || '').toLowerCase();
    if (name.includes(term)) return true;
    const children = subSectionChildrenMap.get(id) || [];
    return children.some((child) => matchesSubSectionSearch(child, term, visited));
  };

  const activeSubSectionHighlightQuery = useMemo(() => {
    const globalTerm = globalSubSectionSearch.trim();
    if (isGlobalSubSectionSearchActive && globalTerm.length >= MIN_SUBSECTION_SEARCH_LENGTH) {
      return globalTerm;
    }
    const localTerm = subSectionSearch.trim();
    if (localTerm.length > 0) {
      return localTerm;
    }
    return '';
  }, [isGlobalSubSectionSearchActive, globalSubSectionSearch, subSectionSearch]);

  const renderSubSectionHighlightedLabel = (fullName, parentFullName, itemId) => {
    const highlighted = highlightSubSectionTreeLabel(
      fullName,
      parentFullName,
      activeSubSectionHighlightQuery
    );

    if (!Array.isArray(highlighted)) {
      return highlighted;
    }

    return highlighted.map((part, partIndex) => (
      part.highlight ? (
        <span
          key={`subsection-label-${itemId}-part-${partIndex}`}
          className="pb-repertory-subsection-label-match"
        >
          {part.text}
        </span>
      ) : (
        <React.Fragment key={`subsection-label-${itemId}-part-${partIndex}`}>
          {part.text}
        </React.Fragment>
      )
    ));
  };

  // Recursive component to render multi-level tree
  const renderSubSectionTree = (items, level = 1, parentFullName = '', ancestorIds = new Set()) => {
    if (!items || items.length === 0 || level > MAX_SUBSECTION_TREE_DEPTH) return null;

    const term = isSubSectionSearchActive ? '' : subSectionSearch.trim().toLowerCase();
    const visibleItems = term ? items.filter((item) => matchesSubSectionSearch(item, term)) : items;
    if (visibleItems.length === 0) return null;

    const seenSiblingIds = new Set();
    return visibleItems.map((item) => {
      const itemId = item?.subSectionId;
      if (itemId == null) return null;
      const itemKey = String(itemId);
      if (ancestorIds.has(itemKey) || seenSiblingIds.has(itemKey)) return null;
      seenSiblingIds.add(itemKey);

      const nextAncestorIds = new Set(ancestorIds);
      nextAncestorIds.add(itemKey);

      const hasChildren = item.childCount > 0;
      const isExpanded = expandedSubSections.has(item.subSectionId);
      const loadedChildren = subSectionChildrenMap.get(item.subSectionId) || [];
      const children = term
        ? loadedChildren.filter((child) => matchesSubSectionSearch(child, term))
        : loadedChildren;
      const isSelected = selectedSubSection?.subSectionId === item.subSectionId;
      const inRepertorize = repertorizationRubrics.some(
        (r) =>
          String(r.rubricId ?? r.subsectionId ?? r.subSectionId) === String(item.subSectionId)
      );
      const fullName = item.subSectionName || '';
      const displayName = getSubSectionTreeDisplayName(fullName, parentFullName);
      const showFullNameTooltip = displayName !== fullName;

      return (
        <div key={`subsection-${item.subSectionId}-level-${level}`} className="pb-subsection-tree-node" data-level={level}>
          <div
            className={`pb-rubric-row pb-rubric-row--repertory-subsection${
              isSelected ? ' pb-rubric-row--repertory-subsection-selected' : ''
            }${inRepertorize ? ' pb-rubric-row--repertory-has-grade' : ''}${
              hasChildren ? ' pb-rubric-row--repertory-subsection-parent' : ' pb-rubric-row--repertory-subsection-leaf'
            }`}
            data-subsection-id={item.subSectionId}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleSubSectionClick(item);
            }}
            onMouseEnter={() => {
              prefetchRubricDetails(item?.subSectionId);
            }}
          >
            <div className="d-flex pb-repertory-subsection-row">
              {hasChildren ? (
                <button
                  type="button"
                  className="pb-subsection-tree-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubSectionExpand(item);
                  }}
                  aria-label={isExpanded ? 'Collapse subsection' : 'Expand subsection'}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              ) : (
                <span className="pb-subsection-tree-toggle-spacer" aria-hidden="true" />
              )}
              <span
                className="pb-repertory-subsection-label"
                title={showFullNameTooltip ? fullName : undefined}
              >
                {renderSubSectionHighlightedLabel(fullName, parentFullName, item.subSectionId)}
              </span>
              <div className="pb-repertory-subsection-chips-slot">
                <div className="pb-rubric-badges pb-rubric-badges--repertory">
                  {renderRepertorySubSectionIntensityChips(item)}
                </div>
              </div>
            </div>
          </div>
          {(term ? children.length > 0 : isExpanded && hasChildren && children.length > 0) && (
            <div className="pb-subsection-tree-children">
              {renderSubSectionTree(children, level + 1, fullName, nextAncestorIds)}
            </div>
          )}
        </div>
      );
    });
  };

  // When a remedy alias is clicked in RUBRIC DETAILS, jump to Materia Medica and prefill remedy
  const renderSubSectionSuggestionsPortal = ({
    portalRef,
    show,
    suggestions,
    searchQuery,
    layout,
    onClose,
    ariaLabel = 'Sub section suggestions',
  }) => {
    if (!show || suggestions.length === 0 || !layout || typeof document === 'undefined') {
      return null;
    }

    const { placement, listMaxHeight, style } = layout;
    const totalHeight = listMaxHeight + 32;

    return createPortal(
      <div
        ref={portalRef}
        className={`pb-subsection-search-suggestions pb-subsection-search-suggestions--portal pb-subsection-search-suggestions--${placement}`}
        style={{
          ...style,
          maxHeight: totalHeight,
          height: totalHeight,
        }}
        role="listbox"
        aria-label={ariaLabel}
      >
        <div className="pb-subsection-search-suggestions-header">
          <span>Suggestions</span>
          <span className="pb-subsection-search-suggestions-count">
            {suggestions.length} result{suggestions.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="pb-subsection-search-suggestions-list">
          {suggestions.map((suggestion) => {
            const highlighted = highlightSubSectionSuggestion(
              suggestion.subSectionName,
              searchQuery
            );
            const selectSuggestion = () => {
              onClose();
              handleSubSectionClick({
                subSectionId: suggestion.subSectionId,
                subSectionName: suggestion.subSectionName,
                childCount: suggestion.childCount,
              });
            };
            return (
              <div
                key={`subsection-suggestion-${suggestion.subSectionId}`}
                role="option"
                tabIndex={0}
                className="pb-subsection-search-suggestion"
                title={suggestion.subSectionName}
                onClick={selectSuggestion}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectSuggestion();
                  }
                }}
              >
                {Array.isArray(highlighted) ? (
                  highlighted.map((part, partIndex) => (
                    part.highlight ? (
                      <span
                        key={`${suggestion.subSectionId}-part-${partIndex}`}
                        className="pb-subsection-search-suggestion-match"
                      >
                        {part.text}
                      </span>
                    ) : (
                      <React.Fragment key={`${suggestion.subSectionId}-part-${partIndex}`}>
                        {part.text}
                      </React.Fragment>
                    )
                  ))
                ) : (
                  highlighted
                )}
              </div>
            );
          })}
        </div>
      </div>,
      document.body
    );
  };

  const renderSubSectionSearchSuggestionsPortal = () => renderSubSectionSuggestionsPortal({
    portalRef: subSectionSuggestionsPortalRef,
    show: showSubSectionSuggestions && isSectionSubSectionSearchMode && !isGlobalSubSectionSearchMode,
    suggestions: subSectionSearchSuggestions,
    searchQuery: subSectionSearch,
    layout: subSectionDropdownLayout,
    onClose: () => setShowSubSectionSuggestions(false),
    ariaLabel: 'Sub section suggestions',
  });

  const renderGlobalSubSectionSearchSuggestionsPortal = () => renderSubSectionSuggestionsPortal({
    portalRef: globalSubSectionSuggestionsPortalRef,
    show: showGlobalSubSectionSuggestions && isGlobalSubSectionSearchMode && !isSectionSubSectionSearchMode,
    suggestions: globalSubSectionSearchSuggestions,
    searchQuery: globalSubSectionSearch,
    layout: globalSubSectionDropdownLayout,
    onClose: () => setShowGlobalSubSectionSuggestions(false),
    ariaLabel: 'Global subsection suggestions',
  });

  const handleRemedyAliasClick = (remedyItem) => {
    // Try match by id first, else by alias text
    let matchedOption = null;
    if (remedyItem?.remedyId && Array.isArray(remedyOptions)) {
      matchedOption = remedyOptions.find(o => o.value === remedyItem.remedyId) || null;
    }
    if (!matchedOption && remedyItem?.remedyAlias) {
      matchedOption = (remedyOptions || []).find(o => (o.label || '').toLowerCase() === remedyItem.remedyAlias.toLowerCase()) || null;
    }
    // Fallback synthetic option if not found
    const optionToSet = matchedOption || (remedyItem?.remedyAlias ? { value: remedyItem.remedyId || 0, label: remedyItem.remedyAlias } : null);
    if (optionToSet) {
      setSelectedRemedy(optionToSet);
      setSelectedAuthor(null);
      setActiveTab('Materia Medica');
      // Close modals if open
      setRubricRemedyModalOpen(false);
      setQuestionRubricModalOpen(false);
    }
  };

  return (
    <div className="container-fluid patient-board-page">
      <style>{headerStyles}</style>

      <div className="pb-header position-relative">
        <div className="d-flex align-items-center pb-actions">
          <div className="pb-search d-none d-md-block">
            <div className="search-box">
              <Input bsSize="sm" placeholder="Global Search..." />
            </div>
          </div>
          <Link to={getHomeDashboardPath()} className="btn btn-link text-decoration-none ms-2"><i className="ri-dashboard-2-line me-1" />Dashboard</Link>
        </div>
        <div className="pb-logo-wrapper">
          <div className="pb-logo-inner">
            <div className="pb-logo"><i className="ri-shape-diamond-line me-2" />HOMEOcentrum</div>
          </div>
        </div>
        <div className="d-flex align-items-center pb-actions">
          {/* kept empty to reduce header clutter per spec */}
        </div>
      </div>

      <Card className="mt-3">
        <CardBody className="pb-main-card-body">
          <div className="mar-10 d-flex align-items-center justify-content-between flex-wrap gap-2 pb-info">
            <div className="pb-info__identity">
              <div className="pb-info__avatar-wrap">
                <img src={img3} alt="avatar" className="pb-info__avatar" />
                <span className="pb-info__avatar-status" aria-hidden="true" />
              </div>
              <div className="pb-info__details">
                <span className="pb-info__name">
                  {(patientDetails?.patientName || 'Patient').toUpperCase()}
                </span>
                {(() => {
                  const age = calculateAgeYMD(patientDetails?.dateOfBirth);
                  if (!age) return null;
                  const genderMap = { 0: 'M', 1: 'F', 2: 'O' };
                  const genderLabel = genderMap[patientDetails.gender] || 'N/A';
                  const ageLabel = `${age.years}y ${age.months}m ${age.days}d`;
                  return (
                    <span className="pb-info__meta">
                      <i className="ri-user-heart-line" aria-hidden="true" />
                      {ageLabel}/{genderLabel}
                    </span>
                  );
                })()}
                {patientDetails?.mobileNo && (
                  <span className="pb-info__meta">
                    <i className="ri-smartphone-line" aria-hidden="true" />
                    {patientDetails.mobileNo}
                  </span>
                )}
              </div>
              <div className="pb-info__actions">
                <Button size="sm" color="success" className="btn btn-soft-success btn-icon" onClick={() => {
                  Swal.fire({
                    title: 'Are you sure want to connect with whatsapp chat?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#0ab39c',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, connect!',
                    cancelButtonText: 'Cancel',
                    showClass: { popup: 'animate__animated animate__fadeInDown' },
                    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                  }).then((result) => {
                    if (result.isConfirmed) {
                      Swal.fire({
                        title: 'Processing wait..',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                      });
                      setTimeout(() => { Swal.close(); }, 1200);
                    }
                  });
                }}><i className="ri-chat-1-line" /></Button>
                <Button size="sm" color="danger" className="btn btn-soft-danger btn-icon" onClick={() => {
                  Swal.fire({
                    title: '+91 - 987 654 XXXX',
                    text: 'Are you sure to call person directly?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, call!',
                    cancelButtonText: 'Cancel',
                    showClass: { popup: 'animate__animated animate__fadeInDown' },
                    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                  }).then((result) => {
                    if (result.isConfirmed) {
                      Swal.fire({
                        title: 'Processing wait..',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                      });
                      setTimeout(() => { Swal.close(); }, 1200);
                    }
                  });
                }}><i className="ri-phone-fill" /></Button>
                <Button size="sm" color="info" className="btn btn-soft-info btn-icon" onClick={() => {
                  Swal.fire({
                    title: 'Are you sure want to connect with whatsapp video call?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#299cdb',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Yes, connect!',
                    cancelButtonText: 'Cancel',
                    showClass: { popup: 'animate__animated animate__fadeInDown' },
                    hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                  }).then((result) => {
                    if (result.isConfirmed) {
                      Swal.fire({
                        title: 'Processing wait..',
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                      });
                      setTimeout(() => { Swal.close(); }, 1200);
                    }
                  });
                }}><i className="ri-vidicon-2-fill" /></Button>
              </div>
            </div>
            <div className="pb-info__aside">
              {formattedAppointmentDate ? (
                <div className="pb-appointment-date">
                  <i className="ri-calendar-event-line" aria-hidden="true" />
                  {formattedAppointmentDate}
                </div>
              ) : null}
              <div className="pb-info__status">
                <span className="pb-info__chip">
                  <i className="ri-calendar-check-line" aria-hidden="true" />
                  No Upcoming Appointment
                </span>
                <span className="pb-info__chip pb-info__chip--due">
                  <i className="ri-wallet-3-line" aria-hidden="true" />
                  Due Amount : ₹ 0.00
                </span>
              </div>
            </div>
          </div>

          {(showAudioCasePanel || caseTakingOrigin === 'audio') && (
            <div className={showAudioCasePanel ? undefined : 'd-none'} aria-hidden={!showAudioCasePanel}>
              <AudioCasePanel
                patientId={patientId}
                caseId={caseId}
                patientAppId={patientAppId}
                patientName={resolvedPatientName || patientDetails?.patientName}
                onApplyRubric={handleIntensityChipClick}
                repertorizationCount={repertorizationRubrics.length}
                intensities={intensitiesForPatientList || []}
                onAnalysisStateChange={handleAudioAnalysisStateChange}
                onAppendSummaryToHistoryNote={handleAppendAudioSummaryToHistoryNote}
                onOpenRepertorize={handleOpenRepertorizeFromAudio}
              />
            </div>
          )}

          {!showAudioCasePanel && (
          <>
          <div className="mt-1 mb-1 pb-section-divider"></div>

          <div className="pb-main-toolbar">
            <div className="pb-main-toolbar__left">
              <Button
                type="button"
                className={`btn btn-sm pb-repertorize-tab-btn${activeTab === 'Repertorize' ? ' active' : ''}`}
                onClick={() => setActiveTab('Repertorize')}
                title={`${repertorizationRubrics.length} rubrics for repertorization`}
                aria-label={`Repertorize, ${repertorizationRubrics.length} rubrics selected`}
              >
                <i className="ri-pie-chart-2-line" aria-hidden="true" />
                Repertorize
                <span className="pb-repertorize-count-badge">{repertorizationRubrics.length}</span>
              </Button>
            </div>
            <div className="pb-main-toolbar__center pb-tabs-nav">
              {caseTakingOrigin === 'audio' && (
                <button
                  type="button"
                  className="pb-tab pb-tab--audio"
                  onClick={handleReturnToAudioCaseTaking}
                  title="Return to Audio case taking results"
                  aria-label="Return to Audio case taking"
                >
                  <i className="ri-mic-line" aria-hidden="true" />
                  Audio case
                </button>
              )}
              <span className={`pb-tab ${activeTab === 'Body Parts' ? 'active' : ''}`} onClick={() => setActiveTab('Body Parts')}>
                <i className="ri-body-scan-line" aria-hidden="true" />
                Body Parts
              </span>
              <span
                className={`pb-tab ${activeTab === 'Questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('Questions')}
              >
                <i className="ri-questionnaire-line" aria-hidden="true" />
                Questions
              </span>
              <span className={`pb-tab ${activeTab === 'Clinical Pattern' ? 'active' : ''}`} onClick={() => setActiveTab('Clinical Pattern')}>
                <i className="ri-stethoscope-line" aria-hidden="true" />
                Clinical Pattern
              </span>
              <span className={`pb-tab ${activeTab === 'Repertory' ? 'active' : ''}`} onClick={() => setActiveTab('Repertory')}>
                <i className="ri-book-2-line" aria-hidden="true" />
                Repertory
              </span>
              <span className={`pb-tab ${activeTab === 'Materia Medica' ? 'active' : ''}`} onClick={() => setActiveTab('Materia Medica')}>
                <i className="ri-book-open-line" aria-hidden="true" />
                Materia Medica
              </span>
              <span className={`pb-tab ${activeTab === 'Adverse Effect' ? 'active' : ''}`} onClick={() => setActiveTab('Adverse Effect')}>
                <i className="ri-alert-line" aria-hidden="true" />
                Adverse Effect
              </span>
              <span className={`pb-tab ${activeTab === 'Deep Analysis' ? 'active' : ''}`} onClick={() => setActiveTab('Deep Analysis')}>
                <i className="ri-radar-line" aria-hidden="true" />
                Deep Analysis
              </span>
            </div>
            <div className="pb-main-toolbar__right">
              {activeTab === 'Repertorize' && (
                <Button
                  type="button"
                  className="btn btn-sm pb-prescription-tab-btn"
                  onClick={() => setPrescriptionModalOpen(true)}
                >
                  <i className="ri-file-list-3-line" aria-hidden="true" />
                  Prescription
                </Button>
              )}
            </div>
          </div>

          <div className="mt-1 mb-1 pb-section-divider"></div>
          <div className={`pb-tab-main-view${activeTab === 'Repertorize' ? ' pb-tab-main-view--scroll' : ''}`}>
            {activeTab === 'Clinical Pattern' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--clinical d-flex flex-column h-100 min-h-0">
                <div className="pb-ae-header-bar pb-clinical-header-bar flex-shrink-0">
                  <div className="pb-ae-header-bar__icon" aria-hidden="true">
                    <i className="ri-stethoscope-line" />
                  </div>
                  <div className="pb-ae-header-bar__select-wrap">
                    <Select
                      inputId="cp-select-pattern"
                      aria-label="Clinical Pattern"
                      isClearable={true}
                      isSearchable={true}
                      value={selectedClinicalPattern}
                      onChange={handleClinicalPatternSelect}
                      options={clinicalPatternOptions}
                      placeholder="Search pattern..."
                      classNamePrefix="pb-ae-select"
                      styles={patientBoardSelectStyles}
                      noOptionsMessage={() => 'No patterns found'}
                    />
                  </div>
                  <div className="pb-ae-header-bar__divider" aria-hidden="true" />
                  <div className="pb-ae-header-bar__info">
                    {selectedClinicalPattern ? (
                      <>
                        <span className="ae-name">{selectedClinicalPattern.label}</span>
                        {diagnosisData?.diagnosisNameAlias && (
                          <span className="pb-clinical-header-desc"> — {diagnosisData.diagnosisNameAlias}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted small">Choose a clinical pattern to begin</span>
                    )}
                  </div>
                  <div className="pb-ae-header-bar__divider" aria-hidden="true" />
                  <div className="pb-ae-header-bar__category cp-category">
                    {diagnosisData?.miasm || selectedClinicalPattern?.category || 'General'}
                  </div>
                </div>

                {questions.length > 0 && (
                  <div className="mt-1 mb-1 flex-shrink-0 pb-clinical-particulars-bar">
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      {questions.map((p) => (
                        <span
                          key={p.value}
                          className={`pb-part-item ${activePerticular === p.label ? 'active' : ''}`}
                          onClick={() => { setActivePerticular(p.label); handleQuestionTabSelect(p.label); }}
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pb-tab-sub-view pb-tab-sub-view--clinical">
                  <div className="row g-0 mt-0 pb-tab-cards-row pb-tab-cards-row--fill pb-clinical-main-row">
                    {/* Column 1 — Clinical Section (like Repertory SECTION) */}
                    <div className="col-md-2">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-clinical-section-card">
                        <div className="pb-questions-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-layout-grid-line" />
                            </span>
                            CLINICAL SECTION
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div className="pb-tab-card-scroll custom-scrollbar pb-clinical-section-scroll">
                          {keywordTabs.map((tab) => {
                            const isDisabled = !selectedClinicalPattern;
                            const isActive = activeKeywordTab === tab;
                            return (
                              <div
                                key={tab}
                                className={`pb-rubric-row border pb-clinical-section-item${isActive ? ' pb-clinical-section-item--active' : ''}${isDisabled ? ' pb-clinical-section-item--disabled' : ''}`}
                                style={{
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.5 : 1,
                                }}
                                onClick={() => !isDisabled && handleKeywordTabSelect(tab)}
                                title={isDisabled ? 'Select a clinical pattern first' : tab}
                              >
                                <span className="pb-clinical-section-item__icon" aria-hidden="true">
                                  <i className={getClinicalSectionIcon(tab)} />
                                </span>
                                <span className="pb-clinical-section-item__label">
                                  {tab}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Column 2 — Keywords + Rubrics stack */}
                    <div className="col-md-5">
                      <div className="pb-clinical-center-stack h-100">
                        <div className="border rounded-2 pb-tab-card pb-tab-card--fill pb-clinical-keywords-card pb-questions-keywords-card">
                          <div className="pb-questions-panel-header">
                            <div className="fw-semibold pb-section-title mb-0">
                              <span className="pb-repertory-section-title-icon" aria-hidden="true">
                                <i className="ri-price-tag-3-line" />
                              </span>
                              KEYWORDS
                            </div>
                            <div className="pb-questions-search-wrap">
                              {renderQuestionsSearchInput(
                                keywordSearch,
                                setKeywordSearch,
                                {
                                  disabled: !activeKeywordTab && !selectedClinicalPattern,
                                  onClear: () => setKeywordSearch(''),
                                }
                              )}
                            </div>
                          </div>
                          <div className="pb-tab-card-divider"></div>
                          <div className="pb-tab-card-scroll custom-scrollbar pb-clinical-keywords-scroll pb-questions-keywords-scroll">
                            {diagnosisKeywordByTabLoading ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2 mb-0">Loading keywords...</p>
                              </div>
                            ) : filteredKeywords.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2 p-2">
                                {filteredKeywords.map((kw) => (
                                  <span
                                    key={kw.keywordId}
                                    className={`pb-keyword-tab${activeKeyword === kw.keyword ? ' active' : ''}`}
                                    onClick={() => handleKeywordClick(kw.keyword, kw.SectionIds || kw.sectionIds)}
                                    title={`Search rubrics for "${kw.keyword}"`}
                                  >
                                    {kw.keyword}
                                  </span>
                                ))}
                              </div>
                            ) : activeKeywordTab ? (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">Data not available</p>
                              </div>
                            ) : (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">No keywords available. Select a section to see keywords.</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border rounded-2 pb-tab-card pb-tab-card--fill pb-clinical-rubrics-card">
                          <div className="pb-questions-panel-header pb-questions-rubrics-header">
                            <div className="fw-semibold pb-section-title mb-0">
                              <span className="pb-repertory-section-title-icon" aria-hidden="true">
                                <i className="ri-file-list-3-line" />
                              </span>
                              RUBRICS WITH REMEDIES
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end flex-grow-1">
                              {(activeKeyword || activeKeywordTab) && !rubricByKeywordIdLoading && filteredRubricRemedies.length > 0 && (
                                <span className="pb-questions-result-count">
                                  {filteredRubricRemedies.length} rubric{filteredRubricRemedies.length === 1 ? '' : 's'}
                                </span>
                              )}
                              <div className="pb-questions-search-wrap" style={{ minWidth: 180, maxWidth: 240, flex: '1 1 180px' }}>
                                {renderQuestionsSearchInput(
                                  rubricRemedySearch,
                                  setRubricRemedySearch,
                                  {
                                    disabled: !activeKeyword && rubricRemedies.length === 0,
                                    placeholder: 'Filter rubrics...',
                                    onClear: () => setRubricRemedySearch(''),
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="pb-tab-card-divider flex-shrink-0"></div>
                          <div className="pb-tab-card-scroll custom-scrollbar pb-clinical-rubrics-scroll" onScroll={handleClinicalPatternRubricsScroll}>
                            {rubricByKeywordIdLoading ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2">Loading rubrics...</p>
                              </div>
                            ) : filteredRubricRemedies.length > 0 ? (
                              <div className="pb-questions-rubrics-list">
                                {filteredRubricRemedies.map((rr, i) => (
                                  <div
                                    key={`rr-${i}`}
                                    className="pb-rubric-row border pb-questions-rubric-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleRubricRemedyClick(rr.subSectionName, rr.subSectionId)}
                                    title={rr.subSectionName}
                                  >
                                    <div className="pb-rubric-badges">
                                      {renderIntensityChips(rr, handleIntensityChipClick)}
                                    </div>
                                    <span className="pb-questions-rubric-label">{rr.subSectionName}</span>
                                  </div>
                                ))}
                                {clinicalPatternRubricLoadingMore && (
                                  <div className="pb-questions-rubrics-list__status">
                                    <Spinner size="sm" color="primary" />
                                    <span className="text-muted small ms-2">Loading more rubrics...</span>
                                  </div>
                                )}
                              </div>
                            ) : (activeKeyword || activeKeywordTab) ? (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">Data not available</p>
                              </div>
                            ) : (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">No rubrics available. Select a keyword to see rubrics.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3 — Therapeutics */}
                    <div className="col-md-5">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-clinical-therapeutics-card">
                        <div className="pb-questions-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-capsule-line" />
                            </span>
                            THERAPEUTICS
                          </div>
                          <div className="d-inline-flex gap-2 align-items-center pb-clinical-zoom-tools">
                            <Button
                              id="therapeutics-zoom-in"
                              type="button"
                              size="sm"
                              className="btn btn-icon waves-effect waves-light"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                backgroundColor: '#e8f7f1',
                                border: '1px solid #0ab39c',
                                color: '#0ab39c',
                              }}
                              onClick={() => {
                                setTherapeuticsFontSize((s) => Math.min(s + 1, 20));
                              }}
                            >
                              <i className="ri-zoom-in-line" style={{ fontSize: '16px' }} />
                            </Button>
                            <UncontrolledTooltip placement="top" target="therapeutics-zoom-in">Zoom In</UncontrolledTooltip>
                            <span className="text-muted" style={{ fontSize: '12px', minWidth: '34px', textAlign: 'center' }}>{therapeuticsFontSize}px</span>
                            <Button
                              id="therapeutics-zoom-out"
                              type="button"
                              size="sm"
                              className="btn btn-icon waves-effect waves-light"
                              style={{
                                width: '32px',
                                height: '32px',
                                padding: 0,
                                backgroundColor: '#fff4e8',
                                border: '1px solid #f7b84b',
                                color: '#f7b84b',
                              }}
                              onClick={() => {
                                setTherapeuticsFontSize((s) => Math.max(s - 1, 10));
                              }}
                            >
                              <i className="ri-zoom-out-line" style={{ fontSize: '16px' }} />
                            </Button>
                            <UncontrolledTooltip placement="top" target="therapeutics-zoom-out">Zoom Out</UncontrolledTooltip>
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div
                          className="pb-tab-card-scroll custom-scrollbar therapeutics-content"
                          style={{
                            fontSize: `${therapeuticsFontSize}px`,
                            color: '#000',
                            '--therapeutic-font-size': `${therapeuticsFontSize}px`
                          }}
                        >
                          {threpoticByDiagnosisId?.diagnosisTherapeutics ? (
                            <div style={{ fontSize: `${therapeuticsFontSize}px`, color: '#000' }}>
                              {ReactHtmlParser(threpoticByDiagnosisId.diagnosisTherapeutics)}
                            </div>
                          ) : (
                            <p className="mb-0" style={{ color: '#000' }}>No data available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom strip — Investigation / Allopathic / Examination / Systems */}
                  <div className="pb-clinical-bottom-strip flex-shrink-0">
                    <div className="pb-clinical-table-wrap custom-scrollbar">
                      <table className="table table-bordered mb-0 pb-clinical-bottom-table" style={{ tableLayout: 'fixed' }}>
                        <thead>
                          <tr>
                            <th className="pb-clinical-th pb-clinical-th--investigation">INVESTIGATION</th>
                            <th className="pb-clinical-th pb-clinical-th--allopathic">ALLOPATHIC RX</th>
                            <th className="pb-clinical-th pb-clinical-th--examination">EXAMINATION</th>
                            <th className="pb-clinical-th pb-clinical-th--systems">SYSTEMS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="pb-clinical-td">
                              {diagnosisData?.investigations || 'No data available'}
                            </td>
                            <td className="pb-clinical-td">
                              {diagnosisData?.allopathicMedicines || 'No data available'}
                            </td>
                            <td className="pb-clinical-td">
                              {diagnosisData?.examiniations || 'No data available'}
                            </td>
                            <td className="pb-clinical-td">
                              {diagnosisData?.diagnosisSystemList?.map(system => system.diagnosisSystemName).join(', ') || 'No data available'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Deep Analysis' && (
              <div className="pb-tab-panel">
              <div className="da-container">
                <div className="da-icon-wrapper">
                  <div className="da-pulse"></div>
                  <div className="da-spin"></div>
                </div>
                <div className="da-text">Deep Analysis Feature Will Coming Soon !</div>
              </div>
              </div>
            )}
            {activeTab === 'Repertory' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--repertory d-flex flex-column h-100 min-h-0">
                <div className="row g-0 align-items-center flex-shrink-0 pb-repertory-toolbar">
                  <div className="col-auto">
                    <div className={`search-box pb-repertory-global-search-wrap${globalSubSectionSearch.trim() ? ' pb-repertory-search--active' : ''}`} ref={globalSubSectionSearchAnchorRef}>
                      <Input
                        bsSize="sm"
                        placeholder="Search subsection..."
                        innerRef={globalSubSectionSearchInputRef}
                        value={globalSubSectionSearch}
                        onChange={(e) => handleRepertoryGlobalSearchChange(e.target.value)}
                        onFocus={() => {
                          globalSubSectionSearchFocusedRef.current = true;
                          if (subSectionSearch.trim().length > 0 || isSubSectionSearchActive) {
                            clearSubSectionLocalSearch();
                          }
                          if (globalSubSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH) {
                            setShowGlobalSubSectionSuggestions(true);
                            setShowSubSectionSuggestions(false);
                          }
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            if (document.activeElement !== globalSubSectionSearchInputRef.current) {
                              globalSubSectionSearchFocusedRef.current = false;
                            }
                          }, 0);
                        }}
                      />
                      <i className={`ri-${globalSubSectionSearchLoading ? 'loader-4-line' : 'search-line'} search-icon`}></i>
                    </div>
                  </div>
                </div>

                {/* Three sections below dropdown */}
                <div className="pb-tab-sub-view pb-tab-sub-view--repertory">
                  <div className="row g-0 mt-0 pb-tab-cards-row pb-tab-cards-row--fill h-100">
                    {/* SECTION */}
                    <div className="col-md-2">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-repertory-col-card">
                        <div className="pb-panel-header pb-repertory-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-layout-grid-line" />
                            </span>
                            SECTION
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div
                          className="pb-tab-card-scroll custom-scrollbar pb-repertory-section-scroll"
                          onScroll={handleSectionScroll}
                        >
                            {sectionLoading && sectionPageNumber === 1 && sectionOptions.length === 0 ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </div>
                            ) : sectionOptions.length > 0 ? (
                              <>
                                {sectionOptions.map((section) => {
                                  const isActive = selectedSection && selectedSection.sectionId === section.sectionId;
                                  return (
                                  <div
                                    key={`section-${section.sectionId}`}
                                    className={`pb-rubric-row border pb-repertory-section-item${isActive ? ' pb-repertory-section-item--active' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleSectionSelect(section)}
                                  >
                                    <span className="pb-repertory-section-item__icon" aria-hidden="true">
                                      <i className={getRepertorySectionIcon(section.sectionName)} />
                                    </span>
                                    <span className="pb-repertory-section-item__label text-truncate">
                                      {section.sectionName}
                                    </span>
                                  </div>
                                  );
                                })}
                                {sectionLoadingMore && (
                                  <div className="text-center p-2">
                                    <Spinner size="sm" color="primary" />
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center p-4">
                                <p className="text-muted">No sections available</p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* SUB SECTION */}
                    <div className="col-md-4">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-repertory-col-card">
                        <div className="pb-panel-header pb-repertory-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-node-tree" />
                            </span>
                            SUB SECTION
                          </div>
                          <div className="pb-subsection-search-wrap" ref={subSectionSearchAnchorRef}>
                            <div className={`search-box${subSectionSearch.trim() ? ' pb-repertory-search--active' : ''}${!selectedSection?.sectionId ? ' pb-repertory-search--disabled' : ''}`}>
                              <Input
                                bsSize="sm"
                                id="pb-subsection-local-search-input"
                                innerRef={subSectionSearchInputRef}
                                placeholder="Search..."
                                value={subSectionSearch}
                                disabled={!selectedSection?.sectionId}
                                onChange={(e) => handleSubSectionSearchChange(e.target.value)}
                                onFocus={() => {
                                  if (!selectedSection?.sectionId) {
                                    return;
                                  }
                                  if (globalSubSectionSearch.trim().length > 0 || isGlobalSubSectionSearchActive) {
                                    clearGlobalSubSectionSearch();
                                    restoreBaselineSubSectionTree();
                                  }
                                  if (subSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH) {
                                    setShowSubSectionSuggestions(true);
                                    setShowGlobalSubSectionSuggestions(false);
                                  }
                                }}
                              />
                              <i className="ri-search-line search-icon"></i>
                            </div>
                            <Tooltip
                              placement="bottom"
                              isOpen={showSubSectionSelectHint}
                              target="pb-subsection-local-search-input"
                              fade={false}
                              className="pb-subsection-search-tooltip"
                              offset={[0, 6]}
                            >
                              Please select section first
                            </Tooltip>
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div
                          className="pb-tab-card-scroll custom-scrollbar pb-repertory-subsection-scroll"
                          ref={subSectionTreeScrollRef}
                          onScroll={handleSubSectionTreeScroll}
                        >
                            {globalSubSectionSearchLoading || subSectionSearchTreeLoading ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2 small">Searching subsections...</p>
                              </div>
                            ) : subSectionTreeLoading ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary spinner-border-sm" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2 small">Loading subsections...</p>
                              </div>
                            ) : subSectionTreeData.length > 0 ? (
                              <div className="pb-subsection-tree">
                                {renderSubSectionTree(subSectionTreeData) || (
                                  <div className="text-center p-4">
                                    <p className="text-muted">No subsections match your search</p>
                                  </div>
                                )}
                                {((isGlobalSubSectionSearchActive && globalSubSectionSearchTreeHasMore)
                                  || (isSubSectionSearchActive && subSectionSearchTreeHasMore)) && (
                                  <div className="text-center p-2">
                                    {globalSubSectionSearchTreeLoadingMore || subSectionSearchTreeLoadingMore ? (
                                      <Spinner size="sm" color="primary" />
                                    ) : (
                                      <p className="text-muted small mb-0">Scroll for more results</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : isGlobalSubSectionSearchActive && globalSubSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH ? (
                              <div className="text-center p-4">
                                <p className="text-muted">No subsections match your search</p>
                              </div>
                            ) : isSubSectionSearchActive && subSectionSearch.trim().length >= MIN_SUBSECTION_SEARCH_LENGTH ? (
                              <div className="text-center p-4">
                                <p className="text-muted">No subsections match your search</p>
                              </div>
                            ) : (
                              <div className="text-center p-4 pb-repertory-empty-hint">
                                <i className="ri-node-tree text-muted d-block mb-2" style={{ fontSize: '1.5rem' }} aria-hidden="true" />
                                <p className="text-muted mb-0">Select a section or use global search above</p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* RUBRIC DETAILS */}
                    <div className="col-md-6">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-repertory-col-card pb-repertory-details-card">
                        <div className="pb-panel-header pb-repertory-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-file-list-3-line" />
                            </span>
                            RUBRIC DETAILS
                          </div>
                          <div className="pb-panel-header-actions">
                            <div className="pb-rubric-tools" role="toolbar" aria-label="Rubric detail tools">
                              <Button
                                size="sm"
                                className={`modal-header-btn ${showRemedyAuthors ? 'active' : ''}`}
                                onClick={() => setShowRemedyAuthors(!showRemedyAuthors)}
                                title="Show remedy authors"
                                aria-pressed={showRemedyAuthors}
                              ><i className="ri-user-star-line" aria-hidden="true" /></Button>
                              <Button
                                size="sm"
                                className={`modal-header-btn ${showRemedyInfo ? 'active' : ''}`}
                                onClick={() => setShowRemedyInfo(!showRemedyInfo)}
                                title="Show remedy info"
                                aria-pressed={showRemedyInfo}
                              ><i className="ri-information-line" aria-hidden="true" /></Button>
                              <span className="pb-rubric-tools__divider" aria-hidden="true" />
                              <Button
                                size="sm"
                                className="modal-header-btn modal-header-btn--lang"
                                title="English language"
                                onMouseEnter={() => setShowEnglishTooltip(true)}
                                onMouseLeave={() => setShowEnglishTooltip(false)}
                              >
                                <i className="ri-translate-2" aria-hidden="true" />
                                En
                              </Button>
                              <Button
                                size="sm"
                                className="modal-header-btn modal-header-btn--lang"
                                title="Marathi language"
                                onMouseEnter={() => setShowMarathiTooltip(true)}
                                onMouseLeave={() => setShowMarathiTooltip(false)}
                              >
                                <i className="ri-translate" aria-hidden="true" />
                                म
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div className="pb-tab-card-content">
                        <div className="mb-2 pb-2 flex-shrink-0 pb-repertory-details-title-bar">
                          <h6 className="fw-bold mb-0 pb-repertory-details-title">
                            <span className="pb-repertory-details-name">{repertoryRubricDetailsHeader.name}</span>
                            <span className="pb-repertory-details-count">[{repertoryRubricDetailsHeader.remedyCount}]</span>
                          </h6>
                        </div>
                        {!showRubricDetailsSpinner && (() => {
                          const referenceRubrics = displayRubricDetails?.referenceRubric || displayRubricDetails?.referencerubric || [];
                          const referenceEntries = Array.isArray(referenceRubrics)
                            ? referenceRubrics.filter(
                                (rr) => rr?.refSubSectionName != null && String(rr.refSubSectionName).trim() !== ''
                              )
                            : [];
                          if (referenceEntries.length === 0) return null;
                          return (
                            <div className="pb-reference-rubric-section flex-shrink-0">
                              <div className="fw-semibold pb-repertory-subheading">Reference Rubric</div>
                              <div className="pb-reference-rubric-list custom-scrollbar">
                                {referenceEntries.map((entry, idx) => (
                                  <div
                                    key={`ref-rubric-${entry?.refSubSectionId ?? idx}-${entry.refSubSectionName}`}
                                    className="pb-reference-rubric-item"
                                  >
                                    {entry.refSubSectionName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        <div className="pb-rubric-data-header">
                          <div className="fw-semibold pb-repertory-subheading">Rubric Data To Display</div>
                        </div>
                        <div className="pb-tab-card-scroll pb-rubric-data-scroll custom-scrollbar">
                          {showRubricDetailsInlineLoader ? (
                            <div className="d-flex align-items-center gap-2 px-2 py-3 text-muted small">
                              <Spinner size="sm" color="primary" />
                              <span>Loading remedies...</span>
                            </div>
                          ) : showRubricDetailsSpinner ? (
                            <div className="text-center p-4">
                              <div className="spinner-border text-primary spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-100 pb-repertory-remedy-wrap">
                              {Array.isArray(displayRubricDetails?.remediesList) && displayRubricDetails.remediesList.length > 0 ? (
                                displayRubricDetails.remediesList.map((r, idx) => (
                                  <span
                                    key={r?.remedyId ?? r?.subSectionId ?? idx}
                                    className="remedy-item"
                                    style={getRemedyAliasStyle(r, { boostGrade2Weight: true, boostGrade4Font: true })}
                                    onClick={() => handleRemedyAliasClick(r)}
                                  >
                                    {renderRemedyAliasWithAuthorSubscript(r, showRemedyAuthors)}
                                    {showRemedyAuthors && r?.authors && getRemedyAuthorAliases(r).length === 0 && (
                                      <sub className="remedy-author-sub-block">({r.authors})</sub>
                                    )}
                                    {renderRemedyInfoIcon(r)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted">No data</span>
                              )}
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab !== 'Questions' && activeTab !== 'Repertorize' && activeTab !== 'Materia Medica' && activeTab !== 'Adverse Effect' && activeTab !== 'Body Parts' && activeTab !== 'Deep Analysis' && activeTab !== 'Clinical Pattern' && activeTab !== 'Repertory' && (
              <div className="text-center text-muted fw-semibold py-3">{activeTab}</div>
            )}
            {activeTab === 'Adverse Effect' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--adverse d-flex flex-column">
                <div className="pb-ae-header-bar pb-clinical-header-bar">
                  <div className="pb-ae-header-bar__icon" aria-hidden="true">
                    <i className="ri-capsule-line" />
                  </div>
                  <div className="pb-ae-header-bar__select-wrap">
                    <Select
                      inputId="ae-select-type"
                      name="ae-select-type"
                      aria-label="Select drug"
                      value={selectedAdverseType}
                      onChange={handleDrugSelection}
                      options={adverseTypeOptions}
                      placeholder="Search drug..."
                      isSearchable={true}
                      isClearable={true}
                      isLoading={allopathicDrugForDropdownLoading}
                      classNamePrefix="pb-ae-select"
                      styles={patientBoardSelectStyles}
                      noOptionsMessage={() => 'No drugs found'}
                      loadingMessage={() => 'Loading drugs...'}
                    />
                  </div>
                  <div className="pb-ae-header-bar__divider" aria-hidden="true" />
                  <div className="pb-ae-header-bar__info">
                    {drugDetailsLoading && selectedAdverseType ? (
                      <span className="text-muted small d-inline-flex align-items-center gap-2">
                        <Spinner size="sm" />
                        Loading drug details...
                      </span>
                    ) : adverseDrugDetails ? (
                      <>
                        <span className="ae-name">{adverseDrugDetails.allopathicDrugName}</span>
                        {' '}
                        <span className="ae-system">[{adverseDrugDetails.drugSystemName}]</span>
                      </>
                    ) : selectedAdverseType ? (
                      <span className="ae-name">{selectedAdverseType.label}</span>
                    ) : (
                      <span className="text-muted small">Choose a drug to view adverse effects</span>
                    )}
                  </div>
                  <div className="pb-ae-header-bar__divider" aria-hidden="true" />
                  <div className="pb-ae-header-bar__category ae-category">
                    {adverseDrugDetails?.drugGroupName || selectedAdverseType?.category || '—'}
                  </div>
                </div>

                <div className="pb-ae-columns-wrapper">
                  <div className="row g-2 pb-ae-columns-row h-100">
                    <div className="col-md-4">
                      <AdverseEffectColumn
                        variant="serious"
                        title="SERIOUS EFFECTS"
                        items={seriousEffectsPageData}
                        totalItems={filteredSeriousEffects.length}
                        hasMore={hasMoreSeriousEffects}
                        onLoadMore={() => setSeriousEffectsPage((page) => page + 1)}
                        search={seriousEffectsSearch}
                        onSearchChange={(value) => {
                          setSeriousEffectsSearch(value);
                          setSeriousEffectsPage(1);
                        }}
                        loading={drugDetailsLoading}
                        getItemId={(effect) => effect.seriousSideEffectId}
                        getItemName={(effect) => effect.seriousSideEffectName}
                        emptySearchMessage="No serious effects found"
                        emptyMessage={selectedAdverseType ? 'No serious effects available' : 'Select a drug to view effects'}
                        searchOpen={seriousEffectsSearchOpen}
                        onToggleSearch={() => setSeriousEffectsSearchOpen((open) => !open)}
                        searchDisabled={!selectedAdverseType}
                      />
                    </div>
                    <div className="col-md-4">
                      <AdverseEffectColumn
                        variant="other"
                        title="OTHER EFFECTS"
                        items={otherEffectsPageData}
                        totalItems={filteredOtherEffects.length}
                        hasMore={hasMoreOtherEffects}
                        onLoadMore={() => setOtherEffectsPage((page) => page + 1)}
                        search={otherEffectsSearch}
                        onSearchChange={(value) => {
                          setOtherEffectsSearch(value);
                          setOtherEffectsPage(1);
                        }}
                        loading={drugDetailsLoading}
                        getItemId={(effect) => effect.otherSideEffectId}
                        getItemName={(effect) => effect.otherSideEffectName}
                        emptySearchMessage="No other effects found"
                        emptyMessage={selectedAdverseType ? 'No other effects available' : 'Select a drug to view effects'}
                        searchOpen={otherEffectsSearchOpen}
                        onToggleSearch={() => setOtherEffectsSearchOpen((open) => !open)}
                        searchDisabled={!selectedAdverseType}
                      />
                    </div>
                    <div className="col-md-4">
                      <AdverseEffectColumn
                        variant="adverse"
                        title="ADVERSE EFFECTS"
                        items={adverseReactionsPageData}
                        totalItems={filteredAdverseReactions.length}
                        hasMore={hasMoreAdverseReactions}
                        onLoadMore={() => setAdverseReactionsPage((page) => page + 1)}
                        search={adverseReactionsSearch}
                        onSearchChange={(value) => {
                          setAdverseReactionsSearch(value);
                          setAdverseReactionsPage(1);
                        }}
                        loading={drugDetailsLoading}
                        getItemId={(reaction) => reaction.adverseReactionId}
                        getItemName={(reaction) => reaction.adverseReactionName}
                        emptySearchMessage="No adverse effects found"
                        emptyMessage={selectedAdverseType ? 'No adverse effects available' : 'Select a drug to view effects'}
                        searchOpen={adverseReactionsSearchOpen}
                        onToggleSearch={() => setAdverseReactionsSearchOpen((open) => !open)}
                        searchDisabled={!selectedAdverseType}
                      />
                    </div>
                  </div>
                </div>

                <div className="pb-ae-footer">
                  <p className="pb-ae-disclaimer">
                    Note: Adverse effects listed are based on materia medica references. Verify with clinical judgment.
                  </p>
                  <Button
                    color="light"
                    className="pb-ae-reference-btn border"
                    disabled={!adverseDrugDetails}
                    onClick={() => setAdverseReferenceModalOpen(true)}
                  >
                    <i className="ri-book-open-line" aria-hidden="true" />
                    View Reference
                  </Button>
                </div>

                <Modal
                  isOpen={adverseReferenceModalOpen}
                  toggle={() => setAdverseReferenceModalOpen(false)}
                  centered
                >
                  <ModalHeader toggle={() => setAdverseReferenceModalOpen(false)}>
                    Drug Reference
                  </ModalHeader>
                  <ModalBody>
                    {adverseDrugDetails ? (
                      <div className="pb-ae-reference-summary">
                        <div>
                          <strong>{adverseDrugDetails.allopathicDrugName}</strong>
                          {' '}
                          <span className="ae-system">[{adverseDrugDetails.drugSystemName}]</span>
                        </div>
                        <div>
                          Group: <strong>{adverseDrugDetails.drugGroupName}</strong>
                        </div>
                        <div>
                          Serious effects: {filteredSeriousEffects.length}
                          {' · '}
                          Other effects: {filteredOtherEffects.length}
                          {' · '}
                          Adverse effects: {filteredAdverseReactions.length}
                        </div>
                        <p className="text-muted small mb-0">
                          Reference data is sourced from the allopathic drug database and materia medica records.
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">Select a drug to view reference details.</p>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <ModalActionButton action="close" onClick={() => setAdverseReferenceModalOpen(false)} />
                  </ModalFooter>
                </Modal>
              </div>
            )}
            {activeTab === 'Body Parts' && (
              <div className="p-0 pb-tab-panel pb-body-part-tab">
                <AnatomyViewer
                  onAddToRepertorization={handleBodyPartRubricGrade}
                  repertorizationRubrics={repertorizationRubrics}
                />
              </div>
            )}
            {activeTab === 'Materia Medica' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--materia-medica d-flex flex-column">
                <div className="pb-mm-header-bar">
                  <div className="pb-mm-header-bar__fields">
                    <div className="pb-mm-header-bar__select-group">
                      <div className="pb-mm-header-bar__select-wrap">
                        <label className="pb-mm-header-bar__select-label" htmlFor="mm-select-remedy">
                          Search Remedy
                        </label>
                        <div className="pb-mm-header-bar__author-row">
                          <div className="pb-mm-header-bar__icon" aria-hidden="true">
                            <i className="ri-book-open-line" />
                          </div>
                          <div className="pb-mm-header-bar__author-select">
                            <Select
                              inputId="mm-select-remedy"
                              isClearable={true}
                              isSearchable={true}
                              value={selectedRemedy}
                              onChange={setSelectedRemedy}
                              options={remedyOptions}
                              placeholder="Search remedy..."
                              classNamePrefix="pb-mm-select"
                              styles={patientBoardSelectStyles}
                              noOptionsMessage={() => 'No remedies found'}
                            />
                          </div>
                          <div className="pb-mm-header-bar__action-spacer" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                    <div className="pb-mm-header-bar__select-group">
                      <div className="pb-mm-header-bar__select-wrap">
                        <label className="pb-mm-header-bar__select-label" htmlFor="mm-select-author">
                          Search Author
                        </label>
                        <div className="pb-mm-header-bar__author-row">
                          <div className="pb-mm-header-bar__icon" aria-hidden="true">
                            <i className="ri-user-star-line" />
                          </div>
                          <div className="pb-mm-header-bar__author-select">
                            <Select
                              inputId="mm-select-author"
                              name="mm-select-author"
                              value={selectedAuthor}
                              onChange={(option) => setSelectedAuthor(option)}
                              options={authorOptions}
                              placeholder="Search author..."
                              isSearchable={true}
                              isClearable={true}
                              isLoading={authorDDLLoading}
                              classNamePrefix="pb-mm-select"
                              styles={patientBoardSelectStyles}
                              noOptionsMessage={() => 'No authors found'}
                              loadingMessage={() => 'Loading authors...'}
                            />
                          </div>
                        <Button
                          id="mm-reset-btn"
                          type="button"
                          size="sm"
                          color="light"
                          className="btn-icon waves-effect waves-light flex-shrink-0 pb-mm-reset-btn"
                          onClick={handleMateriaMedicaReset}
                        >
                          <i className="ri-refresh-line" />
                        </Button>
                        <UncontrolledTooltip placement="top" target="mm-reset-btn">
                          Reset remedy, author and information
                        </UncontrolledTooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pb-mm-header-bar__divider d-none d-xl-block" aria-hidden="true" />
                  <div className="pb-mm-header-bar__title">
                    {[selectedRemedy?.label, selectedAuthor?.label].filter(Boolean).join(' | ') || '—'}
                  </div>
                </div>

                <div className="pb-mm-layout flex-grow-1 min-h-0">
                  <aside className="pb-mm-headings-panel">
                    <div className="pb-mm-panel-header">
                      <div className="pb-mm-headings-title">
                        <span className="pb-mm-panel-title-icon" aria-hidden="true">
                          <i className="ri-list-check-2" />
                        </span>
                        HEADINGS
                      </div>
                    </div>
                    <div className="pb-mm-panel-divider" />
                    <div className="pb-mm-headings-list custom-scrollbar">
                      {(() => {
                        if (mmTabHeadingsLoading) {
                          return (
                            <div className="text-center text-muted small py-4">
                              <Spinner size="sm" className="me-2" />
                              Loading headings...
                            </div>
                          );
                        }
                        if (mmTabHeadings.length > 0) {
                          return mmTabHeadings.map((heading) => {
                            const headingId = Number(heading?.materiaMedicaHeadId ?? heading?.materiaMedicaHeadID);
                            const headingKey = Number.isFinite(headingId)
                              ? headingId
                              : (heading.materiaMedicaHeadName ?? heading.headingName);
                            const isSelected = Number.isFinite(headingId)
                              && selectedMateriaMedicaHeadingId === headingId;
                            return (
                              <button
                                key={headingKey}
                                type="button"
                                className={`pb-mm-heading-item${isSelected ? ' active' : ''}`}
                                onClick={() => {
                                  if (Number.isFinite(headingId)) {
                                    handleMateriaMedicaHeadingSelect(headingId);
                                  }
                                }}
                                disabled={!Number.isFinite(headingId)}
                              >
                                <span className="pb-mm-heading-item__icon-wrap" aria-hidden="true">
                                  <i className={`${getMateriaMedicaHeadingIcon(heading)} pb-mm-heading-item__icon`} />
                                </span>
                                <span className="pb-mm-heading-item__label">
                                  {heading.materiaMedicaHeadName || heading.headingName || 'N/A'}
                                </span>
                              </button>
                            );
                          });
                        }
                        const authorId = selectedAuthor?.value ?? null;
                        if (!authorId) {
                          return (
                            <div className="text-center text-muted small py-4 px-2">
                              Select an author to load headings
                            </div>
                          );
                        }
                        return (
                          <div className="text-center text-muted small py-4 px-2">
                            No headings available
                          </div>
                        );
                      })()}
                    </div>
                  </aside>

                  <div className="pb-mm-content-panel">
                    <div className="pb-mm-panel-header pb-mm-content-header">
                      <div className="pb-mm-content-heading">
                        <h5 className="pb-mm-content-title">
                          <span className="pb-mm-panel-title-icon" aria-hidden="true">
                            <i className="ri-book-open-line" />
                          </span>
                          {[selectedRemedy?.label, selectedAuthor?.label].filter(Boolean).join(' | ') || 'Materia Medica'}
                        </h5>
                        {selectedRemedy?.label && (
                          <p className="pb-mm-content-subtitle mb-0">
                            Selected Remedy: <span className="fw-semibold">{selectedRemedy.label}</span>
                          </p>
                        )}
                      </div>
                      <div className="pb-mm-content-tools">
                        <Button
                          id="mm-zoom-in"
                          type="button"
                          size="sm"
                          className="btn btn-icon waves-effect waves-light pb-mm-zoom-btn pb-mm-zoom-btn--in"
                          onClick={() => setMmFontSize((s) => Math.min(s + 1, 20))}
                        >
                          <i className="ri-zoom-in-line" />
                        </Button>
                        <UncontrolledTooltip placement="top" target="mm-zoom-in">Zoom In Text</UncontrolledTooltip>
                        <span className="pb-mm-zoom-size">{mmFontSize}px</span>
                        <Button
                          id="mm-zoom-out"
                          type="button"
                          size="sm"
                          className="btn btn-icon waves-effect waves-light pb-mm-zoom-btn pb-mm-zoom-btn--out"
                          onClick={() => setMmFontSize((s) => Math.max(s - 1, 10))}
                        >
                          <i className="ri-zoom-out-line" />
                        </Button>
                        <UncontrolledTooltip placement="top" target="mm-zoom-out">Zoom Out Text</UncontrolledTooltip>
                      </div>
                    </div>
                    <div className="pb-mm-panel-divider" />
                    <div
                      ref={mmContentScrollRef}
                      className="pb-mm-content-scroll mm-info custom-scrollbar"
                      style={{ fontSize: mmFontSize }}
                    >
                      {(() => {
                        const authorId = selectedAuthor?.value ?? selectedAuthor;
                        const remedyId = selectedRemedy?.value ?? selectedRemedy;
                        if (!remedyId || !authorId) {
                          return (
                            <div className="text-center py-5">
                              <i className="ri-book-open-line" style={{ fontSize: '3rem', opacity: 0.3 }} />
                              <p className="mt-3 mb-0">To load materia medica, select Remedy and Author.</p>
                            </div>
                          );
                        }
                        if (materiaMedicaDetailsLoading) {
                          return (
                            <div className="text-center py-3">
                              <Spinner size="sm" className="me-2" />
                              Loading materia medica details...
                            </div>
                          );
                        }
                        if (displayedMateriaMedicaSections.length > 0) {
                          return (
                            <div className="pt-2">
                              {displayedMateriaMedicaSections.map((remedy, index) => {
                                const sectionId = Number(remedy.materiaMedicaHeadId ?? remedy.materiaMedicaHeadID);
                                const sectionKey = Number.isFinite(sectionId) ? sectionId : `mm-section-${index}`;
                                return (
                                  <div
                                    key={sectionKey}
                                    className="pb-mm-section-block"
                                  >
                                    {remedy.materiaMedicaHeadName && (
                                      <h6 className="pb-mm-section-heading">{remedy.materiaMedicaHeadName}</h6>
                                    )}
                                    {remedy.materiaMedicaDetail1 && (
                                      <div>{ReactHtmlParser(remedy.materiaMedicaDetail1)}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        if (materiaMedicaDetails?.lstRemedy?.length > 0 && selectedMateriaMedicaHeadingId) {
                          return (
                            <div className="text-center py-5">
                              <p className="text-muted mb-0">No content available for the selected heading.</p>
                            </div>
                          );
                        }
                        return (
                          <div className="text-center py-5">
                            <i className="ri-file-text-line" style={{ fontSize: '3rem', opacity: 0.3 }} />
                            <p className="mt-3 mb-0">No materia medica details available</p>
                            <small className="text-muted">Please select both remedy and author to view details</small>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Repertorize' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--repertorize d-flex flex-column">
                <div className="row g-1 align-items-center mb-1 flex-shrink-0 pb-repertorize-toolbar">
                  <div className="col-md-3">
                    <Button
                      className="btn-sm pb-repertorize-toolbar__add"
                      onClick={() => setActiveTab('Repertory')}
                    >
                      <i className="ri-add-line me-1" aria-hidden="true" />
                      Add Rubric
                    </Button>
                  </div>
                  <div className="col-md-6 d-flex align-items-center justify-content-center">
                    <div className="d-flex align-items-center gap-1 pb-repertorize-toolbar__thermals">
                      {thermalCircles.map((circle) => {
                        const hasText = circle.label === 'N/A';
                        const isSelected = selectedThermalId === circle.id;
                        const style = circle.color ? {
                          background: circle.color,
                          borderColor: circle.color,
                          color: hasText ? 'white' : undefined
                        } : undefined;
                        const id = `pb-circle-repertorize-${circle.id}`;
                        return (
                          <React.Fragment key={circle.id}>
                            <span
                              id={id}
                              className="pb-circle"
                              style={{
                                ...style,
                                cursor: 'pointer',
                                opacity: hasText && selectedThermalId === null ? 1 : (isSelected ? 1 : 0.6),
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setSelectedThermalId(hasText ? null : circle.id)}
                            >
                              {hasText ? 'N/A' : ''}
                            </span>
                            <UncontrolledTooltip placement="top" target={id}>{circle.label}</UncontrolledTooltip>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  <div className="col-md-3 d-flex justify-content-end gap-2 pb-repertorize-toolbar__actions">
                    <Button
                      className="btn-sm pb-repertorize-toolbar__reset"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                    <Button
                      className={`btn-sm pb-repertorize-toolbar__keynote${isKeynoteMethodActive ? ' is-active' : ''}`}
                      onClick={handleKeynoteMethodClick}
                    >
                      Keynote Method
                    </Button>
                    <Button
                      className={`btn-sm pb-repertorize-toolbar__small${isSmallRubricsActive ? ' is-active' : ''}`}
                      onClick={handleSmallRubricClick}
                    >
                      Small Rubrics
                    </Button>
                  </div>
                </div>

                <div className="pb-repertorize-layout">
                <div className="pb-repertorize-layout__top">
                <div className="row g-1 mt-0 pb-tab-cards-row pb-repertorize-top-row">
                  {/* Rubrics for Repertorization - Responsive Width */}
                  <div className="col-12 col-md-4 pb-repertorize-rubrics-col">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--500 pb-repertorize-panel-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-list-ordered-2" />
                          </span>
                          Repertorization
                          <span className="pb-repertorize-count-pill">{repertorizationRubrics.length}</span>
                        </div>
                        {/* Ascending / descending sort icons — hidden per request
                        <div className="d-flex gap-1">
                          <i className="ri-arrow-up-line text-success" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                          <i className="ri-arrow-down-line text-danger" style={{ fontSize: '12px', fontWeight: 'bold' }}></i>
                        </div>
                        */}
                      </div>
                      <div className="pb-section-divider"></div>
                      <div className="flex-grow-1 custom-scrollbar pb-tab-card-scroll">
                        {repertorizationRubrics.length === 0 ? (
                          <div className="text-center p-4">
                            <p className="text-muted">No rubrics added yet. Click on intensity chips to add rubrics.</p>
                          </div>
                        ) : (
                          repertorizationRubrics.map((rubric, i) => {
                            // Check if this rubric should be bold (only if a remedy is selected and this rubric is in its presentSubSection)
                            const shouldBold = selectedRemedyFromCommonUncommon &&
                              selectedRemedyFromCommonUncommon.presentSubSection &&
                              Array.isArray(selectedRemedyFromCommonUncommon.presentSubSection) &&
                              selectedRemedyFromCommonUncommon.presentSubSection.includes(rubric.rubricId);

                            const rubricKey = rubric.rubricId ?? rubric.subsectionId ?? rubric.subSectionId ?? i;
                            const isFilled = filledPyramidIcons.has(rubricKey);

                            return (
                              <div
                                key={rubric.rubricId}
                                className="pb-rubric-row pb-repertorization-rubric-row d-flex align-items-center p-2 border-bottom"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setSelectedRepertorizationRubric(rubric);
                                  setRepertorizationRubricModalOpen(true);
                                }}
                              >
                                <span
                                  className="pb-repertorization-rubric-label"
                                  style={{ fontWeight: shouldBold ? 'bold' : 'normal' }}
                                  title={`${rubric.rubricName} [${rubric.remedyCount || 0}]`}
                                >
                                  {rubric.rubricName} [{rubric.remedyCount || 0}]
                                </span>
                                <div className="pb-repertorization-rubric-actions d-flex align-items-center flex-shrink-0">
                                  <div className="pb-repertorization-chips-slot">
                                    <div className="pb-rubric-badges pb-rubric-badges--repertorization">
                                      {renderIntensityChips(rubric, handleIntensityChipClick, { intensityNo: rubric.intensityNo })}
                                    </div>
                                  </div>
                                  <i
                                    className={isFilled ? 'ri-triangle-fill text-primary' : 'ri-triangle-line'}
                                    style={{ fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}
                                    title="Eliminate"
                                    onClick={(e) => handleEliminationToggle(e, rubric)}
                                  />
                                  <i
                                    className="ri-delete-bin-line text-danger"
                                    style={{ fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRepertorizationRubric(rubric.rubricId);
                                    }}
                                  />
                                  <span
                                    className="badge pb-repertorization-intensity-badge"
                                    style={{ background: '#000000', color: 'white', fontSize: '10px', flexShrink: 0 }}
                                  >
                                    {rubric.intensityNo}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Common - Responsive Width */}
                  <div className="col-12 col-md-4 pb-repertorize-common-col">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--500 pb-repertorize-panel-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-flashlight-line" />
                          </span>
                          COMMON
                          <span className="pb-repertorize-count-pill">{displayedCommonRemedies.length}</span>
                        </div>
                        <div className="pb-repertorize-header-search">
                          <div className={`search-box pb-questions-search-box${commonRemediesSearchTerm.trim() ? ' pb-questions-search-box--active' : ''}`}>
                            <Input
                              bsSize="sm"
                              className="pb-questions-search-input"
                              placeholder="Search..."
                              value={commonRemediesSearchTerm}
                              onChange={(e) => setCommonRemediesSearchTerm(e.target.value)}
                            />
                            <i className="ri-search-line search-icon"></i>
                          </div>
                        </div>
                      </div>
                      <div className="pb-section-divider"></div>
                      <div className={`custom-scrollbar pb-tab-card-scroll${isKeynoteMethodActive ? ' keynote-active' : ''}${isSmallRubricsActive ? ' small-rubrics-active' : ''}`}>
                        {isRemedyDataLoading ? (
                          <div className="text-center p-4">
                            <p className="text-muted">Loading common remedies...</p>
                          </div>
                        ) : displayedCommonRemedies && displayedCommonRemedies.length > 0 ? (
                          displayedCommonRemedies.map((remedy) => {
                            const remedyDisplay = getRemedyListDisplay(remedy);
                            const isSelected = selectedRemedyFromCommonUncommon && selectedRemedyFromCommonUncommon.remedyId === remedy.remedyId;
                            const isExpanded = expandedCommonItems.has(normalizeAccordionRemedyId(remedy.remedyId));

                            return (
                              <div key={remedy.remedyId}>
                                <div
                                  className={`pb-remedy-list-row${isSelected ? ' pb-remedy-list-row--selected' : ''}`}
                                  onClick={() => handleRemedyAccordionClick(remedy, true)}
                                >
                                  <div className="pb-remedy-list-row__meta">
                                    {(isKeynoteMethodActive || isSmallRubricsActive) && (
                                      <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line pb-remedy-list-row__chevron`}></i>
                                    )}
                                    <span className="pb-remedy-list-row__name text-truncate">{remedyDisplay.name}</span>
                                    {remedyDisplay.aliasBracket ? (
                                      <span
                                        className="pb-remedy-list-row__alias"
                                        onMouseEnter={(e) => {
                                          e.stopPropagation();
                                          handleRemedyAbbrevHover(remedy);
                                        }}
                                        onMouseLeave={handleRemedyAbbrevLeave}
                                      >
                                        {remedyDisplay.aliasBracket}
                                      </span>
                                    ) : null}
                                    {remedyDisplay.score != null && remedyDisplay.score !== '' ? (
                                      <span className="pb-remedy-list-row__ratio">
                                        [{remedyDisplay.score}]
                                      </span>
                                    ) : null}
                                  </div>
                                  <RemedyScoreBar value={remedy.final} />
                                </div>
                                {/* Accordion Sub-items */}
                                {isExpanded && (isKeynoteMethodActive || isSmallRubricsActive) && (
                                  <div
                                    className="px-3 py-2 pb-repertorize-accordion-panel"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {renderRemedyAccordionSublist(remedy)}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">
                              {commonRemediesSearchTerm.trim()
                                ? 'No matching remedies'
                                : 'No common remedies available'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Uncommon - Responsive Width */}
                  <div className="col-12 col-md-4 pb-repertorize-uncommon-col">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--500 pb-repertorize-panel-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-sparkling-line" />
                          </span>
                          UNCOMMON
                          <span className="pb-repertorize-count-pill">{displayedUncommonRemedies.length}</span>
                        </div>
                        <div className="pb-repertorize-header-search">
                          <div className={`search-box pb-questions-search-box${uncommonRemediesSearchTerm.trim() ? ' pb-questions-search-box--active' : ''}`}>
                            <Input
                              bsSize="sm"
                              className="pb-questions-search-input"
                              placeholder="Search..."
                              value={uncommonRemediesSearchTerm}
                              onChange={(e) => setUncommonRemediesSearchTerm(e.target.value)}
                            />
                            <i className="ri-search-line search-icon"></i>
                          </div>
                        </div>
                      </div>
                      <div className="pb-section-divider"></div>
                      <div className={`custom-scrollbar pb-tab-card-scroll${isKeynoteMethodActive ? ' keynote-active' : ''}${isSmallRubricsActive ? ' small-rubrics-active' : ''}`}>
                        {isRemedyDataLoading ? (
                          <div className="text-center p-4">
                            <p className="text-muted">Loading uncommon remedies...</p>
                          </div>
                        ) : displayedUncommonRemedies && displayedUncommonRemedies.length > 0 ? (
                          displayedUncommonRemedies.map((remedy) => {
                            const remedyDisplay = getRemedyListDisplay(remedy);
                            const isSelected = selectedRemedyFromCommonUncommon && selectedRemedyFromCommonUncommon.remedyId === remedy.remedyId;
                            const isExpanded = expandedUncommonItems.has(normalizeAccordionRemedyId(remedy.remedyId));

                            return (
                              <div key={remedy.remedyId}>
                                <div
                                  className={`pb-remedy-list-row${isSelected ? ' pb-remedy-list-row--selected' : ''}`}
                                  onClick={() => handleRemedyAccordionClick(remedy, false)}
                                >
                                  <div className="pb-remedy-list-row__meta">
                                    {(isKeynoteMethodActive || isSmallRubricsActive) && (
                                      <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line pb-remedy-list-row__chevron`}></i>
                                    )}
                                    <span className="pb-remedy-list-row__name text-truncate">{remedyDisplay.name}</span>
                                    {remedyDisplay.aliasBracket ? (
                                      <span
                                        className="pb-remedy-list-row__alias"
                                        onMouseEnter={(e) => {
                                          e.stopPropagation();
                                          handleRemedyAbbrevHover(remedy);
                                        }}
                                        onMouseLeave={handleRemedyAbbrevLeave}
                                      >
                                        {remedyDisplay.aliasBracket}
                                      </span>
                                    ) : null}
                                    {remedyDisplay.score != null && remedyDisplay.score !== '' ? (
                                      <span className="pb-remedy-list-row__ratio">
                                        [{remedyDisplay.score}]
                                      </span>
                                    ) : null}
                                  </div>
                                  <RemedyScoreBar value={remedy.final} />
                                </div>
                                {isExpanded && (isKeynoteMethodActive || isSmallRubricsActive) && (
                                  <div
                                    className="px-3 py-2 pb-repertorize-accordion-panel"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {renderRemedyAccordionSublist(remedy)}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">
                              {uncommonRemediesSearchTerm.trim()
                                ? 'No matching remedies'
                                : 'No uncommon remedies available'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* ###### Dj UI Code Start - Differential Materia Medica Card with Tabs Styling and Real Content ###### */}
                <div className="pb-repertorize-layout__dmm">
                <div className="row g-1 mt-0 pb-tab-cards-row pb-repertorize-bottom-row">
                  {/* Differential Materia Medica */}
                  <div className="col-12 pb-repertorize-dmm-col">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--580 pb-repertorize-dmm-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header pb-repertorize-side-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-book-open-line" />
                          </span>
                          DIFFERENTIAL MATERIA MEDICA
                        </div>
                        <div className="pb-repertorize-header-search">
                          <div className={`search-box pb-questions-search-box${differentialSearchTerm.trim() ? ' pb-questions-search-box--active' : ''}`}>
                            <Input
                              bsSize="sm"
                              className="pb-questions-search-input"
                              placeholder="Search..."
                              value={differentialSearchTerm}
                              onChange={(e) => setDifferentialSearchTerm(e.target.value)}
                            />
                            <i className="ri-search-line search-icon"></i>
                          </div>
                        </div>
                      </div>
                      <div className="pb-section-divider"></div>
                      <div className="d-flex px-2 pb-repertorize-dmm-tabs">
                        <Button
                          size="sm"
                          className={`pb-repertorize-dmm-tab${differentialMainTab === 'COMMON' ? ' is-active' : ''}`}
                          onClick={() => setDifferentialMainTab('COMMON')}
                        >
                          COMMON
                        </Button>
                        <Button
                          size="sm"
                          className={`pb-repertorize-dmm-tab${differentialMainTab === 'UNCOMMON' ? ' is-active' : ''}`}
                          onClick={() => setDifferentialMainTab('UNCOMMON')}
                        >
                          UNCOMMON
                        </Button>
                      </div>
                      <div className="pb-dmm-author-row">
                        {Array.isArray(materiaMedicaAuthors) && materiaMedicaAuthors.length > 0 ? (
                          materiaMedicaAuthors.map((author) => (
                            <span
                              key={author.authorId}
                              className={`pb-dmm-author-tab ${selectedDifferentialAuthorId === author.authorId ? 'active' : ''}`}
                              onClick={() => setSelectedDifferentialAuthorId(author.authorId)}
                              title={author.authorName?.trim() || 'N/A'}
                            >
                              {author.authorName?.trim() || 'N/A'}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">No authors available</span>
                        )}
                      </div>
                      <div className="flex-grow-1 pb-tab-card-scroll custom-scrollbar">
                        <div className="p-1">
                          {materiaMedicaHeadingByAuthorIdLoading || differentialMateriaMedicaLoading ? (
                            <div className="text-center p-4">
                              <p className="text-muted">Loading differential materia medica...</p>
                            </div>
                          ) : filteredDifferentialMateriaMedica && filteredDifferentialMateriaMedica.length > 0 ? (
                            filteredDifferentialMateriaMedica.map((remedy, index) => {
                              const isLastItem = index === filteredDifferentialMateriaMedica.length - 1;
                              const containerClasses = isLastItem ? 'mb-3' : 'mb-3 pb-2 border-bottom';
                              const remedyKey = remedy.remedyId ?? `${remedy.remedyName}-${index}`;
                              return (
                                <div key={remedyKey} className={containerClasses}>
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <div>
                                      <strong style={{ fontSize: '13px' }}>{remedy.remedyName}</strong>
                                      {remedy.score ? (
                                        <span className="ms-2" style={{ fontSize: '12px', color: '#004c9d' }}>[{remedy.score}]</span>
                                      ) : null}
                                    </div>
                                  </div>
                                  {remedy.entries && remedy.entries.length > 0 ? (
                                    remedy.entries.map((entry, entryIndex) => (
                                      <div key={`${remedyKey}-${entryIndex}`} className={entryIndex === remedy.entries.length - 1 ? 'mb-1' : 'mb-2'}>
                                        <div className="fw-semibold" style={{ fontSize: '12px', color: '#000000' }}>{entry.materiaMedicaHeadName}</div>
                                        <div style={{ fontSize: `${mmFontSize}px`, lineHeight: 1.5 }}>
                                          {entry.materiaMedica ? ReactHtmlParser(entry.materiaMedica) : (
                                            <span className="text-muted">No materia medica available.</span>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-muted" style={{ fontSize: '12px' }}>No materia medica entries available.</div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-muted">
                                {activeDifferentialAuthor ? 'No differential materia medica available for the current selection.' : 'Select an author to view differential materia medica.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                  {/* SECTION — same height as Rubrics / Common / Uncommon */}
                  <div className="pb-repertorize-layout__section">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--section pb-repertorize-section-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header pb-repertorize-side-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-layout-grid-line" />
                          </span>
                          SECTION
                        </div>
                      </div>
                      <div className="pb-section-divider"></div>
                      <div
                        className="flex-grow-1 custom-scrollbar pb-tab-card-scroll"
                        onScroll={handleSectionScroll}
                      >
                        {sectionLoading && sectionPageNumber === 1 && sectionOptions.length === 0 ? (
                          <div className="text-center p-4">
                            <p className="text-muted">Loading sections...</p>
                          </div>
                        ) : sectionOptions.length > 0 ? (
                          <>
                            {sectionOptions.map((section) => {
                              const isSectionSelected = selectedRepertorizeSectionIds.includes(
                                Number(section.sectionId)
                              );
                              return (
                                <div
                                  key={section.sectionId}
                                  className={`pb-repertorize-section-row${isSectionSelected ? ' pb-repertorize-section-row--active' : ''}`}
                                  style={{ cursor: isKeynoteMethodActive || isSmallRubricsActive ? "pointer" : "default" }}
                                  onClick={() => {
                                    if (!isKeynoteMethodActive && !isSmallRubricsActive) {
                                      return;
                                    }
                                    handleRepertorizeSectionCheckboxChange(
                                      section.sectionId,
                                      !isSectionSelected
                                    );
                                  }}
                                >
                                  <span className="pb-repertorize-section-row__label">
                                    <span className="pb-repertorize-section-icon" aria-hidden="true">
                                      <i className={getRepertorySectionIcon(section.sectionName)} />
                                    </span>
                                    <span className="text-truncate">{section.sectionName}</span>
                                  </span>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isSectionSelected}
                                    disabled={!isKeynoteMethodActive && !isSmallRubricsActive}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleRepertorizeSectionCheckboxChange(
                                        section.sectionId,
                                        e.target.checked
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              );
                            })}
                            {sectionLoadingMore && (
                              <div className="text-center p-2">
                                <Spinner size="sm" color="primary" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No sections available</p>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 pb-repertorize-section-grades">
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                          {intensitiesForPatientList && Array.isArray(intensitiesForPatientList) && intensitiesForPatientList.length > 0 ? (
                            [...intensitiesForPatientList].sort((a, b) => b.intensityNo - a.intensityNo).map((intensity) => {
                              const isActive = selectedRepertorizeIntensity === intensity.intensityNo;
                              const canUseGradeFilters =
                                (isKeynoteMethodActive || isSmallRubricsActive) &&
                                selectedRepertorizeSectionIds.length > 0;
                              return (
                                <button
                                  key={intensity.intensityId}
                                  type="button"
                                  className={`btn btn-sm pb-repertorize-grade-btn${isActive ? ' is-active' : ''}`}
                                  disabled={!canUseGradeFilters}
                                  onClick={() => handleRepertorizeSectionIntensityClick(intensity.intensityNo)}
                                >
                                  {intensity.intensityNo}
                                </button>
                              );
                            })
                          ) : (
                            [4, 3, 2, 1].map(num => {
                              const isActive = selectedRepertorizeIntensity === num;
                              const canUseGradeFilters =
                                (isKeynoteMethodActive || isSmallRubricsActive) &&
                                selectedRepertorizeSectionIds.length > 0;
                              return (
                                <button
                                  key={num}
                                  type="button"
                                  className={`btn btn-sm pb-repertorize-grade-btn${isActive ? ' is-active' : ''}`}
                                  disabled={!canUseGradeFilters}
                                  onClick={() => handleRepertorizeSectionIntensityClick(num)}
                                >
                                  {num}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* ###### Dj UI Code Start - Headings Card with Real Data ###### */}
                    {/* HEADINGS — same height as Differential Materia Medica */}
                    <div className="pb-repertorize-layout__headings">
                    <div className="border rounded-2 pb-tab-card pb-tab-card--headings pb-repertorize-headings-card">
                      <div className="d-flex align-items-center justify-content-between flex-nowrap gap-2 pb-repertorize-panel-header pb-repertorize-side-header">
                        <div className="fw-semibold pb-section-title mb-0">
                          <span className="pb-repertorize-side-header__icon" aria-hidden="true">
                            <i className="ri-list-check-2" />
                          </span>
                          HEADINGS
                        </div>
                      </div>
                      <div className="pb-section-divider"></div>
                      <div className="flex-grow-1 pb-tab-card-scroll custom-scrollbar">
                        {materiaMedicaHeadingByAuthorIdLoading ? (
                          <div className="text-center p-4">
                            <p className="text-muted">Loading headings...</p>
                          </div>
                        ) : filteredMateriaMedicaHeadingItems && filteredMateriaMedicaHeadingItems.length > 0 ? (
                          filteredMateriaMedicaHeadingItems.map((heading) => {
                            const headingId = Number(heading?.materiaMedicaHeadId ?? heading?.materiaMedicaHeadID);
                            const headingKey = Number.isFinite(headingId) ? headingId : (heading.materiaMedicaHeadName ?? headingId);
                            const isDifferential = !!heading.differentialMM;
                            const isSelected = Number.isFinite(headingId) && selectedDifferentialHeadingId === headingId;
                            const canSelect = Number.isFinite(headingId);
                            return (
                              <div
                                key={headingKey}
                                className={`pb-repertorize-section-row pb-repertorize-heading-row${isSelected ? ' pb-repertorize-section-row--active pb-repertorize-heading-row--active' : ''}`}
                                style={{ cursor: canSelect ? 'pointer' : 'default' }}
                                onClick={() => {
                                  if (!canSelect) {
                                    return;
                                  }
                                  handleDifferentialHeadingSelect(isSelected ? null : headingId);
                                }}
                              >
                                <span
                                  className="pb-repertorize-section-row__label"
                                  style={{
                                    fontWeight: isDifferential || isSelected ? 600 : undefined,
                                  }}
                                >
                                  <span className="pb-repertorize-section-icon pb-repertorize-heading-icon" aria-hidden="true">
                                    <i className={getMateriaMedicaHeadingIcon(heading)} />
                                  </span>
                                  <span className="text-truncate">
                                    {heading.materiaMedicaHeadName || heading.headingName || 'N/A'}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={isSelected}
                                  disabled={!canSelect}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (!canSelect) {
                                      return;
                                    }
                                    handleDifferentialHeadingSelect(e.target.checked ? headingId : null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center p-4">
                            <p className="text-muted">No headings available</p>
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                    {/* ###### Dj UI Code End - Headings Card with Real Data ###### */}
                </div>

              </div>
            )}
            {activeTab === 'Questions' && (
              <div className="p-0 pb-tab-panel pb-tab-panel--questions d-flex flex-column h-100 min-h-0">
                {(selectedQuestionSection || selectedQuestionGroup || selectedSubGroupName) && (
                  <div className="pb-questions-path-bar flex-shrink-0">
                    <span className="pb-questions-path-label">Selection</span>
                    {selectedQuestionSection && (
                      <span className="pb-questions-path-item">{selectedQuestionSection.questionSectionName}</span>
                    )}
                    {selectedQuestionGroup && (
                      <>
                        <i className="ri-arrow-right-s-line pb-questions-path-sep" aria-hidden="true" />
                        <span className="pb-questions-path-item">{selectedQuestionGroup.name}</span>
                      </>
                    )}
                    {selectedSubGroupName && (
                      <>
                        <i className="ri-arrow-right-s-line pb-questions-path-sep" aria-hidden="true" />
                        <span className="pb-questions-path-item pb-questions-path-item--active">{selectedSubGroupName}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="pb-tab-sub-view pb-tab-sub-view--questions">
                  <div className="row g-0 mt-0 pb-tab-cards-row pb-tab-cards-row--fill h-100">
                    {/* Column 1 — Question Section (like Repertory SECTION) */}
                    <div className="col-md-2">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-questions-col-card">
                        <div className="pb-questions-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-layout-grid-line" />
                            </span>
                            QUESTION SECTION
                          </div>
                          {/* Search reserved for future use
                          <div className="pb-questions-search-wrap">
                            {renderQuestionsSearchInput(
                              questionSectionSearch,
                              setQuestionSectionSearch,
                              { onClear: () => setQuestionSectionSearch('') }
                            )}
                          </div>
                          */}
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div className="pb-tab-card-scroll custom-scrollbar pb-questions-section-scroll">
                          {questionsSectionLoading && (!questionSectionDDL || questionSectionDDL.length === 0) ? (
                            <div className="text-center p-4">
                              <Spinner size="sm" color="primary" />
                              <p className="text-muted mt-2 small mb-0">Loading sections...</p>
                            </div>
                          ) : filteredQuestionSections.length > 0 ? (
                            filteredQuestionSections.map((section) => {
                              const isActive = selectedQuestionSection?.questionSectionId === section.questionSectionId;
                              return (
                                <div
                                  key={section.questionSectionId}
                                  className={`pb-rubric-row border pb-questions-section-item${isActive ? ' pb-questions-section-item--active' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleQuestionSectionSelect(section)}
                                >
                                  <span className="pb-questions-section-item__icon" aria-hidden="true">
                                    <i className={getQuestionSectionIcon(section.questionSectionName)} />
                                  </span>
                                  <span className="pb-questions-section-item__label">
                                    {section.questionSectionName}
                                  </span>
                                </div>
                              );
                            })
                          ) : questionSectionSearch.trim() ? (
                            <div className="text-center p-4">
                              <p className="text-muted mb-0">No sections match &ldquo;{questionSectionSearch.trim()}&rdquo;</p>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-muted mb-0">No question sections available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 2 — Question Group (like Repertory SUB SECTION) */}
                    <div className="col-md-4">
                      <div className="border rounded-2 pb-tab-card pb-tab-card--544 pb-tab-card--fill pb-questions-col-card">
                        <div className="pb-questions-panel-header">
                          <div className="fw-semibold pb-section-title mb-0">
                            <span className="pb-repertory-section-title-icon" aria-hidden="true">
                              <i className="ri-node-tree" />
                            </span>
                            QUESTION GROUP
                          </div>
                          <div className="pb-questions-search-wrap">
                            {renderQuestionsSearchInput(
                              questionGroupSearch,
                              setQuestionGroupSearch,
                              {
                                disabled: !selectedQuestionSection,
                                onClear: () => setQuestionGroupSearch(''),
                              }
                            )}
                          </div>
                        </div>
                        <div className="pb-tab-card-divider"></div>
                        <div className="pb-tab-card-scroll custom-scrollbar pb-questions-group-scroll">
                          {!selectedQuestionSection ? (
                            <div className="text-center p-4">
                              <p className="text-muted mb-0">Select a question section first</p>
                            </div>
                          ) : isQuestionGroupsLoading && activeQuestionGroups.length === 0 ? (
                            <div className="text-center p-4">
                              <Spinner size="sm" color="primary" />
                              <p className="text-muted mt-2 small mb-0">Loading groups...</p>
                            </div>
                          ) : filteredQuestionGroups.length > 0 ? (
                            filteredQuestionGroups.map((group) => {
                              const isActive = selectedQuestionGroup?.id === group.id;
                              return (
                                <div
                                  key={group.id}
                                  className={`pb-rubric-row border pb-questions-group-item${isActive ? ' pb-questions-group-item--active' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleQuestionGroupSelect(group)}
                                >
                                  <span className="pb-questions-group-item__icon" aria-hidden="true">
                                    <i className="ri-folder-3-line" />
                                  </span>
                                  <span className="pb-questions-group-item__label">
                                    {group.name}
                                  </span>
                                </div>
                              );
                            })
                          ) : questionGroupSearch.trim() ? (
                            <div className="text-center p-4">
                              <p className="text-muted mb-0">No groups match &ldquo;{questionGroupSearch.trim()}&rdquo;</p>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <p className="text-muted mb-0">No question groups in this section</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 3 — Sub groups + Rubrics (Clinical Pattern style) */}
                    <div className="col-md-6">
                      <div className="pb-questions-right-stack h-100">
                        <div className="border rounded-2 pb-tab-card pb-tab-card--fill pb-questions-keywords-card pb-questions-col-card">
                          <div className="pb-questions-panel-header">
                            <div className="fw-semibold pb-section-title mb-0">
                              <span className="pb-repertory-section-title-icon" aria-hidden="true">
                                <i className="ri-price-tag-3-line" />
                              </span>
                              SUB QUESTION GROUP
                            </div>
                            <div className="pb-questions-search-wrap">
                              {renderQuestionsSearchInput(
                                subQuestionGroupSearch,
                                setSubQuestionGroupSearch,
                                {
                                  disabled: !selectedQuestionGroup,
                                  onClear: () => setSubQuestionGroupSearch(''),
                                }
                              )}
                            </div>
                          </div>
                          <div className="pb-tab-card-divider"></div>
                          <div className="pb-tab-card-scroll custom-scrollbar pb-questions-keywords-scroll">
                            {!selectedQuestionGroup ? (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">Select a question group to see sub-groups</p>
                              </div>
                            ) : isQuestionSubGroupsLoading && filteredQuestionSubGroups.length === 0 ? (
                              <div className="text-center p-4">
                                <Spinner size="sm" color="primary" />
                                <p className="text-muted mt-2 small mb-0">Loading sub-groups...</p>
                              </div>
                            ) : filteredQuestionSubGroups.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2 p-2">
                                {filteredQuestionSubGroups.map((subGroup) => (
                                  <span
                                    key={subGroup.id}
                                    className={`pb-keyword-tab${selectedSubGroupId === subGroup.id ? ' active' : ''}`}
                                    onClick={() => handleSubGroupClick(
                                      selectedQuestionSection.questionSectionId,
                                      selectedQuestionGroup.id,
                                      subGroup.id,
                                      subGroup.name,
                                      subGroup.sectionIds
                                    )}
                                    title={`Search rubrics for "${subGroup.name}"`}
                                  >
                                    {subGroup.name}
                                  </span>
                                ))}
                              </div>
                            ) : subQuestionGroupSearch.trim() ? (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">No sub-groups match &ldquo;{subQuestionGroupSearch.trim()}&rdquo;</p>
                              </div>
                            ) : (
                              <div className="text-center p-4">
                                <p className="text-muted mb-0">No sub-groups found for this group</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border rounded-2 pb-tab-card pb-tab-card--fill pb-questions-rubrics-card pb-questions-col-card">
                          <div className="pb-questions-panel-header pb-questions-rubrics-header">
                            <div className="fw-semibold pb-section-title mb-0">
                              <span className="pb-repertory-section-title-icon" aria-hidden="true">
                                <i className="ri-file-list-3-line" />
                              </span>
                              RUBRICS WITH REMEDIES
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end flex-grow-1">
                              {selectedSubGroupName && !questionsRubricLoading && (
                                <span className="pb-questions-result-count">
                                  {rubricSearch.trim()
                                    ? `${filteredRubrics.length} / ${rubrics.length}`
                                    : rubrics.length}
                                  {' '}rubric{rubrics.length === 1 ? '' : 's'}
                                </span>
                              )}
                              <div style={{ minWidth: 200, maxWidth: 280, flex: '1 1 200px' }}>
                                {renderQuestionsSearchInput(
                                  rubricSearch,
                                  setRubricSearch,
                                  {
                                    disabled: !selectedSubGroupName,
                                    placeholder: 'Filter rubrics...',
                                    onClear: () => setRubricSearch(''),
                                  }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="pb-tab-card-divider flex-shrink-0"></div>
                          <div className="pb-tab-card-scroll custom-scrollbar pb-questions-rubrics-scroll" onScroll={handleQuestionsRubricsScroll}>
                            {questionsRubricLoading ? (
                              <div className="text-center p-4">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2 mb-0">Loading rubrics...</p>
                              </div>
                            ) : filteredRubrics.length > 0 ? (
                              <div className="pb-questions-rubrics-list">
                                {filteredRubrics.map((r, i) => (
                                  <div
                                    key={`qr-${r.subsectionId ?? i}`}
                                    className="pb-rubric-row border pb-questions-rubric-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleQuestionRubricClick(r)}
                                    title={r.subsectionName}
                                  >
                                    <div className="pb-rubric-badges">
                                      {renderQuestionRubricIntensityChips(r)}
                                    </div>
                                    <span className="pb-questions-rubric-label">{r.subsectionName}</span>
                                  </div>
                                ))}
                                {questionsRubricLoadingMore && (
                                  <div className="pb-questions-rubrics-list__status">
                                    <Spinner size="sm" color="primary" />
                                    <span className="text-muted small ms-2">Loading more rubrics...</span>
                                  </div>
                                )}
                                {!questionsRubricLoadingMore && questionsRubricHasMore && (
                                  <div className="pb-questions-rubrics-list__status">
                                    <span className="text-muted small">Scroll down to load more</span>
                                  </div>
                                )}
                              </div>
                            ) : selectedSubGroupName && rubricSearch.trim() ? (
                              <div className="text-center p-4">
                                <i className="ri-filter-off-line text-muted d-block mb-2" style={{ fontSize: '1.75rem' }} aria-hidden="true" />
                                <p className="text-muted mb-0">No rubrics match &ldquo;{rubricSearch.trim()}&rdquo;</p>
                              </div>
                            ) : selectedSubGroupName ? (
                              <div className="text-center p-4">
                                <i className="ri-file-search-line text-muted d-block mb-2" style={{ fontSize: '1.75rem' }} aria-hidden="true" />
                                <p className="text-muted mb-0">No rubrics found for &ldquo;{selectedSubGroupName}&rdquo;.</p>
                              </div>
                            ) : (
                              <div className="text-center p-4">
                                <i className="ri-menu-search-line text-muted d-block mb-2" style={{ fontSize: '1.75rem' }} aria-hidden="true" />
                                <p className="text-muted mb-1 fw-medium">Select a sub question group</p>
                                <p className="text-muted small mb-0">Choose section → group → sub-group to search rubrics.</p>
                              </div>
                            )}
                          </div>
                          {selectedSubGroupName && !questionsRubricLoading && rubrics.length > 0 && (
                            <div className="pb-questions-rubrics-footer">
                              <span>
                                Showing <strong>{filteredRubrics.length}</strong>
                                {rubricSearch.trim() ? ` of ${rubrics.length}` : ''} loaded
                                {questionsRubricHasMore ? '+' : ''}
                              </span>
                              <span>
                                {questionsRubricLoadingMore
                                  ? 'Loading page...'
                                  : questionsRubricHasMore
                                    ? `Page ${questionsRubricPage} · scroll for more`
                                    : `Page ${questionsRubricPage} · end`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </CardBody>
      </Card>

      {renderRemedyInfoTooltip()}
      {renderSubSectionSearchSuggestionsPortal()}
      {renderGlobalSubSectionSearchSuggestionsPortal()}
      {renderRemedyAbbrevTooltip()}

      {/* English Tooltip — RUBRIC DETAILS subSectionDetails */}
      {showEnglishTooltip && (
        <div className="marathi-tooltip" style={{ whiteSpace: 'pre-wrap' }}>
          {getSubSectionLanguageDetailsText(
            displayRubricDetails?.subSectionLanguageDetails,
            'english'
          )}
        </div>
      )}

      {/* Marathi Tooltip — RUBRIC DETAILS subSectionDetails */}
      {showMarathiTooltip && (
        <div className="marathi-tooltip" style={{ whiteSpace: 'pre-wrap' }}>
          {getSubSectionLanguageDetailsText(
            displayRubricDetails?.subSectionLanguageDetails,
            'marathi'
          )}
        </div>
      )}

      {/* Rubric Remedy Details Modal */}
      <Modal
        isOpen={rubricRemedyModalOpen}
        toggle={() => setRubricRemedyModalOpen(false)}
        size="xl"
        className="pb-rubric-remedy-modal"
        contentClassName="patient-board-page pb-rubric-remedy-modal__content"
      >
        <div className="pb-rubric-remedy-modal__toolbar">
          <div className="pb-rubric-remedy-modal__toolbar-group">
            <Button
              size="sm"
              className={`modal-header-btn ${showRemedyAuthors ? 'active' : ''}`}
              onClick={() => setShowRemedyAuthors(!showRemedyAuthors)}
              title="Show remedy authors"
            ><i className="ri-user-line" /></Button>
            <Button
              size="sm"
              className={`modal-header-btn ${showRemedyInfo ? 'active' : ''}`}
              onClick={() => setShowRemedyInfo(!showRemedyInfo)}
              title="Show remedy info"
            ><i className="ri-information-line" /></Button>
          </div>
          <div className="pb-rubric-remedy-modal__toolbar-group">
            <Button
              size="sm"
              className="modal-header-btn"
              title="English language"
            >En</Button>
            <Button
              size="sm"
              className="modal-header-btn"
              title="Marathi language"
            >म</Button>
          </div>
        </div>
        <ModalBody className="rrd-body pb-rubric-remedy-modal__body">
          <div className="pb-rubric-remedy-modal__title-bar">
            <h6 className="pb-rubric-remedy-modal__title mb-0">
              {rubricDetailsList?.subSectionName || selectedRubricRemedy || 'KIDNEYS-PAIN-aching'}
            </h6>
          </div>
          <div className="pb-rubric-remedy-modal__meta">
            <div className="text-muted pb-rubric-remedy-modal__description">
              {rubricDetailsList?.description || 'No data to display'}
            </div>
          </div>
          <div className="pb-rubric-remedy-modal__count-bar">
            <span className="pb-rubric-remedy-modal__count-label">Remedy Count :</span>
            <span className="pb-rubric-remedy-modal__count-pill">
              ({rubricDetailsList?.remediesList?.length || 0})
            </span>
          </div>
          <div className={`pb-rubric-remedy-modal__remedies custom-scrollbar${showRemedyAuthors ? ' pb-rubric-remedy-modal__remedies--authors' : ''}`}>
            <div className={`pb-rubric-remedy-modal__remedy-wrap${showRemedyAuthors ? ' pb-rubric-remedy-modal__remedy-wrap--authors' : ''}`}>
              {rubricDetailsList && rubricDetailsList.remediesList && rubricDetailsList.remediesList.length > 0 ? (
                rubricDetailsList.remediesList.map((remedy, index) => (
                  <span
                    key={remedy?.remedyId ?? index}
                    className="remedy-item"
                    style={getRemedyAliasStyle(remedy)}
                    onClick={() => handleRemedyAliasClick(remedy)}
                  >
                    {renderRemedyAliasWithAuthorSubscript(remedy, showRemedyAuthors, { wrapAuthors: showRemedyAuthors })}
                    {renderRemedyInfoIcon(remedy)}
                  </span>
                ))
              ) : (
                <span className="text-muted">No Remedies to display</span>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="pb-rubric-remedy-modal__footer">
          <ModalActionButton action="cancel" onClick={() => setRubricRemedyModalOpen(false)} />
        </ModalFooter>
      </Modal>

      {/* Questions Rubric Details Modal */}
      <Modal
        isOpen={questionRubricModalOpen}
        toggle={() => setQuestionRubricModalOpen(false)}
        size="xl"
        className="pb-rubric-remedy-modal"
        contentClassName="patient-board-page pb-rubric-remedy-modal__content"
      >
        <div className="pb-rubric-remedy-modal__toolbar">
          <div className="pb-rubric-remedy-modal__toolbar-group">
            <Button
              size="sm"
              className={`modal-header-btn ${showRemedyAuthors ? 'active' : ''}`}
              onClick={() => setShowRemedyAuthors(!showRemedyAuthors)}
              title="Show remedy authors"
            ><i className="ri-user-line" /></Button>
            <Button
              size="sm"
              className={`modal-header-btn ${showRemedyInfo ? 'active' : ''}`}
              onClick={() => setShowRemedyInfo(!showRemedyInfo)}
              title="Show remedy info"
            ><i className="ri-information-line" /></Button>
          </div>
          <div className="pb-rubric-remedy-modal__toolbar-group">
            <Button
              size="sm"
              className="modal-header-btn"
              title="English language"
            >En</Button>
            <Button
              size="sm"
              className="modal-header-btn"
              title="Marathi language"
            >म</Button>
          </div>
        </div>
        <ModalBody className="rrd-body pb-rubric-remedy-modal__body">
          <div className="pb-rubric-remedy-modal__title-bar">
            <h6 className="pb-rubric-remedy-modal__title mb-0">
              {rubricDetailsList?.subSectionName || selectedQuestionRubric?.subsectionName || 'RUBRIC'}
            </h6>
          </div>
          <div className="pb-rubric-remedy-modal__meta">
            <div className="text-muted pb-rubric-remedy-modal__description">
              {rubricDetailsList?.description || 'No data to display'}
            </div>
          </div>
          <div className="pb-rubric-remedy-modal__count-bar">
            <span className="pb-rubric-remedy-modal__count-label">Remedy Count :</span>
            <span className="pb-rubric-remedy-modal__count-pill">
              ({rubricDetailsList?.remediesList?.length || 0})
            </span>
          </div>
          <div className={`pb-rubric-remedy-modal__remedies custom-scrollbar${showRemedyAuthors ? ' pb-rubric-remedy-modal__remedies--authors' : ''}`}>
            <div className={`pb-rubric-remedy-modal__remedy-wrap${showRemedyAuthors ? ' pb-rubric-remedy-modal__remedy-wrap--authors' : ''}`}>
              {rubricDetailsList && rubricDetailsList.remediesList && rubricDetailsList.remediesList.length > 0 ? (
                rubricDetailsList.remediesList.map((remedy, index) => (
                  <span
                    key={remedy?.remedyId ?? index}
                    className="remedy-item"
                    style={getRemedyAliasStyle(remedy)}
                    onClick={() => handleRemedyAliasClick(remedy)}
                  >
                    {renderRemedyAliasWithAuthorSubscript(remedy, showRemedyAuthors, { wrapAuthors: showRemedyAuthors })}
                    {renderRemedyInfoIcon(remedy)}
                  </span>
                ))
              ) : (
                <span className="text-muted">No Remedies to display</span>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="pb-rubric-remedy-modal__footer">
          <ModalActionButton action="cancel" onClick={() => setQuestionRubricModalOpen(false)} />
        </ModalFooter>
      </Modal>

      {/* Prescription Modal */}
      <Modal isOpen={prescriptionModalOpen} toggle={() => setPrescriptionModalOpen(false)} size="xl" className="pb-prescription-modal" contentClassName="patient-board-page">
        <ModalBody className="pb-prescription-modal__body">
          {/* Tabs - Always Visible */}
          <div className="pb-prescription-modal__tabs" role="tablist" aria-label="Prescription sections">
            <Button
              size="sm"
              type="button"
              role="tab"
              aria-selected={prescriptionTab === 'Prescription'}
              className={`pb-prescription-modal__tab${prescriptionTab === 'Prescription' ? ' is-active' : ''}`}
              onClick={() => setPrescriptionTab('Prescription')}
            >
              <i className="ri-capsule-line" aria-hidden="true" />
              Prescription
            </Button>
            <Button
              size="sm"
              type="button"
              role="tab"
              aria-selected={prescriptionTab === 'Labs & Imaging'}
              className={`pb-prescription-modal__tab${prescriptionTab === 'Labs & Imaging' ? ' is-active' : ''}`}
              onClick={() => setPrescriptionTab('Labs & Imaging')}
            >
              <i className="ri-test-tube-line" aria-hidden="true" />
              Labs & Imaging
            </Button>
            <Button
              size="sm"
              type="button"
              role="tab"
              aria-selected={prescriptionTab === 'History Notes'}
              className={`pb-prescription-modal__tab${prescriptionTab === 'History Notes' ? ' is-active' : ''}`}
              onClick={() => setPrescriptionTab('History Notes')}
            >
              <i className="ri-file-history-line" aria-hidden="true" />
              History Notes
            </Button>
          </div>

          {/* Tab Content */}
          {prescriptionTab === 'Prescription' && (
            <div className="pb-prescription-modal__panel">
              {/* Form Row - Always Visible */}
              <div className="pb-prescription-modal__form-row">
                <div style={{ flex: '0 0 280px' }}>
                  <Select
                    isSearchable
                    isClearable
                    placeholder="Select Remedy"
                    options={prescriptionRemedyList && Array.isArray(prescriptionRemedyList) ? prescriptionRemedyList.map(remedy => ({
                      value: remedy.remedyId,
                      label: remedy.remedyName
                    })) : []}
                    value={selectedPrescriptionRemedy}
                    onChange={(selected) => setSelectedPrescriptionRemedy(selected)}
                    isLoading={prescriptionRemedyLoading}
                    {...modalSelectPortalProps}
                    styles={{
                      control: (base) => ({
                        ...base,
                        fontSize: '14px',
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: MODAL_SELECT_MENU_Z }),
                    }}
                  />
                </div>
                <div style={{ flex: '1' }}>
                  <Input
                    type="textarea"
                    name="remedyDescription"
                    placeholder="Remedy Description"
                    rows="1"
                    value={prescriptionRemedyDescription}
                    onChange={(e) => setPrescriptionRemedyDescription(e.target.value)}
                    style={{ fontSize: '14px', resize: 'none' }}
                  />
                </div>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => {
                    if (!selectedPrescriptionRemedy) {
                      Swal.fire({
                        icon: 'warning',
                        title: 'Warning',
                        text: 'Please select a remedy.',
                        confirmButtonColor: '#000000'
                      });
                      return;
                    }

                    if (!prescriptionRemedyDescription || prescriptionRemedyDescription.trim() === '') {
                      Swal.fire({
                        icon: 'warning',
                        title: 'Warning',
                        text: 'Please enter remedy description.',
                        confirmButtonColor: '#000000'
                      });
                      return;
                    }

                    const newRemedy = {
                      remedyId: selectedPrescriptionRemedy.value,
                      remedyName: selectedPrescriptionRemedy.label,
                      description: prescriptionRemedyDescription.trim(),
                      dose: ''
                    };

                    setPrescriptionRemedyDetailList([...prescriptionRemedyDetailList, newRemedy]);
                    setSelectedPrescriptionRemedy(null);
                    setPrescriptionRemedyDescription('');
                  }}
                  className="pb-prescription-modal__add-btn"
                >
                  <i className="ri-add-line" aria-hidden="true"></i>
                </Button>
              </div>

              {/* Prescription Table - Scrollable Only */}
              <div className="custom-scrollbar pb-prescription-modal__table-wrap">
                <table className="table table-bordered table-sm pb-prescription-modal__table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>No.</th>
                      <th><i className="ri-medicine-bottle-line" aria-hidden="true" />Remedy Name</th>
                      <th><i className="ri-file-text-line" aria-hidden="true" />Remedy Description</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionRemedyDetailList.length > 0 ? (
                      prescriptionRemedyDetailList.map((item, index) => (
                        <tr key={`${item.remedyId}-${index}`}>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>{index + 1}</td>
                          <td style={{ padding: '4px 8px' }}>{item.remedyName}</td>
                          <td style={{ padding: '4px 8px' }}>{item.description}</td>
                          <td style={{ textAlign: 'center', padding: '4px 4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => setPrescriptionRemedyDetailList(prescriptionRemedyDetailList.filter((_, i) => i !== index))}
                                style={{ padding: '2px 4px', minWidth: '24px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <i className="ri-delete-bin-line" style={{ fontSize: '14px' }}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="pb-prescription-modal__empty">
                          <span className="pb-prescription-modal__empty-inner">
                            <span className="pb-prescription-modal__empty-icon" aria-hidden="true">
                              <i className="ri-capsule-line" />
                            </span>
                            No prescription items added
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {prescriptionTab === 'Labs & Imaging' && (
            <div className="pb-prescription-modal__panel">
              {/* Labs & Imaging Tabs */}
              <div className="pb-prescription-modal__subtabs" role="tablist" aria-label="Labs sections">
                <span
                  className={`pb-prescription-modal__subtab${labsImagingTab === 'Ordered Labs & Imaging' ? ' active' : ''}`}
                  onClick={() => setLabsImagingTab('Ordered Labs & Imaging')}
                  role="tab"
                  aria-selected={labsImagingTab === 'Ordered Labs & Imaging'}
                >
                  <i className="ri-clipboard-line" aria-hidden="true" />
                  Ordered Labs & Imaging
                </span>
                <span
                  className={`pb-prescription-modal__subtab${labsImagingTab === 'Labs & Imaging Results' ? ' active' : ''}`}
                  onClick={() => setLabsImagingTab('Labs & Imaging Results')}
                  role="tab"
                  aria-selected={labsImagingTab === 'Labs & Imaging Results'}
                >
                  <i className="ri-flask-line" aria-hidden="true" />
                  Labs & Imaging Results
                </span>
              </div>

              {/* Tab Content */}
              {labsImagingTab === 'Ordered Labs & Imaging' && (
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'hidden' }}>
                  {/* Form Rows - Always Visible */}
                  <div style={{ flexShrink: 0 }}>
                    {/* First Row: Test Name, Test Date, Lab Name */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ flex: '1' }}>
                        <Select
                          isSearchable
                          isClearable
                          placeholder="Test Name"
                          options={labTestOptions}
                          isLoading={patientLabTestDDLLoading}
                          value={labOrderForm.patientLabTestId ? labTestOptions?.find(opt => opt.value === labOrderForm.patientLabTestId) : null}
                          onChange={(selected) => setLabOrderForm({ ...labOrderForm, patientLabTestId: selected?.value || null })}
                          {...modalSelectPortalProps}
                          styles={{
                            control: (base) => ({
                              ...base,
                              fontSize: '14px',
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: MODAL_SELECT_MENU_Z }),
                          }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <Input
                          type="date"
                          name="testDate"
                          value={labOrderForm.testDate}
                          onChange={(e) => setLabOrderForm({ ...labOrderForm, testDate: e.target.value })}
                          style={{ fontSize: '14px', height: '38px' }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <Input
                          type="text"
                          name="labName"
                          placeholder="Lab Name"
                          value={labOrderForm.labName}
                          onChange={(e) => setLabOrderForm({ ...labOrderForm, labName: e.target.value })}
                          style={{ fontSize: '14px', height: '38px' }}
                        />
                      </div>
                    </div>

                    {/* Second Row: Description and Plus Button */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ flex: '1' }}>
                        <Input
                          type="textarea"
                          name="description"
                          placeholder="Description"
                          rows="2"
                          value={labOrderForm.description}
                          onChange={(e) => setLabOrderForm({ ...labOrderForm, description: e.target.value })}
                          style={{ fontSize: '14px', resize: 'none' }}
                        />
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={async () => {
                          if (!patientAppId) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Patient appointment ID is missing.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          if (!labOrderForm.patientLabTestId) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Please select a test name.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          if (!labOrderForm.testDate) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Please select a test date.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          try {
                            const auth = JSON.parse(sessionStorage.getItem('authUser'));
                            const userId = auth?.userId || auth?.user?.userId || auth?.user?.id || 0;
                            const currentDateTime = new Date().toISOString();

                            const requestData = {
                              patientOrderedTestId: 0,
                              patientId: patientId ? parseInt(patientId) : 0,
                              patientLabTestId: labOrderForm.patientLabTestId,
                              orderDate: currentDateTime,
                              labName: labOrderForm.labName || '',
                              userId: userId,
                              // appointmentId: patientAppId ? parseInt(patientAppId) : 0
                            };

                            await dispatch(savePatientLabOrder(requestData));

                            const selectedTest = labTestOptions?.find(
                              (opt) => opt.value === labOrderForm.patientLabTestId
                            );
                            setSessionLabOrderList((prev) => [
                              ...prev,
                              {
                                patientOrderedTestId: `session-order-${Date.now()}`,
                                patientLabTestId: labOrderForm.patientLabTestId,
                                patientLabTestName: selectedTest?.label || 'N/A',
                                orderDate: labOrderForm.testDate || currentDateTime,
                                labName: labOrderForm.labName || '',
                                description: labOrderForm.description || '',
                              },
                            ]);

                            Swal.fire({
                              icon: 'success',
                              title: 'Success',
                              text: 'Lab order saved successfully!',
                              confirmButtonColor: '#000000',
                              timer: 2000,
                              showConfirmButton: false
                            });

                            // Clear form
                            setLabOrderForm({
                              patientLabTestId: null,
                              testDate: '',
                              labName: '',
                              description: ''
                            });
                          } catch (error) {
                            console.error('Error saving lab order:', error);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: 'Failed to save lab order. Please try again.',
                              confirmButtonColor: '#000000'
                            });
                          }
                        }}
                        disabled={patientLabOrderLoading}
                        style={{ minWidth: '40px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {patientLabOrderLoading ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <i className="ri-add-line" style={{ fontSize: '18px' }}></i>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Table - Scrollable Only */}
                  <div className="custom-scrollbar" style={{ flex: '1', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="table table-bordered table-sm" style={{ fontSize: '12px', marginBottom: '0' }}>
                      <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center', padding: '6px 8px', fontSize: '12px' }}>No.</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Test Name</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Test Date</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Lab Name</th>
                          {/* <th style={{ width: '50px', textAlign: 'center', padding: '6px 4px', fontSize: '12px' }}>Action</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {patientLabOrderLoading ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Saving lab order...
                            </td>
                          </tr>
                        ) : sessionLabOrderList.length > 0 ? (
                          sessionLabOrderList.map((order, index) => (
                            <tr key={order.patientOrderedTestId || index}>
                              <td style={{ textAlign: 'center', padding: '4px 8px' }}>{index + 1}</td>
                              <td style={{ padding: '4px 8px' }}>{order.patientLabTestName || 'N/A'}</td>
                              <td style={{ padding: '4px 8px' }}>
                                {order.orderDate ? (
                                  Number.isNaN(new Date(order.orderDate).getTime())
                                    ? String(order.orderDate)
                                    : new Date(order.orderDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      }).replace(/\//g, '-')
                                ) : 'N/A'}
                              </td>
                              <td style={{ padding: '4px 8px' }}>{order.labName || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                              No lab orders added
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {labsImagingTab === 'Labs & Imaging Results' && (
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', flex: '1', overflow: 'hidden' }}>
                  {/* Form Rows - Always Visible */}
                  <div style={{ flexShrink: 0 }}>
                    {/* First Row: Test Name, Test Date, Parameter Name, Parameter Value */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ flex: '1' }}>
                        <Select
                          isSearchable
                          isClearable
                          placeholder="Test Name"
                          options={labTestOptions}
                          isLoading={patientLabTestDDLLoading}
                          value={labEntryForm.patientLabTestId ? labTestOptions?.find(opt => opt.value === labEntryForm.patientLabTestId) : null}
                          onChange={(selected) => setLabEntryForm({ ...labEntryForm, patientLabTestId: selected?.value || null })}
                          {...modalSelectPortalProps}
                          styles={{
                            control: (base) => ({
                              ...base,
                              fontSize: '14px',
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: MODAL_SELECT_MENU_Z }),
                          }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <Input
                          type="date"
                          name="testDate"
                          value={labEntryForm.testDate}
                          onChange={(e) => setLabEntryForm({ ...labEntryForm, testDate: e.target.value })}
                          style={{ fontSize: '14px', height: '38px' }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <Input
                          type="text"
                          name="parameterName"
                          placeholder="Parameter Name"
                          value={labEntryForm.parameterName}
                          onChange={(e) => setLabEntryForm({ ...labEntryForm, parameterName: e.target.value })}
                          style={{ fontSize: '14px', height: '38px' }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <Input
                          type="text"
                          name="parameterValue"
                          placeholder="Parameter Value"
                          value={labEntryForm.parameterValue}
                          onChange={(e) => setLabEntryForm({ ...labEntryForm, parameterValue: e.target.value })}
                          style={{ fontSize: '14px', height: '38px' }}
                        />
                      </div>
                    </div>

                    {/* Second Row: Test Description and Plus Button */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ flex: '1' }}>
                        <Input
                          type="textarea"
                          name="testDescription"
                          placeholder="Test Description"
                          rows="2"
                          value={labEntryForm.testDescription}
                          onChange={(e) => setLabEntryForm({ ...labEntryForm, testDescription: e.target.value })}
                          style={{ fontSize: '14px', resize: 'none' }}
                        />
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={async () => {
                          if (!patientAppId) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Patient appointment ID is missing.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          if (!labEntryForm.patientLabTestId) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Please select a test name.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          if (!labEntryForm.testDate) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Please select a test date.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          if (!labEntryForm.parameterName || !labEntryForm.parameterValue) {
                            Swal.fire({
                              icon: 'warning',
                              title: 'Warning',
                              text: 'Please enter both parameter name and value.',
                              confirmButtonColor: '#000000'
                            });
                            return;
                          }

                          try {
                            const auth = JSON.parse(sessionStorage.getItem('authUser'));
                            const userId = auth?.userId || auth?.user?.userId || auth?.user?.id || 0;
                            const currentDateTime = new Date().toISOString();

                            const requestData = {
                              // patientLabId: 0,
                              patientId: patientId ? parseInt(patientId) : 0,
                              patientLabTestId: labEntryForm.patientLabTestId,
                              labDate: currentDateTime,
                              parameterName: labEntryForm.parameterName,
                              parameterValue: labEntryForm.parameterValue,
                              enteredBy: userId,
                              //appointmentId: patientAppId ? parseInt(patientAppId) : 0
                            };

                            await dispatch(savePatientLabEntry(requestData));

                            const selectedTest = labTestOptions?.find(
                              (opt) => opt.value === labEntryForm.patientLabTestId
                            );
                            setSessionLabEntryList((prev) => [
                              ...prev,
                              {
                                patientLabId: `session-entry-${Date.now()}`,
                                patientLabTestId: labEntryForm.patientLabTestId,
                                patientLabTestName: selectedTest?.label || 'N/A',
                                labDate: labEntryForm.testDate || currentDateTime,
                                parameterName: labEntryForm.parameterName,
                                parameterValue: labEntryForm.parameterValue,
                                testDescription: labEntryForm.testDescription || '',
                              },
                            ]);

                            Swal.fire({
                              icon: 'success',
                              title: 'Success',
                              text: 'Lab entry saved successfully!',
                              confirmButtonColor: '#000000',
                              timer: 2000,
                              showConfirmButton: false
                            });

                            // Clear form
                            setLabEntryForm({
                              patientLabTestId: null,
                              testDate: '',
                              parameterName: '',
                              parameterValue: '',
                              testDescription: ''
                            });
                          } catch (error) {
                            console.error('Error saving lab entry:', error);
                            Swal.fire({
                              icon: 'error',
                              title: 'Error',
                              text: 'Failed to save lab entry. Please try again.',
                              confirmButtonColor: '#000000'
                            });
                          }
                        }}
                        disabled={patientLabEntryLoading}
                        style={{ minWidth: '40px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {patientLabEntryLoading ? (
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <i className="ri-add-line" style={{ fontSize: '18px' }}></i>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Table - Scrollable Only */}
                  <div className="custom-scrollbar" style={{ flex: '1', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="table table-bordered table-sm" style={{ fontSize: '12px', marginBottom: '0' }}>
                      <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center', padding: '6px 8px', fontSize: '12px' }}>No.</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Test Name</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Test Date</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Parameter Name</th>
                          <th style={{ padding: '6px 8px', fontSize: '12px' }}>Parameter Value</th>
                          {/* <th style={{ width: '50px', textAlign: 'center', padding: '6px 4px', fontSize: '12px' }}>Action</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {patientLabEntryLoading ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Saving lab entry...
                            </td>
                          </tr>
                        ) : sessionLabEntryList.length > 0 ? (
                          sessionLabEntryList.map((entry, index) => (
                            <tr key={entry.patientLabId || index}>
                              <td style={{ textAlign: 'center', padding: '4px 8px' }}>{index + 1}</td>
                              <td style={{ padding: '4px 8px' }}>{entry.patientLabTestName || 'N/A'}</td>
                              <td style={{ padding: '4px 8px' }}>
                                {entry.labDate ? (
                                  Number.isNaN(new Date(entry.labDate).getTime())
                                    ? String(entry.labDate)
                                    : new Date(entry.labDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      }).replace(/\//g, '-')
                                ) : 'N/A'}
                              </td>
                              <td style={{ padding: '4px 8px' }}>{entry.parameterName || 'N/A'}</td>
                              <td style={{ padding: '4px 8px' }}>{entry.parameterValue || 'N/A'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                              No lab entries added
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {prescriptionTab === 'History Notes' && (
            <div className="pb-prescription-modal__panel">
              {/* Editor - Full Width */}
              <div className="pb-prescription-modal__history">
                <Editor
                  wrapperClassName="demo-wrapper"
                  editorClassName="demo-editor"
                  editorState={historyNoteContent}
                  onEditorStateChange={(editorState) => {
                    setHistoryNoteContent(editorState);
                  }}
                  toolbarClassName="toolbar-class"
                  wrapperStyle={{
                    borderRadius: 12,
                    borderWidth: 0,
                    borderColor: 'transparent',
                    height: '100%'
                  }}
                  editorStyle={{
                    borderRadius: 0,
                    border: 'none',
                    borderTop: '1px solid #eef2f6',
                    backgroundColor: '#FFFFFF',
                    minHeight: '400px',
                    padding: '12px 14px'
                  }}
                  placeholder="History Note Details"
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-content-end pb-prescription-modal__footer">
          <ModalActionButton
            action="cancel"
            onClick={() => setPrescriptionModalOpen(false)}
          />
          <ModalActionButton
            action="save"
            onClick={async () => {
            try {
              // Check if prescription table has at least one item
              if (prescriptionRemedyDetailList.length === 0) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Warning',
                  text: 'Please add at least one prescription item before saving.',
                  confirmButtonColor: '#000000'
                });
                return;
              }

              if (!patientAppId) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Warning',
                  text: 'Patient appointment ID is missing. Please navigate from the patient list.',
                  confirmButtonColor: '#000000'
                });
                return;
              }

              // Call both APIs in a single click
              const promises = [];

              // 1. Save Prescription Detail
              const prescriptionRubricDetailList = repertorizationRubrics.map(rubric => ({
                rubricId: rubric.rubricId || rubric.subsectionId || rubric.subSectionId,
                intensityId: rubric.intensityNo || 0,
                remedyCount: rubric.remedyCount || 0
              }));

              const remedyDetailList = prescriptionRemedyDetailList.map(item => ({
                remedyId: item.remedyId,
                description: item.description,
                dose: item.dose || ''
              }));

              const prescriptionRequestData = {
                prescriptionRubricDetailList: prescriptionRubricDetailList,
                prescriptionRemedyDetailList: remedyDetailList,
                appointmentId: parseInt(patientAppId)
              };

              promises.push(dispatch(savePrescriptionDetail(prescriptionRequestData)));

              // 2. Save History Note (if content exists)
              const htmlContent = draftToHtml(convertToRaw(historyNoteContent.getCurrentContent()));
              if (htmlContent && htmlContent.trim() !== '' && htmlContent !== '<p></p>') {
                const htmlContentWithNewline = htmlContent + '\n';
                const historyRequestData = {
                  historyId: 0,
                  appointmentId: String(patientAppId),
                  historyNote: htmlContentWithNewline
                };
                promises.push(dispatch(saveUpdateAppointmentHistoryNote(historyRequestData)));
              }

              // Wait for all API calls to complete
              await Promise.all(promises);

              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Data saved successfully!',
                confirmButtonColor: '#000000',
                timer: 2000,
                showConfirmButton: false
              });

              const completedPatientKey = buildPatientBoardKey({ patientId, caseId, patientAppId });
              if (completedPatientKey) {
                skipPatientSessionPersistRef.current = true;
                dispatch(completePatientBoardSession(completedPatientKey));
              }

              // Clear the forms after successful save
              setPrescriptionRemedyDetailList([]);
              setSelectedPrescriptionRemedy(null);
              setPrescriptionRemedyDescription('');
              setSessionLabOrderList([]);
              setSessionLabEntryList([]);
              const contentState = ContentState.createFromText('');
              setHistoryNoteContent(EditorState.createWithContent(contentState));
              setPrescriptionModalOpen(false);
            } catch (error) {
              console.error('Error saving:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save. Please try again.',
                confirmButtonColor: '#000000'
              });
            }
          }}
            disabled={appointmentHistoryNoteLoading || prescriptionTab === 'Labs & Imaging'}
            loading={appointmentHistoryNoteLoading}
            loadingLabel="Saving..."
          />
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default PatientBoard;


