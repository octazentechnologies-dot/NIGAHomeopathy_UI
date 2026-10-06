import React, { useMemo, useState } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import { UserRole, resolveUserRole } from '../constants/roles';

const LINKS_BY_ROLE = {
    [UserRole.DOCTOR]: [
        { to: '/doctordashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
        { to: '/doctor/schedule', icon: 'ri-calendar-2-line', label: 'Schedule' },
        { to: '/doctor/tele', icon: 'ri-vidicon-line', label: 'Teleconsult' },
        { to: '/doctor/erx', icon: 'ri-file-list-3-line', label: 'eRx' },
        { to: '/doctor/earnings', icon: 'ri-money-rupee-circle-line', label: 'Earnings' },
        { to: '/doctor/support', icon: 'ri-customer-service-2-line', label: 'Support' },
    ],
    [UserRole.ADMIN]: [
        { to: '/admin/dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
        { to: '/admin/listusers', icon: 'ri-user-settings-line', label: 'Users' },
        { to: '/admin/trust-queue', icon: 'ri-shield-check-line', label: 'Trust queue' },
        { to: '/admin/consult-payments', icon: 'ri-bank-card-line', label: 'Payments' },
        { to: '/admin/support-tickets', icon: 'ri-customer-service-2-line', label: 'Support' },
        { to: '/admin/security', icon: 'ri-lock-2-line', label: 'Security' },
    ],
    [UserRole.RECEPTION]: [
        { to: '/reception', icon: 'ri-dashboard-line', label: 'Home' },
        { to: '/reception/schedule', icon: 'ri-calendar-2-line', label: 'Schedule' },
        { to: '/reception/case-paper', icon: 'ri-file-user-line', label: 'Case paper' },
        { to: '/notifications', icon: 'ri-notification-3-line', label: 'Notifications' },
    ],
    [UserRole.ACCOUNT]: [
        { to: '/accountdashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
        { to: '/account/ledger', icon: 'ri-book-2-line', label: 'Ledger' },
        { to: '/account/settlements', icon: 'ri-exchange-funds-line', label: 'Settlements' },
        { to: '/account/payouts', icon: 'ri-hand-coin-line', label: 'Payouts' },
        { to: '/account/refunds', icon: 'ri-refund-2-line', label: 'Refunds' },
        { to: '/account/tax', icon: 'ri-percent-line', label: 'Tax' },
    ],
    [UserRole.PHARMACY]: [
        { to: '/pharmacydashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
        { to: '/pharmacy/orders', icon: 'ri-shopping-bag-3-line', label: 'Orders' },
        { to: '/pharmacy/quotes', icon: 'ri-price-tag-3-line', label: 'Quotes' },
        { to: '/pharmacy/onboarding', icon: 'ri-store-2-line', label: 'Onboarding' },
    ],
    [UserRole.PATIENT]: [
        { to: '/patient/prescriptions', icon: 'ri-file-list-3-line', label: 'Prescriptions' },
        { to: '/patient/medicine-orders', icon: 'ri-capsule-line', label: 'Medicines' },
        { to: '/patient/summary', icon: 'ri-heart-pulse-line', label: 'Summary' },
        { to: '/patient/support', icon: 'ri-customer-service-2-line', label: 'Support' },
    ],
};

const readRole = () => {
    try {
        const auth = JSON.parse(sessionStorage.getItem('authUser') || 'null');
        return resolveUserRole(auth?.data?.role || auth?.role);
    } catch {
        return null;
    }
};

const WebAppsDropdown = () => {
    const [isWebAppDropdown, setIsWebAppDropdown] = useState(false);
    const links = useMemo(() => {
        const role = readRole();
        if (role === UserRole.PHARMACY_PARTNER) return LINKS_BY_ROLE[UserRole.PHARMACY];
        return LINKS_BY_ROLE[role] || [];
    }, []);

    if (links.length === 0) return null;

    return (
        <React.Fragment>
            <Dropdown isOpen={isWebAppDropdown} toggle={() => setIsWebAppDropdown(!isWebAppDropdown)} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle tag="button" type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-category-alt fs-22'></i>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg p-0 dropdown-menu-end">
                    <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                        <Row className="align-items-center">
                            <Col>
                                <h6 className="m-0 fw-semibold fs-15"> Quick Links </h6>
                            </Col>
                        </Row>
                    </div>
                    <div className="p-2">
                        <div className="row g-0">
                            {links.map((item) => (
                                <Col xs={4} key={item.to}>
                                    <Link className="dropdown-icon-item" to={item.to} onClick={() => setIsWebAppDropdown(false)}>
                                        <i className={`${item.icon} fs-22 text-primary d-block mb-1`}></i>
                                        <span>{item.label}</span>
                                    </Link>
                                </Col>
                            ))}
                        </div>
                    </div>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default WebAppsDropdown;
