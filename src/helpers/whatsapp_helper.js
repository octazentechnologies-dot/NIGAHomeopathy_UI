import {
  sendWhatsAppHealthTipMessage,
  sendWhatsAppHospitalServiceMessage,
  sendWhatsAppOfferMessage,
  getLanguageMasters,
  getWhatsAppTemplateById,
  getWhatsAppTemplates,
} from './realbackend_helper';
import {
  buildWhatsAppOutboundContent,
  formatForWhatsApp,
  getWhatsAppEffectiveDate,
} from '../utils/formatForWhatsApp';

export const WHATSAPP_TAB_TO_CATEGORY = {
  services: 'HospitalService',
  offers: 'OffersDiscount',
  tips: 'HealthTips',
};

export const WHATSAPP_PLACEHOLDER_CHIPS = [
  '{{PatientName}}',
  '{{DoctorName}}',
  '{{HospitalName}}',
  '{{Date}}',
  '{{Message}}',
  '{{Offer}}',
  '{{HealthTip}}',
  '{{AppointmentDate}}',
  '{{AppointmentTime}}',
];

const SAMPLE_PREVIEW_VALUES_EN = {
  '{{PatientName}}': 'Rahul Patel',
  '{{patient_name}}': 'Rahul Patel',
  '{{DoctorName}}': 'Dr. Sharma',
  '{{doctor_name}}': 'Dr. Sharma',
  '{{HospitalName}}': 'Homeo Centrum',
  '{{hospital_name}}': 'Homeo Centrum',
  '{{Date}}': '15-Jun-2026',
  '{{date}}': '15-Jun-2026',
  '{{Message}}': 'Your custom message appears here.',
  '{{message}}': 'Your custom message appears here.',
  '{{Offer}}': '20% off consultation',
  '{{offer}}': '20% off consultation',
  '{{offer_title}}': '20% off consultation',
  '{{HealthTip}}': 'Drink warm water in the morning.',
  '{{health_tip}}': 'Drink warm water in the morning.',
  '{{tip_category}}': 'General Wellness',
  '{{AppointmentDate}}': '20-Jun-2026',
  '{{AppointmentTime}}': '10:30 AM',
  '{{ValidUntil}}': '30-Jun-2026',
  '{{valid_until}}': '30-Jun-2026',
};

const SAMPLE_PREVIEW_VALUES_MR = {
  '{{PatientName}}': 'राहुल पाटील',
  '{{patient_name}}': 'राहुल पाटील',
  '{{DoctorName}}': 'डॉ. शर्मा',
  '{{doctor_name}}': 'डॉ. शर्मा',
  '{{HospitalName}}': 'Homeo Centrum',
  '{{hospital_name}}': 'Homeo Centrum',
  '{{Date}}': '15-Jun-2026',
  '{{date}}': '15-Jun-2026',
  '{{Message}}': 'तुमचा संदेश येथे दिसेल.',
  '{{message}}': 'तुमचा संदेश येथे दिसेल.',
  '{{Offer}}': '२०% सूट',
  '{{offer}}': '२०% सूट',
  '{{offer_title}}': '२०% सूट',
  '{{HealthTip}}': 'सकाळी उबदार पाणी प्या.',
  '{{health_tip}}': 'सकाळी उबदार पाणी प्या.',
  '{{tip_category}}': 'सामान्य आरोग्य',
  '{{AppointmentDate}}': '20-Jun-2026',
  '{{AppointmentTime}}': '10:30 AM',
  '{{ValidUntil}}': '30-Jun-2026',
  '{{valid_until}}': '30-Jun-2026',
};

export const WHATSAPP_LANGUAGE_MISMATCH_MESSAGE =
  'Selected template does not match the chosen language';

export const normalizeLanguageMasters = (response) => {
  if (Array.isArray(response)) {
    return response.filter((item) => item && item.isDeleted !== true);
  }
  if (Array.isArray(response?.resultObject)) {
    return response.resultObject.filter((item) => item && item.isDeleted !== true);
  }
  if (Array.isArray(response?.data)) {
    return response.data.filter((item) => item && item.isDeleted !== true);
  }
  return [];
};

