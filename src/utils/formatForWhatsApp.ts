/**
 * TypeScript mirror of formatForWhatsApp.js (reference / IDE support).
 * Runtime import should use `./formatForWhatsApp.js`.
 */

export interface WhatsAppImageMeta {
  src: string;
  alt?: string;
  type: 'data-uri' | 'url' | 'unknown';
  index?: number;
}

export interface FormatForWhatsAppVariables {
  PatientName?: string;
  DoctorName?: string;
  HospitalName?: string;
  Date?: string;
  AppointmentDate?: string;
  AppointmentTime?: string;
  HealthTip?: string;
  Offer?: string;
  Message?: string;
}

export interface FormatForWhatsAppResult {
  message: string;
  images: WhatsAppImageMeta[];
  unresolvedPlaceholders: string[];
}

export interface FormatForWhatsAppOptions {
  maxLength?: number;
  imagePlaceholder?: string;
  /** When true, strip *bold* / _italic_ markers and send plain text only. */
  plainTextOnly?: boolean;
}

export interface LanguageMaster {
  languageId: number;
  languageName: string;
  description?: string;
  isDeleted?: boolean;
}

export interface WhatsAppTemplateListItem {
  templateID: number;
  templateName: string;
  templateCategory: string;
  languageId: number;
  languageName?: string;
  description?: string;
  isActive?: boolean;
  enteredDate?: string;
  changedDate?: string | null;
}

export interface WhatsAppSendRequestBase {
  doctorID: number;
  templateID?: number;
  languageId?: number;
  individual?: boolean;
  bulk?: boolean;
}

export declare function stripWhatsAppMarkdownMarkers(text: string): string;
export declare function formatDateDdMmmYyyy(date: Date | string | null | undefined): string;
export declare function getWhatsAppEffectiveDate(
  compose?: Record<string, unknown>,
  activeTab?: string
): Date | string | null;

export declare function formatForWhatsApp(
  html: string,
  variables?: FormatForWhatsAppVariables,
  options?: FormatForWhatsAppOptions
): FormatForWhatsAppResult;

export declare function replacePlaceholders(
  text: string,
  variables?: FormatForWhatsAppVariables
): { text: string; unresolved: string[] };

export declare function decodeHtmlEntities(text: string): string;

export declare function cleanExcessiveWhitespace(text: string): string;

export declare function buildWhatsAppVariables(params?: {
  compose?: Record<string, unknown>;
  patient?: Record<string, unknown> | null;
  activeTab?: string;
  formattedMessage?: string;
  formattedHealthTip?: string;
}): FormatForWhatsAppVariables;

export declare function buildWhatsAppOutboundContent(params?: {
  html?: string;
  compose?: Record<string, unknown>;
  patient?: Record<string, unknown> | null;
  activeTab?: string;
}): FormatForWhatsAppResult & {
  variables: FormatForWhatsAppVariables;
  editorImages: WhatsAppImageMeta[];
};
