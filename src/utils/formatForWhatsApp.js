/**
 * Converts react-draft-wysiwyg / draftjs-to-html output into WhatsApp-compatible text.
 * Replaces {{Placeholder}} tokens with values from the variables object.
 *
 * @typedef {Object} WhatsAppImageMeta
 * @property {string} src
 * @property {string} [alt]
 * @property {'data-uri'|'url'|'unknown'} type
 * @property {number} [index]
 *
 * @typedef {Object} FormatForWhatsAppResult
 * @property {string} message
 * @property {WhatsAppImageMeta[]} images
 * @property {string[]} unresolvedPlaceholders
 *
 * @typedef {Object} FormatForWhatsAppVariables
 * @property {string} [PatientName]
 * @property {string} [DoctorName]
 * @property {string} [HospitalName]
 * @property {string} [Date]
 * @property {string} [AppointmentDate]
 * @property {string} [AppointmentTime]
 * @property {string} [HealthTip]
 * @property {string} [Offer]
 * @property {string} [Message]
 */

const PLACEHOLDER_ALIASES = [
  ['{{PatientName}}', 'PatientName'],
  ['{{patient_name}}', 'PatientName'],
  ['{{DoctorName}}', 'DoctorName'],
  ['{{doctor_name}}', 'DoctorName'],
  ['{{HospitalName}}', 'HospitalName'],
  ['{{hospital_name}}', 'HospitalName'],
  ['{{Date}}', 'Date'],
  ['{{date}}', 'Date'],
  ['{{AppointmentDate}}', 'AppointmentDate'],
  ['{{appointment_date}}', 'AppointmentDate'],
  ['{{AppointmentTime}}', 'AppointmentTime'],
  ['{{appointment_time}}', 'AppointmentTime'],
  ['{{HealthTip}}', 'HealthTip'],
  ['{{health_tip}}', 'HealthTip'],
  ['{{Offer}}', 'Offer'],
  ['{{offer}}', 'Offer'],
  ['{{offer_title}}', 'Offer'],
  ['{{Message}}', 'Message'],
  ['{{message}}', 'Message'],
  ['{{ValidUntil}}', 'ValidUntil'],
  ['{{valid_until}}', 'ValidUntil'],
  ['{{Valid_Until}}', 'ValidUntil'],
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** dd-MMM-yyyy — matches offer templates (e.g. 06-Jun-2026) */
export function formatDateDdMmmYyyy(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_SHORT[d.getMonth()];
  return `${day}-${month}-${d.getFullYear()}`;
}

/** Date used in templates + API `date` field per tab */
export function getWhatsAppEffectiveDate(compose = {}, activeTab = 'services') {
  if (activeTab === 'offers') {
    return compose.validUntil || compose.messageDate || null;
  }
  return compose.messageDate || null;
}

const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'BLOCKQUOTE',
]);

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE', 'NOSCRIPT']);

const MAX_OUTPUT_LENGTH = 65536;

/**
 * @param {string} html
 * @param {FormatForWhatsAppVariables} [variables]
 * @param {{ maxLength?: number, imagePlaceholder?: string }} [options]
 * @returns {FormatForWhatsAppResult}
 */
/** Removes WhatsApp markdown markers (use only when plainTextOnly is required). */
export function stripWhatsAppMarkdownMarkers(text) {
  return String(text || '')
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/~([^~\n]+)~/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1');
}

export function formatForWhatsApp(html, variables = {}, options = {}) {
  const images = [];
  const maxLength = options.maxLength ?? MAX_OUTPUT_LENGTH;
  const imagePlaceholder = options.imagePlaceholder ?? '';
  const plainTextOnly = options.plainTextOnly === true;

  let converted = convertHtmlToWhatsAppText(String(html || ''), images, imagePlaceholder, {
    plainTextOnly,
  });

  const { text: withPlaceholders, unresolved } = replacePlaceholders(converted, variables);
  let message = cleanExcessiveWhitespace(withPlaceholders);

  if (plainTextOnly) {
    message = stripWhatsAppMarkdownMarkers(message);
  }

  if (message.length > maxLength) {
    message = message.slice(0, maxLength);
  }

  return {
    message,
    images,
    unresolvedPlaceholders: unresolved,
  };
}

/**
 * @param {FormatForWhatsAppVariables} variables
 */
