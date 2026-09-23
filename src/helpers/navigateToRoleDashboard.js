import { UserRole } from '../Components/constants/roles';

export const navigateToRoleDashboard = (navigate) => {
    const authUserStr = sessionStorage.getItem('authUser');

    if (authUserStr) {
        try {
            const obj = JSON.parse(authUserStr);
            const userInfo = obj.data || obj;
            const userRole = userInfo?.role;

            if (userRole === UserRole.ADMIN) {
                navigate('/dashboard');
                return;
            }

            if (userRole === UserRole.ACCOUNT) {
                navigate('/accountdashboard');
                return;
            }

            if (userRole === UserRole.PHARMACY || userRole === UserRole.PHARMACY_PARTNER) {
                navigate('/pharmacydashboard');
                return;
            }

            if (userRole === UserRole.PATIENT) {
                navigate('/family');
                return;
            }

            if (userRole === UserRole.RECEPTION) {
                navigate('/reception');
                return;
            }

            if (userRole === UserRole.DOCTOR) {
                navigate('/doctordashboard');
                return;
            }
        } catch (navError) {
            console.error('Error parsing authUser:', navError);
        }
    }

    navigate('/dashboard');
};
