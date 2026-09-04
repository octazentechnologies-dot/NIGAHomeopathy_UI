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

            if (userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION) {
                navigate('/doctordashboard');
                return;
            }
        } catch (navError) {
            console.error('Error parsing authUser:', navError);
        }
    }

    navigate('/dashboard');
};
