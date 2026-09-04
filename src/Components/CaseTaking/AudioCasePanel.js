import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  Input,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from 'reactstrap';
import Select from 'react-select';
import classnames from 'classnames';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import useAudioWaveform, { AUDIO_WAVEFORM_BAR_COUNT } from '../../hooks/useAudioWaveform';
import {
  AUDIO_SOURCE_FILE,
  AUDIO_SOURCE_LIVE,
  AUDIO_LANGUAGE_OPTIONS,
  formatDuration,
  isAcceptedAudioFile,
  mapSuggestedRubricToRepertorization,
  formatAudioCaseSessionDate,
  isAiClinicalConceptOnly,
  MAX_AUDIO_FILE_SIZE_BYTES,
} from '../../helpers/audioCaseTakingHelper';
import {
  buildAudioDownloadFileName,
  downloadLocalAudioBlob,
  getExtensionFromFile,
  getExtensionFromFileName,
  resolveAudioDownloadBlob,
} from '../../helpers/audioCaseDownloadHelper';
import { downloadAudioCaseRecording } from '../../helpers/realbackend_helper';
import { getDoctorUserId } from '../../helpers/patientBoardSessionHelper';
import {
  setAudioCaseTranscript,
  setRubricApprovalState,
  resetAudioCaseTaking,
  toggleAudioCaseSessionHistory,
  resetAudioCaseSessionHistory,
} from '../../slices/doctor/audioCaseTaking/reducer';
import {
  uploadAndAnalyzeAudioCase,
  reAnalyzeAudioCase,
  pollAudioCaseAnalysis,
  logAudioDoctorAction,
  submitAudioCaseRubricFeedback,
  startNewAudioCaseSession,
  loadAudioCaseSessionHistory,
  openAudioCaseHistorySession,
} from '../../slices/doctor/audioCaseTaking/thunk';
import AudioCaseProcessingStatus from './AudioCaseProcessingStatus';
import AudioCaseConversationPanel from './AudioCaseConversationPanel';
import AudioCaseSummaryPanel from './AudioCaseSummaryPanel';
import AudioCaseRubricSuggestions, { getRubricKey } from './AudioCaseRubricSuggestions';
import AudioCaseConceptTimeline from './AudioCaseConceptTimeline';
import AudioCaseTranscriptEditor from './AudioCaseTranscriptEditor';
import AudioCaseSessionHistory from './AudioCaseSessionHistory';
import './audioCaseTaking.css';

const IDLE_WAVE_PATTERN = Array.from({ length: AUDIO_WAVEFORM_BAR_COUNT }, (_, index) => {
  const t = index / (AUDIO_WAVEFORM_BAR_COUNT - 1);
  const envelope = Math.sin(t * Math.PI);
  const ripple = 0.52 + 0.48 * Math.abs(Math.sin(index * 0.58));
  return 0.18 + 0.72 * envelope * ripple;
});

const AUDIO_UPLOAD_FORMATS = ['MP3', 'WAV', 'M4A', 'WEBM', 'OGG'];

const AC_SELECT_BLUE = '#1e88e5';
const AC_SELECT_BLUE_DEEP = '#0b5cab';

const audioLanguageSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '36px',
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
    padding: '2px 10px 2px 4px',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 650,
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    fontSize: '13px',
    color: '#0f172a',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? AC_SELECT_BLUE_DEEP : '#64748b',
    padding: '0 10px',
    transition: 'color 0.15s ease, transform 0.15s ease',
    transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
    '&:hover': {
      color: AC_SELECT_BLUE_DEEP,
    },
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '10px',
    border: '1px solid #d7e3ef',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
    zIndex: 10050,
    marginTop: 6,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 10050,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: 6,
    maxHeight: 280,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13px',
    borderRadius: 8,
    margin: '2px 0',
    padding: '8px 10px',
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? 'linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%)'
      : state.isFocused
        ? '#eaf5ff'
        : '#fff',
    background: state.isSelected
      ? 'linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%)'
      : state.isFocused
        ? '#eaf5ff'
        : '#fff',
    color: state.isSelected ? '#fff' : '#0f172a',
    fontWeight: state.isSelected ? 700 : 500,
    ':active': {
      background: state.isSelected
        ? 'linear-gradient(180deg, #1e88e5 0%, #0b5cab 100%)'
        : '#dbeafe',
    },
  }),
};

