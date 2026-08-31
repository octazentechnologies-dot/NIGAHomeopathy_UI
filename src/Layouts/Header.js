import React, { useState } from 'react';
import { Link } from 'react-router-dom';

//import images
import logoSm from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";

//import Components
import LanguageDropdown from '../Components/Common/LanguageDropdown';
import WebAppsDropdown from '../Components/Common/WebAppsDropdown';
import MyCartDropdown from '../Components/Common/MyCartDropdown';
import FullScreenDropdown from '../Components/Common/FullScreenDropdown';
import NotificationDropdown from '../Components/Common/NotificationDropdown';
import ProfileDropdown from '../Components/Common/ProfileDropdown';
import LightDark from '../Components/Common/LightDark';
import ThemeCustomizerHeaderButton from '../Components/Common/ThemeCustomizerHeaderButton';

import { changeSidebarVisibility } from '../slices/thunks';
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';
import { useProfile } from '../Components/Hooks/UserHooks';
import { UserRole, resolveUserRole, usesDoctorDashboardLayout } from '../Components/constants/roles';
import { getHomeDashboardPath } from '../helpers/dashboard_helper';
import { WhatsAppModal } from '../Components/WhatsAppModal';
import ActivePatientSessionsStack from '../Components/Common/ActivePatientSessionsStack';
import LastWorkBackupHeaderButton from '../Components/Common/LastWorkBackupHeaderButton';

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }) => {
    const dispatch = useDispatch();
    const { userProfile } = useProfile();
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

    const selectDashboardData = createSelector(
        (state) => state.Layout,
        (sidebarVisibilitytype) => sidebarVisibilitytype.sidebarVisibilitytype
    );
    // Inside your component
    const sidebarVisibilitytype = useSelector(selectDashboardData);
    const userRole = resolveUserRole(userProfile);
    const noSidebarLayout = usesDoctorDashboardLayout(userRole);
    const homeDashboardPath = getHomeDashboardPath(userRole);

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        dispatch(changeSidebarVisibility("show"));

        if (windowSize > 767)
            document.querySelector(".hamburger-icon").classList.toggle('open');

        //For collapse horizontal menu
        if (document.documentElement.getAttribute('data-layout') === "horizontal") {
            document.body.classList.contains("menu") ? document.body.classList.remove("menu") : document.body.classList.add("menu");
        }

        //For collapse vertical menu
        if (sidebarVisibilitytype === "show" && (document.documentElement.getAttribute('data-layout') === "vertical" || document.documentElement.getAttribute('data-layout') === "semibox")) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'sm') ? document.documentElement.setAttribute('data-sidebar-size', '') : document.documentElement.setAttribute('data-sidebar-size', 'sm');
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                (document.documentElement.getAttribute('data-sidebar-size') === 'lg') ? document.documentElement.setAttribute('data-sidebar-size', 'sm') : document.documentElement.setAttribute('data-sidebar-size', 'lg');
            } else if (windowSize <= 767) {
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute('data-sidebar-size', 'lg');
            }
        }

        //Two column menu
        if (document.documentElement.getAttribute('data-layout') === "twocolumn") {
            document.body.classList.contains('twocolumn-panel') ? document.body.classList.remove('twocolumn-panel') : document.body.classList.add('twocolumn-panel');
        }
    };
    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">

                            <div className="navbar-brand-box horizontal-logo">
                                <Link to={homeDashboardPath} className="logo logo-dark">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="" height="40" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={logoDark} alt="" height="38" />
                                    </span>
                                </Link>

                                <Link to={homeDashboardPath} className="logo logo-light">
                                    <span className="logo-sm">
                                        <img src={logoSm} alt="" height="40" />
                                    </span>
                                    <span className="logo-lg">
                                        <img src={logoLight} alt="" height="38" />
                                    </span>
                                </Link>
                            </div>

                            <div className="vr header-topbar-divider align-self-center mx-2" aria-hidden="true" />

                            <div className="ms-1 header-item header-home-dashboard-item">
                                <Link
                                    to={homeDashboardPath}
                                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle d-flex align-items-center justify-content-center"
                                    title="Home"
                                >
                                    <i className="ri-mac-line fs-20" />
                                </Link>
                            </div>

                            {userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION ? (
                                <div className="d-flex align-items-center header-doctor-session-tools">
                                    <LastWorkBackupHeaderButton userRole={userRole} />
                                    <ActivePatientSessionsStack />
                                </div>
                            ) : null}

                            {/* Hide hamburger button for Doctor / Reception */}
                            {!noSidebarLayout && (
                                <button
                                    onClick={toogleMenuBtn}
                                    type="button"
                                    className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                    id="topnav-hamburger-icon">
                                    <span className="hamburger-icon">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </button>
                            )}

                        </div>

                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center header-topbar-actions">
                                <ThemeCustomizerHeaderButton />
                                <WebAppsDropdown />
                                <MyCartDropdown />
                                <FullScreenDropdown />
                                <LightDark
                                    layoutMode={layoutModeType}
                                    onChangeLayoutMode={onChangeLayoutMode}
                                />
                                <NotificationDropdown />
                                {userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION ? (
                                    <div className="ms-1 header-item">
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                            title="WhatsApp Messaging"
                                            onClick={() => setWhatsAppModalOpen(true)}
                                        >
                                            <i className="ri-whatsapp-fill fs-20" style={{ color: '#25D366' }}></i>
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <div className="d-flex align-items-center header-profile-separator-group ms-1">
                                <div className="vr header-topbar-divider" aria-hidden="true" />
                                <ProfileDropdown />
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <WhatsAppModal
                isOpen={whatsAppModalOpen}
                toggle={() => setWhatsAppModalOpen((v) => !v)}
            />
        </React.Fragment>
    );
};

export default Header;