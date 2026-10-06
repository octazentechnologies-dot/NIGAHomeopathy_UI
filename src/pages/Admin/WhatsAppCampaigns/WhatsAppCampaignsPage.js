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
import { getWhatsAppCampaignHistory, sendWhatsAppBulkMessage } from "../../../helpers/realbackend_helper";
import { whatsAppAudience } from "../../../helpers/s5Week5Api";
import { CampaignDetailsModal, CampaignFormModal, CampaignStatusPill } from "./CampaignModals";
import {
  CAMPAIGN_STATUS,
  STATUS_LABELS,
  campaignInitials,
  categoryLabel,
  formatCount,
  formatDateTime,
  normalizeApiCampaign,
  pct,
} from "./campaignStore";
import { downloadCsv } from "../PlatformUsers/platformUsersData";
import "./whatsappCampaigns.css";

const PAGE_SIZE = 8;

const TABS = [
  { id: "all", label: "All Campaigns" },
  { id: CAMPAIGN_STATUS.QUEUED, label: "In progress" },
  { id: CAMPAIGN_STATUS.COMPLETED, label: "Completed" },
  { id: CAMPAIGN_STATUS.FAILED, label: "Failed" },
];

const inTab = (campaign, tab) => tab === "all" || campaign.status === tab;

const campaignMeta = (c) =>
  `${categoryLabel(c.category)} · ${c.createdAt ? moment(c.createdAt).format("DD MMM YYYY") : "—"}`;

const errorText = (err, fallback) => (typeof err === "string" ? err : err?.message || fallback);

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