const AudioCasePanel = ({
  patientId,
  caseId,
  patientAppId,
  patientName,
  onApplyRubric,
  repertorizationCount = 0,
  intensities = [],
  onAnalysisStateChange,
  onAppendSummaryToHistoryNote,
  onOpenRepertorize,
}) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const sessionCheckKeyRef = useRef(null);
  const autoAppliedSessionRef = useRef(null);
  const [activeSourceTab, setActiveSourceTab] = useState('record');
  const [consentGiven, setConsentGiven] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [language, setLanguage] = useState('');
  const [captureCollapsed, setCaptureCollapsed] = useState(false);
  const [openingHistorySessionId, setOpeningHistorySessionId] = useState(null);
  const [downloadingHistorySessionId, setDownloadingHistorySessionId] = useState(null);

  const {
    isRecording,
    isPaused,
    durationMs,
    mediaStream,
    error: recorderError,
    localBlob,
    setLocalBlob,
    start,
    pause,
    resume,
    stop,
    resetRecorder,
  } = useAudioRecorder();

  const waveformLevels = useAudioWaveform(mediaStream, isRecording && !isPaused);
  const audioCase = useSelector((state) => state?.AudioCaseTaking ?? {});
  const handleContinueWaiting = useCallback(() => {
    if (!audioCase.sessionId || audioCase.pollLoading) return;
    dispatch(pollAudioCaseAnalysis(audioCase.sessionId));
  }, [audioCase.sessionId, audioCase.pollLoading, dispatch]);

  const readyBlob = useMemo(() => {
    if (activeSourceTab === 'upload') {
      return selectedFile;
    }
    return localBlob;
  }, [activeSourceTab, localBlob, selectedFile]);

  const viewingHistorySession = useMemo(
    () => (audioCase.sessionHistory || []).find(
      (item) => item.sessionId === audioCase.viewingHistorySessionId,
    ) || null,
    [audioCase.sessionHistory, audioCase.viewingHistorySessionId],
  );

  const canDownload = Boolean(readyBlob) || audioCase.canDownloadFromServer;
  const canAnalyze = Boolean(readyBlob) && consentGiven && !audioCase.uploadLoading && !audioCase.pollLoading
    && audioCase.status !== 'completed';

  useEffect(() => {
    onAnalysisStateChange?.({
      sessionId: audioCase.sessionId,
      audioSource: audioCase.audioSource,
      transcript: audioCase.transcript,
      messages: audioCase.messages,
      summary: audioCase.summary,
      suggestedRubrics: audioCase.suggestedRubrics,
      status: audioCase.status,
    });
  }, [
    audioCase.sessionId,
    audioCase.audioSource,
    audioCase.transcript,
    audioCase.messages,
    audioCase.summary,
    audioCase.suggestedRubrics,
    audioCase.status,
    onAnalysisStateChange,
  ]);

  useEffect(() => () => {
    dispatch(resetAudioCaseTaking());
  }, [dispatch]);

  useEffect(() => {
    if (!patientId) {
      return;
    }

    const checkKey = `${patientId}:${caseId ?? ''}`;
    if (sessionCheckKeyRef.current === checkKey) {
      return;
    }

    sessionCheckKeyRef.current = checkKey;
    dispatch(startNewAudioCaseSession());
    dispatch(resetAudioCaseSessionHistory());
    autoAppliedSessionRef.current = null;
    resetRecorder();
    setSelectedFile(null);
    setIsDraggingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    dispatch(loadAudioCaseSessionHistory(patientId));
  }, [dispatch, patientId, caseId, resetRecorder]);

  useEffect(() => {
    if (!patientId || audioCase.status !== 'completed' || !audioCase.sessionId) {
      return;
    }
    dispatch(loadAudioCaseSessionHistory(patientId));
  }, [dispatch, patientId, audioCase.status, audioCase.sessionId]);

  useEffect(() => {
    if (audioCase.status === 'completed') {
      setCaptureCollapsed(true);
    }
  }, [audioCase.status, audioCase.sessionId]);

  useEffect(() => {
    if (audioCase.openedFromHistory) {
      return;
    }
    if (audioCase.status !== 'completed') {
      return;
    }
    if (audioCase.requireManualApprovalForSuggestedRubrics) {
      return;
    }
    if (!Array.isArray(audioCase.suggestedRubrics) || audioCase.suggestedRubrics.length === 0) {
      return;
    }
    if (autoAppliedSessionRef.current === audioCase.sessionId) {
      return;
    }

    autoAppliedSessionRef.current = audioCase.sessionId;

    const defaultIntensity = intensities.find((item) => item.intensityNo === 2)
      || intensities[0]
      || { intensityNo: 2, intensityId: 2 };

    let added = 0;
    for (const rubric of audioCase.suggestedRubrics) {
      const mapped = mapSuggestedRubricToRepertorization(rubric);
      if (!mapped) {
        continue;
      }
      if (repertorizationCount + added >= 20) {
        break;
      }
      onApplyRubric?.(mapped, defaultIntensity, {
        skipCommanUncommanRefresh: Boolean(rubric.isAiSuggested),
      });
      added += 1;
    }

    if (added > 0 && audioCase.sessionId) {
      dispatch(logAudioDoctorAction({
        sessionId: audioCase.sessionId,
        actionType: 'RubricsAutoAppliedToRepertorization',
        targetType: 'SubSection',
        notes: `Auto-applied ${added} rubric(s) to repertorization`,
      }));
    }
  }, [
    audioCase.openedFromHistory,
    audioCase.requireManualApprovalForSuggestedRubrics,
    audioCase.status,
    audioCase.sessionId,
    audioCase.suggestedRubrics,
    dispatch,
    intensities,
    onApplyRubric,
    repertorizationCount,
  ]);

  const handleStopRecording = async () => {
    await stop();
  };

  const applySelectedAudioFile = (file) => {
    if (!file) {
      return;
    }
    if (!isAcceptedAudioFile(file)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid file',
        text: 'Please choose mp3, wav, m4a, webm, or ogg.',
        confirmButtonColor: '#000000',
      });
      return;
    }
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      Swal.fire({
        icon: 'error',
        title: 'File too large',
        text: 'Maximum file size is 50 MB.',
        confirmButtonColor: '#000000',
      });
      return;
    }
    setSelectedFile(file);
    setLocalBlob(null);
  };

  const handleFileChange = (event) => {
    applySelectedAudioFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleUploadDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleUploadDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  };

  const handleUploadDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDraggingFile(false);
  };

  const handleUploadDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFile(false);
    applySelectedAudioFile(event.dataTransfer.files?.[0]);
  };

  const openAudioFilePicker = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedAudioFile = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedFile(null);
    setIsDraggingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (readyBlob) {
      const extension = activeSourceTab === 'upload'
        ? getExtensionFromFile(selectedFile)
        : 'webm';
      downloadLocalAudioBlob(
        readyBlob,
        buildAudioDownloadFileName(patientName, audioCase.sessionId, extension)
      );
      return;
    }

    if (audioCase.sessionId && !audioCase.usedMockData) {
      try {
        const response = await downloadAudioCaseRecording(audioCase.sessionId);
        const blob = resolveAudioDownloadBlob(response);
        if (!blob) {
          throw new Error('Unable to download recording.');
        }
        downloadLocalAudioBlob(
          blob,
          buildAudioDownloadFileName(patientName, audioCase.sessionId, 'webm')
        );
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Download failed',
          text: error?.message || 'Unable to download recording.',
          confirmButtonColor: '#000000',
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!readyBlob) {
      return;
    }

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Analyze conversation?',
      text: 'The audio will be uploaded and processed into conversation, summary, and rubric suggestions.',
      showCancelButton: true,
      confirmButtonText: 'Analyze',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#000000',
    });

    if (!confirm.isConfirmed) {
      return;
    }

    const audioSource = activeSourceTab === 'upload' ? AUDIO_SOURCE_FILE : AUDIO_SOURCE_LIVE;
    const originalFileName = activeSourceTab === 'upload'
      ? selectedFile?.name
      : buildAudioDownloadFileName(patientName, null, 'webm');

    try {
      await dispatch(uploadAndAnalyzeAudioCase({
        audioFile: readyBlob,
        patientId,
        caseId,
        patientAppId,
        doctorUserId: getDoctorUserId(),
        audioSource,
        originalFileName,
        patientName,
        language,
      }));
    } catch (error) {
      // Error state handled in slice.
    }
  };

  const handleApplyRubric = useCallback((rubric, intensity) => {
    if (repertorizationCount >= 20) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum limit reached',
        text: 'You can only add up to 20 rubrics to the repertorization list.',
        confirmButtonColor: '#000000',
      });
      return;
    }
    dispatch(setRubricApprovalState({ rubricKey: getRubricKey(rubric), status: 'approved' }));
    onApplyRubric?.(mapSuggestedRubricToRepertorization(rubric), intensity, {
      skipCommanUncommanRefresh: Boolean(rubric.isAiSuggested),
    });
    if (audioCase.sessionId) {
      dispatch(submitAudioCaseRubricFeedback({
        sessionId: audioCase.sessionId,
        feedbackType: 'Accepted',
        subSectionId: rubric.subSectionId > 0 ? rubric.subSectionId : null,
        rubricName: rubric.subSectionName ?? rubric.rubricName ?? 'Unknown rubric',
        originalMatchLayer: rubric.matchLayer ?? rubric.matchSource,
        confidenceAtFeedback: rubric.confidenceScore ?? rubric.matchScore,
        engineVersion: rubric.engineVersion ?? audioCase.engineVersion,
      }));
    }
  }, [onApplyRubric, repertorizationCount, audioCase.sessionId, audioCase.engineVersion, dispatch]);

  const handleRejectRubric = useCallback(async (rubricKey) => {
    dispatch(setRubricApprovalState({ rubricKey, status: 'rejected' }));
    const rubric = (audioCase.suggestedRubrics || []).find((item) => getRubricKey(item) === rubricKey);
    const stagePicker = await Swal.fire({
      title: 'Why is this rubric not suitable?',
      input: 'select',
      inputOptions: {
        Meaning: 'Meaning',
        Metaphor: 'Metaphor',
        ClinicalConcept: 'Clinical concept',
        HomeopathicConcept: 'Homeopathic concept',
        RubricMapping: 'Rubric mapping',
        Other: 'Other',
      },
      inputValue: 'Other',
      inputPlaceholder: 'Optional reject stage',
      showCancelButton: true,
      confirmButtonText: 'Reject rubric',
      cancelButtonText: 'Reject as Other',
      confirmButtonColor: '#dc3545',
    });
    const rejectReasonStage = stagePicker.isConfirmed ? stagePicker.value : 'Other';

    if (audioCase.sessionId && rubric) {
      dispatch(submitAudioCaseRubricFeedback({
        sessionId: audioCase.sessionId,
        feedbackType: 'Rejected',
        subSectionId: rubric.subSectionId > 0 ? rubric.subSectionId : null,
        rubricName: rubric.subSectionName ?? rubric.rubricName ?? rubricKey,
        originalMatchLayer: rubric.matchLayer ?? rubric.matchSource,
        confidenceAtFeedback: rubric.confidenceScore ?? rubric.matchScore,
        engineVersion: rubric.engineVersion ?? audioCase.engineVersion,
        rejectReasonStage,
        rejectReasonNote: null,
      }));
    }
  }, [audioCase.sessionId, audioCase.suggestedRubrics, audioCase.engineVersion, dispatch]);

  const handleApplyAllRubrics = useCallback(async () => {
    const defaultIntensity = intensities.find((item) => item.intensityNo === 2)
      || intensities[0]
      || { intensityNo: 2, intensityId: 2 };

    const approvalState = audioCase.rubricApprovalState || {};
    let added = 0;
    for (const rubric of audioCase.suggestedRubrics || []) {
      if (isAiClinicalConceptOnly(rubric)) {
        continue;
      }
      const rubricKey = getRubricKey(rubric);
      const state = approvalState[rubricKey];
      if (state === 'rejected' || state === 'approved') {
        continue;
      }
      const mapped = mapSuggestedRubricToRepertorization(rubric);
      if (!mapped) {
        continue;
      }
      if (repertorizationCount + added >= 20) {
        break;
      }
      dispatch(setRubricApprovalState({ rubricKey, status: 'approved' }));
      onApplyRubric?.(mapped, defaultIntensity, {
        skipCommanUncommanRefresh: Boolean(rubric.isAiSuggested),
      });
      if (audioCase.sessionId) {
        dispatch(submitAudioCaseRubricFeedback({
          sessionId: audioCase.sessionId,
          feedbackType: 'Accepted',
          subSectionId: rubric.subSectionId > 0 ? rubric.subSectionId : null,
          rubricName: rubric.subSectionName ?? rubric.rubricName ?? 'Unknown rubric',
          originalMatchLayer: rubric.matchLayer ?? rubric.matchSource,
          confidenceAtFeedback: rubric.confidenceScore ?? rubric.matchScore,
          engineVersion: rubric.engineVersion ?? audioCase.engineVersion,
        }));
      }
      added += 1;
    }

    if (added === 0 && repertorizationCount >= 20) {
      Swal.fire({
        icon: 'warning',
        title: 'Maximum limit reached',
        text: 'You can only add up to 20 rubrics to the repertorization list.',
        confirmButtonColor: '#000000',
      });
    }

    if (added > 0 && audioCase.sessionId) {
      dispatch(logAudioDoctorAction({
        sessionId: audioCase.sessionId,
        actionType: 'RubricsAcceptedBulk',
        targetType: 'SubSection',
        notes: `Approved ${added} remaining rubric(s)`,
      }));
    }
  }, [
    audioCase.suggestedRubrics,
    audioCase.sessionId,
    audioCase.engineVersion,
    audioCase.rubricApprovalState,
    intensities,
    onApplyRubric,
    repertorizationCount,
    dispatch,
  ]);

  const handleStartNewCase = () => {
    resetRecorder();
    setSelectedFile(null);
    setIsDraggingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setConsentGiven(false);
    setCaptureCollapsed(false);
    autoAppliedSessionRef.current = null;
    dispatch(startNewAudioCaseSession());
  };

  const handleToggleHistory = () => {
    const nextOpen = !audioCase.sessionHistoryOpen;
    dispatch(toggleAudioCaseSessionHistory(nextOpen));
    if (nextOpen && patientId) {
      dispatch(loadAudioCaseSessionHistory(patientId));
    }
  };

  const handleLoadMoreHistory = () => {
    if (!patientId) {
      return;
    }
    dispatch(loadAudioCaseSessionHistory(patientId, {
      pageNumber: (audioCase.sessionHistoryPage || 1) + 1,
      append: true,
    }));
  };

  const handleOpenHistorySession = async (session) => {
    if (!session?.sessionId) {
      return;
    }

    const hasUnsavedCapture = isRecording || Boolean(localBlob) || Boolean(selectedFile);
    const isBusy = audioCase.pollLoading || audioCase.uploadLoading;
    if (hasUnsavedCapture || isBusy) {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Open this session?',
        text: isBusy
          ? 'Current analysis is still running. Opening another session will leave that in the background.'
          : 'The current recording or file will be cleared.',
        showCancelButton: true,
        confirmButtonText: 'Open session',
        cancelButtonText: 'Stay here',
        confirmButtonColor: '#0b5cab',
      });
      if (!confirm.isConfirmed) {
        return;
      }
      if (isRecording) {
        await stop();
      }
      resetRecorder();
      setSelectedFile(null);
      setIsDraggingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    setOpeningHistorySessionId(session.sessionId);
    try {
      await dispatch(openAudioCaseHistorySession(session));
    } catch (error) {
      // Error handled in slice.
    } finally {
      setOpeningHistorySessionId(null);
    }
  };

  const handleDownloadHistorySession = async (session) => {
    if (!session?.sessionId) {
      return;
    }
    if (!session.hasAudioFile) {
      Swal.fire({
        icon: 'info',
        title: 'Audio unavailable',
        text: 'This recording is not available to download.',
        confirmButtonColor: '#0b5cab',
      });
      return;
    }

    setDownloadingHistorySessionId(session.sessionId);
    try {
      const response = await downloadAudioCaseRecording(session.sessionId);
      const blob = resolveAudioDownloadBlob(response);
      if (!blob) {
        throw new Error('Unable to download recording.');
      }
      const extension = getExtensionFromFileName(session.audioFileName, 'webm');
      const fileName = session.audioFileName
        || buildAudioDownloadFileName(patientName, session.sessionId, extension);
      downloadLocalAudioBlob(blob, fileName);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Download failed',
        text: error?.message || 'Unable to download this audio file.',
        confirmButtonColor: '#000000',
      });
    } finally {
      setDownloadingHistorySessionId(null);
    }
  };

  const handleReset = () => {
    handleStartNewCase();
  };

  const handleReAnalyze = async (transcript) => {
    if (!audioCase.sessionId || !transcript) {
      return;
    }
    try {
      await dispatch(reAnalyzeAudioCase(audioCase.sessionId, transcript));
    } catch (error) {
      // Error handled in slice.
    }
  };

  const handleAppendSummary = () => {
    if (!audioCase.summary) {
      return;
    }
    onAppendSummaryToHistoryNote?.(audioCase.summary);
    if (audioCase.sessionId) {
      dispatch(logAudioDoctorAction({
        sessionId: audioCase.sessionId,
        actionType: 'SummaryAppendedToHistoryNote',
        targetType: 'HistoryNote',
      }));
    }
  };

  const analysisComplete = audioCase.status === 'completed';
  const messageCount = Array.isArray(audioCase.messages) ? audioCase.messages.length : 0;
  const rubricCount = Array.isArray(audioCase.suggestedRubrics) ? audioCase.suggestedRubrics.length : 0;
  const showCaptureExpanded = !analysisComplete || !captureCollapsed;
  const languageOptions = AUDIO_LANGUAGE_OPTIONS;
  const selectedLanguageOption = useMemo(
    () => languageOptions.find((option) => option.value === language) || languageOptions[0],
    [language, languageOptions],
  );
  const readyLabel = activeSourceTab === 'upload' && selectedFile
    ? selectedFile.name
    : localBlob
      ? `Live recording (${formatDuration(durationMs)})`
      : audioCase.canDownloadFromServer
        ? 'Server recording available'
        : 'No audio selected';

  return (
    <Card className="mb-3 audio-case-panel">
      <CardHeader className="py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h6 className="mb-0">
            <i className="ri-mic-line me-1" />
            Audio case taking
          </h6>
          <small className="text-muted">
            {analysisComplete
              ? 'Review conversation, summary, and rubrics — or start a new capture'
              : 'Record or upload → confirm consent → analyze'}
          </small>
        </div>
        <div className="ac-header-actions">
          <button
            type="button"
            className={classnames('btn btn-sm ac-history-trigger', {
              'is-open': audioCase.sessionHistoryOpen,
            })}
            onClick={handleToggleHistory}
            aria-expanded={Boolean(audioCase.sessionHistoryOpen)}
            aria-controls="audio-case-session-history"
          >
            <i className="ri-history-line" />
            History
            {audioCase.sessionHistoryTotal > 0 && (
              <span className="ac-history-trigger__count">{audioCase.sessionHistoryTotal}</span>
            )}
          </button>
          <button type="button" className="btn btn-sm ac-btn-ghost" onClick={handleReset}>
            Clear
          </button>
        </div>
      </CardHeader>
      <CardBody>
        {audioCase.sessionHistoryOpen && (
          <div id="audio-case-session-history">
            <AudioCaseSessionHistory
              sessions={audioCase.sessionHistory}
              totalCount={audioCase.sessionHistoryTotal}
              completedCount={audioCase.sessionHistoryCompletedCount}
              processingCount={audioCase.sessionHistoryProcessingCount}
              failedCount={audioCase.sessionHistoryFailedCount}
              loading={audioCase.sessionHistoryLoading}
              error={audioCase.sessionHistoryError}
              hasMore={audioCase.sessionHistoryHasMore}
              viewingSessionId={audioCase.viewingHistorySessionId || audioCase.sessionId}
              openingSessionId={openingHistorySessionId}
              onOpenSession={handleOpenHistorySession}
              onDownloadSession={handleDownloadHistorySession}
              downloadingSessionId={downloadingHistorySessionId}
              onLoadMore={handleLoadMoreHistory}
              onClose={handleToggleHistory}
            />
          </div>
        )}

        {audioCase.openedFromHistory && (
          <div className="ac-history-viewing">
            <div className="ac-history-viewing__copy">
              <i className="ri-history-line me-1" aria-hidden="true" />
              Viewing
              {' '}
              <strong>
                {viewingHistorySession
                  ? formatAudioCaseSessionDate(viewingHistorySession.enteredDate)
                  : 'a previous session'}
              </strong>
              {audioCase.status === 'failed'
                ? '. This analysis failed — start a new recording when ready.'
                : audioCase.status === 'processing' || audioCase.status === 'uploading'
                  ? '. Tracking progress for this session.'
                  : '. Conversation, summary, and rubrics below belong to this recording.'}
            </div>
            <div className="ac-history-viewing__actions">
              {viewingHistorySession?.hasAudioFile && (
                <button
                  type="button"
                  className="btn btn-sm ac-btn-secondary"
                  onClick={() => handleDownloadHistorySession(viewingHistorySession)}
                  disabled={downloadingHistorySessionId === viewingHistorySession.sessionId}
                >
                  <i className={downloadingHistorySessionId === viewingHistorySession.sessionId
                    ? 'ri-loader-4-line ac-history-card__spin'
                    : 'ri-download-2-line'}
                  />
                  {downloadingHistorySessionId === viewingHistorySession.sessionId
                    ? 'Downloading…'
                    : 'Download audio file'}
                </button>
              )}
              <button type="button" className="btn btn-sm ac-btn-primary" onClick={handleStartNewCase}>
                New recording
              </button>
            </div>
          </div>
        )}

        {audioCase.restoredFromServer && analysisComplete && !audioCase.openedFromHistory && (
          <Alert color="success" className="py-2 mb-3">
            Showing results from a previous analysis. Use Clear to start a new case.
          </Alert>
        )}

        {analysisComplete && captureCollapsed ? (
          <div className="ac-capture ac-capture--collapsed">
            <div className="d-flex align-items-center gap-2 flex-wrap min-w-0">
              <span className="badge bg-success-subtle text-success">Audio ready</span>
              <span className="small text-truncate" title={readyLabel}>{readyLabel}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm ac-btn-ghost"
              onClick={() => setCaptureCollapsed(false)}
            >
              Change audio
            </button>
          </div>
        ) : (
          <div className="ac-workbench">
            <section className="ac-workbench-card ac-workbench-card--capture">
              <div className="ac-step-label">1 · Capture</div>
              <div className="ac-capture ac-capture--embedded">
                {analysisComplete && (
                  <div className="d-flex justify-content-end mb-2">
                    <button type="button" className="btn btn-sm ac-btn-ghost" onClick={() => setCaptureCollapsed(true)}>
                      Hide capture
                    </button>
                  </div>
                )}
                <Nav className="ac-source-tabs">
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeSourceTab === 'record' })}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveSourceTab('record');
                      }}
                    >
                      <i className="ri-record-circle-line" />
                      Record live
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={classnames({ active: activeSourceTab === 'upload' })}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveSourceTab('upload');
                      }}
                    >
                      <i className="ri-upload-2-line" />
                      Upload file
                    </NavLink>
                  </NavItem>
                </Nav>

                <TabContent activeTab={activeSourceTab}>
                  <TabPane tabId="record">
                    <div className={classnames('ac-studio', {
                      'is-idle': !isRecording && !localBlob,
                      'is-live': isRecording && !isPaused,
                      'is-paused': isRecording && isPaused,
                      'is-ready': !isRecording && Boolean(localBlob),
                    })}
                    >
                      <div className="ac-studio__bar">
                        <div className="ac-studio__stage">
                          <div className="ac-studio__orb" aria-hidden="true">
                            <i className={isRecording ? 'ri-mic-fill' : 'ri-mic-line'} />
                          </div>
                          <div className="ac-studio__copy">
                            <div className="ac-studio__timer">{formatDuration(durationMs)}</div>
                            <span className={classnames('ac-studio__status', {
                              'is-live': isRecording && !isPaused,
                              'is-paused': isRecording && isPaused,
                              'is-ready': !isRecording && Boolean(localBlob),
                            })}
                            >
                              {isRecording ? (isPaused ? 'Paused' : 'Recording') : (localBlob ? 'Ready' : 'Idle')}
                            </span>
                          </div>
                        </div>
                        <div className="ac-studio__controls">
                          {!isRecording && !localBlob && (
                            <button type="button" className="ac-studio-btn ac-studio-btn--record" onClick={start}>
                              <i className="ri-record-circle-fill" />
                              Start recording
                            </button>
                          )}
                          {isRecording && !isPaused && (
                            <button type="button" className="ac-studio-btn ac-studio-btn--pause" onClick={pause}>
                              <i className="ri-pause-circle-fill" />
                              Pause
                            </button>
                          )}
                          {isRecording && isPaused && (
                            <button type="button" className="ac-studio-btn ac-studio-btn--resume" onClick={resume}>
                              <i className="ri-play-circle-fill" />
                              Resume
                            </button>
                          )}
                          {isRecording && (
                            <button type="button" className="ac-studio-btn ac-studio-btn--stop" onClick={handleStopRecording}>
                              <i className="ri-stop-circle-fill" />
                              Stop
                            </button>
                          )}
                          {!isRecording && localBlob && (
                            <button
                              type="button"
                              className="ac-studio-btn ac-studio-btn--reset"
                              onClick={() => { resetRecorder(); }}
                            >
                              <i className="ri-refresh-line" />
                              Re-record
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ac-studio__wave" aria-hidden="true">
                        {(isRecording ? waveformLevels : IDLE_WAVE_PATTERN).map((level, index) => (
                          <span
                            key={`wave-${index}`}
                            className="ac-wave-bar"
                            style={{
                              '--bar-h': `${Math.max(10, Math.round(level * 100))}%`,
                              '--i': index,
                            }}
                          />
                        ))}
                      </div>
                      <p className="ac-studio__hint">
                        {isRecording
                          ? (isPaused ? 'Recording paused — resume when the patient is ready.' : 'Capturing the live conversation.')
                          : (localBlob ? 'Audio is ready. Confirm consent, then analyze.' : 'Tap Start recording when the patient is ready to speak.')}
                      </p>
                    </div>
                    {recorderError && <Alert color="warning" className="py-2 mb-0 mt-2">{recorderError}</Alert>}
                  </TabPane>

                  <TabPane tabId="upload">
                    <div
                      className={classnames('ac-uploader', {
                        'is-idle': !selectedFile && !isDraggingFile,
                        'is-dragover': isDraggingFile,
                        'is-ready': Boolean(selectedFile),
                      })}
                      onDragEnter={handleUploadDragEnter}
                      onDragOver={handleUploadDragOver}
                      onDragLeave={handleUploadDragLeave}
                      onDrop={handleUploadDrop}
                    >
                      <Input
                        innerRef={fileInputRef}
                        type="file"
                        className="ac-uploader__input"
                        accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
                        onChange={handleFileChange}
                        aria-label="Choose audio file"
                      />
                      {selectedFile ? (
                        <>
                          <div className="ac-uploader__ready">
                            <div className="ac-uploader__file">
                              <span className="ac-file-icon" aria-hidden="true">
                                <i className="ri-music-2-fill" />
                              </span>
                              <div className="min-w-0">
                                <div className="ac-uploader__filename" title={selectedFile.name}>
                                  {selectedFile.name}
                                </div>
                                <div className="ac-uploader__meta">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)}
                                  {' '}
                                  MB
                                  <span className="ac-uploader__ext">
                                    {(getExtensionFromFile(selectedFile) || 'audio').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="ac-uploader__actions">
                              <button
                                type="button"
                                className="ac-studio-btn ac-studio-btn--reset"
                                onClick={openAudioFilePicker}
                              >
                                <i className="ri-refresh-line" />
                                Replace
                              </button>
                              <button
                                type="button"
                                className="ac-studio-btn ac-studio-btn--stop"
                                onClick={clearSelectedAudioFile}
                              >
                                <i className="ri-close-line" />
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="ac-uploader__wave" aria-hidden="true">
                            {IDLE_WAVE_PATTERN.map((level, index) => (
                              <span
                                key={`upload-wave-${index}`}
                                className="ac-wave-bar"
                                style={{ '--bar-h': `${Math.max(10, Math.round(level * 100))}%` }}
                              />
                            ))}
                          </div>
                          <p className="ac-studio__hint">Audio is ready. Confirm consent, then analyze.</p>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="ac-uploader__hit"
                            onClick={openAudioFilePicker}
                          >
                            <span className="ac-uploader__orb" aria-hidden="true">
                              <span className="ac-uploader__ring" />
                              <span className="ac-uploader__ring ac-uploader__ring--delay" />
                              <i className={isDraggingFile ? 'ri-download-cloud-2-line' : 'ri-upload-cloud-2-line'} />
                            </span>
                            <span className="ac-uploader__copy">
                              <span className="ac-uploader__title">
                                {isDraggingFile ? 'Drop audio to attach' : 'Drop audio here'}
                              </span>
                              <span className="ac-uploader__subtitle">
                                or click to browse from your computer
                              </span>
                            </span>
                          </button>
                          <div className="ac-uploader__formats">
                            {AUDIO_UPLOAD_FORMATS.map((format) => (
                              <span key={format} className="ac-uploader__chip">{format}</span>
                            ))}
                            <span className="ac-uploader__limit">Max 50 MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  </TabPane>
                </TabContent>
              </div>
            </section>

            {showCaptureExpanded && (
              <section className="ac-workbench-card ac-workbench-card--analyze">
                <div className="ac-step-label">2 · Analyze</div>
                <div className="ac-analyze">
                  <p className="ac-analyze__hint">Confirm consent, choose the spoken language, then run analysis.</p>
                  <label className={classnames('ac-consent', { 'is-checked': consentGiven })} htmlFor="audio-case-consent">
                    <Input
                      type="checkbox"
                      id="audio-case-consent"
                      checked={consentGiven}
                      onChange={(event) => setConsentGiven(event.target.checked)}
                    />
                    <span>
                      Patient agrees to audio recording for clinical documentation.
                    </span>
                  </label>
                  <div className="ac-language-field">
                    <label htmlFor="audio-case-language" className="ac-language-field__label">
                      <i className="ri-translate-2" aria-hidden="true" />
                      Source language
                    </label>
                    <Select
                      inputId="audio-case-language"
                      className="ac-language-select"
                      classNamePrefix="ac-language-select"
                      options={languageOptions}
                      value={selectedLanguageOption}
                      onChange={(option) => setLanguage(option?.value ?? '')}
                      styles={audioLanguageSelectStyles}
                      isSearchable={false}
                      menuPlacement="auto"
                      menuPosition="fixed"
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      menuShouldScrollIntoView={false}
                      aria-label="Source language"
                    />
                  </div>
                  <div className="ac-primary-actions ac-primary-actions--stack">
                    <button
                      type="button"
                      className="btn btn-sm ac-btn-secondary"
                      disabled={!canDownload}
                      onClick={handleDownload}
                    >
                      <i className="ri-download-2-line" />
                      Download audio file
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm ac-btn-primary"
                      disabled={!canAnalyze}
                      onClick={handleAnalyze}
                    >
                      <i className="ri-sparkling-2-line" />
                      Analyze conversation
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        <AudioCaseProcessingStatus
          status={audioCase.status}
          progressStep={audioCase.progressStep}
          progressPercent={audioCase.progressPercent}
          elapsedSeconds={audioCase.elapsedSeconds}
          stageLabel={audioCase.stageLabel}
          engineVersion={audioCase.engineVersion}
          takingLonger={audioCase.takingLonger}
          error={audioCase.error}
          usedMockData={audioCase.usedMockData}
          onContinueWaiting={handleContinueWaiting}
        />

        {analysisComplete && (
          <>
            <div className="ac-step-label">3 · Review results</div>
            {typeof onOpenRepertorize === 'function' && (
              <div className="ac-repertorize-cta">
                <div className="ac-repertorize-cta__copy">
                  <div className="fw-semibold">
                    {repertorizationCount > 0
                      ? `${repertorizationCount} rubric${repertorizationCount === 1 ? '' : 's'} ready in Repertorize`
                      : 'Approve rubrics to add them to Repertorize'}
                  </div>
                  <small className="text-muted">
                    You can open Repertorize anytime and return here to review conversation, summary, and rubrics.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn btn-sm ac-btn-primary"
                  onClick={onOpenRepertorize}
                  disabled={repertorizationCount <= 0}
                >
                  <i className="ri-pie-chart-2-line" />
                  Open Repertorize
                  {repertorizationCount > 0 ? ` (${repertorizationCount})` : ''}
                </button>
              </div>
            )}
            <div className="ac-review-layout">
              <div className="ac-review-col ac-review-col--conversation">
                <AudioCaseConversationPanel messages={audioCase.messages} embedded />
              </div>

              <div className="ac-review-col ac-review-col--middle">
                <div className="ac-review-middle-stack">
                  <div className="ac-review-middle-stack__top">
                    <AudioCaseSummaryPanel
                      summary={audioCase.summary}
                      onAppendToHistoryNote={onAppendSummaryToHistoryNote ? handleAppendSummary : undefined}
                      embedded
                    />
                  </div>
                  <div className="ac-review-middle-stack__bottom">
                    <AudioCaseTranscriptEditor
                      transcript={audioCase.transcript}
                      onTranscriptChange={(value) => dispatch(setAudioCaseTranscript(value))}
                      onReAnalyze={handleReAnalyze}
                      reAnalyzeLoading={audioCase.reAnalyzeLoading}
                      disabled={audioCase.pollLoading}
                      embedded
                    />
                  </div>
                </div>
              </div>

              <div className="ac-review-col ac-review-col--rubrics">
                <div className="ac-col-card ac-col-card--rubrics is-embedded">
                  <div className="ac-col-card__header">
                    <div className="ac-col-card__title">
                      <span className="ac-col-card__title-icon" aria-hidden="true">
                        <i className="ri-list-check-3" />
                      </span>
                      Rubrics
                      {rubricCount > 0 && (
                        <span className="ac-col-card__badge">{rubricCount}</span>
                      )}
                    </div>
                    {messageCount > 0 && (
                      <span className="ac-col-card__meta">
                        {messageCount}
                        {' '}
                        turns
                      </span>
                    )}
                  </div>
                  <div className="ac-col-card__divider" />
                  <div className="ac-col-card__body ac-col-card__body--flush custom-scrollbar">
                    <AudioCaseRubricSuggestions
                      rubrics={audioCase.suggestedRubrics}
                      intensities={intensities}
                      onRejectRubric={handleRejectRubric}
                      onApplyAll={handleApplyAllRubrics}
                      repertorizationCount={repertorizationCount}
                      requireManualApproval={audioCase.requireManualApprovalForSuggestedRubrics}
                      engineVersion={audioCase.engineVersion}
                      rubricApprovalState={audioCase.rubricApprovalState}
                      approvedCount={audioCase.approvedRubricCount}
                      onApplyRubric={handleApplyRubric}
                      showEmptyHint
                      embedded
                    />
                    <AudioCaseConceptTimeline
                      concepts={audioCase.concepts}
                      causationLinks={audioCase.causationLinks}
                      engineVersion={audioCase.engineVersion}
                      loading={audioCase.conceptsLoading}
                      error={audioCase.conceptsError}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default AudioCasePanel;
