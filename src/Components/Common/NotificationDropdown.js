import React, { useState, useEffect } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { useSelector } from 'react-redux';

import avatar2 from "../../assets/images/users/avatar-2.jpg";
import avatar3 from "../../assets/images/users/avatar-3.jpg";
import avatar4 from "../../assets/images/users/avatar-4.jpg";
import avatar5 from "../../assets/images/users/avatar-5.jpg";
import avatar6 from "../../assets/images/users/avatar-6.jpg";

import SimpleBar from "simplebar-react";
import { UserRole } from '../constants/roles';

const MESSAGE_NOTIFICATIONS = [
    {
        id: 'msg-1',
        name: 'Priya Kulkarni',
        message: 'Hello Doctor, I wanted to confirm my follow-up appointment for tomorrow.',
        time: '12 min ago',
        avatar: avatar2,
        active: true,
    },
    {
        id: 'msg-2',
        name: 'Rahul Patil',
        message: 'Can I reschedule my consultation from 4 PM to 6 PM?',
        time: '35 min ago',
        avatar: avatar3,
    },
    {
        id: 'msg-3',
        name: 'Sneha Deshmukh',
        message: 'I have uploaded my previous prescription. Please check it before my appointment.',
        time: '1 hr ago',
        avatar: avatar4,
    },
    {
        id: 'msg-4',
        name: 'Clinic Reception',
        message: "Today's 3:30 PM appointment has been confirmed by the patient.",
        time: '2 hrs ago',
        icon: 'ri-building-line',
        iconClass: 'bg-info-subtle text-info',
    },
    {
        id: 'msg-5',
        name: 'Aarav Sharma',
        message: 'Doctor, I have completed my prescribed course. Should I continue the same medicine?',
        time: '3 hrs ago',
        avatar: avatar5,
    },
    {
        id: 'msg-6',
        name: 'Dr. Riya Kulkarni',
        message: 'Please review the patient history for consultation #HC-10281.',
        time: '4 hrs ago',
        avatar: avatar6,
    },
];

const ALERT_NOTIFICATIONS = [
    {
        id: 'alert-1',
        title: 'Low Medicine Stock',
        message: (
            <>
                <b>Arnica Montana 30C</b> has reached its minimum stock level.
            </>
        ),
        time: '10 min ago',
        icon: 'ri-medicine-bottle-line',
        iconClass: 'bg-warning-subtle text-warning',
        active: true,
    },
    {
        id: 'alert-2',
        title: 'Missed Appointment',
        message: (
            <>
                Patient <b>Rohan Patil</b> did not attend the 11:00 AM consultation.
            </>
        ),
        time: '1 hr ago',
        icon: 'ri-calendar-close-line',
        iconClass: 'bg-danger-subtle text-danger',
    },
    {
        id: 'alert-3',
        title: 'Payment Pending',
        message: (
            <>
                Payment of <b className="text-success">₹2,500</b> is pending for consultation #HC-10276.
            </>
        ),
        time: '2 hrs ago',
        icon: 'ri-money-rupee-circle-line',
        iconClass: 'bg-success-subtle text-success',
    },
    {
        id: 'alert-4',
        title: 'Follow-up Due',
        message: (
            <>
                <b className="text-primary">12</b> patients are due for follow-up today.
            </>
        ),
        time: '3 hrs ago',
        icon: 'ri-user-follow-line',
        iconClass: 'bg-primary-subtle text-primary',
    },
];

const NotificationCheckbox = ({ id }) => (
    <div className="px-2 fs-15">
        <div className="form-check notification-check">
            <input className="form-check-input" type="checkbox" value="" id={id} />
            <label className="form-check-label" htmlFor={id}></label>
        </div>
    </div>
);

const MessageItem = ({ item, checkId }) => (
    <div className={`text-reset notification-item d-block dropdown-item position-relative${item.active ? ' active' : ''}`}>
        <div className="d-flex">
            {item.avatar ? (
                <img src={item.avatar} className="me-3 rounded-circle avatar-xs" alt={item.name} />
            ) : (
                <div className="avatar-xs me-3">
                    <span className={`avatar-title ${item.iconClass} rounded-circle fs-16`}>
                        <i className={item.icon}></i>
                    </span>
                </div>
            )}
            <div className="flex-grow-1">
                <Link to="#" className="stretched-link">
                    <h6 className="mt-0 mb-1 fs-13 fw-semibold">{item.name}</h6>
                </Link>
                <div className="fs-13 text-muted">
                    <p className="mb-1">{item.message}</p>
                </div>
                <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                    <span><i className="mdi mdi-clock-outline"></i> {item.time}</span>
                </p>
            </div>
            <NotificationCheckbox id={checkId} />
        </div>
    </div>
);

