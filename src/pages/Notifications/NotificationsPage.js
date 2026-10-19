import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const normalize = (row) => ({
  id: row.appNotificationId,
  title: row.title || "Notification",
  message: row.body || "",
  unread: !row.isRead,
  at: row.createdAt,
});

const NotificationsPage = () => {
  document.title = "Notifications | Niga Homeocentrum";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [prefs, setPrefs] = useState(null);
  const [prefsNote, setPrefsNote] = useState("");

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
    getNotificationPreferences()
      .then((response) => setPrefs(response?.data ?? response))
      .catch(() => setPrefs(null));
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
    try {
      const response = await saveNotificationPreferences(prefs);
      setPrefs(response?.data ?? response);
      setPrefsNote("Preferences saved.");
    } catch (err) {
      setError(s4Message(err) || "Preferences could not be saved.");
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
                  <Col md={3} key={key}>
                    <Label check>
                      <Input
                        type="checkbox"
                        checked={Boolean(prefs[key])}
                        onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />{" "}
                      {label}
                    </Label>
                  </Col>
                ))}
                <Col md={3}>
                  <Label>Quiet start</Label>
                  <Input value={prefs.quietStart || ""} onChange={(e) => setPrefs((prev) => ({ ...prev, quietStart: e.target.value }))} />
                </Col>
                <Col md={3}>
                  <Label>Quiet end</Label>
                  <Input value={prefs.quietEnd || ""} onChange={(e) => setPrefs((prev) => ({ ...prev, quietEnd: e.target.value }))} />
                </Col>
                <Col md={4}>
                  <Label>Reminder offsets (minutes)</Label>
                  <Input value={prefs.reminderOffsets || ""} onChange={(e) => setPrefs((prev) => ({ ...prev, reminderOffsets: e.target.value }))} />
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button color="primary" disabled={busy} onClick={savePrefs}>Save</Button>
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
                  onClick={() => (item.unread ? markRead([item.id]) : undefined)}
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
