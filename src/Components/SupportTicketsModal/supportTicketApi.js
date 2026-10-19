import moment from "moment";
import {
  addSupportTicketMessage,
  createSupportTicket,
  listAdminSupportTickets,
  listMySupportTickets,
  listSupportTicketMessages,
  updateSupportTicket,
} from "../../helpers/realbackend_helper";

export const TICKET_CATEGORIES = [
  { value: "billing", label: "Billing" },
  { value: "booking", label: "Booking" },
  { value: "technical", label: "Technical" },
  { value: "clinical", label: "Clinical" },
  { value: "tele", label: "Tele" },
  { value: "payment", label: "Payment" },
  { value: "assistedrequest", label: "Assisted booking" },
  { value: "other", label: "Other" },
];

export const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
export const TICKET_PRIORITIES = ["Urgent", "High", "Medium", "Low"];

const STATUS_LABEL = { OPEN: "Open", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };
const STATUS_CODE = { Open: "OPEN", "In Progress": "IN_PROGRESS", Resolved: "RESOLVED", Closed: "CLOSED" };
const PRIORITY_LABEL = { LOW: "Low", NORMAL: "Medium", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" };
const PRIORITY_CODE = { Low: "LOW", Medium: "NORMAL", High: "HIGH", Urgent: "URGENT" };

export const categoryLabel = (value) => {
  const key = String(value || "").toLowerCase().replace(/\s+/g, "");
  if (key === "assistedrequest") return "Assisted booking";
  return TICKET_CATEGORIES.find((c) => c.value === key)?.label || value || "Other";
};

export const categoryCode = (value) => {
  const key = String(value || "other").toLowerCase().replace(/\s+/g, "");
  if (key === "assistedrequest") return "assistedrequest";
  if (TICKET_CATEGORIES.some((c) => c.value === key)) return key;
  return key || "other";
};

export const statusLabel = (code) => {
  const key = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return STATUS_LABEL[key] || code || "Open";
};
export const statusCode = (label) => STATUS_CODE[label] || String(label || "OPEN").toUpperCase().replace(/[\s-]+/g, "_");
export const priorityLabel = (code) => {
  const key = String(code || "").trim().toUpperCase();
  return PRIORITY_LABEL[key] || code || "Medium";
};
export const priorityCode = (label) => PRIORITY_CODE[label] || String(label || "NORMAL").toUpperCase();

export const formatUpdated = (value) => {
  const m = moment(value);
  if (!m.isValid()) return "—";
  if (m.isSame(moment(), "day")) return m.format("hh:mm A");
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return m.format("DD MMM");
};

export const rowsOf = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.Data)) return response.Data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

export const mapTicket = (row) => {
  const ticketId = row.supportTicketId ?? row.SupportTicketId;
  const createdAt = row.createdAt ?? row.CreatedAt;
  const slaDueAt = row.slaDueAt ?? row.SlaDueAt;
  const rawCategory = row.category ?? row.Category ?? "other";
  const slaHours = slaDueAt ? Math.round(moment(slaDueAt).diff(moment(), "hours", true)) : null;
  return {
    id: `SUP${ticketId}`,
    ticketId: Number(ticketId),
    reporterUserId: row.reporterUserId ?? row.ReporterUserId,
    requesterRole: row.reporterRole ?? row.ReporterRole ?? "",
    requesterName: (row.reporterName ?? row.ReporterName ?? "").trim() || `User ${row.reporterUserId ?? row.ReporterUserId}`,
    email: row.reporterEmail ?? row.ReporterEmail ?? "",
    categoryCode: categoryCode(rawCategory),
    category: categoryLabel(rawCategory),
    subject: row.subject ?? row.Subject ?? "",
    description: row.body ?? row.Body ?? "",
    status: statusLabel(row.status ?? row.Status),
    priority: priorityLabel(row.priority ?? row.Priority),
    assigneeUserId: row.assigneeUserId ?? row.AssigneeUserId ?? null,
    createdAt,
    updatedAt: createdAt,
    updated: formatUpdated(createdAt),
    slaDueAt,
    slaHours,
  };
};

export const loadMyTickets = async () => rowsOf(await listMySupportTickets()).map(mapTicket);
export const loadAdminTickets = async () => rowsOf(await listAdminSupportTickets(null)).map(mapTicket);

export const createTicket = ({ subject, category, description }) =>
  createSupportTicket({ subject: subject.trim(), category, body: description.trim() });

export const saveTicketStatus = (ticketId, { status, priority }) =>
  updateSupportTicket(ticketId, { status: statusCode(status), priority: priorityCode(priority) });

export const loadConversation = async (ticket) => {
  const response = await listSupportTicketMessages(ticket.ticketId);
  const messages = rowsOf(response).map((m) => {
    const authorId = m.authorUserId ?? m.AuthorUserId;
    return {
      id: `m${m.supportTicketMessageId ?? m.SupportTicketMessageId}`,
      from: authorId === ticket.reporterUserId ? "requester" : "support",
      at: m.at ?? m.At,
      text: m.body ?? m.Body ?? "",
    };
  });
  const attachments = (
    Array.isArray(response?.attachments)
      ? response.attachments
      : Array.isArray(response?.Attachments)
        ? response.Attachments
        : []
  ).map((a) => ({
    name: a.fileName ?? a.FileName,
    at: a.at ?? a.At,
  }));
  const opening = ticket.description
    ? [{ id: "opening", from: "requester", at: ticket.createdAt, text: ticket.description }]
    : [];
  return { messages: [...opening, ...messages], attachments };
};

export const sendTicketMessage = (ticketId, { body, fileName }) =>
  addSupportTicketMessage(ticketId, { body, fileName: fileName || null });

export const errorText = (err, fallback) =>
  err?.data?.message || err?.message || (typeof err === "string" ? err : fallback);
