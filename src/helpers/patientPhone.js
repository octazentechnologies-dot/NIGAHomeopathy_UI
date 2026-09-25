/** Patient phone for call / WhatsApp. Never use a fake clinic sample number. */
export const FALLBACK_PATIENT_PHONE = '0000000000';

export const digitsOnlyPhone = (value) => String(value ?? '').replace(/\D/g, '');

export const patientDialNumber = (mobile) => {
  const digits = digitsOnlyPhone(mobile);
  return digits || FALLBACK_PATIENT_PHONE;
};

export const patientCallHref = (mobile) => `tel:${patientDialNumber(mobile)}`;

export const patientWhatsAppHref = (mobile) => `https://wa.me/${patientDialNumber(mobile)}`;