/** Admin → WhatsApp campaigns: send bulk template messages to a doctor's opted-in patients and track delivery. */
const WhatsAppCampaignsPage = () => {
  document.title = "WhatsApp Campaigns | Niga Homeocentrum";

  const [rawCampaigns, setRawCampaigns] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [historyRes, audienceRes] = await Promise.allSettled([
      getWhatsAppCampaignHistory({ pageNumber: 1, pageSize: 100 }),
      whatsAppAudience(),
    ]);
    if (historyRes.status === "fulfilled" && historyRes.value?.success !== false) {
      const list = historyRes.value?.resultObject ?? historyRes.value?.ResultObject ?? [];
      setRawCampaigns(Array.isArray(list) ? list : []);
    } else {
      setRawCampaigns([]);
      setError(
        historyRes.status === "fulfilled"
          ? historyRes.value?.message || "Campaign history could not be loaded."
          : errorText(historyRes.reason, "Campaign history could not be loaded.")
      );
    }
    if (audienceRes.status === "fulfilled") {
      const rows = audienceRes.value?.data ?? [];
      setDoctors(
        (Array.isArray(rows) ? rows : []).map((r) => ({
          doctorId: r.doctorId,
          doctorName: r.doctorName || `Doctor #${r.doctorId}`,
          optedIn: Number(r.optedIn) || 0,
        }))
      );
    } else {
      setDoctors([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const campaigns = useMemo(() => {
    const doctorNameById = doctors.reduce((acc, d) => ({ ...acc, [d.doctorId]: d.doctorName }), {});
    return rawCampaigns.map((row) => normalizeApiCampaign(row, doctorNameById));
  }, [rawCampaigns, doctors]);

  const stats = useMemo(() => {
    const sent = campaigns.reduce((s, c) => s + c.sent, 0);
    const delivered = campaigns.reduce((s, c) => s + c.delivered, 0);
    const failed = campaigns.reduce((s, c) => s + c.failed, 0);
    const reachable = doctors.reduce((s, d) => s + d.optedIn, 0);
    const completedCount = campaigns.filter((c) => c.status === CAMPAIGN_STATUS.COMPLETED).length;
    return [
      { id: "total", label: "Total Campaigns", value: campaigns.length, sub: `${pct(completedCount, campaigns.length, 0)} completed`, tone: "blue", icon: "ri-megaphone-line" },
      { id: "sent", label: "Messages", value: sent, sub: "Across all campaigns", tone: "green", icon: "ri-send-plane-line" },
      { id: "delivered", label: "Delivered", value: delivered, sub: `${pct(delivered, sent)} delivery rate`, tone: "teal", icon: "ri-check-double-line" },
      { id: "failed", label: "Failed", value: failed, sub: `${pct(failed, sent, 1)} of messages`, tone: "red", icon: "ri-error-warning-line" },
      { id: "reach", label: "Opted-in patients", value: reachable, sub: "Reachable on WhatsApp", tone: "amber", icon: "ri-user-follow-line" },
    ];
  }, [campaigns, doctors]);

  const counts = useMemo(
    () => TABS.reduce((acc, t) => ({ ...acc, [t.id]: campaigns.filter((c) => inTab(c, t.id)).length }), {}),
    [campaigns]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (!inTab(c, tab)) return false;
      if (!query) return true;
      return [c.name, c.doctorName, categoryLabel(c.category)].join(" ").toLowerCase().includes(query);
    });
  }, [campaigns, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSend = async (values) => {
    setSending(true);
    setError("");
    try {
      const response = await sendWhatsAppBulkMessage({
        doctorID: values.doctorId,
        campaignName: values.name,
        messageCategory: values.category,
        templateID: values.templateID,
        doctorName: values.doctorName,
      });
      if (response?.success === false) throw new Error(response?.message || "The campaign could not be sent.");
      const queued = response?.resultObject?.totalQueued ?? values.recipients;
      setFormState(null);
      setNotice(`"${values.name}" was queued for delivery to ${formatCount(queued)} patients.`);
      await load();
    } catch (err) {
      setError(errorText(err, "The campaign could not be sent."));
    } finally {
      setSending(false);
    }
  };

  const exportCampaign = (c) => {
    downloadCsv(`campaign-${c.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`, [
      ["Campaign", c.name],
      ["Status", STATUS_LABELS[c.status] || c.status],
      ["Doctor", c.doctorName],
      ["Message type", categoryLabel(c.category)],
      ["Created", formatDateTime(c.createdAt)],
      [],
      ["Metric", "Count", "Rate"],
      ["Messages", c.sent, ""],
      ["Delivered", c.delivered, pct(c.delivered, c.sent)],
      ["Failed", c.failed, pct(c.failed, c.sent, 1)],
    ]);
  };

  const exportList = () => {
    downloadCsv(`whatsapp-campaigns-${moment().format("YYYYMMDD-HHmm")}.csv`, [
      ["Campaign", "Doctor", "Message type", "Status", "Messages", "Delivered", "Delivery %", "Failed", "Created"],
      ...filtered.map((c) => [
        c.name,
        c.doctorName,
        categoryLabel(c.category),
        STATUS_LABELS[c.status] || c.status,
        c.sent,
        c.delivered,
        pct(c.delivered, c.sent),
        c.failed,
        formatDateTime(c.createdAt),
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
              <h2 className="clinic-page-title mb-1">WhatsApp Campaigns</h2>
              <p className="clinic-page-subtitle mb-0">Send WhatsApp campaigns to opted-in patients and track delivery</p>
            </div>
            <div className="wac-page__actions">
              <button type="button" className="wac-btn wac-btn--soft" onClick={load} disabled={loading}>
                <i className="ri-refresh-line" aria-hidden="true" /> Refresh
              </button>
              <button type="button" className="wac-btn wac-btn--soft" onClick={exportList} disabled={!filtered.length}>
                <i className="ri-download-2-line" aria-hidden="true" /> Export CSV
              </button>
              <button type="button" className="wac-btn wac-btn--primary" onClick={() => openForm("new")} disabled={loading}>
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
                  <strong>{loading ? "—" : formatCount(s.value)}</strong>
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
                  <col className="wac-col-status" />
                  <col className="wac-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Doctor</th>
                    <th>Messages</th>
                    <th>Delivered</th>
                    <th>Failed</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !campaigns.length ? (
                    <tr>
                      <td colSpan={7} className="wac-table__state">
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
                        <td title={c.doctorName}>{c.doctorName}</td>
                        <td>{numberCell(c, c.sent)}</td>
                        <td>
                          {c.sent ? (
                            <>
                              {formatCount(c.delivered)} <span className="wac-muted">({pct(c.delivered, c.sent)})</span>
                            </>
                          ) : "—"}
                        </td>
                        <td className={c.failed ? "wac-failed" : undefined}>{numberCell(c, c.failed)}</td>
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
                              <DropdownItem onClick={() => openForm("duplicate", c)}>
                                <i className="ri-file-copy-line" aria-hidden="true" /> Duplicate
                              </DropdownItem>
                              <DropdownItem onClick={() => exportCampaign(c)}>
                                <i className="ri-download-2-line" aria-hidden="true" /> Export report
                              </DropdownItem>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="wac-table__state">
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
          doctors={doctors}
          busy={sending}
          onClose={() => setFormState(null)}
          onSend={handleSend}
        />
        <CampaignDetailsModal
          campaign={detail}
          onClose={() => setDetail(null)}
          onDuplicate={(c) => openForm("duplicate", c)}
          onExport={exportCampaign}
        />
      </Container>
    </div>
  );
};

export default WhatsAppCampaignsPage;
