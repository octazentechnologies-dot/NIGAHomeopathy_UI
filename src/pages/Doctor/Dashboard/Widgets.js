import React, { useEffect, useMemo, useRef } from 'react';
import CountUp from "react-countup";
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, ModalFooter, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Pagination, PaginationItem, PaginationLink, Label, Form, FormGroup, UncontrolledAlert } from 'reactstrap';
import Swal from 'sweetalert2';
import AppointmentSlotGrid from '../../../Components/Common/AppointmentSlotGrid';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import DailyScheduleSetupModal from '../../../Components/Common/DailyScheduleSetupModal';
import Select from "react-select";
import moment from 'moment';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { ecomWidgets } from "../../../common/data";
import { useDispatch, useSelector } from 'react-redux';
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
import img3 from "../../../assets/images/small/img-3.jpg";
import {
    buildPatientApiPayload,
    formatCalendarDateForApi,
    formatDateOfBirthForApi,
    getPatientEmailForEdit,
} from '../../../helpers/patient_payload_helper';
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from '../../../Components/Common/DateOfBirthPicker';
import {
    buildPatientSelectOption,
    DOCTOR_DASHBOARD_OPEN_NEW_APPOINTMENT_EVENT,
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
} from '../../../helpers/appointmentSlotHelper';
import {
    getAppointmentSlots,
    getDailySchedule,
} from '../../../helpers/realbackend_helper';
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
                    style={{ color: iconColor || '#25a0e2', fontSize: 20 }}
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

const PatientListModalSearch = ({ value, onChange, placeholder = 'Search...' }) => (
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
const PatientListModalHeaderActions = ({ value, onChange, placeholder }) => (
    <div className="patient-list-modal__header-actions">
        <PatientListModalSearch value={value} onChange={onChange} placeholder={placeholder} />
    </div>
);

const PatientListTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-user-heart-line" aria-hidden="true" />Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-cake-2-line" aria-hidden="true" />Age/Sex</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-map-pin-line" aria-hidden="true" />Place</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-calendar-event-line" aria-hidden="true" />Appointment Time</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-flag-line" aria-hidden="true" />Status</span>
            </th>
        </tr>
    </thead>
);

const PatientListNameCell = ({ appointment }) => (
    <div className="d-flex align-items-center patient-list-modal__name">
        <div className="flex-shrink-0 me-2">
            <img
                src={appointment.avatar || img3}
                alt=""
                className="avatar-xxs rounded-circle patient-list-modal__avatar"
            />
        </div>
        <div className="flex-grow-1 patient-list-modal__name-text">{appointment.patientName || 'N/A'}</div>
    </div>
);

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

const PatientListStatusBadge = ({ status, badgeClass }) => (
    <span className={`badge patient-list-modal__status ${badgeClass || 'bg-secondary'}`}>
        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
        {status || 'N/A'}
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
    return 'bg-secondary';
};

const AppointmentListTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-user-heart-line" aria-hidden="true" />Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-phone-line" aria-hidden="true" />Mobile Number</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-calendar-line" aria-hidden="true" />Date</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-time-line" aria-hidden="true" />Time</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-flag-line" aria-hidden="true" />Status</span>
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
                <span className="patient-list-modal__th"><i className="ri-user-heart-line" aria-hidden="true" />Patient Name</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-phone-line" aria-hidden="true" />Mobile Number</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-map-pin-line" aria-hidden="true" />Address</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-user-line" aria-hidden="true" />Gender</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-calendar-line" aria-hidden="true" />Date</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-cake-2-line" aria-hidden="true" />Date of Birth</span>
            </th>
            <th scope="col" className="text-center">
                <span className="patient-list-modal__th"><i className="ri-settings-3-line" aria-hidden="true" />Action</span>
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
    if (normalized === 'success') return 'bg-success';
    if (normalized === 'failed') return 'bg-danger';
    return 'bg-secondary';
};

const BillingListTableHead = () => (
    <thead>
        <tr>
            <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>#</th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-money-rupee-circle-line" aria-hidden="true" />Bill Amount</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-calendar-line" aria-hidden="true" />Bill Date</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-bank-card-line" aria-hidden="true" />Transaction Type</span>
            </th>
            <th scope="col">
                <span className="patient-list-modal__th"><i className="ri-flag-line" aria-hidden="true" />Transaction Status</span>
            </th>
        </tr>
    </thead>
);

const BillingListAmountCell = ({ amount }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-money-rupee-circle-line" aria-hidden="true" />
        {amount ?? 'N/A'}
    </span>
);

