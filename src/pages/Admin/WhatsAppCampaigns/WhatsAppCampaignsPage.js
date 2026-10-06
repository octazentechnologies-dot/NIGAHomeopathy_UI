import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
  UncontrolledDropdown,
} from "reactstrap";
import moment from "moment";
import { getWhatsAppCampaignHistory } from "../../../helpers/realbackend_helper";
import {
  CampaignDetailsModal,
  CampaignFormModal,
  CampaignStatusPill,
  ConfirmCampaignModal,
} from "./CampaignModals";
import {
  CAMPAIGN_STATUS,
  STATUS_LABELS,
  audienceLabel,
  campaignInitials,
  categoryLabel,
  formatCount,
  formatDateTime,
  normalizeApiCampaign,
  pct,
  readCampaigns,
  writeCampaigns,
} from "./campaignStore";
import { downloadCsv } from "../PlatformUsers/platformUsersData";
import "./whatsappCampaigns.css";

const PAGE_SIZE = 8;

const TABS = [
  { id: "all", label: "All Campaigns" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "draft", label: "Drafts" },
];

const inTab = (campaign, tab) => {
  if (tab === "all") return true;
  if (tab === "scheduled") return campaign.status === CAMPAIGN_STATUS.SCHEDULED || campaign.status === CAMPAIGN_STATUS.QUEUED;
  return campaign.status === tab;
};

const isLocalEditable = (c) =>
  c.source !== "api" && (c.status === CAMPAIGN_STATUS.DRAFT || c.status === CAMPAIGN_STATUS.SCHEDULED);

const campaignMeta = (c) => {
  if (c.status === CAMPAIGN_STATUS.SCHEDULED) return `Scheduled · ${formatDateTime(c.scheduledAt)}`;
  if (c.status === CAMPAIGN_STATUS.QUEUED) return "Queued for delivery";
  if (c.status === CAMPAIGN_STATUS.DRAFT) return "Draft · not sent";
  return c.sentAt ? `Sent · ${moment(c.sentAt).format("DD MMM YYYY")}` : categoryLabel(c.category);
};

const pageNumbers = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
};

