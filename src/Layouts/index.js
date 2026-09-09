import React, { useEffect, useState } from 'react';
import PropTypes from "prop-types";
import withRouter from '../Components/Common/withRouter';

//import Components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import RightSidebar from '../Components/Common/RightSidebar';
import { ThemeCustomizerProvider } from '../Components/Common/ThemeCustomizerContext';
import { LayoutMenuProvider } from './LayoutMenuContext';

//import actions
import {
    changeLayout,
    changeSidebarTheme,
    changeLayoutMode,
    changeLayoutWidth,
    changeLayoutPosition,
    changeTopbarTheme,
    changeLeftsidebarSizeType,
    changeLeftsidebarViewType,
    changeSidebarImageType,
    changeSidebarVisibility
} from "../slices/thunks";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';
import { useProfile } from '../Components/Hooks/UserHooks';
import { resolveUserRole, usesDoctorDashboardLayout, usesAdminDashboardLayout } from '../Components/constants/roles';
import { layoutTypes, sidebarVisibilitytypes } from '../Components/constants/layout';
import useDoctorLayout from '../Components/Hooks/DoctorLayoutHook';

const Layout = (props) => {
    const [headerClass, setHeaderClass] = useState("");
    const dispatch = useDispatch();
    const { userProfile } = useProfile();
    
    // Use the doctor layout hook
    useDoctorLayout();

    const userRole = resolveUserRole(userProfile);
    const noSidebarLayout = usesDoctorDashboardLayout(userRole);

    // Immediate role-based layout on mount (before profile hook resolves)
    useEffect(() => {
        const sessionUser = JSON.parse(sessionStorage.getItem('authUser') || 'null');
        const role = sessionUser?.role || sessionUser?.data?.role;
        if (usesDoctorDashboardLayout(role)) {
            document.body.classList.add('doctor-layout');
            document.body.classList.remove('admin-layout');

            document.documentElement.style.setProperty('--vz-vertical-menu-width', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-sm', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-md', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-lg', '0px');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = '0px';
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '100%';
                mainContent.style.paddingLeft = '0px';
            }

            const layoutWrapper = document.querySelector('#layout-wrapper');
            if (layoutWrapper) {
                layoutWrapper.style.marginLeft = '0px';
                layoutWrapper.style.width = '100%';
            }
        } else if (usesAdminDashboardLayout(role)) {
            document.body.classList.add('admin-layout');
            document.body.classList.remove('doctor-layout');
            dispatch(changeLayout(layoutTypes.HORIZONTAL));
        }
    }, []);

    const selectLayoutState = (state) => state.Layout;
    const selectLayoutProperties = createSelector(
        selectLayoutState,
        (layout) => ({
            layoutType: layout.layoutType,
            leftSidebarType: layout.leftSidebarType,
            layoutModeType: layout.layoutModeType,
            layoutWidthType: layout.layoutWidthType,
            layoutPositionType: layout.layoutPositionType,
            topbarThemeType: layout.topbarThemeType,
            leftsidbarSizeType: layout.leftsidbarSizeType,
            leftSidebarViewType: layout.leftSidebarViewType,
            leftSidebarImageType: layout.leftSidebarImageType,
            preloader: layout.preloader,
            sidebarVisibilitytype: layout.sidebarVisibilitytype,
        })
    );
    // Inside your component
    const {
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        preloader,
        sidebarVisibilitytype
    } = useSelector(selectLayoutProperties);

    /*
    layout settings
    */
    useEffect(() => {
        if (
            layoutType ||
            leftSidebarType ||
            layoutModeType ||
            layoutWidthType ||
            layoutPositionType ||
            topbarThemeType ||
            leftsidbarSizeType ||
            leftSidebarViewType ||
            leftSidebarImageType ||
            sidebarVisibilitytype
        ) {
            window.dispatchEvent(new Event('resize'));
            dispatch(changeLeftsidebarViewType(leftSidebarViewType));
            dispatch(changeLeftsidebarSizeType(leftsidbarSizeType));
            dispatch(changeSidebarTheme(leftSidebarType));
            dispatch(changeLayoutMode(layoutModeType));
            dispatch(changeLayoutWidth(layoutWidthType));
            dispatch(changeLayoutPosition(layoutPositionType));
            dispatch(changeTopbarTheme(topbarThemeType));
            dispatch(changeLayout(layoutType));
            dispatch(changeSidebarImageType(leftSidebarImageType));
            dispatch(changeSidebarVisibility(sidebarVisibilitytype));
        }
    }, [layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        sidebarVisibilitytype,
        dispatch]);
    /*
    call dark/light mode
    */
    const onChangeLayoutMode = (value) => {
        if (changeLayoutMode) {
            dispatch(changeLayoutMode(value));
        }
    };

    // class add remove in header 
    useEffect(() => {
        window.addEventListener("scroll", scrollNavigation, true);
    });

    function scrollNavigation() {
        var scrollup = document.documentElement.scrollTop;
        if (scrollup > 50) {
            setHeaderClass("topbar-shadow");
        } else {
            setHeaderClass("");
        }
    }

    useEffect(() => {
        const hamburgerIcon = document.querySelector(".hamburger-icon");
        if (hamburgerIcon) {
            if (sidebarVisibilitytype === 'show' || layoutType === "vertical" || layoutType === "twocolumn") {
                hamburgerIcon.classList.remove('open');
            } else {
                hamburgerIcon.classList.add('open');
            }
        }
    }, [sidebarVisibilitytype, layoutType]);

    // Role-based layout: doctor (no sidebar) vs admin (horizontal full-width topbar)
    useEffect(() => {
        const role = resolveUserRole(userProfile);
        const hideSidebarLayout = usesDoctorDashboardLayout(role);
        const adminDashboardLayout = usesAdminDashboardLayout(role);

        if (hideSidebarLayout) {
            document.body.classList.remove('admin-layout');
            document.body.classList.add('doctor-layout');
            dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
            // Admin session leaves data-layout=horizontal; that adds page-content margin for the top nav.
            // Reset so doctor dashboard has no gap between topbar and cards (matches fresh load).
            dispatch(changeLayout(layoutTypes.SEMIBOX));

            document.documentElement.style.setProperty('--vz-vertical-menu-width', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-sm', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-md', '0px');
            document.documentElement.style.setProperty('--vz-vertical-menu-width-lg', '0px');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = '0px';
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '100%';
                mainContent.style.paddingLeft = '0px';
            }

            const layoutWrapper = document.querySelector('#layout-wrapper');
            if (layoutWrapper) {
                layoutWrapper.style.marginLeft = '0px';
                layoutWrapper.style.width = '100%';
            }
        } else if (adminDashboardLayout) {
            document.body.classList.remove('doctor-layout');
            document.body.classList.add('admin-layout');
            dispatch(changeSidebarVisibility(sidebarVisibilitytypes.SHOW));
            dispatch(changeLayout(layoutTypes.HORIZONTAL));

            document.documentElement.style.removeProperty('--vz-vertical-menu-width');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-sm');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-md');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-lg');

            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = '0px';
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '100%';
                mainContent.style.paddingLeft = '0px';
            }

            const layoutWrapper = document.querySelector('#layout-wrapper');
            if (layoutWrapper) {
                layoutWrapper.style.marginLeft = '0px';
                layoutWrapper.style.width = '100%';
            }
        } else {
            document.body.classList.remove('doctor-layout');
            document.body.classList.remove('admin-layout');

            document.documentElement.style.removeProperty('--vz-vertical-menu-width');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-sm');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-md');
            document.documentElement.style.removeProperty('--vz-vertical-menu-width-lg');
        }

        return () => {
            document.body.classList.remove('doctor-layout');
            document.body.classList.remove('admin-layout');
        };
    }, [userProfile?.role, dispatch]);

    // Admin mobile topbar (<500px): dashboard + all admin menus (Existance → Rubric Intelligence)
    useEffect(() => {
        const path = props.router?.location?.pathname || '';
        const isAdminPath = path === '/admin' || path.startsWith('/admin/');
        const isAdminDashboard = path === '/dashboard' || path === '/dashboard/';
        const useMobileTopbar = isAdminDashboard || isAdminPath;

        if (isAdminPath) {
            document.body.classList.add('admin-forms-ui');
        } else {
            document.body.classList.remove('admin-forms-ui');
        }

        if (useMobileTopbar) {
            document.body.classList.add('admin-mobile-topbar');
            document.body.classList.add('admin-dashboard-route');
        } else {
            document.body.classList.remove('admin-mobile-topbar');
            document.body.classList.remove('admin-dashboard-route');
        }

        return () => {
            document.body.classList.remove('admin-forms-ui');
            document.body.classList.remove('admin-mobile-topbar');
            document.body.classList.remove('admin-dashboard-route');
        };
    }, [props.router?.location?.pathname]);

    return (
        <React.Fragment>
            <ThemeCustomizerProvider>
            <LayoutMenuProvider>
            <div id="layout-wrapper">
                <Header
                    headerClass={headerClass}
                    layoutModeType={layoutModeType}
                    onChangeLayoutMode={onChangeLayoutMode} />
                {/* Hide admin sidebar for Doctor and Reception */}
                {!noSidebarLayout && (
                    <Sidebar
                        layoutType={layoutType}
                    />
                )}
                <div 
                    className={`main-content ${noSidebarLayout ? 'no-sidebar' : ''}`}
                    style={(() => {
                        return noSidebarLayout ? {
                            marginLeft: '0 !important',
                            width: '100% !important',
                            maxWidth: '100% !important',
                            paddingLeft: '0 !important'
                        } : {};
                    })()}
                >
                    {props.children}
                    <Footer />
                </div>
            </div>
            <RightSidebar />
            </LayoutMenuProvider>
            </ThemeCustomizerProvider>
        </React.Fragment>

    );
};

Layout.propTypes = {
    children: PropTypes.object,
};

export default withRouter(Layout);