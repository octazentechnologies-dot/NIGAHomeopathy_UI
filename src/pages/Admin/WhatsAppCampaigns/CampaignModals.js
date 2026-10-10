import React, { useEffect, useMemo, useState } from "react";
import { Input, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import moment from "moment";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  fetchWhatsAppTemplateDetail,
  fetchWhatsAppTemplatesForCategory,
  resolveTemplatePreview,
} from "../../../helpers/whatsapp_helper";
import { getWhatsAppCampaignDetails } from "../../../helpers/realbackend_helper";
import {
  CATEGORIES,
  STATUS_LABELS,
  categoryLabel,
  formatCount,
  formatDateTime,
  pct,
} from "./campaignStore";

const ModalTitle = ({ icon, color = "#25a0e2", children }) => (
  <span className="patient-list-modal__title patient-list-modal__title--simple">
    <i className={icon} style={{ color, fontSize: 15 }} aria-hidden="true" />
    <span className="patient-list-modal__title-text">{children}</span>
  </span>
);

export const CampaignStatusPill = ({ status }) => (
  <span className={`wac-pill wac-pill--${status}`}>{STATUS_LABELS[status] || status}</span>
);

const WhatsAppPreview = ({ body, sentAt }) => (
  <div className="wac-phone">
    <div className="wac-phone__bar">
      <span className="wac-phone__avatar"><i className="ri-whatsapp-line" aria-hidden="true" /></span>
      <span>
        <strong>Homeo Centrum</strong>
        <small>Business account</small>
      </span>
    </div>
    <div className="wac-phone__chat">
      {body ? (
        <div className="wac-bubble">
          <p>{body}</p>
          <span>{sentAt ? moment(sentAt).format("hh:mm A") : moment().format("hh:mm A")} <i className="ri-check-double-line" aria-hidden="true" /></span>
        </div>
      ) : (
        <div className="wac-phone__empty">Select a template to preview the message.</div>
      )}
    </div>
  </div>
);

const EMPTY_FORM = {
  name: "",
  category: "HospitalService",
  templateID: "",
  templateName: "",
  templateBody: "",
  doctorId: "",
};

