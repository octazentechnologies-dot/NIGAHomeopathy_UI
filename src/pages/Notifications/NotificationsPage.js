import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Col, Container, Input, Label, Row, Spinner } from "reactstrap";
import moment from "moment";
import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  patchNotification,
  s4Message,
  saveNotificationPreferences,
} from "../../helpers/s5Week5Api";
import "./notificationsPage.css";

const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

const DEFAULT_PREFS = {
  pushEnabled: true,
  smsEnabled: false,
  emailEnabled: false,
  appointments: true,
  prescriptions: true,
  medicines: true,
  marketing: false,
  quietHoursEnabled: false,
  quietStart: "",
  quietEnd: "",
  reminderOffsets: "",
};

/** API returns TimeSpan as "HH:mm:ss" or null; time inputs need "HH:mm". */
const toTimeInput = (value) => {
  if (value == null || value === "") return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

/** Empty → null; "HH:mm" → "HH:mm:00" so System.TimeSpan binds. */
const toTimeSpan = (value) => {
  if (value == null || String(value).trim() === "") return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hh = match[1].padStart(2, "0");
  const mm = match[2];
  const ss = match[3] || "00";
  return `${hh}:${mm}:${ss}`;
};

const normalizePrefs = (raw) => {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    ...DEFAULT_PREFS,
    ...source,
    quietStart: toTimeInput(source.quietStart),
    quietEnd: toTimeInput(source.quietEnd),
    reminderOffsets: source.reminderOffsets == null ? "" : String(source.reminderOffsets),
  };
};

const prefsPayload = (prefs) => ({
  pushEnabled: Boolean(prefs.pushEnabled),
  smsEnabled: Boolean(prefs.smsEnabled),
  emailEnabled: Boolean(prefs.emailEnabled),
  appointments: Boolean(prefs.appointments),
  prescriptions: Boolean(prefs.prescriptions),
  medicines: Boolean(prefs.medicines),
  marketing: Boolean(prefs.marketing),
  quietHoursEnabled: Boolean(prefs.quietHoursEnabled),
  quietStart: toTimeSpan(prefs.quietStart),
  quietEnd: toTimeSpan(prefs.quietEnd),
  reminderOffsets: prefs.reminderOffsets?.trim() ? prefs.reminderOffsets.trim() : null,
});

const normalize = (row) => ({
  id: row.appNotificationId,
  title: row.title || "Notification",
  message: row.body || "",
  unread: !row.isRead,
  at: row.createdAt,
  type: row.type || null,
  deepLink: row.deepLink || null,
});

const INBOX_REFRESH_EVENT = "homeocentrum-inbox-refresh";

