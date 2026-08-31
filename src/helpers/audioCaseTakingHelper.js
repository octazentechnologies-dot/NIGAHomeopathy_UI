export const ACCEPTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
];

export const ACCEPTED_AUDIO_EXTENSIONS = /\.(mp3|wav|webm|ogg|m4a|aac)$/i;

export const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const AUDIO_SOURCE_LIVE = 'LiveRecording';
export const AUDIO_SOURCE_FILE = 'FileUpload';

export const AUDIO_LANGUAGE_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'bn', label: 'Bengali' },
];

export const isAcceptedAudioFile = (file) => {
  if (!file) {
    return false;
  }
  const mimeOk = file.type && ACCEPTED_AUDIO_MIME_TYPES.includes(file.type);
  const extOk = ACCEPTED_AUDIO_EXTENSIONS.test(file.name || '');
  return mimeOk || extOk;
};

export const formatDuration = (durationMs = 0) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const mapSuggestedRubricToRepertorization = (rubric = {}) => {
  if (String(rubric.resultKind || '').toLowerCase() === 'aiclinicalconcept' || !(rubric.subSectionId > 0)) {
    return null;
  }

  return {
    rubricId: rubric.subSectionId ?? rubric.rubricId ?? rubric.subsectionId,
    rubricName: rubric.subSectionName ?? rubric.rubricName ?? rubric.subsectionName,
    sectionId: rubric.sectionId ?? null,
    remedyCountForSort: rubric.remedyCountForSort ?? rubric.remedyCount ?? 0,
    matchScore: rubric.matchScore ?? null,
    suggestedIntensityNo: rubric.suggestedIntensityNo ?? 2,
    isAiSuggested: Boolean(rubric.isAiSuggested),
  };
};

export const isAiClinicalConceptOnly = (rubric = {}) =>
  String(rubric.resultKind || '').toLowerCase() === 'aiclinicalconcept'
  || (rubric.isAiSuggested && !(rubric.subSectionId > 0));

export const formatAudioCaseSessionDate = (value) => {
  if (!value) {
    return 'unknown time';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const formatDurationFromSeconds = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds)) || Number(seconds) < 0) {
    return null;
  }
  const totalSeconds = Math.floor(Number(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainder = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

export const getAudioSessionDateGroupLabel = (value) => {
  if (!value) {
    return 'Unknown date';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfThat) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
};

export const formatAudioSessionTime = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const groupAudioSessionsByDate = (sessions = []) => {
  const groups = [];
  const indexByLabel = new Map();

  sessions.forEach((session) => {
    const label = getAudioSessionDateGroupLabel(session?.enteredDate);
    if (!indexByLabel.has(label)) {
      indexByLabel.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[indexByLabel.get(label)].items.push(session);
  });

  return groups;
};

export const getAudioSessionStatusKey = (status) => {
  const key = String(status || '').toLowerCase();
  if (key === 'completed') return 'completed';
  if (key === 'failed' || key === 'cancelled') return 'failed';
  if (key === 'processing' || key === 'uploaded' || key === 'uploading') return 'processing';
  return key || 'unknown';
};

export const describeAudioSessionSource = (audioSourceType) => {
  const key = String(audioSourceType || '').toLowerCase();
  if (key === 'filupload' || key === 'fileupload' || key === 'upload') {
    return 'Uploaded file';
  }
  return 'Live recording';
};

export const isLiveAudioSource = (audioSourceType) => {
  const key = String(audioSourceType || '').toLowerCase();
  return key !== 'fileupload' && key !== 'filupload' && key !== 'upload';
};

export const describePreviousAudioCaseSession = (session = {}) => {
  const status = String(session.status || '').toLowerCase();
  const fileName = session.audioFileName ? `"${session.audioFileName}"` : 'previous audio';
  const when = formatAudioCaseSessionDate(session.enteredDate);

  if (session.isStale) {
    if (status === 'uploaded') {
      return `${fileName} uploaded on ${when} was never processed. Start a new case.`;
    }
    return `Previous analysis from ${when} did not finish. Start a new case.`;
  }

  if (status === 'completed') {
    return `Previous analysis (${fileName}, ${when}) is available. Resume to view results or start a new case.`;
  }

  if (status === 'processing' || status === 'uploaded') {
    return `${fileName} from ${when} is still being analyzed. Resume to track progress or start a new case.`;
  }

  if (status === 'failed') {
    return `Previous analysis failed (${when}). Start a new case.`;
  }

  return `Previous audio session found (${when}). Resume or start a new case.`;
};

export const getMockAudioCaseAnalysisResult = (patientName = 'Patient') => ({
  sessionId: `mock-${Date.now()}`,
  transcript:
    'Doctor: Since when do you have this headache? Patient: About three days. It is worse in the morning. Doctor: Any nausea? Patient: Yes, with the headache.',
  messages: [
    { role: 'doctor', text: 'Since when do you have this headache?', timestamp: '00:00:08' },
    { role: 'patient', text: 'About three days. It is worse in the morning.', timestamp: '00:00:22' },
    { role: 'doctor', text: 'Any nausea?', timestamp: '00:00:35' },
    { role: 'patient', text: 'Yes, with the headache.', timestamp: '00:00:48' },
  ],
  summary: {
    chiefComplaint: `Headache for 3 days (${patientName})`,
    historyOfPresentIllness: 'Headache present for three days with morning aggravation.',
    mentals: [],
    generals: [],
    modalities: ['Worse in the morning'],
    particulars: ['Headache with nausea'],
    redFlags: [],
  },
  suggestedRubrics: [
    {
      subSectionId: 1001,
      subSectionName: 'HEAD - PAIN, MORNING',
      sectionId: 12,
      matchScore: 0.91,
      suggestedIntensityNo: 3,
      matchedFrom: 'worse in the morning',
      remedyCountForSort: 42,
    },
    {
      subSectionId: 1002,
      subSectionName: 'STOMACH - NAUSEA',
      sectionId: 18,
      matchScore: 0.84,
      suggestedIntensityNo: 2,
      matchedFrom: 'nausea with headache',
      remedyCountForSort: 35,
    },
  ],
  usedMockData: true,
});

export const buildSummaryHistoryNoteText = (summary = {}) => {
  if (!summary || typeof summary !== 'object') {
    return '';
  }

  const lines = ['--- Audio case summary ---'];
  if (summary.chiefComplaint) lines.push(`Chief complaint: ${summary.chiefComplaint}`);
  if (summary.historyOfPresentIllness) lines.push(`HPI: ${summary.historyOfPresentIllness}`);

  const appendList = (label, items = []) => {
    if (Array.isArray(items) && items.length) {
      lines.push(`${label}: ${items.join('; ')}`);
    }
  };

  appendList('Mentals', summary.mentals);
  appendList('Generals', summary.generals);
  appendList('Modalities', summary.modalities);
  appendList('Particulars', summary.particulars);
  appendList('Red flags', summary.redFlags);

  return lines.length > 1 ? lines.join('\n') : '';
};
