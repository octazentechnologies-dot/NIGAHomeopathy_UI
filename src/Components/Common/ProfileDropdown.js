import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import Swal from 'sweetalert2';

import { createSelector } from 'reselect';
import { UserRole } from '../constants/roles';
import { dispatchOpenBillingListModal } from '../../helpers/dashboard_helper';
import { getAvailabilityMe, getCaregiverMe, getDoctorPhotoBlob, updateAvailabilityMe } from '../../helpers/realbackend_helper';
import { PROFILE_PHOTO_CHANGED_EVENT } from '../../helpers/profilePhotoEvents';
import { setCounts } from '../../slices/doctor/dashboard/reducer';

const readOnlineFlag = (source) => {
    const value = source?.isOnline ?? source?.IsOnline;
    return typeof value === 'boolean' ? value : null;
};

const ProfileDropdown = () => {
    const dispatch = useDispatch();
    const dashboardCounts = useSelector((state) => state?.DoctorDashboard?.counts);

    const profiledropdownData = createSelector(
        (state) => state.Profile,
        (user) => user.user
    );
    // Inside your component
    const user = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [actingForName, setActingForName] = useState("");

    // "NIKHIL JAMDAR" -> "J. Nikhil"
    const formatNameToInitials = (fullName) => {
        if (!fullName || fullName.trim() === "") return "";
        
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length === 1) {
            // Single name: show first letter + rest of name
            return nameParts[0].charAt(0).toUpperCase() + ". " + nameParts[0].substring(1);
        } else if (nameParts.length >= 2) {
            // Format: Last initial + ". " + First name (e.g., "NIKHIL JAMDAR" -> "J. Nikhil")
            const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].substring(1).toLowerCase();
            const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase() + ".";
            return `${lastInitial} ${firstName}`;
        }
        return fullName;
    };

    useEffect(() => {
        const authUserStr = sessionStorage.getItem("authUser");
        if (authUserStr) {
            try {
                const obj = JSON.parse(authUserStr);
                const userInfo = obj.data || obj;

                if (userInfo) {
                    const loginName = userInfo.userName || userInfo.UserName || "";
                    const fullName = [userInfo.firstName || userInfo.FirstName, userInfo.lastName || userInfo.LastName]
                        .filter(Boolean)
                        .join(" ");
                    setUserName(loginName);
                    setUserRole(userInfo.role || userInfo.Role || "");
                    setDisplayName(
                        userInfo.displayName ||
                        userInfo.DisplayName ||
                        formatNameToInitials(fullName || loginName) ||
                        "User"
                    );
                }
            } catch (error) {
                console.error("Error parsing authUser:", error);
            }
        }
    }, [user]);

    useEffect(() => {
        if (userRole !== UserRole.PATIENT) {
            setActingForName("");
            return undefined;
        }
        let cancelled = false;
        getCaregiverMe()
            .then((raw) => {
                const me = raw?.data ?? raw;
                const acting = !!(me?.isActingAsCaregiver ?? me?.IsActingAsCaregiver);
                const name = me?.ownerPatientName ?? me?.OwnerPatientName ?? "";
                if (!cancelled) setActingForName(acting ? name : "");
            })
            .catch(() => {
                if (!cancelled) setActingForName("");
            });
        return () => {
            cancelled = true;
        };
    }, [userRole]);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [availabilityBusy, setAvailabilityBusy] = useState(false);
    const [doctorId, setDoctorId] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [photoVersion, setPhotoVersion] = useState(0);
    const isDoctor = userRole === UserRole.DOCTOR;

    useEffect(() => {
        if (!isDoctor) {
            setDoctorId(null);
            return undefined;
        }
        let cancelled = false;
        getAvailabilityMe()
            .then((raw) => {
                const me = raw?.data ?? raw;
                if (cancelled || !me) return;
                const online = readOnlineFlag(me);
                if (online !== null) setIsOnline(online);
                setDoctorId(me.doctorId ?? me.DoctorId ?? null);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isDoctor]);

    // The dashboard availability widget updates the same flag through the counts API.
    const countsOnline = readOnlineFlag(dashboardCounts);
    useEffect(() => {
        if (isDoctor && countsOnline !== null) setIsOnline(countsOnline);
    }, [isDoctor, countsOnline]);

    useEffect(() => {
        const onPhotoChanged = () => setPhotoVersion((v) => v + 1);
        window.addEventListener(PROFILE_PHOTO_CHANGED_EVENT, onPhotoChanged);
        return () => window.removeEventListener(PROFILE_PHOTO_CHANGED_EVENT, onPhotoChanged);
    }, []);

    useEffect(() => {
        if (!doctorId) {
            setPhotoUrl(null);
            return undefined;
        }
        let cancelled = false;
        let objectUrl = null;
        getDoctorPhotoBlob(doctorId)
            .then((response) => {
                const blob = response?.data instanceof Blob ? response.data : response;
                if (cancelled || !(blob instanceof Blob) || blob.size === 0) {
                    if (!cancelled) setPhotoUrl(null);
                    return;
                }
                objectUrl = URL.createObjectURL(blob);
                setPhotoUrl(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setPhotoUrl(null);
            });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [doctorId, photoVersion]);
    const isReception = userRole === UserRole.RECEPTION;
    const avatarLetter = String(displayName || userName || "U").trim().charAt(0).toUpperCase() || "U";
    const roleLabel = isReception
        ? "Receptionist"
        : actingForName
            ? `Caregiver · ${actingForName}`
            : userRole;
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    const handleOnlineToggle = useCallback(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (availabilityBusy) return;
        const next = !isOnline;
        setAvailabilityBusy(true);
        try {
            const raw = await updateAvailabilityMe({ isOnline: next });
            const saved = readOnlineFlag(raw?.data ?? raw);
            const value = saved ?? next;
            setIsOnline(value);
            if (dashboardCounts) {
                dispatch(setCounts({ ...dashboardCounts, isOnline: value, IsOnline: value }));
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Availability update failed',
                text: typeof err === 'string' ? err : err?.message || 'Could not change online status',
            });
        } finally {
            setAvailabilityBusy(false);
        }
    }, [availabilityBusy, isOnline, dashboardCounts, dispatch]);
    const handleOpenBilling = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsProfileDropdown(false);
        dispatchOpenBillingListModal();
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <span className={`header-profile-user-wrap${isDoctor && isOnline ? " is-online" : ""}`}>
                            {photoUrl ? (
                                <img
                                    className="rounded-circle header-profile-user"
                                    src={photoUrl}
                                    alt={displayName || "Profile"}
                                    style={{ objectFit: "cover" }}
                                />
                            ) : (
                                <span
                                    className="rounded-circle header-profile-user header-profile-user--letter"
                                    aria-hidden="true"
                                >
                                    {avatarLetter}
                                </span>
                            )}
                            {isDoctor && isOnline ? (
                                <span className="header-profile-user-status" aria-hidden="true" />
                            ) : null}
                        </span>
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{displayName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{roleLabel}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Welcome {userName ? userName.toUpperCase() : "USER"}!</h6>
                    {isDoctor ? (
                        <div
                            className="dropdown-item-text doctor-online-toggle d-flex align-items-center justify-content-between gap-2"
                            onClick={(event) => event.stopPropagation()}
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <span className="d-flex align-items-center min-w-0">
                                <i
                                    className={`mdi mdi-circle fs-12 align-middle me-1 ${isOnline ? "text-success" : "text-muted"}`}
                                    aria-hidden="true"
                                />
                                <span className="align-middle text-body">
                                    {isOnline ? "Online" : "Offline"}
                                </span>
                            </span>
                            <div className="form-check form-switch form-switch-success mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="doctorOnlineStatus"
                                    checked={isOnline}
                                    disabled={availabilityBusy}
                                    onChange={handleOnlineToggle}
                                    aria-label={isOnline ? "Set offline" : "Set online"}
                                />
                            </div>
                        </div>
                    ) : null}
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Profile</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    {isDoctor ? (
                        <DropdownItem className='p-0'>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={handleOpenBilling}
                            >
                                <i className="mdi mdi-receipt-text-outline text-muted fs-16 align-middle me-1"></i>
                                <span className="align-middle">Billing</span>
                            </button>
                        </DropdownItem>
                    ) : null}
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i
                                className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle" data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;