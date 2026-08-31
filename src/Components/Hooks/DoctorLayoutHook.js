import { useEffect } from 'react';
import { usesDoctorDashboardLayout } from '../constants/roles';

const useDoctorLayout = () => {
    useEffect(() => {
        // Immediate check on page load
        const checkAndApplyDoctorLayout = () => {
            try {
                const sessionUser = JSON.parse(sessionStorage.getItem('authUser') || 'null');
                const role = sessionUser?.role || sessionUser?.data?.role;
                if (usesDoctorDashboardLayout(role)) {
                    // Add body class
                    document.body.classList.add('doctor-layout');
                    
                    // Force CSS variables to 0
                    document.documentElement.style.setProperty('--vz-vertical-menu-width', '0px');
                    document.documentElement.style.setProperty('--vz-vertical-menu-width-sm', '0px');
                    document.documentElement.style.setProperty('--vz-vertical-menu-width-md', '0px');
                    document.documentElement.style.setProperty('--vz-vertical-menu-width-lg', '0px');
                    document.documentElement.style.setProperty('--vz-twocolumn-menu-width', '0px');
                    document.documentElement.style.setProperty('--vz-twocolumn-menu-iconview-width', '0px');
                    document.documentElement.style.setProperty('--vz-semibox-width', '0px');
                    
                    // Force main content to full width
                    const mainContent = document.querySelector('.main-content');
                    if (mainContent) {
                        mainContent.style.marginLeft = '0px';
                        mainContent.style.width = '100%';
                        mainContent.style.maxWidth = '100%';
                        mainContent.style.paddingLeft = '0px';
                    }
                    
                    // Force layout wrapper to full width
                    const layoutWrapper = document.querySelector('#layout-wrapper');
                    if (layoutWrapper) {
                        layoutWrapper.style.marginLeft = '0px';
                        layoutWrapper.style.width = '100%';
                    }
                    
                    // Force page content to full width
                    const pageContent = document.querySelector('.page-content');
                    if (pageContent) {
                        pageContent.style.marginLeft = '0px';
                        pageContent.style.width = '100%';
                        pageContent.style.maxWidth = '100%';
                    }
                }
            } catch (error) {
                console.error('Error applying doctor layout:', error);
            }
        };

        // Apply immediately
        checkAndApplyDoctorLayout();
        
        // Also apply after a short delay to ensure DOM is ready
        const timeoutId = setTimeout(checkAndApplyDoctorLayout, 100);
        
        // Apply on DOM content loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndApplyDoctorLayout);
        }
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('DOMContentLoaded', checkAndApplyDoctorLayout);
        };
    }, []);
};

export default useDoctorLayout;