/** New / duplicate campaign: sends now through /WhatsApp/SendBulkMessage to the doctor's opted-in patients. */
export const CampaignFormModal = ({ isOpen, mode, campaign, doctors, busy, onClose, onSend }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    const firstDoctor = doctors.find((d) => d.optedIn > 0) || doctors[0];
    if (campaign) {
      setForm({
        ...EMPTY_FORM,
        name: mode === "duplicate" ? `${campaign.name} (copy)` : campaign.name,
        category: campaign.category || "HospitalService",
        doctorId: campaign.doctorId ? String(campaign.doctorId) : firstDoctor ? String(firstDoctor.doctorId) : "",
      });
    } else {
      setForm({ ...EMPTY_FORM, doctorId: firstDoctor ? String(firstDoctor.doctorId) : "" });
    }
  }, [isOpen, campaign, mode, doctors]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError("");
    fetchWhatsAppTemplatesForCategory(form.category)
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setTemplates([]);
        setTemplatesError(err?.message || "Templates could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, form.category]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectTemplate = async (templateID) => {
    const template = templates.find((t) => String(t.templateID) === String(templateID));
    setForm((prev) => ({
      ...prev,
      templateID,
      templateName: template?.templateName || "",
      templateBody: template?.templateBody || "",
      name: prev.name || template?.templateName || "",
    }));
    if (template && !template.templateBody) {
      try {
        const detail = await fetchWhatsAppTemplateDetail(template.templateID);
        setForm((prev) => (prev.templateID === templateID ? { ...prev, templateBody: detail?.templateBody || "" } : prev));
      } catch {
        /* preview stays empty */
      }
    }
  };

  const doctor = doctors.find((d) => String(d.doctorId) === String(form.doctorId));
  const preview = useMemo(
    () => resolveTemplatePreview(form.templateBody, doctor ? { "{{DoctorName}}": doctor.doctorName } : {}),
    [form.templateBody, doctor]
  );

  const errors = {};
  if (!form.name.trim()) errors.name = "Campaign name is required";
  if (!form.templateID) errors.templateID = "Select a template";
  if (!form.doctorId) errors.doctorId = "Select the doctor whose patients will receive this";
  else if (!doctor?.optedIn) errors.doctorId = "This doctor has no patients opted in to WhatsApp";
  const fieldError = (key) => (touched && errors[key] ? errors[key] : "");

  const submit = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    onSend({
      name: form.name.trim(),
      category: form.category,
      templateID: Number(form.templateID),
      templateName: form.templateName,
      doctorId: Number(form.doctorId),
      doctorName: doctor?.doctorName || "",
      recipients: doctor?.optedIn || 0,
    });
  };

  const title = mode === "duplicate" ? "Duplicate campaign" : "New campaign";

  return (
    <Modal isOpen={isOpen} centered size="xl" toggle={busy ? undefined : onClose} className="patient-list-modal wac-modal">
      <ModalHeader toggle={busy ? undefined : onClose} className="patient-list-modal__header">
        <ModalTitle icon="ri-whatsapp-line" color="#16a34a">{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="wac-form">
          <div className="wac-form__main">
            <p className="wac-section">1. Campaign details</p>
            <div className="wac-grid-2">
              <div className="wac-field">
                <label htmlFor="wac-name">Campaign name<span className="text-danger"> *</span></label>
                <Input
                  id="wac-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  invalid={Boolean(fieldError("name"))}
                  placeholder="e.g. Follow-up Reminder - October"
                  maxLength={200}
                />
                {fieldError("name") ? <div className="invalid-feedback d-block">{fieldError("name")}</div> : null}
              </div>
              <div className="wac-field">
                <label htmlFor="wac-category">Message type</label>
                <Input
                  id="wac-category"
                  type="select"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value, templateID: "", templateName: "", templateBody: "" }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </Input>
              </div>
            </div>
            <div className="wac-field">
              <label htmlFor="wac-template">
                WhatsApp template<span className="text-danger"> *</span>
                {templatesLoading ? <Spinner size="sm" className="ms-2" /> : null}
              </label>
              <Input
                id="wac-template"
                type="select"
                value={form.templateID}
                onChange={(e) => selectTemplate(e.target.value)}
                invalid={Boolean(fieldError("templateID"))}
                disabled={templatesLoading}
              >
                <option value="">
                  {!templatesLoading && !templates.length ? "No active templates for this message type" : "Select an approved template"}
                </option>
                {templates.map((t) => (
                  <option key={t.templateID} value={t.templateID}>{t.templateName}</option>
                ))}
              </Input>
              {templatesError ? <div className="invalid-feedback d-block">{templatesError}</div> : null}
              {fieldError("templateID") ? <div className="invalid-feedback d-block">{fieldError("templateID")}</div> : null}
            </div>

            <p className="wac-section">2. Audience</p>
            <div className="wac-field">
              <label htmlFor="wac-doctor">Send to patients of<span className="text-danger"> *</span></label>
              <Input
                id="wac-doctor"
                type="select"
                value={form.doctorId}
                onChange={(e) => set("doctorId", e.target.value)}
                invalid={Boolean(fieldError("doctorId"))}
              >
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.doctorId} value={d.doctorId}>
                    {d.doctorName} — {formatCount(d.optedIn)} opted-in patient{d.optedIn === 1 ? "" : "s"}
                  </option>
                ))}
              </Input>
              {fieldError("doctorId") ? <div className="invalid-feedback d-block">{fieldError("doctorId")}</div> : null}
            </div>
            <p className="wac-note">
              <i className="ri-information-line" aria-hidden="true" /> Only patients who opted in to WhatsApp and have a mobile number receive the message.
            </p>
          </div>

          <aside className="wac-form__side">
            <p className="wac-section">Message preview</p>
            <WhatsAppPreview body={preview} />
            <dl className="wac-summary">
              <div><dt>Doctor</dt><dd>{doctor?.doctorName || "—"}</dd></div>
              <div><dt>Recipients</dt><dd>{formatCount(doctor?.optedIn)}</dd></div>
              <div><dt>Message type</dt><dd>{categoryLabel(form.category)}</dd></div>
              <div><dt>Delivery</dt><dd>Immediately</dd></div>
            </dl>
          </aside>
        </div>
      </ModalBody>
      <ModalFooter className="wac-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton action="send" loading={busy} onClick={submit}>
          Send campaign
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