export const resolveDefaultLanguage = (languages = []) => {
  const list = Array.isArray(languages) ? languages : [];
  const english = list.find(
    (lang) => String(lang?.languageName || '').trim().toLowerCase() === 'english'
  );
  return english || list[0] || null;
};

export const isMarathiLanguage = (language) =>
  String(language?.languageName || '').trim().toLowerCase().includes('marathi');

export const getSamplePreviewValues = (language) =>
  isMarathiLanguage(language) ? SAMPLE_PREVIEW_VALUES_MR : SAMPLE_PREVIEW_VALUES_EN;

export const fetchWhatsAppLanguages = async () => {
  const response = await getLanguageMasters();
  return normalizeLanguageMasters(response);
};

export const isWhatsAppLanguageMismatchError = (message) =>
  String(message || '').toLowerCase().includes('does not match the chosen language');

export const getWhatsAppAuthContext = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const data = auth?.data || auth;
    const userId = data?.userId || auth?.userId || data?.user?.userId || data?.user?.id;
    const userName = data?.userName || auth?.userName || data?.user?.userName || '';
    const doctorID =
      data?.doctorID ??
      data?.doctorId ??
      auth?.doctorID ??
      auth?.doctorId ??
      null;
    return { auth, userId, userName, doctorID: doctorID != null ? Number(doctorID) : null };
  } catch {
    return { auth: {}, userId: null, userName: '', doctorID: null };
  }
};

export const resolveDoctorID = (doctorList) => {
  const { doctorID, userName } = getWhatsAppAuthContext();
  if (Number.isFinite(doctorID) && doctorID > 0) {
    return { doctorID, doctorName: userName };
  }
  const first = Array.isArray(doctorList) ? doctorList[0] : null;
  const fromList = first?.doctorID ?? first?.doctorId;
  return {
    doctorID: fromList != null ? Number(fromList) : null,
    doctorName: first?.doctorName || userName || '',
  };
};

/** @deprecated Prefer formatForWhatsApp — kept for short plain-text fallbacks */
export const htmlToPlainMessage = (html) => {
  return formatForWhatsApp(html || '', {}).message;
};

export const formatMessageForWhatsAppApi = (html, compose, patient, activeTab) => {
  const outbound = buildWhatsAppOutboundContent({
    html: compose.templateBody || html,
    compose,
    patient,
    activeTab,
  });
  return outbound;
};

