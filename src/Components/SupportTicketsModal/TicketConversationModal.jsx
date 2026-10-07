import React, { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import Swal from "sweetalert2";
import { Input, Label, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import ModalActionButton from "../Common/ModalActionButton";
import { priorityTextClass, statusBadgeClass } from "./supportShared";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  errorText,
  loadConversation,
  saveTicketStatus,
  sendTicketMessage,
} from "./supportTicketApi";

const SUPPORT_NAME = "Support Team";
const TIME_FORMAT = "DD MMM, hh:mm A";
const DATE_TIME_FORMAT = "DD MMM YYYY, hh:mm A";

const CATEGORY_ICONS = {
  Billing: "ri-bank-card-line",
  Technical: "ri-tools-line",
  Clinical: "ri-stethoscope-line",
  Booking: "ri-calendar-check-line",
  "Assisted booking": "ri-customer-service-line",
  Other: "ri-question-answer-line",
};

const formatAt = (value, format = TIME_FORMAT) => {
  const m = moment(value);
  return m.isValid() ? m.format(format) : "—";
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
  onTicketChanged,
  viewer = "requester",
  idLabel = "Ticket",
  backLabel = "Back to Tickets",
}) {
  const isAdmin = viewer === "admin";
  const [conversation, setConversation] = useState({ messages: [], attachments: [] });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reply, setReply] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [draft, setDraft] = useState({ status: "Open", priority: "Medium" });
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);

  const reload = useCallback(async () => {
    if (!ticket?.ticketId) return;
    setLoading(true);
    try {
      setConversation(await loadConversation(ticket));
    } catch (err) {
      setConversation({ messages: [], attachments: [] });
      Swal.fire({ icon: "error", title: "Could not load messages", text: errorText(err, "Please try again.") });
    } finally {
      setLoading(false);
    }
  }, [ticket?.ticketId, ticket?.description, ticket?.createdAt, ticket?.reporterUserId]);

  useEffect(() => {
    if (!isOpen || !ticket) return;
    setDraft({ status: ticket.status, priority: ticket.priority || "Medium" });
    setReply("");
    setPendingFile(null);
    reload();
  }, [isOpen, ticket?.ticketId]);

  useEffect(() => {
    if (isOpen && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [isOpen, conversation.messages.length]);

  if (!ticket) return null;

  const requesterName = ticket.requesterName || "Requester";
  const requesterRole = ticket.requesterRole || "";
  const isClosed = ticket.status === "Closed";

  const handleSend = async () => {
    const text = reply.trim();
    if (!text && !pendingFile) return;
    setSending(true);
    try {
      await sendTicketMessage(ticket.ticketId, {
        body: text || `Attached ${pendingFile.name}`,
        fileName: pendingFile?.name,
      });
      if (isAdmin && ticket.status === "Open") {
        await saveTicketStatus(ticket.ticketId, { status: "In Progress", priority: ticket.priority });
        onTicketChanged?.();
      }
      setReply("");
      setPendingFile(null);
      await reload();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Message not sent", text: errorText(err, "Please try again.") });
    } finally {
      setSending(false);
    }
  };

  const applyStatus = async (status, priority, successTitle) => {
    setSaving(true);
    try {
      await saveTicketStatus(ticket.ticketId, { status, priority });
      onTicketChanged?.();
      Swal.fire({ icon: "success", title: successTitle, timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Update failed", text: errorText(err, "Please try again.") });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: `Close ${ticket.id}?`,
      text: `This ${idLabel.toLowerCase()} will be marked resolved and closed.`,
      showCancelButton: true,
      confirmButtonText: "Yes, close it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#25a0e2",
    });
    if (!result.isConfirmed) return;
    try {
      await sendTicketMessage(ticket.ticketId, {
        body: `This ${idLabel.toLowerCase()} has been resolved and closed. Thank you for contacting us.`,
      });
    } catch (_) {
      /* closing still proceeds */
    }
    await applyStatus("Closed", draft.priority, `${ticket.id} closed`);
    reload();
  };

  return (
    <Modal size="xl" isOpen={isOpen} toggle={toggle} centered className="patient-list-modal support-conv-modal">
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-chat-3-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
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
                  {requesterRole ? <span className="text-muted">({requesterRole})</span> : null}
                  {ticket.email ? <span className="d-block text-muted text-truncate">{ticket.email}</span> : null}
                </span>
              </dd>
              <dt>Category</dt>
              <dd>
                <i className={`${CATEGORY_ICONS[ticket.category] || "ri-folder-line"} me-1 text-info`} aria-hidden="true" />
                {ticket.category}
              </dd>
              <dt>Priority</dt>
              <dd className={`fw-semibold ${priorityTextClass(ticket.priority)}`}>{ticket.priority}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`badge patient-list-modal__status ${statusBadgeClass(ticket.status)}`}>
                  <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                  {ticket.status}
                </span>
              </dd>
              {ticket.slaDueAt ? (
                <>
                  <dt>SLA due</dt>
                  <dd>{formatAt(ticket.slaDueAt, DATE_TIME_FORMAT)}</dd>
                </>
              ) : null}
              <dt>Created</dt>
              <dd>{formatAt(ticket.createdAt, DATE_TIME_FORMAT)}</dd>
            </dl>

            <h6 className="support-conv__section-title">Attachments</h6>
            {conversation.attachments.length === 0 ? (
              <p className="text-muted mb-0 support-conv__empty-text">No attachments</p>
            ) : (
              <ul className="support-conv__files">
                {conversation.attachments.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="support-conv__file">
                    <i className="ri-file-line support-conv__file-icon" aria-hidden="true" />
                    <span className="support-conv__file-info">
                      <span className="support-conv__file-name">{file.name}</span>
                      <span className="support-conv__file-size">{formatAt(file.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="support-conv__panel support-conv__chat">
            <div className="support-conv__thread" ref={threadRef}>
              {loading ? (
                <div className="text-center py-4 w-100">
                  <Spinner size="sm" color="primary" />
                </div>
              ) : null}
              {!loading &&
                conversation.messages.map((msg) => {
                  const isSupport = msg.from === "support";
                  return (
                    <div key={msg.id} className={`support-conv__msg${isSupport ? " support-conv__msg--support" : ""}`}>
                      <Avatar from={msg.from} requesterRole={requesterRole} />
                      <div className="support-conv__bubble">
                        <div className="support-conv__bubble-head">
                          <span className="support-conv__author">{isSupport ? SUPPORT_NAME : requesterName}</span>
                          <span className="support-conv__time">{formatAt(msg.at)}</span>
                        </div>
                        {msg.text ? <p className="support-conv__text">{msg.text}</p> : null}
                      </div>
                    </div>
                  );
                })}
              {!loading && conversation.messages.length === 0 && (
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
                    disabled={sending}
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
                    className="btn btn-sm btn-soft-secondary support-conv__attach-btn"
                    aria-label="Attach file"
                    title="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="ri-attachment-2" />
                  </button>
                  <ModalActionButton
                    action="send"
                    onClick={handleSend}
                    disabled={sending || (!reply.trim() && !pendingFile)}
                  />
                </div>
              </>
            )}
          </section>

          {isAdmin ? (
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
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Input>
              </div>
              <div className="mb-3">
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
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Input>
              </div>
              <ModalActionButton
                action="update"
                className="w-100"
                disabled={saving}
                onClick={() => applyStatus(draft.status, draft.priority, `${ticket.id} updated`)}
              >
                Update {idLabel}
              </ModalActionButton>
              {!isClosed ? (
                <ModalActionButton
                  action="confirm"
                  iconClassName="ri-lock-line"
                  className="w-100 mt-2"
                  disabled={saving}
                  onClick={handleCloseTicket}
                >
                  Resolve &amp; Close
                </ModalActionButton>
              ) : null}
            </aside>
          ) : null}
        </div>
      </ModalBody>
    </Modal>
  );
}
