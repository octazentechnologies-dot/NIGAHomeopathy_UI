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

export const formatAppointmentAccordionTitle = (appointment) => {
    const date = appointment?.appointmentDate ?? appointment?.AppointmentDate ?? '';
    const time = appointment?.appointmentTime ?? appointment?.AppointmentTime ?? '';
    const statusValue = appointment?.status ?? appointment?.Status ?? '';
    const status = statusValue ? ` (${statusValue})` : '';
    const payment = appointment?.paymentStatus ?? appointment?.PaymentStatus ?? '';
    const paymentBadge = payment ? ` [${payment}]` : ' [Payment pending]';
    if (date && time) return `${date} : ${time}${status}${paymentBadge}`;
    if (date) return `${date}${status}${paymentBadge}`;
    return `Appointment${status}${paymentBadge}`;
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
