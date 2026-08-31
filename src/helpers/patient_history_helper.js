/** Normalize list payloads from various API response shapes. */
export const extractApiList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.resultObject)) return data.resultObject;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
};

export const extractPrescriptionResultObject = (data) => {
    if (data?.resultObject && typeof data.resultObject === 'object') {
        return data.resultObject;
    }
    return data ?? {};
};

export const getPatientIdFromRow = (patient) =>
    patient?.patientID ?? patient?.patientId ?? null;

export const formatAppointmentAccordionTitle = (appointment) => {
    const date = appointment?.appointmentDate ?? '';
    const time = appointment?.appointmentTime ?? '';
    const status = appointment?.status ? ` (${appointment.status})` : '';
    if (date && time) return `${date} : ${time}${status}`;
    if (date) return `${date}${status}`;
    return `Appointment${status}` || 'Appointment';
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
