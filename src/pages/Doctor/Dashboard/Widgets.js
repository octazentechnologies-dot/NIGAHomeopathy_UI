import React, { useEffect, useMemo, useRef } from 'react';
import CountUp from "react-countup";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, ModalFooter, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Pagination, PaginationItem, PaginationLink, Label, Form, FormGroup, UncontrolledAlert } from 'reactstrap';
import Swal from 'sweetalert2';
import AppointmentSlotGrid from '../../../Components/Common/AppointmentSlotGrid';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import DailyScheduleSetupModal from '../../../Components/Common/DailyScheduleSetupModal';
import Select, { components as ReactSelectComponents } from "react-select";
import { pageWindow } from '../../../helpers/pageWindow';
import moment from 'moment';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { UserRole, resolveUserRole } from '../../../Components/constants/roles';
import { openReceptionPatientRow } from '../../Reception/receptionSession';
import {
    fetchDoctorDashboardCounts,
    patientNewAppointment,
    getPatientList,
    getDoctorList,
    getAppointmentList,
    createPatient,
    deletePatient,
    getCountries,
    getStates,
    getPackages,
    generateOrderId,
    saveUpdateSubscription
} from '../../../slices/doctor/dashboard/thunk';
import { refreshAuthSubscriptionStatus } from '../../../slices/auth/login/thunk';
import { readPlanActive } from '../../../helpers/client_error_reporter';
import { getInitials } from "../../../helpers/initials";
import { getLoggedinUserInfo } from "../../../helpers/api_helper";
import { getDoctorProfileMe } from "../../../helpers/realbackend_helper";
import {
    buildPatientApiPayload,
    formatCalendarDateForApi,
    formatDateOfBirthForApi,
    getPatientAuthContext,
    getPatientEmailForEdit,
} from '../../../helpers/patient_payload_helper';
import { extractApiList } from '../../../helpers/patient_history_helper';
import { recordMatchesQuery } from '../../../helpers/recordSearch';
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT, DOB_INDIAN_DISPLAY_FORMAT, APPOINTMENT_INDIAN_DISPLAY_FORMAT } from '../../../Components/Common/DateOfBirthPicker';
import {
    buildPatientSelectOption,
    DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT,
    DOCTOR_DASHBOARD_OPEN_BILLING_LIST_EVENT,
    DOCTOR_SCHEDULE_CHANGED_EVENT,
    dispatchOpenDoctorScheduleCalendar,
    formatPlanDaysRemaining,
    getPlanDaysRemaining,
    getPlanDaysRemainingToneClass,
} from '../../../helpers/dashboard_helper';
import {
    formatApiDate,
    formatCalendarDateForSchedule,
    formatSlotIntervalLabel,
    getAuthDoctorId,
    getAuthUserId,
    normalizeAppointmentSlotsResponse,
    applyClientPastSlotGuard,
} from '../../../helpers/appointmentSlotHelper';
import {
    getSubscriptionCaseLimitInfo,
    isAtOrOverCaseLimit,
} from '../../../helpers/subscriptionCaseLimitHelper';
import { isEligibleForFollowUpConsultation } from '../../../helpers/followUpConsultHelper';

const SUBSCRIPTION_JUST_ACTIVATED_KEY = 'homeocentrum:subscription-just-activated';
import {
    getAppointmentList as fetchAppointmentListByDateApi,
    getAppointmentSlots,
    getDailySchedule,
    updateAvailabilityMe,
} from '../../../helpers/realbackend_helper';
import { subscribeAppointmentChanged } from '../../../helpers/clinicRealtime';
import { earningsSummary, unwrapS4 } from '../../../helpers/s4Week4Api';
import { loadMyTickets } from '../../../Components/SupportTicketsModal/supportTicketApi';
import { } from "../../../slices/doctor/dashboard/reducer";
import {
    setAppointmentLoading, setAppointmentError, setAppointmentSuccess,
    setPatientListLoading, setPatientList, setPatientListError,
    setDoctorListLoading, setDoctorList, setDoctorListError,
    setCountLoading, setCounts, setCountError,
    setPatientLoading, setPatient, setPatientError, setPatientSuccess
} from "../../../slices/doctor/dashboard/reducer";

// Helper function to calculate age (years, months, days) from date of birth
const calculateAgeYMD = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birth = moment(dateOfBirth);
    if (!birth.isValid()) return null;

    const now = moment();
    const years = now.diff(birth, 'years');
    birth.add(years, 'years');
    const months = now.diff(birth, 'months');
    birth.add(months, 'months');
    const days = now.diff(birth, 'days');

    return { years, months, days };
};

// Helper function to get gender display
const getGenderDisplay = (gender) => {
    return gender === 0 ? 'M' : gender === 1 ? 'F' : 'N/A';
};

// Helper function to format age/sex display
const getAgeSexDisplay = (dateOfBirth, gender) => {
    const age = calculateAgeYMD(dateOfBirth);
    const genderLabel = getGenderDisplay(gender);
    if (!age) return `N/A/${genderLabel}`;
    const ageLabel = `${age.years}y ${age.months}m ${age.days}d`;
    return `${ageLabel}/${genderLabel}`;
};

// Helper function to check if status matches (handles both uppercase and mixed case)
const statusMatches = (appointmentStatus, targetStatus) => {
    if (!appointmentStatus || !targetStatus) return false;
    const normalizedAppStatus = appointmentStatus.trim();
    const normalizedTarget = targetStatus.trim();
    // Check exact match or case-insensitive match
    return normalizedAppStatus === normalizedTarget ||
        normalizedAppStatus.toLowerCase() === normalizedTarget.toLowerCase() ||
        normalizedAppStatus.toUpperCase() === normalizedTarget.toUpperCase();
};

/** Matches doctor dashboard teleQueueCount: IsTele flag or E-Consult status. */
const isTeleConsultationAppointment = (appointment) => {
    if (!appointment) return false;
    if (appointment.isTele === true || appointment.IsTele === true) return true;
    const mode = appointment.consultMode || appointment.ConsultMode || '';
    if (typeof mode === 'string' && /tele|video/i.test(mode)) return true;
    return statusMatches(appointment.status, 'E-Consult') || statusMatches(appointment.status, 'E-CONSULT');
};

const formatPatientListAppointmentDisplay = (appointment) => {
    if (appointment?.appointmentDate && appointment?.appointmentTime) {
        return `${moment(appointment.appointmentDate).format('MMM DD, YYYY')} ${moment(appointment.appointmentTime, "HH:mm:ss").format("hh:mm A")}`;
    }
    if (appointment?.appointmentDate) {
        return moment(appointment.appointmentDate).format('MMM DD, YYYY');
    }
    return 'N/A';
};

const PatientListModalTitle = ({ icon, title, subtitle, variant = 'boxed', iconColor }) => {
    if (variant === 'simple') {
        return (
            <span className="patient-list-modal__title patient-list-modal__title--simple">
                <i
                    className={icon}
                    style={{ color: iconColor || '#25a0e2', fontSize: 15 }}
                    aria-hidden="true"
                />
                <span className="patient-list-modal__title-text">{title}</span>
            </span>
        );
    }

    return (
        <span className="patient-list-modal__title">
            <span className="patient-list-modal__title-icon" aria-hidden="true">
                <i className={icon} />
            </span>
            <span>
                <span className="patient-list-modal__title-text">{title}</span>
                {subtitle ? <span className="patient-list-modal__title-sub">{subtitle}</span> : null}
            </span>
        </span>
    );
};

const PatientListModalSearch = ({ value, onChange, placeholder = 'Name, mobile, email, address' }) => (
    <div className="patient-list-modal__search">
        <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
        <Input
            size="sm"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    </div>
);

/** Search field in patient list modal header (close uses standard modal X). */
const PatientListModalHeaderActions = ({ value, onChange, placeholder, extra }) => (
    <div className="patient-list-modal__header-actions">
        {extra}
        <PatientListModalSearch value={value} onChange={onChange} placeholder={placeholder} />
    </div>
);

/** Local calendar day as YYYY-MM-DDT00:00:00.000Z so IST midnight is not counted as yesterday UTC. */
const dashboardQueryDateIso = (d = new Date()) =>
    formatCalendarDateForApi(moment(d).format('YYYY-MM-DD'));

const toAppointmentListDateIso = (displayDateStr) => {
    const parsed = moment(displayDateStr, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
    if (!parsed.isValid()) return '';
    return formatCalendarDateForApi(parsed.format('YYYY-MM-DD'));
};

const PatientListTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th">Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Age/Sex</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Place</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Appointment Time</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Status</span>
            </th>
        </tr>
    </thead>
);

const PatientListNameCell = ({ appointment }) => {
    const navigate = useNavigate();
    const isReception = resolveUserRole() === UserRole.RECEPTION;
    const patientId = appointment.patientID ?? appointment.patientId ?? appointment.PatientId;
    const name = appointment.patientName || 'N/A';
    return (
        <div className="d-flex align-items-center patient-list-modal__name">
            <div className="flex-shrink-0 me-2">
                {appointment.avatar ? (
                    <img
                        src={appointment.avatar}
                        alt=""
                        className="avatar-xxs rounded-circle patient-list-modal__avatar"
                    />
                ) : (
                    <span
                        className="avatar-xxs rounded-circle patient-list-modal__avatar d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-semibold"
                        style={{ fontSize: 10 }}
                        aria-hidden="true"
                    >
                        {getInitials(appointment.patientName)}
                    </span>
                )}
            </div>
            {isReception && patientId ? (
                <button
                    type="button"
                    className="btn btn-link p-0 text-start patient-list-modal__name-text"
                    onClick={() => openReceptionPatientRow(patientId, navigate)}
                >
                    {name}
                </button>
            ) : (
                <div className="flex-grow-1 patient-list-modal__name-text">{name}</div>
            )}
        </div>
    );
};

const PatientListAgeCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-user-heart-line" aria-hidden="true" />
        {getAgeSexDisplay(appointment.dateOfBirth, appointment.gender)}
    </span>
);

const PatientListPlaceCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-map-pin-line" aria-hidden="true" />
        {appointment.address || appointment.place || 'N/A'}
    </span>
);

const PatientListTimeCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-time-line" aria-hidden="true" />
        {formatPatientListAppointmentDisplay(appointment)}
    </span>
);

const formatPatientListStatusLabel = (status) => {
    if (statusMatches(status, 'E-Consult') || statusMatches(status, 'E-CONSULT')) {
        return 'Tele Consultation';
    }
    return status || 'N/A';
};

const PatientListStatusBadge = ({ status, badgeClass }) => (
    <span className={`badge patient-list-modal__status ${badgeClass || 'bg-secondary'}`}>
        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
        {formatPatientListStatusLabel(status)}
    </span>
);

const PatientListEmptyCell = ({ message, colSpan = 6 }) => (
    <td colSpan={colSpan} className="text-center text-muted">
        <div className="patient-list-modal__empty">
            <span className="patient-list-modal__empty-icon" aria-hidden="true">
                <i className="ri-inbox-2-line" />
            </span>
            <span>{message}</span>
        </div>
    </td>
);

const getPatientListStatusBadgeClass = (status) => {
    if (statusMatches(status, 'Waiting') || statusMatches(status, 'WAITING')) return 'bg-warning';
    if (statusMatches(status, 'Completed') || statusMatches(status, 'COMPLETED')) return 'bg-success';
    if (statusMatches(status, 'Not Arrived') || statusMatches(status, 'NOT ARRIVED')) return 'bg-danger';
    if (statusMatches(status, 'Walk-in') || statusMatches(status, 'WALK-IN')) return 'bg-info';
    if (statusMatches(status, 'E-Consult') || statusMatches(status, 'E-CONSULT')) return 'bg-purple';
    if (statusMatches(status, 'Remaining') || statusMatches(status, 'REMAINING')) return 'bg-warning';
    if (statusMatches(status, 'Cancelled') || statusMatches(status, 'CANCELLED')) return 'bg-danger';
    return 'bg-secondary';
};

const AppointmentListTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th">Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Mobile Number</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Date</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Time</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Status</span>
            </th>
        </tr>
    </thead>
);

const AppointmentListMobileCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-phone-line" aria-hidden="true" />
        {appointment.mobileNo || 'N/A'}
    </span>
);

const AppointmentListDateCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-calendar-line" aria-hidden="true" />
        {appointment.appointmentDate ? moment(appointment.appointmentDate).format('DD-MM-YYYY') : 'N/A'}
    </span>
);

const AppointmentListTimeCell = ({ appointment }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-time-line" aria-hidden="true" />
        {appointment.appointmentTime ? moment(appointment.appointmentTime, 'HH:mm:ss').format('hh:mm A') : 'N/A'}
    </span>
);

const PatientViewAllTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th">Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Mobile Number</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Address</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Gender</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Last Visit</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Date of Birth</span>
            </th>
            <th scope="col" className="text-center">
                <span className="patient-list-modal__th">Action</span>
            </th>
        </tr>
    </thead>
);

const PatientViewAllMobileCell = ({ patient }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-phone-line" aria-hidden="true" />
        {patient.mobileNo || 'N/A'}
    </span>
);

const PatientViewAllAddressCell = ({ patient }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-map-pin-line" aria-hidden="true" />
        {patient.address || 'N/A'}
    </span>
);

const PatientViewAllGenderCell = ({ patient }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-user-line" aria-hidden="true" />
        {patient.gender === 0 ? 'Male' : 'Female'}
    </span>
);

const PatientViewAllDateCell = ({ value }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-calendar-line" aria-hidden="true" />
        {value || '-'}
    </span>
);

const getBillingStatusBadgeClass = (status) => {
    const normalized = status?.toLowerCase() || '';
    if (normalized === 'success' || normalized === 'paid') return 'bg-success';
    if (normalized === 'failed' || normalized === 'unpaid') return 'bg-danger';
    return 'bg-secondary';
};

const UnpaidConsultationTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th">Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Mobile Number</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Address</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Gender</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Last App. Dt.</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Amount</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th">Status</span>
            </th>
        </tr>
    </thead>
);

/** Appointment status filter options for Patients (billing) modal. */
const APPOINTMENT_STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
];

const getAppointmentStatusFilterBucket = (status) => {
    if (!status) return null;
    if (statusMatches(status, 'Completed') || statusMatches(status, 'COMPLETED')) {
        return 'completed';
    }
    if (
        statusMatches(status, 'Cancelled') ||
        statusMatches(status, 'CANCELLED') ||
        statusMatches(status, 'Canceled') ||
        statusMatches(status, 'CANCELED')
    ) {
        return 'canceled';
    }
    return 'upcoming';
};

const appointmentMatchesStatusFilter = (appointment, filterValue) => {
    if (!filterValue || filterValue === 'all') return true;
    return getAppointmentStatusFilterBucket(appointment?.status ?? appointment?.appStatus) === filterValue;
};

const formatConsultationAmountDisplay = (amount) => {
    const value = Math.round(Number(amount) || 0);
    return `₹${value.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    })}`;
};

const consultationPaymentLabel = (appointment) => {
    const raw = String(appointment?.paymentStatus || appointment?.PaymentStatus || 'UNPAID').trim().toUpperCase();
    if (raw === 'PAID') return 'Paid';
    if (raw === 'REFUNDED') return 'Refunded';
    return 'Unpaid';
};

/** One row per appointment in the list, with its real payment status and consultation fee. */
const buildConsultationPaymentList = (appointmentList = [], patientList = []) => {
    const patientsById = new Map(
        (Array.isArray(patientList) ? patientList : []).map((p) => [String(p?.patientID ?? p?.patientId), p])
    );
    return (Array.isArray(appointmentList) ? appointmentList : []).map((appointment) => {
        const patientId = appointment?.patientID ?? appointment?.patientId ?? appointment?.PatientId;
        const patient = patientsById.get(String(patientId)) || {};
        const date = moment(appointment?.appointmentDate);
        return {
            ...patient,
            ...appointment,
            patientID: patientId,
            patientName: appointment?.patientName || patient.patientName,
            mobileNo: appointment?.mobileNo || patient.mobileNo,
            address: patient.address ?? appointment?.address,
            gender: patient.gender ?? appointment?.gender,
            consultationPaymentStatus: consultationPaymentLabel(appointment),
            consultationAmount: Number(appointment?.consultFee ?? appointment?.ConsultFee ?? 0) || 0,
            lastAppDt: date.isValid() ? date.format('DD-MM-YYYY') : '-',
        };
    });
};

