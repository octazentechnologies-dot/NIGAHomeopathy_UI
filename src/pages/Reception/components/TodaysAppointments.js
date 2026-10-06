import React, { useEffect, useMemo, useRef, useState } from "react";
import classnames from "classnames";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  UncontrolledTooltip,
} from "reactstrap";
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../Components/Common/DateOfBirthPicker";
import moment from "moment";
import { getAppointmentQueue } from "../../../helpers/realbackend_helper";
import { getPublicFee, unwrapS4 } from "../../../helpers/s4Week4Api";
import { apiMessage, readReceptionDoctorId, unwrap } from "../receptionSession";
import { paymentStatusMeta } from "../../../helpers/paymentStatusBadge";
import AppointmentPatientViewModal from "./AppointmentPatientViewModal";

const genderLabel = (gender) => {
  if (gender === 0 || gender === "0" || gender === "M") return "Male";
  if (gender === 1 || gender === "1" || gender === "F") return "Female";
  return "";
};

const formatApptTime = (value) => {
  if (!value) return "—";
  const parsed = moment(value, ["HH:mm:ss", "HH:mm", "hh:mm A", moment.ISO_8601], true);
  if (parsed.isValid()) return parsed.format("hh:mm A");
  const fallback = moment(value);
  return fallback.isValid() ? fallback.format("hh:mm A") : String(value);
};

const consultType = (row) => {
  const mode = String(row.consultMode || row.ConsultMode || "").toUpperCase();
  const tele = row.isTele ?? row.IsTele;
  if (tele === true || mode.includes("TELE") || mode.includes("E-CONSULT") || mode.includes("ECONSULT")) {
    return "Teleconsult";
  }
  return "In-Clinic";
};

const formatRupees = (amount) => {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return `₹ ${n % 1 === 0 ? n : n.toFixed(2)}`;
};

const ageSexDisplay = (row) => {
  const age = row.age ?? row.Age;
  const sex = genderLabel(row.gender ?? row.Gender);
  if (age == null && !sex) return "";
  if (age != null && sex) return `${age}y / ${sex}`;
  return age != null ? `${age}y` : sex;
};

const mapQueueRow = (apiRow, doctorFallback, feeByType) => {
  const pay = paymentStatusMeta(apiRow.paymentStatus ?? apiRow.PaymentStatus);
  const type = consultType(apiRow);
  const fee =
    apiRow.consultFee ??
    apiRow.ConsultFee ??
    (type === "Teleconsult" ? feeByType.tele : feeByType.inClinic);
  const time = formatApptTime(apiRow.appointmentTime ?? apiRow.AppointmentTime);
  const dateVal = apiRow.appointmentDate ?? apiRow.AppointmentDate;
  const patient = apiRow.patientName ?? apiRow.PatientName ?? "Patient";
  const doctor = apiRow.doctorName || apiRow.DoctorName || doctorFallback || "Doctor";
  const patientId = apiRow.patientId ?? apiRow.PatientId;
  const patientAppId = apiRow.patientAppId ?? apiRow.PatientAppId;

  return {
    id: patientAppId,
    patientAppId,
    patientId,
    time,
    patient,
    doctor,
    type,
    payment: formatRupees(fee),
    status: pay.label,
    statusTone: pay.tone,
    paymentStatusRaw: apiRow.paymentStatus ?? apiRow.PaymentStatus,
    appointmentStatus: apiRow.status || apiRow.Status || "—",
    dateDisplay: dateVal ? moment(dateVal).format("DD MMM YYYY") : moment().format("DD MMM YYYY"),
    waitMinutes: apiRow.waitMinutes ?? apiRow.WaitMinutes,
    appointmentTime: apiRow.appointmentTime ?? apiRow.AppointmentTime,
    appointmentDate: dateVal,
    queueOrder: apiRow.queueOrder ?? apiRow.QueueOrder,
    patientDetails: {
      fullName: patient,
      ageSex: ageSexDisplay(apiRow),
      mobile: apiRow.mobileNo || apiRow.MobileNo || "—",
      email: apiRow.email || apiRow.Email || "—",
      dateOfBirth: apiRow.dateOfBirth || apiRow.DateOfBirth
        ? moment(apiRow.dateOfBirth || apiRow.DateOfBirth).format("DD/MM/YYYY")
        : "—",
      bloodGroup: "—",
      address: apiRow.address || apiRow.Address || "—",
      place: "—",
      emergencyContact: "—",
      patientId: patientId ? String(patientId) : "—",
    },
    vitals: {},
    paymentDetails: {
      amount: pay.label === "Paid" ? formatRupees(fee) : "₹ 0",
      gst: "GST applied by New API on collection",
      total: formatRupees(fee),
      method: apiRow.paymentMethod || apiRow.PaymentMethod || "—",
      notes: pay.label === "Unpaid" || pay.label === "Pay-at-clinic" ? "Collect at reception" : "",
    },
  };
};