const Funnel = ({ campaign }) => {
  const rows = [
    { label: "Sent", value: campaign.sent, base: campaign.sent, tone: "blue" },
    { label: "Delivered", value: campaign.delivered, base: campaign.sent, tone: "green" },
    { label: "Failed", value: campaign.failed, base: campaign.sent, tone: "red" },
  ];
  return (
    <div className="wac-funnel">
      {rows.map((r) => (
        <div key={r.label} className={`wac-funnel__row wac-funnel__row--${r.tone}`}>
          <span className="wac-funnel__label">{r.label}</span>
          <span className="wac-funnel__bar">
            <span style={{ width: r.base ? `${Math.min(100, (r.value / r.base) * 100)}%` : "0%" }} />
          </span>
          <span className="wac-funnel__value">
            {formatCount(r.value)}
            {r.label !== "Sent" ? <small> {pct(r.value, r.base)}</small> : null}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CampaignDetailsModal = ({ campaign, onClose, onDuplicate, onExport }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!campaign?.apiId) return undefined;
    let cancelled = false;
    setDetail(null);
    setError("");
    setLoading(true);
    getWhatsAppCampaignDetails(campaign.apiId)
      .then((response) => {
        if (cancelled) return;
        if (response?.success === false) setError(response?.message || "Campaign details could not be loaded.");
        else setDetail(response?.resultObject ?? response?.ResultObject ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(typeof err === "string" ? err : err?.message || "Campaign details could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  if (!campaign) return null;
  const messageBody = detail?.messageBody || "";
  const recent = Array.isArray(detail?.recentMessages) ? detail.recentMessages : [];

  return (
    <Modal isOpen centered size="lg" toggle={onClose} className="patient-list-modal wac-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon="ri-bar-chart-box-line">Campaign details</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="wac-detail-head">
          <div>
            <strong>{campaign.name}</strong>
            <span>{campaign.doctorName} · {categoryLabel(campaign.category)}</span>
          </div>
          <CampaignStatusPill status={campaign.status} />
        </div>
        {error ? (
          <div className="wac-alert wac-alert--error">
            <i className="ri-error-warning-line" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="wac-detail">
          <div className="wac-detail__main">
            <p className="wac-section">Delivery report</p>
            {campaign.sent ? (
              <Funnel campaign={campaign} />
            ) : (
              <div className="wac-detail__empty">
                <i className="ri-time-line" aria-hidden="true" />
                Messages are being sent. Delivery numbers appear here as each message is logged.
              </div>
            )}
            <p className="wac-section">Created</p>
            <ul className="wac-timeline">
              <li>
                <i className="ri-add-circle-line" aria-hidden="true" />
                <span>Created</span>
                <strong>{formatDateTime(campaign.createdAt)}</strong>
              </li>
            </ul>
            <p className="wac-section">Recent messages</p>
            {loading ? (
              <Spinner size="sm" />
            ) : recent.length ? (
              <ul className="wac-timeline">
                {recent.map((m) => (
                  <li key={m.whatsAppMessageLogID}>
                    <i
                      className={m.sendStatus ? "ri-check-double-line" : "ri-error-warning-line"}
                      style={{ color: m.sendStatus ? "#16a34a" : "#ef4444" }}
                      aria-hidden="true"
                    />
                    <span title={m.errorMessage || ""}>
                      {m.patientName || m.mobileNumber || "Patient"}
                      {!m.sendStatus && m.errorMessage ? ` — ${m.errorMessage}` : ""}
                    </span>
                    <strong>{formatDateTime(m.createdDate)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="wac-detail__empty">No messages logged for this campaign yet.</div>
            )}
          </div>
          <aside className="wac-detail__side">
            <p className="wac-section">Message</p>
            <WhatsAppPreview body={resolveTemplatePreview(messageBody)} sentAt={campaign.createdAt} />
          </aside>
        </div>
      </ModalBody>
      <ModalFooter className="wac-modal__footer">
        <ModalActionButton action="download" onClick={() => onExport(campaign)}>Export report</ModalActionButton>
        <ModalActionButton action="add" iconClassName="ri-file-copy-line" onClick={() => onDuplicate(campaign)}>Duplicate</ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};
