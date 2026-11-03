import moment from 'moment';
import { formatApiDate } from './appointmentSlotHelper';

const isCompletedStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  return normalized === 'COMPLETED' || normalized.includes('COMPLET');
};

/** Client-side eligibility hint; authoritative follow-up fee is set by the API on save. */
export const isEligibleForFollowUpConsultation = (patientId, appointmentDate, appointments, config) => {
  const validityDays = Number(config?.freeFollowUpDaysInClinic ?? config?.freeFollowUpDays);
  if (!patientId || !Number.isFinite(validityDays) || validityDays <= 0) {
    return false;
  }

  const targetDate = moment(formatApiDate(appointmentDate), 'YYYY-MM-DD', true);
  if (!targetDate.isValid()) return false;

  const rows = Array.isArray(appointments) ? appointments : [];
  let latestCompleted = null;

  rows.forEach((row) => {
    const rowPatientId = row?.patientId ?? row?.PatientId;
    if (Number(rowPatientId) !== Number(patientId)) return;
    if (!isCompletedStatus(row?.status ?? row?.Status)) return;

    const visitDate = moment(formatApiDate(row?.appointmentDate ?? row?.AppointmentDate), 'YYYY-MM-DD', true);
    if (!visitDate.isValid()) return;
    if (!latestCompleted || visitDate.isAfter(latestCompleted)) {
      latestCompleted = visitDate;
    }
  });

  if (!latestCompleted) return false;
  const daysSince = targetDate.startOf('day').diff(latestCompleted.startOf('day'), 'days');
  return daysSince > 0 && daysSince <= validityDays;
};
