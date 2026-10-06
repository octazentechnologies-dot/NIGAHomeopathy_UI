import React, { useEffect, useMemo, useState } from "react";
import { Container } from "reactstrap";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveUserRole } from "../../Components/constants/roles";
import {
  formatNotificationTime,
  getNotificationFeed,
  markNotificationsRead,
} from "../../helpers/notificationFeed";
import "./notificationsPage.css";

const NotificationsPage = () => {
  document.title = "Notifications | Niga Homeocentrum";

  const navigate = useNavigate();
  const location = useLocation();
  const loginUser = useSelector((state) => state?.Login?.user);
  const role = resolveUserRole(loginUser);

  const [feed, setFeed] = useState(() => getNotificationFeed(role));
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setFeed(getNotificationFeed(role));
  }, [role]);

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("tab");
    if (!requested) return;
    const known = requested === "all" || requested === "unread" || feed.tabs.some((t) => t.id === requested);
    if (known) setActiveTab(requested);
  }, [location.search, feed.tabs]);

  const unreadCount = feed.items.filter((item) => item.unread).length;

  const tabs = useMemo(() => {
    const list = [{ id: "all", label: "All" }];
    if (feed.showUnreadTab) list.push({ id: "unread", label: `Unread (${unreadCount})` });
    return list.concat(feed.tabs);
  }, [feed.tabs, feed.showUnreadTab, unreadCount]);

  const visibleItems = useMemo(() => {
    if (activeTab === "all") return feed.items;
    if (activeTab === "unread") return feed.items.filter((item) => item.unread);
    return feed.items.filter((item) => item.category === activeTab);
  }, [feed.items, activeTab]);

  const markRead = (ids) => {
    if (!ids.length) return;
    markNotificationsRead(role, ids);
    setFeed(getNotificationFeed(role));
  };

  const handleOpen = (item) => {
    if (item.unread) markRead([item.id]);
    if (item.link) navigate(item.link);
  };

  const handleMarkAll = () => {
    markRead(feed.items.filter((item) => item.unread).map((item) => item.id));
  };

  const emptyLabel = activeTab === "unread"
    ? "You're all caught up. No unread notifications."
    : "No notifications in this category yet.";

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="ntf-page">
          <div className="ntf-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">Notifications</h2>
              <p className="clinic-page-subtitle mb-0">{feed.subtitle}</p>
            </div>
          </div>

          <div className="ntf-toolbar">
            <div className="ntf-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`ntf-tab${activeTab === t.id ? " is-active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ntf-mark-all"
              onClick={handleMarkAll}
              disabled={!unreadCount}
            >
              Mark all as read
            </button>
          </div>

          <div className="ntf-list">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ntf-item ntf-item--${item.tone}${item.unread ? " is-unread" : ""}${item.link ? "" : " is-static"}`}
                  onClick={() => handleOpen(item)}
                >
                  <span className="ntf-item__icon" aria-hidden="true">
                    <i className={item.icon} />
                  </span>
                  <span className="ntf-item__body">
                    <span className="ntf-item__title">
                      {item.title}
                      {item.unread ? <span className="ntf-item__dot" aria-label="Unread" /> : null}
                    </span>
                    <span className="ntf-item__text">{item.message}</span>
                  </span>
                  <span className="ntf-item__time">{formatNotificationTime(item.minutesAgo)}</span>
                  <span className="ntf-item__chevron" aria-hidden="true">
                    <i className="ri-arrow-right-s-line" />
                  </span>
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
