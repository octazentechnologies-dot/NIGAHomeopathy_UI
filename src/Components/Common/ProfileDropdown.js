import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";
import { createSelector } from 'reselect';
import { UserRole } from '../constants/roles';
import { dispatchOpenBillingListModal } from '../../helpers/dashboard_helper';
import { getCaregiverMe } from '../../helpers/realbackend_helper';

const DOCTOR_ONLINE_STATUS_KEY = 'doctorOnlineStatus';

const readDoctorOnlineStatus = () => {
    try {
        const stored = sessionStorage.getItem(DOCTOR_ONLINE_STATUS_KEY);
        return stored === null ? true : stored === 'true';
    } catch {
        return true;
    }
};

const ProfileDropdown = () => {

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
    const [isOnline, setIsOnline] = useState(readDoctorOnlineStatus);
    const isDoctor = userRole === UserRole.DOCTOR;
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
    const handleOnlineToggle = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsOnline((prev) => {
            const next = !prev;
            try {
                sessionStorage.setItem(DOCTOR_ONLINE_STATUS_KEY, String(next));
            } catch {
                /* ignore storage errors */
            }
            return next;
        });
    };
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
                            {isReception ? (
                                <span
                                    className="rounded-circle header-profile-user header-profile-user--letter"
                                    aria-hidden="true"
                                >
                                    {avatarLetter}
                                </span>
                            ) : (
                                <img
                                    className="rounded-circle header-profile-user"
                                    src={avatar1}
                                    alt="Header Avatar"
                                />
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