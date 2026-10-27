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
import { AVAILABILITY_CHANGED_EVENT } from '../../helpers/availabilityEvents';
import { setCounts } from '../../slices/doctor/dashboard/reducer';

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
        setWelcomeName((fullName || loginName || 'USER').toUpperCase());
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
    const [isOnTimeOff, setIsOnTimeOff] = useState(false);
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
                const onLeave = Boolean(me.isOnTimeOff ?? me.IsOnTimeOff);
                setIsOnTimeOff(onLeave);
                const online = readOnlineFlag(me);
                // Respect manual Online during clinic leave (tele consultation).
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
                if (typeof (data?.isOnTimeOff ?? data?.IsOnTimeOff) === 'boolean') {
                    setIsOnTimeOff(Boolean(data.isOnTimeOff ?? data.IsOnTimeOff));
                }
                const status = String(
                    data?.verificationStatus ?? data?.VerificationStatus ?? ''
                ).toLowerCase();
                const verified =
                    status === 'verified' ||
                    status === 'approved' ||
                    data?.canPublish === true ||
                    data?.CanPublish === true;
                // canPublish must mean Verified — never treat clinic leave as "not verified".
                setDirectoryCanPublish(verified);
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
        if (!isDoctor) return undefined;
        const onAvailability = (event) => {
            const detail = event?.detail || {};
            if (typeof detail.isOnTimeOff === 'boolean') setIsOnTimeOff(detail.isOnTimeOff);
            if (typeof detail.directoryVisible === 'boolean') setDirectoryVisible(detail.directoryVisible);
            if (typeof detail.isOnline === 'boolean') {
                setIsOnline(detail.isOnline);
                if (dashboardCounts) {
                    dispatch(
                        setCounts({
                            ...dashboardCounts,
                            isOnline: detail.isOnline,
                            IsOnline: detail.isOnline,
                        })
                    );
                }
            }
        };
        window.addEventListener(AVAILABILITY_CHANGED_EVENT, onAvailability);
        return () => window.removeEventListener(AVAILABILITY_CHANGED_EVENT, onAvailability);
    }, [isDoctor, dashboardCounts, dispatch]);

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
          : userRole;
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    const handleOnlineToggle = useCallback(
        async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (availabilityBusy) return;
            const next = !isOnline;
            // Clinic leave defaults Offline; doctor may still go Online manually for tele.
            if (next && isOnTimeOff) {
                const confirm = await Swal.fire({
                    icon: 'question',
                    title: 'Clinic leave is active',
                    text: 'In-clinic appointments stay closed. Turn Online for tele consultation only?',
                    showCancelButton: true,
                    confirmButtonText: 'Go Online (tele)',
                    cancelButtonText: 'Cancel',
                });
                if (!confirm.isConfirmed) return;
            }
            setAvailabilityBusy(true);
            try {
                const raw = await updateAvailabilityMe({ isOnline: next });
                const me = raw?.data ?? raw;
                const onLeave = Boolean(me?.isOnTimeOff ?? me?.IsOnTimeOff);
                setIsOnTimeOff(onLeave);
                const saved = readOnlineFlag(me);
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
        [availabilityBusy, isOnline, isOnTimeOff, dashboardCounts, dispatch]
    );
    const handleDirectoryToggle = useCallback(
        async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (directoryBusy) return;
            const next = !directoryVisible;

            // Already hidden + not verified: clarify — this is not a leave error.
            if (next && !directoryCanPublish) {
                Swal.fire({
                    icon: 'info',
                    title: 'Already hidden',
                    text: isOnTimeOff
                        ? 'Your profile is hidden (clinic leave). Complete credential verification before you can turn Public Visibility on for tele consultation.'
                        : 'Your profile is already hidden from Find a Doctor. Complete credential verification before you can publish.',
                });
                return;
            }

            if (next && isOnTimeOff) {
                const confirm = await Swal.fire({
                    icon: 'question',
                    title: 'Clinic leave is active',
                    text: 'In-clinic stays closed. Show your profile in Find a Doctor for tele consultation?',
                    showCancelButton: true,
                    confirmButtonText: 'Show for tele',
                    cancelButtonText: 'Cancel',
                });
                if (!confirm.isConfirmed) return;
            }

            setDirectoryBusy(true);
            try {
                const raw = await setDirectoryVisibility({ directoryVisible: next });
                const data = raw?.data ?? raw?.Data ?? raw;
                setDirectoryVisible(!!(data?.directoryVisible ?? data?.DirectoryVisible ?? next));
                if (typeof (data?.isOnTimeOff ?? data?.IsOnTimeOff) === 'boolean') {
                    setIsOnTimeOff(Boolean(data.isOnTimeOff ?? data.IsOnTimeOff));
                }
                const status = String(
                    data?.verificationStatus ?? data?.VerificationStatus ?? ''
                ).toLowerCase();
                if (status === 'verified' || status === 'approved' || data?.canPublish === true || data?.CanPublish === true) {
                    setDirectoryCanPublish(true);
                } else if (data?.canPublish === false || data?.CanPublish === false) {
                    setDirectoryCanPublish(false);
                }
            } catch (err) {
                const code = err?.data?.code || err?.code;
                const message =
                    typeof err === 'string'
                        ? err
                        : err?.message || err?.data?.message || 'Could not change Find a Doctor visibility';
                Swal.fire({
                    icon: code === 'NOT_VERIFIED' ? 'info' : 'error',
                    title: code === 'NOT_VERIFIED' ? 'Already hidden' : 'Public visibility update failed',
                    text: message,
                });
            } finally {
                setDirectoryBusy(false);
            }
        },
        [directoryBusy, directoryVisible, directoryCanPublish, isOnTimeOff]
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
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header mb-0">Welcome {welcomeName || 'USER'}!</h6>
                    <div className="dropdown-header pt-0 pb-2">
                        <div className="fw-medium text-body">{displayName || 'User'}</div>
                        {roleLabel ? <div className="fs-12 text-muted">{roleLabel}</div> : null}
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
                                        {isOnline
                                            ? isOnTimeOff
                                                ? 'Online (tele)'
                                                : 'Online'
                                            : isOnTimeOff
                                              ? 'Offline (clinic leave)'
                                              : 'Offline'}
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
                                        title={
                                            isOnTimeOff
                                                ? 'Clinic leave active — you can still go Online for tele consultation'
                                                : undefined
                                        }
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
                                        {directoryVisible
                                            ? isOnTimeOff
                                                ? 'Public (tele)'
                                                : 'Public Visibility'
                                            : isOnTimeOff
                                              ? 'Hidden (clinic leave)'
                                              : 'Hidden from public'}
                                    </span>
                                </span>
                                <div className="form-check form-switch form-switch-primary mb-0">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="doctorDirectoryVisibility"
                                        checked={directoryVisible}
                                        disabled={directoryBusy || (!directoryCanPublish && !directoryVisible)}
                                        onChange={handleDirectoryToggle}
                                        title={
                                            !directoryCanPublish && !directoryVisible
                                                ? 'Already hidden — verify credentials to publish in Find a Doctor'
                                                : isOnTimeOff && !directoryVisible
                                                  ? 'Hidden for clinic leave — turn on for tele if verified'
                                                  : undefined
                                        }
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
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Profile</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    {isDoctor ? (
                        <DropdownItem className="p-0">
                            <button type="button" className="dropdown-item" onClick={handleOpenBilling}>
                                <i className="mdi mdi-receipt-text-outline text-muted fs-16 align-middle me-1"></i>
                                <span className="align-middle">Billing</span>
                            </button>
                        </DropdownItem>
                    ) : null}
                    <DropdownItem className="p-0">
                        <Link to="/logout" className="dropdown-item">
                            <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>{' '}
                            <span className="align-middle" data-key="t-logout">
                                Logout
                            </span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;