/** react-select inside Bootstrap modals: menu must portal above modal (z-index ~1055). */
const DOCTOR_MODAL_SELECT_MENU_Z = 10600;
const doctorModalSelectPortalProps = {
    menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
    menuPosition: 'fixed',
    className: 'react-select-container',
    classNamePrefix: 'react-select',
};
const getDoctorModalSelectStyles = (hasError) => ({
    menuPortal: (base) => ({ ...base, zIndex: DOCTOR_MODAL_SELECT_MENU_Z }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    ...(hasError
        ? {
            control: (provided) => ({
                ...provided,
                borderColor: '#dc3545',
            }),
        }
        : {}),
});

const renderNewPatientFieldError = (show, message) => (
    <div
        className="new-patient-modal__error"
        role={show ? 'alert' : undefined}
        title={show ? message : undefined}
    >
        {show ? message : null}
    </div>
);

/** Patient dropdown footer/header action: pinned "+ Create New Patient" that can
 * never become a selected value (it is not part of `options`). Triggered on
 * mousedown because menu blur would unmount it before click fires. */
const PatientSelectMenuList = (props) => (
    <ReactSelectComponents.MenuList {...props}>
        <button
            type="button"
            className="new-appointment-modal__create-patient"
            onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.selectProps?.onCreateNewPatient?.();
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    props.selectProps?.onCreateNewPatient?.();
                }
            }}
        >
            + Create New Patient
        </button>
        {props.children}
    </ReactSelectComponents.MenuList>
);

// Compact modal pagination: ← 1 2 … [current] … last →
const getModalVisiblePageItems = (currentPage, totalPages) => pageWindow(currentPage, totalPages, 'ellipsis');

const CompactModalPaginationPages = ({ currentPage, totalPages, onPageChange }) => {
    const items = getModalVisiblePageItems(currentPage, totalPages);
    let ellipsisKey = 0;
    return items.map((item) => {
        if (item === 'ellipsis') {
            ellipsisKey += 1;
            return (
                <PaginationItem key={`ellipsis-${ellipsisKey}`} disabled>
                    <PaginationLink href="#" onClick={(e) => e.preventDefault()}>…</PaginationLink>
                </PaginationItem>
            );
        }
        return (
            <PaginationItem active={item === currentPage} key={item}>
                <PaginationLink
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onPageChange(item);
                    }}
                >
                    {item}
                </PaginationLink>
            </PaginationItem>
        );
    });
};