const AlertItem = ({ item, checkId }) => (
    <div className={`text-reset notification-item d-block dropdown-item position-relative${item.active ? ' active' : ''}`}>
        <div className="d-flex">
            <div className="avatar-xs me-3">
                <span className={`avatar-title ${item.iconClass} rounded-circle fs-16`}>
                    <i className={item.icon}></i>
                </span>
            </div>
            <div className="flex-grow-1">
                <Link to="#" className="stretched-link">
                    <h6 className="mt-0 mb-1 fs-13 fw-semibold">{item.title}</h6>
                </Link>
                <div className="fs-13 text-muted">
                    <p className="mb-1">{item.message}</p>
                </div>
                <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                    <span><i className="mdi mdi-clock-outline"></i> {item.time}</span>
                </p>
            </div>
            <NotificationCheckbox id={checkId} />
        </div>
    </div>
);

const SubscriptionItem = ({ subscriptionExpiration, checkId }) => (
    <div className="text-reset notification-item d-block dropdown-item position-relative active">
        <div className="d-flex">
            <div className="avatar-xs me-3">
                <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-16">
                    <i className="bx bx-error-circle"></i>
                </span>
            </div>
            <div className="flex-grow-1">
                <h6 className="mt-0 mb-2 lh-base">
                    {subscriptionExpiration.isPlanActive ? (
                        <>
                            Your subscription will expire after <b className="text-danger">{subscriptionExpiration.daysRemaining}</b> {subscriptionExpiration.daysRemaining === 1 ? 'day' : 'days'}. Please buy new subscription to continue your valuable practice.
                        </>
                    ) : (
                        <>
                            Your subscription has expired. Please <b className="text-danger">buy a new subscription</b> to continue your valuable practice.
                        </>
                    )}
                </h6>
                <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                    <span><i className="mdi mdi-clock-outline"></i> Subscription Alert</span>
                </p>
            </div>
            <NotificationCheckbox id={checkId} />
        </div>
    </div>
);

