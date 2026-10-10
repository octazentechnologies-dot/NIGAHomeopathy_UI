import moment from 'moment';

/** Calendar date for API — keeps selected day (no local→UTC day shift). */
export const formatCalendarDateForApi = (dateStr) => {
    if (!dateStr) return '';
    const parsed = String(dateStr).includes('T')
        ? moment(dateStr)
        : moment(dateStr, ['M/D/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
    return parsed.isValid() ? `${parsed.format('YYYY-MM-DD')}T00:00:00.000Z` : '';
};

export const formatDateOfBirthForApi = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const formatted = formatCalendarDateForApi(dateOfBirth);
    return formatted || null;
};

export const getPatientAuthContext = () => {
    const auth = JSON.parse(sessionStorage.getItem('authUser') || '{}');
    const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
    const userName = auth?.userName || auth?.user?.userName || 'USER';
    return { auth, userId, userName };
};

/** Email for edit form: prefer `mail` from /doctorDashBoard, then other patient fields. */export const getPatientEmailForEdit = (patient, appointmentList = []) => {
    if (!patient) return '';

    const fromRecord = patient.mail || patient.email || patient.emailId;
    if (fromRecord) return fromRecord;

    const patientId = patient.patientID ?? patient.patientId;
    if (patientId == null) return '';

    const dashboardMatch = (appointmentList || []).find((apt) => {
        const aptPatientId = apt.patientID ?? apt.patientId;
        return aptPatientId != null && String(aptPatientId) === String(patientId);
    });

    if (!dashboardMatch) return '';
    return dashboardMatch.mail || dashboardMatch.email || dashboardMatch.emailId || '';
};

/**
 * Build POST /patient body for create or update.
 * @param {Object} params
 * @param {Object} params.patient - Existing patient row from API
 * @param {Object} params.form - Edited form values
 * @param {boolean} [params.isCreate=false]
 */
export const buildPatientApiPayload = ({ patient = {}, form = {}, isCreate = false }) => {
    const { userId, userName } = getPatientAuthContext();
    const loggedInUser = parseInt(userId, 10) || 0;
    const now = new Date().toISOString();
    const changedBy = userName;

    const formattedDateOfBirth =
        formatDateOfBirthForApi(form.dob ?? form.dateOfBirth) ||
        formatDateOfBirthForApi(patient.dateOfBirth) ||
        now;

    const genderValue = form.gender ?? patient.gender;
    const gender =
        genderValue === 'Female' || genderValue === 1 || genderValue === '1' ? 1 : 0;

    let age = patient.age ?? 0;
    const birth = moment(formattedDateOfBirth);
    if (birth.isValid()) {
        age = moment().diff(birth, 'years');
    }

    return {
        loggedInUser,
        chiefComplaintIds: patient.chiefComplaintIds ?? 'string',
        doctorID: patient.doctorID ?? patient.doctorId ?? 0,
        patientID: isCreate ? 0 : (patient.patientID ?? 0),
        patientName: (form.patientName ?? patient.patientName ?? '').trim(),
        address: form.address ?? patient.address ?? 'string',
        // stateId: patient.stateId ?? 0,
        //countryId: patient.countryId ?? 0,
        mobileNo: form.mobile ?? form.mobileNo ?? patient.mobileNo ?? 'string',
        phoneNo: patient.phoneNo ?? form.mobile ?? form.mobileNo ?? patient.mobileNo ?? 'string',
        dateOfBirth: formattedDateOfBirth,
        gender,
        enteredBy: isCreate ? changedBy : (patient.enteredBy ?? changedBy),
        enteredDate: isCreate ? now : (patient.enteredDate ?? now),
        changedBy,
        changedDate: now,
        userId: parseInt(userId, 10) || 0,
        deleteStatus: isCreate ? false : Boolean(patient.deleteStatus ?? false),
        dateodFirstVisit: patient.dateodFirstVisit ?? patient.dateOfFirstVisit ?? now,
        refBy: form.referBy ?? patient.refBy ?? 'string',
        message: patient.message ?? 'string',
        caseId: patient.caseId ?? 0,
        age,
        mail: form.email ?? form.mail ?? patient.mail ?? patient.email ?? 'string',
    };
};

/**
 * Map backend validation keys (case-insensitive) to Create Patient form fields.
 * Returns `{ formField: message }` with the first message per field, or `{}`.
 */
const PATIENT_BACKEND_FIELD_MAP = [
    [/^(mobile_?no|mobile_?number|mobile)$/, 'mobileNo'],
    [/^(phone_?no|phone|phone_?number|alternate_?phone|additional_?phone)$/, 'phoneNo'],
    [/^(e?mail(_?id|_?address)?|mail)$/, 'email'],
    [/^(ref_?by|reference(_?by)?|referred_?by)$/, 'refBy'],
    [/^(patient_?name|full_?name|name)$/, 'patientName'],
    [/^address$/, 'address'],
    [/^(date_?of_?birth|dob|birth_?date)$/, 'dateOfBirth'],
    [/^(gender|sex)$/, 'gender'],
    [/^(country_?id|country)$/, 'countryId'],
    [/^(state_?id|state)$/, 'stateId'],
];

const normalizeBackendKey = (key) => String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const firstMessage = (value) => {
    if (Array.isArray(value)) {
        const first = value.find((v) => v != null && String(v).trim() !== '');
        return first == null ? '' : String(first).trim();
    }
    if (value != null && typeof value === 'object') {
        return firstMessage(value.message ?? value.Message ?? Object.values(value)[0]);
    }
    return String(value ?? '').trim();
};

export const extractPatientFieldErrors = (body) => {
    if (!body || typeof body !== 'object') return {};
    const raw =
        body.errors ?? body.Errors ??
        body.fieldErrors ?? body.FieldErrors ??
        body.validationErrors ?? body.ValidationErrors ?? null;
    const entries = Array.isArray(raw)
        ? raw.map((e) => [e?.field ?? e?.Field ?? e?.key ?? e?.Key, e?.message ?? e?.Message ?? e])
        : (raw && typeof raw === 'object' ? Object.entries(raw) : []);
    const mapped = {};
    entries.forEach(([key, value]) => {
        const normalized = normalizeBackendKey(key);
        if (!normalized) return;
        const match = PATIENT_BACKEND_FIELD_MAP.find(([pattern]) => pattern.test(normalized));
        if (!match || mapped[match[1]]) return;
        const message = firstMessage(value);
        if (message) mapped[match[1]] = message;
    });
    return mapped;
};

const TECHNICAL_ERROR_PATTERN = /inner exception|entity changes|entity framework|sql|stack trace|at\s+[\w.]+\(|null ?reference|object reference|unhandled|500|timed out/i;

/** Never show raw technical text: fall back to a user-friendly save message. */
export const sanitizePatientSaveMessage = (message, hasFieldErrors = false) => {
    const text = String(message || '').trim();
    if (hasFieldErrors && (!text || TECHNICAL_ERROR_PATTERN.test(text))) {
        return 'Could not save the patient. Please check the highlighted fields and try again.';
    }
    if (!text || TECHNICAL_ERROR_PATTERN.test(text)) {
        return 'Could not save the patient. Please check the details and try again.';
    }
    return text;
};
