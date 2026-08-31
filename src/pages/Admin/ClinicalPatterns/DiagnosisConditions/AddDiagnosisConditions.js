import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Nav, NavItem, NavLink, TabContent, TabPane, UncontrolledAlert } from "reactstrap";
import { Card, CardHeader, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import classnames from "classnames";
import { Spinner } from 'reactstrap';
import Select from "react-select";
import DiagnosisSubSectionSelect from './DiagnosisSubSectionSelect';
import { useDispatch, useSelector } from 'react-redux';
import DiagnosisKeywordTable, { removeSectionFromKeywordList } from './DiagnosisKeywordTable';
import {
  getSectionListForDiagnosis,
  getDiagnosisSystemListForDiagnosis,
  createDiagnosisCondition
} from '../../../../slices/thunks';
import {
  setDiagnosisConditionSuccess,
  setDiagnosisConditionError
} from '../../../../slices/admin/clinicalpattern/diagnosiscondition/reducer';

const Starter = () => {
  document.title = "Add Diagnosis & Conditions";
  const dispatch = useDispatch();

  // Redux state
  const {
    sectionList: reduxSectionList,
    sectionLoading,
    diagnosisSystemList: reduxDiagnosisSystemList,
    diagnosisSystemLoading,
    diagnosisConditionSuccess,
    diagnosisConditionError,
    diagnosisConditionLoading
  } = useSelector((state) => state.DiagnosisCondition);

  // Loading state for form submission (using Redux loading state now)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pillsTab, setpillsTab] = useState("1");
  const pillsToggle = (tab) => {
    if (pillsTab !== tab) {
      setpillsTab(tab);
    }
  };

  // Basic diagnosis info
  const [diagnosisName, setDiagnosisName] = useState('');
  const [diagnosisNameAlias, setDiagnosisNameAlias] = useState('');
  const [miasm, setMiasm] = useState('');
  const [investigations, setInvestigations] = useState('');
  const [allopathicMedicines, setAllopathicMedicines] = useState('');
  const [examinations, setExaminations] = useState('');

  // Section and subsection management for main Diagnosis tab
  const [sectionList, setSectionList] = useState([]);
  const [subsectionList, setSubsectionList] = useState([]);
  const [selectedSubSectionList, setSelectedSubSectionList] = useState([]);
  const [selectedSubSection, setSelectedSubSection] = useState(null);
  const [sectionId, setSectionId] = useState(0);
  const [selectedSingle, setSelectedSingle] = useState(null);
  const [SingleOptions, setSingleOptions] = useState([]);

  // MultiSection selections per keyword tab (SectionMaster multi-select)
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

  // Diagnosis system
  const [diagnosisSystemList, setDiagnosisSystemList] = useState([]);
  const [diagnosisSystemIds, setDiagnosisSystemIds] = useState([]);

  // Symptoms Section
  const [symptom, setSymptom] = useState('');
  const [SymptomsSectionId, setSymptomsSectionId] = useState(0);
  const [diagnosisSymptomsIds, setDiagnosisSymptomsIds] = useState([]);
  const [SymptomssubsectionList, setSymptomssubsectionList] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedSymptomsSection, setSelectedSymptomsSection] = useState(null);

  // Monogram section
  const [MonogramKeyword, setMonogramKeyword] = useState('');
  const [MonogramSectionId, setMonogramSectionId] = useState(0);
  const [diagnosisMonogramIds, setDiagnosisMonogramIds] = useState([]);
  const [DiagnosisMonogramDetails, setDiagnosisMonogramDetails] = useState([]);
  const [MonogramsubsectionList, setMonogramsubsectionList] = useState([]);
  const [selectedMonogramSection, setSelectedMonogramSection] = useState(null);

  // Causations Section
  const [CausationName, setCausationName] = useState('');
  const [CausationsSectionId, setCausationsSectionId] = useState(0);
  const [diagnosisCausationsIds, setDiagnosisCausationsIds] = useState([]);
  const [CausationssubsectionList, setCausationssubsectionList] = useState([]);
  const [DiagnosisCausationNameDetails, setDiagnosisCausationNameDetails] = useState([]);
  const [selectedCausationsSection, setSelectedCausationsSection] = useState(null);

  // Pathology Section
  const [diagnosisPathologyKeyword, setDiagnosisPathologyKeyword] = useState('');
  const [PathologySectionId, setPathologySectionId] = useState(0);
  const [diagnosisPathologyIds, setDiagnosisPathologyIds] = useState([]);
  const [PathologysubsectionList, setPathologysubsectionList] = useState([]);
  const [DiagnosisPathologyDetails, setDiagnosisPathologyDetails] = useState([]);
  const [selectedPathologySection, setSelectedPathologySection] = useState(null);

  // Emergencies Section
  const [EmergenciesKeywords, setEmergenciesKeywords] = useState('');
  const [EmergenciesSectionId, setEmergenciesSectionId] = useState(0);
  const [diagnosisEmergenciesIds, setDiagnosisEmergenciesIds] = useState([]);
  const [EmergenciessubsectionList, setEmergenciessubsectionList] = useState([]);
  const [EmergencieDetails, setEmergencieDetails] = useState([]);
  const [selectedEmergenciesSection, setSelectedEmergenciesSection] = useState(null);

  // Onset/Duration/Progress Section
  const [onsetKeyword, setOnsetKeyword] = useState('');
  const [OnsetSectionId, setOnsetSectionId] = useState(0);
  const [diagnosisOnsetIds, setDiagnosisOnsetIds] = useState([]);
  const [OnsetsubsectionList, setOnsetsubsectionList] = useState([]);
  const [OnsetDurationProgressDetails, setOnsetDurationProgressDetails] = useState([]);
  const [selectedOnsetSection, setSelectedOnsetSection] = useState(null);

  // Patterns Section
  const [PatternsKeywords, setPatternsKeywords] = useState('');
  const [PatternsSectionId, setPatternsSectionId] = useState(0);
  const [diagnosisPatternsIds, setDiagnosisPatternsIds] = useState([]);
  const [PatternssubsectionList, setPatternssubsectionList] = useState([]);
  const [PatternsDetail, setPatternsDetail] = useState([]);
  const [selectedPatternsSection, setSelectedPatternsSection] = useState(null);

  // LocationExtention Section
  const [LocationExtentionDetailsKeyword, setLocationExtentionDetailsKeyword] = useState('');
  const [LocationExtentionSectionId, setLocationExtentionSectionId] = useState(0);
  const [diagnosisLocationExtentionIds, setDiagnosisLocationExtentionIds] = useState([]);
  const [LocationExtentionsubsectionList, setLocationExtentionsubsectionList] = useState([]);
  const [LocationExtentionDetails, setLocationExtentionDetails] = useState([]);
  const [selectedLocationExtentionSection, setSelectedLocationExtentionSection] = useState(null);

  // Sensation Section
  const [SensationDetailsKeyword, setSensationDetailsKeyword] = useState('');
  const [SensationSectionId, setSensationSectionId] = useState(0);
  const [diagnosisSensationIds, setDiagnosisSensationIds] = useState([]);
  const [SensationsubsectionList, setSensationsubsectionList] = useState([]);
  const [SensationDetails, setSensationDetails] = useState([]);
  const [selectedSensationSection, setSelectedSensationSection] = useState(null);

  // Modalities Section
  const [ModalitiesDetailsKeyword, setModalitiesDetailsKeyword] = useState('');
  const [ModalitiesSectionId, setModalitiesSectionId] = useState(0);
  const [diagnosisModalitiesIds, setDiagnosisModalitiesIds] = useState([]);
  const [ModalitiessubsectionList, setModalitiessubsectionList] = useState([]);
  const [ModalitiesDetails, setModalitiesDetails] = useState([]);
  const [selectedModalitiesSection, setSelectedModalitiesSection] = useState(null);

  // Accompanied Section
  const [AccompaniedDetailsSystem, setAccompaniedDetailsSystem] = useState('');
  const [AccompaniedSectionId, setAccompaniedSectionId] = useState(0);
  const [diagnosisAccompaniedIds, setDiagnosisAccompaniedIds] = useState([]);
  const [AccompaniedsubsectionList, setAccompaniedsubsectionList] = useState([]);
  const [AccompaniedDetails, setAccompaniedDetails] = useState([]);
  const [selectedAccompaniedSection, setSelectedAccompaniedSection] = useState(null);

  // Observations Section
  const [ObservationsDetailsKeyword, setObservationsDetailsKeyword] = useState('');
  const [ObservationsSectionId, setObservationsSectionId] = useState(0);
  const [diagnosisObservationsIds, setDiagnosisObservationsIds] = useState([]);
  const [ObservationssubsectionList, setObservationssubsectionList] = useState([]);
  const [ObservationsDetails, setObservationsDetails] = useState([]);
  const [selectedObservationsSection, setSelectedObservationsSection] = useState(null);

  // BeforeAfterDuring Section
  const [BeforeAfterDuringDetailsKeyword, setBeforeAfterDuringDetailsKeyword] = useState('');
  const [BeforeAfterDuringSectionId, setBeforeAfterDuringSectionId] = useState(0);
  const [diagnosisBeforeAfterDuringIds, setDiagnosisBeforeAfterDuringIds] = useState([]);
  const [BeforeAfterDuringsubsectionList, setBeforeAfterDuringsubsectionList] = useState([]);
  const [BeforeAfterDuringDetails, setBeforeAfterDuringDetails] = useState([]);
  const [selectedBeforeAfterDuringSection, setSelectedBeforeAfterDuringSection] = useState(null);

  // Form validation
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    // Clear any previous success/error messages on component mount
    dispatch(setDiagnosisConditionSuccess(null));
    dispatch(setDiagnosisConditionError(null));

    dispatch(getSectionListForDiagnosis());
    dispatch(getDiagnosisSystemListForDiagnosis());
  }, [dispatch]);

  // Sync Redux section list to local state
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

  // Sync Redux diagnosis system list to local state
  useEffect(() => {
    if (reduxDiagnosisSystemList && reduxDiagnosisSystemList.length > 0) {
      setDiagnosisSystemList(reduxDiagnosisSystemList);
    }
  }, [reduxDiagnosisSystemList]);

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

  // Event handlers
  const handleSelectSingle = (selectedOption, string) => {
    if (selectedOption) {
      const sectionIdValue = selectedOption.value;
      if (string === "Diagnosis") {
        setSelectedSingle(selectedOption);
        setSectionId(sectionIdValue);
        setSelectedSubSection(null);
      }
    } else {
      if (string === "Diagnosis") {
        setSelectedSingle(null);
        setSectionId(0);
        setSubsectionList([]);
      }
    }
  };

  const handleChangeSubSection = (string, selectedOption) => {
    if (selectedOption) {
      const sectionIdValue = selectedOption.value;

      switch (string) {
        case "Symptoms":
          setSelectedSymptomsSection(selectedOption);
          setSymptomsSectionId(sectionIdValue);
          setDiagnosisSymptomsIds([]);
          break;
        case "Monogram":
          setSelectedMonogramSection(selectedOption);
          setMonogramSectionId(sectionIdValue);
          setDiagnosisMonogramIds([]);
          break;
        case "Causations":
          setSelectedCausationsSection(selectedOption);
          setCausationsSectionId(sectionIdValue);
          setDiagnosisCausationsIds([]);
          break;
        case "Pathology":
          setSelectedPathologySection(selectedOption);
          setPathologySectionId(sectionIdValue);
          setDiagnosisPathologyIds([]);
          break;
        case "Emergencies":
          setSelectedEmergenciesSection(selectedOption);
          setEmergenciesSectionId(sectionIdValue);
          setDiagnosisEmergenciesIds([]);
          break;
        case "Onset":
          setSelectedOnsetSection(selectedOption);
          setOnsetSectionId(sectionIdValue);
          setDiagnosisOnsetIds([]);
          break;
        case "Patterns":
          setSelectedPatternsSection(selectedOption);
          setPatternsSectionId(sectionIdValue);
          setDiagnosisPatternsIds([]);
          break;
        case "LocationExtention":
          setSelectedLocationExtentionSection(selectedOption);
          setLocationExtentionSectionId(sectionIdValue);
          setDiagnosisLocationExtentionIds([]);
          break;
        case "Sensation":
          setSelectedSensationSection(selectedOption);
          setSensationSectionId(sectionIdValue);
          setDiagnosisSensationIds([]);
          break;
        case "Modalities":
          setSelectedModalitiesSection(selectedOption);
          setModalitiesSectionId(sectionIdValue);
          setDiagnosisModalitiesIds([]);
          break;
        case "Accompanied":
          setSelectedAccompaniedSection(selectedOption);
          setAccompaniedSectionId(sectionIdValue);
          setDiagnosisAccompaniedIds([]);
          break;
        case "Observations":
          setSelectedObservationsSection(selectedOption);
          setObservationsSectionId(sectionIdValue);
          setDiagnosisObservationsIds([]);
          break;
        case "BeforeAfterDuring":
          setSelectedBeforeAfterDuringSection(selectedOption);
          setBeforeAfterDuringSectionId(sectionIdValue);
          setDiagnosisBeforeAfterDuringIds([]);
          break;
        default:
          break;
      }
    } else {
      // Clear section when deselected
      switch (string) {
        case "Symptoms":
          setSelectedSymptomsSection(null);
          setSymptomsSectionId(0);
          setSymptomssubsectionList([]);
          setDiagnosisSymptomsIds([]);
          break;
        case "Monogram":
          setSelectedMonogramSection(null);
          setMonogramSectionId(0);
          setMonogramsubsectionList([]);
          setDiagnosisMonogramIds([]);
          break;
        case "Causations":
          setSelectedCausationsSection(null);
          setCausationsSectionId(0);
          setCausationssubsectionList([]);
          setDiagnosisCausationsIds([]);
          break;
        case "Pathology":
          setSelectedPathologySection(null);
          setPathologySectionId(0);
          setPathologysubsectionList([]);
          setDiagnosisPathologyIds([]);
          break;
        case "Emergencies":
          setSelectedEmergenciesSection(null);
          setEmergenciesSectionId(0);
          setEmergenciessubsectionList([]);
          setDiagnosisEmergenciesIds([]);
          break;
        case "Onset":
          setSelectedOnsetSection(null);
          setOnsetSectionId(0);
          setOnsetsubsectionList([]);
          setDiagnosisOnsetIds([]);
          break;
        case "Patterns":
          setSelectedPatternsSection(null);
          setPatternsSectionId(0);
          setPatternssubsectionList([]);
          setDiagnosisPatternsIds([]);
          break;
        case "LocationExtention":
          setSelectedLocationExtentionSection(null);
          setLocationExtentionSectionId(0);
          setLocationExtentionsubsectionList([]);
          setDiagnosisLocationExtentionIds([]);
          break;
        case "Sensation":
          setSelectedSensationSection(null);
          setSensationSectionId(0);
          setSensationsubsectionList([]);
          setDiagnosisSensationIds([]);
          break;
        case "Modalities":
          setSelectedModalitiesSection(null);
          setModalitiesSectionId(0);
          setModalitiessubsectionList([]);
          setDiagnosisModalitiesIds([]);
          break;
        case "Accompanied":
          setSelectedAccompaniedSection(null);
          setAccompaniedSectionId(0);
          setAccompaniedsubsectionList([]);
          setDiagnosisAccompaniedIds([]);
          break;
        case "Observations":
          setSelectedObservationsSection(null);
          setObservationsSectionId(0);
          setObservationssubsectionList([]);
          setDiagnosisObservationsIds([]);
          break;
        case "BeforeAfterDuring":
          setSelectedBeforeAfterDuringSection(null);
          setBeforeAfterDuringSectionId(0);
          setBeforeAfterDuringsubsectionList([]);
          setDiagnosisBeforeAfterDuringIds([]);
          break;
        default:
          break;
      }
    }
  };

  const DiagnosisTabChanged = (string, selectedOptions) => {
    if (selectedOptions != null) {
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
        default:
          break;
      }
    }
  };

  const DiagnosisSystemChanged = (selectedOptions) => {
    if (selectedOptions != null) {
      setDiagnosisSystemIds(selectedOptions);
    }
  };

  // Add methods
  const addSelectedSubSectionQuestions = () => {
    if (selectedSubSection === null || selectedSubSection === "") {
      alert("Please select Sub Section");
    } else {
      const obj = {
        subSectionId: selectedSubSection.value,
        subsectionName: selectedSubSection.label,
      };
      setSelectedSubSectionList([...selectedSubSectionList, obj]);
      setSelectedSubSection(null);
      setSectionId(0);
      setSelectedSingle(null);
    }
  };

  const addSymptoms = () => {
    if (symptom === "") {
      alert("Please Enter symptom name");
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
      setSelectedSymptomsSection(null);
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
      setSelectedMonogramSection(null);
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
      setSelectedCausationsSection(null);
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
      setSelectedPathologySection(null);
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
      setSelectedEmergenciesSection(null);
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
      setSelectedOnsetSection(null);
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
      setSelectedPatternsSection(null);
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
      setSelectedLocationExtentionSection(null);
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
      setSelectedSensationSection(null);
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
      setSelectedModalitiesSection(null);
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
      setSelectedAccompaniedSection(null);
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
      setSelectedObservationsSection(null);
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
      setSelectedBeforeAfterDuringSection(null);
      clearMultiSections('beforeAfterDuring');
    }
  };

  // Delete methods
  const deleteSubSection = (index) => {
    const array = [...selectedSubSectionList];
    if (index !== -1) {
      array.splice(index, 1);
      setSelectedSubSectionList(array);
    }
  };

  const deleteSymptoms = (index) => {
    const array = [...models];
    if (index !== -1) {
      array.splice(index, 1);
      setModels(array);
    }
  };

  const deleteMonogram = (index) => {
    const array = [...DiagnosisMonogramDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setDiagnosisMonogramDetails(array);
    }
  };

  const deleteCausations = (index) => {
    const array = [...DiagnosisCausationNameDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setDiagnosisCausationNameDetails(array);
    }
  };

  const deletePathology = (index) => {
    const array = [...DiagnosisPathologyDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setDiagnosisPathologyDetails(array);
    }
  };

  const deleteEmergencies = (index) => {
    const array = [...EmergencieDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setEmergencieDetails(array);
    }
  };

  const deleteOnset = (index) => {
    const array = [...OnsetDurationProgressDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setOnsetDurationProgressDetails(array);
    }
  };

  const deletePatterns = (index) => {
    const array = [...PatternsDetail];
    if (index !== -1) {
      array.splice(index, 1);
      setPatternsDetail(array);
    }
  };

  const deleteLocationExtention = (index) => {
    const array = [...LocationExtentionDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setLocationExtentionDetails(array);
    }
  };

  const deleteSensation = (index) => {
    const array = [...SensationDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setSensationDetails(array);
    }
  };

  const deleteModalities = (index) => {
    const array = [...ModalitiesDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setModalitiesDetails(array);
    }
  };

  const deleteAccompanied = (index) => {
    const array = [...AccompaniedDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setAccompaniedDetails(array);
    }
  };

  const deleteObservations = (index) => {
    const array = [...ObservationsDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setObservationsDetails(array);
    }
  };

  const deleteBeforeAfterDuring = (index) => {
    const array = [...BeforeAfterDuringDetails];
    if (index !== -1) {
      array.splice(index, 1);
      setBeforeAfterDuringDetails(array);
    }
  };


  // Form validation
  const validateForm = () => {
    let newErrors = {};
    let isFormValid = true;

    if (!diagnosisName.trim()) {
      isFormValid = false;
      newErrors.diagnosisName = "Please enter diagnosis name";
    }

    setErrors(newErrors);
    return isFormValid;
  };

  // Form submission - matching the API structure exactly
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Required fields are missing. Please check All Tabs");
      return;
    }

    // Build diagnosis system details list
    const diagnosisSystemDetailsList = [];
    diagnosisSystemIds.forEach(element => {
      diagnosisSystemDetailsList.push({
        diagnosisSystemDetailId: 0,
        diagnosisId: 0,
        diagnosisSystemId: element.value,
        deletedStatus: false,
        diagnosisSystemName: element.label,
        description: ""
      });
    });

    // Build modelEx from selectedSubSectionList
    const modelEx = [];
    selectedSubSectionList.forEach(element => {
      modelEx.push({
        diagnosisDetailId: 0,
        diagnosisId: 0,
        subSectionId: element.subSectionId,
        subsectionName: element.subsectionName,
        deleteStatus: false
      });
    });

    const submitData = {
      diagnosisId: 0,
      diagnosisGroupId: 0,
      diagnosisName: diagnosisName,
      diagnosisNameAlias: diagnosisNameAlias,
      description: "",
      investigations: investigations,
      allopathicMedicines: allopathicMedicines,
      examiniations: examinations,
      miasm: miasm,
      keywords: "",
      enteredBy: parseInt(localStorage.getItem('UserId')) || 1,
      enteredDate: new Date().toISOString(),
      changedBy: parseInt(localStorage.getItem('UserId')) || 1,
      changedDate: new Date().toISOString(),
      deleteStatus: false,
      modelEx: modelEx,
      diagnosisCausationList: DiagnosisCausationNameDetails,
      diagnosisSymptomsList: models,
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
      diagnosisPathologyDetailsModelsList: DiagnosisPathologyDetails
    };

    console.log("Submitting data:", submitData);

    try {
      await dispatch(createDiagnosisCondition(submitData));
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Redirect after 2 seconds to allow user to see success message
      setTimeout(() => {
        window.location.href = '/admin/listdiagnosisconditions';
      }, 2000);
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper function to get state values based on section type
  const getSectionData = (sectionType) => {
    const dataMap = {
      'symptoms': {
        keyword: symptom,
        setKeyword: setSymptom,
        sectionId: SymptomsSectionId,
        selectedSection: selectedSymptomsSection,
        subsectionIds: diagnosisSymptomsIds,
        subsectionList: SymptomssubsectionList,
        items: models,
        setItems: setModels,
        rubricKey: 'diagnosisSymptomRubric',
        getKeyword: (item) => item.symptom,
        addMethod: addSymptoms,
        deleteMethod: deleteSymptoms
      },
      'monogram': {
        keyword: MonogramKeyword,
        setKeyword: setMonogramKeyword,
        sectionId: MonogramSectionId,
        selectedSection: selectedMonogramSection,
        subsectionIds: diagnosisMonogramIds,
        subsectionList: MonogramsubsectionList,
        items: DiagnosisMonogramDetails,
        setItems: setDiagnosisMonogramDetails,
        rubricKey: 'diagnosisMonogramRubricDetails',
        getKeyword: (item) => item.diagnosisMonogramKeyword,
        addMethod: addMonogram,
        deleteMethod: deleteMonogram
      },
      'causations': {
        keyword: CausationName,
        setKeyword: setCausationName,
        sectionId: CausationsSectionId,
        selectedSection: selectedCausationsSection,
        subsectionIds: diagnosisCausationsIds,
        subsectionList: CausationssubsectionList,
        items: DiagnosisCausationNameDetails,
        setItems: setDiagnosisCausationNameDetails,
        rubricKey: 'diagnosisCausationRubricDetails',
        getKeyword: (item) => item.causationName,
        addMethod: addCausations,
        deleteMethod: deleteCausations
      },
      'pathology': {
        keyword: diagnosisPathologyKeyword,
        setKeyword: setDiagnosisPathologyKeyword,
        sectionId: PathologySectionId,
        selectedSection: selectedPathologySection,
        subsectionIds: diagnosisPathologyIds,
        subsectionList: PathologysubsectionList,
        items: DiagnosisPathologyDetails,
        setItems: setDiagnosisPathologyDetails,
        rubricKey: 'diagnosisPathologyRubricDetails',
        getKeyword: (item) => item.diagnosisPathologyKeyword,
        addMethod: addPathology,
        deleteMethod: deletePathology
      },
      'emergencies': {
        keyword: EmergenciesKeywords,
        setKeyword: setEmergenciesKeywords,
        sectionId: EmergenciesSectionId,
        selectedSection: selectedEmergenciesSection,
        subsectionIds: diagnosisEmergenciesIds,
        subsectionList: EmergenciessubsectionList,
        items: EmergencieDetails,
        setItems: setEmergencieDetails,
        rubricKey: 'emergencieRubricDetails',
        getKeyword: (item) => item.emergencieKeyword,
        addMethod: addEmergencies,
        deleteMethod: deleteEmergencies
      },
      'onset': {
        keyword: onsetKeyword,
        setKeyword: setOnsetKeyword,
        sectionId: OnsetSectionId,
        selectedSection: selectedOnsetSection,
        subsectionIds: diagnosisOnsetIds,
        subsectionList: OnsetsubsectionList,
        items: OnsetDurationProgressDetails,
        setItems: setOnsetDurationProgressDetails,
        rubricKey: 'onsetDurationProgressRubricDetails',
        getKeyword: (item) => item.onsetKeyword,
        addMethod: addOnset,
        deleteMethod: deleteOnset
      },
      'patterns': {
        keyword: PatternsKeywords,
        setKeyword: setPatternsKeywords,
        sectionId: PatternsSectionId,
        selectedSection: selectedPatternsSection,
        subsectionIds: diagnosisPatternsIds,
        subsectionList: PatternssubsectionList,
        items: PatternsDetail,
        setItems: setPatternsDetail,
        rubricKey: 'patternRubricDetails',
        getKeyword: (item) => item.patternsKeywords,
        addMethod: addPatterns,
        deleteMethod: deletePatterns
      },
      'locationExtension': {
        keyword: LocationExtentionDetailsKeyword,
        setKeyword: setLocationExtentionDetailsKeyword,
        sectionId: LocationExtentionSectionId,
        selectedSection: selectedLocationExtentionSection,
        subsectionIds: diagnosisLocationExtentionIds,
        subsectionList: LocationExtentionsubsectionList,
        items: LocationExtentionDetails,
        setItems: setLocationExtentionDetails,
        rubricKey: 'locationExtentionRubricDetails',
        getKeyword: (item) => item.locationExtentionDetailsKeyword,
        addMethod: addLocationExtention,
        deleteMethod: deleteLocationExtention
      },
      'sensation': {
        keyword: SensationDetailsKeyword,
        setKeyword: setSensationDetailsKeyword,
        sectionId: SensationSectionId,
        selectedSection: selectedSensationSection,
        subsectionIds: diagnosisSensationIds,
        subsectionList: SensationsubsectionList,
        items: SensationDetails,
        setItems: setSensationDetails,
        rubricKey: 'sensationRubricDetails',
        getKeyword: (item) => item.sensationDetailsKeyword,
        addMethod: addSensation,
        deleteMethod: deleteSensation
      },
      'modalities': {
        keyword: ModalitiesDetailsKeyword,
        setKeyword: setModalitiesDetailsKeyword,
        sectionId: ModalitiesSectionId,
        selectedSection: selectedModalitiesSection,
        subsectionIds: diagnosisModalitiesIds,
        subsectionList: ModalitiessubsectionList,
        items: ModalitiesDetails,
        setItems: setModalitiesDetails,
        rubricKey: 'modalitiesRubricDetails',
        getKeyword: (item) => item.modalitiesDetailsKeyword,
        addMethod: addModalities,
        deleteMethod: deleteModalities
      },
      'accompanied': {
        keyword: AccompaniedDetailsSystem,
        setKeyword: setAccompaniedDetailsSystem,
        sectionId: AccompaniedSectionId,
        selectedSection: selectedAccompaniedSection,
        subsectionIds: diagnosisAccompaniedIds,
        subsectionList: AccompaniedsubsectionList,
        items: AccompaniedDetails,
        setItems: setAccompaniedDetails,
        rubricKey: 'accompaniedRubricDetails',
        getKeyword: (item) => item.accompaniedDetailsSystem,
        addMethod: addAccompanied,
        deleteMethod: deleteAccompanied
      },
      'observations': {
        keyword: ObservationsDetailsKeyword,
        setKeyword: setObservationsDetailsKeyword,
        sectionId: ObservationsSectionId,
        selectedSection: selectedObservationsSection,
        subsectionIds: diagnosisObservationsIds,
        subsectionList: ObservationssubsectionList,
        items: ObservationsDetails,
        setItems: setObservationsDetails,
        rubricKey: 'observationsRubricDetails',
        getKeyword: (item) => item.observationsDetailsKeyword,
        addMethod: addObservations,
        deleteMethod: deleteObservations
      },
      'beforeAfterDuring': {
        keyword: BeforeAfterDuringDetailsKeyword,
        setKeyword: setBeforeAfterDuringDetailsKeyword,
        sectionId: BeforeAfterDuringSectionId,
        selectedSection: selectedBeforeAfterDuringSection,
        subsectionIds: diagnosisBeforeAfterDuringIds,
        subsectionList: BeforeAfterDuringsubsectionList,
        items: BeforeAfterDuringDetails,
        setItems: setBeforeAfterDuringDetails,
        rubricKey: 'beforeAfterDuringRubricDetails',
        getKeyword: (item) => item.beforeAfterDuringDetailsKeyword,
        addMethod: addBeforeAfterDuring,
        deleteMethod: deleteBeforeAfterDuring
      }
    };

    return dataMap[sectionType];
  };

  // Map section type to appropriate string for API calls
  const getSectionString = (sectionType) => {
    const stringMap = {
      'symptoms': 'Symptoms',
      'monogram': 'Monogram',
      'causations': 'Causations',
      'pathology': 'Pathology',
      'emergencies': 'Emergencies',
      'onset': 'Onset',
      'patterns': 'Patterns',
      'locationExtension': 'LocationExtention',
      'sensation': 'Sensation',
      'modalities': 'Modalities',
      'accompanied': 'Accompanied',
      'observations': 'Observations',
      'beforeAfterDuring': 'BeforeAfterDuring'
    };
    return stringMap[sectionType] || sectionType;
  };

  // Helper function to render section tabs
  const renderSectionTab = (sectionType, tabId, title, keywordLabel) => {
    const section = getSectionData(sectionType);
    const sectionString = getSectionString(sectionType);

    return (
      <TabPane tabId={tabId}>
        <Row className="gy-4">
          <Col xxl={4} md={4}>
            <div>
              <Label htmlFor="placeholderInput" className="form-label">{keywordLabel}</Label>
              <Input
                type="input"
                className="form-control"
                id="placeholderInput"
                placeholder={`Enter ${keywordLabel}`}
                value={section.keyword}
                onChange={(e) => section.setKeyword(e.target.value)}
              />
            </div>
          </Col>
          <Col xxl={4} md={4}>
            <div>
              <Label htmlFor="placeholderInput" className="form-label">Section</Label>
              <Select
                value={section.selectedSection}
                onChange={(option) => handleChangeSubSection(sectionString, option)}
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
                isMulti
                isClearable
                closeMenuOnSelect={false}
                value={multiSectionsByTab[sectionType] || []}
                onChange={(options) => updateMultiSections(sectionType, options)}
                options={SingleOptions}
                placeholder="Select Section(s)..."
                styles={{
                  multiValue: (base) => ({ ...base, backgroundColor: "#e9ecef" }),
                  multiValueLabel: (base) => ({ ...base, color: "#212529" }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#495057",
                    ":hover": { backgroundColor: "#ced4da", color: "#212529" },
                  }),
                }}
              />
            </div>
          </Col>
        </Row>

        <Row className='mt-3'>
          <Col xxl={8} md={8}>
            <div>
              <Label htmlFor="placeholderInput" className="form-label">Sub Section</Label>
              <DiagnosisSubSectionSelect
                sectionId={section.sectionId}
                value={section.subsectionIds}
                onChange={(options) => DiagnosisTabChanged(sectionString, options)}
              />
            </div>
          </Col>

          <Col xxl={4} md={4}>
            <div className="d-inline-flex gap-2 mt-4">
              <button
                type="button"
                className="btn btn-soft-info btn-sm mt-2"
                onClick={section.addMethod}
              >
                <i className="ri-add-line align-middle"></i> Add {title}
              </button>
            </div>
          </Col>
        </Row>

        <hr />

        <Row className='mt-3'>
          <Col xxl={12} md={12}>
            <DiagnosisKeywordTable
              items={section.items}
              keywordLabel={keywordLabel}
              getKeyword={section.getKeyword}
              getRubrics={(item) => item[section.rubricKey] || []}
              onDeleteItem={section.deleteMethod}
              onRemoveSection={(parentIndex, sectionId) =>
                removeSectionFromKeywordList(section.setItems, parentIndex, sectionId, section.rubricKey)
              }
            />
          </Col>
        </Row>
      </TabPane>
    );
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">New Diagnosis & Conditions</h4>
                </CardHeader>

                <CardBody className="card-body">
                  <div className="live-preview">
                    <div className="p-2">
                      {diagnosisConditionSuccess ? (
                        <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                          <i className="ri-notification-off-line label-icon"></i>
                          {diagnosisConditionSuccess}
                        </UncontrolledAlert>
                      ) : null}
                      {diagnosisConditionError ? (
                        <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                          <i className="ri-error-warning-line label-icon"></i>
                          {diagnosisConditionError}
                        </UncontrolledAlert>
                      ) : null}
                    </div>
                    <Row>
                      <Col xxl={12} md={12}>
                        <div>
                          <Nav pills className="nav-success mb-3">
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
                            <TabPane tabId="1">
                              <Row className="gy-4">
                                <Col xxl={4} md={4}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Diagnosis Name</Label>
                                    <Input
                                      type="input"
                                      className="form-control"
                                      id="placeholderInput"
                                      placeholder="Enter Diagnosis Name"
                                      value={diagnosisName}
                                      onChange={(e) => setDiagnosisName(e.target.value)}
                                    />
                                    {errors.diagnosisName && <span className="text-danger">{errors.diagnosisName}</span>}
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
                                      value={diagnosisNameAlias}
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
                                      value={miasm}
                                      onChange={(e) => setMiasm(e.target.value)}
                                    />
                                  </div>
                                </Col>
                              </Row>

                              <Row className="mt-3">
                                <Col xxl={4} md={4}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Section Name</Label>
                                    <Select
                                      value={selectedSingle}
                                      onChange={(option) => handleSelectSingle(option, "Diagnosis")}
                                      options={SingleOptions}
                                      placeholder="Select Section"
                                      isClearable
                                    />
                                  </div>
                                </Col>
                                <Col xxl={4} md={4}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Sub Section Name</Label>
                                    <DiagnosisSubSectionSelect
                                      sectionId={sectionId}
                                      value={selectedSubSection}
                                      isMulti={false}
                                      placeholder="Select Sub-Section"
                                      onChange={(item) => {
                                        setSelectedSubSection(item || null);
                                      }}
                                    />
                                  </div>
                                </Col>

                                <Col xxl={4} md={4}>
                                  <div className="d-inline-flex gap-2 mt-4">
                                    <button type="button" className="btn btn-soft-info btn-sm mt-2" onClick={addSelectedSubSectionQuestions}>
                                      <i className="ri-add-line align-middle"></i> Add Sub Section
                                    </button>
                                  </div>
                                </Col>
                              </Row>

                              <hr />

                              <Row className='mt-3'>
                                <Col xxl={12} md={12}>
                                  <table className="table table-responsive table-bordered table-nowrap">
                                    <thead>
                                      <tr>
                                        <th scope="col">Sub Section Name</th>
                                        <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedSubSectionList.length === 0 ? (
                                        <tr>
                                          <td colSpan="2" className="text-center">No subsections selected</td>
                                        </tr>
                                      ) : (
                                        selectedSubSectionList.map((item, index) => (
                                          <tr key={index}>
                                            <td>{item.subsectionName}</td>
                                            <td className='text-center'>
                                              <div className="remove">
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-soft-danger remove-item-btn"
                                                  onClick={() => deleteSubSection(index)}
                                                >
                                                  <i className="ri-delete-bin-5-line"></i>
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </Col>
                              </Row>
                            </TabPane>

                            {renderSectionTab('symptoms', '2', 'Symptoms', 'Diagnosis Symptoms Keywords')}

                            {renderSectionTab('monogram', '3', 'Monogram', 'Diagnosis Monogram Keywords')}

                            {renderSectionTab('causations', '4', 'Causations', 'Diagnosis Causations Keywords')}

                            {renderSectionTab('pathology', '5', 'Pathology', 'Diagnosis Pathology Keywords')}

                            <TabPane tabId="6">
                              <Row className="gy-4">
                                <Col xxl={8} md={8}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Diagnosis System</Label>
                                    <Select
                                      isMulti
                                      isClearable
                                      closeMenuOnSelect={false}
                                      placeholder="Select one or more Diagnosis System"
                                      value={diagnosisSystemIds}
                                      options={diagnosisSystemList.map(x => ({
                                        value: x.diagnosisSystemId,
                                        label: x.diagnosisSystemName
                                      }))}
                                      onChange={DiagnosisSystemChanged}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </TabPane>

                            {renderSectionTab('emergencies', '7', 'Emergencies', 'Emergencies Keywords')}

                            <TabPane tabId="8">
                              <Row className="gy-4">
                                <Col xxl={4} md={4}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Investigations</Label>
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
                                    <Label htmlFor="placeholderInput" className="form-label">Allopathic Medicines</Label>
                                    <Input
                                      type="input"
                                      className="form-control"
                                      id="placeholderInput"
                                      placeholder="Enter Allopathic Medicines"
                                      value={allopathicMedicines}
                                      onChange={(e) => setAllopathicMedicines(e.target.value)}
                                    />
                                  </div>
                                </Col>
                                <Col xxl={4} md={4}>
                                  <div>
                                    <Label htmlFor="placeholderInput" className="form-label">Examination</Label>
                                    <Input
                                      type="input"
                                      className="form-control"
                                      id="placeholderInput"
                                      placeholder="Enter Examination"
                                      value={examinations}
                                      onChange={(e) => setExaminations(e.target.value)}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </TabPane>

                            {renderSectionTab('onset', '9', 'Onset/Duration/Progress', 'Onset/Duration/Progress Keywords')}

                            {renderSectionTab('patterns', '10', 'Patterns', 'Patterns Keywords')}

                            {renderSectionTab('locationExtension', '11', 'Location-Extension', 'Location-Extension Keywords')}

                            {renderSectionTab('sensation', '12', 'Sensation', 'Sensation Keywords')}

                            {renderSectionTab('modalities', '13', 'Modalities', 'Modalities Keywords')}

                            {renderSectionTab('accompanied', '14', 'Accompanied', 'Accompanied Keywords')}

                            {renderSectionTab('observations', '15', 'Observations', 'Observations Keywords')}

                            {renderSectionTab('beforeAfterDuring', '16', 'Before/After/During', 'Before/After/During Keywords')}

                          </TabContent>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </CardBody>

                <CardFooter>
                  <div className="d-flex gap-2 justify-content-end">
                    <button type="button" className="btn btn-light" onClick={() => window.history.back()}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={diagnosisConditionLoading}>
                      {diagnosisConditionLoading ? <Spinner size="sm" /> : <i className="ri-save-line align-bottom me-1"></i>}
                      Save
                    </button>
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

export default Starter;