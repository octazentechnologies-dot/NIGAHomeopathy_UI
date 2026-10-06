import moment from "moment";

const STORAGE_KEY = "niga.whatsappCampaigns.v1";

export const CAMPAIGN_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  QUEUED: "queued",
  COMPLETED: "completed",
  FAILED: "failed",
};

export const STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  queued: "Queued",
  completed: "Completed",
  failed: "Failed",
};

export const CATEGORIES = [
  { id: "HospitalService", label: "Hospital service" },
  { id: "OffersDiscount", label: "Offer / discount" },
  { id: "HealthTips", label: "Health tip" },
];

export const AUDIENCES = [
  { id: "all", label: "All Patients", hint: "Every patient with WhatsApp opt-in", estimate: 4200, icon: "ri-group-line" },
  { id: "existing", label: "Existing Patients", hint: "Patients with at least one past visit", estimate: 5800, icon: "ri-user-heart-line" },
  { id: "new", label: "New Patients", hint: "Registered in the last 30 days", estimate: 640, icon: "ri-user-add-line" },
  { id: "today", label: "Today's Appointments", hint: "Patients booked for today", estimate: 2100, icon: "ri-calendar-check-line" },
  { id: "consulted", label: "Consulted Patients", hint: "Consulted in the last 90 days", estimate: 3120, icon: "ri-stethoscope-line" },
  { id: "inactive", label: "Inactive Patients", hint: "No visit in the last 6 months", estimate: 1480, icon: "ri-time-line" },
];

export const SAMPLE_TEMPLATES = {
  HospitalService: [
    { templateID: "s-hs-1", templateName: "Follow-up Reminder", templateBody: "Hello {{PatientName}}, this is a reminder for your follow-up with {{DoctorName}} at {{HospitalName}} on {{AppointmentDate}}." },
    { templateID: "s-hs-2", templateName: "Appointment Reminder", templateBody: "Hi {{PatientName}}, your appointment with {{DoctorName}} is on {{AppointmentDate}} at {{AppointmentTime}}. Reply YES to confirm." },
    { templateID: "s-hs-3", templateName: "Patient Feedback", templateBody: "Dear {{PatientName}}, thank you for visiting {{HospitalName}}. Please share your feedback about your consultation with {{DoctorName}}." },
  ],
  OffersDiscount: [
    { templateID: "s-of-1", templateName: "New Service Promotion", templateBody: "Hello {{PatientName}}, {{HospitalName}} now offers {{Offer}}. Book your visit before {{ValidUntil}}." },
    { templateID: "s-of-2", templateName: "Follow-up Discount", templateBody: "Hi {{PatientName}}, get {{Offer}} on your next follow-up consultation. Valid until {{ValidUntil}}." },
  ],
  HealthTips: [
    { templateID: "s-ht-1", templateName: "Health Tips - Homeopathy", templateBody: "Hello {{PatientName}}, today's health tip from {{DoctorName}}: {{HealthTip}}" },
    { templateID: "s-ht-2", templateName: "Seasonal Care Tips", templateBody: "Dear {{PatientName}}, stay healthy this season. {{HealthTip}} - Team {{HospitalName}}" },
  ],
};

const daysAgo = (days, hour = 10) => moment().subtract(days, "days").hour(hour).minute(0).second(0).toISOString();
const daysAhead = (days, hour = 10) => moment().add(days, "days").hour(hour).minute(0).second(0).toISOString();

const completed = (id, name, audience, category, templateName, sent, delivered, failed, optOuts, days) => ({
  id,
  name,
  audience,
  category,
  templateName,
  templateBody: "",
  targeted: Math.round(sent / 0.8),
  sent,
  delivered,
  failed,
  optOuts,
  status: CAMPAIGN_STATUS.COMPLETED,
  scheduledAt: null,
  sentAt: daysAgo(days),
  createdAt: daysAgo(days + 1),
  sample: true,
});