export function replacePlaceholders(text, variables = {}) {
  let output = String(text);
  const unresolved = new Set();

  PLACEHOLDER_ALIASES.forEach(([token, key]) => {
    if (!output.includes(token)) return;
    const value = variables[key];
    if (value == null || String(value).trim() === '') {
      unresolved.add(token);
      return;
    }
    output = output.split(token).join(String(value));
  });

  const leftover = output.match(/\{\{[A-Za-z_]+\}\}/g);
  if (leftover) {
    leftover.forEach((t) => unresolved.add(t));
  }

  return { text: output, unresolved: [...unresolved] };
}

export function decodeHtmlEntities(text) {
  if (!text) return '';
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value.replace(/\u00a0/g, ' ');
  }
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function cleanExcessiveWhitespace(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const normalizeForCompare = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, '{{date}}')
    .trim()
    .toLowerCase();

/**
 * Removes accidental duplicate copies of the same letter (common in template HTML).
 */
export function dedupeRepeatedBlocks(text) {
  const normalized = cleanExcessiveWhitespace(text);
  if (!normalized || normalized.length < 80) return normalized;

  const len = normalized.length;
  const half = Math.floor(len / 2);
  const firstHalf = normalized.slice(0, half).trim();
  const secondHalf = normalized.slice(half).trim();

  if (firstHalf.length > 40 && normalizeForCompare(firstHalf) === normalizeForCompare(secondHalf)) {
    return firstHalf;
  }

  const dearIdx = normalized.indexOf('Dear ');
  if (dearIdx >= 0) {
    const secondDear = normalized.indexOf('Dear ', dearIdx + 5);
    if (secondDear > dearIdx + 20) {
      const beforeSecond = normalized.slice(0, secondDear).trim();
      const fromSecond = normalized.slice(secondDear).trim();
      if (
        normalizeForCompare(beforeSecond.slice(0, Math.min(120, beforeSecond.length))) ===
        normalizeForCompare(fromSecond.slice(0, Math.min(120, fromSecond.length)))
      ) {
        return beforeSecond;
      }
    }
  }

  return normalized;
}

function extractAfterImportantInformation(editor) {
  const infoMatch = editor.match(
    /(?:📢\s*)?Important Information\s*:?\s*([\s\S]*?)(?=(?:\n\n|\n)(?:For appointments|Thank you for choosing|Warm Regards)|$)/i
  );
  if (!infoMatch?.[1]) return '';

  let chunk = dedupeRepeatedBlocks(infoMatch[1].trim());
  chunk = chunk.replace(/\n(?:Warm Regards|Thank you|For appointments)[\s\S]*$/i, '').trim();
  if (chunk && !/^Dear\s/i.test(chunk) && !/^Greetings from/i.test(chunk)) {
    return chunk;
  }
  return '';
}

function editorLooksLikeFullTemplate(editor, templateText) {
  const markers = ['Greetings from', 'Warm Regards', 'Thank you for choosing', 'Effective Date', 'Important Information'];
  const hits = markers.filter((m) => editor.includes(m)).length;
  if (hits >= 2) return true;
  if (editor.includes('Important Information') && /^Dear\s/i.test(editor)) return true;
  if (templateText && /^Dear\s/i.test(editor) && editor.includes('Greetings from')) return true;
  return false;
}

/**
 * Editor body should only fill {{Message}} — not repeat the full template letter.
 */
export function resolveMessageVariable(editorPlain, templatePlain = '') {
  const editor = String(editorPlain || '').trim();
  if (!editor) return '';

  const templateText =
    typeof templatePlain === 'string' && !templatePlain.includes('<')
      ? templatePlain
      : convertHtmlToWhatsAppText(String(templatePlain || ''), [], '');

  if (editor.includes('Important Information')) {
    const fromInfo = extractAfterImportantInformation(editor);
    if (fromInfo) return fromInfo;
  }

  if (editorLooksLikeFullTemplate(editor, templateText)) {
    const blocks = editor.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    const custom = blocks.find(
      (b) =>
        !/^Dear\s/i.test(b) &&
        !/^Greetings from/i.test(b) &&
        !/^Important Information/i.test(b) &&
        !b.includes('Warm Regards') &&
        !b.includes('Thank you for choosing') &&
        !b.includes('Effective Date') &&
        !b.includes('For appointments')
    );
    if (custom) return custom;
  }

  return editor;
}

