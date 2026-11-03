import { getAuthSession } from './appointmentSlotHelper';

const pickNumber = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
};

/** Resolve subscription case limit from auth session, dashboard counts, or doctor row. */
export const getSubscriptionCaseLimitInfo = (counts, doctorRow) => {
  const { data: auth } = getAuthSession();
  const sources = [auth, counts, doctorRow].filter(Boolean);

  let limit = null;
  let used = null;
  let remaining = null;

  sources.forEach((source) => {
    if (limit == null) {
      limit = pickNumber(
        source.caseCount,
        source.CaseCount,
        source.allowedCaseCount,
        source.AllowedCaseCount,
        source.packageCaseCount,
        source.PackageCaseCount,
        source.maxCaseCount,
        source.MaxCaseCount
      );
    }
    if (used == null) {
      used = pickNumber(
        source.usedCaseCount,
        source.UsedCaseCount,
        source.patientCaseCount,
        source.PatientCaseCount,
        source.totalPatients,
        source.TotalPatients
      );
    }
    if (remaining == null) {
      remaining = pickNumber(
        source.remainingCaseCount,
        source.RemainingCaseCount,
        source.casesRemaining,
        source.CasesRemaining
      );
    }
  });

  if (remaining == null && limit != null && used != null) {
    remaining = Math.max(0, limit - used);
  }

  return { limit, used, remaining };
};

export const isAtOrOverCaseLimit = (currentPatientCount, limitInfo) => {
  const limit = limitInfo?.limit;
  if (limit == null || !Number.isFinite(limit) || limit <= 0) {
    return false;
  }
  const count = Number(currentPatientCount);
  if (!Number.isFinite(count)) return false;
  return count >= limit;
};
