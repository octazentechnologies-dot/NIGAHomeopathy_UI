import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown, Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Accordion, AccordionItem, Collapse, Nav, NavItem, NavLink, TabContent, TabPane, UncontrolledTooltip, Container, Row, Label } from 'reactstrap';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Swal from 'sweetalert2';
import { bestSellingProducts } from "../../../common/data";
import classnames from "classnames";
import moment from 'moment';
import { UserRole, resolveUserRole } from '../../../Components/constants/roles';
import { useProfile } from '../../../Components/Hooks/UserHooks';
import { dispatchOpenNewAppointmentModal, getUserRoleFromAuthStorage } from '../../../helpers/dashboard_helper';
import {
    buildPatientBoardPath,
    buildPatientBoardAudioPath,
    buildPatientBoardKeyFromPatient,
    canOpenPatientSession,
    showPatientSessionLimitAlert,
} from '../../../helpers/patientBoardSessionHelper';
import CaseTakingModeModal from '../../../Components/CaseTaking/CaseTakingModeModal';
import {
    getAppointmentList,
    getPatientList,
    getAppointmentHistoryNotes,
    saveUpdateAppointmentHistoryNote,
    updateAppointmentStatus,
    fetchDoctorDashboardCounts,
    createPatient,
    deletePatient,
} from '../../../slices/doctor/dashboard/thunk';
import { buildPatientApiPayload, getPatientAuthContext, getPatientEmailForEdit } from '../../../helpers/patient_payload_helper';
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from '../../../Components/Common/DateOfBirthPicker';
import AppointmentSlotGrid from '../../../Components/Common/AppointmentSlotGrid';
import DailyScheduleSetupModal from '../../../Components/Common/DailyScheduleSetupModal';
import {
  normalizeAppointmentSlotsResponse,
  formatSlotIntervalLabel,
} from '../../../helpers/appointmentSlotHelper';
import {
    getAppointmentListByPatientId,
    getPrescriptionDetailsByAppointmentId,
    updateAppointmentTime,
    getAppointmentSlots,
    exportPatients,
    downloadPatientImportTemplate,
    importPatients,
} from '../../../helpers/realbackend_helper';
import {
    extractApiList,
    extractPrescriptionResultObject,
    getPatientIdFromRow,
    formatAppointmentAccordionTitle,
    buildPrescriptionTableModel,
} from '../../../helpers/patient_history_helper';
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import {
    setAppointmentLoading, setAppointmentError, setAppointmentSuccess,
    setPatientListLoading, setPatientList, setPatientListError,
    setDoctorListLoading, setDoctorList, setDoctorListError,
    setCountLoading, setCounts, setCountError,
    setPatientLoading, setPatient, setPatientError, setPatientSuccess
} from "../../../slices/doctor/dashboard/reducer";
import { useDispatch, useSelector } from 'react-redux';
import userAvatarBlue from "../../../assets/images/user-avatar-blue.png";
import img4 from "../../../assets/images/small/img-4.jpg";
import img5 from "../../../assets/images/small/img-5.jpg";
import img6 from "../../../assets/images/small/img-6.jpg";
import img7 from "../../../assets/images/small/img-7.jpg";
import img8 from "../../../assets/images/small/img-8.jpg";

/** Set to true when Add Case Notes action should be enabled again. */
const IS_ADD_CASE_NOTES_ENABLED = false;

const PatientDashboardActionButton = ({
    id,
    icon,
    label,
    btnClass,
    onClick,
    disabled = false,
    tooltip,
    variant = 'edit',
}) => {
    const wrapperClass = variant === 'remove' ? 'remove' : 'edit';
    const itemBtnClass = variant === 'remove' ? 'remove-item-btn' : 'edit-item-btn';

    return (
        <div className={wrapperClass}>
            <button
                type="button"
                id={id}
                className={`btn btn-sm ${btnClass} ${itemBtnClass}`}
                disabled={disabled}
                style={disabled ? { pointerEvents: 'none', opacity: 0.55 } : undefined}
                onClick={onClick}
                aria-label={tooltip || label}
            >
                <i className={icon} />
            </button>
            <UncontrolledTooltip placement="top" target={id}>
                {tooltip || label}
            </UncontrolledTooltip>
        </div>
    );
};

const PatientDashboardActionGroup = ({ children }) => (
    <div className="d-inline-flex gap-2 align-items-center justify-content-center flex-nowrap">
        {children}
    </div>
);

const parseAppointmentTime = (value) => {
    if (value == null || value === '') return null;
    const parsed = moment(
        String(value).trim(),
        [moment.ISO_8601, 'HH:mm:ss', 'HH:mm', 'h:mm:ss A', 'h:mm A', 'hh:mm A', 'hh:mm:ss A'],
        true
    );
    if (parsed.isValid()) return parsed;
    const fallback = moment(String(value).trim(), ['HH:mm:ss', 'HH:mm']);
    return fallback.isValid() ? fallback : null;
};

const formatAppointmentTime = (value) => {
    const parsed = parseAppointmentTime(value);
    if (!parsed) return value == null || value === '' ? '-' : String(value);
    return parsed.format('h:mm A');
};

