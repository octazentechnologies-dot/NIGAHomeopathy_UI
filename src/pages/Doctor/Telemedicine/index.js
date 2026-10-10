import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Spinner,
  UncontrolledTooltip,
} from "reactstrap";
import moment from "moment";
import Swal from "sweetalert2";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import DailyScheduleSetupModal from "../../../Components/Common/DailyScheduleSetupModal";
import InstantOfferBanner from "../Tele/InstantOfferBanner";
import {
  getDailySchedule,
  getTeleAvailability,
  listTeleChat,
  setTeleAvailability,
} from "../../../helpers/realbackend_helper";
import { erxByAppointment } from "../../../helpers/s4Week4Api";
import { getAuthDoctorId } from "../../../helpers/appointmentSlotHelper";
import TeleCallFlow from "./TeleCallFlow";
import { loadInstantOfferCount, loadTeleDay, mapChatMessage } from "./teleApi";
import "./telemedicine.css";

const PAGE_SIZE = 5;
const KPI_MODAL_PAGE_SIZE = 5;
const QUEUE_POLL_MS = 30000;
const HOURS_DAYS = 5;

export const readDoctorName = () => {
  try {
    const raw = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const auth = raw?.data || raw;
    const name = [auth?.firstName, auth?.lastName].filter(Boolean).join(" ").trim()
      || auth?.userName
      || auth?.name
      || "";
    if (!name) return "Doctor";
    return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
  } catch (_) {
    return "Doctor";
  }
};

const scheduleToSlots = (schedule) => {
  if (!schedule) return [];
  const start = schedule.workStartTime ?? schedule.WorkStartTime;
  const end = schedule.workEndTime ?? schedule.WorkEndTime;
  const breakStart = schedule.breakStartTime ?? schedule.BreakStartTime;
  const breakEnd = schedule.breakEndTime ?? schedule.BreakEndTime;
  const fmt = (t) => moment(String(t), ["HH:mm:ss", "HH:mm"], true).format("hh:mm A");
  if (!start || !end) return [];
  if (breakStart && breakEnd) {
    return [
      { id: 1, start: fmt(start), end: fmt(breakStart) },
      { id: 2, start: fmt(breakEnd), end: fmt(end) },
    ];
  }
  return [{ id: 1, start: fmt(start), end: fmt(end) }];
};

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
  amount == null || amount === "" ? "—" : `₹ ${Math.round(Number(amount) || 0).toLocaleString("en-IN")}`;

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
    {showJoin && row.queueStatus !== "Completed" && (
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
          {row.sessionStatus === "Active" ? "Rejoin Call" : "Join Call"}
        </UncontrolledTooltip>
      </>
    )}
    {row.mobile ? (
      <>
        <a
          href={`tel:${row.mobile}`}
          id={`${idPrefix}-call-${row.id}`}
          className="btn btn-sm btn-soft-success"
          aria-label="Phone call"
        >
          <i className="ri-phone-fill" />
        </a>
        <UncontrolledTooltip placement="top" target={`${idPrefix}-call-${row.id}`}>
          Call {row.mobile}
        </UncontrolledTooltip>
      </>
    ) : null}
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


const CompletedRecordsButtons = ({ row, onOpenChat, onOpenRx }) => (
  <div className="dashboard-patient-action-group d-inline-flex align-items-center justify-content-center flex-nowrap gap-1">
    <button
      type="button"
      id={`kpi-chat-${row.id}`}
      className="btn btn-sm btn-soft-info"
      aria-label="Chat history"
      disabled={!row.teleSessionId}
      onClick={() => onOpenChat(row)}
    >
      <i className="ri-chat-history-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`kpi-chat-${row.id}`}>
      {row.teleSessionId ? "Chat History" : "No tele session"}
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

const CompletedChatHistoryModal = ({ isOpen, toggle, patient }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !patient?.teleSessionId) {
      setMessages([]);
      return;
    }
    let active = true;
    setLoading(true);
    const doctorName = readDoctorName();
    listTeleChat(patient.teleSessionId)
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setMessages(rows.map((r) => mapChatMessage(r, patient.patient, doctorName)));
      })
      .catch(() => active && setMessages([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isOpen, patient?.teleSessionId, patient?.patient]);

  return (
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
          {loading ? (
            <div className="text-center py-3">
              <Spinner size="sm" color="primary" />
            </div>
          ) : null}
          {!loading && messages.length === 0 ? (
            <p className="text-muted text-center mb-0 py-3">No chat messages in this consultation</p>
          ) : null}
          {!loading &&
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`telemedicine-chat-history__msg ${msg.mine ? "" : "telemedicine-chat-history__msg--mine"}`}
              >
                <div className="telemedicine-chat-history__meta">
                  <strong>{msg.name}</strong>
                  <span>{msg.time}</span>
                </div>
                {msg.text && <div className="telemedicine-chat-history__bubble">{msg.text}</div>}
              </div>
            ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalActionButton action="close" onClick={toggle} />
      </ModalFooter>
    </Modal>
  );
};