/** Admin → WhatsApp campaigns: create, schedule and track bulk WhatsApp messages to patients. */
const WhatsAppCampaignsPage = () => {
  document.title = "WhatsApp Campaigns | Niga Homeocentrum";

  const [apiCampaigns, setApiCampaigns] = useState([]);
  const [localCampaigns, setLocalCampaigns] = useState(() => readCampaigns());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getWhatsAppCampaignHistory({ pageNumber: 1, pageSize: 100 });
      const list = response?.resultObject ?? response?.ResultObject ?? [];
      setApiCampaigns(response?.success !== false && Array.isArray(list) ? list.map(normalizeApiCampaign) : []);
    } catch {
      setApiCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const persist = (updater) => {
    setLocalCampaigns((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeCampaigns(next);
      return next;
    });
  };

  const campaigns = useMemo(() => {
    const merged = [...apiCampaigns, ...localCampaigns];
    return merged.sort((a, b) => {
      const at = moment(a.sentAt || a.scheduledAt || a.createdAt).valueOf() || 0;
      const bt = moment(b.sentAt || b.scheduledAt || b.createdAt).valueOf() || 0;
      return bt - at;
    });
  }, [apiCampaigns, localCampaigns]);

  const showsSample = campaigns.some((c) => c.sample);

  const stats = useMemo(() => {
    const sentCampaigns = campaigns.filter((c) => c.sent > 0);
    const sent = sentCampaigns.reduce((s, c) => s + c.sent, 0);
    const targeted = sentCampaigns.reduce((s, c) => s + (c.targeted || c.sent), 0);
    const delivered = campaigns.reduce((s, c) => s + (c.delivered || 0), 0);
    const failed = campaigns.reduce((s, c) => s + (c.failed || 0), 0);
    const optOuts = campaigns.reduce((s, c) => s + (c.optOuts || 0), 0);
    const completedCount = campaigns.filter((c) => c.status === CAMPAIGN_STATUS.COMPLETED).length;
    return [
      { id: "total", label: "Total Campaigns", value: campaigns.length, sub: `${pct(completedCount, campaigns.length, 0)} completed`, tone: "blue", icon: "ri-megaphone-line" },
      { id: "sent", label: "Sent", value: sent, sub: `${pct(sent, targeted)} of targeted`, tone: "green", icon: "ri-send-plane-line" },
      { id: "delivered", label: "Delivered", value: delivered, sub: `${pct(delivered, sent)} delivery rate`, tone: "teal", icon: "ri-check-double-line" },
      { id: "failed", label: "Failed", value: failed, sub: `${pct(failed, sent, 1)} of sent`, tone: "red", icon: "ri-error-warning-line" },
      { id: "optouts", label: "Opt-outs", value: optOuts, sub: `${pct(optOuts, sent, 1)} of sent`, tone: "amber", icon: "ri-user-unfollow-line" },
    ];
  }, [campaigns]);

  const counts = useMemo(
    () => TABS.reduce((acc, t) => ({ ...acc, [t.id]: campaigns.filter((c) => inTab(c, t.id)).length }), {}),
    [campaigns]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (!inTab(c, tab)) return false;
      if (!query) return true;
      return [c.name, audienceLabel(c.audience), c.templateName, categoryLabel(c.category)].join(" ").toLowerCase().includes(query);
    });
  }, [campaigns, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const flash = (message) => {
    setNotice(message);
    setError("");
  };

  const handleSave = (values, action) => {
    const status =
      action === "draft" ? CAMPAIGN_STATUS.DRAFT : action === "schedule" ? CAMPAIGN_STATUS.SCHEDULED : CAMPAIGN_STATUS.QUEUED;
    const isEdit = formState?.mode === "edit";
    if (isEdit) {
      persist((prev) => prev.map((c) => (c.id === formState.campaign.id ? { ...c, ...values, status } : c)));
    } else {
      persist((prev) => [
        {
          id: `cmp-${Date.now()}`,
          ...values,
          sent: 0,
          delivered: 0,
          failed: 0,
          optOuts: 0,
          status,
          sentAt: null,
          createdAt: moment().toISOString(),
        },
        ...prev,
      ]);
    }
    setFormState(null);
    if (action === "draft") flash(`"${values.name}" was saved as a draft.`);
    else if (action === "schedule") flash(`"${values.name}" is scheduled for ${formatDateTime(values.scheduledAt)}.`);
    else flash(`"${values.name}" was queued for delivery to ~${formatCount(values.targeted)} patients.`);
  };

  const handleConfirm = () => {
    if (!confirmState) return;
    const { kind, campaign } = confirmState;
    if (kind === "delete") {
      persist((prev) => prev.filter((c) => c.id !== campaign.id));
      flash(`"${campaign.name}" was deleted.`);
    } else if (kind === "cancel") {
      persist((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: CAMPAIGN_STATUS.DRAFT, scheduledAt: null } : c))
      );
      flash(`"${campaign.name}" was moved back to drafts.`);
    } else if (kind === "send") {
      persist((prev) =>
        prev.map((c) => (c.id === campaign.id ? { ...c, status: CAMPAIGN_STATUS.QUEUED, scheduledAt: null } : c))
      );
      flash(`"${campaign.name}" was queued for delivery.`);
    }
    setConfirmState(null);
  };

  const exportCampaign = (c) => {
    downloadCsv(`campaign-${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`, [
      ["Campaign", c.name],
      ["Status", STATUS_LABELS[c.status] || c.status],
      ["Audience", audienceLabel(c.audience)],
      ["Message type", categoryLabel(c.category)],
      ["Template", c.templateName || ""],
      ["Scheduled for", formatDateTime(c.scheduledAt)],
      ["Sent on", formatDateTime(c.sentAt)],
      [],
      ["Metric", "Count", "Rate"],
      ["Targeted", c.targeted, ""],
      ["Sent", c.sent, pct(c.sent, c.targeted)],
      ["Delivered", c.delivered, pct(c.delivered, c.sent)],
      ["Failed", c.failed, pct(c.failed, c.sent, 1)],
      ["Opt-outs", c.optOuts, pct(c.optOuts, c.sent, 1)],
    ]);
  };

  const exportList = () => {
    downloadCsv(`whatsapp-campaigns-${moment().format("YYYYMMDD-HHmm")}.csv`, [
      ["Campaign", "Audience", "Message type", "Status", "Targeted", "Sent", "Delivered", "Delivery %", "Failed", "Opt-outs", "Scheduled for", "Sent on"],
      ...filtered.map((c) => [
        c.name,
        audienceLabel(c.audience),
        categoryLabel(c.category),
        STATUS_LABELS[c.status] || c.status,
        c.targeted,
        c.sent,
        c.delivered,
        pct(c.delivered, c.sent),
        c.failed,
        c.optOuts,
        formatDateTime(c.scheduledAt),
        formatDateTime(c.sentAt),
      ]),
    ]);
  };

  const openForm = (mode, campaign = null) => {
    setDetail(null);
    setFormState({ mode, campaign });
  };

  const numberCell = (c, value) => (c.sent ? formatCount(value) : "—");

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="wac-page">
          <div className="wac-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">
                WhatsApp Campaigns
                {showsSample ? <span className="wac-sample">Sample data</span> : null}
              </h2>
              <p className="clinic-page-subtitle mb-0">Create and manage WhatsApp campaigns to engage patients</p>
            </div>
            <div className="wac-page__actions">
              <button type="button" className="wac-btn wac-btn--soft" onClick={exportList} disabled={!filtered.length}>
                <i className="ri-download-2-line" aria-hidden="true" /> Export CSV
              </button>
              <button type="button" className="wac-btn wac-btn--primary" onClick={() => openForm("new")}>
                <i className="ri-add-line" aria-hidden="true" /> New Campaign
              </button>
            </div>
          </div>

          {error ? (
            <div className="wac-alert wac-alert--error">
              <i className="ri-error-warning-line" aria-hidden="true" />
              <span>{error}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="wac-alert wac-alert--success">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="wac-stats">
            {stats.map((s) => (
              <div key={s.id} className={`wac-stat wac-stat--${s.tone}`}>
                <span className="wac-stat__icon"><i className={s.icon} aria-hidden="true" /></span>
                <div>
                  <span className="wac-stat__label">{s.label}</span>
                  <strong>{formatCount(s.value)}</strong>
                  <small>{s.sub}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="wac-card">
            <div className="wac-toolbar">
              <div className="wac-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className={`wac-tab${tab === t.id ? " is-active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                    <span>{counts[t.id] ?? 0}</span>
                  </button>
                ))}
              </div>
              <div className="wac-search">
                <i className="ri-search-line" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  aria-label="Search campaigns"
                />
              </div>
            </div>

            <div className="wac-table-wrap">
              <table className="wac-table">
                <colgroup>
                  <col className="wac-col-name" />
                  <col className="wac-col-audience" />
                  <col className="wac-col-num" />
                  <col className="wac-col-delivered" />
                  <col className="wac-col-num" />
                  <col className="wac-col-num" />
                  <col className="wac-col-status" />
                  <col className="wac-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Audience</th>
                    <th>Sent</th>
                    <th>Delivered</th>
                    <th>Failed</th>
                    <th>Opt-outs</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !campaigns.length ? (
                    <tr>
                      <td colSpan={8} className="wac-table__state">
                        <Spinner size="sm" className="me-2" /> Loading campaigns…
                      </td>
                    </tr>
                  ) : pageRows.length ? (
                    pageRows.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <button type="button" className="wac-name" onClick={() => setDetail(c)} title={c.name}>
                            <span className={`wac-avatar wac-avatar--${c.status}`}>{campaignInitials(c.name)}</span>
                            <span className="wac-name__text">
                              <strong>{c.name}</strong>
                              <small>{campaignMeta(c)}</small>
                            </span>
                          </button>
                        </td>
                        <td title={audienceLabel(c.audience)}>{audienceLabel(c.audience)}</td>
                        <td>{numberCell(c, c.sent)}</td>
                        <td>
                          {c.sent ? (
                            <>
                              {formatCount(c.delivered)} <span className="wac-muted">({pct(c.delivered, c.sent)})</span>
                            </>
                          ) : "—"}
                        </td>
                        <td className={c.failed ? "wac-failed" : undefined}>{numberCell(c, c.failed)}</td>
                        <td>{numberCell(c, c.optOuts)}</td>
                        <td><CampaignStatusPill status={c.status} /></td>
                        <td className="wac-action-cell">
                          <UncontrolledDropdown>
                            <DropdownToggle tag="button" type="button" className="wac-kebab" aria-label={`Actions for ${c.name}`}>
                              <i className="ri-more-2-fill" aria-hidden="true" />
                            </DropdownToggle>
                            <DropdownMenu end container="body" className="wac-action-menu">
                              <DropdownItem onClick={() => setDetail(c)}>
                                <i className="ri-eye-line" aria-hidden="true" /> View details
                              </DropdownItem>
                              {isLocalEditable(c) ? (
                                <>
                                  <DropdownItem onClick={() => openForm("edit", c)}>
                                    <i className="ri-pencil-line" aria-hidden="true" /> Edit campaign
                                  </DropdownItem>
                                  <DropdownItem onClick={() => setConfirmState({ kind: "send", campaign: c })}>
                                    <i className="ri-send-plane-line" aria-hidden="true" /> Send now
                                  </DropdownItem>
                                </>
                              ) : null}
                              {c.source !== "api" && c.status === CAMPAIGN_STATUS.SCHEDULED ? (
                                <DropdownItem onClick={() => setConfirmState({ kind: "cancel", campaign: c })}>
                                  <i className="ri-calendar-close-line" aria-hidden="true" /> Cancel schedule
                                </DropdownItem>
                              ) : null}
                              <DropdownItem onClick={() => openForm("duplicate", c)}>
                                <i className="ri-file-copy-line" aria-hidden="true" /> Duplicate
                              </DropdownItem>
                              <DropdownItem onClick={() => exportCampaign(c)}>
                                <i className="ri-download-2-line" aria-hidden="true" /> Export report
                              </DropdownItem>
                              {c.source !== "api" ? (
                                <>
                                  <DropdownItem divider />
                                  <DropdownItem className="is-danger" onClick={() => setConfirmState({ kind: "delete", campaign: c })}>
                                    <i className="ri-delete-bin-line" aria-hidden="true" /> Delete
                                  </DropdownItem>
                                </>
                              ) : null}
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="wac-table__state">
                        <i className="ri-chat-off-line" aria-hidden="true" /> No campaigns here yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="wac-footer">
              <span>
                {filtered.length
                  ? `Showing ${startIndex + 1} to ${Math.min(startIndex + PAGE_SIZE, filtered.length)} of ${filtered.length} campaigns`
                  : "Showing 0 campaigns"}
              </span>
              <div className="wac-pager">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                  <i className="ri-arrow-left-s-line" aria-hidden="true" />
                </button>
                {pageNumbers(safePage, totalPages).map((p, index) =>
                  p === "…" ? (
                    <span key={`gap-${index}`} className="wac-pager__gap">…</span>
                  ) : (
                    <button key={p} type="button" className={p === safePage ? "is-active" : undefined} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  )
                )}
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                  <i className="ri-arrow-right-s-line" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <CampaignFormModal
          isOpen={Boolean(formState)}
          mode={formState?.mode}
          campaign={formState?.campaign}
          busy={false}
          onClose={() => setFormState(null)}
          onSave={handleSave}
        />
        <CampaignDetailsModal
          campaign={detail}
          onClose={() => setDetail(null)}
          onEdit={(c) => openForm("edit", c)}
          onDuplicate={(c) => openForm("duplicate", c)}
          onExport={exportCampaign}
        />
        <ConfirmCampaignModal
          state={confirmState}
          busy={false}
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
        />
      </Container>
    </div>
  );
};

export default WhatsAppCampaignsPage;
