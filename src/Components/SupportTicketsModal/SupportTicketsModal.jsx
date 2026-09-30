import React, { useEffect, useMemo, useState } from "react";
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
  UncontrolledTooltip,
} from "reactstrap";
import ModalActionButton from "../Common/ModalActionButton";
import DeleteModal from "../Common/DeleteModal";
import TicketConversationModal, { getTicketConversation } from "./TicketConversationModal";
import {
  CompactPaginationPages,
  PAGE_SIZE,
  formatFileSize,
  priorityBadgeClass,
  statusBadgeClass,
} from "./supportShared";
import "./SupportTicketsModal.css";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "Open", label: "Open" },
  { key: "Pending", label: "Pending" },
  { key: "Resolved", label: "Resolved" },
];

const CATEGORIES = ["Payment", "Technical", "Prescription", "Booking", "Account"];
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Open", "Pending", "Resolved"];

const INITIAL_TICKETS = [
  {
    id: "SUP1023",
    subject: "Payment not reflecting",
    category: "Payment",
    priority: "High",
    status: "Open",
    updated: "Today",
    description:
      "Payment was deducted from my account but is not showing in the transaction history.",
  },
  {
    id: "SUP1022",
    subject: "Video call issue",
    category: "Technical",
    priority: "Medium",
    status: "Pending",
    updated: "Yesterday",
    description:
      "Unable to join the telemedicine video call. Camera preview works but connection fails.",
  },
  {
    id: "SUP1021",
    subject: "Prescription download",
    category: "Prescription",
    priority: "Low",
    status: "Resolved",
    updated: "20 Sep",
    description:
      "Prescription PDF download button was not responding. Issue has been resolved.",
  },
  {
    id: "SUP1020",
    subject: "Appointment booking",
    category: "Booking",
    priority: "Medium",
    status: "Resolved",
    updated: "18 Sep",
    description:
      "Could not book a follow-up appointment slot. Resolved after clearing cache.",
  },
  {
    id: "SUP1019",
    subject: "Account access",
    category: "Account",
    priority: "Low",
    status: "Open",
    updated: "16 Sep",
    description: "Having trouble updating profile details and resetting password.",
  },
];

const emptyForm = () => ({
  subject: "",
  category: "Technical",
  priority: "Medium",
  status: "Open",
  description: "",
  attachments: [],
});

