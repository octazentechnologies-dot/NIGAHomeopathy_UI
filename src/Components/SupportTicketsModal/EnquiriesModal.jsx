import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  UncontrolledTooltip,
} from "reactstrap";
import DeleteModal from "../Common/DeleteModal";
import TicketConversationModal from "./TicketConversationModal";
import { CompactPaginationPages, PAGE_SIZE, statusBadgeClass } from "./supportShared";
import "./SupportTicketsModal.css";

const STATUSES = ["Open", "Pending", "In Progress", "Resolved", "Closed"];
const CATEGORIES = [
  "Booking",
  "Payment",
  "General",
  "Doctor",
  "Telemedicine",
  "Prescription",
  "Technical",
  "Account",
];

const STATUS_TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "new", label: "New", match: (s) => s === "Open" || s === "Pending" },
  { key: "progress", label: "In Progress", match: (s) => s === "In Progress" },
  { key: "resolved", label: "Resolved", match: (s) => s === "Resolved" || s === "Closed" },
];

const DATE_FILTERS = [
  { key: "", label: "Date" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 days" },
];

const at = (daysAgo, time) => {
  const [h, m] = time.split(":").map(Number);
  return moment().subtract(daysAgo, "days").hour(h).minute(m).second(0).toISOString();
};

const msg = (id, from, when, text, extra = {}) => ({ id, from, at: when, text, ...extra });

const buildSeedEnquiries = () => [
  {
    id: "TCK1021",
    requesterName: "Rohan Mehta",
    requesterRole: "Patient",
    email: "rohan@gmail.com",
    subject: "Booking issue",
    category: "Booking",
    priority: "High",
    status: "Open",
    slaHours: 2,
    createdAt: at(0, "09:30"),
    messages: [
      msg("m1", "requester", at(0, "09:30"),
        "I tried to book an appointment for tomorrow but the slot shows as unavailable even though it was free a minute ago."),
    ],
    attachments: [{ name: "booking_error.png", size: "132 KB" }],
  },
  {
    id: "TCK1020",
    requesterName: "Sneha Patil",
    requesterRole: "Patient",
    email: "sneha@gmail.com",
    subject: "Payment query",
    category: "Payment",
    priority: "Medium",
    status: "Pending",
    slaHours: 4,
    createdAt: at(0, "08:45"),
    messages: [
      msg("m1", "requester", at(0, "08:45"),
        "I was charged twice for my consultation on Friday. Please check and refund the extra amount."),
    ],
  },
  {
    id: "TCK1019",
    requesterName: "Amit Shah",
    requesterRole: "Patient",
    email: "amit@gmail.com",
    subject: "General query",
    category: "General",
    priority: "Low",
    status: "In Progress",
    slaHours: 4,
    createdAt: at(0, "11:20"),
    messages: [
      msg("m1", "requester", at(0, "11:20"), "What are the clinic timings on Sundays?"),
      msg("m2", "support", at(0, "11:40"),
        "Thanks for asking. We are confirming the Sunday schedule with the clinic and will update you shortly."),
    ],
  },
  {
    id: "TCK1018",
    requesterName: "Meera Joshi",
    requesterRole: "Patient",
    email: "meera@gmail.com",
    subject: "Doctor availability",
    category: "Doctor",
    priority: "Low",
    status: "Resolved",
    slaHours: 24,
    createdAt: at(1, "16:10"),
    messages: [
      msg("m1", "requester", at(1, "16:10"), "Is Dr. Nikhil available for consultation next week?"),
      msg("m2", "support", at(1, "17:05"),
        "Yes, Dr. Nikhil is available Monday to Friday, 10 AM to 6 PM. You can book directly from the app.",
        { resolved: true }),
    ],
  },
  {
    id: "TCK1017",
    requesterName: "Rahul Mehta",
    requesterRole: "Patient",
    email: "rahul@gmail.com",
    subject: "Teleconsultation",
    category: "Telemedicine",
    priority: "Medium",
    status: "Open",
    slaHours: 24,
    createdAt: at(1, "10:15"),
    messages: [
      msg("m1", "requester", at(1, "10:15"),
        "How do I join the teleconsultation? I did not receive the video call link."),
    ],
  },
  {
    id: "TCK1016",
    requesterName: "Priya Nair",
    requesterRole: "Patient",
    email: "priya@gmail.com",
    subject: "Prescription refill",
    category: "Prescription",
    priority: "Medium",
    status: "Open",
    slaHours: 24,
    createdAt: at(2, "12:30"),
    messages: [
      msg("m1", "requester", at(2, "12:30"),
        "My medicines are about to finish. Can I get a refill of my last prescription?"),
    ],
  },
  {
    id: "TCK1015",
    requesterName: "Dr. Nikhil",
    requesterRole: "Doctor",
    email: "nikhil@homeocentrum.com",
    subject: "Payment not reflecting",
    category: "Payment",
    priority: "High",
    status: "In Progress",
    slaHours: 4,
    createdAt: at(3, "10:30"),
    attachments: [{ name: "payment_screenshot.png", size: "245 KB" }],
    messages: [
      msg("m1", "requester", at(3, "10:30"),
        "I have made a payment but it is not reflecting in my account. Please check the transaction."),
      msg("m2", "support", at(3, "11:15"),
        "Thank you for reaching out. We are checking your transaction details and will update you soon."),
      msg("m3", "requester", at(3, "13:20"), "Sure, please let me know."),
    ],
  },
  {
    id: "TCK1014",
    requesterName: "Kiran Rao",
    requesterRole: "Patient",
    email: "kiran@gmail.com",
    subject: "Report download",
    category: "Technical",
    priority: "Medium",
    status: "In Progress",
    slaHours: 8,
    createdAt: at(3, "15:00"),
    messages: [
      msg("m1", "requester", at(3, "15:00"), "The download button for my lab report is not working."),
      msg("m2", "support", at(3, "16:20"),
        "Our technical team is checking this. Could you tell us which browser you are using?"),
    ],
  },
  {
    id: "TCK1013",
    requesterName: "Anjali Desai",
    requesterRole: "Patient",
    email: "anjali@gmail.com",
    subject: "Refund request",
    category: "Payment",
    priority: "Medium",
    status: "Resolved",
    slaHours: 24,
    createdAt: at(4, "09:50"),
    messages: [
      msg("m1", "requester", at(4, "09:50"), "I cancelled my appointment. When will I get the refund?"),
      msg("m2", "support", at(4, "12:10"),
        "Your refund has been processed and will reflect in 3–5 working days.", { resolved: true }),
    ],
  },
  {
    id: "TCK1012",
    requesterName: "Vikram Singh",
    requesterRole: "Patient",
    email: "vikram@gmail.com",
    subject: "Account login",
    category: "Account",
    priority: "Low",
    status: "Closed",
    slaHours: 24,
    createdAt: at(5, "18:05"),
    messages: [
      msg("m1", "requester", at(5, "18:05"), "I am unable to log in after changing my phone number."),
      msg("m2", "support", at(5, "19:00"),
        "We have updated your registered number. Please log in with the new number.", { resolved: true }),
    ],
  },
].map((e) => ({ ...e, updatedAt: e.messages[e.messages.length - 1].at }));

const formatReceived = (value) => {
  const m = moment(value);
  if (!m.isValid()) return "—";
  if (m.isSame(moment(), "day")) return m.format("hh:mm A");
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return m.format("DD MMM");
};

const matchesDateFilter = (value, filter) => {
  if (!filter) return true;
  const m = moment(value);
  if (filter === "today") return m.isSame(moment(), "day");
  if (filter === "yesterday") return m.isSame(moment().subtract(1, "day"), "day");
  if (filter === "week") return m.isAfter(moment().subtract(7, "days").startOf("day"));
  return true;
};

const slaClass = (enquiry) => {
  const unresolved = ["Open", "Pending", "In Progress"].includes(enquiry.status);
  if (!unresolved) return "";
  if (enquiry.slaHours <= 2) return "support-conv__sla support-conv__sla--danger";
  if (enquiry.slaHours <= 4 && enquiry.status !== "In Progress") {
    return "support-conv__sla support-conv__sla--warning";
  }
  return "";
};

export default function EnquiriesModal({ isOpen, toggle, onActiveCountChange }) {
  const [enquiries, setEnquiries] = useState(buildSeedEnquiries);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const viewEnquiry = useMemo(
    () => enquiries.find((e) => e.id === viewId) || null,
    [enquiries, viewId]
  );

  const tabCounts = useMemo(() => {
    const counts = {};
    STATUS_TABS.forEach((tab) => {
      counts[tab.key] = enquiries.filter((e) => tab.match(e.status)).length;
    });
    return counts;
  }, [enquiries]);

  const activeCount = tabCounts.new + tabCounts.progress;

  useEffect(() => {
    onActiveCountChange?.(activeCount);
  }, [activeCount, onActiveCountChange]);

  const hasFilters = Boolean(
    search || categoryFilter || statusFilter || dateFilter || statusTab !== "all"
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tab = STATUS_TABS.find((t) => t.key === statusTab) || STATUS_TABS[0];
    return enquiries.filter((e) => {
      if (!tab.match(e.status)) return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (!matchesDateFilter(e.createdAt, dateFilter)) return false;
      if (!q) return true;
      return [e.id, e.requesterName, e.email, e.subject, e.category]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [enquiries, statusTab, search, categoryFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, search, categoryFilter, statusFilter, dateFilter]);

  const handleClose = () => {
    setViewId(null);
    setDeleteTarget(null);
    setStatusTab("all");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setDateFilter("");
    setCurrentPage(1);
    toggle();
  };

  const handleUpdateEnquiry = (id, patch) => {
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <Modal
        size="xl"
        isOpen={isOpen}
        toggle={handleClose}
        className="patient-list-modal support-tickets-modal"
      >
        <ModalHeader className="patient-list-modal__header" toggle={handleClose}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className="ri-question-answer-line"
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">Ticket Enquiries</span>
          </span>
          <div className="patient-list-modal__header-actions">
            <div className="patient-list-modal__search">
              <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
              <Input
                size="sm"
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="support-tickets-modal__toolbar mb-2">
            <div className="support-tickets-modal__tabs" role="tablist">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={statusTab === tab.key}
                  className={`support-tickets-modal__tab${statusTab === tab.key ? " is-active" : ""}`}
                  onClick={() => setStatusTab(tab.key)}
                >
                  {tab.label} ({tabCounts[tab.key] ?? 0})
                </button>
              ))}
            </div>
            <div className="support-tickets-modal__filters">
              <div className="patient-list-modal__status-filter">
                <Input
                  type="select"
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Category"
                >
                  <option value="">Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Input>
              </div>
              <div className="patient-list-modal__status-filter">
                <Input
                  type="select"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Status"
                >
                  <option value="">Status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Input>
              </div>
              <div className="patient-list-modal__status-filter">
                <Input
                  type="select"
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  aria-label="Date"
                >
                  {DATE_FILTERS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </Input>
              </div>
            </div>
          </div>

          <div className="table-responsive patient-list-modal__table-wrap">
            <table className="table mb-0 align-middle patient-list-modal__table">
              <thead>
                <tr>
                  <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: "4%" }}>
                    #
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-hashtag" aria-hidden="true" />
                      Ticket ID
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-user-line" aria-hidden="true" />
                      Name
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-mail-line" aria-hidden="true" />
                      Email
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-file-text-line" aria-hidden="true" />
                      Subject
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-folder-line" aria-hidden="true" />
                      Category
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-time-line" aria-hidden="true" />
                      Received
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-timer-line" aria-hidden="true" />
                      SLA
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-checkbox-circle-line" aria-hidden="true" />
                      Status
                    </span>
                  </th>
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((enquiry, index) => (
                  <tr key={enquiry.id}>
                    <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                    <td className="fw-semibold text-nowrap">{enquiry.id}</td>
                    <td className="text-nowrap">
                      {enquiry.requesterName}
                      {enquiry.requesterRole === "Doctor" ? (
                        <span className="text-muted ms-1">(Doctor)</span>
                      ) : null}
                    </td>
                    <td>
                      <span className="patient-list-modal__meta">{enquiry.email}</span>
                    </td>
                    <td>{enquiry.subject}</td>
                    <td>{enquiry.category}</td>
                    <td className="text-nowrap">{formatReceived(enquiry.createdAt)}</td>
                    <td className="text-nowrap">
                      <span className={slaClass(enquiry)}>{enquiry.slaHours}h</span>
                    </td>
                    <td>
                      <span className={`badge patient-list-modal__status ${statusBadgeClass(enquiry.status)}`}>
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="dashboard-patient-action-group d-inline-flex align-items-center justify-content-end flex-nowrap gap-1">
                        <button
                          type="button"
                          id={`enq-view-${enquiry.id}`}
                          className="btn btn-sm btn-soft-primary"
                          aria-label="View"
                          onClick={() => setViewId(enquiry.id)}
                        >
                          <i className="ri-eye-fill" />
                        </button>
                        <UncontrolledTooltip placement="top" target={`enq-view-${enquiry.id}`}>
                          View &amp; Reply
                        </UncontrolledTooltip>
                        <button
                          type="button"
                          id={`enq-del-${enquiry.id}`}
                          className="btn btn-sm btn-soft-danger remove-item-btn"
                          aria-label="Delete"
                          onClick={() => setDeleteTarget(enquiry)}
                        >
                          <i className="ri-delete-bin-5-line" />
                        </button>
                        <UncontrolledTooltip placement="top" target={`enq-del-${enquiry.id}`}>
                          Delete
                        </UncontrolledTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      <div className="patient-list-modal__empty">
                        <span className="patient-list-modal__empty-icon" aria-hidden="true">
                          <i className="ri-question-answer-line" />
                        </span>
                        {hasFilters ? "No tickets found matching your filters" : "No tickets yet"}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
            <div className="text-muted patient-list-modal__footer-text">
              {`Showing ${pageItems.length} of ${filtered.length} Tickets ${
                hasFilters
                  ? `(filtered from ${enquiries.length} total)`
                  : `(from ${enquiries.length} total)`
              }`}
            </div>
            {filtered.length > 0 && (
              <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                <PaginationItem disabled={safePage === 1}>
                  <PaginationLink
                    href="#"
                    previous
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.max(1, safePage - 1));
                    }}
                  />
                </PaginationItem>
                <CompactPaginationPages
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
                <PaginationItem disabled={safePage === totalPages}>
                  <PaginationLink
                    href="#"
                    next
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.min(totalPages, safePage + 1));
                    }}
                  />
                </PaginationItem>
              </Pagination>
            )}
          </div>
        </ModalBody>
      </Modal>

      <TicketConversationModal
        isOpen={Boolean(viewEnquiry)}
        toggle={() => setViewId(null)}
        ticket={viewEnquiry}
        onUpdateTicket={handleUpdateEnquiry}
        viewer="admin"
        statuses={STATUSES}
        idLabel="Ticket"
        backLabel="Back to Ticket Enquiries"
      />

      <DeleteModal
        show={Boolean(deleteTarget)}
        onDeleteClick={handleConfirmDelete}
        onCloseClick={() => setDeleteTarget(null)}
      />
    </>
  );
}
