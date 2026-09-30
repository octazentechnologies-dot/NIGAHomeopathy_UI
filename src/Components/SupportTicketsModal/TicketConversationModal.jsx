import React, { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import Swal from "sweetalert2";
import { Input, Label, Modal, ModalBody, ModalHeader, UncontrolledTooltip } from "reactstrap";
import ModalActionButton from "../Common/ModalActionButton";
import {
  formatFileSize,
  priorityTextClass,
  statusBadgeClass,
} from "./supportShared";

const PRIORITIES = ["High", "Medium", "Low"];
const DEFAULT_STATUSES = ["Open", "Pending", "Resolved"];

const DOCTOR_NAME = "Dr. Nikhil";
const SUPPORT_NAME = "Support Team";
const TIME_FORMAT = "DD MMM, hh:mm A";
const DATE_TIME_FORMAT = "DD MMM YYYY, hh:mm A";

const CATEGORY_ICONS = {
  Payment: "ri-bank-card-line",
  Technical: "ri-tools-line",
  Prescription: "ri-file-list-3-line",
  Booking: "ri-calendar-check-line",
  Account: "ri-user-settings-line",
  General: "ri-question-answer-line",
  Doctor: "ri-stethoscope-line",
  Telemedicine: "ri-vidicon-line",
};

const SEED_CONVERSATIONS = {
  SUP1023: {
    createdAt: "2026-09-23T10:30:00",
    updatedAt: "2026-09-23T14:15:00",
    attachments: [{ name: "payment_screenshot.png", size: "245 KB" }],
    messages: [
      {
        id: "m1",
        from: "requester",
        at: "2026-09-23T10:30:00",
        text: "I have made a payment but it is not reflecting in my account. Please check the transaction.",
      },
      {
        id: "m2",
        from: "support",
        at: "2026-09-23T11:15:00",
        text: "Thank you for reaching out. We are checking your transaction details and will update you soon.",
      },
      {
        id: "m3",
        from: "requester",
        at: "2026-09-23T13:20:00",
        text: "Sure, please let me know.",
      },
      {
        id: "m4",
        from: "support",
        at: "2026-09-23T14:15:00",
        resolved: true,
        text: "We have verified the transaction. The payment is now updated in your account. Please refresh and check.",
      },
    ],
  },
  SUP1022: {
    createdAt: "2026-09-25T09:10:00",
    updatedAt: "2026-09-26T16:40:00",
    attachments: [{ name: "call_error.png", size: "180 KB" }],
    messages: [
      {
        id: "m1",
        from: "requester",
        at: "2026-09-25T09:10:00",
        text: "Unable to join the telemedicine video call. Camera preview works but connection fails.",
      },
      {
        id: "m2",
        from: "support",
        at: "2026-09-26T16:40:00",
        text: "Our technical team is looking into it. Could you share your browser version?",
      },
    ],
  },
};

const formatAt = (value, format = TIME_FORMAT) => {
  const m = moment(value);
  return m.isValid() ? m.format(format) : value || "—";
};

export const getTicketConversation = (ticket) => {
  if (!ticket) return { createdAt: null, updatedAt: null, attachments: [], messages: [] };
  const seed = SEED_CONVERSATIONS[ticket.id];
  const fallbackAt = ticket.createdAt || moment().toISOString();
  return {
    createdAt: ticket.createdAt || seed?.createdAt || fallbackAt,
    updatedAt: ticket.updatedAt || seed?.updatedAt || fallbackAt,
    attachments: ticket.attachments || seed?.attachments || [],
    messages:
      ticket.messages ||
      seed?.messages ||
      (ticket.description
        ? [{ id: "m1", from: "requester", at: fallbackAt, text: ticket.description }]
        : []),
  };
};

const Avatar = ({ from, requesterRole }) => {
  if (from === "support") {
    return (
      <span className="support-conv__avatar support-conv__avatar--support" aria-hidden="true">
        <i className="ri-customer-service-2-line" />
      </span>
    );
  }
  return (
    <span className="support-conv__avatar support-conv__avatar--doctor" aria-hidden="true">
      <i className={requesterRole === "Doctor" ? "ri-stethoscope-line" : "ri-user-3-line"} />
    </span>
  );
};

export default function TicketConversationModal({
  isOpen,
  toggle,
  ticket,
  onUpdateTicket,
  viewer = "requester",
  statuses = DEFAULT_STATUSES,
  idLabel = "Ticket",
  backLabel = "Back to Tickets",
}) {
  const isAdmin = viewer === "admin";
  const conversation = useMemo(() => getTicketConversation(ticket), [ticket]);
  const [reply, setReply] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [draft, setDraft] = useState({
    status: statuses[0],
    priority: "Medium",
    internalNotes: "",
  });
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!ticket) return;
    setDraft({
      status: ticket.status,
      priority: ticket.priority || "Medium",
      internalNotes: ticket.internalNotes || "",
    });
    setReply("");
    setPendingFile(null);
  }, [ticket?.id]);

  useEffect(() => {
    if (ticket) setDraft((p) => ({ ...p, status: ticket.status }));
  }, [ticket?.status]);

  useEffect(() => {
    if (isOpen && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [isOpen, conversation.messages.length]);

  if (!ticket) return null;

  const requesterName = ticket.requesterName || DOCTOR_NAME;
  const requesterRole = ticket.requesterRole || "Doctor";
  const isClosed = ticket.status === "Closed";

  const handleSend = () => {
    const text = reply.trim();
    if (!text && !pendingFile) return;
    const now = moment().toISOString();
    const attachment = pendingFile
      ? { name: pendingFile.name, size: formatFileSize(pendingFile.size) }
      : null;
    const patch = {
      createdAt: conversation.createdAt,
      updatedAt: now,
      updated: "Today",
      attachments: attachment
        ? [...conversation.attachments, attachment]
        : conversation.attachments,
      messages: [
        ...conversation.messages,
        {
          id: `m${Date.now()}`,
          from: isAdmin ? "support" : "requester",
          at: now,
          text,
          attachment,
        },
      ],
    };
    if (isAdmin && ["Open", "Pending"].includes(ticket.status) && statuses.includes("In Progress")) {
      patch.status = "In Progress";
    }
    onUpdateTicket(ticket.id, patch);
    setReply("");
    setPendingFile(null);
  };

  const handleUpdateTicket = () => {
    onUpdateTicket(ticket.id, {
      status: draft.status,
      priority: draft.priority,
      internalNotes: draft.internalNotes.trim(),
      createdAt: conversation.createdAt,
      updatedAt: moment().toISOString(),
      updated: "Today",
    });
    Swal.fire({
      icon: "success",
      title: `${idLabel} updated`,
      text: `${ticket.id} has been updated.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleCloseTicket = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: `Close ${ticket.id}?`,
      text: `The ${requesterRole.toLowerCase()} will be notified that this ${idLabel.toLowerCase()} is resolved and closed.`,
      showCancelButton: true,
      confirmButtonText: "Yes, close it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#25a0e2",
    });
    if (!result.isConfirmed) return;
    const now = moment().toISOString();
    onUpdateTicket(ticket.id, {
      status: "Closed",
      priority: draft.priority,
      internalNotes: draft.internalNotes.trim(),
      createdAt: conversation.createdAt,
      updatedAt: now,
      updated: "Today",
      messages: [
        ...conversation.messages,
        {
          id: `m${Date.now()}`,
          from: "support",
          at: now,
          resolved: true,
          text: `This ${idLabel.toLowerCase()} has been resolved and closed. Thank you for contacting us.`,
        },
      ],
    });
  };

  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      toggle={toggle}
      centered
      className="patient-list-modal support-conv-modal"
    >
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i
            className="ri-chat-3-line"
            style={{ color: "#25a0e2", fontSize: 15 }}
            aria-hidden="true"
          />
          <span className="patient-list-modal__title-text">
            {idLabel} {ticket.id}
          </span>
          <span className={`badge patient-list-modal__status ${statusBadgeClass(ticket.status)}`}>
            <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
            {ticket.status}
          </span>
        </span>
        <div className="patient-list-modal__header-actions">
          <button type="button" className="btn btn-sm support-conv__back-btn" onClick={toggle}>
            <i className="ri-arrow-left-line me-1" aria-hidden="true" />
            {backLabel}
          </button>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="support-conv">
          <aside className="support-conv__panel support-conv__details">
            <p className="support-conv__subject">{ticket.subject}</p>

            <h6 className="support-conv__section-title">{idLabel} Details</h6>
            <dl className="support-conv__meta">
              <dt>Created by</dt>
              <dd className="d-flex align-items-center gap-2">
                <Avatar from="requester" requesterRole={requesterRole} />
                <span className="min-w-0">
                  <span className="fw-semibold">{requesterName}</span>{" "}
                  <span className="text-muted">({requesterRole})</span>
                  {ticket.email ? (
                    <span className="d-block text-muted text-truncate">{ticket.email}</span>
                  ) : null}
                </span>
              </dd>
              <dt>Category</dt>
              <dd>
                <i
                  className={`${CATEGORY_ICONS[ticket.category] || "ri-folder-line"} me-1 text-info`}
                  aria-hidden="true"
                />
                {ticket.category}
              </dd>
              <dt>Priority</dt>
              <dd className={`fw-semibold ${priorityTextClass(ticket.priority)}`}>
                {ticket.priority || "Medium"}
              </dd>
              <dt>Status</dt>
              <dd>
                <span className={`badge patient-list-modal__status ${statusBadgeClass(ticket.status)}`}>
                  <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                  {ticket.status}
                </span>
              </dd>
              {ticket.slaHours ? (
                <>
                  <dt>SLA</dt>
                  <dd>{ticket.slaHours}h response</dd>
                </>
              ) : null}
              <dt>Created</dt>
              <dd>{formatAt(conversation.createdAt, DATE_TIME_FORMAT)}</dd>
              <dt>Updated</dt>
              <dd>{formatAt(conversation.updatedAt, DATE_TIME_FORMAT)}</dd>
            </dl>

            <h6 className="support-conv__section-title">Attachments</h6>
            {conversation.attachments.length === 0 ? (
              <p className="text-muted mb-0 support-conv__empty-text">No attachments</p>
            ) : (
              <ul className="support-conv__files">
                {conversation.attachments.map((file, idx) => (
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
                      id={`support-conv-dl-${idx}`}
                      className="btn btn-sm btn-soft-primary"
                      aria-label={`Download ${file.name}`}
                    >
                      <i className="ri-download-2-line" />
                    </button>
                    <UncontrolledTooltip placement="top" target={`support-conv-dl-${idx}`}>
                      Download
                    </UncontrolledTooltip>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="support-conv__panel support-conv__chat">
            <div className="support-conv__thread" ref={threadRef}>
              {conversation.messages.map((msg) => {
                const isSupport = msg.from === "support";
                return (
                  <div
                    key={msg.id}
                    className={`support-conv__msg${isSupport ? " support-conv__msg--support" : ""}`}
                  >
                    <Avatar from={msg.from} requesterRole={requesterRole} />
                    <div className="support-conv__bubble">
                      <div className="support-conv__bubble-head">
                        <span className="support-conv__author">
                          {isSupport ? SUPPORT_NAME : requesterName}
                        </span>
                        <span className="support-conv__time">{formatAt(msg.at)}</span>
                      </div>
                      {msg.text ? (
                        <p className="support-conv__text">
                          {msg.resolved ? (
                            <i
                              className="ri-checkbox-circle-fill text-success me-1"
                              aria-hidden="true"
                            />
                          ) : null}
                          {msg.text}
                        </p>
                      ) : null}
                      {msg.attachment ? (
                        <span className="support-conv__msg-file">
                          <i className="ri-attachment-2" aria-hidden="true" />
                          {msg.attachment.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {conversation.messages.length === 0 && (
                <div className="patient-list-modal__empty w-100">
                  <span className="patient-list-modal__empty-icon" aria-hidden="true">
                    <i className="ri-chat-3-line" />
                  </span>
                  No messages yet
                </div>
              )}
            </div>

            {isClosed ? (
              <div className="support-conv__closed-note">
                <i className="ri-lock-line" aria-hidden="true" />
                This {idLabel.toLowerCase()} is closed.
                {isAdmin ? " Change the status to reopen it." : ""}
              </div>
            ) : (
              <>
                {pendingFile ? (
                  <div className="support-conv__pending-file">
                    <i className="ri-attachment-2" aria-hidden="true" />
                    <span className="text-truncate">{pendingFile.name}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-danger"
                      aria-label="Remove attachment"
                      onClick={() => setPendingFile(null)}
                    >
                      <i className="ri-close-line" />
                    </button>
                  </div>
                ) : null}

                <div className="support-conv__composer">
                  <Input
                    type="text"
                    placeholder={isAdmin ? `Reply to ${requesterName}...` : "Type your reply..."}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    onChange={(e) => {
                      setPendingFile(e.target.files?.[0] || null);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    id="support-conv-attach"
                    className="btn btn-sm btn-soft-secondary support-conv__attach-btn"
                    aria-label="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="ri-attachment-2" />
                  </button>
                  <UncontrolledTooltip placement="top" target="support-conv-attach">
                    Attach file
                  </UncontrolledTooltip>
                  <ModalActionButton
                    action="send"
                    onClick={handleSend}
                    disabled={!reply.trim() && !pendingFile}
                  />
                </div>
              </>
            )}
          </section>

          <aside className="support-conv__panel support-conv__update">
            <h6 className="support-conv__section-title mt-0">Update {idLabel}</h6>
            <div className="mb-2">
              <Label className="form-label" for="support-conv-status">
                Status
              </Label>
              <Input
                id="support-conv-status"
                type="select"
                value={draft.status}
                onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Input>
            </div>
            <div className="mb-2">
              <Label className="form-label" for="support-conv-priority">
                Priority
              </Label>
              <Input
                id="support-conv-priority"
                type="select"
                className={priorityTextClass(draft.priority)}
                value={draft.priority}
                onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Input>
            </div>
            <div className="mb-3">
              <Label className="form-label" for="support-conv-notes">
                Internal Notes
              </Label>
              <Input
                id="support-conv-notes"
                type="textarea"
                rows={4}
                className="support-ticket-form__textarea"
                placeholder="Add internal notes..."
                value={draft.internalNotes}
                onChange={(e) => setDraft((p) => ({ ...p, internalNotes: e.target.value }))}
              />
            </div>
            <ModalActionButton action="update" className="w-100" onClick={handleUpdateTicket}>
              Update {idLabel}
            </ModalActionButton>
            {isAdmin && !isClosed ? (
              <ModalActionButton
                action="confirm"
                iconClassName="ri-lock-line"
                className="w-100 mt-2"
                onClick={handleCloseTicket}
              >
                Resolve &amp; Close
              </ModalActionButton>
            ) : null}
          </aside>
        </div>
      </ModalBody>
    </Modal>
  );
}
