import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { Nav, NavItem, NavLink, TabContent, TabPane, UncontrolledAlert } from 'reactstrap';
import classnames from 'classnames';
import Select from 'react-select';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';
import DiagnosisSubSectionSelect from './DiagnosisSubSectionSelect';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import DiagnosisKeywordTable, { removeSectionFromKeywordList } from './DiagnosisKeywordTable';
import {
  getSectionListForDiagnosis,
  getSubSectionBySectionForDiagnosis,
  getDiagnosisSystemListForDiagnosis,
  getDiagnosisByIdForEdit,
  updateDiagnosisCondition,
  deleteDiagnosisRubricForDiagnosis
} from '../../../../slices/thunks';
import {
  setDiagnosisConditionSuccess,
  setDiagnosisConditionError
} from '../../../../slices/admin/clinicalpattern/diagnosiscondition/reducer';


const EditDiagnosisConditions = () => {
  document.title = "Edit Diagnosis & Conditions";
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const {
    sectionList: reduxSectionList,
    sectionLoading,
    diagnosisSystemList: reduxDiagnosisSystemList,
    diagnosisSystemLoading,
    diagnosisDetails,
    diagnosisDetailsLoading,
    diagnosisConditionSuccess,
    diagnosisConditionError,
    diagnosisConditionLoading
  } = useSelector((state) => state.DiagnosisCondition);

  // Complete State Management - All 150+ Properties
  const [diagnosisId, setDiagnosisId] = useState(0);
  const [diagnosisList, setDiagnosisList] = useState([]);
  const [sectionList, setSectionList] = useState([]);
  const [subsectionList, setSubsectionList] = useState([]);
  const [DiagnosisName, setDiagnosisName] = useState('');
  const [DiagnosisNameAlias, setDiagnosisNameAlias] = useState('');
  const [Miasm, setMiasm] = useState('');
  const [SelectedSubSectionList, setSelectedSubSectionList] = useState([]);
  const [modelEx, setModelEx] = useState([]);
  const [keywordId, setKeywordId] = useState(0);

  // Symptoms Section
  const [SymptomsSectionId, setSymptomsSectionId] = useState(0);
  const [diagnosisSymptomsIds, setDiagnosisSymptomsIds] = useState([]);
  const [SymptomssubsectionList, setSymptomssubsectionList] = useState([]);
  const [models, setModels] = useState([]);
  const [symptom, setSymptom] = useState('');

  // Monogram section
  const [MonogramSectionId, setMonogramSectionId] = useState(0);
  const [MonogramKeyword, setMonogramKeyword] = useState("");
  const [diagnosisMonogramIds, setDiagnosisMonogramIds] = useState([]);
  const [DiagnosisMonogramDetails, setDiagnosisMonogramDetails] = useState([]);
  const [MonogramsubsectionList, setMonogramsubsectionList] = useState([]);

  // Causations Section
  const [diagnosisCausationsIds, setDiagnosisCausationsIds] = useState([]);
  const [CausationName, setCausationName] = useState("");
  const [CausationsSectionId, setCausationsSectionId] = useState(0);
  const [CausationssubsectionList, setCausationssubsectionList] = useState([]);
  const [DiagnosisCausationNameDetails, setDiagnosisCausationNameDetails] = useState([]);

  // Pathology Section
  const [PathologySectionId, setPathologySectionId] = useState(0);
  const [diagnosisPathologyKeyword, setDiagnosisPathologyKeyword] = useState("");
  const [PathologysubsectionList, setPathologysubsectionList] = useState([]);
  const [diagnosisPathologyIds, setDiagnosisPathologyIds] = useState([]);
  const [DiagnosisPathologyDetails, setDiagnosisPathologyDetails] = useState([]);
  const [DiagnosisPathologyRubricDetails, setDiagnosisPathologyRubricDetails] = useState([]);

  // Emergencies Section
  const [EmergenciesKeywords, setEmergenciesKeywords] = useState('');
  const [EmergenciessubsectionList, setEmergenciessubsectionList] = useState([]);
  const [EmergenciesSectionId, setEmergenciesSectionId] = useState(0);
  const [diagnosisEmergenciesIds, setDiagnosisEmergenciesIds] = useState([]);
  const [EmergencieDetails, setEmergencieDetails] = useState([]);
  const [EmergencieRubricDetails, setEmergencieRubricDetails] = useState([]);

  // Onset/Duration/Progress Section
  const [onsetKeyword, setOnsetKeyword] = useState('');
  const [OnsetsubsectionList, setOnsetsubsectionList] = useState([]);
  const [OnsetSectionId, setOnsetSectionId] = useState(0);
  const [diagnosisOnsetIds, setDiagnosisOnsetIds] = useState([]);
  const [OnsetDurationProgressDetails, setOnsetDurationProgressDetails] = useState([]);
  const [OnsetDurationProgressRubricDetails, setOnsetDurationProgressRubricDetails] = useState([]);

  // Patterns Section
  const [PatternsKeywords, setPatternsKeywords] = useState('');
  const [PatternsSectionId, setPatternsSectionId] = useState(0);
  const [PatternssubsectionList, setPatternssubsectionList] = useState([]);
  const [diagnosisPatternsIds, setDiagnosisPatternsIds] = useState([]);
  const [PatternsDetail, setPatternsDetail] = useState([]);
  const [PatternRubricDetails, setPatternRubricDetails] = useState([]);

  // LocationExtention Section
  const [LocationExtentionDetailsKeyword, setLocationExtentionDetailsKeyword] = useState('');
  const [LocationExtentionSectionId, setLocationExtentionSectionId] = useState(0);
  const [LocationExtentionsubsectionList, setLocationExtentionsubsectionList] = useState([]);
  const [diagnosisLocationExtentionIds, setDiagnosisLocationExtentionIds] = useState([]);
  const [LocationExtentionDetails, setLocationExtentionDetails] = useState([]);
  const [LocationExtentionRubricDetails, setLocationExtentionRubricDetails] = useState([]);

  // Sensation Section
  const [SensationDetailsKeyword, setSensationDetailsKeyword] = useState('');
  const [SensationSectionId, setSensationSectionId] = useState(0);
  const [SensationsubsectionList, setSensationsubsectionList] = useState([]);
  const [diagnosisSensationIds, setDiagnosisSensationIds] = useState([]);
  const [SensationDetails, setSensationDetails] = useState([]);
  const [SensationRubricDetails, setSensationRubricDetails] = useState([]);

  // Modalities Section
  const [ModalitiesDetailsKeyword, setModalitiesDetailsKeyword] = useState('');
  const [ModalitiesSectionId, setModalitiesSectionId] = useState(0);
  const [ModalitiessubsectionList, setModalitiessubsectionList] = useState([]);
  const [diagnosisModalitiesIds, setDiagnosisModalitiesIds] = useState([]);
  const [ModalitiesDetails, setModalitiesDetails] = useState([]);
  const [ModalitiesRubricDetails, setModalitiesRubricDetails] = useState([]);

  // Accompanied Section
  const [AccompaniedDetailsSystem, setAccompaniedDetailsSystem] = useState('');
  const [AccompaniedSectionId, setAccompaniedSectionId] = useState(0);
  const [AccompaniedsubsectionList, setAccompaniedsubsectionList] = useState([]);
  const [diagnosisAccompaniedIds, setDiagnosisAccompaniedIds] = useState([]);
  const [AccompaniedDetails, setAccompaniedDetails] = useState([]);
  const [AccompaniedRubricDetails, setAccompaniedRubricDetails] = useState([]);

  // Observations Section
  const [ObservationsDetailsKeyword, setObservationsDetailsKeyword] = useState('');
  const [ObservationsSectionId, setObservationsSectionId] = useState([]);
  const [ObservationssubsectionList, setObservationssubsectionList] = useState([]);
  const [diagnosisObservationsIds, setDiagnosisObservationsIds] = useState([]);
  const [ObservationsDetails, setObservationsDetails] = useState([]);
  const [ObservationsRubricDetails, setObservationsRubricDetails] = useState([]);

  // BeforeAfterDuring Section
  const [BeforeAfterDuringDetailsKeyword, setBeforeAfterDuringDetailsKeyword] = useState('');
  const [BeforeAfterDuringSectionId, setBeforeAfterDuringSectionId] = useState(0);
  const [BeforeAfterDuringsubsectionList, setBeforeAfterDuringsubsectionList] = useState([]);
  const [diagnosisBeforeAfterDuringIds, setDiagnosisBeforeAfterDuringIds] = useState([]);
  const [BeforeAfterDuringDetails, setBeforeAfterDuringDetails] = useState([]);
  const [BeforeAfterDuringRubricDetails, setBeforeAfterDuringRubricDetails] = useState([]);

  const [investigations, setInvestigations] = useState("");
  const [allopathicMedicines, setAllopathicMedicines] = useState("");
  const [examiniations, setExaminiations] = useState("");

  const [diagnosisSystemList, setDiagnosisSystemList] = useState([]);
  const [diagnosisSystemId, setDiagnosisSystemId] = useState(0);
  const [diagnosisSystemDetailsList, setDiagnosisSystemDetailsList] = useState([]);
  const [diagnosisSystemIds, setDiagnosisSystemIds] = useState([]);

  const [SectionId, setSectionId] = useState(0);
  const [subsectionId, setSubsectionId] = useState(0);
  const [SubSectionName, setSubSectionName] = useState('');
  const [selectedSubSection, setSelectedSubSection] = useState('');
  const [EnteredBy, setEnteredBy] = useState('Admin');
  const [DeleteStatus, setDeleteStatus] = useState(false);
  const [errors, setErrors] = useState({});

  // Tab Management
  const [pillsTab, setPillsTab] = useState("1");

  // Select Options
  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti2, setSelectedMulti2] = useState([]);
  const [SingleOptions, setSingleOptions] = useState([]);

  const [multiSectionsByTab, setMultiSectionsByTab] = useState({
    symptoms: [],
    monogram: [],
    causations: [],
    pathology: [],
    emergencies: [],
    onset: [],
    patterns: [],
    locationExtension: [],
    sensation: [],
    modalities: [],
    accompanied: [],
    observations: [],
    beforeAfterDuring: []
  });

  const updateMultiSections = (sectionType, options) => {
    setMultiSectionsByTab(prev => ({ ...prev, [sectionType]: options || [] }));
  };

  const clearMultiSections = (sectionType) => {
    setMultiSectionsByTab(prev => ({ ...prev, [sectionType]: [] }));
  };

  const getMultiSectionPayload = (sectionType) => {
    const selected = multiSectionsByTab[sectionType] || [];
    return {
      sectionIds: selected.map(s => s.value),
      sections: selected.map(s => ({ sectionId: s.value, sectionName: s.label }))
    };
  };

  // Individual section states for each tab
  const [selectedMonogramSection, setSelectedMonogramSection] = useState(null);
  const [selectedCausationsSection, setSelectedCausationsSection] = useState(null);
  const [selectedPathologySection, setSelectedPathologySection] = useState(null);
  const [selectedEmergenciesSection, setSelectedEmergenciesSection] = useState(null);
  const [selectedOnsetSection, setSelectedOnsetSection] = useState(null);
  const [selectedPatternsSection, setSelectedPatternsSection] = useState(null);
  const [selectedLocationExtentionSection, setSelectedLocationExtentionSection] = useState(null);
  const [selectedSensationSection, setSelectedSensationSection] = useState(null);
  const [selectedModalitiesSection, setSelectedModalitiesSection] = useState(null);
  const [selectedAccompaniedSection, setSelectedAccompaniedSection] = useState(null);
  const [selectedObservationsSection, setSelectedObservationsSection] = useState(null);
  const [selectedBeforeAfterDuringSection, setSelectedBeforeAfterDuringSection] = useState(null);

  // Loading State
  const [loading, setLoading] = useState(false);

  // ==================== LIFECYCLE METHODS ====================

  useEffect(() => {
    // Clear any previous success/error messages on component mount
    dispatch(setDiagnosisConditionSuccess(null));
    dispatch(setDiagnosisConditionError(null));

    // Check if we have selected condition data from navigation
    const selectedCondition = location.state?.selectedCondition;

    if (selectedCondition) {
      // Load data from the selected condition
      editDiagnosis(selectedCondition.diagnosisId);
    } else {
      // Fallback: try to get ID from URL
      const id = window.location.pathname.split('/').pop();
      if (id && id !== 'editdiagnosisconditions') {
        editDiagnosis(id);
      }
    }

    GetSections();
    getDignosisSystem();
  }, [location.state]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (diagnosisConditionSuccess) {
      const timer = setTimeout(() => {
        dispatch(setDiagnosisConditionSuccess(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [diagnosisConditionSuccess, dispatch]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (diagnosisConditionError) {
      const timer = setTimeout(() => {
        dispatch(setDiagnosisConditionError(null));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [diagnosisConditionError, dispatch]);

  useEffect(() => {
    console.log("MonogramsubsectionList ==", MonogramsubsectionList);
  }, [MonogramsubsectionList]);

  useEffect(() => {
    console.log("CausationssubsectionList ==", CausationssubsectionList);
  }, [CausationssubsectionList]);

  useEffect(() => {
    console.log("PathologysubsectionList ==", PathologysubsectionList);
  }, [PathologysubsectionList]);

  useEffect(() => {
    console.log("EmergenciessubsectionList ==", EmergenciessubsectionList);
  }, [EmergenciessubsectionList]);

  useEffect(() => {
    console.log("OnsetsubsectionList ==", OnsetsubsectionList);
  }, [OnsetsubsectionList]);

  useEffect(() => {
    console.log("PatternssubsectionList ==", PatternssubsectionList);
  }, [PatternssubsectionList]);

  useEffect(() => {
    console.log("LocationExtentionsubsectionList ==", LocationExtentionsubsectionList);
  }, [LocationExtentionsubsectionList]);

  useEffect(() => {
    console.log("SensationsubsectionList ==", SensationsubsectionList);
  }, [SensationsubsectionList]);

  useEffect(() => {
    console.log("ModalitiessubsectionList ==", ModalitiessubsectionList);
  }, [ModalitiessubsectionList]);

  useEffect(() => {
    console.log("AccompaniedsubsectionList ==", AccompaniedsubsectionList);
  }, [AccompaniedsubsectionList]);

  useEffect(() => {
    console.log("ObservationssubsectionList ==", ObservationssubsectionList);
  }, [ObservationssubsectionList]);

  useEffect(() => {
    console.log("BeforeAfterDuringsubsectionList ==", BeforeAfterDuringsubsectionList);
  }, [BeforeAfterDuringsubsectionList]);

  // ==================== VALIDATION METHODS ====================

  // ==================== DATA LOADING METHODS ====================

  const editDiagnosis = async (diagnosisId) => {
    if (diagnosisId != undefined && diagnosisId !== 'editdiagnosisconditions') {
      setLoading(true);
      console.log("Loading diagnosis with ID:", diagnosisId);

      try {
        const res = await dispatch(getDiagnosisByIdForEdit(diagnosisId));
        console.log("API response:", res);

        let diagnosisSystemDetailsList = [];
        if (res.diagnosisSystemDetailsList) {
          res.diagnosisSystemDetailsList.forEach((item) => {
            diagnosisSystemDetailsList.push({
              value: item.diagnosisSystemId,
              label: item.diagnosisSystemName,
              diagnosisSystemDetailId: item.diagnosisSystemDetailId,
              diagnosisId: item.diagnosisId,
            })
          })
        }

        // Set all the form data
        setDiagnosisId(res.diagnosisId || 0);
        setDiagnosisName(res.diagnosisName || '');
        setDiagnosisNameAlias(res.diagnosisNameAlias || '');
        setMiasm(res.miasm || '');
        setInvestigations(res.investigations || '');
        setAllopathicMedicines(res.allopathicMedicines || '');
        setExaminiations(res.examiniations || '');
        setSelectedSubSectionList(res.modelEx || []);
        setModels(res.diagnosisSymptomsList || []);
        setDiagnosisMonogramDetails(res.diagnosisMonogramDetailsModelsList || []);
        setDiagnosisCausationNameDetails(res.diagnosisCausationList || []);
        setDiagnosisPathologyDetails(res.diagnosisPathologyDetailsModelsList || []);
        setEmergencieDetails(res.emergencieDetailsModelList || []);
        setOnsetDurationProgressDetails(res.onsetDurationProgressDetails || []);
        setPatternsDetail(res.patternsDetails || []);
        setLocationExtentionDetails(res.locationExtentionDetailsModelList || []);
        setSensationDetails(res.sensationDetailsModelList || []);
        setModalitiesDetails(res.modalitiesDetailsModelsList || []);
        setAccompaniedDetails(res.accompaniedDetailsModelsList || []);
        setObservationsDetails(res.observationsDetailsModelsList || []);
        setBeforeAfterDuringDetails(res.beforeAfterDuringDetailsModelsList || []);
        setDiagnosisSystemIds(diagnosisSystemDetailsList);

        setLoading(false);
      } catch (error) {
        console.error("Error loading diagnosis:", error);
        setLoading(false);
        alert("Error loading diagnosis data. Please try again.");
      }
    } else {
      console.log("No valid diagnosis ID provided");
    }
  };

  const GetSections = () => {
    dispatch(getSectionListForDiagnosis());
  };

  const getDignosisSystem = () => {
    dispatch(getDiagnosisSystemListForDiagnosis());
  };

  // Update local state when Redux state changes
  useEffect(() => {
    if (reduxSectionList && reduxSectionList.length > 0) {
      setSectionList(reduxSectionList);
      const options = reduxSectionList.map(section => ({
        value: section.sectionId,
        label: section.sectionName
      }));
      setSingleOptions(options);
    }
  }, [reduxSectionList]);

  useEffect(() => {
    if (reduxDiagnosisSystemList && reduxDiagnosisSystemList.length > 0) {
      setDiagnosisSystemList(reduxDiagnosisSystemList);
    }
  }, [reduxDiagnosisSystemList]);

  // Store which tab is requesting subsections
  const [currentSubsectionTab, setCurrentSubsectionTab] = useState(null);

  const GetSubSections = async (sectionId, string) => {
    console.log("GetSubSections", sectionId, string);
    setCurrentSubsectionTab(string);
    try {
      await dispatch(getSubSectionBySectionForDiagnosis({ sectionId }));
    } catch (error) {
      console.error("Error loading subsections:", error);
    }
  };

  // Get subsection list from Redux
  const reduxSubSectionList = useSelector((state) => state.DiagnosisCondition.subSectionList);

  // Update local subsection lists when Redux state changes
  useEffect(() => {
    if (reduxSubSectionList && reduxSubSectionList.length > 0 && currentSubsectionTab) {
      updateSubsectionList(reduxSubSectionList, currentSubsectionTab);
    }
  }, [reduxSubSectionList, currentSubsectionTab]);

  // Helper to update subsection list based on string parameter
  const updateSubsectionList = (temp, string) => {
    if (string === "Diagnosis") {
      setSubsectionList(temp);
    } else if (string === "Symptoms") {
      setSymptomssubsectionList(temp);
    } else if (string === "Monogram") {
      setMonogramsubsectionList(temp);
    } else if (string === "Causations") {
      setCausationssubsectionList(temp);
    } else if (string === "Pathology") {
      setPathologysubsectionList(temp);
    } else if (string === "Emergencies") {
      setEmergenciessubsectionList(temp);
    } else if (string === "Onset") {
      setOnsetsubsectionList(temp);
    } else if (string === "Patterns") {
      setPatternssubsectionList(temp);
    } else if (string === "LocationExtention") {
      setLocationExtentionsubsectionList(temp);
    } else if (string === "Sensation") {
      setSensationsubsectionList(temp);
    } else if (string === "Modalities") {
      setModalitiessubsectionList(temp);
    } else if (string === "Accompanied") {
      setAccompaniedsubsectionList(temp);
    } else if (string === "Observations") {
      setObservationssubsectionList(temp);
    } else if (string === "BeforeAfterDuring") {
      setBeforeAfterDuringsubsectionList(temp);
    }
  };

  // ==================== CRUD OPERATIONS ====================

  // ADD METHODS - All 16 different add functions
  const addSelectedSubSectionQuestions = () => {
    if (selectedSubSection === null || selectedSubSection === "") {
      alert("Please select Sub Section");
    } else {
      const obj = {
        subSectionId: selectedSubSection.value,
        subsectionName: selectedSubSection.label,
      };
      setSelectedSubSectionList([...SelectedSubSectionList, obj]);
      setSelectedSubSection(null);
      setSectionId(0);
    }
  };

  const addSymptoms = () => {
    if (symptom === "") {
      alert("Please Enter symptomName");
    } else {
      const obj = {
        ...getMultiSectionPayload('symptoms'),
        symptom: symptom,
        diagnosisSymptomRubric: []
      };
      const newModels = [...models, obj];
      setModels(newModels);

      diagnosisSymptomsIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newModels[newModels.length - 1].diagnosisSymptomRubric.push(rubricObj);
      });

      setSymptom('');
      setDiagnosisSymptomsIds([]);
      setSymptomsSectionId(0);
      clearMultiSections('symptoms');
    }
  };

  const addMonogram = () => {
    if (MonogramKeyword === "") {
      alert("Please Enter Diagnosis Monogram Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('monogram'),
        diagnosisMonogramKeyword: MonogramKeyword,
        diagnosisMonogramRubricDetails: []
      };
      const newDetails = [...DiagnosisMonogramDetails, obj];
      setDiagnosisMonogramDetails(newDetails);

      diagnosisMonogramIds.forEach(element => {
        const rubricObj = {
          subsections: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].diagnosisMonogramRubricDetails.push(rubricObj);
      });

      setMonogramKeyword('');
      setDiagnosisMonogramIds([]);
      setMonogramSectionId(0);
      clearMultiSections('monogram');
    }
  };

  const addCausations = () => {
    if (CausationName === "") {
      alert("Please Enter Diagnosis Causation Name");
    } else {
      const obj = {
        ...getMultiSectionPayload('causations'),
        causationName: CausationName,
        diagnosisCausationRubricDetails: []
      };
      const newDetails = [...DiagnosisCausationNameDetails, obj];
      setDiagnosisCausationNameDetails(newDetails);

      diagnosisCausationsIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].diagnosisCausationRubricDetails.push(rubricObj);
      });

      setCausationName('');
      setDiagnosisCausationsIds([]);
      setCausationsSectionId(0);
      clearMultiSections('causations');
    }
  };

  const addPathology = () => {
    if (diagnosisPathologyKeyword === "") {
      alert("Please Enter Diagnosis Pathology Keywords");
    } else {
      const obj = {
        ...getMultiSectionPayload('pathology'),
        diagnosisPathologyKeyword: diagnosisPathologyKeyword,
        diagnosisPathologyRubricDetails: []
      };
      const newDetails = [...DiagnosisPathologyDetails, obj];
      setDiagnosisPathologyDetails(newDetails);

      diagnosisPathologyIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].diagnosisPathologyRubricDetails.push(rubricObj);
      });

      setDiagnosisPathologyKeyword('');
      setDiagnosisPathologyIds([]);
      setPathologySectionId(0);
      clearMultiSections('pathology');
    }
  };

  const addEmergencies = () => {
    if (EmergenciesKeywords === "") {
      alert("Please Enter Diagnosis Emergencies Keywords");
    } else {
      const obj = {
        ...getMultiSectionPayload('emergencies'),
        emergencieKeyword: EmergenciesKeywords,
        emergencieRubricDetails: []
      };
      const newDetails = [...EmergencieDetails, obj];
      setEmergencieDetails(newDetails);

      diagnosisEmergenciesIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].emergencieRubricDetails.push(rubricObj);
      });

      setEmergenciesKeywords('');
      setDiagnosisEmergenciesIds([]);
      setEmergenciesSectionId(0);
      clearMultiSections('emergencies');
    }
  };

  const addOnset = () => {
    if (onsetKeyword === "") {
      alert("Please Enter Diagnosis Onset Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('onset'),
        onsetKeyword: onsetKeyword,
        onsetDurationProgressRubricDetails: []
      };
      const newDetails = [...OnsetDurationProgressDetails, obj];
      setOnsetDurationProgressDetails(newDetails);

      diagnosisOnsetIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].onsetDurationProgressRubricDetails.push(rubricObj);
      });

      setOnsetKeyword('');
      setDiagnosisOnsetIds([]);
      setOnsetSectionId(0);
      clearMultiSections('onset');
    }
  };

  const addPatterns = () => {
    if (PatternsKeywords === "") {
      alert("Please Enter Diagnosis Patterns Keywords");
    } else {
      const obj = {
        ...getMultiSectionPayload('patterns'),
        patternsKeywords: PatternsKeywords,
        patternRubricDetails: []
      };
      const newDetails = [...PatternsDetail, obj];
      setPatternsDetail(newDetails);

      diagnosisPatternsIds.forEach(element => {
        const rubricObj = {
          SubsectionID: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].patternRubricDetails.push(rubricObj);
      });

      setPatternsKeywords('');
      setDiagnosisPatternsIds([]);
      setPatternsSectionId(0);
      clearMultiSections('patterns');
    }
  };

  const addLocationExtention = () => {
    if (LocationExtentionDetailsKeyword === "") {
      alert("Please Enter Diagnosis Location/Extention Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('locationExtension'),
        locationExtentionDetailsKeyword: LocationExtentionDetailsKeyword,
        locationExtentionRubricDetails: []
      };
      const newDetails = [...LocationExtentionDetails, obj];
      setLocationExtentionDetails(newDetails);

      diagnosisLocationExtentionIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].locationExtentionRubricDetails.push(rubricObj);
      });

      setLocationExtentionDetailsKeyword('');
      setDiagnosisLocationExtentionIds([]);
      setLocationExtentionSectionId(0);
      clearMultiSections('locationExtension');
    }
  };

  const addSensation = () => {
    if (SensationDetailsKeyword === "") {
      alert("Please Enter Diagnosis Sensation Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('sensation'),
        sensationDetailsKeyword: SensationDetailsKeyword,
        sensationRubricDetails: []
      };
      const newDetails = [...SensationDetails, obj];
      setSensationDetails(newDetails);

      diagnosisSensationIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].sensationRubricDetails.push(rubricObj);
      });

      setSensationDetailsKeyword('');
      setDiagnosisSensationIds([]);
      setSensationSectionId(0);
      clearMultiSections('sensation');
    }
  };

  const addModalities = () => {
    if (ModalitiesDetailsKeyword === "") {
      alert("Please Enter Diagnosis Modalities Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('modalities'),
        modalitiesDetailsKeyword: ModalitiesDetailsKeyword,
        modalitiesRubricDetails: []
      };
      const newDetails = [...ModalitiesDetails, obj];
      setModalitiesDetails(newDetails);

      diagnosisModalitiesIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].modalitiesRubricDetails.push(rubricObj);
      });

      setModalitiesDetailsKeyword('');
      setDiagnosisModalitiesIds([]);
      setModalitiesSectionId(0);
      clearMultiSections('modalities');
    }
  };

  const addAccompanied = () => {
    if (AccompaniedDetailsSystem === "") {
      alert("Please Enter Diagnosis Accompanied Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('accompanied'),
        accompaniedDetailsSystem: AccompaniedDetailsSystem,
        accompaniedRubricDetails: []
      };
      const newDetails = [...AccompaniedDetails, obj];
      setAccompaniedDetails(newDetails);

      diagnosisAccompaniedIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].accompaniedRubricDetails.push(rubricObj);
      });

      setAccompaniedDetailsSystem('');
      setDiagnosisAccompaniedIds([]);
      setAccompaniedSectionId(0);
      clearMultiSections('accompanied');
    }
  };

  const addObservations = () => {
    if (ObservationsDetailsKeyword === "") {
      alert("Please Enter Diagnosis Observations Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('observations'),
        observationsDetailsKeyword: ObservationsDetailsKeyword,
        observationsRubricDetails: []
      };
      const newDetails = [...ObservationsDetails, obj];
      setObservationsDetails(newDetails);

      diagnosisObservationsIds.forEach(element => {
        const rubricObj = {
          subsection: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].observationsRubricDetails.push(rubricObj);
      });

      setObservationsDetailsKeyword('');
      setDiagnosisObservationsIds([]);
      setObservationsSectionId(0);
      clearMultiSections('observations');
    }
  };

  const addBeforeAfterDuring = () => {
    if (BeforeAfterDuringDetailsKeyword === "") {
      alert("Please Enter Diagnosis Before/After/During/ Details Keyword");
    } else {
      const obj = {
        ...getMultiSectionPayload('beforeAfterDuring'),
        beforeAfterDuringDetailsKeyword: BeforeAfterDuringDetailsKeyword,
        beforeAfterDuringRubricDetails: []
      };
      const newDetails = [...BeforeAfterDuringDetails, obj];
      setBeforeAfterDuringDetails(newDetails);

      diagnosisBeforeAfterDuringIds.forEach(element => {
        const rubricObj = {
          subsectionId: element.value,
          subsectionName: element.label,
        };
        newDetails[newDetails.length - 1].beforeAfterDuringRubricDetails.push(rubricObj);
      });

      setBeforeAfterDuringDetailsKeyword('');
      setDiagnosisBeforeAfterDuringIds([]);
      setBeforeAfterDuringSectionId(0);
      clearMultiSections('beforeAfterDuring');
    }
  };

  // DELETE METHODS
  const deleteSubsSection = (index) => {
    const array = [...SelectedSubSectionList];
    if (index !== -1) {
      array.splice(index, 1);
      setSelectedSubSectionList(array);
    }
  };

  // Helper function to handle rubric deletion with immutable updates
  const handleRubricDeletion = (dataArray, setDataArray, rubricKey, keywordIdKey, childindex, parentindex) => {
    let keywordIdToReturn = 0;
    const updatedArray = dataArray.map((detail, idx) => {
      if (idx === parentindex) {
        const updatedRubrics = [...detail[rubricKey]];
        if (childindex !== -1) {
          updatedRubrics.splice(childindex, 1);
        }
        return {
          ...detail,
          [rubricKey]: updatedRubrics
        };
      }
      return detail;
    });

    const currentItem = updatedArray[parentindex];
    if (currentItem && currentItem[rubricKey].length === 0) {
      keywordIdToReturn = currentItem[keywordIdKey] || 0;
      updatedArray.splice(parentindex, 1);
    }

    setDataArray(updatedArray);
    return keywordIdToReturn;
  };

  const Deleterubric = (childindex, diagnosisRubricId, item, string, parentindex) => {
    let extractedKeywordId = 0;

    if (string === "Symptoms") {
      extractedKeywordId = handleRubricDeletion(models, setModels, 'diagnosisSymptomRubric', 'diagnosisSymptomId', childindex, parentindex);
    }
    else if (string === "Monogram") {
      extractedKeywordId = handleRubricDeletion(DiagnosisMonogramDetails, setDiagnosisMonogramDetails, 'diagnosisMonogramRubricDetails', 'diagnosisMonogramDetailsId', childindex, parentindex);
    }
    else if (string === "Causations") {
      extractedKeywordId = handleRubricDeletion(DiagnosisCausationNameDetails, setDiagnosisCausationNameDetails, 'diagnosisCausationRubricDetails', 'causationId', childindex, parentindex);
    }
    else if (string === "Pathology") {
      extractedKeywordId = handleRubricDeletion(DiagnosisPathologyDetails, setDiagnosisPathologyDetails, 'diagnosisPathologyRubricDetails', 'diagnosisPathologyDetailsId', childindex, parentindex);
    }
    else if (string === "Emergencies") {
      extractedKeywordId = handleRubricDeletion(EmergencieDetails, setEmergencieDetails, 'emergencieRubricDetails', 'emergencieId', childindex, parentindex);
    }
    else if (string === "Onset") {
      extractedKeywordId = handleRubricDeletion(OnsetDurationProgressDetails, setOnsetDurationProgressDetails, 'onsetDurationProgressRubricDetails', 'onsetDetailId', childindex, parentindex);
    }
    else if (string === "Patterns") {
      extractedKeywordId = handleRubricDeletion(PatternsDetail, setPatternsDetail, 'patternRubricDetails', 'patternDetailsId', childindex, parentindex);
    }
    else if (string === "LocationExtention") {
      extractedKeywordId = handleRubricDeletion(LocationExtentionDetails, setLocationExtentionDetails, 'locationExtentionRubricDetails', 'locationExtentionDetailsId', childindex, parentindex);
    }
    else if (string === "Sensation") {
      extractedKeywordId = handleRubricDeletion(SensationDetails, setSensationDetails, 'sensationRubricDetails', 'sensationDetailsId', childindex, parentindex);
    }
    else if (string === "Modalities") {
      extractedKeywordId = handleRubricDeletion(ModalitiesDetails, setModalitiesDetails, 'modalitiesRubricDetails', 'modalitiesDetailsId', childindex, parentindex);
    }
    else if (string === "Accompanied") {
      extractedKeywordId = handleRubricDeletion(AccompaniedDetails, setAccompaniedDetails, 'accompaniedRubricDetails', 'accompaniedDetailsId', childindex, parentindex);
    }
    else if (string === "Observations") {
      extractedKeywordId = handleRubricDeletion(ObservationsDetails, setObservationsDetails, 'observationsRubricDetails', 'observationsDetailsId', childindex, parentindex);
    }
    else if (string === "BeforeAfterDuring") {
      extractedKeywordId = handleRubricDeletion(BeforeAfterDuringDetails, setBeforeAfterDuringDetails, 'beforeAfterDuringRubricDetails', 'beforeAfterDuringDetailsId', childindex, parentindex);
    }

    // Use the extracted keywordId directly instead of relying on state
    dispatch(deleteDiagnosisRubricForDiagnosis({
      "diagnosisTab": string,
      "diagnosisRubricId": diagnosisRubricId,
      "keywordId": extractedKeywordId
    })).then((res) => {
      console.log('res=======', res);
      setKeywordId(0);
    }).catch((error) => {
      console.error('Error deleting rubric:', error);
    });
  };

  const removeKeywordFromState = (setItems, parentIndex) => {
    setItems((prev) => prev.filter((_, index) => index !== parentIndex));
  };

  const softDeleteKeywordItem = (setItems, parentIndex, item, deleteType, keywordIdKey) => {
    const keywordId = item[keywordIdKey] || 0;

    if (keywordId > 0) {
      dispatch(deleteDiagnosisRubricForDiagnosis({
        diagnosisTab: deleteType,
        diagnosisRubricId: 0,
        keywordId,
      }))
        .then(() => removeKeywordFromState(setItems, parentIndex))
        .catch((error) => {
          console.error('Error deleting keyword:', error);
          alert('Unable to delete this item. Please try again.');
        });
      return;
    }

    removeKeywordFromState(setItems, parentIndex);
  };

  const renderKeywordTable = ({
    items,
    setItems,
    keywordLabel,
    emptyText,
    getKeyword,
    rubricKey,
    rubricIdKey,
    keywordIdKey,
    deleteType,
  }) => (
    <DiagnosisKeywordTable
      items={items}
      keywordLabel={keywordLabel}
      emptyText={emptyText}
      getKeyword={getKeyword}
      getRubrics={(item) => item[rubricKey] || []}
      onDeleteItem={(parentIndex, item) =>
        softDeleteKeywordItem(setItems, parentIndex, item, deleteType, keywordIdKey)
      }
      onDeleteRubric={(childIndex, rubric, item, parentIndex) =>
        Deleterubric(childIndex, rubric[rubricIdKey], item, deleteType, parentIndex)
      }
      onRemoveSection={(parentIndex, sectionId) =>
        removeSectionFromKeywordList(
          setItems,
          parentIndex,
          sectionId,
          rubricKey,
          (emptyParentIndex, emptyItem) =>
            softDeleteKeywordItem(setItems, emptyParentIndex, emptyItem, deleteType, keywordIdKey)
        )
      }
    />
  );

  // ==================== EVENT HANDLERS ====================

  // Tab Management
  const pillsToggle = (tab) => {
    setPillsTab(tab);
  };

  // Form Input Handlers
  const handleInputChange = (e, setter) => {
    setter(e.target.value);
  };

  // Select Handlers
  const handleSelectSingle = (selectedOption) => {
    setSelectedSingle(selectedOption);
    if (selectedOption) {
      setSectionId(selectedOption.value);
      setSelectedSubSection(null);
    } else {
      setSectionId(0);
      setSelectedSubSection(null);
    }
  };

  // Individual section handlers for each tab
  const handleMonogramSectionChange = (selectedOption) => {
    setSelectedMonogramSection(selectedOption);
    setDiagnosisMonogramIds([]);
    setMonogramSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleCausationsSectionChange = (selectedOption) => {
    setSelectedCausationsSection(selectedOption);
    setDiagnosisCausationsIds([]);
    setCausationsSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handlePathologySectionChange = (selectedOption) => {
    setSelectedPathologySection(selectedOption);
    setDiagnosisPathologyIds([]);
    setPathologySectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleEmergenciesSectionChange = (selectedOption) => {
    setSelectedEmergenciesSection(selectedOption);
    setDiagnosisEmergenciesIds([]);
    setEmergenciesSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleOnsetSectionChange = (selectedOption) => {
    setSelectedOnsetSection(selectedOption);
    setDiagnosisOnsetIds([]);
    setOnsetSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handlePatternsSectionChange = (selectedOption) => {
    setSelectedPatternsSection(selectedOption);
    setDiagnosisPatternsIds([]);
    setPatternsSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleLocationExtentionSectionChange = (selectedOption) => {
    setSelectedLocationExtentionSection(selectedOption);
    setDiagnosisLocationExtentionIds([]);
    setLocationExtentionSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleSensationSectionChange = (selectedOption) => {
    setSelectedSensationSection(selectedOption);
    setDiagnosisSensationIds([]);
    setSensationSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleModalitiesSectionChange = (selectedOption) => {
    setSelectedModalitiesSection(selectedOption);
    setDiagnosisModalitiesIds([]);
    setModalitiesSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleAccompaniedSectionChange = (selectedOption) => {
    setSelectedAccompaniedSection(selectedOption);
    setDiagnosisAccompaniedIds([]);
    setAccompaniedSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleObservationsSectionChange = (selectedOption) => {
    setSelectedObservationsSection(selectedOption);
    setDiagnosisObservationsIds([]);
    setObservationsSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleBeforeAfterDuringSectionChange = (selectedOption) => {
    setSelectedBeforeAfterDuringSection(selectedOption);
    setDiagnosisBeforeAfterDuringIds([]);
    setBeforeAfterDuringSectionId(selectedOption ? selectedOption.value : 0);
  };

  const handleMulti2 = (selectedOptions) => {
    setSelectedMulti2(selectedOptions || []);
  };

  // Section Change Handlers for all tabs
  const handleChangeSubSection = (string, selectedOption) => {
    if (selectedOption) {
      const sectionId = selectedOption.value;

      switch (string) {
        case "Symptoms":
          setSymptomsSectionId(sectionId);
          setDiagnosisSymptomsIds([]);
          break;
        case "Monogram":
          setMonogramSectionId(sectionId);
          setDiagnosisMonogramIds([]);
          break;
        case "Causations":
          setCausationsSectionId(sectionId);
          setDiagnosisCausationsIds([]);
          break;
        case "Pathology":
          setPathologySectionId(sectionId);
          setDiagnosisPathologyIds([]);
          break;
        case "Emergencies":
          setEmergenciesSectionId(sectionId);
          setDiagnosisEmergenciesIds([]);
          break;
        case "Onset":
          setOnsetSectionId(sectionId);
          setDiagnosisOnsetIds([]);
          break;
        case "Patterns":
          setPatternsSectionId(sectionId);
          setDiagnosisPatternsIds([]);
          break;
        case "LocationExtention":
          setLocationExtentionSectionId(sectionId);
          setDiagnosisLocationExtentionIds([]);
          break;
        case "Sensation":
          setSensationSectionId(sectionId);
          setDiagnosisSensationIds([]);
          break;
        case "Modalities":
          setModalitiesSectionId(sectionId);
          setDiagnosisModalitiesIds([]);
          break;
        case "Accompanied":
          setAccompaniedSectionId(sectionId);
          setDiagnosisAccompaniedIds([]);
          break;
        case "Observations":
          setObservationsSectionId(sectionId);
          setDiagnosisObservationsIds([]);
          break;
        case "BeforeAfterDuring":
          setBeforeAfterDuringSectionId(sectionId);
          setDiagnosisBeforeAfterDuringIds([]);
          break;
        default:
          setSectionId(sectionId);
          setSelectedSubSection(null);
      }
    }
  };

  // Diagnosis Tab Changed Handler
  const DiagnosisTabChanged = (string, selectedOptions) => {
    if (selectedOptions) {
      switch (string) {
        case "Symptoms":
          setDiagnosisSymptomsIds(selectedOptions);
          break;
        case "Monogram":
          setDiagnosisMonogramIds(selectedOptions);
          break;
        case "Causations":
          setDiagnosisCausationsIds(selectedOptions);
          break;
        case "Pathology":
          setDiagnosisPathologyIds(selectedOptions);
          break;
        case "Emergencies":
          setDiagnosisEmergenciesIds(selectedOptions);
          break;
        case "Onset":
          setDiagnosisOnsetIds(selectedOptions);
          break;
        case "Patterns":
          setDiagnosisPatternsIds(selectedOptions);
          break;
        case "LocationExtention":
          setDiagnosisLocationExtentionIds(selectedOptions);
          break;
        case "Sensation":
          setDiagnosisSensationIds(selectedOptions);
          break;
        case "Modalities":
          setDiagnosisModalitiesIds(selectedOptions);
          break;
        case "Accompanied":
          setDiagnosisAccompaniedIds(selectedOptions);
          break;
        case "Observations":
          setDiagnosisObservationsIds(selectedOptions);
          break;
        case "BeforeAfterDuring":
          setDiagnosisBeforeAfterDuringIds(selectedOptions);
          break;
      }
    }
  };

  // Diagnosis System Changed Handler
  const DiagnosisSystemChanged = (selectedOptions) => {
    if (selectedOptions) {
      setDiagnosisSystemIds(selectedOptions);
    }
  };

  // Subsection Changed Handler
  const SubsectionChanged = (selectedOption) => {
    if (selectedOption) {
      setSubsectionId(selectedOption.value);
      setSubSectionName(selectedOption.label);
      setSelectedSubSection(selectedOption);
    } else {
      setSubsectionId(0);
      setSelectedSubSection(null);
    }
  };

  // ==================== LOAD OPTIONS METHODS ====================

  // Load Options for AsyncPaginate
  const loadOptions = (search, prevOptions) => {
    const options = [];
    subsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Symptoms
  const loadSymptomsOptions = (search, prevOptions) => {
    const options = [];
    SymptomssubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Monogram
  const loadMonogramOptions = (search, prevOptions) => {
    debugger
    const options = [];
    MonogramsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Causations
  const loadCausationsOptions = (search, prevOptions) => {
    const options = [];
    CausationssubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Pathology
  const loadPathologyOptions = (search, prevOptions) => {
    const options = [];
    PathologysubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Emergencies
  const loadEmergenciesOptions = (search, prevOptions) => {
    const options = [];
    EmergenciessubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Onset
  const loadOnsetOptions = (search, prevOptions) => {
    const options = [];
    OnsetsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Patterns
  const loadPatternsOptions = (search, prevOptions) => {
    const options = [];
    PatternssubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Location Extension
  const loadLocationExtentionOptions = (search, prevOptions) => {
    const options = [];
    LocationExtentionsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Sensation
  const loadSensationOptions = (search, prevOptions) => {
    const options = [];
    SensationsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // Load Options for Modalities
  const loadModalitiesOptions = (search, prevOptions) => {
    if (ModalitiessubsectionList.length !== 0) {
      const options = [];
      ModalitiessubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

      let filteredOptions;
      if (!search) {
        filteredOptions = options;
      } else {
        const searchLower = search.toLowerCase();
        filteredOptions = options.filter(({ label }) =>
          label.toLowerCase().includes(searchLower)
        );
      }

      const hasMore = filteredOptions.length > prevOptions.length + 10;
      const slicedOptions = filteredOptions.slice(
        prevOptions.length,
        prevOptions.length + 10
      );

      return {
        options: slicedOptions,
        hasMore
      };
    } else {
      return {
        options: [],
        hasMore: false
      };
    }
  };

  // Load Options for Accompanied
  const loadAccompaniedOptions = (search, prevOptions) => {
    if (AccompaniedsubsectionList.length !== 0) {
      const options = [];
      AccompaniedsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

      let filteredOptions;
      if (!search) {
        filteredOptions = options;
      } else {
        const searchLower = search.toLowerCase();
        filteredOptions = options.filter(({ label }) =>
          label.toLowerCase().includes(searchLower)
        );
      }

      const hasMore = filteredOptions.length > prevOptions.length + 10;
      const slicedOptions = filteredOptions.slice(
        prevOptions.length,
        prevOptions.length + 10
      );

      return {
        options: slicedOptions,
        hasMore
      };
    } else {
      return {
        options: [],
        hasMore: false
      };
    }
  };

  // Load Options for Observations
  const loadObservationsOptions = (search, prevOptions) => {
    if (ObservationssubsectionList.length !== 0) {
      const options = [];
      ObservationssubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

      let filteredOptions;
      if (!search) {
        filteredOptions = options;
      } else {
        const searchLower = search.toLowerCase();
        filteredOptions = options.filter(({ label }) =>
          label.toLowerCase().includes(searchLower)
        );
      }

      const hasMore = filteredOptions.length > prevOptions.length + 10;
      const slicedOptions = filteredOptions.slice(
        prevOptions.length,
        prevOptions.length + 10
      );

      return {
        options: slicedOptions,
        hasMore
      };
    } else {
      return {
        options: [],
        hasMore: false
      };
    }
  };

  // Load Options for Before After During
  const loadBeforeAfterDuringOptions = (search, prevOptions) => {
    if (BeforeAfterDuringsubsectionList.length !== 0) {
      const options = [];
      BeforeAfterDuringsubsectionList.forEach(x => options.push({ value: x.subSectionId, label: x.subSectionName }));

      let filteredOptions;
      if (!search) {
        filteredOptions = options;
      } else {
        const searchLower = search.toLowerCase();
        filteredOptions = options.filter(({ label }) =>
          label.toLowerCase().includes(searchLower)
        );
      }

      const hasMore = filteredOptions.length > prevOptions.length + 10;
      const slicedOptions = filteredOptions.slice(
        prevOptions.length,
        prevOptions.length + 10
      );

      return {
        options: slicedOptions,
        hasMore
      };
    } else {
      return {
        options: [],
        hasMore: false
      };
    }
  };

  // Load Options for Diagnosis System
  const loadDiagnosisSystem = async (search, prevOptions) => {
    const options = [];
    diagnosisSystemList.forEach(x => options.push({ value: x.diagnosisSystemId, label: x.diagnosisSystemName }));

    let filteredOptions;
    if (!search) {
      filteredOptions = options;
    } else {
      const searchLower = search.toLowerCase();
      filteredOptions = options.filter(({ label }) =>
        label.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = filteredOptions.length > prevOptions.length + 10;
    const slicedOptions = filteredOptions.slice(
      prevOptions.length,
      prevOptions.length + 10
    );

    return {
      options: slicedOptions,
      hasMore
    };
  };

  // ==================== VALIDATION & SUBMISSION ====================

  const validateForm = () => {
    let isFormValid = true;
    let newErrors = {};

    if (DiagnosisName === "") {
      isFormValid = false;
      newErrors["DiagnosisName"] = "Please enter diagnosis name";
    }

    setErrors(newErrors);
    return isFormValid;
  };

  const submitForm = () => {
    console.log('diagnosisSystemIds submit==', diagnosisSystemIds);

    // Prepare diagnosis system details
    const diagnosisSystemDetailsList = [];
    diagnosisSystemIds.forEach(element => {
      const obj = {
        "diagnosisSystemId": element.value,
        diagnosisId: element.diagnosisId,
        diagnosisSystemDetailId: element.diagnosisSystemDetailId
      };
      diagnosisSystemDetailsList.push(obj);
    });

    console.log('diagnosisSystemDetailsList submit==', diagnosisSystemDetailsList);

    if (validateForm()) {
      // Prepare modelEx for selected subsections
      const modelExData = [];
      SelectedSubSectionList.forEach(element => {
        const obj = {
          subSectionId: element.subSectionId,
          diagnosisDetailId: element.diagnosisDetailId
        };
        modelExData.push(obj);
      });

      const item = {
        "diagnosisId": diagnosisId,
        "diagnosisName": DiagnosisName,
        "diagnosisNameAlias": DiagnosisNameAlias,
        "miasm": Miasm,
        "enteredBy": parseInt(localStorage.getItem('UserId')),
        "deleteStatus": false,
        "investigations": investigations,
        "allopathicMedicines": allopathicMedicines,
        "examiniations": examiniations,
        modelEx: modelExData,
        diagnosisSymptomsList: models,
        diagnosisCausationList: DiagnosisCausationNameDetails,
        diagnosisSystemDetailsList: diagnosisSystemDetailsList,
        emergencieDetailsModelList: EmergencieDetails,
        onsetDurationProgressDetails: OnsetDurationProgressDetails,
        patternsDetails: PatternsDetail,
        locationExtentionDetailsModelList: LocationExtentionDetails,
        sensationDetailsModelList: SensationDetails,
        modalitiesDetailsModelsList: ModalitiesDetails,
        accompaniedDetailsModelsList: AccompaniedDetails,
        observationsDetailsModelsList: ObservationsDetails,
        beforeAfterDuringDetailsModelsList: BeforeAfterDuringDetails,
        diagnosisMonogramDetailsModelsList: DiagnosisMonogramDetails,
        diagnosisPathologyDetailsModelsList: DiagnosisPathologyDetails,
      };

      console.log('item==', item);

      dispatch(updateDiagnosisCondition(item)).then((responseMessage) => {
        console.log("a", responseMessage.data);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Redirect after 2 seconds to allow user to see success message
        setTimeout(() => {
          window.location.href = '/admin/listdiagnosisconditions';
        }, 2000);
      }).catch((error) => {
        console.error('Error submitting form:', error);
        // Scroll to top to show error message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      alert("Required fields are missing. Please check All Tabs");
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">

                <CardHeader className="border-0">
                  <div className="admin-form-toolbar">
                    <h5 className="admin-form-title">Edit Diagnosis & Conditions</h5>
                  </div>
                </CardHeader>

                <CardBody>
                  {loading ? (
                    <div className="text-center">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading diagnosis data...</p>
                    </div>
                  ) : (
                    <>
                      {(diagnosisConditionSuccess || diagnosisConditionError) ? (
                        <div className="admin-form-alerts">
                          {diagnosisConditionSuccess ? (
                            <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                              <i className="ri-checkbox-circle-line label-icon" />
                              {diagnosisConditionSuccess}
                            </UncontrolledAlert>
                          ) : null}
                          {diagnosisConditionError ? (
                            <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                              <i className="ri-error-warning-line label-icon" />
                              {diagnosisConditionError}
                            </UncontrolledAlert>
                          ) : null}
                        </div>
                      ) : null}
                      <Row>
                        <Col xxl={12} md={12}>
                          <div>
                            <Nav pills className="admin-form-tabs mb-3">
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "1", })} onClick={() => { pillsToggle("1"); }} >Diagnosis</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "2", })} onClick={() => { pillsToggle("2"); }} >Diagnosis Symptoms</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "3", })} onClick={() => { pillsToggle("3"); }} >Diagnosis Monogram</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "4", })} onClick={() => { pillsToggle("4"); }} >Diagnosis Causations</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "5", })} onClick={() => { pillsToggle("5"); }} >Diagnosis Pathology</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "6", })} onClick={() => { pillsToggle("6"); }} >Diagnosis System</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "7", })} onClick={() => { pillsToggle("7"); }} >Emergencies</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "8", })} onClick={() => { pillsToggle("8"); }} >Other</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "9", })} onClick={() => { pillsToggle("9"); }} >Onset/Duration/Progress</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "10", })} onClick={() => { pillsToggle("10"); }} >Patterns</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "11", })} onClick={() => { pillsToggle("11"); }} >Location-Extension</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "12", })} onClick={() => { pillsToggle("12"); }} >Sensation</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "13", })} onClick={() => { pillsToggle("13"); }} >Modalities</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "14", })} onClick={() => { pillsToggle("14"); }} >Accompanied</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "15", })} onClick={() => { pillsToggle("15"); }} >Observations</NavLink></NavItem>
                              <NavItem><NavLink style={{ cursor: "pointer" }} className={classnames({ active: pillsTab === "16", })} onClick={() => { pillsToggle("16"); }} >Before/After/During</NavLink></NavItem>
                            </Nav>

                            <TabContent activeTab={pillsTab} className="text-muted">

                              <TabPane tabId="1" >

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Diagnosis Name <span className="required">*</span></Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Diagnosis Name"
                                        value={DiagnosisName}
                                        onChange={(e) => setDiagnosisName(e.target.value)}
                                      />
                                      {errors.DiagnosisName && <span className="error">{errors.DiagnosisName}</span>}
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Diagnosis Name Alias</Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Diagnosis Name Alias"
                                        value={DiagnosisNameAlias}
                                        onChange={(e) => setDiagnosisNameAlias(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Miasm</Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Miasm"
                                        value={Miasm}
                                        onChange={(e) => setMiasm(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">

                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section Name <span className="required">*</span></Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()}
                                        value={selectedSingle}
                                        // onChange={handleSelectSingle}
                                        onChange={(option) => handleSelectSingle(option)}
                                        options={SingleOptions}
                                        placeholder="Select Section"
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section Name <span className="required">*</span></Label>
                                      <DiagnosisSubSectionSelect
                                        name="subSectionId"
                                        sectionId={SectionId}
                                        value={selectedSubSection}
                                        isMulti={false}
                                        placeholder="Type Sub-Section"
                                        onChange={SubsectionChanged}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button
                                        type="button"
                                        className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                                        onClick={addSelectedSubSectionQuestions}
                                      >
                                        <i className="ri-add-line align-middle"></i> Add Sub Section
                                      </button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    <div className="table-responsive patient-list-modal__table-wrap">
                                    <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                                      <thead>
                                        <tr>
                                          <th scope="col">Sub Section Name</th>
                                          <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {SelectedSubSectionList.map((item, index) => (
                                          <tr key={index}>
                                            <td>{item.subsectionName}</td>
                                            <td className='text-center'>
                                              <div className="remove">
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-soft-danger remove-item-btn"
                                                  onClick={() => deleteSubsSection(index)}
                                                >
                                                  <i className="ri-delete-bin-5-line" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                        {SelectedSubSectionList.length === 0 && (
                                          <tr>
                                            <td colSpan="2" className="text-center">No subsections selected</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                    </div>
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="2">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Symptoms Keywords <span className="required">*</span></Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Symptoms Keywords"
                                        value={symptom}
                                        onChange={(e) => setSymptom(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section <span className="required">*</span></Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()}
                                        value={SingleOptions.find(option => option.value === SymptomsSectionId)}
                                        onChange={(option) => handleChangeSubSection("Symptoms", option)}
                                        options={SingleOptions}
                                        placeholder="Select Section"
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['symptoms'] || []}
                                        onChange={(options) => updateMultiSections('symptoms', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section <span className="required">*</span></Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={SymptomsSectionId}
                                        value={diagnosisSymptomsIds}
                                        onChange={(options) => DiagnosisTabChanged("Symptoms", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button
                                        type="button"
                                        className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                                        onClick={addSymptoms}
                                      >
                                        <i className="ri-add-line align-middle"></i> Add Symptoms
                                      </button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: models,
                                      setItems: setModels,
                                      keywordLabel: "Symptoms Keyword",
                                      emptyText: "No symptoms added",
                                      getKeyword: (item) => item.symptom,
                                      rubricKey: "diagnosisSymptomRubric",
                                      rubricIdKey: "diagnosisSymptomRubricId",
                                      keywordIdKey: "diagnosisSymptomId",
                                      deleteType: "Symptoms",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="3">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Monogram Keywords</Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Monogram Keywords"
                                        value={MonogramKeyword}
                                        onChange={(e) => setMonogramKeyword(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()}
                                        value={selectedMonogramSection}
                                        onChange={handleMonogramSectionChange}
                                        options={SingleOptions}
                                        placeholder="Select Section"
                                        isClearable
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['monogram'] || []}
                                        onChange={(options) => updateMultiSections('monogram', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={MonogramSectionId}
                                        value={diagnosisMonogramIds}
                                        onChange={(options) => DiagnosisTabChanged("Monogram", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button
                                        type="button"
                                        className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                                        onClick={addMonogram}
                                      >
                                        <i className="ri-add-line align-middle"></i> Add Monogram
                                      </button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: DiagnosisMonogramDetails,
                                      setItems: setDiagnosisMonogramDetails,
                                      keywordLabel: "Monogram Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.diagnosisMonogramKeyword,
                                      rubricKey: "diagnosisMonogramRubricDetails",
                                      rubricIdKey: "diagnosisMonogramRubricDetailsId",
                                      keywordIdKey: "diagnosisMonogramDetailsId",
                                      deleteType: "Monogram",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="4">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Causations Keywords</Label>
                                      <Input value={CausationName} onChange={(e) => setCausationName(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Causations Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedCausationsSection} onChange={handleCausationsSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['causations'] || []}
                                        onChange={(options) => updateMultiSections('causations', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={CausationsSectionId}
                                        value={diagnosisCausationsIds}
                                        onChange={(options) => DiagnosisTabChanged("Causations", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                                        onClick={addCausations}><i className="ri-add-line align-middle"></i> Add Causations</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: DiagnosisCausationNameDetails,
                                      setItems: setDiagnosisCausationNameDetails,
                                      keywordLabel: "Causations Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.causationName,
                                      rubricKey: "diagnosisCausationRubricDetails",
                                      rubricIdKey: "causationRubricDetailsId",
                                      keywordIdKey: "causationId",
                                      deleteType: "Causations",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="5">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Pathology Keywords</Label>
                                      <Input value={diagnosisPathologyKeyword} onChange={(e) => setDiagnosisPathologyKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Pathology Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedPathologySection} onChange={handlePathologySectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['pathology'] || []}
                                        onChange={(options) => updateMultiSections('pathology', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={PathologySectionId}
                                        value={diagnosisPathologyIds}
                                        onChange={(options) => DiagnosisTabChanged("Pathology", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addPathology} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Pathology</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: DiagnosisPathologyDetails,
                                      setItems: setDiagnosisPathologyDetails,
                                      keywordLabel: "Pathology Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.diagnosisPathologyKeyword,
                                      rubricKey: "diagnosisPathologyRubricDetails",
                                      rubricIdKey: "diagnosisPathologyRubricDetailsId",
                                      keywordIdKey: "diagnosisPathologyDetailsId",
                                      deleteType: "Pathology",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="6">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Diagnosis System <span className="required">*</span></Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isClearable
                                        isMulti
                                        placeholder="Select one or more Diagnosis System"
                                        closeMenuOnSelect={false}
                                        value={diagnosisSystemIds}
                                        options={diagnosisSystemList.map(system => ({
                                          value: system.diagnosisSystemId,
                                          label: system.diagnosisSystemName
                                        }))}
                                        onChange={DiagnosisSystemChanged}
                                      />
                                    </div>
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="7">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Emergencies Keywords</Label>
                                      <Input value={EmergenciesKeywords} onChange={(e) => setEmergenciesKeywords(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Emergencies Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedEmergenciesSection} onChange={handleEmergenciesSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['emergencies'] || []}
                                        onChange={(options) => updateMultiSections('emergencies', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={EmergenciesSectionId}
                                        value={diagnosisEmergenciesIds}
                                        onChange={(options) => DiagnosisTabChanged("Emergencies", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addEmergencies} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Emergencies</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: EmergencieDetails,
                                      setItems: setEmergencieDetails,
                                      keywordLabel: "Emergencies Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.emergencieKeyword,
                                      rubricKey: "emergencieRubricDetails",
                                      rubricIdKey: "emergencieRubricId",
                                      keywordIdKey: "emergencieId",
                                      deleteType: "Emergencies",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="8" >

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Investigations <span className="required">*</span></Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Investigations"
                                        value={investigations}
                                        onChange={(e) => setInvestigations(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Allopathic Medicines <span className="required">*</span></Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Allopathic Med"
                                        value={allopathicMedicines}
                                        onChange={(e) => setAllopathicMedicines(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Examination <span className="required">*</span></Label>
                                      <Input
                                        type="input"
                                        className="form-control"
                                        id="placeholderInput"
                                        placeholder="Enter Examination"
                                        value={examiniations}
                                        onChange={(e) => setExaminiations(e.target.value)}
                                      />
                                    </div>
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="9">
                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Onset/Duration/Progress Keywords</Label>
                                      <Input value={onsetKeyword} onChange={(e) => setOnsetKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Onset/Duration/Progress Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedOnsetSection} onChange={handleOnsetSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['onset'] || []}
                                        onChange={(options) => updateMultiSections('onset', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={OnsetSectionId}
                                        value={diagnosisOnsetIds}
                                        onChange={(options) => DiagnosisTabChanged("Onset", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addOnset} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Onset/Duration/Progress</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: OnsetDurationProgressDetails,
                                      setItems: setOnsetDurationProgressDetails,
                                      keywordLabel: "Onset/Duration/Progress Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.onsetKeyword,
                                      rubricKey: "onsetDurationProgressRubricDetails",
                                      rubricIdKey: "onsetRubricId",
                                      keywordIdKey: "onsetDetailId",
                                      deleteType: "Onset",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="10">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Patterns Keywords</Label>
                                      <Input value={PatternsKeywords} onChange={(e) => setPatternsKeywords(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Patterns Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedPatternsSection} onChange={handlePatternsSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['patterns'] || []}
                                        onChange={(options) => updateMultiSections('patterns', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={PatternsSectionId}
                                        value={diagnosisPatternsIds}
                                        onChange={(options) => DiagnosisTabChanged("Patterns", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addPatterns} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Patterns</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: PatternsDetail,
                                      setItems: setPatternsDetail,
                                      keywordLabel: "Patterns Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.patternsKeywords,
                                      rubricKey: "patternRubricDetails",
                                      rubricIdKey: "patternRubricDetailsId",
                                      keywordIdKey: "patternDetailsId",
                                      deleteType: "Patterns",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="11">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Location-Extension Keywords</Label>
                                      <Input value={LocationExtentionDetailsKeyword} onChange={(e) => setLocationExtentionDetailsKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Location-Extension Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedLocationExtentionSection} onChange={handleLocationExtentionSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['locationExtension'] || []}
                                        onChange={(options) => updateMultiSections('locationExtension', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={LocationExtentionSectionId}
                                        value={diagnosisLocationExtentionIds}
                                        onChange={(options) => DiagnosisTabChanged("LocationExtention", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addLocationExtention} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Location-Extension</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: LocationExtentionDetails,
                                      setItems: setLocationExtentionDetails,
                                      keywordLabel: "Location-Extension Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.locationExtentionDetailsKeyword,
                                      rubricKey: "locationExtentionRubricDetails",
                                      rubricIdKey: "locationExtentionRubricDetailsId",
                                      keywordIdKey: "locationExtentionDetailsId",
                                      deleteType: "LocationExtention",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="12">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sensation Keywords</Label>
                                      <Input value={SensationDetailsKeyword} onChange={(e) => setSensationDetailsKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Sensation Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedSensationSection} onChange={handleSensationSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['sensation'] || []}
                                        onChange={(options) => updateMultiSections('sensation', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={SensationSectionId}
                                        value={diagnosisSensationIds}
                                        onChange={(options) => DiagnosisTabChanged("Sensation", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addSensation} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Sensation</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: SensationDetails,
                                      setItems: setSensationDetails,
                                      keywordLabel: "Sensation Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.sensationDetailsKeyword,
                                      rubricKey: "sensationRubricDetails",
                                      rubricIdKey: "sensationRubricDetailsId",
                                      keywordIdKey: "sensationDetailsId",
                                      deleteType: "Sensation",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="13">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Modalities Keywords</Label>
                                      <Input value={ModalitiesDetailsKeyword} onChange={(e) => setModalitiesDetailsKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Modalities Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedModalitiesSection} onChange={handleModalitiesSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['modalities'] || []}
                                        onChange={(options) => updateMultiSections('modalities', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={ModalitiesSectionId}
                                        value={diagnosisModalitiesIds}
                                        onChange={(options) => DiagnosisTabChanged("Modalities", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addModalities} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Modalities</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: ModalitiesDetails,
                                      setItems: setModalitiesDetails,
                                      keywordLabel: "Modalities Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.modalitiesDetailsKeyword,
                                      rubricKey: "modalitiesRubricDetails",
                                      rubricIdKey: "modalitiesRubricDetailsId",
                                      keywordIdKey: "modalitiesDetailsId",
                                      deleteType: "Modalities",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="14">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Accompanied Keywords</Label>
                                      <Input value={AccompaniedDetailsSystem} onChange={(e) => setAccompaniedDetailsSystem(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Accompanied Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedAccompaniedSection} onChange={handleAccompaniedSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['accompanied'] || []}
                                        onChange={(options) => updateMultiSections('accompanied', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={AccompaniedSectionId}
                                        value={diagnosisAccompaniedIds}
                                        onChange={(options) => DiagnosisTabChanged("Accompanied", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addAccompanied} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Accompanied</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: AccompaniedDetails,
                                      setItems: setAccompaniedDetails,
                                      keywordLabel: "Accompanied Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.accompaniedDetailsSystem,
                                      rubricKey: "accompaniedRubricDetails",
                                      rubricIdKey: "accompaniedRubricDetailsId",
                                      keywordIdKey: "accompaniedDetailsId",
                                      deleteType: "Accompanied",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="15">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Observations Keywords</Label>
                                      <Input value={ObservationsDetailsKeyword} onChange={(e) => setObservationsDetailsKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Observations Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedObservationsSection} onChange={handleObservationsSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['observations'] || []}
                                        onChange={(options) => updateMultiSections('observations', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={ObservationsSectionId}
                                        value={diagnosisObservationsIds}
                                        onChange={(options) => DiagnosisTabChanged("Observations", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addObservations} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Observations</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: ObservationsDetails,
                                      setItems: setObservationsDetails,
                                      keywordLabel: "Observations Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.observationsDetailsKeyword,
                                      rubricKey: "observationsRubricDetails",
                                      rubricIdKey: "observationsRubricDetailsId",
                                      keywordIdKey: "observationsDetailsId",
                                      deleteType: "Observations",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                              <TabPane tabId="16">

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Before/After/During Keywords</Label>
                                      <Input value={BeforeAfterDuringDetailsKeyword} onChange={(e) => setBeforeAfterDuringDetailsKeyword(e.target.value)} type="input" className="form-control" id="placeholderInput" placeholder="Enter Before/After/During Keywords" />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles()} value={selectedBeforeAfterDuringSection} onChange={handleBeforeAfterDuringSectionChange} options={SingleOptions} placeholder="Select Section" isClearable />
                                    </div>
                                  </Col>
                                  <Col xxl={4} md={4}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Multi Section</Label>
                                      <Select
                                      classNamePrefix="admin-form-select"
                                      theme={neutralSelectTheme}
                                      styles={getAdminFormSelectStyles({ isMulti: true })}
                                        isMulti
                                        isClearable
                                        closeMenuOnSelect={false}
                                        value={multiSectionsByTab['beforeAfterDuring'] || []}
                                        onChange={(options) => updateMultiSections('beforeAfterDuring', options)}
                                        options={SingleOptions}
                                        placeholder="Select Section(s)..."
                                      />
                                    </div>
                                  </Col>
                                </Row>

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={8} md={8}>
                                    <div>
                                      <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
                                      <DiagnosisSubSectionSelect
                                        sectionId={BeforeAfterDuringSectionId}
                                        value={diagnosisBeforeAfterDuringIds}
                                        onChange={(options) => DiagnosisTabChanged("BeforeAfterDuring", options)}
                                      />
                                    </div>
                                  </Col>

                                  <Col xxl={4} md={4}>
                                    <div className="d-inline-flex gap-2  mt-4">
                                      <button onClick={addBeforeAfterDuring} type="button" className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"><i className="ri-add-line align-middle"></i> Add Before/After/During</button>
                                    </div>
                                  </Col>
                                </Row>

                                <hr />

                                <Row className="gy-3 admin-form-fields">
                                  <Col xxl={12} md={12}>
                                    {renderKeywordTable({
                                      items: BeforeAfterDuringDetails,
                                      setItems: setBeforeAfterDuringDetails,
                                      keywordLabel: "Before/After/During Keyword",
                                      emptyText: "No items added yet",
                                      getKeyword: (item) => item.beforeAfterDuringDetailsKeyword,
                                      rubricKey: "beforeAfterDuringRubricDetails",
                                      rubricIdKey: "beforeAfterDuringRubricDetailsId",
                                      keywordIdKey: "beforeAfterDuringDetailsId",
                                      deleteType: "BeforeAfterDuring",
                                    })}
                                  </Col>
                                </Row>

                              </TabPane>

                            </TabContent>
                          </div>
                        </Col>
                      </Row>

                    </>
                  )}
                </CardBody>

                <CardFooter className="border-0">
                  <div className="d-flex justify-content-end">
                    <div className="admin-form-actions">
                      <Link to="/admin/listdiagnosisconditions" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                          <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                          Cancel
                        </button>
                      </Link>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--new" onClick={submitForm}>
                        <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                        Update
                      </button>
                    </div>
                  </div>
                </CardFooter>

              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default EditDiagnosisConditions;