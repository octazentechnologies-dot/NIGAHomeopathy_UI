import React, { useState, useEffect, useCallback } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

import SimpleBar from "simplebar-react";
import { UserRole } from '../constants/roles';
import { readPlanActive } from '../../helpers/client_error_reporter';
import { listNotifications, patchNotification, followUpDue } from '../../helpers/s5Week5Api';

const noteId = (row) => row.appNotificationId ?? row.AppNotificationId;
const noteRead = (row) => Boolean(row.isRead ?? row.IsRead);

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

const NoteItem = ({ row, onRead }) => {
    const id = noteId(row);
    const read = noteRead(row);
    return (
        <div className={`text-reset notification-item d-block dropdown-item position-relative${read ? '' : ' active'}`}>
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
                </div>
                {!read ? (
                    <div className="px-2">
                        <button type="button" className="btn btn-sm btn-link p-0" onClick={() => onRead(id)}>
                            Mark read
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const AlertItem = ({ alert, onOpen }) => (
    <div className={`text-reset notification-item d-block dropdown-item position-relative${alert.active ? ' active' : ''}`}>
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
                {alert.to ? (
                    <button type="button" className="btn btn-sm btn-link p-0" onClick={() => onOpen(alert.to)}>
                        {alert.linkText || 'Open'}
                    </button>
                ) : null}
            </div>
        </div>
    </div>
);

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState(false);
    const navigate = useNavigate();
    const loginUser = useSelector((state) => state?.Login?.user);

    const [activeTab, setActiveTab] = useState('1');
    const [notes, setNotes] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const loadData = useCallback(async () => {
        let auth = null;
        try {
            auth = JSON.parse(sessionStorage.getItem('authUser') || 'null');
        } catch {
            auth = null;
        }
        const session = (loginUser && Object.keys(loginUser).length > 0) ? loginUser : (auth?.data || auth);
        if (!session) {
            setNotes([]);
            setAlerts([]);
            return;
        }
        const role = session?.role || auth?.role;
        const isDoctor = role === UserRole.DOCTOR;
        const isClinic = isDoctor || role === UserRole.ADMIN || role === UserRole.RECEPTION;

        try {
            const response = await listNotifications();
            setNotes(Array.isArray(response?.data) ? response.data : []);
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
        if (isClinic) {
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
                        to: '/doctor/follow-up-analysis',
                        linkText: 'View follow-ups',
                    });
                }
            } catch {
                /* follow-up alert is optional */
            }
        }
        setAlerts(nextAlerts);
    }, [loginUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const toggleNotificationDropdown = () => {
        if (!isNotificationDropdown) loadData();
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    const openPage = (to) => {
        setIsNotificationDropdown(false);
        navigate(to);
    };

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const markRead = async (id) => {
        try {
            await patchNotification(id, true);
            setNotes((current) => current.map((row) => (noteId(row) === id ? { ...row, isRead: true, IsRead: true } : row)));
        } catch {
            /* keep the row unread if the update fails */
        }
    };

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
                                {alerts.map((alert) => <AlertItem key={alert.id} alert={alert} onOpen={openPage} />)}
                                {notes.map((row) => <NoteItem key={noteId(row)} row={row} onRead={markRead} />)}
                                {alerts.length === 0 && notes.length === 0 ? <EmptyRow text="You are all caught up." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="2" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {notes.map((row) => <NoteItem key={noteId(row)} row={row} onRead={markRead} />)}
                                {notes.length === 0 ? <EmptyRow text="No messages yet." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="3" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {alerts.map((alert) => <AlertItem key={alert.id} alert={alert} onOpen={openPage} />)}
                                {alerts.length === 0 ? <EmptyRow text="No alerts right now." /> : null}
                                {viewAll}
                            </SimpleBar>
                        </TabPane>
                    </TabContent>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default NotificationDropdown;
