import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  FormGroup,
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
import ModalActionButton from "../Common/ModalActionButton";
import TicketConversationModal from "./TicketConversationModal";
import {
  CompactPaginationPages,
  PAGE_SIZE,
  formatFileSize,
  priorityBadgeClass,
  statusBadgeClass,
} from "./supportShared";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  createTicket,
  errorText,
  loadMyTickets,
  sendTicketMessage,
} from "./supportTicketApi";
import "./SupportTicketsModal.css";

const STATUS_TABS = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Open", match: (s) => s === "Open" },
  { key: "progress", label: "In Progress", match: (s) => s === "In Progress" },
  { key: "resolved", label: "Resolved", match: (s) => s === "Resolved" || s === "Closed" },
];

const emptyForm = () => ({
  subject: "",
  category: "technical",
  description: "",
  attachments: [],
});

const hasSession = () => {
  try {
    return Boolean(sessionStorage.getItem("authUser"));
  } catch (_) {
    return false;
  }
};

export default function SupportTicketsModal({ isOpen, toggle, onActiveCountChange }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [viewTicketId, setViewTicketId] = useState(null);
  const viewTicket = useMemo(
    () => tickets.find((t) => t.id === viewTicketId) || null,
    [tickets, viewTicketId]
  );

  const reload = useCallback(async () => {
    if (!hasSession()) return;
    setLoading(true);
    try {
      setTickets(await loadMyTickets());
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

  const counts = useMemo(() => {
    const result = {};
    STATUS_TABS.forEach((tab) => {
      result[tab.key] = tickets.filter((t) => tab.match(t.status)).length;
    });
    return result;
  }, [tickets]);

  const activeCount = counts.open + counts.progress;

  useEffect(() => {
    onActiveCountChange?.(activeCount);
  }, [activeCount, onActiveCountChange]);

  const hasFilters = Boolean(search || categoryFilter || statusFilter || priorityFilter || statusTab !== "all");

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tab = STATUS_TABS.find((t) => t.key === statusTab) || STATUS_TABS[0];
    return tickets.filter((t) => {
      if (!tab.match(t.status)) return false;
      if (categoryFilter && t.categoryCode !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return [t.subject, t.id, t.category].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [tickets, statusTab, search, categoryFilter, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredTickets.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, search, categoryFilter, statusFilter, priorityFilter]);

  const handleCloseMain = () => {
    setFormOpen(false);
    setViewTicketId(null);
    setStatusTab("all");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
    toggle();
  };

  const openCreate = () => {
    setFormData(emptyForm());
    setFormOpen(true);
  };

  const handleAddFormFiles = (fileList) => {
    const added = Array.from(fileList || []).map((file) => ({
      name: file.name,
      size: formatFileSize(file.size),
    }));
    if (!added.length) return;
    setFormData((p) => ({ ...p, attachments: [...p.attachments, ...added] }));
  };

  const handleRemoveFormFile = (index) => {
    setFormData((p) => ({ ...p, attachments: p.attachments.filter((_, i) => i !== index) }));
  };

  const canSave = formData.subject.trim() && formData.description.trim();

  const handleSaveForm = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await createTicket(formData);
      const newId = res?.supportTicketId ?? res?.data?.supportTicketId;
      if (newId) {
        for (const file of formData.attachments) {
          await sendTicketMessage(newId, { body: `Attached ${file.name}`, fileName: file.name });
        }
      }
      setFormOpen(false);
      await reload();
      Swal.fire({
        icon: "success",
        title: "Ticket created",
        text: newId ? `SUP${newId} has been submitted.` : "Your ticket has been submitted.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Ticket not created", text: errorText(err, "Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal size="xl" isOpen={isOpen} toggle={handleCloseMain} className="patient-list-modal support-tickets-modal">
        <ModalHeader className="patient-list-modal__header" toggle={handleCloseMain}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-customer-service-2-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
            <span className="patient-list-modal__title-text">My Support Tickets</span>
          </span>
          <div className="patient-list-modal__header-actions">
            <button
              type="button"
              className="btn btn-sm support-tickets-modal__new-btn d-inline-flex align-items-center"
              onClick={openCreate}
            >
              <i className="ri-add-line me-1" aria-hidden="true" />
              New Ticket
            </button>
            <div className="patient-list-modal__search">
              <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
              <Input
                size="sm"
                type="text"
                placeholder="Search..."
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
                  {tab.label} ({counts[tab.key] ?? 0})
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
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Priority"
                >
                  <option value="">Priority</option>
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
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
                  <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: "5%" }}>
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
                      <i className="ri-checkbox-circle-line" aria-hidden="true" />
                      Status
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-time-line" aria-hidden="true" />
                      Created
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
                    <td colSpan="8" className="text-center py-4">
                      <Spinner size="sm" color="primary" />
                    </td>
                  </tr>
                ) : null}
                {pageItems.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                    <td className="fw-semibold text-nowrap">{ticket.id}</td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.category}</td>
                    <td>
                      <span className={`badge patient-list-modal__status ${priorityBadgeClass(ticket.priority)}`}>
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge patient-list-modal__status ${statusBadgeClass(ticket.status)}`}>
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="text-nowrap">{ticket.updated}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        id={`support-view-${ticket.id}`}
                        className="btn btn-sm btn-soft-primary"
                        aria-label="View"
                        onClick={() => setViewTicketId(ticket.id)}
                      >
                        <i className="ri-eye-fill" />
                      </button>
                      <UncontrolledTooltip placement="top" target={`support-view-${ticket.id}`}>
                        View Conversation
                      </UncontrolledTooltip>
                    </td>
                  </tr>
                ))}
                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      <div className="patient-list-modal__empty">
                        <span className="patient-list-modal__empty-icon" aria-hidden="true">
                          <i className="ri-ticket-2-line" />
                        </span>
                        {hasFilters ? "No tickets found matching your filters" : "No support tickets yet"}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
            <div className="text-muted patient-list-modal__footer-text">
              {`Showing ${pageItems.length} of ${filteredTickets.length} Tickets ${
                hasFilters ? `(filtered from ${tickets.length} total)` : `(from ${tickets.length} total)`
              }`}
            </div>
            {filteredTickets.length > 0 && (
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

      <Modal isOpen={formOpen} toggle={() => setFormOpen(false)} centered className="patient-list-modal">
        <ModalHeader className="patient-list-modal__header" toggle={() => setFormOpen(false)}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-add-circle-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
            <span className="patient-list-modal__title-text">New Ticket</span>
          </span>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="support-ticket-subject" className="form-label">
              Subject
            </Label>
            <Input
              id="support-ticket-subject"
              maxLength={200}
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Brief summary of your issue"
            />
          </FormGroup>
          <FormGroup>
            <Label for="support-ticket-category" className="form-label">
              Category
            </Label>
            <Input
              id="support-ticket-category"
              type="select"
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            >
              {TICKET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup className="mb-0">
            <Label for="support-ticket-description" className="form-label">
              Description
            </Label>
            <Input
              id="support-ticket-description"
              type="textarea"
              rows={4}
              maxLength={4000}
              className="support-ticket-form__textarea"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue in detail"
            />
          </FormGroup>
          <FormGroup className="mb-0 mt-3">
            <Label for="support-ticket-attachments" className="form-label">
              Attachments
            </Label>
            <label htmlFor="support-ticket-attachments" className="support-ticket-form__dropzone">
              <i className="ri-upload-cloud-2-line" aria-hidden="true" />
              <span>
                <span className="support-ticket-form__dropzone-title">Click to upload files</span>
                <span className="support-ticket-form__dropzone-hint">Screenshots, PDF or documents</span>
              </span>
            </label>
            <input
              id="support-ticket-attachments"
              type="file"
              multiple
              className="d-none"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => {
                handleAddFormFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {formData.attachments.length > 0 && (
              <ul className="support-conv__files mt-2">
                {formData.attachments.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="support-conv__file">
                    <i className="ri-file-image-line support-conv__file-icon" aria-hidden="true" />
                    <span className="support-conv__file-info">
                      <span className="support-conv__file-name">{file.name}</span>
                      {file.size ? <span className="support-conv__file-size">{file.size}</span> : null}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-soft-danger remove-item-btn"
                      aria-label={`Remove ${file.name}`}
                      title="Remove"
                      onClick={() => handleRemoveFormFile(idx)}
                    >
                      <i className="ri-delete-bin-5-line" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={() => setFormOpen(false)} />
          <ModalActionButton action="submit" onClick={handleSaveForm} disabled={!canSave || saving}>
            Create Ticket
          </ModalActionButton>
        </ModalFooter>
      </Modal>

      <TicketConversationModal
        isOpen={Boolean(viewTicket)}
        toggle={() => setViewTicketId(null)}
        ticket={viewTicket}
        onTicketChanged={reload}
      />
    </>
  );
}
