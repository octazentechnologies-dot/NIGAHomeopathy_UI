import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import {
  Alert,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import { navigateHidden, useHiddenSearchParams } from "../../helpers/hiddenRouteParams";
import TicketConversationModal from "../../Components/SupportTicketsModal/TicketConversationModal";
import {
  CompactPaginationPages,
  PAGE_SIZE,
  priorityBadgeClass,
  statusBadgeClass,
} from "../../Components/SupportTicketsModal/supportShared";
import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  createTicket,
  errorText,
  formatUpdated,
  loadAdminTickets,
  loadMyTickets,
} from "../../Components/SupportTicketsModal/supportTicketApi";
import "../../Components/SupportTicketsModal/SupportTicketsModal.css";
import "./supportWorkspacePage.css";

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

const SupportWorkspacePage = ({ mode = "mine" }) => {
  const isAdmin = mode === "admin";
  const { ticketId: paramTicketId } = useParams();
  const [searchParams] = useHiddenSearchParams();
  const routeTicketId = paramTicketId || searchParams.get("ticketId");
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewId, setViewId] = useState(null);
  const [form, setForm] = useState({ category: "other", subject: "", description: "" });
  const [creating, setCreating] = useState(false);

  document.title = isAdmin ? "Support tickets | Homeocentrum" : "Support | Homeocentrum";

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTickets(isAdmin ? await loadAdminTickets() : await loadMyTickets());
    } catch (err) {
      setTickets([]);
      setError(errorText(err, "Could not load tickets."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const id = Number(routeTicketId);
    if (!id) return;
    const match = tickets.find((t) => t.ticketId === id);
    if (match) setViewId(match.id);
  }, [routeTicketId, tickets]);

  const viewTicket = useMemo(() => tickets.find((t) => t.id === viewId) || null, [tickets, viewId]);

  const tabCounts = useMemo(() => {
    const counts = {};
    STATUS_TABS.forEach((tab) => {
      counts[tab.key] = tickets.filter((t) => tab.match(t.status)).length;
    });
    return counts;
  }, [tickets]);

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

  const openTicket = (ticket) => {
    setViewId(ticket.id);
    if (isAdmin) navigateHidden(navigate, `/admin/support-tickets?ticketId=${ticket.ticketId}`);
  };

  const closeTicket = () => {
    setViewId(null);
    if (isAdmin) navigateHidden(navigate, "/admin/support-tickets");
  };

  const createMineTicket = async () => {
    setError("");
    setNote("");
    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }
    setCreating(true);
    try {
      await createTicket(form);
      setNote("Ticket created.");
      setForm({ category: "other", subject: "", description: "" });
      await reload();
    } catch (err) {
      setError(errorText(err, "Could not create the ticket."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page support-workspace-page">
      <Container fluid>
        <div className="support-workspace-page__header">
          <h2 className="clinic-page-title">
            <i className="ri-question-answer-line" aria-hidden="true" />
            {isAdmin ? "Support tickets" : "My support tickets"}
          </h2>
          <div className="patient-list-modal__search support-workspace-page__search">
            <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
        {note ? <Alert color="success" className="py-2 small">{note}</Alert> : null}

        {!isAdmin ? (
          <Card className="admin-dash-card mb-0 support-workspace-page__create-card">
            <CardBody>
              <Row className="g-2 align-items-end">
                <Col sm={6} lg={2}>
                  <Label className="mb-1">Category</Label>
                  <Input
                    type="select"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Input>
                </Col>
                <Col sm={6} lg={3}>
                  <Label className="mb-1">Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Short subject"
                  />
                </Col>
                <Col sm={12} lg>
                  <Label className="mb-1">Details</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the issue"
                  />
                </Col>
                <Col xs="auto" className="support-workspace-page__create">
                  <button
                    type="button"
                    className="btn btn-sm btn-soft-primary"
                    onClick={createMineTicket}
                    disabled={creating}
                  >
                    {creating ? <Spinner size="sm" /> : <i className="ri-add-line" aria-hidden="true" />}
                    {" "}Create
                  </button>
                </Col>
              </Row>
            </CardBody>
          </Card>
        ) : null}

        <Card className="admin-dash-card support-workspace-page__card">
          <CardBody>
            <div className="support-tickets-modal__toolbar support-workspace-page__toolbar">
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
                        Ticket ID
                      </span>
                    </th>
                    {isAdmin ? (
                      <th scope="col">
                        <span className="patient-list-modal__th">
                          Name
                        </span>
                      </th>
                    ) : null}
                    {isAdmin ? (
                      <th scope="col">
                        <span className="patient-list-modal__th">
                          Email
                        </span>
                      </th>
                    ) : null}
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Subject
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Category
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Priority
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Received
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        SLA
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
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
                      <td colSpan={isAdmin ? 11 : 9} className="text-center py-4">
                        <Spinner size="sm" color="primary" />
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((ticket, index) => (
                    <tr key={ticket.id}>
                      <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                      <td className="fw-semibold text-nowrap">{ticket.id}</td>
                      {isAdmin ? (
                        <td className="text-nowrap">
                          {ticket.requesterName}
                          {ticket.requesterRole ? (
                            <span className="text-muted ms-1">({ticket.requesterRole})</span>
                          ) : null}
                        </td>
                      ) : null}
                      {isAdmin ? (
                        <td>
                          <span className="patient-list-modal__meta">{ticket.email || "—"}</span>
                        </td>
                      ) : null}
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
                          id={`sup-view-${ticket.id}`}
                          className="btn btn-sm btn-soft-primary"
                          aria-label="View"
                          onClick={() => openTicket(ticket)}
                        >
                          <i className="ri-eye-fill" />
                        </button>
                        <UncontrolledTooltip placement="top" target={`sup-view-${ticket.id}`}>
                          {isAdmin ? "View, reply & update" : "View & reply"}
                        </UncontrolledTooltip>
                      </td>
                    </tr>
                  ))}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 11 : 9} className="text-center text-muted py-4">
                        <div className="patient-list-modal__empty">
                          <span className="patient-list-modal__empty-icon" aria-hidden="true">
                            <i className="ri-customer-service-2-line" />
                          </span>
                          {hasFilters ? "No tickets found matching your filters" : "No tickets yet"}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between patient-list-modal__footer support-workspace-page__footer">
              <div className="text-muted patient-list-modal__footer-text">
                {`Showing ${pageItems.length} of ${filtered.length} Tickets ${
                  hasFilters ? `(filtered from ${tickets.length} total)` : `(from ${tickets.length} total)`
                }`}
              </div>
              {filtered.length > 0 ? (
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
              ) : null}
            </div>
          </CardBody>
        </Card>
      </Container>

      <TicketConversationModal
        isOpen={Boolean(viewTicket)}
        toggle={closeTicket}
        ticket={viewTicket}
        onTicketChanged={reload}
        viewer={isAdmin ? "admin" : "requester"}
        idLabel="Ticket"
        backLabel={isAdmin ? "Back to Support tickets" : "Back to My tickets"}
      />
    </div>
  );
};

export default SupportWorkspacePage;