export const formatDateForWhatsAppApi = (date) => {
  if (!date) return undefined;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const normalizePatientContactNumber = (mobile) => {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

export const patientHasWhatsAppOptIn = (patient) => {
  if (!patient) return false;
  const optIn = patient.isWhatsAppOptIn ?? patient.IsWhatsAppOptIn;
  return optIn === true || optIn === 1 || optIn === '1';
};

export const resolveTemplatePreview = (templateBody, overrides = {}, language = null) => {
  if (!templateBody) return '';
  const samples = getSamplePreviewValues(language);
  const variables = {
    PatientName: overrides['{{PatientName}}'] ?? samples['{{PatientName}}'],
    DoctorName: overrides['{{DoctorName}}'] ?? overrides['{{doctor_name}}'] ?? samples['{{DoctorName}}'],
    HospitalName: overrides['{{HospitalName}}'] ?? overrides['{{hospital_name}}'] ?? samples['{{HospitalName}}'],
    Date: overrides['{{Date}}'] ?? overrides['{{date}}'] ?? samples['{{Date}}'],
    Message: overrides['{{Message}}'] ?? overrides['{{message}}'] ?? samples['{{Message}}'],
    Offer: overrides['{{Offer}}'] ?? overrides['{{offer}}'] ?? samples['{{Offer}}'],
    HealthTip: overrides['{{HealthTip}}'] ?? overrides['{{health_tip}}'] ?? samples['{{HealthTip}}'],
    AppointmentDate: overrides['{{AppointmentDate}}'] ?? samples['{{AppointmentDate}}'],
    AppointmentTime: overrides['{{AppointmentTime}}'] ?? samples['{{AppointmentTime}}'],
    ValidUntil: overrides['{{ValidUntil}}'] ?? overrides['{{valid_until}}'] ?? samples['{{ValidUntil}}'],
  };
  return formatForWhatsApp(String(templateBody), variables).message;
};

export const fileToImageBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      reject(new Error('Only JPEG, PNG, or WEBP images are allowed (max 5 MB).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image must be 5 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

export const fetchWhatsAppTemplatesForCategory = async (templateCategory, languageId) => {
  const params = {
    templateCategory,
    isActive: true,
    pageNumber: 1,
    pageSize: 50,
  };
  if (languageId != null && languageId !== '') {
    params.languageId = Number(languageId);
  }
  const response = await getWhatsAppTemplates(params);
  if (!response?.success) {
    throw new Error(response?.message || 'Failed to load templates.');
  }
  return Array.isArray(response.resultObject) ? response.resultObject : [];
};

export const fetchWhatsAppTemplateDetail = async (templateID) => {
  const response = await getWhatsAppTemplateById(templateID);
  if (!response?.success) {
    throw new Error(response?.message || 'Failed to load template.');
  }
  return response.resultObject;
};

const baseSendFields = async (compose, doctorID, patient, activeTab, languageId) => {
  const fileBase64 = await fileToImageBase64(compose.attachment);
  const outbound = buildWhatsAppOutboundContent({
    html: compose.templateBody,
    compose,
    patient,
    activeTab,
  });

  let imageBase64 = fileBase64 || null;
  const embedded = outbound.images?.find((img) => img.type === 'data-uri');
  if (!imageBase64 && embedded?.src?.startsWith('data:')) {
    imageBase64 = embedded.src;
  }

  return {
    doctorID,
    languageId: languageId != null ? Number(languageId) : undefined,
    templateID: compose.templateID,
    doctorName: compose.doctorName || undefined,
    hospitalName: compose.hospitalName || 'Homeo Centrum',
    date: formatDateForWhatsAppApi(getWhatsAppEffectiveDate(compose, activeTab)),
    imageBase64,
    outbound,
  };
};

export const buildHospitalSendPayload = async (compose, doctorID, isBulk, languageId) => {
  const patient = compose.selectedPatient?.raw ?? null;
  const base = await baseSendFields(compose, doctorID, patient, 'services', languageId);
  const message = base.outbound.message;
  if (isBulk) {
    return {
      doctorID: base.doctorID,
      languageId: base.languageId,
      templateID: base.templateID,
      doctorName: base.doctorName,
      hospitalName: base.hospitalName,
      date: base.date,
      imageBase64: base.imageBase64,
      individual: false,
      bulk: true,
      message,
    };
  }
  return {
    doctorID: base.doctorID,
    languageId: base.languageId,
    templateID: base.templateID,
    doctorName: base.doctorName,
    hospitalName: base.hospitalName,
    date: base.date,
    imageBase64: base.imageBase64,
    individual: true,
    bulk: false,
    patientContactNumber: normalizePatientContactNumber(patient?.mobileNo),
    patientName: patient?.patientName,
    message,
  };
};

export const buildOfferSendPayload = async (compose, doctorID, isBulk, languageId) => {
  const patient = compose.selectedPatient?.raw ?? null;
  const base = await baseSendFields(compose, doctorID, patient, 'offers', languageId);
  const offer = (compose.offerTitle || '').trim();
  const message = base.outbound.message || undefined;
  if (isBulk) {
    return {
      doctorID: base.doctorID,
      languageId: base.languageId,
      templateID: base.templateID,
      doctorName: base.doctorName,
      hospitalName: base.hospitalName,
      date: base.date,
      imageBase64: base.imageBase64,
      individual: false,
      bulk: true,
      offer,
      message,
    };
  }
  const payload = {
    doctorID: base.doctorID,
    languageId: base.languageId,
    templateID: base.templateID,
    doctorName: base.doctorName,
    hospitalName: base.hospitalName,
    date: base.date,
    imageBase64: base.imageBase64,
    individual: true,
    bulk: false,
    offer,
    message,
  };
  const patientID = patient?.patientID ?? patient?.patientId;
  if (patientID != null) {
    payload.patientID = patientID;
  } else {
    payload.patientContactNumber = normalizePatientContactNumber(patient?.mobileNo);
  }
  return payload;
};

export const buildHealthTipSendPayload = async (compose, doctorID, isBulk, languageId) => {
  const patient = compose.selectedPatient?.raw ?? null;
  const base = await baseSendFields(compose, doctorID, patient, 'tips', languageId);
  const healthTip = base.outbound.message;
  const message = (compose.healthTipNote || '').trim() || undefined;
  if (isBulk) {
    return {
      doctorID: base.doctorID,
      languageId: base.languageId,
      templateID: base.templateID,
      doctorName: base.doctorName,
      hospitalName: base.hospitalName,
      date: base.date,
      imageBase64: base.imageBase64,
      individual: false,
      bulk: true,
      healthTip,
      message,
    };
  }
  const payload = {
    doctorID: base.doctorID,
    languageId: base.languageId,
    templateID: base.templateID,
    doctorName: base.doctorName,
    hospitalName: base.hospitalName,
    date: base.date,
    imageBase64: base.imageBase64,
    individual: true,
    bulk: false,
    healthTip,
    message,
  };
  const patientID = patient?.patientID ?? patient?.patientId;
  if (patientID != null) {
    payload.patientID = patientID;
  } else {
    payload.patientContactNumber = normalizePatientContactNumber(patient?.mobileNo);
  }
  return payload;
};

export const sendWhatsAppForTab = async (activeTab, payload) => {
  if (activeTab === 'services') {
    return sendWhatsAppHospitalServiceMessage(payload);
  }
  if (activeTab === 'offers') {
    return sendWhatsAppOfferMessage(payload);
  }
  return sendWhatsAppHealthTipMessage(payload);
};

export const formatSendResultHtml = (response, isBulk) => {
  const ro = response?.resultObject || {};
  const results = Array.isArray(ro.results) ? ro.results : [];

  if (isBulk && response?.success) {
    return `
      <div style="text-align:left">
        <p>${response.message || 'Bulk messages queued.'}</p>
        <ul style="margin:8px 0 0 18px;padding:0">
          <li><b>Queued:</b> ${ro.totalQueued ?? 0}</li>
          ${ro.campaignID != null ? `<li><b>Campaign ID:</b> ${ro.campaignID}</li>` : ''}
          ${ro.bulkJobId ? `<li><b>Job ID:</b> ${ro.bulkJobId}</li>` : ''}
        </ul>
      </div>`;
  }

  if (results.length > 0) {
    const rows = results
      .map(
        (r) =>
          `<tr>
            <td>${r.patientName || '—'}</td>
            <td>${r.mobileNumber || '—'}</td>
            <td>${r.success ? '✓ Sent' : `✗ ${r.errorMessage || 'Failed'}`}</td>
          </tr>`
      )
      .join('');
    return `
      <div style="text-align:left">
        <p>${response?.message || ''}</p>
        <p><b>Sent:</b> ${ro.totalSent ?? 0} &nbsp; <b>Failed:</b> ${ro.totalFailed ?? 0}</p>
        <table style="width:100%;font-size:13px;margin-top:8px;border-collapse:collapse">
          <thead><tr><th align="left">Patient</th><th align="left">Mobile</th><th align="left">Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  return `<p style="text-align:left">${response?.message || 'Request completed.'}</p>`;
};

export {
  buildWhatsAppOutboundContent,
  formatForWhatsApp,
  buildWhatsAppVariables,
  dedupeRepeatedBlocks,
  resolveMessageVariable,
  stripWhatsAppMarkdownMarkers,
  getWhatsAppEffectiveDate,
  formatDateDdMmmYyyy,
} from '../utils/formatForWhatsApp';
