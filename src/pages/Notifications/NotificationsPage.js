import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Spinner } from "reactstrap";
import moment from "moment";
import { listNotifications, patchNotification, s4Message } from "../../helpers/s5Week5Api";
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
  }, [load]);

  const unreadCount = items.filter((item) => item.unread).length;

  const visibleItems = useMemo(
    () => (activeTab === "unread" ? items.filter((item) => item.unread) : items),
    [items, activeTab]
  );

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
              onClick={() => markRead(items.filter((item) => item.unread).map((item) => item.id))}
              disabled={!unreadCount || busy}
            >
              Mark all as read
            </button>
          </div>

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