const NotificationsPage = () => {
  document.title = "Notifications | Niga Homeocentrum";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [prefs, setPrefs] = useState(null);
  const [prefsNote, setPrefsNote] = useState("");
  const [prefsError, setPrefsError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listNotifications();
      const rows = Array.isArray(response?.data) ? response.data : [];
      setItems(rows.map(normalize));
    } catch (err) {
      setItems([]);
      setError(s4Message(err) || "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(INBOX_REFRESH_EVENT, onRefresh);
    getNotificationPreferences()
      .then((response) => setPrefs(normalizePrefs(response?.data ?? response)))
      .catch(() => {
        setPrefs(normalizePrefs(null));
        setPrefsError("Preferences could not be loaded. You can still edit and try Save.");
      });
    return () => window.removeEventListener(INBOX_REFRESH_EVENT, onRefresh);
  }, [load]);

  const unreadCount = items.filter((item) => item.unread).length;

  const visibleItems = useMemo(
    () => (activeTab === "unread" ? items.filter((item) => item.unread) : items),
    [items, activeTab]
  );

  const markAll = async () => {
    setBusy(true);
    setError("");
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    } catch (err) {
      setError(s4Message(err) || "Could not mark notifications as read.");
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async () => {
    if (!prefs) return;
    setBusy(true);
    setPrefsNote("");
    setPrefsError("");
    setError("");
    try {
      const response = await saveNotificationPreferences(prefsPayload(prefs));
      setPrefs(normalizePrefs(response?.data ?? response));
      setPrefsNote("Preferences saved.");
    } catch (err) {
      const message = s4Message(err) || "Preferences could not be saved.";
      setPrefsError(message);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const markRead = async (ids) => {
    if (!ids.length) return;
    setBusy(true);
    setError("");
    const results = await Promise.allSettled(ids.map((id) => patchNotification(id, true)));
    const done = new Set(ids.filter((_, index) => results[index].status === "fulfilled"));
    setItems((prev) => prev.map((item) => (done.has(item.id) ? { ...item, unread: false } : item)));
    if (done.size < ids.length) setError("Some notifications could not be marked as read.");
    setBusy(false);
  };

  const openItem = async (item) => {
    if (item.unread) await markRead([item.id]);
    if (item.deepLink && String(item.deepLink).startsWith("/")) navigate(item.deepLink);
  };

  const emptyLabel =
    activeTab === "unread" ? "You're all caught up. No unread notifications." : "No notifications yet.";

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="ntf-page">
          <div className="ntf-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">Notifications</h2>
              <p className="clinic-page-subtitle mb-0">Alerts and updates sent to your account.</p>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger d-flex align-items-center justify-content-between py-2">
              <span>{error}</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={load}>
                Retry
              </button>
            </div>
          ) : null}

          <div className="ntf-toolbar">
            <div className="ntf-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`ntf-tab${activeTab === t.id ? " is-active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.id === "unread" ? `${t.label} (${unreadCount})` : t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ntf-mark-all"
              onClick={markAll}
              disabled={!unreadCount || busy}
            >
              Mark all as read
            </button>
          </div>

          {prefs ? (
            <div className="admin-dash-card p-3 mb-3">
              <h5 className="mb-2">Notification preferences</h5>
              {prefsNote ? <div className="text-success small mb-2">{prefsNote}</div> : null}
              {prefsError ? <div className="text-danger small mb-2">{prefsError}</div> : null}
              <Row className="g-2">
                {[
                  ["pushEnabled", "Push"],
                  ["smsEnabled", "SMS"],
                  ["emailEnabled", "Email"],
                  ["appointments", "Appointments"],
                  ["prescriptions", "Prescriptions"],
                  ["medicines", "Medicines"],
                  ["marketing", "Marketing"],
                  ["quietHoursEnabled", "Quiet hours"],
                ].map(([key, label]) => (
                  <Col md={3} sm={6} xs={6} key={key}>
                    <Label check className="ntf-pref-check">
                      <Input
                        type="checkbox"
                        checked={Boolean(prefs[key])}
                        onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />{" "}
                      {label}
                    </Label>
                  </Col>
                ))}
                <Col md={3} sm={6}>
                  <Label htmlFor="ntf-quiet-start">Quiet start</Label>
                  <Input
                    id="ntf-quiet-start"
                    type="time"
                    value={prefs.quietStart || ""}
                    disabled={!prefs.quietHoursEnabled}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, quietStart: e.target.value }))}
                  />
                </Col>
                <Col md={3} sm={6}>
                  <Label htmlFor="ntf-quiet-end">Quiet end</Label>
                  <Input
                    id="ntf-quiet-end"
                    type="time"
                    value={prefs.quietEnd || ""}
                    disabled={!prefs.quietHoursEnabled}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, quietEnd: e.target.value }))}
                  />
                </Col>
                <Col md={4} sm={12}>
                  <Label htmlFor="ntf-reminder-offsets">Reminder offsets (minutes)</Label>
                  <Input
                    id="ntf-reminder-offsets"
                    type="text"
                    placeholder="e.g. 60,1440"
                    value={prefs.reminderOffsets || ""}
                    onChange={(e) => setPrefs((prev) => ({ ...prev, reminderOffsets: e.target.value }))}
                  />
                </Col>
                <Col md={2} sm={12} className="d-flex align-items-end">
                  <Button color="primary" className="w-100" disabled={busy} onClick={savePrefs}>
                    {busy ? "Saving…" : "Save"}
                  </Button>
                </Col>
              </Row>
            </div>
          ) : null}

          <div className="ntf-list">
            {loading ? (
              <div className="ntf-empty">
                <Spinner size="sm" />
              </div>
            ) : visibleItems.length ? (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ntf-item ntf-item--${item.unread ? "blue" : "slate"}${item.unread ? " is-unread" : " is-static"}`}
                  onClick={() => openItem(item)}
                >
                  <span className="ntf-item__icon" aria-hidden="true">
                    <i className="ri-notification-3-line" />
                  </span>
                  <span className="ntf-item__body">
                    <span className="ntf-item__title">
                      {item.title}
                      {item.unread ? <span className="ntf-item__dot" aria-label="Unread" /> : null}
                    </span>
                    <span className="ntf-item__text">{item.message}</span>
                  </span>
                  <span className="ntf-item__time">{item.at ? moment(item.at).fromNow() : ""}</span>
                </button>
              ))
            ) : (
              <div className="ntf-empty">
                <i className="ri-notification-off-line" aria-hidden="true" />
                <span>{emptyLabel}</span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NotificationsPage;