const NotificationDropdown = () => {
    const [isNotificationDropdown, setIsNotificationDropdown] = useState(false);
    const toggleNotificationDropdown = () => {
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    const [activeTab, setActiveTab] = useState('1');
    const toggleTab = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    const [subscriptionExpiration, setSubscriptionExpiration] = useState({
        show: false,
        daysRemaining: 0,
        isPlanActive: true
    });
    const [isDoctorRole, setIsDoctorRole] = useState(false);
    const loginUser = useSelector((state) => state?.Login?.user);

    useEffect(() => {
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser') || 'null');
            const subscriptionData = (loginUser && Object.keys(loginUser).length > 0)
                ? loginUser
                : (auth?.data || auth);

            const userRole = subscriptionData?.role || auth?.role;
            const isDoctor = userRole === UserRole.DOCTOR;
            setIsDoctorRole(isDoctor);

            if (isDoctor && subscriptionData) {
                const isPlanActive = subscriptionData.isPlanActive;
                const islastFiveDays = subscriptionData.islastFiveDays;
                const daysRemaining = subscriptionData.daysRemaining || 0;

                if (isPlanActive === true && islastFiveDays === true && daysRemaining > 0) {
                    setSubscriptionExpiration({
                        show: true,
                        daysRemaining: daysRemaining,
                        isPlanActive: true
                    });
                } else if (isPlanActive === false) {
                    setSubscriptionExpiration({
                        show: true,
                        daysRemaining: 0,
                        isPlanActive: false
                    });
                } else {
                    setSubscriptionExpiration({
                        show: false,
                        daysRemaining: 0,
                        isPlanActive: true
                    });
                }
            } else {
                setSubscriptionExpiration({
                    show: false,
                    daysRemaining: 0,
                    isPlanActive: true
                });
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }, [loginUser]);

    const messageCount = MESSAGE_NOTIFICATIONS.length;
    const alertCount = ALERT_NOTIFICATIONS.length + (subscriptionExpiration.show && isDoctorRole ? 1 : 0);
    const totalNotificationCount = messageCount + alertCount;

    // Combined All feed ordered by recency (alerts/messages interleaved by time)
    const allItems = [
        { type: 'alert', item: ALERT_NOTIFICATIONS[0], minutes: 10 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[0], minutes: 12 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[1], minutes: 35 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[2], minutes: 60 },
        { type: 'alert', item: ALERT_NOTIFICATIONS[1], minutes: 60 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[3], minutes: 120 },
        { type: 'alert', item: ALERT_NOTIFICATIONS[2], minutes: 120 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[4], minutes: 180 },
        { type: 'alert', item: ALERT_NOTIFICATIONS[3], minutes: 180 },
        { type: 'message', item: MESSAGE_NOTIFICATIONS[5], minutes: 240 },
    ];

    return (
        <React.Fragment>
            <Dropdown isOpen={isNotificationDropdown} toggle={toggleNotificationDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle type="button" tag="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-bell fs-22'></i>
                    {totalNotificationCount > 0 && (
                        <span
                            className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                            {totalNotificationCount}
                            <span className="visually-hidden">unread messages</span>
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
                                    <span className="badge bg-light-subtle text-body fs-13"> {totalNotificationCount} New</span>
                                </div>
                            </Row>
                        </div>

                        <div className="px-2 pt-2">
                            <Nav className="nav-tabs dropdown-tabs nav-tabs-custom">
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '1' })}
                                        onClick={() => { toggleTab('1'); }}
                                    >
                                        All ({totalNotificationCount})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '2' })}
                                        onClick={() => { toggleTab('2'); }}
                                    >
                                        Messages ({messageCount})
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        href="#"
                                        className={classnames({ active: activeTab === '3' })}
                                        onClick={() => { toggleTab('3'); }}
                                    >
                                        Alerts ({alertCount})
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>
                    </div>

                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {subscriptionExpiration.show && isDoctorRole && (
                                    <SubscriptionItem
                                        subscriptionExpiration={subscriptionExpiration}
                                        checkId="all-subscription-notification-check"
                                    />
                                )}
                                {allItems.map(({ type, item }, index) => (
                                    type === 'message' ? (
                                        <MessageItem
                                            key={item.id}
                                            item={item}
                                            checkId={`all-notification-check-${index}`}
                                        />
                                    ) : (
                                        <AlertItem
                                            key={item.id}
                                            item={item}
                                            checkId={`all-notification-check-${index}`}
                                        />
                                    )
                                ))}
                                <div className="my-3 text-center">
                                    <button type="button" className="btn btn-soft-success waves-effect waves-light">
                                        View All Notifications <i className="ri-arrow-right-line align-middle"></i>
                                    </button>
                                </div>
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="2" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {MESSAGE_NOTIFICATIONS.map((item, index) => (
                                    <MessageItem
                                        key={item.id}
                                        item={item}
                                        checkId={`messages-notification-check-${index}`}
                                    />
                                ))}
                                <div className="my-3 text-center">
                                    <button type="button" className="btn btn-soft-success waves-effect waves-light">
                                        View All Messages <i className="ri-arrow-right-line align-middle"></i>
                                    </button>
                                </div>
                            </SimpleBar>
                        </TabPane>

                        <TabPane tabId="3" className="py-2 ps-2">
                            <SimpleBar style={{ maxHeight: "300px" }} className="pe-2">
                                {subscriptionExpiration.show && isDoctorRole && (
                                    <SubscriptionItem
                                        subscriptionExpiration={subscriptionExpiration}
                                        checkId="alerts-subscription-notification-check"
                                    />
                                )}
                                {ALERT_NOTIFICATIONS.map((item, index) => (
                                    <AlertItem
                                        key={item.id}
                                        item={item}
                                        checkId={`alerts-notification-check-${index}`}
                                    />
                                ))}
                                <div className="my-3 text-center">
                                    <button type="button" className="btn btn-soft-success waves-effect waves-light">
                                        View All Alerts <i className="ri-arrow-right-line align-middle"></i>
                                    </button>
                                </div>
                            </SimpleBar>
                        </TabPane>
                    </TabContent>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default NotificationDropdown;
