import React, { useEffect, useMemo, useState } from "react";
import { Input, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";
import moment from "moment";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  fetchWhatsAppTemplateDetail,
  fetchWhatsAppTemplatesForCategory,
  resolveTemplatePreview,
} from "../../../helpers/whatsapp_helper";
import {
  AUDIENCES,
  CAMPAIGN_STATUS,
  CATEGORIES,
  SAMPLE_TEMPLATES,
  STATUS_LABELS,
  audienceLabel,
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
  audience: "all",
  scheduleMode: "now",
  scheduledAt: "",
};

const toLocalInput = (value) => (value ? moment(value).format("YYYY-MM-DDTHH:mm") : "");

export const CampaignFormModal = ({ isOpen, mode, campaign, busy, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesSample, setTemplatesSample] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    if (campaign) {
      setForm({
        ...EMPTY_FORM,
        name: mode === "duplicate" ? `${campaign.name} (copy)` : campaign.name,
        category: campaign.category || "HospitalService",
        templateID: campaign.templateID || "",
        templateName: campaign.templateName || "",
        templateBody: campaign.templateBody || "",
        audience: campaign.audience || "all",
        scheduleMode: isEdit && campaign.scheduledAt ? "later" : "now",
        scheduledAt: isEdit ? toLocalInput(campaign.scheduledAt) : "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, campaign, mode, isEdit]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setTemplatesLoading(true);
    fetchWhatsAppTemplatesForCategory(form.category)
      .then((list) => {
        if (cancelled) return;
        if (list.length) {
          setTemplates(list);
          setTemplatesSample(false);
        } else {
          setTemplates(SAMPLE_TEMPLATES[form.category] || []);
          setTemplatesSample(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setTemplates(SAMPLE_TEMPLATES[form.category] || []);
        setTemplatesSample(true);
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, form.category]);

  useEffect(() => {
    if (!templates.length || form.templateID) return;
    const byName = templates.find((t) => t.templateName === form.templateName);
    if (byName) setForm((prev) => ({ ...prev, templateID: String(byName.templateID) }));
  }, [templates, form.templateID, form.templateName]);

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
    if (template && !template.templateBody && !templatesSample) {
      try {
        const detail = await fetchWhatsAppTemplateDetail(template.templateID);
        setForm((prev) => (prev.templateID === templateID ? { ...prev, templateBody: detail?.templateBody || "" } : prev));
      } catch {
        /* preview stays empty */
      }
    }
  };

  const audience = AUDIENCES.find((a) => a.id === form.audience);
  const preview = useMemo(() => resolveTemplatePreview(form.templateBody), [form.templateBody]);

  const errors = {};
  if (!form.name.trim()) errors.name = "Campaign name is required";
  if (!form.templateID && !form.templateName) errors.templateID = "Select a template";
  if (form.scheduleMode === "later") {
    if (!form.scheduledAt) errors.scheduledAt = "Pick a date and time";
    else if (moment(form.scheduledAt).isBefore(moment())) errors.scheduledAt = "Schedule time must be in the future";
  }
  const fieldError = (key) => (touched && errors[key] ? errors[key] : "");

  const submit = (action) => {
    setTouched(true);
    const blocking = action === "draft" ? ["name"] : Object.keys(errors);
    if (blocking.some((key) => errors[key])) return;
    onSave(
      {
        name: form.name.trim(),
        category: form.category,
        templateID: form.templateID,
        templateName: form.templateName,
        templateBody: form.templateBody,
        audience: form.audience,
        targeted: audience?.estimate || 0,
        scheduledAt: form.scheduleMode === "later" && form.scheduledAt ? moment(form.scheduledAt).toISOString() : null,
      },
      action
    );
  };

  const primaryAction = form.scheduleMode === "later" ? "schedule" : "send";
  const title = isEdit ? "Edit campaign" : mode === "duplicate" ? "Duplicate campaign" : "New campaign";

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
                  maxLength={80}
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
                {templatesSample ? <span className="wac-tag">Sample templates</span> : null}
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
                <option value="">Select an approved template</option>
                {templates.map((t) => (
                  <option key={t.templateID} value={t.templateID}>{t.templateName}</option>
                ))}
              </Input>
              {fieldError("templateID") ? <div className="invalid-feedback d-block">{fieldError("templateID")}</div> : null}
            </div>

            <p className="wac-section">2. Audience</p>
            <div className="wac-audiences" role="radiogroup" aria-label="Audience">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={form.audience === a.id}
                  className={`wac-audience${form.audience === a.id ? " is-active" : ""}`}
                  onClick={() => set("audience", a.id)}
                >
                  <i className={a.icon} aria-hidden="true" />
                  <span>
                    <strong>{a.label}</strong>
                    <small>{a.hint}</small>
                  </span>
                  <em>~{formatCount(a.estimate)}</em>
                </button>
              ))}
            </div>
            <p className="wac-note">
              <i className="ri-information-line" aria-hidden="true" /> Patients who opted out of WhatsApp messages are excluded automatically.
            </p>

            <p className="wac-section">3. Schedule</p>
            <div className="wac-schedule">
              <label className={`wac-radio${form.scheduleMode === "now" ? " is-active" : ""}`}>
                <input type="radio" name="wac-schedule" checked={form.scheduleMode === "now"} onChange={() => set("scheduleMode", "now")} />
                <i className="ri-send-plane-line" aria-hidden="true" /> Send now
              </label>
              <label className={`wac-radio${form.scheduleMode === "later" ? " is-active" : ""}`}>
                <input type="radio" name="wac-schedule" checked={form.scheduleMode === "later"} onChange={() => set("scheduleMode", "later")} />
                <i className="ri-calendar-event-line" aria-hidden="true" /> Schedule for later
              </label>
              {form.scheduleMode === "later" ? (
                <div className="wac-field wac-schedule__at">
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    min={moment().format("YYYY-MM-DDTHH:mm")}
                    onChange={(e) => set("scheduledAt", e.target.value)}
                    invalid={Boolean(fieldError("scheduledAt"))}
                    aria-label="Schedule date and time"
                  />
                  {fieldError("scheduledAt") ? <div className="invalid-feedback d-block">{fieldError("scheduledAt")}</div> : null}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="wac-form__side">
            <p className="wac-section">Message preview</p>
            <WhatsAppPreview body={preview} />
            <dl className="wac-summary">
              <div><dt>Audience</dt><dd>{audience?.label}</dd></div>
              <div><dt>Est. recipients</dt><dd>{formatCount(audience?.estimate)}</dd></div>
              <div><dt>Message type</dt><dd>{categoryLabel(form.category)}</dd></div>
              <div>
                <dt>Delivery</dt>
                <dd>{form.scheduleMode === "later" ? (form.scheduledAt ? formatDateTime(form.scheduledAt) : "Not set") : "Immediately"}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </ModalBody>
      <ModalFooter className="wac-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton action="save" iconClassName="ri-draft-line" onClick={() => submit("draft")} disabled={busy}>
          Save as draft
        </ModalActionButton>
        <ModalActionButton
          action={primaryAction === "schedule" ? "confirm" : "send"}
          iconClassName={primaryAction === "schedule" ? "ri-calendar-event-line" : undefined}
          loading={busy}
          onClick={() => submit(primaryAction)}
        >
          {primaryAction === "schedule" ? "Schedule campaign" : "Send campaign"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

const Funnel = ({ campaign }) => {
  const rows = [
    { label: "Targeted", value: campaign.targeted, base: campaign.targeted, tone: "slate" },
    { label: "Sent", value: campaign.sent, base: campaign.targeted, tone: "blue" },
    { label: "Delivered", value: campaign.delivered, base: campaign.sent, tone: "green" },
    { label: "Failed", value: campaign.failed, base: campaign.sent, tone: "red" },
    { label: "Opt-outs", value: campaign.optOuts, base: campaign.sent, tone: "amber" },
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
            {r.label !== "Targeted" ? <small> {pct(r.value, r.base)}</small> : null}
          </span>
        </div>
      ))}
    </div>
  );
};

export const CampaignDetailsModal = ({ campaign, onClose, onEdit, onDuplicate, onExport }) => {
  if (!campaign) return null;
  const editable = campaign.source !== "api" && [CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(campaign.status);
  const preview = resolveTemplatePreview(campaign.templateBody);
  const timeline = [
    { label: "Created", value: campaign.createdAt, icon: "ri-add-circle-line" },
    campaign.scheduledAt ? { label: "Scheduled for", value: campaign.scheduledAt, icon: "ri-calendar-event-line" } : null,
    campaign.sentAt ? { label: "Sent", value: campaign.sentAt, icon: "ri-send-plane-line" } : null,
  ].filter(Boolean);

  return (
    <Modal isOpen centered size="lg" toggle={onClose} className="patient-list-modal wac-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon="ri-bar-chart-box-line">Campaign details</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="wac-detail-head">
          <div>
            <strong>{campaign.name}</strong>
            <span>{audienceLabel(campaign.audience)} · {categoryLabel(campaign.category)}{campaign.templateName ? ` · ${campaign.templateName}` : ""}</span>
          </div>
          <CampaignStatusPill status={campaign.status} />
        </div>
        {campaign.failureReason ? (
          <div className="wac-alert wac-alert--error">
            <i className="ri-error-warning-line" aria-hidden="true" />
            <span>{campaign.failureReason}</span>
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
                {campaign.status === CAMPAIGN_STATUS.DRAFT
                  ? "This campaign is a draft and has not been sent."
                  : `Delivery numbers will appear once the campaign is sent to ${formatCount(campaign.targeted)} patients.`}
              </div>
            )}
            <p className="wac-section">Timeline</p>
            <ul className="wac-timeline">
              {timeline.map((t) => (
                <li key={t.label}>
                  <i className={t.icon} aria-hidden="true" />
                  <span>{t.label}</span>
                  <strong>{formatDateTime(t.value)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <aside className="wac-detail__side">
            <p className="wac-section">Message</p>
            <WhatsAppPreview body={preview || (campaign.templateName ? `Template: ${campaign.templateName}` : "")} sentAt={campaign.sentAt} />
          </aside>
        </div>
      </ModalBody>
      <ModalFooter className="wac-modal__footer">
        <ModalActionButton action="download" onClick={() => onExport(campaign)}>Export report</ModalActionButton>
        <ModalActionButton action="add" iconClassName="ri-file-copy-line" onClick={() => onDuplicate(campaign)}>Duplicate</ModalActionButton>
        {editable ? <ModalActionButton action="edit" onClick={() => onEdit(campaign)} /> : null}
      </ModalFooter>
    </Modal>
  );
};

const CONFIRM_COPY = {
  delete: {
    title: "Delete campaign",
    icon: "ri-delete-bin-line",
    color: "#ef4444",
    text: "The campaign and its report will be removed. This cannot be undone.",
    action: "delete",
    label: "Delete campaign",
  },
  cancel: {
    title: "Cancel scheduled campaign",
    icon: "ri-calendar-close-line",
    color: "#f59e0b",
    text: "The campaign will not be sent and will move back to drafts.",
    action: "confirm",
    label: "Cancel schedule",
    confirmIcon: "ri-calendar-close-line",
  },
  send: {
    title: "Send campaign now",
    icon: "ri-send-plane-line",
    color: "#16a34a",
    text: "The campaign will be queued for delivery to the selected audience right away.",
    action: "send",
    label: "Send now",
  },
};

export const ConfirmCampaignModal = ({ state, busy, onClose, onConfirm }) => {
  if (!state) return null;
  const copy = CONFIRM_COPY[state.kind];
  const { campaign } = state;
  return (
    <Modal isOpen centered toggle={busy ? undefined : onClose} className="patient-list-modal wac-modal">
      <ModalHeader toggle={busy ? undefined : onClose} className="patient-list-modal__header">
        <ModalTitle icon={copy.icon} color={copy.color}>{copy.title}</ModalTitle>
      </ModalHeader>
      <ModalBody className="wac-confirm">
        <div className="wac-confirm__subject">
          <span className="wac-avatar"><i className="ri-whatsapp-line" aria-hidden="true" /></span>
          <div>
            <strong>{campaign.name}</strong>
            <span>{audienceLabel(campaign.audience)} · ~{formatCount(campaign.targeted)} patients</span>
          </div>
        </div>
        <p>{copy.text}</p>
      </ModalBody>
      <ModalFooter className="wac-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy}>Close</ModalActionButton>
        <ModalActionButton action={copy.action} iconClassName={copy.confirmIcon} loading={busy} onClick={onConfirm}>
          {copy.label}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};
