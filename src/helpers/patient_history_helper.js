/** Normalize list payloads from various API response shapes. */
export const extractApiList = (data) => {
    if (Array.isArray(data)) return data;
    const nested =
        data?.resultObject ??
        data?.ResultObject ??
        data?.data ??
        data?.Data ??
        data?.items ??
        data?.Items;
    if (Array.isArray(nested)) return nested;
    if (Array.isArray(nested?.items)) return nested.items;
    if (Array.isArray(nested?.Items)) return nested.Items;
    if (Array.isArray(nested?.resultObject)) return nested.resultObject;
    if (Array.isArray(nested?.ResultObject)) return nested.ResultObject;
    return [];
};

/** PatientAppointment list items use PatientAppId, not AppointmentId. */
export const getAppointmentIdFromRow = (appointment) =>
    appointment?.patientAppId
    ?? appointment?.PatientAppId
    ?? appointment?.patientAppID
    ?? appointment?.appointmentId
    ?? appointment?.AppointmentId
    ?? appointment?.patientAppointmentId
    ?? appointment?.PatientAppointmentId
    ?? null;

export const extractPrescriptionResultObject = (data) => {
    if (data?.resultObject && typeof data.resultObject === 'object') {
        return data.resultObject;
    }
    return data ?? {};
};

export const getPatientIdFromRow = (patient) =>
    patient?.patientID ?? patient?.patientId ?? null;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const appointmentDateText = (appointment) =>
    String(appointment?.appointmentDate ?? appointment?.AppointmentDate ?? '').trim();

/** yyyy-mm-dd for an appointment, or '' when the value is not a calendar date. */
export const appointmentDayKey = (appointment) => {
    const match = appointmentDateText(appointment).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
};

const todayKey = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

/** Visit history is what has already happened, including today. */
export const isVisitOnOrBeforeToday = (appointment) => {
    const day = appointmentDayKey(appointment);
    return Boolean(day) && day <= todayKey();
};

const formatVisitDate = (raw) => {
    const match = String(raw || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(raw || '').trim();
    const monthIndex = Number(match[2]) - 1;
    const month = MONTHS[monthIndex] || match[2];
    return `${Number(match[3])} ${month} ${match[1]}`;
};

const formatVisitTime = (raw) => {
    const text = String(raw || '').trim();
    if (!text) return '';
    if (/am|pm/i.test(text)) return text.replace(/\s+/g, ' ');
    const match = text.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return text;
    let hour = Number(match[1]);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${match[2]} ${suffix}`;
};

const visitStatusLabel = (status) => {
    const value = String(status || '').trim().toUpperCase();
    const labels = {
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        WAITING: 'Waiting',
        'WALK-IN': 'Walk-in',
        'E-CONSULT': 'Video consult',
        'NOT ARRIVED': 'Not arrived',
        PENDING: 'Pending',
    };
    return labels[value] || String(status || '').trim();
};

export const formatAppointmentAccordionTitle = (appointment) => {
    const date = formatVisitDate(appointmentDateText(appointment));
    const time = formatVisitTime(appointment?.appointmentTime ?? appointment?.AppointmentTime ?? '');
    const statusValue = visitStatusLabel(appointment?.status ?? appointment?.Status ?? '');
    const status = statusValue ? ` · ${statusValue}` : '';
    const payment = appointment?.paymentStatus ?? appointment?.PaymentStatus ?? '';
    const paymentText = (() => {
        const value = String(payment || '').trim().toUpperCase();
        if (!value || value === 'PENDING') return 'Payment pending';
        if (value === 'PAID' || value === 'SUCCESS') return 'Paid';
        if (value === 'UNPAID') return 'Unpaid';
        return payment;
    })();
    const paymentBadge = ` · ${paymentText}`;
    const when = [date, time].filter(Boolean).join(', ');
    if (when) return `${when}${status}${paymentBadge}`;
    return `Visit${status}${paymentBadge}`;
};

/**
 * Prescription table: one row per symptom (rubric); all medicines/descriptions
 * apply to the full symptom set and span merged cells in columns 2–3.
 */
export const buildPrescriptionTableModel = (details) => {
    const rubrics = details?.rubricDetails ?? [];
    const remedies = details?.remedyDetails ?? [];

    if (!rubrics.length && !remedies.length) {
        return null;
    }

    const symptomRows = rubrics.length
        ? rubrics.map((rubric, index) => ({
              id: `${index}`,
              symptom: rubric?.rubricName ?? '—',
          }))
        : [{ id: '0', symptom: '—' }];

    const remedyRows = remedies.map((remedy, index) => ({
        id: `${index}`,
        remedyName: remedy?.remedyName ?? '—',
        description: remedy?.description ?? '',
    }));

    return {
        symptomRows,
        remedyRows,
        rowSpan: symptomRows.length,
    };
};

/** @deprecated Use buildPrescriptionTableModel */
export const buildPrescriptionTableRows = (details) => {
    const model = buildPrescriptionTableModel(details);
    if (!model) return [];
    return model.symptomRows;
};