const SEED = [
  completed("cmp-1", "Follow-up Reminder", "all", "HospitalService", "Follow-up Reminder", 3200, 3100, 60, 30, 2),
  completed("cmp-2", "New Service Promotion", "existing", "OffersDiscount", "New Service Promotion", 5800, 5600, 120, 80, 5),
  completed("cmp-3", "Health Tips - Homeopathy", "all", "HealthTips", "Health Tips - Homeopathy", 4200, 4050, 90, 60, 8),
  completed("cmp-4", "Appointment Reminder", "today", "HospitalService", "Appointment Reminder", 2100, 2050, 30, 10, 1),
  completed("cmp-5", "Patient Feedback", "consulted", "HospitalService", "Patient Feedback", 3120, 3000, 70, 40, 12),
  {
    ...completed("cmp-6", "Monsoon Wellness Offer", "inactive", "OffersDiscount", "Follow-up Discount", 0, 0, 0, 0, 0),
    targeted: 1480,
    status: CAMPAIGN_STATUS.SCHEDULED,
    scheduledAt: daysAhead(2, 9),
    sentAt: null,
  },
  {
    ...completed("cmp-7", "Seasonal Care Tips", "all", "HealthTips", "Seasonal Care Tips", 0, 0, 0, 0, 0),
    targeted: 4200,
    status: CAMPAIGN_STATUS.SCHEDULED,
    scheduledAt: daysAhead(5, 18),
    sentAt: null,
  },
  {
    ...completed("cmp-8", "Clinic Timing Update", "existing", "HospitalService", "Appointment Reminder", 1200, 380, 820, 0, 15),
    status: CAMPAIGN_STATUS.FAILED,
    failureReason: "WhatsApp template was rejected by Meta for this sender number.",
  },
  {
    ...completed("cmp-9", "New Patient Welcome", "new", "HospitalService", "Follow-up Reminder", 0, 0, 0, 0, 0),
    targeted: 640,
    status: CAMPAIGN_STATUS.DRAFT,
    sentAt: null,
  },
];

export const readCampaigns = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
};

export const writeCampaigns = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const statusFromApi = (row, failed, sent) => {
  const text = String(pick(row, "status", "Status", "campaignStatus", "CampaignStatus") || "").toLowerCase();
  if (/schedul/.test(text)) return CAMPAIGN_STATUS.SCHEDULED;
  if (/queue|progress|sending|pending/.test(text)) return CAMPAIGN_STATUS.QUEUED;
  if (/fail|error/.test(text)) return CAMPAIGN_STATUS.FAILED;
  if (/draft/.test(text)) return CAMPAIGN_STATUS.DRAFT;
  if (sent && failed / sent > 0.5) return CAMPAIGN_STATUS.FAILED;
  return CAMPAIGN_STATUS.COMPLETED;
};

/** Maps a /WhatsApp/GetCampaignHistory row to the campaign shape used by the page. */
export const normalizeApiCampaign = (row, index) => {
  const sent = toNumber(pick(row, "totalSent", "TotalSent", "sentCount", "SentCount", "totalRecipients", "TotalRecipients"));
  const delivered = toNumber(pick(row, "deliveredCount", "DeliveredCount", "totalDelivered", "TotalDelivered", "successCount", "SuccessCount"));
  const failed = toNumber(pick(row, "failedCount", "FailedCount", "totalFailed", "TotalFailed"));
  const category = pick(row, "templateCategory", "TemplateCategory", "category", "Category") || "HospitalService";
  return {
    id: `api-${pick(row, "campaignId", "CampaignId", "campaignID", "CampaignID", "id") ?? index}`,
    apiId: pick(row, "campaignId", "CampaignId", "campaignID", "CampaignID", "id"),
    name: pick(row, "campaignName", "CampaignName", "templateName", "TemplateName", "name") || `Campaign ${index + 1}`,
    audience: pick(row, "audience", "Audience", "audienceType", "AudienceType") || "all",
    category,
    templateName: pick(row, "templateName", "TemplateName") || "",
    templateBody: pick(row, "messageBody", "MessageBody", "templateBody", "TemplateBody") || "",
    targeted: toNumber(pick(row, "totalRecipients", "TotalRecipients", "targetCount", "TargetCount")) || sent,
    sent,
    delivered,
    failed,
    optOuts: toNumber(pick(row, "optOutCount", "OptOutCount", "optOuts", "OptOuts")),
    status: statusFromApi(row, failed, sent),
    scheduledAt: pick(row, "scheduledAt", "ScheduledAt", "scheduleDate", "ScheduleDate"),
    sentAt: pick(row, "sentAt", "SentAt", "sentDate", "SentDate", "createdDate", "CreatedDate"),
    createdAt: pick(row, "createdDate", "CreatedDate", "createdAt", "CreatedAt"),
    source: "api",
  };
};

export const audienceLabel = (id) => AUDIENCES.find((a) => a.id === id)?.label || String(id || "—");

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || String(id || "—");

export const pct = (part, whole, digits = 0) => {
  if (!whole) return "0%";
  const value = (part / whole) * 100;
  return `${value.toFixed(value < 10 && digits === 0 ? 1 : digits)}%`;
};

export const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

export const formatDateTime = (value) => {
  const m = value ? moment(value) : null;
  return m && m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : "—";
};

export const campaignInitials = (name) =>
  String(name || "?")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";