const nextTicketId = (tickets) => {
  const nums = tickets
    .map((t) => Number(String(t.id).replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `SUP${max + 1}`;
};

export default function SupportTicketsModal({ isOpen, toggle, onActiveCountChange }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formData, setFormData] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);

  const [viewTicketId, setViewTicketId] = useState(null);
  const viewTicket = useMemo(
    () => tickets.find((t) => t.id === viewTicketId) || null,
    [tickets, viewTicketId]
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTicket, setDeleteTicket] = useState(null);

  const counts = useMemo(() => {
    const base = { all: tickets.length, Open: 0, Pending: 0, Resolved: 0 };
    tickets.forEach((t) => {
      if (base[t.status] !== undefined) base[t.status] += 1;
    });
    return base;
  }, [tickets]);

  const activeCount = counts.Open + counts.Pending;

  useEffect(() => {
    onActiveCountChange?.(activeCount);
  }, [activeCount, onActiveCountChange]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusTab !== "all" && t.status !== statusTab) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusTab, search, categoryFilter, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredTickets.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusTab, search, categoryFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const resetListState = () => {
    setStatusTab("all");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setCurrentPage(1);
  };

  const handleCloseMain = () => {
    setFormOpen(false);
    setViewTicketId(null);
    setDeleteOpen(false);
    resetListState();
    toggle();
  };

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setFormData(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (ticket) => {
    setFormMode("edit");
    setEditingId(ticket.id);
    setFormData({
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description || "",
      attachments: getTicketConversation(ticket).attachments,
    });
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
    setFormData((p) => ({
      ...p,
      attachments: p.attachments.filter((_, i) => i !== index),
    }));
  };

  const openView = (ticket) => {
    setViewTicketId(ticket.id);
  };

  const handleUpdateTicket = (id, patch) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const openDelete = (ticket) => {
    setDeleteTicket(ticket);
    setDeleteOpen(true);
  };

  const handleSaveForm = () => {
    if (!formData.subject.trim()) return;

    if (formMode === "create") {
      setTickets((prev) => [
        {
          id: nextTicketId(prev),
          subject: formData.subject.trim(),
          category: formData.category,
          priority: formData.priority,
          status: formData.status,
          updated: "Today",
          description: formData.description.trim(),
          attachments: formData.attachments,
        },
        ...prev,
      ]);
    } else {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                subject: formData.subject.trim(),
                category: formData.category,
                priority: formData.priority,
                status: formData.status,
                description: formData.description.trim(),
                attachments: formData.attachments,
                updated: "Today",
              }
            : t
        )
      );
    }
    setFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTicket) {
      setTickets((prev) => prev.filter((t) => t.id !== deleteTicket.id));
    }
    setDeleteOpen(false);
    setDeleteTicket(null);
  };

  return (
    <>
      <Modal
        size="xl"
        isOpen={isOpen}
        toggle={handleCloseMain}
        className="patient-list-modal support-tickets-modal"
      >
        <ModalHeader className="patient-list-modal__header" toggle={handleCloseMain}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className="ri-customer-service-2-line"
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
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
                  className={`support-tickets-modal__tab${
                    statusTab === tab.key ? " is-active" : ""
                  }`}
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
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Priority"
                >
                  <option value="">Priority</option>
                  {PRIORITIES.map((p) => (
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
                  <th
                    scope="col"
                    className="text-center patient-list-modal__th-index"
                    style={{ width: "5%" }}
                  >
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
                      Updated
                    </span>
                  </th>
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((ticket, index) => (
                  <tr key={ticket.id}>
                    <td className="text-center patient-list-modal__index">
                      {startIndex + index + 1}
                    </td>
                    <td className="fw-semibold text-nowrap">{ticket.id}</td>
                    <td>{ticket.subject}</td>
                    <td>{ticket.category}</td>
                    <td>
                      <span
                        className={`badge patient-list-modal__status ${priorityBadgeClass(
                          ticket.priority
                        )}`}
                      >
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge patient-list-modal__status ${statusBadgeClass(
                          ticket.status
                        )}`}
                      >
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="text-nowrap">{ticket.updated}</td>
                    <td className="text-end">
                      <div className="dashboard-patient-action-group d-inline-flex align-items-center justify-content-end flex-nowrap gap-1">
                        <button
                          type="button"
                          id={`support-view-${ticket.id}`}
                          className="btn btn-sm btn-soft-primary"
                          aria-label="View"
                          onClick={() => openView(ticket)}
                        >
                          <i className="ri-eye-fill" />
                        </button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`support-view-${ticket.id}`}
                        >
                          View Conversation
                        </UncontrolledTooltip>
                        <button
                          type="button"
                          id={`support-edit-${ticket.id}`}
                          className="btn btn-sm btn-soft-success edit-item-btn"
                          aria-label="Edit"
                          onClick={() => openEdit(ticket)}
                        >
                          <i className="ri-pencil-fill" />
                        </button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`support-edit-${ticket.id}`}
                        >
                          Edit
                        </UncontrolledTooltip>
                        <button
                          type="button"
                          id={`support-del-${ticket.id}`}
                          className="btn btn-sm btn-soft-danger remove-item-btn"
                          aria-label="Delete"
                          onClick={() => openDelete(ticket)}
                        >
                          <i className="ri-delete-bin-5-line" />
                        </button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`support-del-${ticket.id}`}
                        >
                          Delete
                        </UncontrolledTooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      <div className="patient-list-modal__empty">
                        <span className="patient-list-modal__empty-icon" aria-hidden="true">
                          <i className="ri-ticket-2-line" />
                        </span>
                        {search || categoryFilter || statusFilter || priorityFilter || statusTab !== "all"
                          ? "No tickets found matching your filters"
                          : "No support tickets yet"}
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
                search || categoryFilter || statusFilter || priorityFilter || statusTab !== "all"
                  ? `(filtered from ${tickets.length} total)`
                  : `(from ${tickets.length} total)`
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

      <Modal
        isOpen={formOpen}
        toggle={() => setFormOpen(false)}
        centered
        className="patient-list-modal"
      >
        <ModalHeader
          className="patient-list-modal__header"
          toggle={() => setFormOpen(false)}
        >
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className={formMode === "create" ? "ri-add-circle-line" : "ri-pencil-fill"}
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">
              {formMode === "create" ? "New Ticket" : `Edit Ticket — ${editingId}`}
            </span>
          </span>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="support-ticket-subject" className="form-label">
              Subject
            </Label>
            <Input
              id="support-ticket-subject"
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Input>
          </FormGroup>
          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label for="support-ticket-priority" className="form-label">
                  Priority
                </Label>
                <Input
                  id="support-ticket-priority"
                  type="select"
                  value={formData.priority}
                  onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label for="support-ticket-status" className="form-label">
                  Status
                </Label>
                <Input
                  id="support-ticket-status"
                  type="select"
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </div>
          </div>
          <FormGroup className="mb-0">
            <Label for="support-ticket-description" className="form-label">
              Description
            </Label>
            <Input
              id="support-ticket-description"
              type="textarea"
              rows={4}
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
                <span className="support-ticket-form__dropzone-hint">
                  Screenshots, PDF or documents
                </span>
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
                      {file.size ? (
                        <span className="support-conv__file-size">{file.size}</span>
                      ) : null}
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
          <ModalActionButton
            action={formMode === "create" ? "submit" : "update"}
            onClick={handleSaveForm}
            disabled={!formData.subject.trim()}
          >
            {formMode === "create" ? "Create Ticket" : "Update Ticket"}
          </ModalActionButton>
        </ModalFooter>
      </Modal>

      <TicketConversationModal
        isOpen={Boolean(viewTicket)}
        toggle={() => setViewTicketId(null)}
        ticket={viewTicket}
        onUpdateTicket={handleUpdateTicket}
      />

      <DeleteModal
        show={deleteOpen}
        onDeleteClick={handleConfirmDelete}
        onCloseClick={() => {
          setDeleteOpen(false);
          setDeleteTicket(null);
        }}
      />
    </>
  );
}