const matchesSearch = (row, needle) => {
  if (!needle) return true;
  const haystack = [
    row.time,
    row.patient,
    row.doctor,
    row.type,
    row.payment,
    row.status,
    row.appointmentStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
};

const AppointmentActionButtons = ({ row, onView, onEdit }) => (
  <div className="d-inline-flex align-items-center gap-1">
    <button
      id={`reception-appt-view-${row.id}`}
      type="button"
      className="btn btn-sm btn-soft-info"
      aria-label="View"
      onClick={() => onView?.(row)}
    >
      <i className="ri-eye-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`reception-appt-view-${row.id}`}>
      View
    </UncontrolledTooltip>
    <button
      id={`reception-appt-edit-${row.id}`}
      type="button"
      className="btn btn-sm btn-soft-success edit-item-btn"
      aria-label="Update appointment time"
      onClick={() => onEdit?.(row)}
    >
      <i className="ri-pencil-fill" />
    </button>
    <UncontrolledTooltip placement="top" target={`reception-appt-edit-${row.id}`}>
      Update time
    </UncontrolledTooltip>
  </div>
);

const AppointmentTable = ({ rows, searchTerm, emptyMessage, loading, onView, onEdit }) => (
  <div className="table-responsive">
    <table className="table table-hover mb-0 dashboard-patient-table reception-appointment-data-table">
      <thead>
        <tr>
          <th scope="col">Time</th>
          <th scope="col">Patient</th>
          <th scope="col">Doctor</th>
          <th scope="col">Type</th>
          <th scope="col">Payment</th>
          <th scope="col">Status</th>
          <th scope="col" className="text-end">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} className="text-center text-muted py-4">
              Loading appointments…
            </td>
          </tr>
        ) : (
          <>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="fw-medium text-nowrap">{row.time}</td>
                <td>{row.patient}</td>
                <td className="text-nowrap">{row.doctor}</td>
                <td className="text-muted">{row.type}</td>
                <td className="text-nowrap">{row.payment}</td>
                <td>
                  <span className={`badge bg-${row.statusTone}-subtle text-${row.statusTone}`}>
                    {row.status}
                  </span>
                </td>
                <td className="text-end">
                  <AppointmentActionButtons row={row} onView={onView} onEdit={onEdit} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  {searchTerm ? emptyMessage.search : emptyMessage.empty}
                </td>
              </tr>
            )}
          </>
        )}
      </tbody>
    </table>
  </div>
);

const unwrapQueue = (response) => {
  const body = unwrap(response);
  const rows = body.queue || body.Queue || body.data || body.Data || body;
  return Array.isArray(rows) ? rows : [];
};

const applyPaymentPatch = (row, patch) => {
  if (!patch || String(row.patientAppId) !== String(patch.patientAppId)) return row;
  const pay = paymentStatusMeta(patch.paymentStatus);
  return {
    ...row,
    status: pay.label,
    statusTone: pay.tone,
    paymentStatusRaw: patch.paymentStatus,
    paymentDetails: {
      ...row.paymentDetails,
      amount: pay.label === "Paid" ? row.payment : row.paymentDetails?.amount,
      method: patch.paymentMethod || row.paymentDetails?.method,
      notes: pay.label === "Paid" ? "" : row.paymentDetails?.notes,
    },
  };
};

