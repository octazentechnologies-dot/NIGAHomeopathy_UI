import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
  UncontrolledTooltip,
} from "reactstrap";
import moment from "moment";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import TeleCallFlow from "./TeleCallFlow";
import "./telemedicine.css";

const PAGE_SIZE = 5;
const KPI_MODAL_PAGE_SIZE = 5;

const DEFAULT_HOURS = [
  { id: 1, start: "09:00 AM", end: "01:00 PM" },
  { id: 2, start: "05:00 PM", end: "08:00 PM" },
];

const WEEK_DAYS = [
  { id: "monday", label: "Mon", momentKey: "Monday" },
  { id: "tuesday", label: "Tue", momentKey: "Tuesday" },
  { id: "wednesday", label: "Wed", momentKey: "Wednesday" },
  { id: "thursday", label: "Thu", momentKey: "Thursday" },
  { id: "friday", label: "Fri", momentKey: "Friday" },
  { id: "saturday", label: "Sat", momentKey: "Saturday" },
  { id: "sunday", label: "Sun", momentKey: "Sunday" },
];

const DEFAULT_ACTIVE_DAYS = WEEK_DAYS.reduce((acc, day) => {
  acc[day.id] = day.id !== "sunday";
  return acc;
}, {});

const TELE_PATIENTS = [
  {
    id: 1,
    time: "09:30 AM",
    patient: "Rohan Mehta",
    ageSex: "34y / M",
    mobile: "9876543210",
    amount: 800,
    paymentStatus: "Paid",
    consultType: "instant",
    queueStatus: "Instant",
  },
  {
    id: 2,
    time: "10:00 AM",
    patient: "Sneha Patil",
    ageSex: "29y / F",
    mobile: "9123456780",
    amount: 600,
    paymentStatus: "Unpaid",
    consultType: "scheduled",
    queueStatus: "Waiting",
  },
  {
    id: 3,
    time: "10:30 AM",
    patient: "Amit Shah",
    ageSex: "47y / M",
    mobile: "9988776655",
    amount: 800,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Scheduled",
  },
  {
    id: 4,
    time: "11:15 AM",
    patient: "Priya Desai",
    ageSex: "37y / F",
    mobile: "9090909090",
    amount: 800,
    paymentStatus: "Unpaid",
    consultType: "scheduled",
    queueStatus: "Waiting",
  },
  {
    id: 5,
    time: "12:00 PM",
    patient: "Vikram Joshi",
    ageSex: "52y / M",
    mobile: "9811122233",
    amount: 600,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Scheduled",
  },
  {
    id: 6,
    time: "05:30 PM",
    patient: "Neha Joshi",
    ageSex: "26y / F",
    mobile: "9900112233",
    amount: 600,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Scheduled",
  },
  {
    id: 7,
    time: "06:00 PM",
    patient: "Karan Shah",
    ageSex: "41y / M",
    mobile: "9876501234",
    amount: 800,
    paymentStatus: "Unpaid",
    consultType: "scheduled",
    queueStatus: "Scheduled",
  },
  {
    id: 8,
    time: "08:00 AM",
    patient: "Ananya Rao",
    ageSex: "31y / F",
    mobile: "9765432109",
    amount: 600,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
  {
    id: 9,
    time: "08:30 AM",
    patient: "Meera Iyer",
    ageSex: "44y / F",
    mobile: "9822012345",
    amount: 800,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
  {
    id: 10,
    time: "09:00 AM",
    patient: "Rajesh Nair",
    ageSex: "55y / M",
    mobile: "9811098765",
    amount: 600,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
  {
    id: 11,
    time: "09:15 AM",
    patient: "Kavita Menon",
    ageSex: "38y / F",
    mobile: "9876509876",
    amount: 800,
    paymentStatus: "Unpaid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
  {
    id: 12,
    time: "09:45 AM",
    patient: "Suresh Pillai",
    ageSex: "49y / M",
    mobile: "9900887766",
    amount: 600,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
  {
    id: 13,
    time: "10:15 AM",
    patient: "Divya Krishnan",
    ageSex: "33y / F",
    mobile: "9123098765",
    amount: 800,
    paymentStatus: "Paid",
    consultType: "scheduled",
    queueStatus: "Completed",
  },
];

const KPI_MODAL_CONFIG = {
  Scheduled: {
    title: "Scheduled Patients",
    icon: "ri-calendar-check-line",
    emptyLabel: "No scheduled patients available",
    match: (row) => row.queueStatus === "Scheduled",
  },
  Waiting: {
    title: "Waiting Patients",
    icon: "ri-hourglass-line",
    emptyLabel: "No waiting patients available",
    match: (row) => row.queueStatus === "Waiting",
  },
  Completed: {
    title: "Completed Patients",
    icon: "ri-checkbox-circle-line",
    emptyLabel: "No completed patients available",
    match: (row) => row.queueStatus === "Completed",
  },
  Instant: {
    title: "Instant Consultation Queue",
    icon: "ri-smartphone-line",
    emptyLabel: "No instant consultation requests right now",
    match: (row) => row.consultType === "instant" || row.queueStatus === "Instant",
  },
};

const formatAmount = (amount) =>
  `₹ ${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

const paymentStatusBadgeClass = (status) =>
  status === "Paid" ? "bg-success" : "bg-danger";

const parseSlotMoment = (timeStr) => moment(timeStr, ["hh:mm A", "h:mm A", "HH:mm"]);

const getSlotDurationHours = (start, end) => {
  const startAt = parseSlotMoment(start);
  const endAt = parseSlotMoment(end);
  if (!startAt.isValid() || !endAt.isValid()) return 0;
  const mins = Math.max(0, endAt.diff(startAt, "minutes"));
  return Math.round((mins / 60) * 10) / 10;
};

const formatDuration = (hours) => {
  if (!hours) return "—";
  return `${hours}h`;
};

const getSessionLabel = (start) => {
  const hour = parseSlotMoment(start).hour();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const getModalVisiblePageItems = (currentPage, totalPages) => {
  const total = Math.max(0, Number(totalPages) || 0);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), Math.max(total, 1));
  if (total <= 0) return [];
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, 2, total, current]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  let prev = 0;
  sorted.forEach((page) => {
    if (prev && page - prev > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    prev = page;
  });
  return items;
};

const CompactModalPaginationPages = ({ currentPage, totalPages, onPageChange }) => {
  const items = getModalVisiblePageItems(currentPage, totalPages);
  let ellipsisKey = 0;
  return items.map((item) => {
    if (item === "ellipsis") {
      ellipsisKey += 1;
      return (
        <PaginationItem key={`ellipsis-${ellipsisKey}`} disabled>
          <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
            …
          </PaginationLink>
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

const TelePatientActionButtons = ({ row, idPrefix = "tele", showJoin = true, onJoin }) => (
  <div className="dashboard-patient-action-group d-inline-flex align-items-center justify-content-end flex-nowrap gap-1">
    {showJoin && (
      <>
        <button
          type="button"
          id={`${idPrefix}-join-${row.id}`}
          className="btn btn-sm btn-soft-primary"
          aria-label="Join call"
          onClick={() => onJoin?.(row)}
        >
          <i className="ri-vidicon-line" />
        </button>
        <UncontrolledTooltip placement="top" target={`${idPrefix}-join-${row.id}`}>
          Join Call
        </UncontrolledTooltip>
      </>
    )}
    <button
      type="button"
      id={`${idPrefix}-edit-${row.id}`}
      className="btn btn-sm btn-soft-success edit-item-btn"
      aria-label="Edit"
    >
      <i className="ri-pencil-fill" />
    </button>
    <UncontrolledTooltip placement="top" target={`${idPrefix}-edit-${row.id}`}>
      Edit
    </UncontrolledTooltip>
    <button
      type="button"
      id={`${idPrefix}-del-${row.id}`}
      className="btn btn-sm btn-soft-danger remove-item-btn"
      aria-label="Delete"
    >
      <i className="ri-delete-bin-5-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`${idPrefix}-del-${row.id}`}>
      Delete
    </UncontrolledTooltip>
  </div>
);

const TelePatientNameCell = ({ row, idPrefix = "tele" }) => (
  <div className="telemedicine-patient-name">
    {row.consultType === "instant" && (
      <>
        <span
          id={`${idPrefix}-instant-${row.id}`}
          className="telemedicine-instant-icon"
          aria-label="Instant consultation"
        >
          <i className="ri-flashlight-fill" aria-hidden="true" />
        </span>
        <UncontrolledTooltip placement="top" target={`${idPrefix}-instant-${row.id}`}>
          Instant Consult
        </UncontrolledTooltip>
      </>
    )}
    <span>{row.patient}</span>
  </div>
);

const COMPLETED_CHAT_SAMPLE = [
  {
    id: 1,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:02 AM",
    text: "Please share your previous reports.",
  },
  {
    id: 2,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:02 AM",
    file: { name: "report.pdf", size: "2.4 MB" },
  },
  {
    id: 3,
    from: "patient",
    name: "Patient",
    time: "10:04 AM",
    text: "Here is the report.",
  },
  {
    id: 4,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:05 AM",
    text: "Thank you. Continue the remedy as advised.",
  },
];

const COMPLETED_RX_SAMPLE = {
  remedy: "Belladonna 30C",
  potency: "30C",
  dosage: "4 pills, thrice daily",
  duration: "3 days",
  instructions: "Take after food. Avoid coffee and mint.",
};

const CompletedRecordsButtons = ({ row, onOpenChat, onOpenRx }) => (
  <div className="dashboard-patient-action-group d-inline-flex align-items-center justify-content-center flex-nowrap gap-1">
    <button
      type="button"
      id={`kpi-chat-${row.id}`}
      className="btn btn-sm btn-soft-info"
      aria-label="Chat history"
      onClick={() => onOpenChat(row)}
    >
      <i className="ri-chat-history-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`kpi-chat-${row.id}`}>
      Chat History
    </UncontrolledTooltip>
    <button
      type="button"
      id={`kpi-rx-${row.id}`}
      className="btn btn-sm btn-soft-primary"
      aria-label="Prescription"
      onClick={() => onOpenRx(row)}
    >
      <i className="ri-file-list-3-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`kpi-rx-${row.id}`}>
      Prescription
    </UncontrolledTooltip>
  </div>
);

const CompletedChatHistoryModal = ({ isOpen, toggle, patient }) => (
  <Modal
    isOpen={isOpen}
    toggle={toggle}
    className="patient-list-modal telemedicine-detail-modal"
    centered
    size="md"
    zIndex={11000}
  >
    <ModalHeader toggle={toggle} className="patient-list-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <i className="ri-chat-history-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
        <span className="patient-list-modal__title-text">
          Chat History{patient?.patient ? ` · ${patient.patient}` : ""}
        </span>
      </span>
    </ModalHeader>
    <ModalBody>
      <div className="telemedicine-chat-history">
        {COMPLETED_CHAT_SAMPLE.map((msg) => (
          <div
            key={msg.id}
            className={`telemedicine-chat-history__msg ${
              msg.from === "patient" ? "telemedicine-chat-history__msg--mine" : ""
            }`}
          >
            <div className="telemedicine-chat-history__meta">
              <strong>{msg.from === "patient" ? patient?.patient || "Patient" : msg.name}</strong>
              <span>{msg.time}</span>
            </div>
            {msg.text && <div className="telemedicine-chat-history__bubble">{msg.text}</div>}
            {msg.file && (
              <div className="telemedicine-chat-history__file">
                <i className="ri-file-pdf-2-line" aria-hidden="true" />
                <div>
                  <strong>{msg.file.name}</strong>
                  <span>{msg.file.size}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ModalBody>
    <ModalFooter>
      <ModalActionButton action="close" onClick={toggle} />
    </ModalFooter>
  </Modal>
);

const CompletedPrescriptionModal = ({ isOpen, toggle, patient }) => (
  <Modal
    isOpen={isOpen}
    toggle={toggle}
    className="patient-list-modal telemedicine-detail-modal"
    centered
    size="md"
    zIndex={11000}
  >
    <ModalHeader toggle={toggle} className="patient-list-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <i className="ri-file-list-3-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
        <span className="patient-list-modal__title-text">
          Prescription{patient?.patient ? ` · ${patient.patient}` : ""}
        </span>
      </span>
    </ModalHeader>
    <ModalBody>
      <div className="telemedicine-rx-detail">
        <div className="telemedicine-rx-detail__row">
          <span>Remedy</span>
          <strong>{COMPLETED_RX_SAMPLE.remedy}</strong>
        </div>
        <div className="telemedicine-rx-detail__row">
          <span>Potency</span>
          <strong>{COMPLETED_RX_SAMPLE.potency}</strong>
        </div>
        <div className="telemedicine-rx-detail__row">
          <span>Dosage</span>
          <strong>{COMPLETED_RX_SAMPLE.dosage}</strong>
        </div>
        <div className="telemedicine-rx-detail__row">
          <span>Duration</span>
          <strong>{COMPLETED_RX_SAMPLE.duration}</strong>
        </div>
        <div className="telemedicine-rx-detail__row telemedicine-rx-detail__row--block">
          <span>Instructions</span>
          <strong>{COMPLETED_RX_SAMPLE.instructions}</strong>
        </div>
      </div>
    </ModalBody>
    <ModalFooter>
      <ModalActionButton action="close" onClick={toggle} />
    </ModalFooter>
  </Modal>
);

const TeleKpiListModal = ({ isOpen, toggle, kpiKey, patients }) => {
  const config = KPI_MODAL_CONFIG[kpiKey] || KPI_MODAL_CONFIG.Scheduled;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailPatient, setDetailPatient] = useState(null);
  const [detailType, setDetailType] = useState(null);
  const isCompleted = kpiKey === "Completed";
  const colCount = isCompleted ? 9 : 8;

  useEffect(() => {
    if (!isOpen) return;
    setSearchTerm("");
    setCurrentPage(1);
    setDetailPatient(null);
    setDetailType(null);
  }, [isOpen, kpiKey]);

  const sourcePatients = useMemo(
    () => patients.filter((row) => config.match(row)),
    [patients, config]
  );

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return sourcePatients;
    return sourcePatients.filter((row) =>
      [
        row.time,
        row.patient,
        row.ageSex,
        row.mobile,
        row.amount,
        row.paymentStatus,
        row.consultType,
        row.queueStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [sourcePatients, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / KPI_MODAL_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * KPI_MODAL_PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + KPI_MODAL_PAGE_SIZE);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openChat = (row) => {
    setDetailPatient(row);
    setDetailType("chat");
  };

  const openRx = (row) => {
    setDetailPatient(row);
    setDetailType("rx");
  };

  const closeDetail = () => {
    setDetailPatient(null);
    setDetailType(null);
  };

  return (
    <>
      <Modal size="xl" isOpen={isOpen} toggle={toggle} className="patient-list-modal">
        <ModalHeader className="patient-list-modal__header" toggle={toggle}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className={config.icon}
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">{config.title}</span>
          </span>
          <div className="patient-list-modal__header-actions">
            <div className="patient-list-modal__search">
              <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
              <Input
                size="sm"
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="table-responsive patient-list-modal__table-wrap">
            <table className="table mb-0 align-middle patient-list-modal__table telemedicine-patient-table">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="text-center patient-list-modal__th-index"
                    style={{ width: "5%" }}
                  >
                    #
                  </th>
                  <th scope="col">Time</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Age / Sex</th>
                  <th scope="col">Mobile</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  {isCompleted && (
                    <th scope="col" className="text-center">
                      Records
                    </th>
                  )}
                  <th scope="col" className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row, index) => (
                  <tr key={`${kpiKey}-${row.id}`}>
                    <td className="text-center patient-list-modal__index">
                      {startIndex + index + 1}
                    </td>
                    <td className="text-nowrap">{row.time}</td>
                    <td>
                      <TelePatientNameCell row={row} idPrefix={`kpi-${kpiKey}`} />
                    </td>
                    <td>{row.ageSex}</td>
                    <td>{row.mobile}</td>
                    <td className="text-nowrap fw-semibold">{formatAmount(row.amount)}</td>
                    <td>
                      <span
                        className={`badge patient-list-modal__status ${paymentStatusBadgeClass(
                          row.paymentStatus
                        )}`}
                      >
                        <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                        {row.paymentStatus}
                      </span>
                    </td>
                    {isCompleted && (
                      <td className="text-center">
                        <CompletedRecordsButtons
                          row={row}
                          onOpenChat={openChat}
                          onOpenRx={openRx}
                        />
                      </td>
                    )}
                    <td className="text-end">
                      <TelePatientActionButtons
                        row={row}
                        idPrefix={`kpi-${kpiKey}`}
                        showJoin={false}
                      />
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={colCount} className="text-center text-muted py-4">
                      {searchTerm ? "No patients found matching your search" : config.emptyLabel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
            <div className="text-muted patient-list-modal__footer-text">
              {`Showing ${pageItems.length} of ${filtered.length} Patients ${
                searchTerm
                  ? `(filtered from ${sourcePatients.length} total)`
                  : `(from ${sourcePatients.length} total)`
              }`}
            </div>
            {filtered.length > 0 && (
              <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
                <PaginationItem disabled={safePage === 1}>
                  <PaginationLink
                    href="#"
                    previous
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.max(1, safePage - 1));
                    }}
                  />
                </PaginationItem>
                <CompactModalPaginationPages
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
                <PaginationItem disabled={safePage === totalPages}>
                  <PaginationLink
                    href="#"
                    next
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(Math.min(totalPages, safePage + 1));
                    }}
                  />
                </PaginationItem>
              </Pagination>
            )}
          </div>
        </ModalBody>
      </Modal>

      <CompletedChatHistoryModal
        isOpen={detailType === "chat"}
        toggle={closeDetail}
        patient={detailPatient}
      />
      <CompletedPrescriptionModal
        isOpen={detailType === "rx"}
        toggle={closeDetail}
        patient={detailPatient}
      />
    </>
  );
};

const TelemedicineDashboard = () => {
  document.title = "Telemedicine | Niga Homeocentrum";

  const [isOnline, setIsOnline] = useState(true);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingOnline, setPendingOnline] = useState(null);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [activeDays, setActiveDays] = useState(DEFAULT_ACTIVE_DAYS);
  const [editHoursOpen, setEditHoursOpen] = useState(false);
  const [draftHours, setDraftHours] = useState(DEFAULT_HOURS);
  const [draftActiveDays, setDraftActiveDays] = useState(DEFAULT_ACTIVE_DAYS);
  const [kpiModalKey, setKpiModalKey] = useState(null);
  const [callPatient, setCallPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const scheduledCount = TELE_PATIENTS.filter((row) => row.queueStatus === "Scheduled").length;
  const waitingCount = TELE_PATIENTS.filter((row) => row.queueStatus === "Waiting").length;
  const completedCount = TELE_PATIENTS.filter((row) => row.queueStatus === "Completed").length;
  const instantCount = TELE_PATIENTS.filter(
    (row) => row.consultType === "instant" || row.queueStatus === "Instant"
  ).length;

  const dateWiseHours = useMemo(() => {
    const enrichedSlots = hours.map((slot) => {
      const durationHours = getSlotDurationHours(slot.start, slot.end);
      return {
        ...slot,
        session: getSessionLabel(slot.start),
        durationHours,
        durationLabel: formatDuration(durationHours),
      };
    });
    const totalHours = enrichedSlots.reduce((sum, slot) => sum + slot.durationHours, 0);

    return [0, 1, 2, 3, 4].map((offset) => {
      const date = moment().add(offset, "day");
      const weekdayId = date.format("dddd").toLowerCase();
      const isActive = Boolean(activeDays[weekdayId]);
      const daySlots = isActive ? enrichedSlots : [];
      const dayTotal = daySlots.reduce((sum, slot) => sum + slot.durationHours, 0);
      return {
        key: date.format("YYYY-MM-DD"),
        label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.format("ddd"),
        dateDisplay: date.format("DD MMM YYYY"),
        isActive,
        slotCount: daySlots.length,
        totalHours: dayTotal,
        totalLabel: isActive ? formatDuration(dayTotal) : "Closed",
        slots: daySlots,
      };
    });
  }, [hours, activeDays]);

  const filteredPatients = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return TELE_PATIENTS;
    return TELE_PATIENTS.filter((row) =>
      [
        row.time,
        row.patient,
        row.ageSex,
        row.mobile,
        row.amount,
        row.paymentStatus,
        row.consultType,
        row.queueStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedPatients = filteredPatients.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openEditHours = () => {
    setDraftHours(hours.map((slot) => ({ ...slot })));
    setDraftActiveDays({ ...activeDays });
    setEditHoursOpen(true);
  };

  const saveHours = () => {
    setHours(draftHours.map((slot) => ({ ...slot })));
    setActiveDays({ ...draftActiveDays });
    setEditHoursOpen(false);
  };

  const updateDraftHour = (id, field, value) => {
    setDraftHours((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const toggleDraftDay = (dayId) => {
    setDraftActiveDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  const openKpiModal = (key) => setKpiModalKey(key);
  const closeKpiModal = () => setKpiModalKey(null);

  const requestStatusChange = (nextOnline) => {
    if (nextOnline === isOnline) return;
    setPendingOnline(nextOnline);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (pendingOnline !== null) {
      setIsOnline(pendingOnline);
    }
    setPendingOnline(null);
    setStatusConfirmOpen(false);
  };

  const cancelStatusChange = () => {
    setPendingOnline(null);
    setStatusConfirmOpen(false);
  };

  const renderKpiCard = ({ key, count, label, icon }) => (
    <div
      className="col telemedicine-kpi-col"
      onClick={() => openKpiModal(key)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openKpiModal(key);
        }
      }}
    >
      <div className="card-animate card mb-2 doctor-kpi-card">
        <div className="card-body d-flex gap-3 align-items-center">
          <div className="avatar-sm flex-shrink-0">
            <div className="avatar-title border bg-info-subtle border-info border-opacity-25 rounded-2 fs-17 doctor-kpi-icon">
              <i className={`${icon} fs-22`} aria-hidden="true" />
            </div>
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <h5 className="fs-15 doctor-kpi-count">{count}</h5>
            <p className="mb-0 text-muted doctor-kpi-label">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <div className="page-content doctor-dashboard-page telemedicine-dashboard-page">
        <Container fluid>
          <div className="row doctor-dashboard-kpi-row telemedicine-kpi-row">
            <div className="col telemedicine-kpi-col">
              <div className="card-animate card mb-2 doctor-kpi-card telemedicine-status-kpi">
                <div className="card-body d-flex gap-3 align-items-center">
                  <label className="telemedicine-toggle mb-0" htmlFor="teleStatusToggle">
                    <input
                      id="teleStatusToggle"
                      type="checkbox"
                      checked={isOnline}
                      readOnly
                      onClick={(e) => {
                        e.preventDefault();
                        requestStatusChange(!isOnline);
                      }}
                    />
                    <span className="telemedicine-toggle__track" aria-hidden="true" />
                  </label>
                  <div className="flex-grow-1 overflow-hidden">
                    <h5 className="fs-15 doctor-kpi-count mb-0">
                      {isOnline ? "Online" : "Offline"}
                    </h5>
                    <p className="mb-0 text-muted doctor-kpi-label">TELEMEDICINE STATUS</p>
                  </div>
                </div>
              </div>
            </div>

            {renderKpiCard({
              key: "Scheduled",
              count: scheduledCount,
              label: "SCHEDULED",
              icon: "ri-calendar-check-line",
            })}
            {renderKpiCard({
              key: "Waiting",
              count: waitingCount,
              label: "WAITING",
              icon: "ri-hourglass-line",
            })}
            {renderKpiCard({
              key: "Completed",
              count: completedCount,
              label: "COMPLETED",
              icon: "ri-checkbox-circle-line",
            })}
            {renderKpiCard({
              key: "Instant",
              count: instantCount,
              label: "INSTANT CONSULT",
              icon: "ri-smartphone-line",
            })}
          </div>

          <Row className="g-2 mt-1 telemedicine-content-row align-items-stretch">
            <Col lg={8}>
              <Card className="telemedicine-panel-card h-100 mb-0">
                <CardHeader className="telemedicine-panel-card__header">
                  <h5 className="telemedicine-panel-card__title mb-0">
                    Telemedicine Patients
                  </h5>
                  <div className="search-box telemedicine-panel-search">
                    <input
                      type="text"
                      className="form-control form-control-sm search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="ri-search-line search-icon" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardBody className="p-0 doctor-patient-table-body">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle dashboard-patient-table telemedicine-patient-table">
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Patient</th>
                          <th scope="col">Age / Sex</th>
                          <th scope="col">Mobile</th>
                          <th scope="col">Amount</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedPatients.map((row) => (
                          <tr key={row.id}>
                            <td className="text-nowrap">{row.time}</td>
                            <td>
                              <TelePatientNameCell row={row} idPrefix="list" />
                            </td>
                            <td>{row.ageSex}</td>
                            <td>{row.mobile}</td>
                            <td className="text-nowrap fw-semibold">{formatAmount(row.amount)}</td>
                            <td>
                              <span
                                className={`badge patient-list-modal__status ${paymentStatusBadgeClass(
                                  row.paymentStatus
                                )}`}
                              >
                                <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                                {row.paymentStatus}
                              </span>
                            </td>
                            <td className="text-end">
                              <TelePatientActionButtons
                                row={row}
                                idPrefix="list"
                                onJoin={setCallPatient}
                              />
                            </td>
                          </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-3">
                              {searchTerm
                                ? "No patients found matching your search"
                                : "No telemedicine patients available"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredPatients.length > 0 && (
                    <div className="align-items-center px-3 py-2 my-2 justify-content-between row text-center text-sm-start">
                      <div className="col-sm">
                        <div className="text-muted">
                          Showing{" "}
                          <span className="fw-semibold">
                            {Math.min(pageStart + 1, filteredPatients.length)}
                          </span>{" "}
                          to{" "}
                          <span className="fw-semibold">
                            {Math.min(pageStart + PAGE_SIZE, filteredPatients.length)}
                          </span>{" "}
                          of <span className="fw-semibold">{filteredPatients.length}</span> Results
                        </div>
                      </div>
                      <div className="col-sm-auto mt-3 mt-sm-0">
                        <ul className="pagination pagination-separated pagination-sm mb-0 justify-content-center doctor-dashboard-pagination">
                          <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              type="button"
                              aria-label="Previous page"
                              disabled={safePage === 1}
                              onClick={() => setCurrentPage(safePage - 1)}
                            >
                              ←
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <li
                              key={page}
                              className={`page-item ${page === safePage ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                type="button"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${safePage === totalPages ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              type="button"
                              aria-label="Next page"
                              disabled={safePage === totalPages}
                              onClick={() => setCurrentPage(safePage + 1)}
                            >
                              →
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="telemedicine-panel-card h-100 mb-0">
                <CardHeader className="telemedicine-panel-card__header">
                  <h5 className="telemedicine-panel-card__title mb-0">
                    Consultation Hours
                  </h5>
                  <button
                    type="button"
                    className="telemedicine-edit-link"
                    onClick={openEditHours}
                  >
                    <i className="ri-edit-box-line" aria-hidden="true" />
                    Edit
                  </button>
                </CardHeader>
                <CardBody className="telemedicine-date-hours-body">
                  <div className="telemedicine-date-hours-list">
                    {dateWiseHours.map((day) => (
                      <div key={day.key} className="telemedicine-date-hours-item">
                        <div className="telemedicine-date-hours-item__head">
                          <div className="telemedicine-date-hours-item__title">
                            <span className="telemedicine-date-hours-item__label">{day.label}</span>
                            <span className="telemedicine-date-hours-item__date">{day.dateDisplay}</span>
                          </div>
                          <span className="telemedicine-date-hours-item__meta">
                            {day.isActive
                              ? `${day.slotCount} slots · ${day.totalLabel}`
                              : "Closed"}
                          </span>
                        </div>
                        {day.isActive ? (
                          <ul className="telemedicine-hours-list mb-0">
                            {day.slots.map((slot) => (
                              <li key={`${day.key}-${slot.id}`}>
                                <span className="telemedicine-hours-list__icon" aria-hidden="true">
                                  <i className="ri-time-line" />
                                </span>
                                <div className="telemedicine-hours-list__content">
                                  <div className="telemedicine-hours-list__row">
                                    <span className="telemedicine-hours-list__session">{slot.session}</span>
                                    <span className="telemedicine-hours-list__duration">{slot.durationLabel}</span>
                                  </div>
                                  <span className="telemedicine-hours-list__time">
                                    {slot.start} – {slot.end}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="telemedicine-date-hours-item__closed mb-0">No consultation hours</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Modal
        isOpen={editHoursOpen}
        toggle={() => setEditHoursOpen(false)}
        className="patient-list-modal"
        backdrop="static"
      >
        <ModalHeader
          className="patient-list-modal__header"
          toggle={() => setEditHoursOpen(false)}
        >
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className="ri-time-line"
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">Edit Teleconsultation Hours</span>
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="d-flex flex-column gap-3">
            <div>
              <small className="text-muted fw-semibold d-block mb-2">Active Days</small>
              <div className="telemedicine-days-checkboxes" role="group" aria-label="Active days">
                {WEEK_DAYS.map((day) => (
                  <label key={day.id} className="telemedicine-day-check" htmlFor={`tele-day-${day.id}`}>
                    <Input
                      id={`tele-day-${day.id}`}
                      type="checkbox"
                      checked={Boolean(draftActiveDays[day.id])}
                      onChange={() => toggleDraftDay(day.id)}
                    />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {draftHours.map((slot, index) => (
              <div key={slot.id} className="row g-2">
                <div className="col-12">
                  <small className="text-muted fw-semibold">Slot {index + 1}</small>
                </div>
                <div className="col-6">
                  <Input
                    value={slot.start}
                    onChange={(e) => updateDraftHour(slot.id, "start", e.target.value)}
                    placeholder="Start"
                  />
                </div>
                <div className="col-6">
                  <Input
                    value={slot.end}
                    onChange={(e) => updateDraftHour(slot.id, "end", e.target.value)}
                    placeholder="End"
                  />
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" type="button" onClick={() => setEditHoursOpen(false)}>
            Cancel
          </ModalActionButton>
          <ModalActionButton action="save" type="button" onClick={saveHours}>
            Save
          </ModalActionButton>
        </ModalFooter>
      </Modal>

      <TeleKpiListModal
        isOpen={Boolean(kpiModalKey)}
        toggle={closeKpiModal}
        kpiKey={kpiModalKey || "Scheduled"}
        patients={TELE_PATIENTS}
      />

      <Modal
        isOpen={statusConfirmOpen}
        toggle={cancelStatusChange}
        className="patient-list-modal"
        backdrop="static"
        centered
      >
        <ModalHeader
          toggle={cancelStatusChange}
          className="patient-list-modal__header"
        >
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className={pendingOnline ? "ri-checkbox-circle-line" : "ri-close-circle-line"}
              style={{ color: pendingOnline ? "#0ab39c" : "#f06548", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">
              {pendingOnline ? "Go Online?" : "Go Offline?"}
            </span>
          </span>
        </ModalHeader>
        <ModalBody>
          <p className="mb-0 text-muted" style={{ fontSize: "0.8125rem" }}>
            {pendingOnline
              ? "Are you sure you want to enable telemedicine status? Patients will be able to reach you for consultations."
              : "Are you sure you want to disable telemedicine status? New consultation requests will be paused while you are offline."}
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={cancelStatusChange} />
          <ModalActionButton
            action={pendingOnline ? "confirm" : "delete"}
            iconClassName={pendingOnline ? "ri-checkbox-circle-line" : "ri-close-circle-line"}
            onClick={confirmStatusChange}
          >
            {pendingOnline ? "Go Online" : "Go Offline"}
          </ModalActionButton>
        </ModalFooter>
      </Modal>

      <TeleCallFlow
        isOpen={Boolean(callPatient)}
        patient={callPatient}
        onClose={() => setCallPatient(null)}
      />
    </React.Fragment>
  );
};

export default TelemedicineDashboard;
