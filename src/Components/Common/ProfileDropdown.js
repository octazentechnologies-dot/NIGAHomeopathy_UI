import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import Swal from 'sweetalert2';

import { createSelector } from 'reselect';
import { UserRole } from '../constants/roles';
import { dispatchOpenBillingListModal } from '../../helpers/dashboard_helper';
import {
    getAvailabilityMe,
    getCaregiverMe,
    getDirectoryVisibility,
    getDoctorPhotoBlob,
    getDoctorProfileMe,
    setDirectoryVisibility,
    updateAvailabilityMe,
} from '../../helpers/realbackend_helper';
import { PROFILE_PHOTO_CHANGED_EVENT } from '../../helpers/profilePhotoEvents';
import { setCounts } from '../../slices/doctor/dashboard/reducer';
import './profileMenu.css';

const readOnlineFlag = (source) => {
    const value = source?.isOnline ?? source?.IsOnline;
    return typeof value === 'boolean' ? value : null;
};

const pickNamePart = (...values) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
};

/** Build "First Middle Last" from any name-bearing object. */
const buildFullName = (source) => {
    if (!source || typeof source !== 'object') return '';
    const first = pickNamePart(source.firstName, source.FirstName);
    const middle = pickNamePart(source.middleName, source.MiddleName);
    const last = pickNamePart(source.lastName, source.LastName);
    const joined = [first, middle, last].filter(Boolean).join(' ');
    if (joined) return joined;
    return pickNamePart(source.displayName, source.DisplayName, source.userName, source.UserName);
};

// "FIRST MIDDLE LAST" -> "L. First Middle"
const formatNameToInitials = (fullName) => {
    if (!fullName || fullName.trim() === '') return '';

    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 1) {
        return `${nameParts[0].charAt(0).toUpperCase()}. ${nameParts[0].substring(1)}`;
    }

    const lastInitial = `${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}.`;
    const givenNames = nameParts
        .slice(0, -1)
        .map((part) => part.charAt(0).toUpperCase() + part.substring(1).toLowerCase())
        .join(' ');
    return `${lastInitial} ${givenNames}`;
};

const toTitleCase = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const prettyRole = (value) => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2');