const TodaysAppointments = ({ onEditAppointment, refreshKey = 0, paymentPatch = null }) => {
  const doctorId = readReceptionDoctorId();
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(moment().format(DOB_DISPLAY_FORMAT));
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [todaySource, setTodaySource] = useState([]);
  const [allSource, setAllSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const lastLoadKeyRef = useRef("");

  useEffect(() => {
    if (!paymentPatch?.patientAppId) return;
    setTodaySource((rows) => rows.map((row) => applyPaymentPatch(row, paymentPatch)));
    setAllSource((rows) => rows.map((row) => applyPaymentPatch(row, paymentPatch)));
  }, [paymentPatch]);

  useEffect(() => {
    let cancelled = false;
    const loadKey = `${doctorId}|${selectedDate}`;
    const silent = lastLoadKeyRef.current === loadKey;
    lastLoadKeyRef.current = loadKey;
    const load = async () => {
      if (!doctorId) {
        setTodaySource([]);
        setAllSource([]);
        setLoadError("Reception doctor context is missing.");
        return;
      }
      if (!silent) setLoading(true);
      setLoadError("");
      const isoDate = moment(selectedDate, DOB_DISPLAY_FORMAT, true).isValid()
        ? moment(selectedDate, DOB_DISPLAY_FORMAT).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");
      try {
        const [queueRes, dayRes, feeRes] = await Promise.all([
          getAppointmentQueue(doctorId, { date: isoDate, scope: "queue" }),
          getAppointmentQueue(doctorId, { date: isoDate, scope: "day" }),
          getPublicFee(doctorId).catch(() => null),
        ]);
        const feeBody = unwrapS4(feeRes) || {};
        const fee = feeBody.data || feeBody.Data || feeBody;
        const feeByType = {
          inClinic: fee.inClinicFee ?? fee.InClinicFee,
          tele: fee.teleFee ?? fee.TeleFee ?? fee.inClinicFee ?? fee.InClinicFee,
        };
        if (cancelled) return;
        setTodaySource(unwrapQueue(queueRes).map((row) => mapQueueRow(row, "", feeByType)));
        setAllSource(unwrapQueue(dayRes).map((row) => mapQueueRow(row, "", feeByType)));
      } catch (err) {
        if (cancelled) return;
        setTodaySource([]);
        setAllSource([]);
        setLoadError(apiMessage(err, "Could not load appointments."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [doctorId, selectedDate, refreshKey]);

  const needle = searchTerm.trim().toLowerCase();
  const todayRows = useMemo(
    () => todaySource.filter((row) => matchesSearch(row, needle)),
    [todaySource, needle]
  );
  const allRows = useMemo(
    () => allSource.filter((row) => matchesSearch(row, needle)),
    [allSource, needle]
  );

  const handleView = (row) => {
    setSelectedAppointment(row);
    setViewOpen(true);
  };

  const handleEdit = (row) => {
    onEditAppointment?.(row);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <Row className="mt-3">
      <Col xs={12}>
        <Card className="doctor-appointments-card reception-appointments-card mb-0">
          <CardHeader className="align-items-center d-flex flex-wrap gap-2 doctor-dashboard-card-header doctor-patient-nav-tabs doctor-appointments-toolbar">
            <div className="d-flex align-items-center gap-2 flex-wrap doctor-appointments-toolbar__primary">
              <Nav pills className="nav-customs doctor-patient-custom-nav mb-0 flex-shrink-0">
                <NavItem>
                  <NavLink
                    style={{ cursor: "pointer" }}
                    className={classnames({ active: activeTab === "1" })}
                    onClick={() => setActiveTab("1")}
                  >
                    <span className="doctor-patient-tab-label">Today</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    style={{ cursor: "pointer" }}
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <span className="doctor-patient-tab-label">All</span>
                  </NavLink>
                </NavItem>
              </Nav>
              <div className="doctor-dashboard-appointment-date flex-shrink-0">
                <DateOfBirthPicker
                  name="receptionAppointmentDate"
                  value={selectedDate}
                  minDate="today"
                  maxDate={moment().add(1, "year").format("YYYY-MM-DD")}
                  placeholder={DOB_DISPLAY_FORMAT}
                  onChange={setSelectedDate}
                />
              </div>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2 ms-sm-auto doctor-appointments-toolbar__actions">
              <div className="search-box doctor-appointments-toolbar__search">
                <input
                  type="text"
                  className="form-control form-control-sm search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="ri-search-line search-icon" />
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-0 doctor-patient-table-body">
            {loadError ? (
              <div className="px-3 py-3 text-danger small mb-0">{loadError}</div>
            ) : null}
            <TabContent activeTab={activeTab} className="text-muted">
              <TabPane tabId="1">
                <AppointmentTable
                  rows={todayRows}
                  searchTerm={searchTerm}
                  loading={loading}
                  onView={handleView}
                  onEdit={handleEdit}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: "No waiting patients in the queue for this date",
                  }}
                />
              </TabPane>
              <TabPane tabId="2">
                <AppointmentTable
                  rows={allRows}
                  searchTerm={searchTerm}
                  loading={loading}
                  onView={handleView}
                  onEdit={handleEdit}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: "No appointments for this date",
                  }}
                />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Col>

      <AppointmentPatientViewModal
        isOpen={viewOpen}
        toggle={handleCloseView}
        appointment={selectedAppointment}
      />
    </Row>
  );
};

export default TodaysAppointments;