function convertHtmlToWhatsAppText(html, images, imagePlaceholder, convertOptions = {}) {
  const plainTextOnly = convertOptions.plainTextOnly === true;
  const raw = String(html || '').trim();
  if (!raw) return '';

  if (!raw.includes('<')) {
    return decodeHtmlEntities(raw);
  }

  if (typeof document !== 'undefined') {
    const root = document.createElement('div');
    root.innerHTML = raw;
    return walkNode(root, images, imagePlaceholder, { listIndex: 0, plainTextOnly }).replace(
      /\s+$/,
      ''
    );
  }

  return convertHtmlStringFallback(raw, images, imagePlaceholder, plainTextOnly);
}

function walkNode(node, images, imagePlaceholder, context) {
  if (!node) return '';

  if (node.nodeType === Node.TEXT_NODE) {
    return decodeHtmlEntities(node.nodeValue || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tag = node.tagName.toUpperCase();

  if (SKIP_TAGS.has(tag)) {
    return '';
  }

  if (tag === 'BR') {
    return '\n';
  }

  if (tag === 'IMG') {
    return registerImage(node, images, imagePlaceholder);
  }

  if (tag === 'UL') {
    return walkChildren(node, images, imagePlaceholder, context)
      .split('\n')
      .filter(Boolean)
      .map((line) => (line.startsWith('•') ? line : `• ${line.trim()}`))
      .join('\n');
  }

  if (tag === 'OL') {
    let index = 1;
    return walkChildren(node, images, imagePlaceholder, context)
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const cleaned = line.replace(/^•\s*/, '').trim();
        return `${index++}. ${cleaned}`;
      })
      .join('\n');
  }

  if (tag === 'LI') {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    return inner ? `• ${inner}` : '';
  }

  if (/^H[1-6]$/.test(tag)) {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    if (!inner) return '\n\n';
    return context.plainTextOnly ? `${inner}\n\n` : `${wrapWhatsAppBold(inner)}\n\n`;
  }

  if (tag === 'PRE') {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    if (!inner) return '';
    return context.plainTextOnly ? `${inner}\n\n` : `\`\`\`\n${inner}\n\`\`\``;
  }

  if (tag === 'CODE') {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    if (!inner) return '';
    return context.plainTextOnly ? inner : `\`${inner}\``;
  }

  if (tag === 'A') {
    const href = node.getAttribute('href') || '';
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    if (!inner) return href;
    if (!href || href === inner) return inner;
    return `${inner} (${href})`;
  }

  if (tag === 'B' || tag === 'STRONG') {
    const inner = walkChildren(node, images, imagePlaceholder, context);
    return context.plainTextOnly ? inner : wrapWhatsAppBold(inner);
  }

  if (tag === 'I' || tag === 'EM') {
    const inner = walkChildren(node, images, imagePlaceholder, context);
    return context.plainTextOnly ? inner : wrapWhatsAppItalic(inner);
  }

  if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    if (!inner) return '';
    return context.plainTextOnly ? inner : `~${inner}~`;
  }

  if (BLOCK_TAGS.has(tag)) {
    const inner = walkChildren(node, images, imagePlaceholder, context).trim();
    return inner ? `${inner}\n\n` : '\n';
  }

  return walkChildren(node, images, imagePlaceholder, context);
}

function wrapWhatsAppBold(text) {
  const trimmed = String(text).trim();
  if (!trimmed) return text;
  return `*${trimmed}*`;
}

function wrapWhatsAppItalic(text) {
  const trimmed = String(text).trim();
  if (!trimmed) return text;
  return `_${trimmed}_`;
}

function walkChildren(node, images, imagePlaceholder, context) {
  let out = '';
  node.childNodes.forEach((child) => {
    out += walkNode(child, images, imagePlaceholder, context);
  });
  return out;
}

function registerImage(node, images, imagePlaceholder) {
  const src = node.getAttribute('src') || '';
  const alt = node.getAttribute('alt') || '';
  const type = src.startsWith('data:') ? 'data-uri' : src.startsWith('http') ? 'url' : 'unknown';
  images.push({
    src,
    alt,
    type,
    index: images.length,
  });
  if (imagePlaceholder) return imagePlaceholder;
  if (alt) return `[Image: ${alt}]`;
  return '';
}