const BillingListDateCell = ({ date }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-calendar-line" aria-hidden="true" />
        {date || 'N/A'}
    </span>
);

const BillingListTypeCell = ({ type }) => (
    <span className="patient-list-modal__meta">
        <i className="ri-bank-card-line" aria-hidden="true" />
        {type || 'N/A'}
    </span>
);

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
                        <Pagination className="pagination-separated mb-0">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const page = i + 1;
                                return (
                                    <PaginationItem active={page === safePage} key={page}>
                                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                                    </PaginationItem>
                                );
                            })}
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
    return parsed.isValid() ? parsed.format(DASHBOARD_DATE_DISPLAY_FORMAT) : '';
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
                appointmentDate: new Date().toISOString(),
                status: '',
                userId,
            }));
        }
        setSearchTerm("");
        setCurrentPage(1);
    }, [isOpen, dispatch]);

    const filtered = patientList.filter((patient) => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;

        const patientName = patient.patientName?.toLowerCase() || '';
        const mobileNo = patient.mobileNo?.toString() || '';
        const address = patient.address?.toLowerCase() || '';

        return (
            patientName.includes(needle) ||
            mobileNo.includes(needle) ||
            address.includes(needle)
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
            const now = new Date().toISOString();
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
                                                        value={patient.enteredDate && moment(new Date(patient.enteredDate)).isValid()
                                                            ? moment(patient.enteredDate).format('DD-MM-YYYY')
                                                            : '-'}
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
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={safePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === safePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
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
                    <div className="row g-3 new-patient-modal__fields">
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
                            <Input type="date" value={editForm.dob} onChange={(e) => updateEditField('dob', e.target.value)} />
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
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList) || [];
    const appointmentListLoading = useSelector((state) => state?.DoctorDashboard?.appointmentListLoading);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Filter appointments based on search term
    const filtered = appointmentList.filter((appointment) => {
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
                />
            </ModalHeader>
            <ModalBody>
                <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table">
                        <AppointmentListTableHead />
                        <tbody>
                            {appointmentListLoading ? (
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
                                            </td>
                                        </tr>
                                    ))}
                                    {pageItems.length === 0 && !appointmentListLoading && (
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
                        {appointmentListLoading ? (
                            'Loading...'
                        ) : (
                            `Showing ${pageItems.length} of ${filtered.length} Appointments ${searchTerm ? `(filtered from ${appointmentList.length} total)` : `(from ${appointmentList.length} total)`}`
                        )}
                    </div>
                    {!appointmentListLoading && totalPages > 1 && (
                        <Pagination className="pagination-separated mb-0">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const page = i + 1;
                                return (
                                    <PaginationItem active={page === safePage} key={page}>
                                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                                    </PaginationItem>
                                );
                            })}
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

// Billing List modal with search and pagination (14 rows shown by default)
const BillingListModal = ({ isOpen, toggle }) => {
    const allBills = Array.from({ length: 32 }).map((_, index) => ({
        id: index + 1,
        amount: index % 2 === 0 ? 5500 : 3200,
        date: index % 2 === 0 ? "21/07/2024" : "22/07/2024",
        type: index % 3 === 0 ? "Cash" : "Online",
        status: index % 5 === 0 ? "Failed" : "Success",
    }));

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 14;

    const filtered = allBills.filter((b) => {
        const needle = searchTerm.trim().toLowerCase();
        if (!needle) return true;
        return (
            String(b.id).includes(needle) ||
            String(b.amount).includes(needle) ||
            b.date.toLowerCase().includes(needle) ||
            b.type.toLowerCase().includes(needle) ||
            b.status.toLowerCase().includes(needle)
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

    return (
        <Modal size="xl" id="billingListModal" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
            <ModalHeader id="billingListModalLabel" className="patient-list-modal__header" toggle={toggle}>
                <PatientListModalTitle
                    icon="ri-bill-line"
                    title="Billing Details"
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
                        <BillingListTableHead />
                        <tbody>
                            {pageItems.map((bill, index) => (
                                <tr key={bill.id}>
                                    <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                                    <td>
                                        <BillingListAmountCell amount={bill.amount} />
                                    </td>
                                    <td>
                                        <BillingListDateCell date={bill.date} />
                                    </td>
                                    <td>
                                        <BillingListTypeCell type={bill.type} />
                                    </td>
                                    <td>
                                        <PatientListStatusBadge
                                            status={bill.status}
                                            badgeClass={getBillingStatusBadgeClass(bill.status)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {pageItems.length === 0 && (
                                <tr>
                                    <PatientListEmptyCell
                                        colSpan={5}
                                        message={searchTerm ? 'No billing records found matching your search' : 'No billing records available'}
                                    />
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                        {`Showing ${pageItems.length} of ${filtered.length} Billing Records ${searchTerm ? `(filtered from ${allBills.length} total)` : `(from ${allBills.length} total)`}`}
                    </div>
                    {totalPages > 1 && (
                        <Pagination className="pagination-separated mb-0">
                            <PaginationItem disabled={safePage === 1}>
                                <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCurrentPage(Math.max(1, safePage - 1)); }} />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => {
                                const page = i + 1;
                                return (
                                    <PaginationItem active={page === safePage} key={page}>
                                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>{page}</PaginationLink>
                                    </PaginationItem>
                                );
                            })}
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
    gap: 1rem;
    padding: 0.75rem 0.5rem 1.25rem;
  }
  @media (max-width: 767px) {
    .subscription-plan-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 479px) {
    .subscription-plan-row { grid-template-columns: 1fr; }
  }
  .subscription-plan-card {
    width: 100%;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
    transition: transform 0.3s ease;
    animation: subscriptionPlanCardIn 0.5s ease backwards;
  }
  .subscription-plan-card:hover {
    transform: translateY(-8px) scale(1.02);
  }
  .subscription-plan-card:nth-child(1) { animation-delay: 0.05s; }
  .subscription-plan-card:nth-child(2) { animation-delay: 0.1s; }
  .subscription-plan-card:nth-child(3) { animation-delay: 0.15s; }
  .subscription-plan-card:nth-child(4) { animation-delay: 0.2s; }
  .subscription-plan-card:nth-child(5) { animation-delay: 0.25s; }
  .subscription-plan-card:nth-child(6) { animation-delay: 0.3s; }
  @keyframes subscriptionPlanCardIn {
    from { opacity: 0; transform: translateY(20px) scale(0.94); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .subscription-plan-card__body {
    flex: 1 1 auto;
    padding: 1.25rem 1rem;
    min-height: 200px;
    border-radius: 5px 5px 0 0;
  }
  .subscription-plan-card__icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  .subscription-plan-card__footer {
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 0 0 5px 5px;
    min-height: 52px;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: filter 0.2s ease, background-color 0.2s ease;
  }
  .subscription-plan-card__footer:hover {
    filter: brightness(1.08);
  }
  .subscription-plan-card__footer:active {
    filter: brightness(0.95);
  }
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
const SubscriptionListModal = ({ isOpen, toggle, handleOnBuyClick, isNonCloseable = false }) => {
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
                                const theme = PLAN_CARD_THEMES[index % PLAN_CARD_THEMES.length];
                                const planIcon = getPlanIcon(pkg, index);
                                return (
                                    <div key={pkg.packageId} className="subscription-plan-card">
                                        <div
                                            className="subscription-plan-card__body text-white d-flex flex-column"
                                            style={{ backgroundColor: theme.top }}
                                        >
                                            <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                                                <h5 className="text-white fw-bold mb-0 flex-grow-1">{pkg.packageName}</h5>
                                                <span className="subscription-plan-card__icon" aria-hidden="true">
                                                    <i className={planIcon} />
                                                </span>
                                            </div>
                                            <p className="mb-2 fs-4 fw-semibold">{formatPlanAmount(pkg.amount)}</p>
                                            <p className="mb-1 opacity-90 d-flex align-items-center gap-1">
                                                <i className="ri-briefcase-line" /> {pkg.caseCount} Cases
                                            </p>
                                            <p className="mb-0 opacity-90 d-flex align-items-center gap-1">
                                                <i className="ri-time-line" /> {pkg.validityInDays} Days
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="subscription-plan-card__footer btn text-white w-100"
                                            style={{ backgroundColor: theme.bottom }}
                                            onClick={() => handleOnBuyClick(pkg)}
                                        >
                                            Buy Now {'>'}
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

const Widgets = () => {
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
    const appointmentListLoading = useSelector((state) => state?.DoctorDashboard?.appointmentListLoading);
    const orderSuccess = useSelector((state) => state?.DoctorDashboard?.orderSuccess);
    const subscriptionSuccess = useSelector((state) => state?.DoctorDashboard?.subscriptionSuccess);
    const subscriptionError = useSelector((state) => state?.DoctorDashboard?.subscriptionError);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const razorpayInstanceRef = useRef(null);
    const selectedPackageRef = useRef(null);

    const patientTotalCount = useMemo(
        () => getDoctorPatientTotalCount(patientList, counts),
        [patientList, counts]
    );

    useEffect(() => {
        const auth = JSON.parse(sessionStorage.getItem('authUser'));
        const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
        const now = new Date();
        dispatch(fetchDoctorDashboardCounts({
            appointmentDate: now.toISOString(),
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
            appointmentDate: now.toISOString(),
            status: "",
            userId: userId
        }));
        dispatch(getCountries());
        dispatch(getStates());
        dispatch(getPackages());
    }, [dispatch]);

    // Check subscription status and show appropriate modals
    useEffect(() => {
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            // Handle both response.data structure and direct data structure
            const subscriptionData = auth?.data || auth;

            if (!subscriptionData) return;

            const isPlanActive = subscriptionData.isPlanActive;
            const islastFiveDays = subscriptionData.islastFiveDays;
            const daysRemaining = subscriptionData.daysRemaining || 0;

            // If plan is not active, show Purchase Plan list (non-closeable)
            if (isPlanActive === false) {
                setModalSubscriptionList(true);
                return;
            }

            // If in last 5 days and days remaining > 0, show expiration warning (daily)
            if (islastFiveDays === true && daysRemaining > 0) {
                // Check if we've shown the popup today using localStorage
                const today = new Date().toDateString();
                const lastShownDate = localStorage.getItem('subscriptionExpirationWarningDate');
                const lastDaysRemaining = localStorage.getItem('subscriptionDaysRemaining');

                // Show popup if not shown today or if days remaining changed
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
    }, []);

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
    const [bookingSlotTime, setBookingSlotTime] = useState(null);
    const [dailyScheduleModalOpen, setDailyScheduleModalOpen] = useState(false);
    const [scheduleModalDoctorId, setScheduleModalDoctorId] = useState(null);
    const [scheduleModalDate, setScheduleModalDate] = useState(null);
    const [requireDailyScheduleSave, setRequireDailyScheduleSave] = useState(false);
    const appointmentSlotsRequestRef = useRef(0);
    const appointmentResetFormRef = useRef(null);

    const closeNewAppointmentModal = () => {
        tog_newAppointment();
    };

    const handleNewAppointmentModalClosed = () => {
        clearCreateNewButtonFocus();
        appointmentResetFormRef.current?.();
    };

    const openNewAppointmentModal = (patientOption = null) => {
        setPrefilledAppointmentPatient(patientOption);
        setModalNewAppointment(true);
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
            setAppointmentSlots(normalized.slots);
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

    const openScheduleSetupModal = (doctorId, scheduleDate, requireSave = false) => {
        const normalizedDate = formatCalendarDateForSchedule(scheduleDate) || formatApiDate(scheduleDate);
        setScheduleModalDoctorId(doctorId);
        setScheduleModalDate(normalizedDate || scheduleDate);
        setRequireDailyScheduleSave(requireSave);
        setDailyScheduleModalOpen(true);
    };

    useEffect(() => {
        const doctorId = getAuthDoctorId();
        if (!doctorId) return undefined;

        let isMounted = true;
        (async () => {
            try {
                const schedule = await getDailySchedule({
                    doctorId,
                    scheduleDate: moment().format('YYYY-MM-DD'),
                });
                if (!isMounted || schedule) return;
                openScheduleSetupModal(doctorId, moment().format('YYYY-MM-DD'), true);
            } catch (error) {
                console.error('Failed to check daily schedule:', error);
            }
        })();

        return () => {
            isMounted = false;
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

    // Form options for dropdowns
    const patientOptions = patientList?.map((patient) => ({
        value: patient.patientID,
        label: patient.patientName
    })) || [];

    const doctorOptions = doctorList?.map((doctor) => ({
        value: doctor.doctorID,
        label: doctor.doctorName
    })) || [];

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
            .test('valid-date', `Please enter a valid date (${DOB_DISPLAY_FORMAT})`, (value) => {
                if (!value) return false;
                return moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true).isValid();
            })
            .test('not-past', 'Appointment date cannot be in the past', (value) => {
                const parsed = moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true);
                return parsed.isValid() && parsed.isSameOrAfter(moment(), 'day');
            }),
    });

    // Patient validation schema
    const patientValidationSchema = Yup.object().shape({
        firstName: Yup.string()
            .required('First name is required')
            .min(2, 'First name must be at least 2 characters'),
        lastName: Yup.string()
            .required('Last name is required')
            .min(2, 'Last name must be at least 2 characters'),
        gender: Yup.number()
            .required('Gender is required')
            .oneOf([0, 1], 'Please select a valid gender'),
        dateOfBirth: Yup.string()
            .required('Date of birth is required')
            .test('valid-dob', `Please enter a valid date (${DOB_DISPLAY_FORMAT})`, (value) => {
                if (!value) return false;
                return moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true).isValid();
            })
            .test('not-future', 'Date of birth cannot be in the future', (value) => {
                const parsed = moment(value, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', DASHBOARD_DATE_DISPLAY_FORMAT, 'D-M-YYYY', 'YYYY-MM-DD'], true);
                return parsed.isValid() && parsed.isSameOrBefore(moment(), 'day');
            }),
        mobileNo: Yup.string()
            .required('Mobile number is required')
            .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
        address: Yup.string()
            .required('Address is required')
            .min(5, 'Address must be at least 5 characters'),
        countryId: Yup.number()
            .required('Country is required'),
        stateId: Yup.number()
            .required('State is required'),
        email: Yup.string()
            .email('Invalid email format')
            .optional(),
        refBy: Yup.string()
            .optional()
    });

    const appointmentFormInitialValues = useMemo(() => ({
        patient: prefilledAppointmentPatient,
        doctor: null,
        appointmentDate: prefilledAppointmentPatient ? moment().format(DOB_DISPLAY_FORMAT) : '',
    }), [prefilledAppointmentPatient]);

    const patientInitialValues = {
        firstName: '',
        lastName: '',
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

        let formattedDate = values.appointmentDate;
        if (values.appointmentDate) {
            formattedDate = formatCalendarDateForApi(values.appointmentDate) || values.appointmentDate;
        }

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
        };

        console.log("Appointment data: ", appointmentData);
        console.log("Original date:", values.appointmentDate, "Formatted date:", formattedDate);
        console.log("Selected slot time:", selectedSlotTime);

        try {
            await dispatch(patientNewAppointment(appointmentData));
            resetForm();

            const now = new Date().toISOString();
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

    const handleAppointmentSlotClick = async (slot, values, formikHelpers) => {
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

        setBookingSlotTime(slot.time);
        formikHelpers.setSubmitting(true);
        try {
            await handleAppointmentSubmit(values, formikHelpers, slot.time);
        } finally {
            formikHelpers.setSubmitting(false);
        }
    };

    // Handle patient form submission
    const handlePatientSubmit = async (values, { setSubmitting, resetForm }) => {
        console.log("handlePatientSubmit called with values:", values);
        const auth = JSON.parse(sessionStorage.getItem('authUser'));
        const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;
        const loggedInUser = auth?.userId || auth?.user?.userId || auth?.user?.id;

        const formattedDateOfBirth = formatDateOfBirthForApi(values.dateOfBirth) || values.dateOfBirth;
        const now = new Date();
        const isWhatsAppOptIn = Boolean(values.isWhatsAppOptIn);
        const patientData = {
            loggedInUser: parseInt(loggedInUser),
            patientID: 0,
            patientName: `${values.firstName} ${values.lastName}`.trim(),
            address: values.address,
            stateId: values.stateId,
            countryId: values.countryId,
            mobileNo: values.mobileNo,
            phoneNo: values.phoneNo || "string",
            dateOfBirth: formattedDateOfBirth,
            gender: parseInt(values.gender),
            enteredBy: auth?.userName || auth?.user?.userName || "USER",
            enteredDate: now.toISOString(),
            userId: parseInt(userId),
            deleteStatus: false,
            dateodFirstVisit: now.toISOString(),
            refBy: values.refBy || "string",
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
                appointmentDate: now.toISOString(),
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
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Buy button click - Payment flow
    const handleOnBuyClick = async (variant) => {
        console.log(variant);
        setSelectedPackage(variant);
        selectedPackageRef.current = variant;

        try {
            // Generate order ID
            const result = await dispatch(generateOrderId({
                amount: variant.amount,
                currency: "INR",
                receipt: "order_rcptid_11",
                paymentCapture: 1
            }));

            console.log('result.orderId == ', result.orderId);

            if (result?.orderId !== undefined) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                script.onload = () => {
                    // Initialize Razorpay
                    const razorpay = new window.Razorpay({
                        key: 'rzp_live_WSDlLVrcCPFbEQ',
                        amount: variant.amount * 100,
                        name: 'Homeo Centrum',
                        description: 'Payment For Doctor Subscription',
                        order_id: result?.orderId,
                        handler: handlePaymentSuccess,
                        prefill: {
                            name: localStorage.getItem("UserName"),
                            email: 'nigahomeocentrum@gmail.com',
                            contact: '9730596019'
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
            }
        } catch (error) {
            console.error('Error generating order:', error);
        }
    };

    // Handle payment success
    const handlePaymentSuccess = async (paymentResponse) => {
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
            setModalSubscriptionList(false);
        } catch (error) {
            console.error('Error saving subscription:', error);
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
        try {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            // Handle both response.data structure and direct data structure
            const subscriptionData = auth?.data || auth;
            return subscriptionData?.isPlanActive === false;
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

    // Filter appointments by status = "E-Consult" or "E-CONSULT" and search term
    const econsultFiltered = appointmentList.filter((appointment) => {
        // First filter by status (handle both "E-Consult" and "E-CONSULT")
        if (!statusMatches(appointment.status, 'E-Consult') && !statusMatches(appointment.status, 'E-CONSULT')) {
            return false;
        }

        // Then filter by search term
        const needle = econsultSearch.trim().toLowerCase();
        if (!needle) return true;

        const ageSex = getAgeSexDisplay(appointment.dateOfBirth, appointment.gender);
        return (
            (appointment.patientName || '').toLowerCase().includes(needle) ||
            (appointment.address || appointment.place || '').toLowerCase().includes(needle) ||
            ageSex.toLowerCase().includes(needle) ||
            (appointment.mobileNo || '').toString().includes(needle)
        );
    });

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

    return (

        <>
            <div className="row doctor-dashboard-kpi-row">
                <div className="col-lg-2" onClick={() => tog_waiting()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_waiting(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="ri-traffic-light-line fs-24"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppWaiting ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">WAITING</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2" onClick={() => tog_walkin()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_walkin(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="ri-run-fill fs-24"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppWalkIn ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">WALK-IN</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2" onClick={() => tog_notarrived()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_notarrived(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="mdi mdi-account-remove fs-24"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppNotArrived ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">NOT ARRIVED</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2" onClick={() => tog_econsult()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_econsult(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="ri-customer-service-2-line fs-24"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppEConsult ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">E-CONSULT</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2" onClick={() => tog_remaining()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_remaining(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="mdi mdi-account-group fs-24"></i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppRemaining ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">REMAINING</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-2" onClick={() => tog_completed()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog_completed(); } }}>
                    <div className="card-animate card mb-2 doctor-kpi-card">
                        <div className="card-body d-flex gap-3 align-items-center">
                            <div className="avatar-sm">
                                <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
                                    <i className="ri-checkbox-circle-line icon-dual-info fs-20" />
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fs-15 doctor-kpi-count">{counts?.patientAppComplated ?? 0}</h5>
                                <p className="mb-0 text-muted doctor-kpi-label">COMPLETED</p>
                            </div>
                        </div>
                    </div>
                </div>
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
                                        <i className="mdi mdi-calendar-clock me-1 align-middle" />
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
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-4 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Appointment</span></span>
                                    </h4>
                                    <a className="doctor-dashboard-action-link text-decoration-none" href="#" onClick={(e) => { e.preventDefault(); setModalAppointmentList(true); }}>View All</a>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title rounded fs-3 bg-info-subtle doctor-action-icon"><i className="mdi mdi-calendar-clock"></i></span>
                                </div>
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
                                        <i className="mdi mdi-account-plus me-1 align-middle" />
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
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-4 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Patient</span></span>
                                    </h4>
                                    <a className="doctor-dashboard-action-link text-decoration-none me-3" href="#" onClick={(e) => { e.preventDefault(); setModalPatientList(true); }}>View All</a>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title rounded fs-3 bg-info-subtle doctor-action-icon"><i className="mdi mdi-account-plus"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <p className="text-uppercase fw-semibold text-truncate mb-0 doctor-action-eyebrow">Your</p>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <h5 className="fs-14 mb-0 text-success doctor-action-status-pill"> No Dues</h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-4 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Billings</span></span>
                                    </h4>
                                    <a className="doctor-dashboard-action-link text-decoration-none" href="#" onClick={(e) => { e.preventDefault(); setModalBillingList(true); }}>See Details</a>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title rounded fs-3 bg-info-subtle doctor-action-icon"><i className="text-info bx bx-dollar-circle"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-3">
                    <div className="card-animate card mb-2 doctor-action-card">
                        <div className="card-body doctor-action-card__body">
                            <div className="d-flex align-items-center doctor-action-card__top">
                                <div className="flex-grow-1 overflow-hidden doctor-action-card__top-start">
                                    <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 doctor-action-eyebrow">My Plan</p>
                                </div>
                                <div className="flex-shrink-0 doctor-action-card__top-end">
                                    <h5 className={`fs-14 mb-0 doctor-action-status-pill ${getPlanDaysRemainingToneClass(planDaysRemaining)}`}>
                                        {formatPlanDaysRemaining(planDaysRemaining)}
                                    </h5>
                                </div>
                            </div>
                            <div className="d-flex align-items-end justify-content-between doctor-action-card__bottom">
                                <div className="doctor-action-card__copy">
                                    <h4 className="fs-20 fw-semibold ff-secondary mb-4 doctor-action-title">
                                        <span className="counter-value" data-target="559.25"><span>Subscription</span></span>
                                    </h4>
                                    <a className="doctor-dashboard-action-link text-decoration-none" href="#" onClick={(e) => { e.preventDefault(); setModalSubscriptionList(true); }}>Purchase Plan</a>
                                </div>
                                <div className="avatar-sm flex-shrink-0">
                                    <span className="avatar-title rounded fs-3 bg-info-subtle doctor-action-icon"><i className="text-info bx bx-wallet"></i></span>
                                </div>
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
            <BillingListModal isOpen={modal_billingList} toggle={tog_billingList} />
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
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={walkinSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setWalkinPage(Math.max(1, walkinSafePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: walkinTotalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === walkinSafePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setWalkinPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
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
                size="xl"
                isOpen={modal_newPatient}
                toggle={closeNewPatientModal}
                onClosed={handleNewPatientModalClosed}
                className="patient-list-modal new-patient-modal"
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
                                <div className="p-2">
                                    {patientSuccess ? (
                                        <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                                            <i className="ri-notification-off-line label-icon"></i>
                                            {typeof patientSuccess === 'string' ? patientSuccess : 'Patient created successfully!'}
                                        </UncontrolledAlert>
                                    ) : null}
                                    {patientError ? (
                                        <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                                            <i className="ri-error-warning-line label-icon"></i>
                                            {patientError}
                                        </UncontrolledAlert>
                                    ) : null}
                                </div>
                                <Form>
                                <div className="row g-3 new-patient-modal__fields">
                                    <div className="col-md-4">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-user-line" aria-hidden="true" />
                                            First Name <span className="text-danger">*</span>
                                        </Label>
                                        <Input
                                            name="firstName"
                                            placeholder="Enter first name"
                                            value={values.firstName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.firstName && touched.firstName ? 'is-invalid' : ''}
                                        />
                                        {errors.firstName && touched.firstName && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.firstName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-user-3-line" aria-hidden="true" />
                                            Last Name <span className="text-danger">*</span>
                                        </Label>
                                        <Input
                                            name="lastName"
                                            placeholder="Enter last name"
                                            value={values.lastName}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={errors.lastName && touched.lastName ? 'is-invalid' : ''}
                                        />
                                        {errors.lastName && touched.lastName && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.lastName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-4">
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
                                        {errors.gender && touched.gender && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.gender}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-calendar-event-line" aria-hidden="true" />
                                            Date of Birth <span className="text-danger">*</span>
                                        </Label>
                                        <DateOfBirthPicker
                                            name="dateOfBirth"
                                            value={values.dateOfBirth}
                                            className="doctor-modal-date-picker"
                                            hasError={Boolean(errors.dateOfBirth && touched.dateOfBirth)}
                                            placeholder={DOB_DISPLAY_FORMAT}
                                            onChange={(dateStr) => {
                                                setFieldValue('dateOfBirth', dateStr, true);
                                                setFieldTouched('dateOfBirth', true, false);
                                            }}
                                            onBlur={() => setFieldTouched('dateOfBirth', true, true)}
                                        />
                                        {errors.dateOfBirth && touched.dateOfBirth && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.dateOfBirth}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-8">
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
                                        {errors.address && touched.address && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.address}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6">
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
                                        {errors.countryId && touched.countryId && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.countryId}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
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
                                        {errors.stateId && touched.stateId && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.stateId}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-4">
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
                                        {errors.mobileNo && touched.mobileNo && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.mobileNo}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-4">
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
                                        />
                                    </div>
                                    <div className="col-md-4">
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
                                        {errors.email && touched.email && (
                                            <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6">
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
                                        />
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
                size="xl"
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
                    <div className="p-2">
                        {appointmentSuccess ? (
                            <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                                <i className="ri-notification-off-line label-icon"></i>
                                {appointmentSuccess}
                            </UncontrolledAlert>
                        ) : null}
                        {appointmentError ? (
                            <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                                <i className="ri-error-warning-line label-icon"></i>
                                {appointmentError}
                            </UncontrolledAlert>
                        ) : null}
                    </div>
                    <Formik
                        initialValues={appointmentFormInitialValues}
                        onSubmit={(values, formikHelpers) => {
                            console.log("Formik onSubmit triggered!");
                            console.log("Values:", values);
                            console.log("FormikHelpers:", formikHelpers);
                            return handleAppointmentSubmit(values, formikHelpers);
                        }}
                        validateOnChange={false}
                        validateOnBlur={false}
                        enableReinitialize={true}
                    >
                        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched, isSubmitting, resetForm, setSubmitting, submitForm }) => {
                            appointmentResetFormRef.current = resetForm;

                            return (
                            <Form>
                                <div className="row g-3 new-appointment-form-fields">
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
                                                    loadAppointmentSlotsForForm(option?.value, values.appointmentDate);
                                                }}
                                                onBlur={() => setFieldTouched('doctor', true)}
                                                options={doctorOptions}
                                                placeholder="Search and select doctor..."
                                                isSearchable={true}
                                                isClearable={true}
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
                                            hasError={Boolean(errors.appointmentDate && touched.appointmentDate)}
                                            placeholder={DOB_DISPLAY_FORMAT}
                                            onChange={(dateStr) => {
                                                setFieldValue('appointmentDate', dateStr, true);
                                                setFieldTouched('appointmentDate', true, false);
                                                loadAppointmentSlotsForForm(values.doctor?.value, dateStr);
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
                                            <i className="ri-timer-line" aria-hidden="true" />
                                            Slot Interval
                                        </Label>
                                        <div className="new-appointment-modal__interval">
                                            <i className="ri-time-line new-appointment-modal__interval-icon" aria-hidden="true" />
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
                                                            false
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
                                                        onSlotClick={(slot) => handleAppointmentSlotClick(slot, values, {
                                                            setSubmitting,
                                                            resetForm,
                                                        })}
                                                        emptyMessage="No slots configured for the selected date."
                                                        showSummaryBar
                                                    />
                                                </div>
                                            )}
                                            <div className="new-appointment-modal__hint">
                                                <i className="ri-cursor-line" aria-hidden="true" />
                                                Click an available slot to book the appointment instantly.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Form>
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
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={notArrivedSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setNotArrivedPage(Math.max(1, notArrivedSafePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: notArrivedTotalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === notArrivedSafePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setNotArrivedPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
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
                        title="E-Consult Patients"
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
                                                Loading e-consult patients...
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
                                                    badgeClass={appointment.status === 'E-Consult' ? 'bg-purple' : 'bg-secondary'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {econsultPageItems.length === 0 && !appointmentListLoading && (
                                    <tr>
                                        <PatientListEmptyCell
                                            message={econsultSearch ? 'No e-consult patients found matching your search' : 'No e-consult patients available'}
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
                                `Showing ${econsultPageItems.length} of ${econsultFiltered.length} E-Consult Patients ${econsultSearch ? `(filtered from ${appointmentList.filter(apt => statusMatches(apt.status, 'E-Consult') || statusMatches(apt.status, 'E-CONSULT')).length} total e-consult)` : `(from ${appointmentList.filter(apt => statusMatches(apt.status, 'E-Consult') || statusMatches(apt.status, 'E-CONSULT')).length} total e-consult)`}`
                            )}
                        </div>
                        {!appointmentListLoading && econsultTotalPages > 1 && (
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={econsultSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setEconsultPage(Math.max(1, econsultSafePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: econsultTotalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === econsultSafePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setEconsultPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
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
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={remainingSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setRemainingPage(Math.max(1, remainingSafePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: remainingTotalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === remainingSafePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setRemainingPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
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
                            <Pagination className="pagination-separated mb-0">
                                <PaginationItem disabled={completedSafePage === 1}>
                                    <PaginationLink href="#" previous onClick={(e) => { e.preventDefault(); setCompletedPage(Math.max(1, completedSafePage - 1)); }} />
                                </PaginationItem>
                                {Array.from({ length: completedTotalPages }).map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem active={page === completedSafePage} key={page}>
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCompletedPage(page); }}>{page}</PaginationLink>
                                        </PaginationItem>
                                    );
                                })}
                                <PaginationItem disabled={completedSafePage === completedTotalPages}>
                                    <PaginationLink href="#" next onClick={(e) => { e.preventDefault(); setCompletedPage(Math.min(completedTotalPages, completedSafePage + 1)); }} />
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
                    }
                }}
                onSaved={() => {
                    setDailyScheduleModalOpen(false);
                    if (modal_newAppointment && scheduleModalDoctorId && scheduleModalDate) {
                        loadAppointmentSlotsForForm(scheduleModalDoctorId, scheduleModalDate);
                    }
                }}
            />

        </>




    );
};

export default Widgets;