// Reusable modal for Waiting Patients with search, pagination and row actions
const WaitingPatientsModal = ({ isOpen, toggle }) => {
    // Get appointment list from Redux state
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList) || [];
    const appointmentListLoading = useSelector((state) => state?.DoctorDashboard?.appointmentListLoading);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Filter appointments by status = "Waiting" or "WAITING" and search term
    const filtered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "Waiting" and "WAITING")
        if (!statusMatches(appointment.status, 'Waiting') && !statusMatches(appointment.status, 'WAITING')) {
            return false;
        }

        // Then filter by search term
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Action handlers for each row
    const onView = (patient) => {
        console.log("View", patient);
    };
    const onEdit = (patient) => {
        console.log("Edit", patient);
    };
    const onDelete = (patient) => {
        console.log("Delete", patient);
    };

    return (
        <Modal size="xl" id="waitingPatientsModal" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
            <ModalHeader id="waitingPatientsModalLabel" className="patient-list-modal__header" toggle={toggle}>
                <PatientListModalTitle
                    icon="ri-hourglass-line"
                    title="Waiting Patients"
                    variant="simple"
                    iconColor="#25a0e2"
                />
                <PatientListModalHeaderActions
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </ModalHeader>
            <ModalBody>

                <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table">
                        <PatientListTableHead />
                        <tbody>
                            {appointmentListLoading ? (
                                <tr>
                                    <td colSpan={6} className='text-center text-muted'>
                                        <div className="d-flex justify-content-center align-items-center">
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Loading waiting patients...
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((appointment, index) => (
                                    <tr key={appointment.id || index}>
                                        <td className='text-center patient-list-modal__index'>{startIndex + index + 1}</td>
                                        <td>
                                            <PatientListNameCell appointment={appointment} />
                                        </td>
                                        <td>
                                            <PatientListAgeCell appointment={appointment} />
                                        </td>
                                        <td>
                                            <PatientListPlaceCell appointment={appointment} />
                                        </td>
                                        <td>
                                            <PatientListTimeCell appointment={appointment} />
                                        </td>
                                        <td>
                                            <PatientListStatusBadge
                                                status={appointment.status}
                                                badgeClass={statusMatches(appointment.status, 'Waiting') || statusMatches(appointment.status, 'WAITING') ? 'bg-warning' : 'bg-secondary'}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                            {pageItems.length === 0 && !appointmentListLoading && (
                                <tr>
                                    <PatientListEmptyCell
                                        message={searchTerm ? 'No waiting patients found matching your search' : 'No waiting patients available'}
                                    />
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer row inside body with results count and pagination */}
                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                        {appointmentListLoading ? (
                            'Loading...'
                        ) : (
                            `Showing ${pageItems.length} of ${filtered.length} Waiting Patients ${searchTerm ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'Waiting') || statusMatches(apt.status, 'WAITING')).length} total waiting)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'Waiting') || statusMatches(apt.status, 'WAITING')).length} total waiting)`}`
                        )}
                    </div>
                    {!appointmentListLoading && totalPages > 1 && (
                        <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            <CompactModalPaginationPages currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            <PaginationItem disabled={safePage === totalPages}>
                                <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, safePage + 1)); }} />
                            </PaginationItem>
                        </Pagination>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

const DASHBOARD_DATE_DISPLAY_FORMAT = 'DD-MM-YYYY';
const FLATPICKR_DATE_DISPLAY_FORMAT = 'd-m-Y';

const formatDobForInput = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const parsed = moment(dateOfBirth);
    return parsed.isValid() ? parsed.format(DOB_DISPLAY_FORMAT) : '';
};

const resolveCreatedPatientOption = (createResponse, patientName, patientListData = []) => {
    const responseData = createResponse?.data ?? createResponse ?? {};
    const patientID = responseData?.patientID ?? responseData?.patientId ?? responseData?.id;

    if (patientID) {
        return {
            value: patientID,
            label: responseData?.patientName || patientName,
        };
    }

    const normalizedName = patientName.trim().toLowerCase();
    const matchedPatients = (patientListData || []).filter((patient) =>
        String(patient?.patientName || '').trim().toLowerCase() === normalizedName
    );

    if (matchedPatients.length > 0) {
        const latestPatient = matchedPatients[matchedPatients.length - 1];
        return {
            value: latestPatient.patientID,
            label: latestPatient.patientName,
        };
    }

    return null;
};

const getDoctorPatientTotalCount = (patientList, counts) => {
    if (counts?.totalPatients != null && counts.totalPatients >= 0) {
        return counts.totalPatients;
    }
    if (!Array.isArray(patientList) || patientList.length === 0) {
        return 0;
    }
    const patientIds = new Set();
    patientList.forEach((patient) => {
        const id = patient?.patientID ?? patient?.patientId ?? patient?.PatientID;
        if (id != null) {
            patientIds.add(id);
        }
    });
    return patientIds.size > 0 ? patientIds.size : patientList.length;
};

// Patient List modal with search, pagination, edit/delete actions
const PatientListModal = ({ isOpen, toggle }) => {
    const dispatch = useDispatch();
    const patientList = useSelector((state) => state?.DoctorDashboard?.patientList) || [];
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList) || [];
    const patientListLoading = useSelector((state) => state?.DoctorDashboard?.patientListLoading);
    const patientLoading = useSelector((state) => state?.DoctorDashboard?.patientLoading);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [editForm, setEditForm] = useState({
        patientName: '',
        gender: 'Male',
        dob: '',
        address: '',
        mobile: '',
        email: '',
        referBy: '',
    });
    const pageSize = 10;

    useEffect(() => {
        if (!isOpen) return;
        const userId = getAuthUserId();
        if (userId) {
            dispatch(getPatientList({ userId }));
            dispatch(getAppointmentList({
                appointmentDate: dashboardQueryDateIso(),
                status: '',
                userId,
            }));
        }
        setSearchTerm("");
        setCurrentPage(1);
    }, [isOpen, dispatch]);

    const filtered = patientList.filter((patient) => recordMatchesQuery(patient, searchTerm));

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const openEditModal = (patient) => {
        const email = getPatientEmailForEdit(patient, appointmentList);
        setEditingPatient({ ...patient, mail: email || patient.mail });
        setEditForm({
            patientName: patient.patientName || '',
            gender: patient.gender === 1 ? 'Female' : 'Male',
            dob: formatDobForInput(patient.dateOfBirth),
            address: patient.address || '',
            mobile: patient.mobileNo || '',
            email,
            referBy: patient.refBy || '',
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditingPatient(null);
    };

    const updateEditField = (field, value) => {
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const refreshPatientList = () => {
        const userId = getAuthUserId();
        if (userId) {
            const now = dashboardQueryDateIso();
            dispatch(getPatientList({ userId }));
            dispatch(fetchDoctorDashboardCounts({
                appointmentDate: now,
                status: '',
                userId,
            }));
        }
    };

    const handleUpdatePatient = async () => {
        if (!editingPatient) return;

        const patientData = buildPatientApiPayload({
            patient: editingPatient,
            form: editForm,
            isCreate: false,
        });

        try {
            await dispatch(createPatient(patientData));
            refreshPatientList();
            closeEditModal();
            Swal.fire({
                title: 'Updated!',
                text: 'Patient details have been updated.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update patient';
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        }
    };

    const handleDeletePatient = (patient) => {
        Swal.fire({
            title: 'Are you sure you want to delete this patient?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                await dispatch(deletePatient({ patientId: patient.patientID }));
                refreshPatientList();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The patient has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete patient';
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        });
    };

    return (
        <>
            <Modal size="xl" id="patientListModal" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
                <ModalHeader id="patientListModalLabel" className="patient-list-modal__header" toggle={toggle}>
                    <PatientListModalTitle
                        icon="ri-team-line"
                        title="Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientViewAllTableHead />
                            <tbody>
                                {patientListLoading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center text-muted">
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {pageItems.map((patient, index) => (
                                            <tr key={patient.patientID}>
                                                <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                                                <td>
                                                    <PatientListNameCell appointment={patient} />
                                                </td>
                                                <td>
                                                    <PatientViewAllMobileCell patient={patient} />
                                                </td>
                                                <td>
                                                    <PatientViewAllAddressCell patient={patient} />
                                                </td>
                                                <td>
                                                    <PatientViewAllGenderCell patient={patient} />
                                                </td>
                                                <td>
                                                    <PatientViewAllDateCell
                                                        value={(() => {
                                                            const lastVisit = patient.lastVisitAt ?? patient.LastVisitAt;
                                                            if (lastVisit && moment(lastVisit).isValid()) {
                                                                return moment(lastVisit).format('DD-MM-YYYY');
                                                            }
                                                            if (patient.enteredDate && moment(new Date(patient.enteredDate)).isValid()) {
                                                                return moment(patient.enteredDate).format('DD-MM-YYYY');
                                                            }
                                                            return '-';
                                                        })()}
                                                    />
                                                </td>
                                                <td>
                                                    <PatientViewAllDateCell
                                                        value={patient.dateOfBirth && moment(patient.dateOfBirth).isValid()
                                                            ? moment(patient.dateOfBirth).format('DD-MM-YYYY')
                                                            : '-'}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-inline-flex gap-2">
                                                        <div className="edit">
                                                            <button
                                                                id={`patient-list-edit-${patient.patientID}`}
                                                                type="button"
                                                                className="btn btn-sm btn-soft-success edit-item-btn"
                                                                onClick={() => openEditModal(patient)}
                                                            >
                                                                <i className="ri-pencil-fill" />
                                                            </button>
                                                            <UncontrolledTooltip placement="top" target={`patient-list-edit-${patient.patientID}`}>
                                                                Edit Patient
                                                            </UncontrolledTooltip>
                                                        </div>
                                                        <div className="remove">
                                                            <button
                                                                id={`patient-list-del-${patient.patientID}`}
                                                                type="button"
                                                                className="btn btn-sm btn-soft-danger remove-item-btn"
                                                                onClick={() => handleDeletePatient(patient)}
                                                            >
                                                                <i className="ri-delete-bin-5-line" />
                                                            </button>
                                                            <UncontrolledTooltip placement="top" target={`patient-list-del-${patient.patientID}`}>
                                                                Delete Patient
                                                            </UncontrolledTooltip>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {pageItems.length === 0 && !patientListLoading && (
                                            <tr>
                                                <PatientListEmptyCell
                                                    colSpan={8}
                                                    message={searchTerm ? 'No patients found matching your search' : 'No patients available'}
                                                />
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {patientListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${pageItems.length} of ${filtered.length} Patients ${searchTerm ? `(filtered from ${patientList.length} total)` : `(from ${patientList.length} total)`}`
                            )}
                        </div>
                        {!patientListLoading && totalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={safePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                <PaginationItem disabled={safePage === totalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, safePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="lg" isOpen={editModalOpen} toggle={closeEditModal} className="patient-list-modal new-patient-modal edit-patient-modal">
                <ModalHeader className="patient-list-modal__header" toggle={closeEditModal}>
                    <PatientListModalTitle
                        icon="ri-user-settings-line"
                        title="Edit Patient"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="row g-2 new-patient-modal__fields">
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-user-line" aria-hidden="true" />
                                Patient Name
                            </Label>
                            <Input type="text" value={editForm.patientName} onChange={(e) => updateEditField('patientName', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-group-line" aria-hidden="true" />
                                Gender
                            </Label>
                            <div className="new-patient-modal__gender" role="radiogroup" aria-label="Gender">
                                <label className={`new-patient-modal__gender-option${editForm.gender === 'Male' ? ' is-active' : ''}`}>
                                    <Input
                                        id="patientListGenderMale"
                                        name="gender"
                                        type="radio"
                                        className="new-patient-modal__gender-input"
                                        checked={editForm.gender === 'Male'}
                                        onChange={() => updateEditField('gender', 'Male')}
                                    />
                                    <span className="new-patient-modal__gender-text">
                                        <i className="ri-men-line" aria-hidden="true" />
                                        Male
                                    </span>
                                </label>
                                <label className={`new-patient-modal__gender-option${editForm.gender === 'Female' ? ' is-active' : ''}`}>
                                    <Input
                                        id="patientListGenderFemale"
                                        name="gender"
                                        type="radio"
                                        className="new-patient-modal__gender-input"
                                        checked={editForm.gender === 'Female'}
                                        onChange={() => updateEditField('gender', 'Female')}
                                    />
                                    <span className="new-patient-modal__gender-text">
                                        <i className="ri-women-line" aria-hidden="true" />
                                        Female
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-cake-2-line" aria-hidden="true" />
                                Date of Birth
                            </Label>
                            <DateOfBirthPicker
                                name="editPatientDob"
                                value={editForm.dob}
                                className="doctor-modal-date-picker"
                                placeholder={DOB_DISPLAY_FORMAT}
                                onChange={(dateStr) => updateEditField('dob', dateStr)}
                            />
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-user-shared-line" aria-hidden="true" />
                                Refer By
                            </Label>
                            <Input type="text" value={editForm.referBy} onChange={(e) => updateEditField('referBy', e.target.value)} />
                        </div>
                        <div className="col-12">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-map-pin-line" aria-hidden="true" />
                                Address
                            </Label>
                            <Input type="textarea" value={editForm.address} onChange={(e) => updateEditField('address', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-phone-line" aria-hidden="true" />
                                Mobile No
                            </Label>
                            <Input type="tel" value={editForm.mobile} onChange={(e) => updateEditField('mobile', e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label new-patient-modal__label">
                                <i className="ri-mail-line" aria-hidden="true" />
                                Email
                            </Label>
                            <Input type="email" value={editForm.email} onChange={(e) => updateEditField('email', e.target.value)} />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="justify-content-end">
                    <ModalActionButton action="cancel" onClick={closeEditModal} disabled={patientLoading} />
                    <ModalActionButton
                        action="update"
                        onClick={handleUpdatePatient}
                        disabled={patientLoading}
                        loading={patientLoading}
                        loadingLabel="Updating..."
                    />
                </ModalFooter>
            </Modal>
        </>
    );
};

// Appointment List modal with search, pagination, and Date/Time columns
const AppointmentListModal = ({ isOpen, toggle }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [filterDate, setFilterDate] = useState(() => moment().format(DOB_DISPLAY_FORMAT));
    const [dateAppointments, setDateAppointments] = useState([]);
    const [dateLoading, setDateLoading] = useState(false);
    const pageSize = 10;

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setCurrentPage(1);
            setFilterDate(moment().format(DOB_DISPLAY_FORMAT));
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const iso = toAppointmentListDateIso(filterDate);
        if (!iso) {
            setDateLoading(false);
            return undefined;
        }

        const { userId } = getPatientAuthContext();
        if (!userId) return undefined;

        let cancelled = false;
        setDateLoading(true);

        fetchAppointmentListByDateApi({
            userId,
            appointmentDate: iso,
        })
            .then((response) => {
                if (!cancelled) {
                    setDateAppointments(extractApiList(response));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setDateAppointments([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setDateLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, filterDate]);

    const filtered = dateAppointments.filter((appointment) => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;

        const patientName = appointment.patientName?.toLowerCase() || '';
        const mobileNo = appointment.mobileNo?.toString() || '';
        const appointmentDate = appointment.appointmentDate ? moment(appointment.appointmentDate).format('DD-MM-YYYY').toLowerCase() : '';
        const appointmentTime = appointment.appointmentTime ? moment(appointment.appointmentTime, "HH:mm:ss").format("hh:mm A").toLowerCase() : '';
        const status = appointment.status?.toLowerCase() || '';

        return (
            patientName.includes(needle) ||
            mobileNo.includes(needle) ||
            appointmentDate.includes(needle) ||
            appointmentTime.includes(needle) ||
            status.includes(needle)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterDateChange = (dateStr) => {
        setFilterDate(dateStr);
        setCurrentPage(1);
    };

    return (
        <Modal size="xl" id="appointmentListModal" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
            <ModalHeader id="appointmentListModalLabel" className="patient-list-modal__header" toggle={toggle}>
                <PatientListModalTitle
                    icon="ri-calendar-check-line"
                    title="Appointments"
                    variant="simple"
                    iconColor="#25a0e2"
                />
                <PatientListModalHeaderActions
                    value={searchTerm}
                    onChange={handleSearch}
                    extra={(
                        <div className="patient-list-modal__date-filter">
                            <DateOfBirthPicker
                                name="appointmentListFilterDate"
                                value={filterDate}
                                minDate={null}
                                maxDate={null}
                                placeholder={DOB_DISPLAY_FORMAT}
                                onChange={handleFilterDateChange}
                            />
                        </div>
                    )}
                />
            </ModalHeader>
            <ModalBody>
                <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table">
                        <AppointmentListTableHead />
                        <tbody>
                            {dateLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">
                                        <div className="d-flex justify-content-center align-items-center">
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Loading appointments...
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {pageItems.map((appointment, index) => (
                                        <tr key={appointment.patientAppId || appointment.id || index}>
                                            <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <AppointmentListMobileCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <AppointmentListDateCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <AppointmentListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={getPatientListStatusBadgeClass(appointment.status)}
                                                />
                                                {appointment.paymentStatus ? (
                                                    <span className="badge bg-light text-dark ms-1">{appointment.paymentStatus}</span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                    {pageItems.length === 0 && !dateLoading && (
                                        <tr>
                                            <PatientListEmptyCell
                                                message={searchTerm ? 'No appointments found matching your search' : 'No appointments available'}
                                            />
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                        {dateLoading ? (
                            'Loading...'
                        ) : (
                            `Showing ${pageItems.length} of ${filtered.length} Appointments ${searchTerm ? `(filtered from ${dateAppointments.length} total)` : `(from ${dateAppointments.length} total)`}`
                        )}
                    </div>
                    {!dateLoading && totalPages > 1 && (
                        <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            <CompactModalPaginationPages currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            <PaginationItem disabled={safePage === totalPages}>
                                <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, safePage + 1)); }} />
                            </PaginationItem>
                        </Pagination>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

// Unpaid consultation patient list (same layout as Patients; Status instead of Action)
const BillingListModal = ({ isOpen, toggle }) => {
    const dispatch = useDispatch();
    const patientList = useSelector((state) => state?.DoctorDashboard?.patientList) || [];
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList) || [];
    const patientListLoading = useSelector((state) => state?.DoctorDashboard?.patientListLoading);

    const [searchTerm, setSearchTerm] = useState("");
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        if (!isOpen) return;
        const userId = getAuthUserId();
        if (userId) {
            dispatch(getPatientList({ userId }));
            dispatch(getAppointmentList({
                appointmentDate: dashboardQueryDateIso(),
                status: '',
                userId,
            }));
        }
        setSearchTerm("");
        setAppointmentStatusFilter('all');
        setCurrentPage(1);
    }, [isOpen, dispatch]);

    const patientsWithStatus = useMemo(
        () => buildConsultationPaymentList(appointmentList, patientList),
        [patientList, appointmentList]
    );
    const paidCount = patientsWithStatus.filter((row) => row.consultationPaymentStatus === 'Paid').length;
    const unpaidCount = patientsWithStatus.filter((row) => row.consultationPaymentStatus === 'Unpaid').length;

    const filtered = patientsWithStatus.filter((patient) => {
        if (!appointmentMatchesStatusFilter(patient, appointmentStatusFilter)) {
            return false;
        }

        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;

        const patientName = patient.patientName?.toLowerCase() || '';
        const mobileNo = patient.mobileNo?.toString() || '';
        const address = patient.address?.toLowerCase() || '';
        const status = patient.consultationPaymentStatus?.toLowerCase() || '';

        return (
            patientName.includes(needle) ||
            mobileNo.includes(needle) ||
            address.includes(needle) ||
            status.includes(needle)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleAppointmentStatusFilter = (e) => {
        setAppointmentStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const hasActiveFilters = Boolean(searchTerm) || appointmentStatusFilter !== 'all';

    return (
        <Modal size="xl" id="billingListModal" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
            <ModalHeader id="billingListModalLabel" className="patient-list-modal__header" toggle={toggle}>
                <PatientListModalTitle
                    icon="ri-team-line"
                    title="Patients"
                    variant="simple"
                    iconColor="#25a0e2"
                />
                <PatientListModalHeaderActions
                    value={searchTerm}
                    onChange={handleSearch}
                    extra={(
                        <div className="patient-list-modal__status-filter">
                            <Input
                                type="select"
                                bsSize="sm"
                                value={appointmentStatusFilter}
                                onChange={handleAppointmentStatusFilter}
                                aria-label="Filter by appointment status"
                            >
                                {APPOINTMENT_STATUS_FILTER_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Input>
                        </div>
                    )}
                />
            </ModalHeader>
            <ModalBody>
                <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table">
                        <UnpaidConsultationTableHead />
                        <tbody>
                            {patientListLoading ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted">
                                        <div className="d-flex justify-content-center align-items-center">
                                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            Loading patients...
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {pageItems.map((patient, index) => (
                                        <tr key={patient.patientAppId || patient.patientAppID || `unpaid-${startIndex + index}`}>
                                            <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={patient} />
                                            </td>
                                            <td>
                                                <PatientViewAllMobileCell patient={patient} />
                                            </td>
                                            <td>
                                                <PatientViewAllAddressCell patient={patient} />
                                            </td>
                                            <td>
                                                <PatientViewAllGenderCell patient={patient} />
                                            </td>
                                            <td>
                                                <PatientViewAllDateCell
                                                    value={patient.lastAppDt || '-'}
                                                />
                                            </td>
                                            <td>
                                                <span className="patient-list-modal__meta fw-semibold">
                                                    {formatConsultationAmountDisplay(patient.consultationAmount)}
                                                </span>
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={patient.consultationPaymentStatus}
                                                    badgeClass={getBillingStatusBadgeClass(patient.consultationPaymentStatus)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {pageItems.length === 0 && (
                                        <tr>
                                            <PatientListEmptyCell
                                                colSpan={8}
                                                message={hasActiveFilters ? 'No patients found matching your filters' : 'No unpaid consultation patients available'}
                                            />
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                        {patientListLoading ? (
                            'Loading...'
                        ) : (
                            `Showing ${pageItems.length} of ${filtered.length} Patients (${unpaidCount} Unpaid, ${paidCount} Paid)${hasActiveFilters ? ` · filtered from ${patientsWithStatus.length}` : ''}`
                        )}
                    </div>
                    {!patientListLoading && totalPages > 1 && (
                        <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            <CompactModalPaginationPages currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            <PaginationItem disabled={safePage === totalPages}>
                                <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCurrentPage(Math.min(totalPages, safePage + 1)); }} />
                            </PaginationItem>
                        </Pagination>
                    )}
                </div>
            </ModalBody>
        </Modal>
    );
};

// Subscription Expiration Warning Modal
const SubscriptionExpirationModal = ({ isOpen, toggle, daysRemaining }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>
                <h5 className="modal-title mb-0">SUBSCRIPTIONS</h5>
            </ModalHeader>
            <ModalBody>
                <div className="p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <p className="mb-0">
                        Your subscription will expire after {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Please buy new subscription to continue your valuable practice.
                    </p>
                </div>
            </ModalBody>
            <ModalFooter>
                <ModalActionButton action="cancel" onClick={toggle}>Close</ModalActionButton>
            </ModalFooter>
        </Modal>
    );
};

const PLAN_CARD_THEMES = [
    { top: '#5b6abf', bottom: '#2c3e8f', icon: 'ri-timer-flash-line' },
    { top: '#1abc9c', bottom: '#148f77', icon: 'ri-calendar-line' },
    { top: '#3498db', bottom: '#2471a3', icon: 'ri-calendar-2-line' },
    { top: '#f1c40f', bottom: '#e67e22', icon: 'ri-calendar-event-line' },
    { top: '#e74c3c', bottom: '#c0392b', icon: 'ri-medal-line' },
    { top: '#566573', bottom: '#2c3e50', icon: 'ri-vip-crown-line' },
];

const SUBSCRIPTION_PLAN_MODAL_STYLES = `
  .subscription-plan-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.3rem;
    padding: 0 0 0.15rem;
  }
  @media (max-width: 767px) {
    .subscription-plan-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 479px) {
    .subscription-plan-row { grid-template-columns: 1fr; }
  }
  .subscription-plan-card {
    width: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #dbe7f3;
    border-radius: 5px;
    background: #fff;
    box-shadow: none;
    overflow: hidden;
    transition: border-color 0.18s ease;
  }
  .subscription-plan-card:hover {
    transform: none;
    border-color: #b9d7f2;
  }
  .subscription-plan-card__body {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.45rem;
    min-height: 0;
    padding: 0.45rem 0.65rem 0.35rem;
    border-radius: 0;
    background: transparent !important;
    color: #0f172a;
  }
  .subscription-plan-card--1 { background: linear-gradient(135deg, #d7ecfc 0%, #eef6ff 48%, #f9fcff 100%) !important; border-color: #d4e7f8; }
  .subscription-plan-card--2 { background: linear-gradient(135deg, #d4f3e0 0%, #eefaf3 48%, #f8fdf9 100%) !important; border-color: #d3eedd; }
  .subscription-plan-card--3 { background: linear-gradient(135deg, #d2f3ef 0%, #eefaf8 48%, #f7fdfc 100%) !important; border-color: #d2eeea; }
  .subscription-plan-card--4 { background: linear-gradient(135deg, #ffe8c2 0%, #fff6e8 48%, #fffdf8 100%) !important; border-color: #f6e6c4; }
  .subscription-plan-card--5 { background: linear-gradient(135deg, #fde0e8 0%, #fff1f4 48%, #fffafb 100%) !important; border-color: #f6dce4; }
  .subscription-plan-card--6 { background: linear-gradient(135deg, #eadcff 0%, #f6f0ff 48%, #fcfaff 100%) !important; border-color: #e6d8f8; }
  .subscription-plan-card__copy { min-width: 0; }
  .subscription-plan-card__name {
    margin: 0;
    color: #0f172a;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.25;
  }
  .subscription-plan-card__price {
    margin: 0.2rem 0 0.35rem;
    color: #0f172a;
    font-size: 1.6rem;
    font-weight: 700;
    line-height: 1.1;
  }
  .subscription-plan-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.65rem;
    color: #475569;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .subscription-plan-card__meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .subscription-plan-card__meta i { color: #25a0e2; font-size: 0.85rem; line-height: 1; }
  .subscription-plan-card__glyph {
    flex-shrink: 0;
    align-self: center;
    margin-left: auto;
    color: #25a0e2;
    font-size: 1.35rem;
    line-height: 1;
    background: transparent;
  }
  .subscription-plan-card__footer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    flex-shrink: 0;
    margin: 0 0.65rem 0.65rem;
    height: 1.75rem;
    padding: 0 0.65rem;
    border: 1px solid #7dd3fc;
    border-radius: 4px;
    background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 55%, #bae6fd 100%) !important;
    color: #0369a1;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0;
    box-shadow: none;
  }
  .subscription-plan-card__footer i { font-size: 0.85rem; line-height: 1; color: #0369a1; }
  .subscription-plan-card__footer:hover {
    filter: none;
    background: linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%) !important;
    color: #075985;
  }
  .subscription-plan-card__footer:hover i { color: #075985; }
`;

const formatPlanAmount = (amount) => {
    const value = Number(amount);
    if (Number.isFinite(value)) {
        return `₹${value.toLocaleString('en-IN')}`;
    }
    return `₹${amount ?? ''}`;
};

const getPlanIcon = (pkg, index) => {
    const days = Number(pkg?.validityInDays);
    if (days <= 10) return 'ri-timer-flash-line';
    if (days <= 31) return 'ri-calendar-line';
    if (days <= 90) return 'ri-calendar-2-line';
    if (days <= 180) return 'ri-calendar-event-line';
    if (days <= 365) return 'ri-medal-line';
    if (days > 365) return 'ri-vip-crown-line';
    return PLAN_CARD_THEMES[index % PLAN_CARD_THEMES.length].icon;
};

// Subscription (Purchase Plan) modal — 2-row card grid (3 per row)
const SubscriptionListModal = ({ isOpen, toggle, handleOnBuyClick, isNonCloseable = false, purchaseDisabled = false }) => {
    const packages = useSelector((state) => state?.DoctorDashboard?.packages) || [];
    const packagesLoading = useSelector((state) => state?.DoctorDashboard?.packagesLoading);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setSearchTerm('');
    }, [isOpen]);

    const filteredPackages = packages.filter((pkg) => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;

        const packageName = pkg.packageName?.toLowerCase() || '';
        const amount = String(pkg.amount ?? '');
        const caseCount = String(pkg.caseCount ?? '');
        const validity = String(pkg.validityInDays ?? '');

        return (
            packageName.includes(needle) ||
            amount.includes(needle) ||
            caseCount.includes(needle) ||
            validity.includes(needle)
        );
    });

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    return (
        <Modal
            size="xl"
            id="subscriptionListModal"
            isOpen={isOpen}
            toggle={isNonCloseable ? undefined : toggle}
            backdrop={isNonCloseable ? 'static' : true}
            keyboard={!isNonCloseable}
            className="patient-list-modal subscription-plan-modal"
        >
            <style>{SUBSCRIPTION_PLAN_MODAL_STYLES}</style>
            <ModalHeader
                id="subscriptionListModalLabel"
                className="patient-list-modal__header"
                toggle={isNonCloseable ? undefined : toggle}
            >
                <PatientListModalTitle
                    icon="ri-vip-crown-line"
                    title="Purchase Plans"
                    variant="simple"
                    iconColor="#25a0e2"
                />
                {isNonCloseable ? (
                    <div className="patient-list-modal__header-actions">
                        <Link
                            to="/logout"
                            className="btn btn-soft-danger btn-sm subscription-plan-logout-btn"
                            title="Logout"
                        >
                            <i className="ri-logout-box-r-line align-middle me-1" />
                            Logout
                        </Link>
                    </div>
                ) : (
                    <PatientListModalHeaderActions
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search plans.."
                    />
                )}
            </ModalHeader>
            <ModalBody>
                <div className="patient-list-modal__table-wrap subscription-plan-modal__content-wrap">
                    {packagesLoading ? (
                        <div className="text-center text-muted py-5">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            Loading packages...
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="patient-list-modal__empty">
                            <span className="patient-list-modal__empty-icon" aria-hidden="true">
                                <i className="ri-inbox-2-line" />
                            </span>
                            <span>No packages available</span>
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="patient-list-modal__empty">
                            <span className="patient-list-modal__empty-icon" aria-hidden="true">
                                <i className="ri-inbox-2-line" />
                            </span>
                            <span>No plans found matching your search</span>
                        </div>
                    ) : (
                        <div className="subscription-plan-row">
                            {filteredPackages.map((pkg, index) => {
                                const planIcon = getPlanIcon(pkg, index);
                                return (
                                    <div key={pkg.packageId} className={`subscription-plan-card subscription-plan-card--${(index % 6) + 1}`}>
                                        <div className="subscription-plan-card__body">
                                            <div className="subscription-plan-card__copy">
                                                <h5 className="subscription-plan-card__name">{pkg.packageName}</h5>
                                                <p className="subscription-plan-card__price">{formatPlanAmount(pkg.amount)}</p>
                                                <div className="subscription-plan-card__meta">
                                                    <span><i className="ri-briefcase-line" aria-hidden="true" />{pkg.caseCount} Cases</span>
                                                    <span><i className="ri-time-line" aria-hidden="true" />{pkg.validityInDays} Days</span>
                                                </div>
                                            </div>
                                            <i className={`${planIcon} subscription-plan-card__glyph`} aria-hidden="true" />
                                        </div>
                                        <button
                                            type="button"
                                            className="subscription-plan-card__footer"
                                            disabled={purchaseDisabled}
                                            onClick={() => {
                                                if (!purchaseDisabled) handleOnBuyClick(pkg);
                                            }}
                                        >
                                            <i className="ri-shopping-bag-3-line" aria-hidden="true" />
                                            {purchaseDisabled ? 'Processing…' : 'Buy Now'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                        {packagesLoading ? (
                            'Loading...'
                        ) : (
                            `Showing ${filteredPackages.length} of ${packages.length} Plans ${searchTerm ? `(filtered from ${packages.length} total)` : `(from ${packages.length} total)`}`
                        )}
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
};

const formatIndianRupeeAmount = (amount) => {
    const value = Math.round(Number(amount) || 0);
    return value.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });
};

const Widgets = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const loginUser = useSelector((state) => state?.Login?.user);
    const planDaysRemaining = useMemo(
        () => getPlanDaysRemaining(loginUser),
        [loginUser]
    );
    const counts = useSelector((state) => state?.DoctorDashboard?.counts);
    const patientList = useSelector((state) => state?.DoctorDashboard?.patientList);
    const patientListLoading = useSelector((state) => state?.DoctorDashboard?.patientListLoading);
    const doctorList = useSelector((state) => state?.DoctorDashboard?.doctorList);
    const appointmentSuccess = useSelector((state) => state?.DoctorDashboard?.appointmentSuccess);
    const appointmentError = useSelector((state) => state?.DoctorDashboard?.appointmentError);
    const patientSuccess = useSelector((state) => state?.DoctorDashboard?.patientSuccess);
    const patientError = useSelector((state) => state?.DoctorDashboard?.patientError);
    const patientLoading = useSelector((state) => state?.DoctorDashboard?.patientLoading);
    const countries = useSelector((state) => state?.DoctorDashboard?.countries);
    const states = useSelector((state) => state?.DoctorDashboard?.states);
    const packages = useSelector((state) => state?.DoctorDashboard?.packages);
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList) || [];
    const liveUnpaid = useMemo(() => {
        const rows = Array.isArray(appointmentList) ? appointmentList : [];
        const unpaid = rows.filter((row) => {
            const raw = String(row.paymentStatus || row.PaymentStatus || "UNPAID").trim().toUpperCase();
            return raw !== "PAID" && raw !== "REFUNDED";
        });
        const amount = unpaid.reduce(
            (sum, row) => sum + (Number(row.consultFee ?? row.ConsultFee ?? 0) || 0),
            0
        );
        return { unpaidCount: unpaid.length, unpaidAmount: amount };
    }, [appointmentList]);
    const unpaidConsultationAmount = liveUnpaid.unpaidAmount;
    const unpaidConsultationCount = liveUnpaid.unpaidCount;
    const appointmentListLoading = useSelector((state) => state?.DoctorDashboard?.appointmentListLoading);
    const orderSuccess = useSelector((state) => state?.DoctorDashboard?.orderSuccess);
    const subscriptionSuccess = useSelector((state) => state?.DoctorDashboard?.subscriptionSuccess);
    const subscriptionError = useSelector((state) => state?.DoctorDashboard?.subscriptionError);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [todaySlotCount, setTodaySlotCount] = useState(null);
    const razorpayInstanceRef = useRef(null);
    const selectedPackageRef = useRef(null);
    const [subscriptionCheckoutActive, setSubscriptionCheckoutActive] = useState(false);

    const patientTotalCount = useMemo(
        () => getDoctorPatientTotalCount(patientList, counts),
        [patientList, counts]
    );

    const subscriptionCaseLimit = useMemo(
        () => getSubscriptionCaseLimitInfo(counts, doctorList?.[0]),
        [counts, doctorList]
    );

    const loadTodaySlotCount = () => {
        (async () => {
            try {
                const doctorId = getAuthDoctorId();
                if (!doctorId) return;
                const response = await getAppointmentSlots({
                    doctorId,
                    appointmentDate: moment().format('YYYY-MM-DD'),
                });
                const normalized = normalizeAppointmentSlotsResponse(response);
                setTodaySlotCount(Array.isArray(normalized.slots) ? normalized.slots.length : 0);
            } catch {
                setTodaySlotCount(0);
            }
        })();
    };

    useEffect(() => {
        const auth = JSON.parse(sessionStorage.getItem('authUser'));
        const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
        const now = new Date();
        dispatch(fetchDoctorDashboardCounts({
            appointmentDate: dashboardQueryDateIso(now),
            status: "",
            userId: userId
        }));
        dispatch(getPatientList({
            userId: userId
        }));
        dispatch(getDoctorList({
            userId: userId
        }));
        dispatch(getAppointmentList({
            appointmentDate: dashboardQueryDateIso(now),
            status: "",
            userId: userId
        }));
        dispatch(getCountries());
        dispatch(getStates());
        dispatch(getPackages());
        loadTodaySlotCount();
    }, [dispatch]);

    const [earningsTotal, setEarningsTotal] = useState(0);
    const [supportOpenCount, setSupportOpenCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        earningsSummary({})
            .then((response) => {
                const data = unwrapS4(response) || {};
                const total = Number(data.totalCaptured ?? data.TotalCaptured ?? 0) || 0;
                if (!cancelled) setEarningsTotal(Math.round(total));
            })
            .catch(() => {
                if (!cancelled) setEarningsTotal(0);
            });
        loadMyTickets()
            .then((tickets) => {
                const open = (tickets || []).filter((ticket) => ticket.status !== 'Resolved' && ticket.status !== 'Closed').length;
                if (!cancelled) setSupportOpenCount(open);
            })
            .catch(() => {
                if (!cancelled) setSupportOpenCount(0);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Check subscription status and show appropriate modals
    useEffect(() => {
        if (subscriptionCheckoutActive) return;
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            const subscriptionData = {
                ...(auth?.data || auth || {}),
                ...(loginUser && typeof loginUser === 'object' ? loginUser : {}),
            };

            if (!subscriptionData) return;

            const justActivated = sessionStorage.getItem(SUBSCRIPTION_JUST_ACTIVATED_KEY) === '1';
            if (justActivated) {
                sessionStorage.removeItem(SUBSCRIPTION_JUST_ACTIVATED_KEY);
            }

            const isPlanActive = readPlanActive(subscriptionData);
            const islastFiveDays = subscriptionData.islastFiveDays === true || subscriptionData.IslastFiveDays === true;
            const daysRemaining = subscriptionData.daysRemaining || subscriptionData.DaysRemaining || 0;

            if (!isPlanActive && !justActivated) {
                setModalSubscriptionList(true);
                return;
            }

            if (isPlanActive) {
                setModalSubscriptionList(false);
            }

            if (islastFiveDays === true && daysRemaining > 0) {
                const today = new Date().toDateString();
                const lastShownDate = localStorage.getItem('subscriptionExpirationWarningDate');
                const lastDaysRemaining = localStorage.getItem('subscriptionDaysRemaining');

                if (lastShownDate !== today || lastDaysRemaining !== daysRemaining.toString()) {
                    setSubscriptionDaysRemaining(daysRemaining);
                    setModalSubscriptionExpiration(true);
                    localStorage.setItem('subscriptionExpirationWarningDate', today);
                    localStorage.setItem('subscriptionDaysRemaining', daysRemaining.toString());
                }
            }
        } catch (error) {
            console.error('Error checking subscription status:', error);
        }
    }, [loginUser, subscriptionCheckoutActive]);

    // Modal states for dashboard KPI cards
    const [modal_waiting, setmodal_waiting] = useState(false);
    function tog_waiting() {
        setmodal_waiting(!modal_waiting);
    }

    const [modal_walkin, setmodal_walkin] = useState(false);
    function tog_walkin() {
        setmodal_walkin(!modal_walkin);
    }

    // Walk-in modal: search + pagination state and real data
    const [walkinSearch, setWalkinSearch] = useState("");
    const [walkinPage, setWalkinPage] = useState(1);
    const walkinPageSize = 10;

    // Filter appointments by status = "Walk-in" or "WALK-IN" and search term
    const walkinFiltered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "Walk-in" and "WALK-IN")
        if (!statusMatches(appointment.status, 'Walk-in') && !statusMatches(appointment.status, 'WALK-IN')) {
            return false;
        }

        // Then filter by search term
        const needle = walkinSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

    const walkinTotalPages = Math.max(1, Math.ceil(walkinFiltered.length / walkinPageSize));
    const walkinSafePage = Math.min(walkinPage, walkinTotalPages);
    const walkinStartIndex = (walkinSafePage - 1) * walkinPageSize;
    const walkinPageItems = walkinFiltered.slice(walkinStartIndex, walkinStartIndex + walkinPageSize);

    const [modal_notarrived, setmodal_notarrived] = useState(false);
    function tog_notarrived() {
        setmodal_notarrived(!modal_notarrived);
    }

    const [modal_econsult, setmodal_econsult] = useState(false);
    function tog_econsult() {
        setmodal_econsult(!modal_econsult);
    }

    const [modal_remaining, setmodal_remaining] = useState(false);
    function tog_remaining() {
        setmodal_remaining(!modal_remaining);
    }

    const [modal_completed, setmodal_completed] = useState(false);
    function tog_completed() {
        setmodal_completed(!modal_completed);
    }

    const [modal_cancelled, setmodal_cancelled] = useState(false);
    function tog_cancelled() {
        setmodal_cancelled(!modal_cancelled);
    }

    const clearCreateNewButtonFocus = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    // New Patient modal
    const [modal_newPatient, setModalNewPatient] = useState(false);
    const patientResetFormRef = useRef(null);

    const closeNewPatientModal = () => {
        tog_newPatient();
    };

    const handleNewPatientModalClosed = () => {
        clearCreateNewButtonFocus();
        patientResetFormRef.current?.();
    };

    function tog_newPatient() {
        setModalNewPatient(!modal_newPatient);
    }

    // New Appointment modal
    const [modal_newAppointment, setModalNewAppointment] = useState(false);
    const [prefilledAppointmentPatient, setPrefilledAppointmentPatient] = useState(null);
    const [appointmentSlots, setAppointmentSlots] = useState([]);
    const [appointmentSlotsLoading, setAppointmentSlotsLoading] = useState(false);
    const [hasAppointmentSchedule, setHasAppointmentSchedule] = useState(false);
    const [appointmentSlotInterval, setAppointmentSlotInterval] = useState(null);
    const [selectedAppointmentSlotTime, setSelectedAppointmentSlotTime] = useState(null);
    const [bookingSlotTime, setBookingSlotTime] = useState(null);
    const [dailyScheduleModalOpen, setDailyScheduleModalOpen] = useState(false);
    const [scheduleModalDoctorId, setScheduleModalDoctorId] = useState(null);
    const [scheduleModalDate, setScheduleModalDate] = useState(null);
    const [requireDailyScheduleSave, setRequireDailyScheduleSave] = useState(false);
    const [scheduleModalContext, setScheduleModalContext] = useState(null);
    const [teleConsultationEnabled, setTeleConsultationEnabled] = useState(true);
    const [doctorFeeConfig, setDoctorFeeConfig] = useState({
        freeFollowUpDaysInClinic: null,
        followUpFeeInClinic: null,
    });
    const availabilityEvaluatedRef = useRef('');
    const appointmentSlotsRequestRef = useRef(0);
    const appointmentResetFormRef = useRef(null);

    // Fetch doctor profile to check if teleconsultation is enabled
    useEffect(() => {
        const loadDoctorProfile = async () => {
            try {
                const response = await getDoctorProfileMe();
                const me = response?.data || response?.Data || response;
                if (me) {
                    setTeleConsultationEnabled(Boolean(me.teleconsultation));
                    setDoctorFeeConfig({
                        freeFollowUpDaysInClinic: me.freeFollowUpDaysInClinic ?? me.FreeFollowUpDaysInClinic ?? null,
                        followUpFeeInClinic: me.followUpFeeInClinic ?? me.FollowUpFeeInClinic ?? null,
                    });
                }
            } catch {
                // Silently fail - if we can't fetch, allow teleconsultation by default
            }
        };
        loadDoctorProfile();
    }, []);

    const closeNewAppointmentModal = () => {
        tog_newAppointment();
    };

    const handleNewAppointmentModalClosed = () => {
        clearCreateNewButtonFocus();
        appointmentResetFormRef.current?.();
    };

    const openNewAppointmentModal = (patientOption = null) => {
        setPrefilledAppointmentPatient(patientOption);
        setSelectedAppointmentSlotTime(null);
        setBookingSlotTime(null);
        setModalNewAppointment(true);
    };

    const handleCreatePatientFromAppointment = () => {
        setModalNewAppointment(false);
        setModalNewPatient(true);
    };

    function tog_newAppointment() {
        setModalNewAppointment((prev) => {
            if (prev) {
                setPrefilledAppointmentPatient(null);
                setAppointmentSlots([]);
                setHasAppointmentSchedule(false);
                setAppointmentSlotInterval(null);
                setBookingSlotTime(null);
            }
            return !prev;
        });
    }

    const loadAppointmentSlotsForForm = async (doctorId, appointmentDate) => {
        const apiDate = formatCalendarDateForSchedule(appointmentDate) || formatCalendarDateForApi(appointmentDate);
        const requestId = ++appointmentSlotsRequestRef.current;

        if (!doctorId || !apiDate) {
            setAppointmentSlots([]);
            setHasAppointmentSchedule(false);
            setAppointmentSlotInterval(null);
            return;
        }

        setAppointmentSlotsLoading(true);
        setAppointmentSlots([]);
        setHasAppointmentSchedule(false);
        setAppointmentSlotInterval(null);

        try {
            const response = await getAppointmentSlots({
                doctorId,
                appointmentDate: apiDate,
            });
            if (requestId !== appointmentSlotsRequestRef.current) {
                return;
            }
            const normalized = normalizeAppointmentSlotsResponse(response);
            setAppointmentSlots(applyClientPastSlotGuard(normalized.slots, apiDate));
            setHasAppointmentSchedule(Boolean(normalized.hasSchedule));
            setAppointmentSlotInterval(normalized.intervalMinutes ?? null);
        } catch (error) {
            if (requestId !== appointmentSlotsRequestRef.current) {
                return;
            }
            console.error('Failed to load appointment slots:', error);
            setAppointmentSlots([]);
            setHasAppointmentSchedule(false);
            setAppointmentSlotInterval(null);
        } finally {
            if (requestId === appointmentSlotsRequestRef.current) {
                setAppointmentSlotsLoading(false);
            }
        }
    };

    const openScheduleSetupModal = (doctorId, scheduleDate, requireSave = false, context = null) => {
        const normalizedDate = formatCalendarDateForSchedule(scheduleDate) || formatApiDate(scheduleDate);
        setScheduleModalDoctorId(doctorId);
        setScheduleModalDate(normalizedDate || scheduleDate);
        setRequireDailyScheduleSave(requireSave);
        setScheduleModalContext(context);
        setDailyScheduleModalOpen(true);
    };

    const refreshDashboardCounts = () => {
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
            if (!userId) return;
            dispatch(fetchDoctorDashboardCounts({
                appointmentDate: dashboardQueryDateIso(),
                status: "",
                userId,
            }));
        } catch {
            /* session unreadable — leave counts untouched */
        }
    };

    const openTodaySlotsSetup = () => {
        const doctorId = getAuthDoctorId();
        if (!doctorId) return;
        openScheduleSetupModal(doctorId, moment().format('YYYY-MM-DD'), false, 'dashboard');
    };

    // Slot-driven availability: past the day's last slot end, Online flips to Offline.
    const getScheduleDayEnd = (schedule) => {
        const normalized = schedule?.data ?? schedule;
        const slots = normalized?.slots ?? normalized?.Slots ?? normalized?.appointments ?? normalized?.Appointments ?? [];
        const candidates = [
            ...(Array.isArray(slots) ? slots.map((s) => s?.end ?? s?.End ?? s?.endTime ?? s?.EndTime ?? s?.slotEnd ?? s?.SlotEnd) : []),
            normalized?.workEnd ?? normalized?.WorkEnd ?? normalized?.endTime ?? normalized?.EndTime ?? normalized?.dayEnd ?? normalized?.DayEnd,
        ].filter(Boolean);
        for (const candidate of candidates) {
            const parsed = moment(candidate, [moment.ISO_8601, 'HH:mm', 'HH:mm:ss', 'h:mm A', 'YYYY-MM-DDTHH:mm:ss'], true);
            if (parsed.isValid()) return parsed;
        }
        return null;
    };

    useEffect(() => {
        const online = !!(counts?.isOnline || counts?.IsOnline);
        if (!online) return;
        const todayKey = moment().format('YYYY-MM-DD');
        if (availabilityEvaluatedRef.current === todayKey) return;
        availabilityEvaluatedRef.current = todayKey;
        (async () => {
            try {
                const doctorId = getAuthDoctorId();
                if (!doctorId) return;
                const schedule = await getDailySchedule({ doctorId, scheduleDate: todayKey });
                if (!schedule) return;
                const dayEnd = getScheduleDayEnd(schedule);
                if (dayEnd && moment().isAfter(dayEnd)) {
                    await updateAvailabilityMe({ isOnline: false });
                    refreshDashboardCounts();
                }
            } catch {
                /* leave status untouched on errors */
            }
        })();
    }, [counts?.isOnline, counts?.IsOnline]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const doctorId = getAuthDoctorId();
                if (!doctorId) return;
                const schedule = await getDailySchedule({
                    doctorId,
                    scheduleDate: moment().format('YYYY-MM-DD'),
                });
                if (cancelled || schedule) return;
                openScheduleSetupModal(doctorId, moment().format('YYYY-MM-DD'), true, 'dashboard');
            } catch (error) {
                console.error('Failed to check daily schedule:', error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const onOpenNewAppointment = (event) => {
            const patientOption = buildPatientSelectOption(event.detail);
            openNewAppointmentModal(patientOption);
        };
        window.addEventListener(DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT, onOpenNewAppointment);
        return () => {
            window.removeEventListener(DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT, onOpenNewAppointment);
        };
    }, []);

    // Patient/app booking → SignalR appointmentChanged → refresh KPIs without manual reload.
    useEffect(() => {
        let timer = null;
        const unsub = subscribeAppointmentChanged(() => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                refreshDashboardCounts();
            }, 400);
        });
        return () => {
            if (timer) window.clearTimeout(timer);
            unsub();
        };
    }, []);

    // REC-03.02 — reception Quick actions open New patient / New appointment via ?qa=
    // sessionStorage survives React Strict Mode remount; clear on a timeout so the
    // second mount still sees the pending action.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qaFromUrl = (params.get("qa") || "").trim().toLowerCase();
        if (qaFromUrl === "newpatient" || qaFromUrl === "newappointment") {
            sessionStorage.setItem("hc_rec_qa", qaFromUrl);
            params.delete("qa");
            const next = params.toString();
            const path = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash || ""}`;
            window.history.replaceState({}, "", path);
        }
        const pending = sessionStorage.getItem("hc_rec_qa");
        if (pending === "newpatient") {
            setModalNewPatient(true);
        } else if (pending === "newappointment") {
            setPrefilledAppointmentPatient(null);
            setModalNewAppointment(true);
        } else {
            return undefined;
        }
        const clearTimer = window.setTimeout(() => sessionStorage.removeItem("hc_rec_qa"), 0);
        return () => window.clearTimeout(clearTimer);
    }, []);

    useEffect(() => {
        const onOpenBillingList = () => {
            setModalBillingList(true);
        };
        window.addEventListener(DOCTOR_DASHBOARD_OPEN_BILLING_LIST_EVENT, onOpenBillingList);
        return () => {
            window.removeEventListener(DOCTOR_DASHBOARD_OPEN_BILLING_LIST_EVENT, onOpenBillingList);
        };
    }, []);

    // Form options for dropdowns
    const patientOptions = patientList?.map((patient) => ({
        value: patient.patientID,
        label: patient.patientName
    })) || [];

    const doctorOptions = useMemo(() => {
        const allDoctors = (doctorList || []).map((doctor) => ({
            value: doctor.doctorID,
            label: doctor.doctorName
        }));
        const authDoctorId = getAuthDoctorId();
        if (resolveUserRole() !== UserRole.DOCTOR || authDoctorId == null) return allDoctors;
        const ownDoctor = allDoctors.filter((option) => String(option.value) === String(authDoctorId));
        return ownDoctor.length ? ownDoctor : allDoctors;
    }, [doctorList]);
    const defaultAppointmentDoctor = doctorOptions.length === 1 ? doctorOptions[0] : null;

    const countryOptions = (countries || []).map((country) => ({
        value: country.countryId,
        label: country.countryName
    }));

    // Debug logging
    console.log("Countries data:", countries);
    console.log("States data:", states);

    // Helper function to get states for a specific country
    const getStatesForCountry = (countryId) => {
        if (!states || !Array.isArray(states)) {
            console.log("States data:", states, "is array:", Array.isArray(states));
            return [];
        }
        const filteredStates = states.filter(state => state.countryId === countryId);
        console.log("Filtered states for country", countryId, ":", filteredStates);
        return filteredStates;
    };

    // Validation schema
    const appointmentValidationSchema = Yup.object().shape({
        patient: Yup.mixed()
            .required('Patient is required')
            .test('is-object', 'Patient is required', function (value) {
                return value !== null && value !== undefined && typeof value === 'object';
            }),
        doctor: Yup.mixed()
            .required('Doctor is required')
            .test('is-object', 'Doctor is required', function (value) {
                return value !== null && value !== undefined && typeof value === 'object';
            }),
        appointmentDate: Yup.string()
            .required('Appointment date is required')
            .test('valid-date', `Please enter a valid date (${APPOINTMENT_INDIAN_DISPLAY_FORMAT})`, (value) => {
                if (!value) return false;
                return moment(value, [APPOINTMENT_INDIAN_DISPLAY_FORMAT, 'D/M/YYYY', DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true).isValid();
            })
            .test('not-past', 'Appointment date cannot be in the past', (value) => {
                const parsed = moment(value, [APPOINTMENT_INDIAN_DISPLAY_FORMAT, 'D/M/YYYY', DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true);
                return parsed.isValid() && parsed.isSameOrAfter(moment(), 'day');
            }),
    });

    // Patient validation schema
    const patientValidationSchema = Yup.object().shape({
        patientName: Yup.string()
            .trim()
            .required('Patient name is required')
            .min(2, 'Patient name must be at least 2 characters'),
        gender: Yup.number()
            .required('Gender is required')
            .oneOf([0, 1], 'Please select a valid gender'),
        dateOfBirth: Yup.string()
            .required('Date of birth is required')
            .test('valid-dob', `Please enter a valid date (${DOB_INDIAN_DISPLAY_FORMAT})`, (value) => {
                if (!value) return false;
                return moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true).isValid();
            })
            .test('not-future', 'Date of birth cannot be in the future', (value) => {
                const parsed = moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true);
                return parsed.isValid() && parsed.isSameOrBefore(moment(), 'day');
            }),
        mobileNo: Yup.string()
            .required('Mobile number is required')
            .matches(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number.'),
        phoneNo: Yup.string()
            .test('valid-phone', 'Please enter a valid phone number.', (value) => {
                const digits = String(value || '').replace(/[\s\-()+]/g, '');
                if (!digits) return true;
                return /^[0-9]{7,15}$/.test(digits);
            }),
        address: Yup.string()
            .trim()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters')
            .test('meaningful-address', 'Please enter a valid address.', (value) => {
                const v = String(value || '').trim();
                if (!v) return true;
                if (!/[A-Za-z0-9]/.test(v)) return false;
                return /^[A-Za-z0-9\s/\-,.#]+$/.test(v);
            }),
        countryId: Yup.number()
            .required('Country is required'),
        stateId: Yup.number()
            .required('State is required'),
        email: Yup.string()
            .email('Please enter a valid email address.')
            .optional(),
        refBy: Yup.string()
            .test('valid-reference', 'Please enter a valid reference name.', (value) => {
                const v = String(value || '').trim();
                if (!v) return true;
                if (v.length < 2) return false;
                if (!/[A-Za-z0-9]/.test(v)) return false;
                return /^[A-Za-z0-9\s.,'&\-()/#]+$/.test(v);
            })
            .optional()
    });

    const appointmentFormInitialValues = useMemo(() => ({
        patient: prefilledAppointmentPatient,
        doctor: defaultAppointmentDoctor,
        appointmentDate: prefilledAppointmentPatient ? moment().format(DOB_DISPLAY_FORMAT) : '',
        consultMode: 'InClinic',
    }), [prefilledAppointmentPatient, defaultAppointmentDoctor]);

    useEffect(() => {
        if (!modal_newAppointment) return;
        const { doctor, appointmentDate } = appointmentFormInitialValues;
        if (doctor?.value && appointmentDate) {
            loadAppointmentSlotsForForm(doctor.value, appointmentDate);
        }
    }, [modal_newAppointment, appointmentFormInitialValues]);

    const patientInitialValues = {
        patientName: '',
        gender: 0,
        dateOfBirth: '',
        mobileNo: '',
        phoneNo: '',
        address: '',
        countryId: 78, // Default country ID (India)
        stateId: 14, // Default state ID (Maharashtra)
        email: '',
        refBy: '',
        isWhatsAppOptIn: false,
    };

    // Handle appointment form submission
    const handleAppointmentSubmit = async (values, { setSubmitting, resetForm }, selectedSlotTime = null) => {
        console.log("handleAppointmentSubmit called with values:", values);
        const userId = getAuthUserId();

        if (!selectedSlotTime) {
            Swal.fire({
                icon: 'warning',
                title: 'Select a time slot',
                text: 'Please click an available slot to book the appointment.',
                timer: 2200,
                showConfirmButton: false,
            });
            setSubmitting(false);
            return;
        }

        const appointmentDateKey = formatCalendarDateForSchedule(values.appointmentDate) || formatCalendarDateForApi(values.appointmentDate);
        const guardedSlots = applyClientPastSlotGuard([{ time: selectedSlotTime, status: 'available' }], appointmentDateKey);
        if (guardedSlots[0]?.status === 'past') {
            Swal.fire({
                icon: 'warning',
                title: 'Past time slot',
                text: 'This time has already passed. Please choose a current or future slot.',
                timer: 2400,
                showConfirmButton: false,
            });
            setSubmitting(false);
            return;
        }

        if (values.consultMode === 'Tele' && !teleConsultationEnabled) {
            Swal.fire({
                icon: 'error',
                title: 'Teleconsultation Disabled',
                text: 'Teleconsultation is currently disabled. Please enable it in your profile settings or choose In-clinic consultation.',
                timer: 3000,
                showConfirmButton: false,
            });
            setSubmitting(false);
            return;
        }

        let formattedDate = values.appointmentDate;
        if (values.appointmentDate) {
            formattedDate = formatCalendarDateForApi(values.appointmentDate) || values.appointmentDate;
        }

        const followUpEligible =
            values.consultMode !== 'Tele' &&
            isEligibleForFollowUpConsultation(
                values.patient.value,
                formattedDate,
                appointmentList,
                doctorFeeConfig
            );

        const appointmentData = {
            patientAppId: 0,
            patientId: values.patient.value,
            patientName: values.patient.label,
            doctorId: values.doctor.value,
            appointmentDate: formattedDate,
            appointmentTime: selectedSlotTime,
            status: "WAITING",
            deleteStatus: false,
            userId: userId,
            visitType: followUpEligible ? 'FollowUp' : (values.consultMode || 'InClinic'),
            consultMode: values.consultMode || 'InClinic',
            isFollowUpConsultation: followUpEligible,
        };

        console.log("Appointment data: ", appointmentData);
        console.log("Original date:", values.appointmentDate, "Formatted date:", formattedDate);
        console.log("Selected slot time:", selectedSlotTime);

        try {
            await dispatch(patientNewAppointment(appointmentData));
            resetForm();
            setSelectedAppointmentSlotTime(null);

            const now = dashboardQueryDateIso();
            dispatch(getAppointmentList({
                appointmentDate: now,
                status: "",
                userId: userId
            }));
            dispatch(getPatientList({ userId }));
            dispatch(fetchDoctorDashboardCounts({
                appointmentDate: now,
                status: "",
                userId: userId
            }));

            setTimeout(() => {
                dispatch(setAppointmentSuccess(null));
                tog_newAppointment();
            }, 1000);

        } catch (error) {
            console.log("Error creating appointment: ", error);
            Swal.fire({
                icon: 'error',
                title: 'Booking failed',
                text: typeof error === 'string' ? error : (error?.message || 'Unable to book appointment.'),
                timer: 2500,
                showConfirmButton: false,
            });
        } finally {
            setSubmitting(false);
            setBookingSlotTime(null);
        }
    };

    const handleAppointmentSlotClick = (slot) => {
        if (!slot?.time) return;
        setSelectedAppointmentSlotTime(slot.time);
    };

    // Handle patient form submission
    const handlePatientSubmit = async (values, { setSubmitting, resetForm, setFieldError, setFieldTouched }) => {
        console.log("handlePatientSubmit called with values:", values);

        if (isAtOrOverCaseLimit(patientTotalCount, subscriptionCaseLimit)) {
            Swal.fire({
                icon: 'warning',
                title: 'Patient limit reached',
                text: 'Your subscription case limit has been reached. Purchase or upgrade a plan to register more patients.',
                confirmButtonText: 'View plans',
                showCancelButton: true,
                cancelButtonText: 'Close',
            }).then((result) => {
                if (result.isConfirmed) {
                    setModalSubscriptionList(true);
                }
            });
            setSubmitting(false);
            return;
        }

        const normalizedMobile = String(values.mobileNo || '').replace(/\D/g, '');
        const duplicatePatient = (patientList || []).some((row) => {
            const existing = String(row?.mobileNo ?? row?.MobileNo ?? '').replace(/\D/g, '');
            return existing.length >= 10 && existing === normalizedMobile;
        });
        if (duplicatePatient) {
            const message = 'This mobile number is already registered for a patient.';
            if (setFieldError && setFieldTouched) {
                setFieldError('mobileNo', message);
                setFieldTouched('mobileNo', true, false);
            }
            Swal.fire({
                icon: 'warning',
                title: 'Duplicate mobile number',
                text: message,
                timer: 2600,
                showConfirmButton: false,
            });
            setSubmitting(false);
            return;
        }

        const auth = JSON.parse(sessionStorage.getItem('authUser'));
        const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
        const clinicDoctorId = auth?.doctorId || auth?.DoctorId || 0;
        const doctorUserId = auth?.doctorUserId || auth?.DoctorUserId || userId;
        const loggedInUser = doctorUserId;

        const formattedDateOfBirth = formatDateOfBirthForApi(values.dateOfBirth) || values.dateOfBirth;
        const now = new Date();
        const isWhatsAppOptIn = Boolean(values.isWhatsAppOptIn);
        const patientData = {
            loggedInUser: parseInt(loggedInUser, 10) || 0,
            doctorID: parseInt(clinicDoctorId, 10) || 0,
            patientID: 0,
            patientName: values.patientName.trim(),
            address: values.address,
            stateId: values.stateId,
            countryId: values.countryId,
            mobileNo: values.mobileNo,
            phoneNo: values.phoneNo?.trim() || "",
            dateOfBirth: formattedDateOfBirth,
            gender: parseInt(values.gender),
            enteredBy: auth?.userName || auth?.user?.userName || "USER",
            enteredDate: now.toISOString(),
            userId: parseInt(userId),
            deleteStatus: false,
            dateodFirstVisit: now.toISOString(),
            refBy: values.refBy?.trim() || "",
            IsWhatsAppOptIn: isWhatsAppOptIn,
            WhatsAppOptInDate: isWhatsAppOptIn ? now.toISOString() : null,
        };

        console.log("Patient data: ", patientData);

        try {
            const createResponse = await dispatch(createPatient(patientData));
            const patientName = patientData.patientName;
            resetForm();

            const updatedPatientList = await dispatch(getPatientList({ userId }));
            dispatch(fetchDoctorDashboardCounts({
                appointmentDate: dashboardQueryDateIso(),
                status: "",
                userId: userId
            }));
            tog_newPatient();

            const patientOption = resolveCreatedPatientOption(
                createResponse,
                patientName,
                updatedPatientList || patientList
            );

            const bookingChoice = await Swal.fire({
                title: 'Patient registered successfully!',
                text: 'Would you like to book an appointment for this patient?',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Book Appointment',
                cancelButtonText: 'Not Now',
                confirmButtonColor: '#0ab39c',
                cancelButtonColor: '#6c757d',
            });

            if (bookingChoice.isConfirmed) {
                openNewAppointmentModal(patientOption);
            }

            dispatch(setPatientSuccess(null));

        } catch (error) {
            console.log("Error creating patient: ", error);
            const backendFieldErrors =
                error && typeof error === "object" ? error.fieldErrors || {} : {};
            const backendKeys = Object.keys(backendFieldErrors);
            if (backendKeys.length > 0 && setFieldError && setFieldTouched) {
                backendKeys.forEach((field) => {
                    setFieldError(field, backendFieldErrors[field]);
                    setFieldTouched(field, true, false);
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Buy button click - Payment flow
    const handleOnBuyClick = async (variant) => {
        if (subscriptionCheckoutActive) return;
        console.log(variant);
        setSelectedPackage(variant);
        selectedPackageRef.current = variant;
        setSubscriptionCheckoutActive(true);

        try {
            // Generate order ID
            const result = await dispatch(generateOrderId({
                amount: variant.amount,
                currency: "INR",
                // Razorpay caps receipt at 40 characters.
                receipt: `pkg_${variant.packageId ?? 0}_${doctorList?.[0]?.doctorID ?? 0}_${Date.now()}`.slice(0, 40),
                paymentCapture: 1
            }));

            console.log('result.orderId == ', result.orderId);

            if (result?.orderId !== undefined) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                script.onload = () => {
                    const doctor = doctorList?.[0] || {};
                    const authInfo = getLoggedinUserInfo() || {};
                    const authFullName = [authInfo.firstName || authInfo.FirstName, authInfo.lastName || authInfo.LastName]
                        .filter(Boolean)
                        .join(" ");
                    const razorpay = new window.Razorpay({
                        key: 'rzp_live_WSDlLVrcCPFbEQ',
                        amount: variant.amount * 100,
                        name: 'Homeo Centrum',
                        description: `Doctor subscription: ${variant.packageName || 'package'}`,
                        order_id: result?.orderId,
                        handler: handlePaymentSuccess,
                        modal: {
                            ondismiss: () => {
                                setSubscriptionCheckoutActive(false);
                            },
                        },
                        prefill: {
                            name: doctor.doctorName || authFullName || authInfo.userName || authInfo.UserName || '',
                            email: doctor.emailId || doctor.email || authInfo.email || authInfo.emailId || authInfo.EmailId || '',
                            contact: doctor.mobileNo || doctor.mobile || authInfo.mobileNo || authInfo.MobileNo || authInfo.phoneNumber || '',
                        },
                        notes: {
                            address: 'NIGA HOMEOPATHY, Bagechiwadi,B6 Ramkali, Sangram Nagar Malshiras Road Akluj.'
                        },
                        theme: {
                            color: '#012652'
                        }
                    });
                    razorpayInstanceRef.current = razorpay;
                    razorpay.open();
                };
                document.body.appendChild(script);
            } else {
                setSubscriptionCheckoutActive(false);
            }
        } catch (error) {
            console.error('Error generating order:', error);
            setSubscriptionCheckoutActive(false);
        }
    };

    // Handle payment success
    const handlePaymentSuccess = async (paymentResponse) => {
        setSubscriptionCheckoutActive(true);
        const pkg = selectedPackageRef.current;
        console.log('obj == ', {
            packageDetailId: 0,
            packageId: pkg.packageId,
            doctorId: doctorList[0].doctorID,
            activationDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss.SSS'),
            orderId: paymentResponse.razorpay_order_id,
            transactionId: paymentResponse.razorpay_signature,
            paymentId: paymentResponse.razorpay_payment_id,
        });
        const obj = JSON.parse(sessionStorage.getItem("authUser"));
        try {
            const result = await dispatch(saveUpdateSubscription({
                packageDetailId: 0,
                packageId: pkg.packageId,
                doctorId: doctorList[0].doctorID,
                activationDate: moment(new Date()).utc().format('YYYY-MM-DD[T]HH:mm:ss.SSS[Z]'),
                orderId: paymentResponse.razorpay_order_id,
                transactionId: paymentResponse.razorpay_signature,
                paymentId: paymentResponse.razorpay_payment_id,
                subscriptionModel: "",
                isActive: true
            }));

            await dispatch(refreshAuthSubscriptionStatus());
            console.log("result payment==", result);
            try {
                const auth = JSON.parse(sessionStorage.getItem('authUser'));
                const subscriptionData = auth?.data || auth;
                if (readPlanActive(subscriptionData)) {
                    sessionStorage.setItem(SUBSCRIPTION_JUST_ACTIVATED_KEY, '1');
                    setModalSubscriptionList(false);
                }
            } catch {
                setModalSubscriptionList(false);
            }
        } catch (error) {
            console.error('Error saving subscription:', error);
        } finally {
            setSubscriptionCheckoutActive(false);
        }

        console.log('handlePaymentSuccess == ', paymentResponse);
    };

    // Patient List modal
    const [modal_patientList, setModalPatientList] = useState(false);
    function tog_patientList() {
        setModalPatientList(!modal_patientList);
    }

    // Appointment List modal
    const [modal_appointmentList, setModalAppointmentList] = useState(false);
    function tog_appointmentList() {
        setModalAppointmentList(!modal_appointmentList);
    }

    // Billing List modal
    const [modal_billingList, setModalBillingList] = useState(false);
    function tog_billingList() {
        setModalBillingList(!modal_billingList);
    }

    // Subscription (Purchase Plan) modal
    const [modal_subscriptionList, setModalSubscriptionList] = useState(false);
    function tog_subscriptionList() {
        setModalSubscriptionList(!modal_subscriptionList);
    }

    // Subscription Expiration Warning modal
    const [modal_subscriptionExpiration, setModalSubscriptionExpiration] = useState(false);
    const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState(0);
    function tog_subscriptionExpiration() {
        setModalSubscriptionExpiration(!modal_subscriptionExpiration);
    }

    // Check if subscription modal should be non-closeable
    const isSubscriptionModalNonCloseable = (() => {
        if (subscriptionCheckoutActive) return true;
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            const subscriptionData = {
                ...(auth?.data || auth || {}),
                ...(loginUser && typeof loginUser === 'object' ? loginUser : {}),
            };
            return !readPlanActive(subscriptionData);
        } catch {
            return false;
        }
    })();



    // Not Arrived modal: search + pagination state and real data
    const [notArrivedSearch, setNotArrivedSearch] = useState("");
    const [notArrivedPage, setNotArrivedPage] = useState(1);
    const notArrivedPageSize = 10;

    // Filter appointments by status = "Not Arrived" or "NOT ARRIVED" and search term
    const notArrivedFiltered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "Not Arrived" and "NOT ARRIVED")
        if (!statusMatches(appointment.status, 'Not Arrived') && !statusMatches(appointment.status, 'NOT ARRIVED')) {
            return false;
        }

        // Then filter by search term
        const needle = notArrivedSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

    const notArrivedTotalPages = Math.max(1, Math.ceil(notArrivedFiltered.length / notArrivedPageSize));
    const notArrivedSafePage = Math.min(notArrivedPage, notArrivedTotalPages);
    const notArrivedStartIndex = (notArrivedSafePage - 1) * notArrivedPageSize;
    const notArrivedPageItems = notArrivedFiltered.slice(notArrivedStartIndex, notArrivedStartIndex + notArrivedPageSize);

    // E-Consult modal: search + pagination state and real data
    const [econsultSearch, setEconsultSearch] = useState("");
    const [econsultPage, setEconsultPage] = useState(1);
    const econsultPageSize = 10;

    // Filter appointments by telemedicine consult mode and search term
    const econsultFiltered = appointmentList.filter((appointment) => {
        // Show all telemedicine appointments (consultMode === 'Tele') regardless of status
        // This ensures the Tele Queue list matches the teleQueueCount badge count
        const isTelemedicine =
            appointment?.consultMode === "Tele" ||
            appointment?.ConsultMode === "Tele" ||
            appointment?.consult_mode === "Tele" ||
            appointment?.ConsultMode === "tele" ||
            appointment?.consultMode === "tele" ||
            statusMatches(appointment.status, "E-Consult") ||
            statusMatches(appointment.status, "E-CONSULT");
        if (!isTelemedicine) return false;

        const needle = econsultSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || "").toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || "").toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || "").toString().includes(needle)
        );
    });
    const econsultTotalCount = appointmentList.filter(isTeleConsultationAppointment).length;

    const econsultTotalPages = Math.max(1, Math.ceil(econsultFiltered.length / econsultPageSize));
    const econsultSafePage = Math.min(econsultPage, econsultTotalPages);
    const econsultStartIndex = (econsultSafePage - 1) * econsultPageSize;
    const econsultPageItems = econsultFiltered.slice(econsultStartIndex, econsultStartIndex + econsultPageSize);

    // Remaining modal: search + pagination state and real data
    const [remainingSearch, setRemainingSearch] = useState("");
    const [remainingPage, setRemainingPage] = useState(1);
    const remainingPageSize = 10;

    // Filter appointments by status = "Remaining" or "REMAINING" and search term
    const remainingFiltered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "Remaining" and "REMAINING")
        if (!statusMatches(appointment.status, 'Remaining') && !statusMatches(appointment.status, 'REMAINING')) {
            return false;
        }

        // Then filter by search term
        const needle = remainingSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

    const remainingTotalPages = Math.max(1, Math.ceil(remainingFiltered.length / remainingPageSize));
    const remainingSafePage = Math.min(remainingPage, remainingTotalPages);
    const remainingStartIndex = (remainingSafePage - 1) * remainingPageSize;
    const remainingPageItems = remainingFiltered.slice(remainingStartIndex, remainingStartIndex + remainingPageSize);

    // Completed modal: search + pagination state and real data
    const [completedSearch, setCompletedSearch] = useState("");
    const [completedPage, setCompletedPage] = useState(1);
    const completedPageSize = 10;

    // Filter appointments by status = "Completed" or "COMPLETED" and search term
    const completedFiltered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "Completed" and "COMPLETED")
        if (!statusMatches(appointment.status, 'Completed') && !statusMatches(appointment.status, 'COMPLETED')) {
            return false;
        }

        // Then filter by search term
        const needle = completedSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

    const completedTotalPages = Math.max(1, Math.ceil(completedFiltered.length / completedPageSize));
    const completedSafePage = Math.min(completedPage, completedTotalPages);
    const completedStartIndex = (completedSafePage - 1) * completedPageSize;
    const completedPageItems = completedFiltered.slice(completedStartIndex, completedStartIndex + completedPageSize);

    const todayAppointmentCount = Array.isArray(appointmentList) ? appointmentList.length : 0;
    const cancelledCount = appointmentList.filter((apt) =>
        statusMatches(apt.status, 'Cancelled') || statusMatches(apt.status, 'CANCELLED')
    ).length;

    const [cancelledSearch, setCancelledSearch] = useState("");
    const [cancelledPage, setCancelledPage] = useState(1);
    const cancelledPageSize = 10;
    const cancelledFiltered = appointmentList.filter((appointment) => {
        if (!statusMatches(appointment.status, 'Cancelled') && !statusMatches(appointment.status, 'CANCELLED')) {
            return false;
        }
        const needle = cancelledSearch.trim().toLowerCase();
        if (!needle) return true;
        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });
    const cancelledTotalPages = Math.max(1, Math.ceil(cancelledFiltered.length / cancelledPageSize));
    const cancelledSafePage = Math.min(cancelledPage, cancelledTotalPages);
    const cancelledStartIndex = (cancelledSafePage - 1) * cancelledPageSize;
    const cancelledPageItems = cancelledFiltered.slice(cancelledStartIndex, cancelledStartIndex + cancelledPageSize);

    return (

        <>
            <div className="row doctor-dashboard-kpi-row">
                {[
                    { key: 'waiting', label: 'Waiting', value: counts?.patientAppWaiting ?? 0, icon: 'ri-time-line', onOpen: tog_waiting },
                    { key: 'walkin', label: 'Walk-in', value: counts?.patientAppWalkIn ?? 0, icon: 'ri-run-fill', onOpen: tog_walkin },
                    { key: 'notarrived', label: 'Not Arrived', value: counts?.patientAppNotArrived ?? 0, icon: 'ri-user-unfollow-line', onOpen: tog_notarrived },
                    { key: 'remaining', label: 'Remaining', value: counts?.patientAppRemaining ?? 0, icon: 'ri-group-line', onOpen: tog_remaining },
                    { key: 'completed', label: 'Completed', value: counts?.patientAppComplated ?? 0, icon: 'ri-checkbox-circle-line', onOpen: tog_completed },
                    { key: 'cancelled', label: 'Cancelled', value: cancelledCount, icon: 'ri-close-circle-line', onOpen: tog_cancelled },
                    { key: 'slots', label: 'App. Slots', value: todaySlotCount == null ? '\u2026' : todaySlotCount, icon: 'ri-grid-line', onOpen: openTodaySlotsSetup },
                    { key: 'telequeue', label: 'Tele Queue', value: counts?.teleQueueCount ?? counts?.TeleQueueCount ?? counts?.patientAppEConsult ?? 0, icon: 'ri-vidicon-line', onOpen: tog_econsult },
                    { key: 'unpaid', label: 'Unpaid', value: counts?.unpaidCount ?? counts?.UnpaidCount ?? 0, icon: 'ri-wallet-3-line', onOpen: tog_billingList },
                    { key: 'tele', label: 'Tele Consult', value: counts?.teleQueueCount ?? counts?.TeleQueueCount ?? counts?.patientAppEConsult ?? 0, icon: 'ri-customer-service-2-line', onOpen: () => navigate('/doctor/tele-consultation') },
                    { key: 'earnings', label: 'Earnings', value: formatIndianRupeeAmount(earningsTotal), icon: 'ri-hand-coin-line', onOpen: () => navigate('/doctor/earnings') },
                    { key: 'support', label: 'Help Support', value: supportOpenCount, icon: 'ri-question-answer-line', onOpen: () => navigate('/doctor/support') },
                ].map((item) => (
                    <div
                        className="col-6 col-md-4 col-lg-2"
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        title={item.label}
                        onClick={() => item.onOpen()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                item.onOpen();
                            }
                        }}
                    >
                        <div className="card-animate card mb-0 h-100 admin-kpi-card doctor-kpi-card">
                            <div className="card-body d-flex align-items-center justify-content-between">
                                <div className="min-w-0">
                                    <p className="text-uppercase fw-bold text-truncate mb-0 doctor-kpi-label">{item.label}</p>
                                    <div className="d-flex align-items-center gap-2 doctor-kpi-card__foot">
                                        <h4 className="doctor-kpi-count mb-0">{item.value}</h4>
                                        <button
                                            type="button"
                                            className="doctor-kpi-view"
                                            title="View"
                                            aria-label={`View ${item.label}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                item.onOpen();
                                            }}
                                        >
                                            <i className="ri-eye-line" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                                <i className={`${item.icon} kpi-tile-icon`} aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row mb-2 doctor-dashboard-action-row">
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <Button
                                        type="button"
                                        color="primary"
                                        outline
                                        size="sm"
                                        className="doctor-dashboard-create-new-btn text-truncate mb-0"
                                        onClick={(e) => {
                                            openNewAppointmentModal(null);
                                            e.currentTarget.blur();
                                        }}
                                    >
                                        <i className="ri-calendar-event-line me-1 align-middle" />
                                        Create New Appointment
                                    </Button>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <span className="fs-14 mb-0 d-inline-block dashboard-today-count-label doctor-dashboard-card-metric doctor-action-metric-pill">
                                        Today's : {todayAppointmentCount}
                                    </span>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-2 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Appointment</span></span>
                                    </h4>
                                    <button type="button" className="doctor-kpi-view" title="View" aria-label="View appointments" onClick={() => setModalAppointmentList(true)}>
                                        <i className="ri-eye-line" aria-hidden="true" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="doctor-action-icon-btn"
                                    title="Doctor Schedule Calendar"
                                    aria-label="Open doctor schedule calendar"
                                    onClick={dispatchOpenDoctorScheduleCalendar}
                                >
                                    <i className="ri-calendar-event-line kpi-tile-icon" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <Button
                                        type="button"
                                        color="primary"
                                        outline
                                        size="sm"
                                        className="doctor-dashboard-create-new-btn text-truncate mb-0"
                                        onClick={(e) => {
                                            tog_newPatient();
                                            e.currentTarget.blur();
                                        }}
                                    >
                                        <i className="ri-user-add-line me-1 align-middle" />
                                        Create New Patient
                                    </Button>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <h5 className="fs-14 mb-0 text-info doctor-dashboard-card-metric doctor-action-metric-pill">
                                        Total : {patientListLoading && patientTotalCount === 0 ? '...' : patientTotalCount}
                                    </h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-2 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Patient</span></span>
                                    </h4>
                                    <button type="button" className="doctor-kpi-view" title="View" aria-label="View patients" onClick={() => setModalPatientList(true)}>
                                        <i className="ri-eye-line" aria-hidden="true" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="doctor-action-icon-btn"
                                    title="Create New Patient"
                                    aria-label="Create new patient"
                                    onClick={(e) => {
                                        tog_newPatient();
                                        e.currentTarget.blur();
                                    }}
                                >
                                    <i className="ri-user-add-line kpi-tile-icon" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <p className="text-uppercase fw-semibold text-truncate mb-0 doctor-action-eyebrow">Unpaid</p>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <h5 className="fs-14 mb-0 text-info doctor-dashboard-card-metric doctor-action-metric-pill">
                                        {unpaidConsultationAmount > 0
                                            ? `₹${formatIndianRupeeAmount(unpaidConsultationAmount)}`
                                            : unpaidConsultationCount}
                                    </h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-2 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Consultations</span></span>
                                    </h4>
                                    <button type="button" className="doctor-kpi-view" title="View" aria-label="View consultations" onClick={() => setModalBillingList(true)}>
                                        <i className="ri-eye-line" aria-hidden="true" />
                                    </button>
                                </div>
                                <i className="ri-wallet-3-line kpi-tile-icon" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <Button
                                        type="button"
                                        color="primary"
                                        outline
                                        size="sm"
                                        className="doctor-dashboard-create-new-btn text-truncate mb-0"
                                        onClick={(e) => {
                                            setModalSubscriptionList(true);
                                            e.currentTarget.blur();
                                        }}
                                    >
                                        <i className="ri-vip-crown-line me-1 align-middle" />
                                        Purchase Plan
                                    </Button>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <h5 className={`fs-14 mb-0 doctor-action-status-pill ${getPlanDaysRemainingToneClass(planDaysRemaining)}`}>
                                        {formatPlanDaysRemaining(planDaysRemaining)}
                                    </h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-2 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Subscription</span></span>
                                    </h4>
                                </div>
                                <i className="ri-vip-crown-line kpi-tile-icon" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Waiting Patients Modal with search, pagination, and actions
            - Filters list live as the user types in the search box
            - Shows paginated results with page numbers and prev/next
            - Provides View/Edit/Delete actions per patient row
        */}
            <WaitingPatientsModal isOpen={modal_waiting} toggle={tog_waiting} />
            <PatientListModal isOpen={modal_patientList} toggle={tog_patientList} />
            <AppointmentListModal isOpen={modal_appointmentList} toggle={tog_appointmentList} />
            <BillingListModal
                isOpen={modal_billingList}
                toggle={tog_billingList}
            />
            <SubscriptionExpirationModal
                isOpen={modal_subscriptionExpiration}
                toggle={tog_subscriptionExpiration}
                daysRemaining={subscriptionDaysRemaining}
            />
            <SubscriptionListModal
                isOpen={modal_subscriptionList}
                toggle={tog_subscriptionList}
                handleOnBuyClick={handleOnBuyClick}
                isNonCloseable={isSubscriptionModalNonCloseable}
                purchaseDisabled={subscriptionCheckoutActive}
            />

            <Modal size="xl" id="myModal" isOpen={modal_walkin} toggle={() => { tog_walkin(); }} className="patient-list-modal">
                <ModalHeader id="myModalLabel" className="patient-list-modal__header" toggle={() => { tog_walkin(); }}>
                    <PatientListModalTitle
                        icon="ri-walk-line"
                        title="Walk-in Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={walkinSearch}
                        onChange={(e) => { setWalkinSearch(e.target.value); setWalkinPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading walk-in patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    walkinPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{walkinStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={appointment.status === 'Walk-in' ? 'bg-info' : 'bg-secondary'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {walkinPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={walkinSearch ? 'No walk-in patients found matching your search' : 'No walk-in patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${walkinPageItems.length} of ${walkinFiltered.length} Walk-in Patients ${walkinSearch ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'Walk-in') || statusMatches(apt.status, 'WALK-IN')).length} total walk-in)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'Walk-in') || statusMatches(apt.status, 'WALK-IN')).length} total walk-in)`}`
                            )}
                        </div>
                        {!appointmentListLoading && walkinTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={walkinSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setWalkinPage(Math.max(1, walkinSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={walkinSafePage} totalPages={walkinTotalPages} onPageChange={setWalkinPage} />
                                <PaginationItem disabled={walkinSafePage === walkinTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setWalkinPage(Math.min(walkinTotalPages, walkinSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            {/* New Patient Modal */}
            <Modal
                size="lg"
                centered
                isOpen={modal_newPatient}
                toggle={closeNewPatientModal}
                onClosed={handleNewPatientModalClosed}
                className="patient-list-modal new-patient-modal doctor-new-patient-modal"
            >
                <ModalHeader className="patient-list-modal__header" toggle={closeNewPatientModal}>
                    <PatientListModalTitle
                        icon="ri-user-add-line"
                        title="New Patient"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                </ModalHeader>
                <Formik
                    initialValues={patientInitialValues}
                    validationSchema={patientValidationSchema}
                    onSubmit={(values, formikHelpers) => {
                        console.log("Patient Formik onSubmit triggered!");
                        console.log("Values:", values);
                        console.log("FormikHelpers:", formikHelpers);
                        return handlePatientSubmit(values, formikHelpers);
                    }}
                    validateOnChange={true}
                    validateOnBlur={true}
                    enableReinitialize={true}
                >
                    {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting, resetForm, setSubmitting, submitForm }) => {
                        patientResetFormRef.current = resetForm;

                        return (
                        <>
                            <ModalBody>
                                {(patientSuccess || patientError) && (
                                    <div className="new-patient-modal__alerts">
                                        {patientSuccess ? (
                                            <UncontrolledAlert color="success" className="alert-label-icon label-arrow mb-0">
                                                <i className="ri-notification-off-line label-icon"></i>
                                                {typeof patientSuccess === 'string' ? patientSuccess : 'Patient created successfully!'}
                                            </UncontrolledAlert>
                                        ) : null}
                                        {patientError ? (
                                            <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                                                <i className="ri-error-warning-line label-icon"></i>
                                                {patientError}
                                            </UncontrolledAlert>
                                        ) : null}
                                    </div>
                                )}
                                <Form>
                                <div className="row g-2 new-patient-modal__fields">
                                    <div className="col-md-8 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-user-line" aria-hidden="true" />
                                            Patient Name <span className="text-danger">*</span>
                                        </Label>
                                        <Input
                                            name="patientName"
                                            placeholder="Enter patient name"
                                            value={values.patientName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.patientName && touched.patientName ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.patientName && touched.patientName), errors.patientName)}
                                    </div>
                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-group-line" aria-hidden="true" />
                                            Gender <span className="text-danger">*</span>
                                        </Label>
                                        <div className="new-patient-modal__gender" role="radiogroup" aria-label="Gender">
                                            <label
                                                className={`new-patient-modal__gender-option${values.gender === 0 ? ' is-active' : ''}`}
                                            >
                                                <Input
                                                    name="gender"
                                                    type="radio"
                                                    value="0"
                                                    className="new-patient-modal__gender-input"
                                                    checked={values.gender === 0}
                                                    onChange={(e) => setFieldValue('gender', parseInt(e.target.value))}
                                                />
                                                <span className="new-patient-modal__gender-text">
                                                    <i className="ri-men-line" aria-hidden="true" />
                                                    Male
                                                </span>
                                            </label>
                                            <label
                                                className={`new-patient-modal__gender-option${values.gender === 1 ? ' is-active' : ''}`}
                                            >
                                                <Input
                                                    name="gender"
                                                    type="radio"
                                                    value="1"
                                                    className="new-patient-modal__gender-input"
                                                    checked={values.gender === 1}
                                                    onChange={(e) => setFieldValue('gender', parseInt(e.target.value))}
                                                />
                                                <span className="new-patient-modal__gender-text">
                                                    <i className="ri-women-line" aria-hidden="true" />
                                                    Female
                                                </span>
                                            </label>
                                        </div>
                                        {renderNewPatientFieldError(Boolean(errors.gender && touched.gender), errors.gender)}
                                    </div>

                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-calendar-event-line" aria-hidden="true" />
                                            Date of Birth <span className="text-danger">*</span>
                                        </Label>
                                        <DateOfBirthPicker
                                            name="dateOfBirth"
                                            value={values.dateOfBirth}
                                            className="doctor-modal-date-picker"
                                            hasError={Boolean(errors.dateOfBirth && touched.dateOfBirth)}
                                            placeholder={DOB_INDIAN_DISPLAY_FORMAT}
                                            displayFormat={DOB_INDIAN_DISPLAY_FORMAT}
                                            openOnInputClick
                                            onChange={(dateStr) => {
                                                setFieldTouched('dateOfBirth', true, false);
                                                setFieldValue('dateOfBirth', dateStr, true);
                                            }}
                                            onBlur={() => setFieldTouched('dateOfBirth', true, true)}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.dateOfBirth && touched.dateOfBirth), errors.dateOfBirth)}
                                    </div>
                                    <div className="col-md-8 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-map-pin-line" aria-hidden="true" />
                                            Address <span className="text-danger">*</span>
                                        </Label>
                                        <Input
                                            name="address"
                                            placeholder="Enter address"
                                            value={values.address}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.address && touched.address ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.address && touched.address), errors.address)}
                                    </div>

                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-global-line" aria-hidden="true" />
                                            Country <span className="text-danger">*</span>
                                        </Label>
                                        <div className="search-box">
                                            <Select
                                                name="countryId"
                                                value={countryOptions.find(option => option.value === values.countryId) || null}
                                                onChange={(option) => {
                                                    setFieldValue('countryId', option?.value || null);
                                                    setFieldValue('stateId', null); // Reset state when country changes
                                                    setFieldTouched('countryId', true);
                                                }}
                                                onBlur={() => setFieldTouched('countryId', true)}
                                                options={countryOptions}
                                                placeholder="Select country..."
                                                isSearchable={true}
                                                isClearable={false}
                                                {...doctorModalSelectPortalProps}
                                                styles={getDoctorModalSelectStyles(Boolean(errors.countryId && touched.countryId))}
                                            />
                                            <i className="ri-search-line search-icon" aria-hidden={true} />
                                        </div>
                                        {renderNewPatientFieldError(Boolean(errors.countryId && touched.countryId), errors.countryId)}
                                    </div>
                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-map-2-line" aria-hidden="true" />
                                            State <span className="text-danger">*</span>
                                        </Label>
                                        <div className="search-box">
                                            <Select
                                                name="stateId"
                                                value={getStatesForCountry(values.countryId).find(state => state.stateId === values.stateId) ?
                                                    { value: values.stateId, label: getStatesForCountry(values.countryId).find(state => state.stateId === values.stateId).stateName } : null}
                                                onChange={(option) => {
                                                    setFieldValue('stateId', option?.value || null);
                                                    setFieldTouched('stateId', true);
                                                }}
                                                onBlur={() => setFieldTouched('stateId', true)}
                                                options={getStatesForCountry(values.countryId).map(state => ({
                                                    value: state.stateId,
                                                    label: state.stateName
                                                }))}
                                                placeholder="Select state..."
                                                isSearchable={true}
                                                isClearable={false}
                                                isDisabled={!values.countryId}
                                                {...doctorModalSelectPortalProps}
                                                styles={getDoctorModalSelectStyles(Boolean(errors.stateId && touched.stateId))}
                                            />
                                            <i className="ri-search-line search-icon" aria-hidden={true} />
                                        </div>
                                        {renderNewPatientFieldError(Boolean(errors.stateId && touched.stateId), errors.stateId)}
                                    </div>

                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-smartphone-line" aria-hidden="true" />
                                            Mobile No. <span className="text-danger">*</span>
                                        </Label>
                                        <Input
                                            name="mobileNo"
                                            placeholder="Enter mobile number"
                                            value={values.mobileNo}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.mobileNo && touched.mobileNo ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.mobileNo && touched.mobileNo), errors.mobileNo)}
                                    </div>

                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-phone-line" aria-hidden="true" />
                                            Phone No.
                                        </Label>
                                        <Input
                                            name="phoneNo"
                                            placeholder="Enter phone number"
                                            value={values.phoneNo}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.phoneNo && touched.phoneNo ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.phoneNo && touched.phoneNo), errors.phoneNo)}
                                    </div>
                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-mail-line" aria-hidden="true" />
                                            Email
                                        </Label>
                                        <Input
                                            name="email"
                                            type="email"
                                            placeholder="Enter email"
                                            value={values.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.email && touched.email ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.email && touched.email), errors.email)}
                                    </div>
                                    <div className="col-md-4 new-patient-modal__field">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-user-shared-line" aria-hidden="true" />
                                            Refer By
                                        </Label>
                                        <Input
                                            name="refBy"
                                            placeholder="Enter reference"
                                            value={values.refBy}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.refBy && touched.refBy ? 'is-invalid' : ''}
                                        />
                                        {renderNewPatientFieldError(Boolean(errors.refBy && touched.refBy), errors.refBy)}
                                    </div>

                                    <div className="col-12">
                                        <div className="new-patient-modal__consent d-flex align-items-center gap-2 rounded-2 border px-3 py-2">
                                            <Input
                                                id="isWhatsAppOptIn"
                                                name="isWhatsAppOptIn"
                                                type="checkbox"
                                                checked={values.isWhatsAppOptIn}
                                                onChange={(e) => setFieldValue('isWhatsAppOptIn', e.target.checked)}
                                            />
                                            <Label check htmlFor="isWhatsAppOptIn" className="mb-0 new-patient-modal__consent-label">
                                                <i className="ri-whatsapp-line" aria-hidden="true" />
                                                I agree to receive WhatsApp messages from Homeo Centrum.
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                                </Form>
                            </ModalBody>
                            <ModalFooter className="justify-content-end">
                                <ModalActionButton
                                    action="save"
                                    disabled={isSubmitting}
                                    loading={isSubmitting}
                                    loadingLabel="Saving..."
                                    onClick={() => {
                                        submitForm();
                                    }}
                                />
                            </ModalFooter>
                        </>
                        );
                    }}
                </Formik>
            </Modal>

            {/* New Appointment Modal */}
            <Modal
                size="lg"
                centered
                isOpen={modal_newAppointment}
                toggle={closeNewAppointmentModal}
                onClosed={handleNewAppointmentModalClosed}
                className="patient-list-modal new-appointment-modal"
            >
                <ModalHeader className="patient-list-modal__header" toggle={closeNewAppointmentModal}>
                    <PatientListModalTitle
                        icon="ri-calendar-check-line"
                        title="New Appointment"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                </ModalHeader>
                <ModalBody>
                    {appointmentSuccess || appointmentError ? (
                        <div className="new-appointment-modal__alerts">
                            {appointmentSuccess ? (
                                <UncontrolledAlert color="success" className="alert-label-icon label-arrow mb-0">
                                    <i className="ri-notification-off-line label-icon"></i>
                                    {appointmentSuccess}
                                </UncontrolledAlert>
                            ) : null}
                            {appointmentError ? (
                                <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                                    <i className="ri-error-warning-line label-icon"></i>
                                    {appointmentError}
                                </UncontrolledAlert>
                            ) : null}
                        </div>
                    ) : null}
                    <Formik
                        initialValues={appointmentFormInitialValues}
                        onSubmit={(values, formikHelpers) => {
                            setBookingSlotTime(selectedAppointmentSlotTime);
                            return handleAppointmentSubmit(values, formikHelpers, selectedAppointmentSlotTime);
                        }}
                        validateOnChange={false}
                        validateOnBlur={false}
                        enableReinitialize={true}
                    >
                        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting, resetForm, setSubmitting, submitForm }) => {
                            appointmentResetFormRef.current = resetForm;

                            return (
                            <>
                            <Form>
                                <div className="row g-2 new-appointment-form-fields">
                                    <div className="col-md-6">
                                        <Label className="form-label new-appointment-modal__label">
                                            <i className="ri-user-heart-line" aria-hidden="true" />
                                            Patient Name <span className="text-danger">*</span>
                                        </Label>
                                        <div className="search-box new-appointment-modal__field">
                                            <Select
                                                name="patient"
                                                value={values.patient}
                                                onChange={(option) => {
                                                    setFieldValue('patient', option);
                                                    setFieldTouched('patient', true);
                                                }}
                                                onBlur={() => setFieldTouched('patient', true)}
                                                options={patientOptions}
                                                placeholder="Search and select patient..."
                                                isSearchable={true}
                                                isClearable={true}
                                                components={{ MenuList: PatientSelectMenuList }}
                                                onCreateNewPatient={handleCreatePatientFromAppointment}
                                                {...doctorModalSelectPortalProps}
                                                styles={getDoctorModalSelectStyles(Boolean(errors.patient && touched.patient))}
                                            />
                                            <i className="ri-search-line search-icon" aria-hidden={true} />
                                        </div>
                                        {errors.patient && touched.patient && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.patient}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <Label className="form-label new-appointment-modal__label">
                                            <i className="ri-stethoscope-line" aria-hidden="true" />
                                            Doctor Name <span className="text-danger">*</span>
                                        </Label>
                                        <div className="search-box new-appointment-modal__field">
                                            <Select
                                                name="doctor"
                                                value={values.doctor}
                                                onChange={(option) => {
                                                    setFieldValue('doctor', option);
                                                    setFieldTouched('doctor', true);
                                                    setSelectedAppointmentSlotTime(null);
                                                    loadAppointmentSlotsForForm(option?.value, values.appointmentDate);
                                                }}
                                                onBlur={() => setFieldTouched('doctor', true)}
                                                options={doctorOptions}
                                                placeholder="Search and select doctor..."
                                                isSearchable={true}
                                                isClearable={doctorOptions.length > 1}
                                                {...doctorModalSelectPortalProps}
                                                styles={getDoctorModalSelectStyles(Boolean(errors.doctor && touched.doctor))}
                                            />
                                            <i className="ri-search-line search-icon" aria-hidden={true} />
                                        </div>
                                        {errors.doctor && touched.doctor && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.doctor}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <Label className="form-label new-appointment-modal__label">
                                            <i className="ri-calendar-event-line" aria-hidden="true" />
                                            Appointment Date <span className="text-danger">*</span>
                                        </Label>
                                        <DateOfBirthPicker
                                            name="appointmentDate"
                                            value={values.appointmentDate}
                                            className="doctor-modal-date-picker new-appointment-modal__field"
                                            minDate="today"
                                            maxDate={null}
                                            hideIcon
                                            hasError={Boolean(errors.appointmentDate && touched.appointmentDate)}
                                            placeholder={APPOINTMENT_INDIAN_DISPLAY_FORMAT}
                                            displayFormat={APPOINTMENT_INDIAN_DISPLAY_FORMAT}
                                            openOnInputClick
                                            onChange={(dateStr) => {
                                                setFieldTouched('appointmentDate', true, false);
                                                setFieldValue('appointmentDate', dateStr, true);
                                                setSelectedAppointmentSlotTime(null);
                                                const parsed = moment(dateStr, [APPOINTMENT_INDIAN_DISPLAY_FORMAT, 'D/M/YYYY', DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
                                                if (parsed.isValid()) {
                                                    loadAppointmentSlotsForForm(values.doctor?.value, parsed.format('YYYY-MM-DD'));
                                                }
                                            }}
                                            onBlur={() => setFieldTouched('appointmentDate', true, true)}
                                        />
                                        {errors.appointmentDate && touched.appointmentDate && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.appointmentDate}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <Label className="form-label new-appointment-modal__label">
                                            <i className="ri-stethoscope-line" aria-hidden="true" />
                                            Consult mode
                                        </Label>
                                        <Input
                                            type="select"
                                            className="new-appointment-modal__field"
                                            value={values.consultMode || 'InClinic'}
                                            onChange={(event) => setFieldValue('consultMode', event.target.value)}
                                        >
                                            <option value="InClinic">In-clinic</option>
                                            <option value="Tele" disabled={!teleConsultationEnabled}>
                                                {teleConsultationEnabled ? 'Tele' : 'Tele (disabled)'}
                                            </option>
                                        </Input>
                                    </div>
                                    <div className="col-md-6">
                                        <Label className="form-label new-appointment-modal__label">
                                            <i className="ri-timer-line" aria-hidden="true" />
                                            Slot Interval
                                        </Label>
                                        <div className="new-appointment-modal__interval">
                                            <Input
                                                readOnly
                                                disabled
                                                className="appointment-slot-interval-display"
                                                value={
                                                    hasAppointmentSchedule && appointmentSlotInterval
                                                        ? formatSlotIntervalLabel(appointmentSlotInterval)
                                                        : 'Not configured'
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="new-appointment-modal__slots">
                                            <div className="new-appointment-modal__slots-header">
                                                <Label className="form-label mb-0 new-appointment-modal__label">
                                                    <i className="ri-grid-line" aria-hidden="true" />
                                                    Appointment Time Slots <span className="text-danger">*</span>
                                                </Label>
                                            </div>
                                            {!values.doctor?.value || !values.appointmentDate ? (
                                                <div className="new-appointment-modal__empty">
                                                    <span className="new-appointment-modal__empty-icon" aria-hidden="true">
                                                        <i className="ri-calendar-2-line" />
                                                    </span>
                                                    <div>
                                                        <div className="new-appointment-modal__empty-title">Slots waiting</div>
                                                        <div className="text-muted">Select doctor and appointment date to view available slots.</div>
                                                    </div>
                                                </div>
                                            ) : !hasAppointmentSchedule ? (
                                                <div className="new-appointment-modal__setup border rounded p-3">
                                                    <div className="d-flex align-items-start gap-2 mb-2">
                                                        <i className="ri-settings-3-line new-appointment-modal__setup-icon" aria-hidden="true" />
                                                        <p className="text-muted mb-0">No slot schedule exists for this date.</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="new-appointment-modal__setup-btn"
                                                        disabled={appointmentSlotsLoading}
                                                        onClick={() => openScheduleSetupModal(
                                                            values.doctor.value,
                                                            values.appointmentDate,
                                                            false,
                                                            'appointment'
                                                        )}
                                                    >
                                                        <i className="ri-add-circle-line me-1" aria-hidden="true" />
                                                        Set up slots for this date
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="appointment-slot-panel">
                                                    <AppointmentSlotGrid
                                                        slots={appointmentSlots}
                                                        loading={appointmentSlotsLoading || Boolean(bookingSlotTime)}
                                                        selectedTime={selectedAppointmentSlotTime}
                                                        onSlotClick={handleAppointmentSlotClick}
                                                        emptyMessage="No slots configured for the selected date."
                                                        showSummaryBar
                                                    />
                                                    {selectedAppointmentSlotTime ? (
                                                        <div className="text-muted small mt-2">
                                                            Selected slot: <strong>{selectedAppointmentSlotTime}</strong>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                            <div className="new-appointment-modal__hint">
                                                <i className="ri-cursor-line" aria-hidden="true" />
                                                Select an available slot, then click Save to book the appointment.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                            <ModalFooter className="justify-content-end">
                                <ModalActionButton
                                    action="cancel"
                                    onClick={closeNewAppointmentModal}
                                    disabled={isSubmitting || Boolean(bookingSlotTime)}
                                />
                                <ModalActionButton
                                    action="save"
                                    disabled={isSubmitting || Boolean(bookingSlotTime) || !selectedAppointmentSlotTime}
                                    loading={isSubmitting || Boolean(bookingSlotTime)}
                                    loadingLabel="Booking..."
                                    onClick={() => {
                                        if (!values.patient || !values.doctor || !values.appointmentDate) {
                                            Swal.fire({
                                                icon: 'warning',
                                                title: 'Complete required fields',
                                                text: 'Please select patient, doctor, and appointment date first.',
                                                timer: 2200,
                                                showConfirmButton: false,
                                            });
                                            return;
                                        }
                                        if (!selectedAppointmentSlotTime) {
                                            Swal.fire({
                                                icon: 'warning',
                                                title: 'Select a time slot',
                                                text: 'Please click an available slot, then Save.',
                                                timer: 2200,
                                                showConfirmButton: false,
                                            });
                                            return;
                                        }
                                        submitForm();
                                    }}
                                />
                            </ModalFooter>
                            </>
                            );
                        }}
                    </Formik>
                </ModalBody>
            </Modal>

            <Modal size="xl" id="myModal" isOpen={modal_notarrived} toggle={() => { tog_notarrived(); }} className="patient-list-modal">
                <ModalHeader id="myModalLabel" className="patient-list-modal__header" toggle={() => { tog_notarrived(); }}>
                    <PatientListModalTitle
                        icon="ri-user-unfollow-line"
                        title="Not Arrived Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={notArrivedSearch}
                        onChange={(e) => { setNotArrivedSearch(e.target.value); setNotArrivedPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading not arrived patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    notArrivedPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{notArrivedStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={appointment.status === 'Not Arrived' ? 'bg-danger' : 'bg-secondary'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {notArrivedPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={notArrivedSearch ? 'No not arrived patients found matching your search' : 'No not arrived patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${notArrivedPageItems.length} of ${notArrivedFiltered.length} Not Arrived Patients ${notArrivedSearch ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'Not Arrived') || statusMatches(apt.status, 'NOT ARRIVED')).length} total not arrived)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'Not Arrived') || statusMatches(apt.status, 'NOT ARRIVED')).length} total not arrived)`}`
                            )}
                        </div>
                        {!appointmentListLoading && notArrivedTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={notArrivedSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setNotArrivedPage(Math.max(1, notArrivedSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={notArrivedSafePage} totalPages={notArrivedTotalPages} onPageChange={setNotArrivedPage} />
                                <PaginationItem disabled={notArrivedSafePage === notArrivedTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setNotArrivedPage(Math.min(notArrivedTotalPages, notArrivedSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" id="myModal" isOpen={modal_econsult} toggle={() => { tog_econsult(); }} className="patient-list-modal">
                <ModalHeader id="myModalLabel" className="patient-list-modal__header" toggle={() => { tog_econsult(); }}>
                    <PatientListModalTitle
                        icon="ri-vidicon-line"
                        title="Tele Consultation Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={econsultSearch}
                        onChange={(e) => { setEconsultSearch(e.target.value); setEconsultPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading tele consultation patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    econsultPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{econsultStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={getPatientListStatusBadgeClass(appointment.status)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {econsultPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={econsultSearch ? 'No tele consultation patients found matching your search' : 'No tele consultation patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${econsultPageItems.length} of ${econsultFiltered.length} Tele Consultation Patients ${econsultSearch ? `(filtered from ${econsultTotalCount} total tele consultation)` : `(from ${econsultTotalCount} total tele consultation)`}`
                            )}
                        </div>
                        {!appointmentListLoading && econsultTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={econsultSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setEconsultPage(Math.max(1, econsultSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={econsultSafePage} totalPages={econsultTotalPages} onPageChange={setEconsultPage} />
                                <PaginationItem disabled={econsultSafePage === econsultTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setEconsultPage(Math.min(econsultTotalPages, econsultSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" id="myModal" isOpen={modal_remaining} toggle={() => { tog_remaining(); }} className="patient-list-modal">
                <ModalHeader id="myModalLabel" className="patient-list-modal__header" toggle={() => { tog_remaining(); }}>
                    <PatientListModalTitle
                        icon="ri-list-check-2"
                        title="Remaining Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={remainingSearch}
                        onChange={(e) => { setRemainingSearch(e.target.value); setRemainingPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading remaining patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    remainingPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{remainingStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={appointment.status === 'Remaining' ? 'bg-warning' : 'bg-secondary'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {remainingPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={remainingSearch ? 'No remaining patients found matching your search' : 'No remaining patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${remainingPageItems.length} of ${remainingFiltered.length} Remaining Patients ${remainingSearch ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'Remaining') || statusMatches(apt.status, 'REMAINING')).length} total remaining)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'Remaining') || statusMatches(apt.status, 'REMAINING')).length} total remaining)`}`
                            )}
                        </div>
                        {!appointmentListLoading && remainingTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={remainingSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setRemainingPage(Math.max(1, remainingSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={remainingSafePage} totalPages={remainingTotalPages} onPageChange={setRemainingPage} />
                                <PaginationItem disabled={remainingSafePage === remainingTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setRemainingPage(Math.min(remainingTotalPages, remainingSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" id="myModal" isOpen={modal_completed} toggle={() => { tog_completed(); }} className="patient-list-modal">
                <ModalHeader id="myModalLabel" className="patient-list-modal__header" toggle={() => { tog_completed(); }}>
                    <PatientListModalTitle
                        icon="ri-checkbox-circle-line"
                        title="Completed Patients"
                        variant="simple"
                        iconColor="#25a0e2"
                    />
                    <PatientListModalHeaderActions
                        value={completedSearch}
                        onChange={(e) => { setCompletedSearch(e.target.value); setCompletedPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading completed patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    completedPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{completedStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={appointment.status === 'Completed' ? 'bg-success' : 'bg-secondary'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {completedPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={completedSearch ? 'No completed patients found matching your search' : 'No completed patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${completedPageItems.length} of ${completedFiltered.length} Completed Patients ${completedSearch ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'Completed') || statusMatches(apt.status, 'COMPLETED')).length} total completed)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'Completed') || statusMatches(apt.status, 'COMPLETED')).length} total completed)`}`
                            )}
                        </div>
                        {!appointmentListLoading && completedTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={completedSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCompletedPage(Math.max(1, completedSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={completedSafePage} totalPages={completedTotalPages} onPageChange={setCompletedPage} />
                                <PaginationItem disabled={completedSafePage === completedTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCompletedPage(Math.min(completedTotalPages, completedSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <Modal size="xl" id="cancelledPatientsModal" isOpen={modal_cancelled} toggle={() => { tog_cancelled(); }} className="patient-list-modal">
                <ModalHeader id="cancelledPatientsModalLabel" className="patient-list-modal__header" toggle={() => { tog_cancelled(); }}>
                    <PatientListModalTitle
                        icon="ri-close-circle-line"
                        title="Cancelled Patients"
                        variant="simple"
                        iconColor="#f06548"
                    />
                    <PatientListModalHeaderActions
                        value={cancelledSearch}
                        onChange={(e) => { setCancelledSearch(e.target.value); setCancelledPage(1); }}
                    />
                </ModalHeader>
                <ModalBody>
                    <div className="table-responsive patient-list-modal__table-wrap">
                        <table className="table mb-0 align-middle patient-list-modal__table">
                            <PatientListTableHead />
                            <tbody>
                                {appointmentListLoading ? (
                                    <tr>
                                        <td colSpan={6} className='text-center text-muted'>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                Loading cancelled patients...
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cancelledPageItems.map((appointment, index) => (
                                        <tr key={appointment.id || index}>
                                            <td className='text-center patient-list-modal__index'>{cancelledStartIndex + index + 1}</td>
                                            <td>
                                                <PatientListNameCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListAgeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListPlaceCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListTimeCell appointment={appointment} />
                                            </td>
                                            <td>
                                                <PatientListStatusBadge
                                                    status={appointment.status}
                                                    badgeClass={getPatientListStatusBadgeClass(appointment.status)}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {cancelledPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={cancelledSearch ? 'No cancelled patients found matching your search' : 'No cancelled patients available'}
                                        />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                        <div className="text-muted patient-list-modal__footer-text">
                            {appointmentListLoading ? (
                                'Loading...'
                            ) : (
                                `Showing ${cancelledPageItems.length} of ${cancelledFiltered.length} Cancelled Patients`
                            )}
                        </div>
                        {!appointmentListLoading && cancelledTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                                <PaginationItem disabled={cancelledSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCancelledPage(Math.max(1, cancelledSafePage - 1)); }} />
                                </PaginationItem>
                                <CompactModalPaginationPages currentPage={cancelledSafePage} totalPages={cancelledTotalPages} onPageChange={setCancelledPage} />
                                <PaginationItem disabled={cancelledSafePage === cancelledTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCancelledPage(Math.min(cancelledTotalPages, cancelledSafePage + 1)); }} />
                                </PaginationItem>
                            </Pagination>
                        )}
                    </div>
                </ModalBody>
            </Modal>

            <DailyScheduleSetupModal
                key={`${scheduleModalDoctorId || 'doctor'}-${scheduleModalDate || 'date'}`}
                isOpen={dailyScheduleModalOpen}
                doctorId={scheduleModalDoctorId}
                scheduleDate={scheduleModalDate}
                requireSave={requireDailyScheduleSave}
                onClose={() => {
                    if (!requireDailyScheduleSave) {
                        setDailyScheduleModalOpen(false);
                        setScheduleModalContext(null);
                    }
                }}
                onSaved={() => {
                    setDailyScheduleModalOpen(false);
                    if (modal_newAppointment && scheduleModalDoctorId && scheduleModalDate) {
                        loadAppointmentSlotsForForm(scheduleModalDoctorId, scheduleModalDate);
                    }
                    if (scheduleModalContext === 'dashboard') {
                        (async () => {
                            try {
                                await updateAvailabilityMe({ isOnline: true });
                                refreshDashboardCounts();
                                loadTodaySlotCount();
                            } catch (err) {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Availability update failed',
                                    text: typeof err === 'string' ? err : err?.message || 'Slots saved, but online status could not be updated',
                                });
                            } finally {
                                setScheduleModalContext(null);
                            }
                        })();
                    }
                }}
            />

        </>




    );
};

export default Widgets;
