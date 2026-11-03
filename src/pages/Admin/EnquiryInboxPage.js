import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Container,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import { getAuthUserId } from "../../helpers/menuByRole";
import { getEnquiries, updateEnquiry } from "../../helpers/realbackend_helper";
import {
  CompactPaginationPages,
  PAGE_SIZE,
  statusBadgeClass,
} from "../../Components/SupportTicketsModal/supportShared";
import "../../Components/SupportTicketsModal/SupportTicketsModal.css";
import "../Support/supportWorkspacePage.css";

const ENQUIRY_STATUSES = ["New", "Open", "In Progress", "Closed"];

const STATUS_TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "new", label: "New", match: (s) => s === "New" || s === "Open" },
  { key: "progress", label: "In Progress", match: (s) => s === "In Progress" },
  { key: "resolved", label: "Resolved", match: (s) => s === "Closed" },
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

const mapRow = (row) => {
  const enquiryId = row.enquiryId ?? row.EnquiryId;
  const enquiryDate = row.enquiryDate ?? row.EnquiryDate;
  const ticketStatus = row.ticketStatus ?? row.TicketStatus ?? "New";
  const slaDueAt = row.slaDueAt ?? row.SlaDueAt;
  const slaBreached = Boolean(row.slaBreached ?? row.SlaBreached);
  const slaHours = slaDueAt ? Math.round(moment(slaDueAt).diff(moment(), "hours", true)) : null;
  return {
    enquiryId,
    enquiryName: row.enquiryName ?? row.EnquiryName ?? "—",
    enquiryDate,
    emailId: row.emailId ?? row.EmailId ?? "",
    mobileNo: row.mobileNo ?? row.MobileNo ?? "",
    enquiryDetails: row.enquiryDetails ?? row.EnquiryDetails ?? "",
    ticketStatus,
    assignedTo: row.assignedTo ?? row.AssignedTo ?? null,
    slaDueAt,
    slaBreached,
    slaHours,
  };
};

const formatReceived = (value) => {
  const m = moment(value);
  if (!m.isValid()) return "—";
  if (m.isSame(moment(), "day")) return m.format("hh:mm A");
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return m.format("DD MMM");
};

const slaText = (row) => {
  if (row.ticketStatus === "Closed") return "Met";
  if (row.slaHours == null) return "—";
  if (row.slaBreached || row.slaHours < 0) return `Overdue ${Math.abs(row.slaHours)}h`;
  return `${row.slaHours}h left`;
};

const slaClass = (row) => {
  if (row.ticketStatus === "Closed" || row.slaHours == null) return "";
  if (row.slaBreached || row.slaHours <= 2) return "support-conv__sla support-conv__sla--danger";
  if (row.slaHours <= 4) return "support-conv__sla support-conv__sla--warning";
  return "";
};

const enquiryStatusBadge = (status) => {
  if (status === "New" || status === "Open") return statusBadgeClass("Open");
  if (status === "In Progress") return statusBadgeClass("In Progress");
  if (status === "Closed") return statusBadgeClass("Closed");
  return statusBadgeClass(status);
};

const EnquiryInboxPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [active, setActive] = useState(null);
  const [draftStatus, setDraftStatus] = useState("New");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Enquiry inbox | Homeocentrum";
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getEnquiries(null);
      const list = payload?.data ?? payload?.Data ?? (Array.isArray(payload) ? payload : []);
      setRows((Array.isArray(list) ? list : []).map(mapRow));
    } catch (err) {
      setRows([]);
      setError(typeof err === "string" ? err : err?.message || "Could not load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const tabCounts = useMemo(() => {
    const counts = {};
    STATUS_TABS.forEach((tab) => {
      counts[tab.key] = rows.filter((r) => tab.match(r.ticketStatus)).length;
    });
    return counts;
  }, [rows]);

  const hasFilters = Boolean(search || statusFilter || dateFilter || statusTab !== "all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tab = STATUS_TABS.find((t) => t.key === statusTab) || STATUS_TABS[0];
    return rows.filter((r) => {
      if (!tab.match(r.ticketStatus)) return false;
      if (statusFilter && r.ticketStatus !== statusFilter) return false;
      if (!matchesDateFilter(r.enquiryDate, dateFilter)) return false;
      if (!q) return true;
      return [r.enquiryId, r.enquiryName, r.emailId, r.mobileNo, r.enquiryDetails]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, statusTab, search, statusFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, search, statusFilter, dateFilter]);

  const openDetail = (row) => {
    setActive(row);
    setDraftStatus(row.ticketStatus || "New");
    setNote("");
  };

  const closeDetail = () => {
    setActive(null);
    setSaving(false);
  };

  const saveDetail = async ({ assignToMe = false, clearAssignee = false } = {}) => {
    if (!active) return;
    setSaving(true);
    setError("");
    setNote("");
    try {
      const body = { ticketStatus: draftStatus };
      if (clearAssignee) body.clearAssignee = true;
      if (assignToMe) {
        const userId = getAuthUserId();
        if (userId > 0) body.assignedTo = userId;
      }
      const response = await updateEnquiry(active.enquiryId, body);
      const updated = mapRow(response?.data ?? response?.Data ?? response);
      setRows((prev) => prev.map((r) => (r.enquiryId === updated.enquiryId ? { ...r, ...updated } : r)));
      setActive((prev) => (prev ? { ...prev, ...updated } : prev));
      setNote("Enquiry updated.");
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Could not update enquiry.");
    } finally {
      setSaving(false);
    }
  };

  const meId = getAuthUserId();

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page support-workspace-page">
      <Container fluid>
        <div className="support-workspace-page__header mb-3">
          <div>
            <h2 className="clinic-page-title mb-1 d-flex align-items-center gap-2">
              <i className="ri-mail-open-line" style={{ color: "#25a0e2", fontSize: 22 }} aria-hidden="true" />
              Enquiry inbox
            </h2>
            <p className="clinic-page-subtitle mb-0">
              Website messages — update status, assign, and track SLA.
            </p>
          </div>
          <div className="patient-list-modal__search support-workspace-page__search">
            <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
            <Input
              size="sm"
              type="text"
              placeholder="Search enquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && !active ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}

        <Card className="admin-dash-card support-workspace-page__card">
          <CardBody>
            <div className="support-tickets-modal__toolbar mb-3">
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Status"
                  >
                    <option value="">Status</option>
                    {ENQUIRY_STATUSES.map((s) => (
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
                        Id
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Name
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Email
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Mobile
                      </span>
                    </th>
                    <th scope="col">
                      <span className="patient-list-modal__th">
                        Details
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
                        Assigned
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
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center py-4">
                        <Spinner size="sm" color="primary" />
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row, index) => (
                    <tr key={row.enquiryId}>
                      <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                      <td className="fw-semibold text-nowrap">{row.enquiryId}</td>
                      <td className="text-nowrap">{row.enquiryName}</td>
                      <td>
                        <span className="patient-list-modal__meta">{row.emailId || "—"}</span>
                      </td>
                      <td className="text-nowrap">{row.mobileNo || "—"}</td>
                      <td>
                        <span className="support-workspace-page__clamp">{row.enquiryDetails || "—"}</span>
                      </td>
                      <td className="text-nowrap">{formatReceived(row.enquiryDate)}</td>
                      <td className="text-nowrap">
                        <span className={slaClass(row)}>{slaText(row)}</span>
                      </td>
                      <td className="text-nowrap">
                        {row.assignedTo
                          ? meId && Number(row.assignedTo) === meId
                            ? "You"
                            : `User ${row.assignedTo}`
                          : "—"}
                      </td>
                      <td>
                        <span className={`badge patient-list-modal__status ${enquiryStatusBadge(row.ticketStatus)}`}>
                          <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                          {row.ticketStatus}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          id={`enq-open-${row.enquiryId}`}
                          className="btn btn-sm btn-soft-primary"
                          aria-label="Open"
                          onClick={() => openDetail(row)}
                        >
                          <i className="ri-eye-fill" />
                        </button>
                        <UncontrolledTooltip placement="top" target={`enq-open-${row.enquiryId}`}>
                          View &amp; update
                        </UncontrolledTooltip>
                      </td>
                    </tr>
                  ))}
                  {!loading && pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center text-muted py-4">
                        <div className="patient-list-modal__empty">
                          <span className="patient-list-modal__empty-icon" aria-hidden="true">
                            <i className="ri-mail-open-line" />
                          </span>
                          {hasFilters ? "No enquiries found matching your filters" : "No enquiries yet"}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center justify-content-between patient-list-modal__footer mt-3">
              <div className="text-muted patient-list-modal__footer-text">
                {`Showing ${pageItems.length} of ${filtered.length} Enquiries ${
                  hasFilters ? `(filtered from ${rows.length} total)` : `(from ${rows.length} total)`
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

      <Modal isOpen={Boolean(active)} toggle={closeDetail} size="lg" className="patient-list-modal">
        <ModalHeader toggle={closeDetail} className="patient-list-modal__header">
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-mail-open-line" style={{ color: "#25a0e2" }} aria-hidden="true" />
            <span className="patient-list-modal__title-text">
              Enquiry #{active?.enquiryId}
            </span>
          </span>
        </ModalHeader>
        <ModalBody>
          {error ? <Alert color="danger" className="py-2 small">{error}</Alert> : null}
          {note ? <Alert color="success" className="py-2 small">{note}</Alert> : null}
          {active ? (
            <div className="support-workspace-page__detail">
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <Label className="text-muted small mb-1">Name</Label>
                  <div className="fw-semibold">{active.enquiryName}</div>
                </div>
                <div className="col-md-6">
                  <Label className="text-muted small mb-1">Received</Label>
                  <div>
                    {active.enquiryDate
                      ? moment(active.enquiryDate).format("DD MMM YYYY, hh:mm A")
                      : "—"}
                  </div>
                </div>
                <div className="col-md-6">
                  <Label className="text-muted small mb-1">Email</Label>
                  <div>
                    {active.emailId ? (
                      <a href={`mailto:${active.emailId}`}>{active.emailId}</a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <Label className="text-muted small mb-1">Mobile</Label>
                  <div>
                    {active.mobileNo ? (
                      <a href={`tel:${active.mobileNo}`}>{active.mobileNo}</a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <Label className="text-muted small mb-1">Details</Label>
                  <div className="support-workspace-page__details-box">{active.enquiryDetails || "—"}</div>
                </div>
                <div className="col-md-4">
                  <Label className="text-muted small mb-1">SLA</Label>
                  <div>
                    <span className={slaClass(active)}>{slaText(active)}</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <Label className="text-muted small mb-1">Assigned</Label>
                  <div>
                    {active.assignedTo
                      ? meId && Number(active.assignedTo) === meId
                        ? "You"
                        : `User ${active.assignedTo}`
                      : "Unassigned"}
                  </div>
                </div>
                <div className="col-md-4">
                  <Label className="mb-1" for="enquiry-status">
                    Status
                  </Label>
                  <Input
                    id="enquiry-status"
                    type="select"
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value)}
                  >
                    {ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Input>
                </div>
              </div>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter className="d-flex flex-wrap gap-2 justify-content-between">
          <div className="d-flex flex-wrap gap-2">
            <Button color="soft-primary" disabled={saving} onClick={() => saveDetail({ assignToMe: true })}>
              <i className="ri-user-follow-line me-1" aria-hidden="true" />
              Assign to me
            </Button>
            {active?.assignedTo ? (
              <Button color="soft-secondary" disabled={saving} onClick={() => saveDetail({ clearAssignee: true })}>
                <i className="ri-user-unfollow-line" aria-hidden="true" /> Unassign
              </Button>
            ) : null}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button color="light" onClick={closeDetail} disabled={saving}>
              <i className="ri-close-line" aria-hidden="true" /> Close
            </Button>
            <Button className="btn btn-sm btn-soft-primary" disabled={saving} onClick={() => saveDetail()}>
              {saving ? <Spinner size="sm" /> : <i className="ri-save-line" aria-hidden="true" />}
              {saving ? " Saving…" : "Save status"}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default EnquiryInboxPage;