const CompletedPrescriptionModal = ({ isOpen, toggle, patient }) => {
  const [erx, setErx] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !patient?.patientAppId) {
      setErx(null);
      setError("");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    erxByAppointment(patient.patientAppId)
      .then((res) => active && setErx(res?.data || null))
      .catch((err) => {
        if (!active) return;
        setErx(null);
        setError(
          (typeof err === "string" ? err : err?.message) || "No signed prescription for this consultation."
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isOpen, patient?.patientAppId]);

  const items = Array.isArray(erx?.items) ? erx.items : [];

  return (
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
        {loading ? (
          <div className="text-center py-3">
            <Spinner size="sm" color="primary" />
          </div>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="text-muted text-center mb-0 py-3">{error || "No remedies on this prescription."}</p>
        ) : null}
        {!loading && erx?.signedAt ? (
          <p className="text-muted small mb-2">Signed {moment(erx.signedAt).format("DD MMM YYYY, hh:mm A")}</p>
        ) : null}
        {!loading &&
          items.map((item, idx) => (
            <div className="telemedicine-rx-detail mb-2" key={`${item.remedyCode || "rx"}-${idx}`}>
              <div className="telemedicine-rx-detail__row">
                <span>Remedy</span>
                <strong>{item.remedyName || item.remedyCode || "—"}</strong>
              </div>
              <div className="telemedicine-rx-detail__row">
                <span>Potency</span>
                <strong>{item.potencyCode || "—"}</strong>
              </div>
              <div className="telemedicine-rx-detail__row">
                <span>Dosage</span>
                <strong>{[item.dose, item.frequency].filter(Boolean).join(", ") || "—"}</strong>
              </div>
              <div className="telemedicine-rx-detail__row">
                <span>Duration</span>
                <strong>{item.duration || "—"}</strong>
              </div>
              {item.instructions ? (
                <div className="telemedicine-rx-detail__row telemedicine-rx-detail__row--block">
                  <span>Instructions</span>
                  <strong>{item.instructions}</strong>
                </div>
              ) : null}
            </div>
          ))}
      </ModalBody>
      <ModalFooter>
        <ModalActionButton action="close" onClick={toggle} />
      </ModalFooter>
    </Modal>
  );
};

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
  document.title = "Teleconsult | Niga Homeocentrum";

  const doctorId = getAuthDoctorId();
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [instantCount, setInstantCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingOnline, setPendingOnline] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [hoursLoading, setHoursLoading] = useState(false);
  const [scheduleEditDate, setScheduleEditDate] = useState(null);
  const [kpiModalKey, setKpiModalKey] = useState(null);
  const [callPatient, setCallPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const loadPatients = useCallback(async (silent = false) => {
    if (!silent) setPatientsLoading(true);
    try {
      const [rows, offers] = await Promise.all([
        loadTeleDay(),
        loadInstantOfferCount().catch(() => 0),
      ]);
      setPatients(rows);
      setInstantCount(offers);
    } catch (_) {
      if (!silent) setPatients([]);
    } finally {
      if (!silent) setPatientsLoading(false);
    }
  }, []);

  const loadHours = useCallback(async () => {
    if (!doctorId) return;
    setHoursLoading(true);
    try {
      const days = Array.from({ length: HOURS_DAYS }, (_, i) => moment().add(i, "day").format("YYYY-MM-DD"));
      const results = await Promise.all(
        days.map((day) =>
          getDailySchedule({ doctorId, scheduleDate: day })
            .then((s) => [day, s])
            .catch(() => [day, null])
        )
      );
      setSchedules(Object.fromEntries(results));
    } finally {
      setHoursLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadPatients();
    loadHours();
    getTeleAvailability()
      .then((res) => setIsOnline(Boolean(res?.data?.isOnline ?? res?.data?.IsOnline)))
      .catch(() => setIsOnline(false));
    const timer = setInterval(() => loadPatients(true), QUEUE_POLL_MS);
    return () => clearInterval(timer);
  }, [loadPatients, loadHours]);

  const scheduledCount = patients.filter((row) => row.queueStatus === "Scheduled").length;
  const waitingCount = patients.filter((row) => row.queueStatus === "Waiting").length;
  const completedCount = patients.filter((row) => row.queueStatus === "Completed").length;

  const dateWiseHours = useMemo(
    () =>
      Array.from({ length: HOURS_DAYS }, (_, offset) => {
        const date = moment().add(offset, "day");
        const key = date.format("YYYY-MM-DD");
        const daySlots = scheduleToSlots(schedules[key]).map((slot) => {
          const durationHours = getSlotDurationHours(slot.start, slot.end);
          return {
            ...slot,
            session: getSessionLabel(slot.start),
            durationHours,
            durationLabel: formatDuration(durationHours),
          };
        });
        const isActive = daySlots.length > 0;
        const dayTotal = daySlots.reduce((sum, slot) => sum + slot.durationHours, 0);
        return {
          key,
          label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.format("ddd"),
          dateDisplay: date.format("DD MMM YYYY"),
          isActive,
          slotCount: daySlots.length,
          totalHours: dayTotal,
          totalLabel: isActive ? formatDuration(dayTotal) : "Not set",
          slots: daySlots,
        };
      }),
    [schedules]
  );

  const filteredPatients = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((row) =>
      [row.time, row.patient, row.ageSex, row.mobile, row.amount, row.paymentStatus, row.consultType, row.queueStatus]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [patients, searchTerm]);

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

  const openKpiModal = (key) => setKpiModalKey(key);
  const closeKpiModal = () => setKpiModalKey(null);

  const requestStatusChange = (nextOnline) => {
    if (nextOnline === isOnline || statusSaving) return;
    setPendingOnline(nextOnline);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (pendingOnline === null) return;
    setStatusSaving(true);
    try {
      const res = await setTeleAvailability({ isOnline: pendingOnline });
      setIsOnline(Boolean(res?.data?.isOnline ?? res?.data?.IsOnline ?? pendingOnline));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Status not changed",
        text: (typeof err === "string" ? err : err?.message) || "Please try again.",
      });
    } finally {
      setStatusSaving(false);
      setPendingOnline(null);
      setStatusConfirmOpen(false);
    }
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
          <InstantOfferBanner />
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
                    <h5 className="fs-15 doctor-kpi-count mb-0">{isOnline ? "Online" : "Offline"}</h5>
                    <p className="mb-0 text-muted doctor-kpi-label">TELEMEDICINE STATUS</p>
                  </div>
                </div>
              </div>
            </div>

            {renderKpiCard({ key: "Scheduled", count: scheduledCount, label: "SCHEDULED", icon: "ri-calendar-check-line" })}
            {renderKpiCard({ key: "Waiting", count: waitingCount, label: "WAITING", icon: "ri-hourglass-line" })}
            {renderKpiCard({ key: "Completed", count: completedCount, label: "COMPLETED", icon: "ri-checkbox-circle-line" })}
            {renderKpiCard({ key: "Instant", count: instantCount, label: "INSTANT CONSULT", icon: "ri-smartphone-line" })}
          </div>

          <Row className="g-2 mt-1 telemedicine-content-row align-items-stretch">
            <Col lg={8}>
              <Card className="telemedicine-panel-card h-100 mb-0">
                <CardHeader className="telemedicine-panel-card__header">
                  <h5 className="telemedicine-panel-card__title mb-0">Telemedicine Patients</h5>
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
                        {patientsLoading && patients.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-3">
                              <Spinner size="sm" color="primary" />
                            </td>
                          </tr>
                        ) : null}
                        {pagedPatients.map((row) => (
                          <tr key={row.id}>
                            <td className="text-nowrap">{row.time}</td>
                            <td>
                              <TelePatientNameCell row={row} idPrefix="list" />
                            </td>
                            <td>{row.ageSex}</td>
                            <td>{row.mobile || "—"}</td>
                            <td className="text-nowrap fw-semibold">{formatAmount(row.amount)}</td>
                            <td>
                              <span
                                className={`badge patient-list-modal__status ${paymentStatusBadgeClass(row.paymentStatus)}`}
                              >
                                <i className="ri-checkbox-blank-circle-fill" aria-hidden="true" />
                                {row.paymentStatus}
                              </span>
                            </td>
                            <td className="text-end">
                              <TelePatientActionButtons row={row} idPrefix="list" onJoin={setCallPatient} />
                            </td>
                          </tr>
                        ))}
                        {!patientsLoading && filteredPatients.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-3">
                              {searchTerm
                                ? "No patients found matching your search"
                                : "No telemedicine appointments today"}
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
                          Showing <span className="fw-semibold">{Math.min(pageStart + 1, filteredPatients.length)}</span>{" "}
                          to{" "}
                          <span className="fw-semibold">{Math.min(pageStart + PAGE_SIZE, filteredPatients.length)}</span>{" "}
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
                            <li key={page} className={`page-item ${page === safePage ? "active" : ""}`}>
                              <button className="page-link" type="button" onClick={() => setCurrentPage(page)}>
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
                  <h5 className="telemedicine-panel-card__title mb-0">Consultation Hours</h5>
                  <button
                    type="button"
                    className="telemedicine-edit-link"
                    disabled={!doctorId}
                    onClick={() => setScheduleEditDate(moment().format("YYYY-MM-DD"))}
                  >
                    <i className="ri-edit-box-line" aria-hidden="true" />
                    Edit
                  </button>
                </CardHeader>
                <CardBody className="telemedicine-date-hours-body">
                  {hoursLoading && Object.keys(schedules).length === 0 ? (
                    <div className="text-center py-3">
                      <Spinner size="sm" color="primary" />
                    </div>
                  ) : (
                    <div className="telemedicine-date-hours-list">
                      {dateWiseHours.map((day) => (
                        <div
                          key={day.key}
                          className="telemedicine-date-hours-item"
                          role="button"
                          title="Edit hours for this day"
                          onClick={() => doctorId && setScheduleEditDate(day.key)}
                        >
                          <div className="telemedicine-date-hours-item__head">
                            <div className="telemedicine-date-hours-item__title">
                              <span className="telemedicine-date-hours-item__label">{day.label}</span>
                              <span className="telemedicine-date-hours-item__date">{day.dateDisplay}</span>
                            </div>
                            <span className="telemedicine-date-hours-item__meta">
                              {day.isActive ? `${day.slotCount} sessions · ${day.totalLabel}` : "Not set"}
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
                            <p className="telemedicine-date-hours-item__closed mb-0">No schedule saved for this day</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {scheduleEditDate && doctorId ? (
        <DailyScheduleSetupModal
          key={`tele-schedule-${scheduleEditDate}`}
          isOpen
          doctorId={doctorId}
          scheduleDate={scheduleEditDate}
          requireSave={false}
          onClose={() => setScheduleEditDate(null)}
          onSaved={() => {
            setScheduleEditDate(null);
            loadHours();
          }}
        />
      ) : null}

      <TeleKpiListModal
        isOpen={Boolean(kpiModalKey)}
        toggle={closeKpiModal}
        kpiKey={kpiModalKey || "Scheduled"}
        patients={patients}
      />

      <Modal isOpen={statusConfirmOpen} toggle={cancelStatusChange} className="patient-list-modal" backdrop="static" centered>
        <ModalHeader toggle={cancelStatusChange} className="patient-list-modal__header">
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className={pendingOnline ? "ri-checkbox-circle-line" : "ri-close-circle-line"}
              style={{ color: pendingOnline ? "#0ab39c" : "#f06548", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">{pendingOnline ? "Go Online?" : "Go Offline?"}</span>
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
            disabled={statusSaving}
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
        onSessionChanged={() => loadPatients(true)}
      />
    </React.Fragment>
  );
};

export default TelemedicineDashboard;