const ProfileDropdown = () => {
    const dispatch = useDispatch();
    const dashboardCounts = useSelector((state) => state?.DoctorDashboard?.counts);

    const profiledropdownData = createSelector(
        (state) => state.Profile,
        (user) => user.user
    );
    const user = useSelector(profiledropdownData);

    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [welcomeName, setWelcomeName] = useState('');
    const [actingForName, setActingForName] = useState('');

    const applyPersonName = useCallback((source, loginFallback = '') => {
        const fullName = buildFullName(source);
        const loginName = pickNamePart(source?.userName, source?.UserName, loginFallback);
        setUserName(loginName);
        setWelcomeName(toTitleCase(fullName || loginName || 'User'));
        setDisplayName(
            pickNamePart(source?.displayName, source?.DisplayName) ||
                formatNameToInitials(fullName || loginName) ||
                'User'
        );
    }, []);

    useEffect(() => {
        const authUserStr = sessionStorage.getItem('authUser');
        if (authUserStr) {
            try {
                const obj = JSON.parse(authUserStr);
                const userInfo = obj.data || obj;

                if (userInfo) {
                    setUserRole(userInfo.role || userInfo.Role || '');
                    applyPersonName(userInfo);
                }
            } catch (error) {
                console.error('Error parsing authUser:', error);
            }
        }
    }, [user, applyPersonName]);

    useEffect(() => {
        if (userRole !== UserRole.PATIENT) {
            setActingForName('');
            return undefined;
        }
        let cancelled = false;
        getCaregiverMe()
            .then((raw) => {
                const me = raw?.data ?? raw;
                const acting = !!(me?.isActingAsCaregiver ?? me?.IsActingAsCaregiver);
                const name = me?.ownerPatientName ?? me?.OwnerPatientName ?? '';
                if (!cancelled) setActingForName(acting ? name : '');
            })
            .catch(() => {
                if (!cancelled) setActingForName('');
            });
        return () => {
            cancelled = true;
        };
    }, [userRole]);

    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [availabilityBusy, setAvailabilityBusy] = useState(false);
    const [directoryVisible, setDirectoryVisible] = useState(false);
    const [directoryCanPublish, setDirectoryCanPublish] = useState(true);
    const [directoryBusy, setDirectoryBusy] = useState(false);
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

        getDoctorProfileMe()
            .then((raw) => {
                if (cancelled) return;
                const me = raw?.data ?? raw?.Data ?? raw;
                if (!me) return;
                applyPersonName(me);
                if (me.doctorId ?? me.DoctorId) {
                    setDoctorId(me.doctorId ?? me.DoctorId);
                }
            })
            .catch(() => {});

        getDirectoryVisibility()
            .then((raw) => {
                if (cancelled) return;
                const data = raw?.data ?? raw?.Data ?? raw;
                setDirectoryVisible(!!(data?.directoryVisible ?? data?.DirectoryVisible));
                const can =
                    data?.canPublish ??
                    data?.CanPublish ??
                    String(data?.verificationStatus ?? data?.VerificationStatus ?? '').toLowerCase() ===
                        'verified';
                setDirectoryCanPublish(can !== false);
            })
            .catch(() => {
                if (!cancelled) setDirectoryVisible(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isDoctor, applyPersonName]);

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
    const avatarLetter = String(displayName || userName || 'U').trim().charAt(0).toUpperCase() || 'U';
    const roleLabel = isReception
        ? 'Receptionist'
        : actingForName
          ? `Caregiver · ${actingForName}`
          : prettyRole(userRole);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    const handleOnlineToggle = useCallback(
        async (event) => {
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
        },
        [availabilityBusy, isOnline, dashboardCounts, dispatch]
    );
    const handleDirectoryToggle = useCallback(
        async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (directoryBusy) return;
            const next = !directoryVisible;
            if (next && !directoryCanPublish) {
                Swal.fire({
                    icon: 'info',
                    title: 'Not verified yet',
                    text: 'Complete credential verification before publishing your profile in Find a Doctor.',
                });
                return;
            }
            setDirectoryBusy(true);
            try {
                const raw = await setDirectoryVisibility({ directoryVisible: next });
                const data = raw?.data ?? raw?.Data ?? raw;
                setDirectoryVisible(!!(data?.directoryVisible ?? data?.DirectoryVisible ?? next));
                if (data?.canPublish != null || data?.CanPublish != null) {
                    setDirectoryCanPublish(!!(data?.canPublish ?? data?.CanPublish));
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Public visibility update failed',
                    text:
                        typeof err === 'string'
                            ? err
                            : err?.message || 'Could not change Find a Doctor visibility',
                });
            } finally {
                setDirectoryBusy(false);
            }
        },
        [directoryBusy, directoryVisible, directoryCanPublish]
    );
    const handleOpenBilling = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setIsProfileDropdown(false);
        dispatchOpenBillingListModal();
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="header-item topbar-user">
                <DropdownToggle
                    tag="button"
                    type="button"
                    className="btn"
                    title={displayName || 'Profile'}
                    aria-label={`${displayName || 'Profile'}${roleLabel ? `, ${roleLabel}` : ''}`}
                >
                    <span className="d-flex align-items-center">
                        <span className={`header-profile-user-wrap${isDoctor && isOnline ? ' is-online' : ''}`}>
                            {photoUrl ? (
                                <img
                                    className="rounded-circle header-profile-user"
                                    src={photoUrl}
                                    alt={displayName || 'Profile'}
                                    style={{ objectFit: 'cover' }}
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
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end profile-menu">
                    <div className="profile-menu__intro">
                        <p className="profile-menu__welcome">Welcome {welcomeName || 'User'}!</p>
                        <p className="profile-menu__name">{displayName || 'User'}</p>
                        {roleLabel ? <span className="profile-menu__role">{roleLabel}</span> : null}
                    </div>
                    {isDoctor ? (
                        <>
                            <div
                                className="dropdown-item-text doctor-online-toggle d-flex align-items-center justify-content-between gap-2"
                                onClick={(event) => event.stopPropagation()}
                                onMouseDown={(event) => event.stopPropagation()}
                            >
                                <span className="d-flex align-items-center min-w-0">
                                    <i
                                        className={`mdi mdi-circle fs-12 align-middle me-1 ${isOnline ? 'text-success' : 'text-muted'}`}
                                        aria-hidden="true"
                                    />
                                    <span className="align-middle text-body">
                                        {isOnline ? 'Online' : 'Offline'}
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
                                        aria-label={isOnline ? 'Set offline' : 'Set online'}
                                    />
                                </div>
                            </div>
                            <div
                                className="dropdown-item-text doctor-online-toggle d-flex align-items-center justify-content-between gap-2"
                                onClick={(event) => event.stopPropagation()}
                                onMouseDown={(event) => event.stopPropagation()}
                            >
                                <span className="d-flex align-items-center min-w-0">
                                    <i
                                        className={`mdi mdi-earth fs-14 align-middle me-1 ${directoryVisible ? 'text-primary' : 'text-muted'}`}
                                        aria-hidden="true"
                                    />
                                    <span className="align-middle text-body">
                                        {directoryVisible ? 'Public Visibility' : 'Hidden from public'}
                                    </span>
                                </span>
                                <div className="form-check form-switch form-switch-primary mb-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="doctorDirectoryVisibility"
                                        checked={directoryVisible}
                                        disabled={directoryBusy}
                                        onChange={handleDirectoryToggle}
                                        aria-label={
                                            directoryVisible
                                                ? 'Hide from Find a Doctor'
                                                : 'Show in Find a Doctor'
                                        }
                                    />
                                </div>
                            </div>
                        </>
                    ) : null}
                    <DropdownItem className="p-0">
                        <Link to="/profile" className="dropdown-item profile-menu__link">
                            <i className="mdi mdi-account-circle" aria-hidden="true"></i>
                            <span>Profile</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    {isDoctor ? (
                        <DropdownItem className="p-0">
                            <button type="button" className="dropdown-item profile-menu__link" onClick={handleOpenBilling}>
                                <i className="mdi mdi-receipt-text-outline" aria-hidden="true"></i>
                                <span>Billing</span>
                            </button>
                        </DropdownItem>
                    ) : null}
                    <DropdownItem className="p-0">
                        <Link to="/logout" className="dropdown-item profile-menu__link profile-menu__link--logout">
                            <i className="mdi mdi-logout" aria-hidden="true"></i>
                            <span data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;
