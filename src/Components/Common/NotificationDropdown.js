import React, { useState, useEffect, useCallback } from 'react';
import {
    Col, Dropdown, DropdownMenu, DropdownToggle, Modal, ModalBody, ModalFooter, ModalHeader,
    Nav, NavItem, NavLink, Row, TabContent, TabPane, Button,
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

import SimpleBar from "simplebar-react";
import { UserRole } from '../constants/roles';
import { readPlanActive } from '../../helpers/client_error_reporter';
import moment from 'moment';
import { listNotifications, patchNotification, followUpDue, listDoctorReminders } from '../../helpers/s5Week5Api';
import { listTrustQueue } from '../../helpers/s4Week4Api';
import { listAdminSupportTickets } from '../../helpers/realbackend_helper';
import {
    isReminderDueNow,
    mapDoctorReminder,
    formatReminderTimeDisplay,
    openDoctorReminder,
    isReminderAlertDismissed,
    REMINDER_DASHBOARD_PATH,
} from '../../helpers/doctorReminderFire';
import {
    resolveNotificationOpenPath,
    isAdminPortalRole,
    isAdminRelevantNotification,
    adminFallbackPathForType,
} from '../../helpers/notificationDeepLink';

const noteId = (row) => row.appNotificationId ?? row.AppNotificationId;
const noteRead = (row) => Boolean(row.isRead ?? row.IsRead);
const noteDeepLink = (row) => row.deepLink || row.DeepLink || "";
const noteType = (row) => row.type || row.Type || "";
const INBOX_REFRESH_EVENT = "homeocentrum-inbox-refresh";
const INBOX_POLL_MS = 30000;
const DISMISSED_ALERTS_KEY = "homeocentrum-notif-alert-dismissed";

const unwrapList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const readDismissedAlerts = () => {
    try {
        const raw = sessionStorage.getItem(DISMISSED_ALERTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
        return new Set();
    }
};

const dismissAlertId = (alertId) => {
    if (alertId == null || alertId === "") return;
    const next = readDismissedAlerts();
    next.add(String(alertId));
    try {
        sessionStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify([...next]));
    } catch {
        /* ignore quota */
    }
};

const timeAgo = (value) => {
    if (!value) return '';
    const at = new Date(value);
    if (Number.isNaN(at.getTime())) return '';
    const minutes = Math.max(0, Math.round((Date.now() - at.getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    return at.toLocaleDateString();
};

const EmptyRow = ({ text }) => (
    <div className="text-center text-muted py-4 fs-13">{text}</div>
);

const NoteItem = ({ row, onOpen, onRead }) => {
    const id = noteId(row);
    const read = noteRead(row);
    return (
        <div
            className={`text-reset notification-item d-block dropdown-item position-relative notification-item--clickable${read ? '' : ' active'}`}
            role="button"
            tabIndex={0}
            onClick={(e) => {
                if (e.target.closest('[data-note-action="mark-read"]')) return;
                e.preventDefault();
                e.stopPropagation();
                onOpen(row);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(row);
                }
            }}
        >
            <div className="d-flex">
                <div className="avatar-xs me-3">
                    <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                        <i className="ri-notification-3-line"></i>
                    </span>
                </div>
                <div className="flex-grow-1">
                    <h6 className="mt-0 mb-1 fs-13 fw-semibold">{row.title || row.Title}</h6>
                    <div className="fs-13 text-muted">
                        <p className="mb-1">{row.body || row.Body}</p>
                    </div>
                    <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                        <span><i className="mdi mdi-clock-outline"></i> {timeAgo(row.createdAt || row.CreatedAt)}</span>
                    </p>
                    <button
                        type="button"
                        className="btn btn-sm btn-link p-0"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpen(row);
                        }}
                    >
                        Open
                    </button>
                </div>
                {!read ? (
                    <div className="px-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-link p-0"
                            data-note-action="mark-read"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRead(id);
                            }}
                        >
                            Mark read
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const AlertItem = ({ alert, onOpen }) => (
    <div
        className={`text-reset notification-item d-block dropdown-item position-relative notification-item--clickable${alert.active ? ' active' : ''}`}
        role="button"
        tabIndex={0}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpen(alert);
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(alert);
            }
        }}
    >
        <div className="d-flex">
            <div className="avatar-xs me-3">
                <span className={`avatar-title ${alert.iconClass} rounded-circle fs-16`}>
                    <i className={alert.icon}></i>
                </span>
            </div>
            <div className="flex-grow-1">
                <h6 className="mt-0 mb-1 fs-13 fw-semibold">{alert.title}</h6>
                <div className="fs-13 text-muted">
                    <p className="mb-1">{alert.message}</p>
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-link p-0"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpen(alert);
                    }}
                >
                    {alert.linkText || 'Open'}
                </button>
            </div>
        </div>
    </div>
);

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const navigate = useNavigate();
    const loginUser = useSelector((state) => state?.Login?.user);

    const [activeTab, setActiveTab] = useState('1');
    const [notes, setNotes] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const resolveSessionRole = useCallback(() => {
        let auth = null;
        try {
            auth = JSON.parse(sessionStorage.getItem('authUser') || 'null');
        } catch {
            auth = null;
        }
        const session = (loginUser && Object.keys(loginUser).length > 0) ? loginUser : (auth?.data || auth);
        return {
            session,
            role: session?.role || auth?.role,
        };
    }, [loginUser]);

    const loadData = useCallback(async () => {
        const { session, role } = resolveSessionRole();
        if (!session) {
            setNotes([]);
            setAlerts([]);
            return;
        }
        const isDoctor = role === UserRole.DOCTOR;
        const isReception = role === UserRole.RECEPTION;
        const isAdminPortal = isAdminPortalRole(role);
        // Follow-ups are clinical — doctor/reception only, never Admin.
        const showClinicalClinicAlerts = isDoctor || isReception;

        try {
            const response = await listNotifications();
            let rows = Array.isArray(response?.data) ? response.data : unwrapList(response);
            if (isAdminPortal) {
                rows = rows.filter(isAdminRelevantNotification);
            }
            setNotes(rows);
        } catch {
            setNotes([]);
        }

        const nextAlerts = [];
        if (isDoctor) {
            const isPlanActive = readPlanActive(session);
            const islastFiveDays = session.islastFiveDays === true || session.IslastFiveDays === true;
            const daysRemaining = session.daysRemaining || session.DaysRemaining || 0;
            if (!isPlanActive) {
                nextAlerts.push({
                    id: 'subscription',
                    title: 'Subscription expired',
                    message: 'Buy a new subscription to continue your practice.',
                    icon: 'bx bx-error-circle',
                    iconClass: 'bg-danger-subtle text-danger',
                    active: true,
                });
            } else if (islastFiveDays && daysRemaining > 0) {
                nextAlerts.push({
                    id: 'subscription',
                    title: 'Subscription ending',
                    message: `Your subscription expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.`,
                    icon: 'bx bx-error-circle',
                    iconClass: 'bg-warning-subtle text-warning',
                    active: true,
                });
            }
        }
        if (showClinicalClinicAlerts) {
            try {
                const due = await followUpDue();
                const rows = Array.isArray(due?.data) ? due.data : [];
                if (rows.length > 0) {
                    nextAlerts.push({
                        id: 'follow-up-due',
                        title: 'Follow-ups due',
                        message: `${rows.length} open follow-up ${rows.length === 1 ? 'task is' : 'tasks are'} due today or overdue.`,
                        icon: 'ri-user-follow-line',
                        iconClass: 'bg-primary-subtle text-primary',
                        to: '/doctor/follow-ups',
                        linkText: 'View follow-ups',
                    });
                }
            } catch {
                /* follow-up alert is optional */
            }
        }
        if (isDoctor) {
            try {
                const today = moment().format('YYYY-MM-DD');
                const remRes = await listDoctorReminders({ from: today, to: today });
                const reminders = Array.isArray(remRes?.data) ? remRes.data.map(mapDoctorReminder) : [];
                const dueNow = reminders.filter((r) => isReminderDueNow(r) && !isReminderAlertDismissed(r.id));
                dueNow.slice(0, 5).forEach((r) => {
                    const timeLabel = formatReminderTimeDisplay(r.time);
                    nextAlerts.push({
                        id: `doctor-reminder-${r.id}`,
                        title: r.title || 'Reminder due',
                        message: timeLabel
                            ? `Due at ${timeLabel}${r.description ? ` — ${r.description}` : ''}`
                            : (r.description || 'Due now'),
                        icon: 'ri-alarm-warning-line',
                        iconClass: 'bg-info-subtle text-info',
                        active: true,
                        to: `/doctordashboard?reminderDate=${encodeURIComponent(r.date)}&reminderId=${r.id}`,
                        linkText: 'Open reminder',
                    });
                });
                if (dueNow.length > 5) {
                    nextAlerts.push({
                        id: 'doctor-reminders-more',
                        title: 'More reminders due',
                        message: `${dueNow.length - 5} additional reminder${dueNow.length - 5 === 1 ? '' : 's'} waiting.`,
                        icon: 'ri-notification-3-line',
                        iconClass: 'bg-info-subtle text-info',
                        to: '/doctordashboard',
                        linkText: 'View dashboard',
                    });
                }
            } catch {
                /* reminder alerts are optional */
            }
        }
        if (isAdminPortal) {
            try {
                const trustRes = await listTrustQueue('Pending');
                const trustRows = unwrapList(trustRes?.data ?? trustRes);
                const pending = trustRows.filter((row) => {
                    const status = String(row.verificationStatus || row.VerificationStatus || row.status || row.Status || '').toLowerCase();
                    return status === 'pending' || status === 'needsinfo' || status === 'needs info';
                });
                if (pending.length > 0) {
                    nextAlerts.push({
                        id: 'admin-verification',
                        title: 'Doctor verification',
                        message: `${pending.length} doctor ${pending.length === 1 ? 'profile needs' : 'profiles need'} credential review.`,
                        icon: 'ri-shield-check-line',
                        iconClass: 'bg-warning-subtle text-warning',
                        active: true,
                        to: '/admin/trust-queue',
                        linkText: 'Open trust queue',
                    });
                }
            } catch {
                /* trust queue alert is optional */
            }
            try {
                const ticketsRes = await listAdminSupportTickets({ status: 'Open' });
                const tickets = unwrapList(ticketsRes?.data ?? ticketsRes);
                const openTickets = tickets.filter((t) => {
                    const status = String(t.status || t.Status || '').toLowerCase();
                    return !status || status === 'open' || status === 'pending' || status === 'new';
                });
                if (openTickets.length > 0) {
                    nextAlerts.push({
                        id: 'admin-support',
                        title: 'Support tickets',
                        message: `${openTickets.length} open support ${openTickets.length === 1 ? 'ticket needs' : 'tickets need'} attention.`,
                        icon: 'ri-customer-service-2-line',
                        iconClass: 'bg-primary-subtle text-primary',
                        active: true,
                        to: '/admin/support-tickets',
                        linkText: 'Open support',
                    });
                }
            } catch {
                /* support alert is optional */
            }
        }
        const dismissed = readDismissedAlerts();
        setAlerts(nextAlerts.filter((alert) => !dismissed.has(String(alert.id))));
    }, [loginUser, resolveSessionRole]);

    useEffect(() => {
        loadData();
        const timer = window.setInterval(loadData, INBOX_POLL_MS);
        const onRefresh = () => loadData();
        window.addEventListener(INBOX_REFRESH_EVENT, onRefresh);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener(INBOX_REFRESH_EVENT, onRefresh);
        };
    }, [loadData]);

    // Keep hub alive while header is mounted so bell refreshes without waiting for poll.
    useEffect(() => {
        const { role } = resolveSessionRole();
        let unsub = () => {};
        let timer = null;
        const softReload = () => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => loadData(), 350);
        };
        (async () => {
            try {
                if (role === UserRole.PATIENT) {
                    const { subscribePatientInboxChanged } = await import('../../helpers/patientRealtime');
                    unsub = subscribePatientInboxChanged(softReload);
                } else if (role === UserRole.DOCTOR || role === UserRole.RECEPTION) {
                    const { ensureClinicRealtime } = await import('../../helpers/clinicRealtime');
                    await ensureClinicRealtime();
                }
            } catch {
                /* SignalR optional */
            }
        })();
        return () => {
            if (timer) window.clearTimeout(timer);
            unsub();
        };
    }, [loadData, resolveSessionRole]);

    const toggleNotificationDropdown = () => {
        if (!isNotificationDropdown) loadData();
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    const openPage = (to) => {
        setIsNotificationDropdown(false);
        const path = String(to || '');
        if (path.startsWith(REMINDER_DASHBOARD_PATH)) {
            openDoctorReminder({ to: path, openView: true, navigate });
            // Refresh after mark-read so badge clears immediately.
            window.setTimeout(() => loadData(), 350);
            return;
        }
        navigate(to);
        window.setTimeout(() => loadData(), 350);
    };

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const markRead = async (id) => {
        if (id == null || id === '') return false;
        // Optimistic UI so the orange badge clears immediately.
        setNotes((current) =>
            current.map((row) =>
                noteId(row) === id || String(noteId(row)) === String(id)
                    ? { ...row, isRead: true, IsRead: true }
                    : row
            )
        );
        try {
            await patchNotification(id, true);
            window.dispatchEvent(new Event(INBOX_REFRESH_EVENT));
            return true;
        } catch {
            // Roll back if API/DB update failed.
            setNotes((current) =>
                current.map((row) =>
                    noteId(row) === id || String(noteId(row)) === String(id)
                        ? { ...row, isRead: false, IsRead: false }
                        : row
                )
            );
            return false;
        }
    };

    const openNote = async (row) => {
        const id = noteId(row);
        // Opening always marks the AppNotification as read in DB (when unread).
        if (id != null && id !== '' && !noteRead(row)) {
            await markRead(id);
        }
        setIsNotificationDropdown(false);
        setDetailItem({
            kind: 'note',
            id,
            title: row.title || row.Title || 'Notification',
            body: row.body || row.Body || '',
            when: timeAgo(row.createdAt || row.CreatedAt),
            type: noteType(row),
            deepLink: noteDeepLink(row),
        });
    };

    const openAlert = (alert) => {
        // Synthetic alerts are not AppNotification rows — dismiss for this session so the badge drops.
        dismissAlertId(alert.id);
        setAlerts((current) => current.filter((item) => String(item.id) !== String(alert.id)));
        setIsNotificationDropdown(false);
        setDetailItem({
            kind: 'alert',
            id: alert.id,
            title: alert.title || 'Alert',
            body: alert.message || '',
            when: '',
            type: alert.id?.startsWith('admin-verification')
                ? 'VERIFICATION'
                : alert.id?.startsWith('admin-support')
                    ? 'SUPPORT'
                    : 'SYSTEM',
            deepLink: alert.to || '',
            to: alert.to || '',
            linkText: alert.linkText || 'Open',
        });
    };

    const openDetailAction = async () => {
        if (!detailItem) return;
        // Safety: if Open raced before mark-read finished, ensure DB is updated.
        if (detailItem.kind === 'note' && detailItem.id != null && detailItem.id !== '') {
            await markRead(detailItem.id);
        }
        const { role } = resolveSessionRole();
        const path = resolveNotificationOpenPath(
            detailItem.deepLink || detailItem.to,
            role,
            detailItem.type,
        ) || detailItem.to || adminFallbackPathForType(detailItem.type);
        setDetailItem(null);
        if (path) openPage(path);
    };

    // Badge = unread inbox rows only + undismissed alerts still shown.
    const unreadNotes = notes.filter((row) => !noteRead(row)).length;
    const badgeCount = unreadNotes + alerts.length;

    const viewAll = (
        <div className="my-3 text-center">
            <button type="button" className="btn btn-soft-success waves-effect waves-light" onClick={() => openPage('/notifications')}>
                View All Notifications <i className="ri-arrow-right-line align-middle"></i>
            </button>
        </div>
    );

    return (
        <React.Fragment>
            <Dropdown isOpen={isNotificationDropdown} toggle={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    {badgeCount > 0 && (
                        <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                            {badgeCount}
                            <span className="visually-hidden">unread notifications</span>
                        </span>
                    )}
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0">
                    <div className="dropdown-head dropdown-head-minimal rounded-top">
                        <div className="p-3">
                            <Row className="align-items-center">
                                <Col>
                                    <h6 className="m-0 fs-16 fw-semibold text-body"> Notifications </h6>
                                </Col>
                                <div className="col-auto dropdown-tabs">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-soft-primary notification-view-all-btn"
                                        onClick={() => openPage('/notifications')}
                                    >
                                        View all <i className="ri-arrow-right-line align-middle"></i>
                                    </button>
                                </div>
                            </Row>
                        </div>

                        <div className="px-2 pt-2">
                            <Nav className="nav-tabs dropdown-tabs nav-tabs-custom">
                                <NavItem>
                                    <NavLink href="#" className={classnames({ active: activeTab === '1' })} onClick={() => toggleTab('1')}>
                                        All ({notes.length + alerts.length})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink href="#" className={classnames({ active: activeTab === '2' })} onClick={() => toggleTab('2')}>
                                        Messages ({notes.length})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink href="#" className={classnames({ active: activeTab === '3' })} onClick={() => toggleTab('3')}>
                                        Alerts ({alerts.length})
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>
                    </div>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {alerts.map((alert) => <AlertItem key={alert.id} alert={alert} onOpen={openAlert} />)}
                                {notes.map((row) => <NoteItem key={noteId(row)} row={row} onRead={markRead} onOpen={openNote} />)}
                                {alerts.length === 0 && notes.length === 0 ? <EmptyRow text="You are all caught up." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="2" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {notes.map((row) => <NoteItem key={noteId(row)} row={row} onRead={markRead} onOpen={openNote} />)}
                                {notes.length === 0 ? <EmptyRow text="No messages yet." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="3" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {alerts.map((alert) => <AlertItem key={alert.id} alert={alert} onOpen={openAlert} />)}
                                {alerts.length === 0 ? <EmptyRow text="No alerts right now." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>
                    </TabContent>
                </DropdownMenu>
            </Dropdown>

            <Modal isOpen={Boolean(detailItem)} toggle={() => setDetailItem(null)} centered>
                <ModalHeader toggle={() => setDetailItem(null)}>
                    {detailItem?.title || 'Notification'}
                </ModalHeader>
                <ModalBody>
                    {detailItem?.when ? (
                        <p className="text-muted text-uppercase fs-11 mb-2">
                            <i className="mdi mdi-clock-outline me-1" />
                            {detailItem.when}
                        </p>
                    ) : null}
                    {detailItem?.type ? (
                        <p className="fs-12 text-muted mb-2">Type: {detailItem.type}</p>
                    ) : null}
                    <p className="mb-0 fs-14" style={{ whiteSpace: 'pre-wrap' }}>
                        {detailItem?.body || 'No additional details.'}
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setDetailItem(null)}>
                        Close
                    </Button>
                    <Button color="primary" onClick={openDetailAction}>
                        {detailItem?.linkText || 'Go to page'}
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default NotificationDropdown;