const toApiDateValue = (dateValue, fallbackDisplayDate) => {
    if (dateValue) {
        const parsed = moment(dateValue);
        if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
    if (fallbackDisplayDate) {
        const parsed = moment(fallbackDisplayDate, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', 'YYYY-MM-DD'], true);
        if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
    }
    return moment().format('YYYY-MM-DD');
};

const getPatientAppIdFromRow = (patient) =>
    patient?.patientAppId ?? patient?.patientAppID ?? patient?.PatientAppId ?? patient?.id ?? null;

const AppointmentTimeCell = ({
    patient,
    appStatus,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onTimeUpdated,
    appointmentDateFallback,
}) => {
    const patientAppId = getPatientAppIdFromRow(patient);
    const doctorId = patient?.doctorId || patient?.doctorID;
    const rawTime = patient?.appointmentTime;
    const appointmentDate = toApiDateValue(patient?.appointmentDate ?? patient?.AppointmentDate, appointmentDateFallback);
    const [displayTime, setDisplayTime] = useState(() => formatAppointmentTime(rawTime));
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(false);
    const [slotInterval, setSlotInterval] = useState(null);
    const [saving, setSaving] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

    useEffect(() => {
        setDisplayTime(formatAppointmentTime(rawTime));
    }, [rawTime]);

    const loadSlots = async () => {
        if (!doctorId || !appointmentDate) {
            setSlots([]);
            setHasSchedule(false);
            setSlotInterval(null);
            return;
        }

        setSlotsLoading(true);
        try {
            const response = await getAppointmentSlots({
                doctorId,
                appointmentDate,
                currentPatientAppId: patientAppId,
            });
            const normalized = normalizeAppointmentSlotsResponse(response);
            setSlots(normalized.slots);
            setHasSchedule(Boolean(normalized.hasSchedule));
            setSlotInterval(normalized.intervalMinutes ?? null);
        } catch (error) {
            console.error('Failed to load appointment slots:', error);
            setSlots([]);
            setHasSchedule(false);
            setSlotInterval(null);
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        if (!isEditing) return;
        loadSlots();
    }, [isEditing, doctorId, appointmentDate, patientAppId]);

    const handleSlotClick = async (slot) => {
        if (!patientAppId || slot.status !== 'available') {
            return;
        }

        setSaving(true);
        try {
            await updateAppointmentTime({
                patientAppId,
                appointmentTime: slot.time,
                appointmentDate,
            });
            setDisplayTime(formatAppointmentTime(slot.time));
            onCancelEdit();
            onTimeUpdated?.();
            Swal.fire({
                title: 'Updated!',
                text: 'Appointment time has been updated.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update appointment time';
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        } finally {
            setSaving(false);
        }
    };

    const editButtonId = `appointment-time-edit-${patientAppId}`;
    const patientName = patient?.name || patient?.patientName || 'Patient';

    return (
        <>
            <div className="appointment-time-cell">
                <span className="appointment-time-value">{displayTime}</span>
                <div className="edit">
                    <button
                        type="button"
                        id={editButtonId}
                        className="btn btn-sm btn-soft-success edit-item-btn"
                        onClick={onStartEdit}
                        aria-label="Edit appointment time"
                    >
                        <i className="ri-pencil-fill" />
                    </button>
                    <UncontrolledTooltip placement="top" target={editButtonId}>
                        Edit appointment time
                    </UncontrolledTooltip>
                </div>
            </div>

            <Modal
                isOpen={isEditing}
                toggle={onCancelEdit}
                centered
                size="lg"
                className="patient-list-modal appointment-time-edit-modal"
                backdrop="static"
            >
                <ModalHeader className="patient-list-modal__header" toggle={onCancelEdit}>
                    <span className="patient-list-modal__title patient-list-modal__title--simple">
                        <i className="ri-time-line" style={{ color: '#25a0e2', fontSize: 20 }} />
                        <span className="patient-list-modal__title-text">Update Appointment Time</span>
                    </span>
                </ModalHeader>
                <ModalBody>
                    <div className="appointment-time-patient-chip mb-3">
                        <i className="ri-user-3-line" aria-hidden="true" />
                        <span>{patientName}</span>
                    </div>
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <Label className="form-label appointment-time-edit-modal__label">
                                <i className="ri-calendar-line" />
                                Appointment Date
                            </Label>
                            <Input readOnly disabled value={appointmentDate || '—'} />
                        </div>
                        <div className="col-md-6">
                            <Label className="form-label appointment-time-edit-modal__label">
                                <i className="ri-timer-line" />
                                Slot Interval
                            </Label>
                            <Input
                                readOnly
                                disabled
                                className="appointment-slot-interval-display"
                                value={
                                    hasSchedule && slotInterval
                                        ? formatSlotIntervalLabel(slotInterval)
                                        : 'Not configured'
                                }
                            />
                        </div>
                    </div>
                    {!doctorId ? (
                        <div className="text-muted">Doctor information is missing for this appointment.</div>
                    ) : !hasSchedule ? (
                        <div className="border rounded p-3 bg-light">
                            <p className="text-muted mb-2">No slot schedule exists for this date.</p>
                            <Button
                                type="button"
                                size="sm"
                                className="new-appointment-modal__setup-btn"
                                onClick={() => setScheduleModalOpen(true)}
                            >
                                Set up slots for this date
                            </Button>
                        </div>
                    ) : (
                        <div className="appointment-slot-panel">
                            <AppointmentSlotGrid
                                slots={slots}
                                loading={slotsLoading || saving}
                                onSlotClick={handleSlotClick}
                                emptyMessage="No slots configured for this date."
                                showSummaryBar
                            />
                        </div>
                    )}
                    <div className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
                        Click an available slot to update the appointment time instantly.
                    </div>
                </ModalBody>
                <ModalFooter>
                    <ModalActionButton action="close" onClick={onCancelEdit} disabled={saving} />
                </ModalFooter>
            </Modal>

            <DailyScheduleSetupModal
                isOpen={scheduleModalOpen}
                doctorId={doctorId}
                scheduleDate={appointmentDate}
                requireSave={false}
                onClose={() => setScheduleModalOpen(false)}
                onSaved={() => {
                    setScheduleModalOpen(false);
                    loadSlots();
                }}
            />
        </>
    );
};

const toDashboardAppointmentDateIso = (displayDateStr) => {
    const parsed = moment(displayDateStr, [DOB_DISPLAY_FORMAT, 'MM/DD/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
    if (!parsed.isValid()) return new Date().toISOString();
    const now = moment();
    return parsed
        .hour(now.hour())
        .minute(now.minute())
        .second(now.second())
        .millisecond(now.millisecond())
        .toISOString();
};

const triggerBlobDownload = (blob, fileName) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const downloadBase64File = (base64Content, fileName, contentType = 'application/octet-stream') => {
    if (!base64Content) return;
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: contentType });
    triggerBlobDownload(blob, fileName);
};

const BestSellingProducts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userProfile } = useProfile();
    const loginUser = useSelector((state) => state?.Login?.user);
    const userRole =
        resolveUserRole(userProfile) ?? resolveUserRole(loginUser) ?? getUserRoleFromAuthStorage();
    const isReceptionUser = userRole === UserRole.RECEPTION;

    // Get patient data from Redux
    const patientList = useSelector((state) => state?.DoctorDashboard?.patientList);
    const patientListLoading = useSelector((state) => state?.DoctorDashboard?.patientListLoading);
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList);
    const appointmentListLoading = useSelector((state) => state?.DoctorDashboard?.appointmentListLoading);
    const appointmentSuccess = useSelector((state) => state?.DoctorDashboard?.appointmentSuccess);
    const patientSuccess = useSelector((state) => state?.DoctorDashboard?.patientSuccess);
    const appointmentHistoryNotes = useSelector((state) => state?.DoctorDashboard?.appointmentHistoryNotes);
    const appointmentHistoryNotesLoading = useSelector((state) => state?.DoctorDashboard?.appointmentHistoryNotesLoading);
    const activePatientSessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
    const [caseTakingModalOpen, setCaseTakingModalOpen] = useState(false);
    const [selectedPatientForCaseTaking, setSelectedPatientForCaseTaking] = useState(null);

    // Custom Hover Tabs
    const [customHoverTab, setcustomHoverTab] = useState("1");
    const customHovertoggle = (tab) => {
        if (isReceptionUser && tab === "2") return;
        if (customHoverTab !== tab) {
            setcustomHoverTab(tab);
        }
    };

    // Custom Vertical Tabs
    const [customverticalTab, setcustomverticalTab] = useState("1");
    const customtoggleVertical = (tab) => {
        if (customverticalTab !== tab) {
            setcustomverticalTab(tab);
        }
    };

    // Search functionality
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => moment().format(DOB_DISPLAY_FORMAT));
    const [editingAppointmentTimeId, setEditingAppointmentTimeId] = useState(null);

    // Pagination state
    const [todayPage, setTodayPage] = useState(1);
    const [allPage, setAllPage] = useState(1);
    const pageSize = 15; // Show 15 items per page

    // Export modal state
    const [exportModal, setExportModal] = useState(false);
    const [exportScope, setExportScope] = useState('today');
    const [exportFormat, setExportFormat] = useState('excel');
    const [exportLoading, setExportLoading] = useState(false);

    // Import modal state
    const [importModal, setImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importTemplateLoading, setImportTemplateLoading] = useState(false);

    // History modal state
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [openAppointmentId, setOpenAppointmentId] = useState(null);
    const [prescriptionDetailsMap, setPrescriptionDetailsMap] = useState({});
    const [prescriptionLoadingId, setPrescriptionLoadingId] = useState(null);
    const [medicineTooltip, setMedicineTooltip] = useState(null);
    const medicineTooltipTimeoutRef = useRef(null);

    const openHistoryModal = async (patient) => {
        if (isReceptionUser) return;

        setSelectedPatientForHistory(patient);
        setHistoryModalOpen(true);
        setPatientAppointments([]);
        setOpenAppointmentId(null);
        setPrescriptionDetailsMap({});
        setMedicineTooltip(null);

        const patientId = getPatientIdFromRow(patient);
        if (!patientId) {
            Swal.fire({
                title: 'Error!',
                text: 'Patient ID not found.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        setAppointmentsLoading(true);
        try {
            const response = await getAppointmentListByPatientId({ patientId });
            const list = extractApiList(response);
            setPatientAppointments(list);
        } catch (error) {
            console.error('Error fetching appointment list:', error);
            Swal.fire({
                title: 'Error!',
                text: error?.response?.data?.message || error?.message || 'Failed to load appointment history.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const closeHistoryModal = () => {
        setHistoryModalOpen(false);
        setSelectedPatientForHistory(null);
        setPatientAppointments([]);
        setOpenAppointmentId(null);
        setPrescriptionDetailsMap({});
        setPrescriptionLoadingId(null);
        setMedicineTooltip(null);
    };

    const loadPrescriptionForAppointment = async (appointment) => {
        const appointmentId = appointment?.patientAppId;
        if (!appointmentId) return;

        if (prescriptionDetailsMap[appointmentId]) return;

        setPrescriptionLoadingId(appointmentId);
        try {
            const response = await getPrescriptionDetailsByAppointmentId({ appointmentId });
            const details = extractPrescriptionResultObject(response);
            setPrescriptionDetailsMap((prev) => ({
                ...prev,
                [appointmentId]: details,
            }));
        } catch (error) {
            console.error('Error fetching prescription details:', error);
            Swal.fire({
                title: 'Error!',
                text: error?.response?.data?.message || error?.message || 'Failed to load prescription details.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
        } finally {
            setPrescriptionLoadingId(null);
        }
    };

    const handleAppointmentAccordionToggle = async (appointment) => {
        const appointmentId = appointment?.patientAppId;
        if (!appointmentId) return;

        if (openAppointmentId === appointmentId) {
            setOpenAppointmentId(null);
            return;
        }

        setOpenAppointmentId(appointmentId);
        await loadPrescriptionForAppointment(appointment);
    };

    const openMedicineTooltip = (remedy) => {
        if (medicineTooltipTimeoutRef.current) {
            clearTimeout(medicineTooltipTimeoutRef.current);
        }
        setMedicineTooltip({
            remedyName: remedy.remedyName ?? '—',
            description: (remedy.description || '').trim(),
        });
    };

    const scheduleCloseMedicineTooltip = () => {
        if (medicineTooltipTimeoutRef.current) {
            clearTimeout(medicineTooltipTimeoutRef.current);
        }
        medicineTooltipTimeoutRef.current = setTimeout(() => {
            setMedicineTooltip(null);
        }, 200);
    };

    const cancelCloseMedicineTooltip = () => {
        if (medicineTooltipTimeoutRef.current) {
            clearTimeout(medicineTooltipTimeoutRef.current);
        }
    };

    const renderMedicineName = (remedy) => (
        <span
            className="history-medicine-hover text-primary text-decoration-underline"
            style={{ cursor: 'pointer' }}
            title="Hover to view description"
            onMouseEnter={() => openMedicineTooltip(remedy)}
            onMouseLeave={scheduleCloseMedicineTooltip}
        >
            {remedy.remedyName}
        </span>
    );

    const renderMedicineTooltipPopup = () => {
        if (!medicineTooltip) return null;

        const sectionStyle = {
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '10px',
            background: '#2a2a2a',
            border: '1px solid #404040',
            color: '#ffffff',
        };

        return (
            <div
                className="history-prescription-info-tooltip"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#f8fbff',
                    padding: '16px',
                    borderRadius: '8px',
                    maxWidth: '900px',
                    width: '90%',
                    zIndex: 10600,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                    border: '1px solid #d6e4ff',
                }}
                onMouseEnter={cancelCloseMedicineTooltip}
                onMouseLeave={scheduleCloseMedicineTooltip}
            >
                <div style={sectionStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>{medicineTooltip.remedyName}</div>
                </div>
                <div style={{ ...sectionStyle, marginBottom: 0 }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>description :</div>
                    <div style={{ color: '#f5f5f5', lineHeight: 1.8, fontSize: '14px' }}>
                        {medicineTooltip.description || 'No description available.'}
                    </div>
                </div>
            </div>
        );
    };

    const renderPrescriptionTable = (appointmentId) => {
        const details = prescriptionDetailsMap[appointmentId];
        if (!details) {
            return null;
        }

        const tableModel = buildPrescriptionTableModel(details);
        if (!tableModel) {
            return <p className="text-muted mb-0">No prescription details available.</p>;
        }

        const { symptomRows, remedyRows, rowSpan } = tableModel;

        return (
            <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '50%' }}>Symptoms</th>
                            <th style={{ width: '50%' }}>Medicine</th>
                        </tr>
                    </thead>
                    <tbody>
                        {symptomRows.map((row, index) => (
                            <tr key={`${appointmentId}-symptom-${row.id}`}>
                                <td>{row.symptom}</td>
                                {index === 0 && (
                                    <td rowSpan={rowSpan} className="align-top">
                                        {remedyRows.length > 0 ? (
                                            remedyRows.map((remedy, remedyIndex) => (
                                                <div
                                                    key={`${appointmentId}-medicine-${remedy.id}`}
                                                    className={remedyIndex < remedyRows.length - 1 ? 'mb-2' : ''}
                                                >
                                                    {renderMedicineName(remedy)}
                                                </div>
                                            ))
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Case Notes modal state
    const [caseNotesModalOpen, setCaseNotesModalOpen] = useState(false);
    const [caseNotesActive, setCaseNotesActive] = useState('1');
    const [selectedPatientForCaseNotes, setSelectedPatientForCaseNotes] = useState(null);
    const [caseNotesTabs, setCaseNotesTabs] = useState([]);
    const [caseNoteEditorState, setCaseNoteEditorState] = useState(() => EditorState.createEmpty());
    const [activeCaseNoteMeta, setActiveCaseNoteMeta] = useState({ historyId: 0, appointmentId: null });
    const [savingCaseNote, setSavingCaseNote] = useState(false);

    const getPatientAppointmentId = (patient) =>
        patient?.appointmentId || patient?.id || patient?.patientAppId || null;

    const convertHtmlToEditorState = (html) => {
        if (!html) {
            return EditorState.createEmpty();
        }
        const contentBlock = htmlToDraft(html);
        if (contentBlock) {
            const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
            return EditorState.createWithContent(contentState);
        }
        return EditorState.createEmpty();
    };

    const getCaseNoteHtmlFromEditor = (editorState) =>
        draftToHtml(convertToRaw(editorState.getCurrentContent()));

    const applyCaseNoteToEditor = (tab) => {
        if (!tab) return;
        setCaseNotesActive(tab.id);
        setCaseNoteEditorState(convertHtmlToEditorState(tab.historyNote));
        setActiveCaseNoteMeta({
            historyId: tab.historyId ?? 0,
            appointmentId: tab.appointmentId ?? getPatientAppointmentId(selectedPatientForCaseNotes),
        });
    };

    const handleCaseNoteEditorChange = (newEditorState) => {
        setCaseNoteEditorState(newEditorState);
    };

    const handleSelectCaseNoteTab = (tab) => {
        const currentHtml = getCaseNoteHtmlFromEditor(caseNoteEditorState);
        setCaseNotesTabs((prev) => {
            const updated = prev.map((t) =>
                t.id === caseNotesActive ? { ...t, historyNote: currentHtml } : t
            );
            const selected = updated.find((t) => t.id === tab.id) || tab;
            setCaseNotesActive(selected.id);
            setCaseNoteEditorState(convertHtmlToEditorState(selected.historyNote));
            setActiveCaseNoteMeta({
                historyId: selected.historyId ?? 0,
                appointmentId:
                    selected.appointmentId ?? getPatientAppointmentId(selectedPatientForCaseNotes),
            });
            return updated;
        });
    };

    const extractCaseNotesList = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.resultObject)) return data.resultObject;
        if (Array.isArray(data.data?.resultObject)) return data.data.resultObject;
        if (Array.isArray(data.data)) return data.data;
        return [];
    };

    const fetchCaseNotesForPatient = async () => {
        await dispatch(getAppointmentHistoryNotes({
            pageNumber: 1,
            pageSize: 100,
        }));
    };

    const openCaseNotesModal = async (patient) => {
        if (isReceptionUser) return;

        setSelectedPatientForCaseNotes(patient);
        setCaseNotesActive('1');
        setCaseNotesTabs([]);
        setCaseNoteEditorState(EditorState.createEmpty());
        setActiveCaseNoteMeta({ historyId: 0, appointmentId: getPatientAppointmentId(patient) });
        setCaseNotesModalOpen(true);

        try {
            await fetchCaseNotesForPatient();
        } catch (error) {
            console.error('Error fetching appointment history notes:', error);
        }
    };

    const closeCaseNotesModal = () => {
        setCaseNotesModalOpen(false);
        setCaseNotesTabs([]);
        setCaseNoteEditorState(EditorState.createEmpty());
        setActiveCaseNoteMeta({ historyId: 0, appointmentId: null });
        setSavingCaseNote(false);
    };

    const handleSaveCaseNote = async () => {
        const caseNoteEditorHtml = getCaseNoteHtmlFromEditor(caseNoteEditorState);
        const appointmentId =
            activeCaseNoteMeta.appointmentId || getPatientAppointmentId(selectedPatientForCaseNotes);
        const trimmed = (caseNoteEditorHtml || '').replace(/<p><\/p>/g, '').trim();

        if (!appointmentId) {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Appointment ID is missing for this patient.',
                confirmButtonColor: '#000000',
            });
            return;
        }

        if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') {
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: 'Please enter case notes before saving.',
                confirmButtonColor: '#000000',
            });
            return;
        }

        const historyNote = caseNoteEditorHtml.endsWith('\n')
            ? caseNoteEditorHtml
            : `${caseNoteEditorHtml}\n`;

        try {
            setSavingCaseNote(true);
            await dispatch(saveUpdateAppointmentHistoryNote({
                historyId: activeCaseNoteMeta.historyId || 0,
                appointmentId: String(appointmentId),
                historyNote,
            }));

            setCaseNotesTabs((prev) =>
                prev.map((tab) =>
                    tab.id === caseNotesActive
                        ? { ...tab, historyNote: getCaseNoteHtmlFromEditor(caseNoteEditorState) }
                        : tab
                )
            );

            await fetchCaseNotesForPatient();

            Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Case notes saved successfully.',
                confirmButtonColor: '#000000',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error saving case notes:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save case notes. Please try again.',
                confirmButtonColor: '#000000',
            });
        } finally {
            setSavingCaseNote(false);
        }
    };

    // Update case notes tabs when data is fetched
    useEffect(() => {
        if (caseNotesModalOpen && appointmentHistoryNotes) {
            const notes = extractCaseNotesList(appointmentHistoryNotes);

            if (notes.length > 0) {
                const tabs = notes.map((note, index) => ({
                    id: String(index + 1),
                    title: note.createdDate || `Note ${index + 1}`,
                    historyId: note.historyId,
                    appointmentId: note.appointmentId,
                    historyNote: note.historyNote || '',
                }));

                setCaseNotesTabs(tabs);
                applyCaseNoteToEditor(tabs[0]);
            } else {
                setCaseNotesTabs([]);
                setCaseNoteEditorState(EditorState.createEmpty());
            }
        }
    }, [appointmentHistoryNotes, caseNotesModalOpen]);

    // Add Case Notes modal state
    const [addCaseModalOpen, setAddCaseModalOpen] = useState(false);
    const [addCaseForm, setAddCaseForm] = useState({
        patientName: '',
        prescriptionType: 'New Prescription',
        notes: '<p>Enter case notes here...</p>'
    });

    const openAddCaseModal = (patient) => {
        setAddCaseForm({
            patientName: patient?.name || '',
            prescriptionType: 'New Prescription',
            notes: '<p>Enter case notes here...</p>'
        });
        setAddCaseModalOpen(true);
    };
    const closeAddCaseModal = () => setAddCaseModalOpen(false);

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

    // Helper function to format age/sex display (compact, single-line)
    const getAgeSexDisplay = (dateOfBirth, gender) => {
        const age = calculateAgeYMD(dateOfBirth);
        const genderLabel = getGenderDisplay(gender);
        if (!age) return `N/A/${genderLabel}`;
        return `${age.years}y${age.months}m${age.days}d/${genderLabel}`;
    };

    const formatPatientDisplayName = (name) => {
        if (!name || typeof name !== 'string') return 'N/A';
        return name
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const getPatientRowFullName = (patient) => {
        const raw = patient?.name || patient?.patientName || patient?.PatientName || '';
        return String(raw).trim() || 'Patient';
    };

    const normalizePatientBoardRow = (patient) => {
        const patientId = patient?.patientId ?? patient?.patientID ?? patient?.PatientId ?? null;
        const patientAppId = getPatientAppIdFromRow(patient);
        const fullName = getPatientRowFullName(patient);

        return {
            ...patient,
            patientId,
            patientID: patientId,
            patientAppId,
            patientName: fullName,
            name: fullName,
        };
    };

    const isCompletedAppointment = (patient) => {
        const status = String(patient?.appStatus ?? patient?.status ?? '').trim().toUpperCase();
        return status === 'COMPLETED';
    };

    const handlePatientBoardLinkClick = (event, patient) => {
        event.preventDefault();
        const boardPatient = normalizePatientBoardRow(patient);
        const patientKey = buildPatientBoardKeyFromPatient(boardPatient);
        const access = canOpenPatientSession(activePatientSessions, patientKey);
        if (!access.allowed) {
            showPatientSessionLimitAlert(access.activeSessions);
            return;
        }
        setSelectedPatientForCaseTaking(boardPatient);
        setCaseTakingModalOpen(true);
    };

    const closeCaseTakingModal = () => {
        setCaseTakingModalOpen(false);
        setSelectedPatientForCaseTaking(null);
    };

    const handleManualCaseTaking = () => {
        if (!selectedPatientForCaseTaking) {
            return;
        }
        navigate(buildPatientBoardPath(selectedPatientForCaseTaking));
        closeCaseTakingModal();
    };

    const handleAudioCaseTaking = () => {
        if (!selectedPatientForCaseTaking) {
            return;
        }
        navigate(buildPatientBoardAudioPath(selectedPatientForCaseTaking));
        closeCaseTakingModal();
    };

    const renderPatientBoardNameLink = (patient, idPrefix = 'patient') => {
        const boardPatient = normalizePatientBoardRow(patient);
        const displayName = formatPatientDisplayName(boardPatient.name);
        const fullName = boardPatient.name;
        const tooltipId = `${idPrefix}-patient-name-${boardPatient.id || boardPatient.patientAppId || 'row'}`;
        const isNameDisabled = isCompletedAppointment(patient);

        const nameLabel = (
            <span
                id={tooltipId}
                className={isNameDisabled ? 'dashboard-patient-name-text dashboard-patient-name-text--disabled' : 'dashboard-patient-name-text'}
            >
                {displayName}
            </span>
        );

        if (isReceptionUser || isNameDisabled) {
            return (
                <>
                    {nameLabel}
                    <UncontrolledTooltip placement="top" target={tooltipId}>
                        {fullName}
                    </UncontrolledTooltip>
                </>
            );
        }

        return (
            <>
                <Link
                    id={tooltipId}
                    to={buildPatientBoardPath(boardPatient)}
                    className="dashboard-patient-name-link fw-medium"
                    onClick={(event) => handlePatientBoardLinkClick(event, boardPatient)}
                >
                    {displayName}
                </Link>
                <UncontrolledTooltip placement="top" target={tooltipId}>
                    {fullName}
                </UncontrolledTooltip>
            </>
        );
    };

    // Use appointment data for Today tab
    const todayPatients = (appointmentList || []).map((appointment) => {
        const patientId = appointment.patientId ?? appointment.patientID ?? appointment.PatientId ?? null;
        const patientAppId = appointment.patientAppId ?? appointment.patientAppID ?? appointment.PatientAppId ?? null;
        const patientName = appointment.patientName ?? appointment.PatientName ?? '';

        return {
            ...appointment,
            id: patientAppId,
            patientAppId,
            patientId,
            patientID: patientId,
            name: patientName,
            patientName,
            ageSex: getAgeSexDisplay(appointment.dateOfBirth, appointment.gender),
            place: appointment.address || '-',
            appStatus: appointment.status || '-',
            avatar: userAvatarBlue,
        };
    });

    // Use patient data for All tab
    const allPatients = (patientList || []).map((patient, index) => ({
        id: patient.patientID,
        name: patient.patientName,
        ageSex: getAgeSexDisplay(patient.dateOfBirth, patient.gender),
        place: patient.address || 'N/A',
        avatar: userAvatarBlue,
        ...patient // Include all original patient data
    }));

    // Filter data based on search term
    const filteredTodayPatients = todayPatients.filter(patient => {
        const needle = searchTerm.toLowerCase();
        if (!needle) return true;
        return (
            patient.name.toLowerCase().includes(needle) ||
            patient.place.toLowerCase().includes(needle) ||
            patient.ageSex.toLowerCase().includes(needle) ||
            (patient.appStatus || '').toLowerCase().includes(needle) ||
            patient.mobileNo?.toString().includes(needle)
        );
    });

    const filteredAllPatients = allPatients.filter(patient => {
        const needle = searchTerm.toLowerCase();
        if (!needle) return true;
        return (
            patient.name.toLowerCase().includes(needle) ||
            patient.place.toLowerCase().includes(needle) ||
            patient.ageSex.toLowerCase().includes(needle) ||
            patient.mobileNo?.toString().includes(needle)
        );
    });

    // Pagination calculations
    const todayTotalPages = Math.ceil(filteredTodayPatients.length / pageSize);
    const allTotalPages = Math.ceil(filteredAllPatients.length / pageSize);

    const todayStartIndex = (todayPage - 1) * pageSize;
    const todayEndIndex = todayStartIndex + pageSize;
    const todayPageData = filteredTodayPatients.slice(todayStartIndex, todayEndIndex);

    const allStartIndex = (allPage - 1) * pageSize;
    const allEndIndex = allStartIndex + pageSize;
    const allPageData = filteredAllPatients.slice(allStartIndex, allEndIndex);


    const importFileInputRef = useRef(null);

    const openImportModal = () => {
        setImportFile(null);
        setImportLoading(false);
        setImportTemplateLoading(false);
        if (importFileInputRef.current) {
            importFileInputRef.current.value = '';
        }
        setImportModal(true);
    };

    const handleDownloadImportTemplate = async (format) => {
        setImportTemplateLoading(true);
        try {
            const response = await downloadPatientImportTemplate(format);
            const blob = response?.data instanceof Blob
                ? response.data
                : new Blob([response?.data ?? ''], {
                    type: response?.headers?.['content-type'] || 'application/octet-stream',
                });
            const fileName = format === 'csv' ? 'Patient_Import_Sample.csv' : 'Patient_Import_Sample.xlsx';
            triggerBlobDownload(blob, fileName);
        } catch (error) {
            console.error('Template download failed:', error);
            Swal.fire({
                title: 'Download failed',
                text: typeof error === 'string' ? error : (error?.message || 'Unable to download sample file.'),
                icon: 'error',
                timer: 2500,
                showConfirmButton: false,
            });
        } finally {
            setImportTemplateLoading(false);
        }
    };

    const handleImportFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImportFile(file);
    };

    const handleImportSubmit = async () => {
        const { userId, userName } = getPatientAuthContext();
        if (!userId) {
            Swal.fire({
                title: 'Error!',
                text: 'User not found. Please log in again.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        if (!importFile) {
            Swal.fire({
                title: 'No file selected',
                text: 'Please choose an Excel or CSV file to import.',
                icon: 'warning',
                timer: 2200,
                showConfirmButton: false,
            });
            return;
        }

        const extension = importFile.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(extension)) {
            Swal.fire({
                title: 'Invalid file',
                text: 'Only .xlsx and .csv files are supported.',
                icon: 'error',
                timer: 2200,
                showConfirmButton: false,
            });
            return;
        }

        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('userId', String(userId));
            formData.append('userName', userName || 'IMPORT');

            const result = await importPatients(formData);
            const successCount = result?.successCount ?? result?.SuccessCount ?? 0;
            const failedCount = result?.failedCount ?? result?.FailedCount ?? 0;
            const totalRows = result?.totalRows ?? result?.TotalRows ?? 0;
            const hasAppointments = result?.hasAppointments ?? result?.HasAppointments ?? false;
            const skippedFile = result?.skippedFile ?? result?.SkippedFile;

            if (skippedFile?.contentBase64 || skippedFile?.ContentBase64) {
                downloadBase64File(
                    skippedFile.contentBase64 || skippedFile.ContentBase64,
                    skippedFile.fileName || skippedFile.FileName || `Patients_Import_Skipped_${moment().format('YYYYMMDD_HHmmss')}.xlsx`,
                    skippedFile.contentType || skippedFile.ContentType || 'application/octet-stream'
                );
            }

            await dispatch(getPatientList({ userId }));
            await dispatch(fetchDoctorDashboardCounts({
                appointmentDate: new Date().toISOString(),
                status: '',
                userId,
            }));
            if (hasAppointments) {
                dispatch(getAppointmentList({
                    userId,
                    appointmentDate: toDashboardAppointmentDateIso(selectedAppointmentDate),
                    status: '',
                }));
            }

            setImportModal(false);
            setImportFile(null);
            if (importFileInputRef.current) {
                importFileInputRef.current.value = '';
            }

            const skippedNote = failedCount > 0
                ? ' Skipped rows were downloaded automatically.'
                : '';

            Swal.fire({
                title: successCount > 0 ? 'Import completed' : 'Import finished',
                html: `Total rows: <b>${totalRows}</b><br/>Imported: <b>${successCount}</b><br/>Skipped: <b>${failedCount}</b>${skippedNote}`,
                icon: successCount > 0 ? 'success' : (failedCount > 0 ? 'warning' : 'info'),
                confirmButtonColor: '#0ab39c',
            });
        } catch (error) {
            console.error('Import failed:', error);
            Swal.fire({
                title: 'Import failed',
                text: typeof error === 'string' ? error : (error?.message || 'Unable to import patient data.'),
                icon: 'error',
                timer: 3000,
                showConfirmButton: false,
            });
        } finally {
            setImportLoading(false);
        }
    };

    // Pagination handlers
    const handleTodayPageChange = (page) => {
        setTodayPage(page);
    };

    const handleAllPageChange = (page) => {
        setAllPage(page);
    };

    const loadAppointmentListForDate = (displayDateStr) => {
        const { userId } = getPatientAuthContext();
        if (!userId || !displayDateStr) return;
        dispatch(getAppointmentList({
            userId,
            appointmentDate: toDashboardAppointmentDateIso(displayDateStr),
            status: '',
        }));
    };

    // Reset pagination when search changes
    useEffect(() => {
        setTodayPage(1);
        setAllPage(1);
    }, [searchTerm]);

    // Load patient list for All tab on mount
    useEffect(() => {
        const { userId } = getPatientAuthContext();
        if (userId) {
            dispatch(getPatientList({ userId }));
        }
    }, [dispatch]);

    // Load appointment list for Today tab when calendar date changes
    useEffect(() => {
        loadAppointmentListForDate(selectedAppointmentDate);
    }, [selectedAppointmentDate, dispatch]);

    // Refresh lists when a new patient is registered
    useEffect(() => {
        if (patientSuccess && String(patientSuccess).toLowerCase().includes('created')) {
            const auth = JSON.parse(sessionStorage.getItem('authUser'));
            const userId = auth?.userId || auth?.user?.userId || auth?.user?.id;

            if (userId) {
                dispatch(getPatientList({ userId }));
                dispatch(fetchDoctorDashboardCounts({
                    appointmentDate: new Date().toISOString(),
                    status: '',
                    userId,
                }));
            }

            if (!isReceptionUser) {
                setcustomHoverTab("2");
            }
        }
    }, [patientSuccess, dispatch, isReceptionUser]);

    // Refresh lists when a new appointment is created
    useEffect(() => {
        if (appointmentSuccess) {
            const { userId } = getPatientAuthContext();

            // Refresh patient list for All tab
            dispatch(getPatientList({ userId }));

            // Refresh appointment list for Today tab
            dispatch(getAppointmentList({
                appointmentDate: toDashboardAppointmentDateIso(selectedAppointmentDate),
                status: '',
                userId,
            }));

            setcustomHoverTab("1");

            // Clear the success message after refreshing
            setTimeout(() => {
                dispatch(setAppointmentSuccess(null));
            }, 100);
        }
    }, [appointmentSuccess, dispatch, selectedAppointmentDate]);

    // Edit Patient Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const patientLoading = useSelector((state) => state?.DoctorDashboard?.patientLoading);
    const [editForm, setEditForm] = useState({
        patientName: '',
        gender: 'Male',
        dob: '',
        address: '',
        mobile: '',
        email: '',
        referBy: '',
        appointmentDate: '',
        appointmentTime: ''
    });

    const formatDobForInput = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        const parsed = moment(dateOfBirth);
        return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
    };

    const openEditModal = (patient) => {
        const email = getPatientEmailForEdit(patient, appointmentList);
        setEditingPatient({ ...patient, mail: email || patient?.mail });
        setEditForm({
            patientName: patient?.patientName || patient?.name || '',
            gender: patient?.gender === 1 ? 'Female' : 'Male',
            dob: formatDobForInput(patient?.dateOfBirth),
            address: patient?.address || '',
            mobile: patient?.mobileNo || '',
            email,
            referBy: patient?.refBy || '',
            appointmentDate: '',
            appointmentTime: ''
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

    const handleUpdatePatient = async () => {
        if (!editingPatient) return;

        const patientData = buildPatientApiPayload({
            patient: editingPatient,
            form: editForm,
            isCreate: false,
        });

        try {
            await dispatch(createPatient(patientData));
            const { userId } = getPatientAuthContext();
            if (userId) {
                dispatch(getPatientList({ userId }));
                dispatch(fetchDoctorDashboardCounts({
                    appointmentDate: new Date().toISOString(),
                    status: '',
                    userId,
                }));
            }
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

    const openExportModal = () => {
        setExportScope(customHoverTab === '1' ? 'today' : 'all');
        setExportFormat('excel');
        setExportLoading(false);
        setExportModal(true);
    };

    const handleExportDownload = async () => {
        const { userId } = getPatientAuthContext();
        if (!userId) {
            Swal.fire({
                title: 'Error!',
                text: 'User not found. Please log in again.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        if (exportScope === 'today' && !selectedAppointmentDate) {
            Swal.fire({
                title: 'Error!',
                text: 'Please select a date for Today export.',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        setExportLoading(true);
        try {
            const response = await exportPatients({
                userId,
                scope: exportScope,
                format: exportFormat,
                date: exportScope === 'today'
                    ? toDashboardAppointmentDateIso(selectedAppointmentDate)
                    : undefined,
            });

            const blob = response?.data instanceof Blob
                ? response.data
                : new Blob([response?.data ?? ''], {
                    type: response?.headers?.['content-type'] || 'application/octet-stream',
                });

            const extension = exportFormat === 'pdf' ? 'pdf' : exportFormat === 'csv' ? 'csv' : 'xlsx';
            const dateSuffix = exportScope === 'today'
                ? `_${moment(selectedAppointmentDate, DOB_DISPLAY_FORMAT).format('YYYY-MM-DD')}`
                : '';
            const fileName = `Patients_${exportScope}${dateSuffix}.${extension}`;

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportModal(false);
        } catch (error) {
            console.error('Export failed:', error);
            Swal.fire({
                title: 'Export failed',
                text: typeof error === 'string' ? error : (error?.message || 'Unable to export patient data.'),
                icon: 'error',
                timer: 2500,
                showConfirmButton: false,
            });
        } finally {
            setExportLoading(false);
        }
    };

    // Handler for status change
    const handleStatusChange = async (patient, newStatus) => {
        try {
            // Get patientAppId from patient object
            const patientAppId = patient.patientAppId || patient.id || patient.appointmentId;

            if (!patientAppId) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Appointment ID not found',
                    icon: 'error',
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }

            // Call API to update appointment status
            await dispatch(updateAppointmentStatus({
                patientAppId: patientAppId,
                status: newStatus
            }));

            // Refresh the appointment list and counts after status change
            const { userId } = getPatientAuthContext();
            const appointmentDateIso = toDashboardAppointmentDateIso(selectedAppointmentDate);

            // Refresh appointment list to reflect the status change
            await dispatch(getAppointmentList({
                appointmentDate: appointmentDateIso,
                status: '',
                userId,
            }));

            // Refresh dashboard counts to update status cards
            // This API call updates the counts for all 6 status cards:
            // - WAITING (counts.patientAppWaiting)
            // - WALK-IN (counts.walkInpatientApp)
            // - NOT ARRIVED (counts.patientAppNotArrived)
            // - E-CONSULT (counts.patientAppEConsult)
            // - REMAINING (counts.patientAppRemaining)
            // - COMPLETED (counts.patientAppComplated)
            // The counts are stored in Redux state: state.DoctorDashboard.counts
            // Widgets.js automatically displays these counts in the status cards
            await dispatch(fetchDoctorDashboardCounts({
                appointmentDate: appointmentDateIso,
                status: '',
                userId,
            }));

            // Show success message
            Swal.fire({
                title: 'Status Updated!',
                text: `Appointment status changed to ${newStatus}`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error updating appointment status:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update appointment status';
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
            });
        }
    };

    const handleNewAppointmentFromAll = (patient) => {
        dispatchOpenNewAppointmentModal(patient);
    };

    const handleDeletePatientFromAll = (patient) => {
        const patientId = patient?.patientID || patient?.patientId || patient?.id;
        if (!patientId) {
            Swal.fire({
                title: 'Error!',
                text: 'Patient ID not found',
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure want to delete this patient?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            showClass: { popup: 'animate__animated animate__fadeInDown' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp' }
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                await dispatch(deletePatient({ patientId }));
                const { userId } = getPatientAuthContext();
                if (userId) {
                    await dispatch(getPatientList({ userId }));
                }
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Patient has been deleted.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete patient';
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    const handleAppointmentTimeUpdated = () => {
        loadAppointmentListForDate(selectedAppointmentDate);
    };

    // Helper function to render table rows (Today tab shows Appointment Time + Connect + New Appointment)
    const renderTableRows = (pageData, startIndex, idPrefix, isTodayTab = false) => {
        return pageData.map((patient, index) => {
            const rowAppId = getPatientAppIdFromRow(patient);
            const isEditingTime = isTodayTab && editingAppointmentTimeId === rowAppId;

            return (
            <tr key={patient.id}>
                <td className="text-center dashboard-patient-col-index">{startIndex + index + 1}</td>
                <td className="dashboard-patient-col-name">
                    <div className="d-flex align-items-center dashboard-patient-name-wrap">
                        <div className="flex-shrink-0 me-1">
                            <img src={userAvatarBlue} alt="" className="avatar-xxs rounded-circle object-fit-cover" />
                        </div>
                        <div className="flex-grow-1 min-w-0 text-truncate">
                            {renderPatientBoardNameLink(patient, idPrefix)}
                        </div>
                    </div>
                </td>
                <td className="dashboard-patient-col-agesex text-nowrap text-muted small">{patient.ageSex}</td>
                <td className="dashboard-patient-col-place text-truncate" title={patient.place}>{patient.place}</td>
                <td className="dashboard-patient-col-mobile text-nowrap">{patient.mobileNo || '-'}</td>
                {isTodayTab ? (
                <td className="dashboard-patient-col-status text-nowrap" style={{ position: 'relative' }}>
                    {patient.appStatus ? (
                        <UncontrolledDropdown>
                            <DropdownToggle
                                tag="button"
                                className="btn btn-sm btn-link text-decoration-none p-0 border-0 d-flex align-items-center text-nowrap"
                                style={{ cursor: 'pointer', color: 'inherit', fontSize: '0.78rem' }}
                            >
                                <span className="me-1">{patient.appStatus}</span>
                                <i className="ri-arrow-down-s-line"></i>
                            </DropdownToggle>
                            <DropdownMenu
                                style={{
                                    zIndex: 1050,
                                    minWidth: '150px'
                                }}
                                modifiers={[
                                    {
                                        name: 'preventOverflow',
                                        options: {
                                            boundary: 'viewport',
                                        },
                                    },
                                    {
                                        name: 'flip',
                                        options: {
                                            fallbackPlacements: ['bottom', 'top', 'right', 'left'],
                                        },
                                    },
                                ]}
                            >
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'WAITING')}
                                    active={patient.appStatus === 'WAITING'}
                                >
                                    WAITING
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'WALK-IN')}
                                    active={patient.appStatus === 'WALK-IN'}
                                >
                                    WALK-IN
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'NOT ARRIVED')}
                                    active={patient.appStatus === 'NOT ARRIVED'}
                                >
                                    NOT ARRIVED
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'E-CONSULT')}
                                    active={patient.appStatus === 'E-CONSULT'}
                                >
                                    E-CONSULT
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'REMAINING')}
                                    active={patient.appStatus === 'REMAINING'}
                                >
                                    REMAINING
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => handleStatusChange(patient, 'COMPLETED')}
                                    active={patient.appStatus === 'COMPLETED'}
                                >
                                    COMPLETED
                                </DropdownItem>
                            </DropdownMenu>
                        </UncontrolledDropdown>
                    ) : (
                        '-'
                    )}
                </td>
                ) : null}
                {isTodayTab ? (
                    <td className="appointment-time-column text-nowrap">
                        <AppointmentTimeCell
                            patient={patient}
                            appStatus={patient.appStatus}
                            isEditing={isEditingTime}
                            onStartEdit={() => setEditingAppointmentTimeId(rowAppId)}
                            onCancelEdit={() => setEditingAppointmentTimeId(null)}
                            onTimeUpdated={handleAppointmentTimeUpdated}
                            appointmentDateFallback={selectedAppointmentDate}
                        />
                    </td>
                ) : null}
                <td className="dashboard-patient-col-actions-combined">
                    <div className="dashboard-patient-actions-bar">
                        <div className="dashboard-patient-actions-section dashboard-patient-actions-section--history">
                            <PatientDashboardActionGroup>
                        <PatientDashboardActionButton
                            id={`${idPrefix}-addcase-${patient.id}`}
                            icon="ri-file-add-line"
                            label="Add Case"
                            btnClass="btn-soft-warning"
                            disabled={!IS_ADD_CASE_NOTES_ENABLED}
                            tooltip={IS_ADD_CASE_NOTES_ENABLED ? 'Add Case Notes' : 'Add Case Notes (temporarily unavailable)'}
                            onClick={() => {
                                if (IS_ADD_CASE_NOTES_ENABLED) {
                                    openAddCaseModal(patient);
                                }
                            }}
                        />
                        <PatientDashboardActionButton
                            id={`${idPrefix}-history-${patient.id}`}
                            icon="ri-history-line"
                            label="History"
                            btnClass="btn-soft-secondary"
                            disabled={isReceptionUser && isTodayTab}
                            tooltip={
                                isReceptionUser && isTodayTab
                                    ? 'View History Notes (disabled for reception)'
                                    : 'View History Notes'
                            }
                            onClick={() => {
                                if (!(isReceptionUser && isTodayTab)) {
                                    openHistoryModal(patient);
                                }
                            }}
                        />
                        <PatientDashboardActionButton
                            id={`${idPrefix}-case-${patient.id}`}
                            icon="ri-file-text-line"
                            label="Case Notes"
                            btnClass="btn-soft-primary"
                            disabled={isReceptionUser}
                            tooltip={
                                isReceptionUser
                                    ? 'View Case Notes (disabled for reception)'
                                    : 'View Case Notes'
                            }
                            onClick={() => {
                                if (!isReceptionUser) {
                                    openCaseNotesModal(patient);
                                }
                            }}
                        />
                            </PatientDashboardActionGroup>
                        </div>
                        <div className="dashboard-patient-actions-section dashboard-patient-actions-section--connect">
                            <PatientDashboardActionGroup>
                            <PatientDashboardActionButton
                                id={`${idPrefix}-chat-${patient.id}`}
                                icon="ri-whatsapp-line"
                                label="WhatsApp"
                                btnClass="btn-soft-success"
                                tooltip="Chat on WhatsApp"
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Are you sure want to connect with whatsapp chat?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#0ab39c',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Yes, connect!',
                                        cancelButtonText: 'Cancel',
                                        showClass: { popup: 'animate__animated animate__fadeInDown' },
                                        hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            Swal.fire({
                                                title: 'Processing wait..',
                                                allowOutsideClick: false,
                                                didOpen: () => {
                                                    Swal.showLoading();
                                                }
                                            });
                                            setTimeout(() => {
                                                Swal.close();
                                            }, 1200);
                                        }
                                    });
                                }}
                            />
                            <PatientDashboardActionButton
                                id={`${idPrefix}-call-${patient.id}`}
                                icon="ri-phone-line"
                                label="Call"
                                btnClass="btn-soft-info"
                                tooltip="Call Patient"
                                onClick={() => {
                                    Swal.fire({
                                        title: patient.mobileNo ? `+91 - ${patient.mobileNo}` : '+91 - 987 654 XXXX',
                                        text: 'Are you sure to call person directly?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Yes, call!',
                                        cancelButtonText: 'Cancel',
                                        showClass: { popup: 'animate__animated animate__fadeInDown' },
                                        hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            Swal.fire({
                                                title: 'Processing wait..',
                                                allowOutsideClick: false,
                                                didOpen: () => {
                                                    Swal.showLoading();
                                                }
                                            });
                                            setTimeout(() => {
                                                Swal.close();
                                            }, 1200);
                                        }
                                    });
                                }}
                            />
                            <PatientDashboardActionButton
                                id={`${idPrefix}-video-${patient.id}`}
                                icon="ri-vidicon-line"
                                label="Video"
                                btnClass="btn-soft-dark"
                                tooltip="WhatsApp Video Call"
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Are you sure want to connect with whatsapp video call?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#299cdb',
                                        cancelButtonColor: '#3085d6',
                                        confirmButtonText: 'Yes, connect!',
                                        cancelButtonText: 'Cancel',
                                        showClass: { popup: 'animate__animated animate__fadeInDown' },
                                        hideClass: { popup: 'animate__animated animate__fadeOutUp' }
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            Swal.fire({
                                                title: 'Processing wait..',
                                                allowOutsideClick: false,
                                                didOpen: () => {
                                                    Swal.showLoading();
                                                }
                                            });
                                            setTimeout(() => {
                                                Swal.close();
                                            }, 1200);
                                        }
                                    });
                                }}
                            />
                            </PatientDashboardActionGroup>
                        </div>
                        <div className="dashboard-patient-actions-section dashboard-patient-actions-section--followup">
                            <PatientDashboardActionGroup>
                            {isTodayTab ? (
                                <PatientDashboardActionButton
                                    id={`${idPrefix}-appt-${patient.id}`}
                                    icon="ri-calendar-event-line"
                                    label="Appointment"
                                    btnClass="btn-soft-primary"
                                    tooltip="Next Appointment"
                                    onClick={() => handleNewAppointmentFromAll(patient)}
                                />
                            ) : (
                                <>
                                    <PatientDashboardActionButton
                                        id={`${idPrefix}-edit-${patient.id}`}
                                        icon="ri-pencil-fill"
                                        label="Edit"
                                        btnClass="btn-soft-success"
                                        tooltip="Edit Patient"
                                        onClick={() => openEditModal(patient)}
                                    />
                                    <PatientDashboardActionButton
                                        id={`${idPrefix}-appt-${patient.id}`}
                                        icon="ri-calendar-event-line"
                                        label="Appointment"
                                        btnClass="btn-soft-primary"
                                        tooltip="Next Appointment"
                                        onClick={() => handleNewAppointmentFromAll(patient)}
                                    />
                                    <PatientDashboardActionButton
                                        id={`${idPrefix}-del-${patient.id}`}
                                        icon="ri-delete-bin-5-line"
                                        label="Delete"
                                        btnClass="btn-soft-danger"
                                        variant="remove"
                                        tooltip="Delete Patient"
                                        onClick={() => handleDeletePatientFromAll(patient)}
                                    />
                                </>
                            )}
                            </PatientDashboardActionGroup>
                        </div>
                    </div>
                </td>
            </tr>
            );
        });
    };

    // Helper function to render pagination
    const renderPagination = (currentPage, totalPages, onPageChange, totalResults) => {
        return (
            <div className="align-items-center px-3 py-2 my-2 justify-content-between row text-center text-sm-start">
                <div className="col-sm">
                    <div className="text-muted">
                        Showing <span className="fw-semibold">{Math.min((currentPage - 1) * pageSize + 1, totalResults)}</span> to{' '}
                        <span className="fw-semibold">{Math.min(currentPage * pageSize, totalResults)}</span> of{' '}
                        <span className="fw-semibold">{totalResults}</span> Results
                    </div>
                </div>
                <div className="col-sm-auto mt-3 mt-sm-0">
                    <ul className="pagination pagination-separated pagination-sm mb-0 justify-content-center doctor-dashboard-pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ←
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                →
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <React.Fragment>
            <style>{`
                .dashboard-patient-table {
                    table-layout: fixed;
                    width: 100%;
                }
                .dashboard-patient-table .dashboard-patient-col-index {
                    width: 2rem;
                }
                .dashboard-patient-table .dashboard-patient-col-name {
                    width: 18%;
                    min-width: 10rem;
                }
                .dashboard-patient-table .dashboard-patient-col-agesex {
                    width: 4.5rem;
                }
                .dashboard-patient-table .dashboard-patient-col-place {
                    width: 9%;
                    min-width: 5.75rem;
                }
                .dashboard-patient-table .dashboard-patient-col-mobile {
                    width: 5.75rem;
                }
                .dashboard-patient-table .dashboard-patient-col-status {
                    width: 6.25rem;
                }
                .dashboard-patient-table .dashboard-patient-col-apptime {
                    width: 5.75rem;
                }
                .dashboard-patient-table .dashboard-patient-col-actions-combined {
                    width: 12.5rem;
                    min-width: 12.5rem;
                    padding-left: 0.3rem !important;
                    padding-right: 0.3rem !important;
                }
                .dashboard-patient-table--today .dashboard-patient-col-actions-combined {
                    width: 18.5rem;
                    min-width: 18.5rem;
                }
                .dashboard-patient-table--today .dashboard-patient-col-name {
                    width: 20%;
                    min-width: 10.5rem;
                }
                .dashboard-patient-table--today .dashboard-patient-col-place {
                    width: 9%;
                    min-width: 6rem;
                }
                .dashboard-patient-table--today .dashboard-patient-col-mobile {
                    width: 5.5rem;
                }
                .dashboard-patient-table--today .dashboard-patient-col-status {
                    width: 5.75rem;
                }
                .dashboard-patient-table--today .dashboard-patient-col-apptime {
                    width: 5.5rem;
                }
                .dashboard-patient-actions-header span {
                    flex: 1 1 0;
                    text-align: center;
                    font-size: 0.72rem;
                    white-space: nowrap;
                }
                .dashboard-patient-table--today .dashboard-patient-actions-section--history,
                .dashboard-patient-table--today .dashboard-patient-actions-section--connect,
                .dashboard-patient-table--today .dashboard-patient-actions-header__history,
                .dashboard-patient-table--today .dashboard-patient-actions-header__connect {
                    flex: 1.4 1 0;
                    min-width: 5.75rem;
                }
                .dashboard-patient-table--today .dashboard-patient-actions-section--followup,
                .dashboard-patient-table--today .dashboard-patient-actions-header__followup {
                    flex: 0.75 1 0;
                    min-width: 2.75rem;
                }
                .dashboard-patient-actions-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.35rem;
                }
                .dashboard-patient-actions-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.35rem;
                }
                .dashboard-patient-actions-section {
                    flex: 1 1 0;
                    display: flex;
                    justify-content: center;
                    min-width: 0;
                }
                .dashboard-patient-name-wrap {
                    min-width: 0;
                    position: relative;
                    z-index: 2;
                }
                .dashboard-patient-col-name {
                    position: relative;
                    z-index: 2;
                }
                .dashboard-patient-name-link {
                    color: #25a0e2 !important;
                    text-decoration: none;
                    cursor: pointer;
                    position: relative;
                    z-index: 2;
                    pointer-events: auto;
                }
                .dashboard-patient-name-link:hover,
                .dashboard-patient-name-link:focus {
                    color: #2099d4 !important;
                    text-decoration: underline;
                }
                .dashboard-patient-name-text {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #495057;
                }
                .dashboard-patient-name-text--disabled {
                    color: #878a99;
                    cursor: default;
                    pointer-events: auto;
                }
                .dashboard-patient-name-wrap a,
                .dashboard-patient-name-wrap span {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .appointment-time-column {
                    min-width: 0;
                    vertical-align: middle;
                }
                .appointment-time-cell {
                    display: inline-flex;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 0.1rem;
                }
                .appointment-time-cell .edit {
                    flex: 0 0 auto;
                    line-height: 1;
                }
                .appointment-time-edit-modal .modal-dialog {
                    width: auto;
                    max-width: min(44rem, 96vw);
                }
                .appointment-time-modal-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.55rem;
                    flex-wrap: nowrap;
                    width: 100%;
                }
                .appointment-time-inline-picker-wrap {
                    flex: 1 1 auto;
                    min-width: 11.5rem;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .appointment-time-inline-picker-wrap .flatpickr-wrapper {
                    width: 100% !important;
                    display: inline-block !important;
                }
                .appointment-time-inline-picker-wrap .flatpickr-input {
                    display: none !important;
                }
                .appointment-time-inline-picker-wrap .flatpickr-calendar {
                    position: static !important;
                    display: inline-block !important;
                    width: 100% !important;
                    min-width: 11.5rem;
                    margin: 0;
                    box-shadow: none !important;
                    border: 1px solid #e9ecef;
                    border-radius: 0.45rem;
                    overflow: hidden;
                }
                .appointment-time-inline-picker-wrap .flatpickr-time {
                    max-height: none;
                    border-top: 0;
                    min-height: 2.35rem;
                    height: auto;
                    padding: 0.25rem 0.65rem;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                }
                .appointment-time-inline-picker-wrap .flatpickr-time .numInputWrapper {
                    width: 3rem;
                    height: 1.85rem;
                    flex: 0 0 auto;
                }
                .appointment-time-inline-picker-wrap .flatpickr-time input {
                    font-size: 0.9rem;
                    font-weight: 600;
                    height: 1.85rem;
                    width: 100%;
                }
                .appointment-time-inline-picker-wrap .flatpickr-time .flatpickr-am-pm {
                    font-size: 0.88rem;
                    font-weight: 600;
                    height: 1.85rem;
                    line-height: 1.85rem;
                    width: 3.25rem;
                    flex: 0 0 auto;
                    padding: 0 0.35rem;
                }
                .appointment-time-inline-picker-wrap .flatpickr-time .flatpickr-time-separator {
                    font-size: 0.95rem;
                    font-weight: 700;
                    padding: 0 0.15rem;
                    flex: 0 0 auto;
                }
                .appointment-time-selected-badge {
                    display: inline-flex;
                    align-items: center;
                    flex: 0 0 auto;
                    padding: 0.32rem 0.6rem;
                    border-radius: 999px;
                    background: rgba(37, 160, 226, 0.1);
                    color: #25a0e2;
                    font-size: 0.78rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .appointment-time-selected-badge i {
                    font-size: 0.9rem;
                }
                .appointment-time-value {
                    color: #495057;
                    font-weight: 500;
                    font-size: 0.8rem;
                    display: inline-block;
                    width: 4.25rem;
                    white-space: nowrap;
                }
            `}</style>
            <Col xl={9} className="d-flex">
                <Card className="card-height-100 flex-grow-1 doctor-appointments-card">




                    <CardHeader className="align-items-center d-flex flex-nowrap gap-1 doctor-dashboard-card-header doctor-patient-nav-tabs">
                        <Nav pills className="nav-customs doctor-patient-custom-nav mb-0 flex-shrink-0">
                            <NavItem>
                                <NavLink
                                    style={{ cursor: "pointer" }}
                                    className={classnames({ active: customHoverTab === "1" })}
                                    onClick={() => { customHovertoggle("1"); }}
                                >
                                    <i className="ri-user-fill doctor-patient-tab-icon" aria-hidden="true" />
                                    <span className="doctor-patient-tab-label">Today</span>
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    style={isReceptionUser ? { cursor: "not-allowed", opacity: 0.55, pointerEvents: "none" } : { cursor: "pointer" }}
                                    className={classnames({ active: customHoverTab === "2" })}
                                    onClick={() => { customHovertoggle("2"); }}
                                    aria-disabled={isReceptionUser}
                                >
                                    <i className="ri-file-text-line doctor-patient-tab-icon" aria-hidden="true" />
                                    <span className="doctor-patient-tab-label">All</span>
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <div className="doctor-dashboard-appointment-date flex-shrink-0">
                            <DateOfBirthPicker
                                name="dashboardAppointmentDate"
                                value={selectedAppointmentDate}
                                minDate={null}
                                maxDate={null}
                                placeholder={DOB_DISPLAY_FORMAT}
                                onChange={(dateStr) => {
                                    setSelectedAppointmentDate(dateStr);
                                    setTodayPage(1);
                                }}
                            />
                        </div>
                        <div className="d-flex align-items-center flex-nowrap gap-2 ms-sm-auto flex-shrink-0">
                            <div className="search-box">
                                <input
                                    type="text"
                                    className="form-control form-control-sm search"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <i className="ri-search-line search-icon"></i>
                            </div>
                            <div className="d-inline-flex gap-2">
                                <button type="button" className="btn btn-sm doctor-dashboard-toolbar-btn" onClick={openImportModal}><i className="ri-newspaper-line align-middle"></i> Import</button>
                                <button type="button" className="btn btn-sm doctor-dashboard-toolbar-btn" onClick={openExportModal}><i className="ri-file-list-3-line align-middle"></i> Export</button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0 doctor-patient-table-body">
                        <TabContent activeTab={customHoverTab} className="text-muted">
                            <TabPane tabId="1" id="custom-hover-customere">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0 dashboard-patient-table dashboard-patient-table--today">
                                        <thead>
                                            <tr>
                                                <th scope="col" className='text-center dashboard-patient-col-index'>#</th>
                                                <th scope="col" className="dashboard-patient-col-name">Name</th>
                                                <th scope="col" className="dashboard-patient-col-agesex">Age/Sex</th>
                                                <th scope="col" className="dashboard-patient-col-place">Place</th>
                                                <th scope="col" className="dashboard-patient-col-mobile">Mobile</th>
                                                <th scope="col" className="dashboard-patient-col-status">App.Status</th>
                                                <th scope="col" className="dashboard-patient-col-apptime">App.Time</th>
                                                <th scope="col" className="dashboard-patient-col-actions-combined">
                                                    <div className="dashboard-patient-actions-header">
                                                        <span className="dashboard-patient-actions-header__history">History</span>
                                                        <span className="dashboard-patient-actions-header__connect">Connect</span>
                                                        <span className="dashboard-patient-actions-header__followup">F/U</span>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appointmentListLoading ? (
                                                <tr>
                                                    <td colSpan={8} className='text-center text-muted'>
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
                                                    {renderTableRows(todayPageData, todayStartIndex, 'today', true)}
                                                    {todayPageData.length === 0 && !appointmentListLoading && (
                                                        <tr>
                                                            <td colSpan={8} className='text-center text-muted'>
                                                                {searchTerm ? 'No appointments found matching your search' : 'No appointments available'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {!appointmentListLoading && renderPagination(todayPage, todayTotalPages, handleTodayPageChange, filteredTodayPatients.length)}
                            </TabPane>

                            <TabPane tabId="2" id="custom-hover-customere">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0 dashboard-patient-table">
                                        <thead>
                                            <tr>
                                                <th scope="col" className='text-center dashboard-patient-col-index'>#</th>
                                                <th scope="col" className="dashboard-patient-col-name">Name</th>
                                                <th scope="col" className="dashboard-patient-col-agesex">Age/Sex</th>
                                                <th scope="col" className="dashboard-patient-col-place">Place</th>
                                                <th scope="col" className="dashboard-patient-col-mobile">Mobile</th>
                                                <th scope="col" className="dashboard-patient-col-actions-combined">
                                                    <div className="dashboard-patient-actions-header">
                                                        <span className="dashboard-patient-actions-header__history">History</span>
                                                        <span className="dashboard-patient-actions-header__connect">Connect</span>
                                                        <span className="dashboard-patient-actions-header__followup">F/U</span>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {patientListLoading ? (
                                                <tr>
                                                    <td colSpan={7} className='text-center text-muted'>
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
                                                    {renderTableRows(allPageData, allStartIndex, 'all')}
                                                    {allPageData.length === 0 && !patientListLoading && (
                                                        <tr>
                                                            <td colSpan={7} className='text-center text-muted'>
                                                                {searchTerm ? 'No patients found matching your search' : 'No patients available'}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {!patientListLoading && renderPagination(allPage, allTotalPages, handleAllPageChange, filteredAllPatients.length)}
                            </TabPane>


                        </TabContent>
                    </CardBody>



                    {/* Import Modal */}
                    <Modal
                        isOpen={importModal}
                        toggle={() => !importLoading && setImportModal(false)}
                        className="patient-list-modal new-patient-modal patient-import-modal"
                    >
                        <ModalHeader className="patient-list-modal__header" toggle={() => !importLoading && setImportModal(false)}>
                            <span className="patient-list-modal__title patient-list-modal__title--simple">
                                <i className="ri-upload-2-line" style={{ color: '#25a0e2', fontSize: 20 }} aria-hidden="true" />
                                <span className="patient-list-modal__title-text">Import Patients</span>
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-muted mb-3">
                                Download the sample file, fill patient details, then upload Excel or CSV.
                            </p>
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-sm doctor-dashboard-toolbar-btn"
                                    disabled={importTemplateLoading || importLoading}
                                    onClick={() => handleDownloadImportTemplate('excel')}
                                >
                                    <i className="ri-file-excel-2-line align-middle" /> Sample Excel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm doctor-dashboard-toolbar-btn"
                                    disabled={importTemplateLoading || importLoading}
                                    onClick={() => handleDownloadImportTemplate('csv')}
                                >
                                    <i className="ri-file-text-line align-middle" /> Sample CSV
                                </button>
                            </div>
                            <div>
                                <Label htmlFor="patientImportFile" className="form-label new-patient-modal__label">
                                    <i className="ri-attachment-2-line" aria-hidden="true" />
                                    Choose file
                                </Label>
                                <Input
                                    id="patientImportFile"
                                    type="file"
                                    innerRef={importFileInputRef}
                                    accept=".csv,.xlsx,.xls"
                                    disabled={importLoading}
                                    onChange={handleImportFileChange}
                                />
                                {importFile && (
                                    <small className="text-muted d-block mt-2">
                                        Selected: {importFile.name}
                                    </small>
                                )}
                            </div>
                            <small className="text-muted d-block mt-3">
                                Optional columns: Appointment Date and Appointment Time (to show patients on Today tab).
                                Duplicate mobiles are skipped and exported automatically.
                            </small>
                        </ModalBody>
                        <ModalFooter className="justify-content-end">
                            <ModalActionButton action="cancel" onClick={() => setImportModal(false)} disabled={importLoading} />
                            <ModalActionButton
                                action="import"
                                onClick={handleImportSubmit}
                                disabled={importLoading || !importFile}
                                loading={importLoading}
                                loadingLabel="Importing..."
                            />
                        </ModalFooter>
                    </Modal>

                    {/* Export Modal */}
                    <Modal
                        isOpen={exportModal}
                        toggle={() => !exportLoading && setExportModal(false)}
                        className="patient-list-modal new-patient-modal patient-export-modal"
                    >
                        <ModalHeader className="patient-list-modal__header" toggle={() => !exportLoading && setExportModal(false)}>
                            <span className="patient-list-modal__title patient-list-modal__title--simple">
                                <i className="ri-download-2-line" style={{ color: '#25a0e2', fontSize: 20 }} aria-hidden="true" />
                                <span className="patient-list-modal__title-text">Export Data</span>
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-muted mb-3">Choose what to export and select a file type.</p>
                            <div className="mb-3">
                                <Label className="form-label new-patient-modal__label">
                                    <i className="ri-filter-3-line" aria-hidden="true" />
                                    Export scope
                                </Label>
                                <div className="d-flex gap-3">
                                    <div className="form-check">
                                        <Input
                                            id="exportScopeToday"
                                            name="exportScope"
                                            type="radio"
                                            className="form-check-input"
                                            checked={exportScope === 'today'}
                                            disabled={exportLoading}
                                            onChange={() => setExportScope('today')}
                                        />
                                        <label className="form-check-label" htmlFor="exportScopeToday">Today</label>
                                    </div>
                                    <div className="form-check">
                                        <Input
                                            id="exportScopeAll"
                                            name="exportScope"
                                            type="radio"
                                            className="form-check-input"
                                            checked={exportScope === 'all'}
                                            disabled={exportLoading}
                                            onChange={() => setExportScope('all')}
                                        />
                                        <label className="form-check-label" htmlFor="exportScopeAll">All Patient</label>
                                    </div>
                                </div>
                                {exportScope === 'today' && (
                                    <small className="text-muted d-block mt-2">
                                        Uses dashboard date: {selectedAppointmentDate}
                                    </small>
                                )}
                            </div>
                            <div className="mb-1">
                                <Label htmlFor="exportFormatSelect" className="form-label new-patient-modal__label">
                                    <i className="ri-file-list-3-line" aria-hidden="true" />
                                    File type
                                </Label>
                                <Input
                                    id="exportFormatSelect"
                                    type="select"
                                    value={exportFormat}
                                    disabled={exportLoading}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="excel">Excel</option>
                                    <option value="csv">CSV</option>
                                </Input>
                            </div>
                        </ModalBody>
                        <ModalFooter className="justify-content-end">
                            <ModalActionButton action="cancel" onClick={() => setExportModal(false)} disabled={exportLoading} />
                            <ModalActionButton
                                action="download"
                                onClick={handleExportDownload}
                                disabled={exportLoading}
                                loading={exportLoading}
                                loadingLabel="Downloading..."
                            />
                        </ModalFooter>
                    </Modal>
                </Card>
            </Col>
            {/* History Modal */}
            <Modal size="lg" isOpen={historyModalOpen} toggle={closeHistoryModal} className="patient-list-modal history-patient-modal">
                <ModalHeader className="patient-list-modal__header" toggle={closeHistoryModal}>
                    <span className="patient-list-modal__title patient-list-modal__title--simple">
                        <i className="ri-history-line" style={{ color: '#25a0e2', fontSize: 20 }} />
                        <span className="patient-list-modal__title-text">
                            {selectedPatientForHistory
                                ? `${selectedPatientForHistory.patientName || selectedPatientForHistory.name || 'Patient'}'s History`
                                : 'History'}
                        </span>
                    </span>
                </ModalHeader>
                <ModalBody className="position-relative">
                    {appointmentsLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading appointments...</p>
                        </div>
                    ) : patientAppointments.length === 0 ? (
                        <div className="patient-list-modal__empty">
                            <span className="patient-list-modal__empty-icon" aria-hidden="true">
                                <i className="ri-history-line" />
                            </span>
                            No appointment history found.
                        </div>
                    ) : (
                        <div className="patient-list-modal__table-wrap history-patient-modal__accordion-wrap">
                            <Accordion id="history-accordion" className="accordion-flush history-patient-modal__accordion mb-0">
                            {patientAppointments.map((appointment) => {
                                const appointmentId = appointment.patientAppId;
                                const isOpen = openAppointmentId === appointmentId;
                                const isLoadingPrescription = prescriptionLoadingId === appointmentId;

                                return (
                                    <AccordionItem key={appointmentId}>
                                        <h2 className="accordion-header" id={`historyAccHeading-${appointmentId}`}>
                                            <button
                                                className={`accordion-button ${!isOpen ? 'collapsed' : ''}`}
                                                type="button"
                                                onClick={() => handleAppointmentAccordionToggle(appointment)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {formatAppointmentAccordionTitle(appointment)}
                                            </button>
                                        </h2>
                                        <Collapse isOpen={isOpen} className="accordion-collapse">
                                            <div className="accordion-body">
                                                {isLoadingPrescription ? (
                                                    <div className="text-center py-3">
                                                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        Loading prescription...
                                                    </div>
                                                ) : (
                                                    renderPrescriptionTable(appointmentId)
                                                )}
                                            </div>
                                        </Collapse>
                                    </AccordionItem>
                                );
                            })}
                            </Accordion>
                        </div>
                    )}
                    {renderMedicineTooltipPopup()}
                </ModalBody>
                <ModalFooter>
                    <ModalActionButton action="close" onClick={closeHistoryModal} />
                </ModalFooter>
            </Modal>

            {/* Add Case Notes Modal */}
            <Modal size="lg" isOpen={addCaseModalOpen} toggle={closeAddCaseModal}>
                <ModalHeader toggle={closeAddCaseModal}>Add Case Notes</ModalHeader>
                <ModalBody>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Patient Name</label>
                            <Input type="text" value={addCaseForm.patientName} onChange={(e) => setAddCaseForm({ ...addCaseForm, patientName: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Prescription Type</label>
                            <Input type="select" value={addCaseForm.prescriptionType} onChange={(e) => setAddCaseForm({ ...addCaseForm, prescriptionType: e.target.value })}>
                                <option>New Prescription</option>
                                <option>Follow-up</option>
                                <option>Emergency</option>
                            </Input>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Notes</label>
                            <CKEditor editor={ClassicEditor} data={addCaseForm.notes} onChange={(event, editor) => setAddCaseForm({ ...addCaseForm, notes: editor.getData() })} />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <ModalActionButton action="cancel" onClick={closeAddCaseModal} />
                    <ModalActionButton action="save" onClick={closeAddCaseModal} />
                </ModalFooter>
            </Modal>

            {/* Case Notes Modal */}
            <Modal size="xl" isOpen={caseNotesModalOpen} toggle={closeCaseNotesModal} className="patient-list-modal case-notes-modal">
                <ModalHeader className="patient-list-modal__header" toggle={closeCaseNotesModal}>
                    <span className="patient-list-modal__title patient-list-modal__title--simple">
                        <i className="ri-file-text-line" style={{ color: '#25a0e2', fontSize: 20 }} />
                        <span className="patient-list-modal__title-text">
                            {selectedPatientForCaseNotes ? `${selectedPatientForCaseNotes.name}'s Case Notes` : 'Case Notes'}
                        </span>
                    </span>
                </ModalHeader>
                <ModalBody>
                    {appointmentHistoryNotesLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading case notes...</p>
                        </div>
                    ) : caseNotesTabs.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">No case notes available for this patient.</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            <div className="col-md-3">
                                <Nav pills className="flex-column case-notes-modal__history-nav">
                                    {caseNotesTabs.map(tab => (
                                        <NavItem key={tab.id} className='mb-2'>
                                            <NavLink
                                                style={{ cursor: 'pointer' }}
                                                className={`${caseNotesActive === tab.id ? 'active' : ''} text-center w-100`}
                                                onClick={() => handleSelectCaseNoteTab(tab)}
                                            >
                                                {tab.title}
                                            </NavLink>
                                        </NavItem>
                                    ))}
                                </Nav>
                            </div>
                            <div className="col-md-9">
                                <Label className="form-label case-notes-modal__label">
                                    <i className="ri-sticky-note-line" />
                                    Case Notes
                                </Label>
                                <div className="case-notes-modal__editor-wrap">
                                    <Editor
                                        wrapperClassName="demo-wrapper"
                                        editorClassName="demo-editor"
                                        editorState={caseNoteEditorState}
                                        onEditorStateChange={handleCaseNoteEditorChange}
                                        toolbarClassName="toolbar-class"
                                        wrapperStyle={{
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#e2ebf3',
                                        }}
                                        editorStyle={{
                                            border: 'none',
                                            backgroundColor: '#FFFFFF',
                                            minHeight: '420px',
                                            height: '420px',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <ModalActionButton action="close" onClick={closeCaseNotesModal} disabled={savingCaseNote} />
                    {caseNotesTabs.length > 0 && (
                        <ModalActionButton
                            action="save"
                            onClick={handleSaveCaseNote}
                            disabled={savingCaseNote}
                            loading={savingCaseNote}
                            loadingLabel="Saving..."
                        />
                    )}
                </ModalFooter>
            </Modal>
            {/* Edit Patient Modal */}
            <Modal size="lg" isOpen={editModalOpen} toggle={closeEditModal} className="patient-list-modal new-patient-modal edit-patient-modal">
                <ModalHeader className="patient-list-modal__header" toggle={closeEditModal}>
                    <span className="patient-list-modal__title patient-list-modal__title--simple">
                        <i className="ri-user-settings-line" style={{ color: '#25a0e2', fontSize: 20 }} />
                        <span className="patient-list-modal__title-text">Edit Patient</span>
                    </span>
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
                                        id="genderMale"
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
                                        id="genderFemale"
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
            <CaseTakingModeModal
                isOpen={caseTakingModalOpen}
                toggle={closeCaseTakingModal}
                patientName={formatPatientDisplayName(selectedPatientForCaseTaking?.name
                    ?? selectedPatientForCaseTaking?.patientName)}
                onManual={handleManualCaseTaking}
                onAudio={handleAudioCaseTaking}
            />
        </React.Fragment>
    );
};

export default BestSellingProducts;