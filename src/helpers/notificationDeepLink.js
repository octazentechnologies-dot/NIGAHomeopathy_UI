import { UserRole } from '../Components/constants/roles';

export function isAdminPortalRole(role) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.MANAGEMENT ||
    role === UserRole.ACCOUNT ||
    String(role || '').toLowerCase() === 'account'
  );
}

/** Clinical inbox types that must not appear for Admin portal users. */
export function isClinicalNotificationType(type) {
  const t = String(type || '').toUpperCase();
  return t === 'APPOINTMENT' || t === 'PRESCRIPTION' || t === 'MEDICINE' || t === 'MARKETING';
}

export function isAdminRelevantNotification(row) {
  const type = String(row?.type || row?.Type || '').toUpperCase();
  if (isClinicalNotificationType(type)) return false;
  const text = `${row?.title || row?.Title || ''} ${row?.body || row?.Body || ''}`.toLowerCase();
  if (
    text.includes('new appointment') ||
    text.includes('booked for') ||
    text.includes('follow-up') ||
    text.includes('follow up') ||
    text.includes('rescheduled') ||
    text.includes('cancelled the visit') ||
    text.includes('carelink')
  ) {
    return false;
  }
  return true;
}

export function adminFallbackPathForType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'SUPPORT' || t === 'TICKET' || t === 'HELP') return '/admin/support-tickets';
  if (t === 'VERIFICATION' || t === 'TRUST' || t === 'CREDENTIAL' || t === 'CREDENTIALS') {
    return '/admin/trust-queue';
  }
  if (t === 'ONBOARDING' || t === 'ONBOARD') return '/admin/trust-queue';
  return '/notifications';
}

/**
 * Resolve a web-bell notification deep link for the current role.
 * Clinic users must never land on patient-only routes from "Open".
 */
export function resolveNotificationOpenPath(deepLink, role, type) {
  const raw = String(deepLink || '').trim();
  const isAdmin = isAdminPortalRole(role);
  const isDoctorClinic =
    role === UserRole.DOCTOR ||
    role === UserRole.RECEPTION;

  if (isAdmin) {
    if (raw && raw.startsWith('/')) {
      const pathOnly = raw.split('?')[0].split('#')[0];
      if (
        pathOnly === '/patientdashboard' ||
        pathOnly === '/patient/home' ||
        pathOnly.startsWith('/patient/') ||
        pathOnly === '/doctordashboard' ||
        pathOnly === '/doctor/schedule' ||
        pathOnly === '/doctor/follow-ups' ||
        pathOnly === '/index'
      ) {
        return adminFallbackPathForType(type);
      }
      return raw;
    }
    return adminFallbackPathForType(type);
  }

  if (!raw || !raw.startsWith('/')) {
    return isDoctorClinic ? '/doctordashboard' : '/notifications';
  }

  const pathOnly = raw.split('?')[0].split('#')[0];
  if (
    pathOnly === '/patientdashboard' ||
    pathOnly === '/patient/home' ||
    pathOnly.startsWith('/patient/')
  ) {
    return '/doctordashboard';
  }
  if (pathOnly === '/index') {
    return '/doctordashboard';
  }
  return raw;
}
