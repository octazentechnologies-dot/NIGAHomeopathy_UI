import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import TicketConversationModal from "./TicketConversationModal";
import { CompactPaginationPages, PAGE_SIZE, priorityBadgeClass, statusBadgeClass } from "./supportShared";
import { TICKET_CATEGORIES, TICKET_STATUSES, formatUpdated, loadAdminTickets } from "./supportTicketApi";
import "./SupportTicketsModal.css";

const STATUS_TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "new", label: "New", match: (s) => s === "Open" },
  { key: "progress", label: "In Progress", match: (s) => s === "In Progress" },
  { key: "resolved", label: "Resolved", match: (s) => s === "Resolved" || s === "Closed" },
];

const DATE_FILTERS = [
  { key: "", label: "Date" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 days" },
];

const matchesDateFilter = (value, filter) => {
  if (!filter) return true;
  const m = moment(value);
  if (filter === "today") return m.isSame(moment(), "day");
  if (filter === "yesterday") return m.isSame(moment().subtract(1, "day"), "day");
  if (filter === "week") return m.isAfter(moment().subtract(7, "days").startOf("day"));
  return true;
};

const isUnresolved = (ticket) => ticket.status === "Open" || ticket.status === "In Progress";

const slaText = (ticket) => {
  if (ticket.slaHours == null) return "—";
  if (!isUnresolved(ticket)) return "Met";
  return ticket.slaHours < 0 ? `Overdue ${Math.abs(ticket.slaHours)}h` : `${ticket.slaHours}h left`;
};

const slaClass = (ticket) => {
  if (!isUnresolved(ticket) || ticket.slaHours == null) return "";
  if (ticket.slaHours <= 2) return "support-conv__sla support-conv__sla--danger";
  if (ticket.slaHours <= 4) return "support-conv__sla support-conv__sla--warning";
  return "";
};

const hasSession = () => {
  try {
    return Boolean(sessionStorage.getItem("authUser"));
  } catch (_) {
    return false;
  }
};

export default function EnquiriesModal({ isOpen, toggle, onActiveCountChange }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewId, setViewId] = useState(null);

  const reload = useCallback(async () => {
    if (!hasSession()) return;
    setLoading(true);
    try {
      setTickets(await loadAdminTickets());
    } catch (_) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (isOpen) reload();
  }, [isOpen, reload]);

  const viewTicket = useMemo(() => tickets.find((t) => t.id === viewId) || null, [tickets, viewId]);

  const tabCounts = useMemo(() => {
    const counts = {};
    STATUS_TABS.forEach((tab) => {
      counts[tab.key] = tickets.filter((t) => tab.match(t.status)).length;
    });
    return counts;
  }, [tickets]);

  const activeCount = tabCounts.new + tabCounts.progress;

  useEffect(() => {
    onActiveCountChange?.(activeCount);
  }, [activeCount, onActiveCountChange]);

  const hasFilters = Boolean(search || categoryFilter || statusFilter || dateFilter || statusTab !== "all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tab = STATUS_TABS.find((t) => t.key === statusTab) || STATUS_TABS[0];
    return tickets.filter((t) => {
      if (!tab.match(t.status)) return false;
      if (categoryFilter && t.categoryCode !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (!matchesDateFilter(t.createdAt, dateFilter)) return false;
      if (!q) return true;
      return [t.id, t.requesterName, t.email, t.subject, t.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [tickets, statusTab, search, categoryFilter, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, search, categoryFilter, statusFilter, dateFilter]);

  const handleClose = () => {
    setViewId(null);
    setStatusTab("all");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setDateFilter("");
    setCurrentPage(1);
    toggle();
  };

  return (
    <>
      <Modal size="xl" isOpen={isOpen} toggle={handleClose} className="patient-list-modal support-tickets-modal">
        <ModalHeader className="patient-list-modal__header" toggle={handleClose}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-question-answer-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
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
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                  <option value="AssistedRequest">Assisted booking</option>
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
                  {TICKET_STATUSES.map((s) => (
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
                      <i className="ri-flag-line" aria-hidden="true" />
                      Priority
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
                {loading && tickets.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4">
                      <Spinner size="sm" color="primary" />
                    </td>
                  </tr>
                ) : null}
                {pageItems.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                    <td className="fw-semibold text-nowrap">{ticket.id}</td>
                    <td className="text-nowrap">
                      {ticket.requesterName}
                      {ticket.requesterRole ? <span className="text-muted ms-1">({ticket.requesterRole})</span> : null}
                    </td>
                    <td>
                      <span className="patient-list-modal__meta">{ticket.email || "—"}</span>
                    </td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.category}</td>
                    <td>
                      <span className={`badge patient-list-modal__status ${priorityBadgeClass(ticket.priority)}`}>
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="text-nowrap">{formatUpdated(ticket.createdAt)}</td>
                    <td className="text-nowrap">
                      <span className={slaClass(ticket)}>{slaText(ticket)}</span>
                    </td>
                    <td>
                      <span className={`badge patient-list-modal__status ${statusBadgeClass(ticket.status)}`}>
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        id={`enq-view-${ticket.id}`}
                        className="btn btn-sm btn-soft-primary"
                        aria-label="View"
                        onClick={() => setViewId(ticket.id)}
                      >
                        <i className="ri-eye-fill" />
                      </button>
                      <UncontrolledTooltip placement="top" target={`enq-view-${ticket.id}`}>
                        View &amp; Reply
                      </UncontrolledTooltip>
                    </td>
                  </tr>
                ))}
                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">
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
                hasFilters ? `(filtered from ${tickets.length} total)` : `(from ${tickets.length} total)`
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
                <CompactPaginationPages currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
        isOpen={Boolean(viewTicket)}
        toggle={() => setViewId(null)}
        ticket={viewTicket}
        onTicketChanged={reload}
        viewer="admin"
        idLabel="Ticket"
        backLabel="Back to Ticket Enquiries"
      />
    </>
  );
}