/** Lightweight fallback when document is unavailable (e.g. some test runners). */
function convertHtmlStringFallback(html, images, imagePlaceholder, plainTextOnly = false) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<img([^>]+)>/gi, (_, attrs) => {
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      const altMatch = attrs.match(/alt=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const alt = altMatch ? altMatch[1] : '';
      images.push({
        src,
        alt,
        type: src.startsWith('data:') ? 'data-uri' : 'url',
        index: images.length,
      });
      return imagePlaceholder || (alt ? `[Image: ${alt}]` : '');
    });

  if (plainTextOnly) {
    text = text
      .replace(/<\/?(b|strong|i|em|s|strike|del|code)>/gi, '')
      .replace(/<[^>]+>/g, '');
  } else {
    text = text
      .replace(/<\/?(b|strong)>/gi, '*')
      .replace(/<\/?(i|em)>/gi, '*')
      .replace(/<\/?(s|strike|del)>/gi, '~')
      .replace(/<code[^>]*>/gi, '`')
      .replace(/<\/code>/gi, '`')
      .replace(/<[^>]+>/g, '');
  }

  return decodeHtmlEntities(text);
}

/**
 * Build variable map for placeholder replacement from form + patient.
 * @param {Object} params
 */
export function buildWhatsAppVariables({
  compose = {},
  patient = null,
  activeTab = 'services',
  formattedMessage = '',
  formattedHealthTip = '',
} = {}) {
  const formatDisplayDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const effectiveDate = getWhatsAppEffectiveDate(compose, activeTab);
  const validUntilDate = compose.validUntil || null;
  const dateForOffers = formatDateDdMmmYyyy(effectiveDate);
  const dateForOtherTabs = formatDisplayDate(effectiveDate);

  return {
    PatientName: patient?.patientName || patient?.name || '',
    DoctorName: compose.doctorName || '',
    HospitalName: compose.hospitalName || 'Homeo Centrum',
    Date: activeTab === 'offers' ? dateForOffers : dateForOtherTabs,
    ValidUntil: formatDateDdMmmYyyy(validUntilDate || effectiveDate),
    AppointmentDate: formatDisplayDate(compose.appointmentDate || compose.messageDate),
    AppointmentTime: compose.appointmentTime || '',
    Offer: (compose.offerTitle || '').trim(),
    HealthTip: formattedHealthTip || formattedMessage,
    Message: formattedMessage,
  };
}

/**
 * Produces API-ready message + preview text from editor + optional template.
 *
 * - With templateID: `message` = editor snippet only (fills {{Message}}); backend merges template.
 * - Preview: single pass through templateBody with placeholders (no double merge).
 */
export function buildWhatsAppOutboundContent({
  html,
  compose = {},
  patient = null,
  activeTab = 'services',
} = {}) {
  const editorResult = formatForWhatsApp(compose.messageBody || '', {}, { imagePlaceholder: '' });
  const editorPlain = editorResult.message;

  const templateHtml = compose.templateBody || html || '';
  const templatePlain = templateHtml
    ? convertHtmlToWhatsAppText(String(templateHtml), [], '')
    : '';

  const messageVariable = resolveMessageVariable(editorPlain, templatePlain);

  const variables = buildWhatsAppVariables({
    compose,
    patient,
    activeTab,
    formattedMessage: messageVariable,
    formattedHealthTip: activeTab === 'tips' ? messageVariable : '',
  });

  const hasTemplate = Boolean(compose.templateID && compose.templateBody);

  let apiMessage = messageVariable;
  let previewMessage = messageVariable;
  let unresolvedPlaceholders = [];

  if (hasTemplate) {
    const cleanTemplate = dedupeRepeatedBlocks(String(compose.templateBody));
    const merged = formatForWhatsApp(cleanTemplate, variables);
    previewMessage = dedupeRepeatedBlocks(merged.message);
    unresolvedPlaceholders = merged.unresolvedPlaceholders;
    apiMessage = messageVariable;
  } else if (compose.templateBody) {
    const merged = formatForWhatsApp(dedupeRepeatedBlocks(String(compose.templateBody)), variables);
    apiMessage = merged.message;
    previewMessage = apiMessage;
    unresolvedPlaceholders = merged.unresolvedPlaceholders;
  } else if (editorPlain) {
    apiMessage = editorPlain;
    previewMessage = editorPlain;
  }

  return {
    message: apiMessage,
    previewMessage,
    images: editorResult.images,
    unresolvedPlaceholders,
    variables,
    editorImages: editorResult.images,
  };
}

export default formatForWhatsApp;
