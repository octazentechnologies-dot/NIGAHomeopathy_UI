import React, { useEffect, useMemo, useState } from "react";
import classnames from "classnames";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  UncontrolledDropdown,
  UncontrolledTooltip,
} from "reactstrap";
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../../Components/Common/DateOfBirthPicker";
import moment from "moment";
import Swal from "sweetalert2";
import {
  cancelAppointment,
  getAppointmentQueue,
  getReceptionPatientCard,
  getReceptionVitals,
  updateAppointmentStatus,
} from "../../../../helpers/realbackend_helper";
import { getPublicFee, unwrapS4 } from "../../../../helpers/s4Week4Api";
import { paymentStatusMeta } from "../../../../helpers/paymentStatusBadge";
import { apiMessage, readReceptionDoctorId, unwrap } from "../../receptionSession";
import AppointmentPatientViewModal from "./AppointmentPatientViewModal";

const APP_STATUS_OPTIONS = [
  { value: "WAITING", label: "WAITING" },
  { value: "WALK-IN", label: "WALK-IN" },
  { value: "NOT ARRIVED", label: "NOT ARRIVED" },
  { value: "E-CONSULT", label: "TELE CONSULTATION" },
  { value: "REMAINING", label: "REMAINING" },
  { value: "COMPLETED", label: "COMPLETED" },
];

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
  if (tele === true || mode.includes("TELE")) return "Teleconsult";
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

const mapQueueRow = (apiRow, feeByType) => {
  const pay = paymentStatusMeta(apiRow.paymentStatus ?? apiRow.PaymentStatus, {
    payAtClinicAllowed: apiRow.payAtClinicAllowed ?? apiRow.PayAtClinicAllowed,
    paymentMethod: apiRow.paymentMethod ?? apiRow.PaymentMethod,
  });
  const type = consultType(apiRow);
  const fee =
    apiRow.consultFee ??
    apiRow.ConsultFee ??
    (type === "Teleconsult" ? feeByType.tele : feeByType.inClinic);
  const time = formatApptTime(apiRow.appointmentTime ?? apiRow.AppointmentTime);
  const dateVal = apiRow.appointmentDate ?? apiRow.AppointmentDate;
  const patient = apiRow.patientName ?? apiRow.PatientName ?? "Patient";
  const doctor = apiRow.doctorName || apiRow.DoctorName || "Doctor";
  const patientId = apiRow.patientId ?? apiRow.PatientId;
  const patientAppId = apiRow.patientAppId ?? apiRow.PatientAppId;
  const doctorId = apiRow.doctorId ?? apiRow.DoctorId;

  return {
    id: patientAppId,
    patientAppId,
    patientId,
    doctorId,
    time,
    appointmentTime: apiRow.appointmentTime ?? apiRow.AppointmentTime,
    appointmentDate: dateVal,
    dateDisplay: dateVal ? moment(dateVal).format("DD MMM YYYY") : moment().format("DD MMM YYYY"),
    patient,
    doctor,
    type,
    payment: formatRupees(fee),
    status: pay.label,
    appointmentStatus: apiRow.status || apiRow.Status || "",
    patientDetails: {
      patientId,
      fullName: patient,
      ageSex: ageSexDisplay(apiRow),
      mobile: apiRow.mobileNo || apiRow.MobileNo || "—",
      address: apiRow.address || apiRow.Address || "",
    },
  };
};

const unwrapQueue = (response) => {
  const body = unwrap(response);
  const list = body.queue || body.Queue || body.data || body.Data || body;
  return Array.isArray(list) ? list : [];
};

const appointmentSortKey = (row) => {
  const parsed = moment(row.time, ["h:mm A", "hh:mm A", "HH:mm", "H:mm"], true);
  return parsed.isValid() ? parsed.valueOf() : Number.MAX_SAFE_INTEGER;
};

const matchesSearch = (row, needle) => {
  if (!needle) return true;
  const haystack = [row.time, row.patient, row.doctor, row.type, row.payment, row.status, row.appointmentStatus]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
};

const AppointmentActionButtons = ({ row, onView, onEdit, onDelete }) => (
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
      aria-label="Edit"
      onClick={() => onEdit?.(row)}
    >
      <i className="ri-pencil-fill" />
    </button>
    <UncontrolledTooltip placement="top" target={`reception-appt-edit-${row.id}`}>
      Edit
    </UncontrolledTooltip>
    <button
      id={`reception-appt-del-${row.id}`}
      type="button"
      className="btn btn-sm btn-soft-danger remove-item-btn"
      aria-label="Cancel appointment"
      onClick={() => onDelete?.(row)}
    >
      <i className="ri-delete-bin-5-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`reception-appt-del-${row.id}`}>
      Cancel
    </UncontrolledTooltip>
  </div>
);

const AppStatusCell = ({ row, onStatusChange }) => {
  const current = row.appointmentStatus || "";
  if (!current) return <span className="text-muted">-</span>;
  return (
    <UncontrolledDropdown>
      <DropdownToggle
        tag="button"
        className="btn btn-sm btn-link text-decoration-none p-0 border-0 d-flex align-items-center text-nowrap"
        style={{ cursor: "pointer", color: "inherit", fontSize: "0.75rem" }}
      >
        <span className="me-1">{current}</span>
        <i className="ri-arrow-down-s-line" />
      </DropdownToggle>
      <DropdownMenu container="body" strategy="fixed" style={{ zIndex: 2000 }}>
        {APP_STATUS_OPTIONS.map((option) => (
          <DropdownItem
            key={option.value}
            active={current === option.value}
            onClick={() => onStatusChange?.(row, option.value)}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </UncontrolledDropdown>
  );
};

const AppointmentTable = ({ rows, searchTerm, emptyMessage, onView, onEdit, onDelete, onStatusChange }) => (
  <div className="table-responsive">
    <table className="table table-hover mb-0 dashboard-patient-table reception-appointment-data-table">
      <thead>
        <tr>
          <th scope="col">Time</th>
          <th scope="col">Patient</th>
          <th scope="col">Doctor</th>
          <th scope="col">Type</th>
          <th scope="col">App.Status</th>
          <th scope="col">Payment</th>
          <th scope="col">Status</th>
          <th scope="col" className="text-end">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="fw-medium text-nowrap">{row.time}</td>
            <td>{row.patient}</td>
            <td className="text-nowrap">{row.doctor}</td>
            <td className="text-muted">{row.type}</td>
            <td className="text-nowrap">
              <AppStatusCell row={row} onStatusChange={onStatusChange} />
            </td>
            <td className="text-nowrap">{row.payment}</td>
            <td>
              <span
                className={`badge bg-${
                  row.status === "Paid" ? "success" : "danger"
                }-subtle text-${row.status === "Paid" ? "success" : "danger"}`}
              >
                {row.status}
              </span>
            </td>
            <td className="text-end">
              <AppointmentActionButtons row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="text-center text-muted">
              {searchTerm ? emptyMessage.search : emptyMessage.empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const toIsoDate = (displayDate) => {
  const parsed = moment(displayDate, [DOB_DISPLAY_FORMAT, "MM/DD/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};

const mapFeeByType = (feeRes) => {
  const fee = unwrapS4(feeRes) || {};
  const data = fee.data || fee.Data || fee;
  return {
    inClinic: data.inClinicFee ?? data.InClinicFee ?? null,
    tele: data.teleFee ?? data.TeleFee ?? data.inClinicFee ?? data.InClinicFee ?? null,
  };
};

const mapDayRows = (dayRes, feeByType) =>
  unwrapQueue(dayRes)
    .map((row) => mapQueueRow(row, feeByType))
    .sort((a, b) => appointmentSortKey(a) - appointmentSortKey(b) || Number(a.id) - Number(b.id));

const TodaysAppointments = ({ onEditAppointment, refreshKey = 0, onChanged }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  // Doctor pattern: date picker only on All; empty = pick a date / clear filter.
  const [allListDate, setAllListDate] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [todaySource, setTodaySource] = useState([]);
  const [allSource, setAllSource] = useState([]);
  const [loadError, setLoadError] = useState("");
  const doctorId = readReceptionDoctorId();

  // Today tab — always calendar today (no date picker).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!doctorId) {
        setTodaySource([]);
        setLoadError("Reception doctor context is missing.");
        return;
      }
      setLoadError("");
      const isoDate = moment().format("YYYY-MM-DD");
      try {
        const [dayRes, feeRes] = await Promise.all([
          getAppointmentQueue(doctorId, { date: isoDate, scope: "day" }),
          getPublicFee(doctorId).catch(() => null),
        ]);
        if (cancelled) return;
        setTodaySource(mapDayRows(dayRes, mapFeeByType(feeRes)));
      } catch (err) {
        if (cancelled) return;
        setTodaySource([]);
        setLoadError(apiMessage(err, "Could not load appointments."));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [doctorId, refreshKey]);

  // All tab — optional date; load that day's appointments when set (same as doctor).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!doctorId) {
        setAllSource([]);
        return;
      }
      const isoDate = toIsoDate(allListDate);
      if (!isoDate) {
        setAllSource([]);
        return;
      }
      setLoadError("");
      try {
        const [dayRes, feeRes] = await Promise.all([
          getAppointmentQueue(doctorId, { date: isoDate, scope: "day" }),
          getPublicFee(doctorId).catch(() => null),
        ]);
        if (cancelled) return;
        setAllSource(mapDayRows(dayRes, mapFeeByType(feeRes)));
      } catch (err) {
        if (cancelled) return;
        setAllSource([]);
        setLoadError(apiMessage(err, "Could not load appointments."));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [doctorId, allListDate, refreshKey]);

  const needle = searchTerm.trim().toLowerCase();
  const todayRows = useMemo(
    () => todaySource.filter((row) => matchesSearch(row, needle)),
    [todaySource, needle]
  );
  const allRows = useMemo(
    () => allSource.filter((row) => matchesSearch(row, needle)),
    [allSource, needle]
  );
  const showingAllByDate = Boolean(toIsoDate(allListDate));

  const handleView = async (row) => {
    setSelectedAppointment(row);
    setViewOpen(true);
    const patientId = Number(row.patientId);
    const appId = row.patientAppId || row.id;
    try {
      const [cardRes, vitalsRes] = await Promise.all([
        patientId ? getReceptionPatientCard(patientId).catch(() => null) : Promise.resolve(null),
        appId ? getReceptionVitals(appId).catch(() => null) : Promise.resolve(null),
      ]);
      const cardBody = unwrap(cardRes);
      const card = cardBody?.data || cardBody?.Data || cardBody;
      const vitalsBody = unwrap(vitalsRes);
      const vitalsRaw = vitalsBody?.data || vitalsBody?.Data || vitalsBody;
      const vitals =
        vitalsRaw && typeof vitalsRaw === "object"
          ? {
              bloodPressure: vitalsRaw.bloodPressure || vitalsRaw.BloodPressure || "",
              pulse: vitalsRaw.pulse || vitalsRaw.Pulse || "",
              temperature: vitalsRaw.temperature || vitalsRaw.Temperature || "",
              weight: vitalsRaw.weight || vitalsRaw.Weight || "",
              height: vitalsRaw.height || vitalsRaw.Height || "",
              spo2: vitalsRaw.spo2 || vitalsRaw.Spo2 || "",
              respiratoryRate: vitalsRaw.respiratoryRate || vitalsRaw.RespiratoryRate || "",
              bloodSugar: vitalsRaw.bloodSugar || vitalsRaw.BloodSugar || "",
              notes: vitalsRaw.notes || vitalsRaw.Notes || "",
            }
          : {};
      const dob = card?.dateOfBirth || card?.DateOfBirth;
      setSelectedAppointment((prev) => {
        if (!prev || String(prev.id) !== String(row.id)) return prev;
        return {
          ...prev,
          vitals,
          patientDetails: {
            ...prev.patientDetails,
            fullName: card?.fullName || card?.FullName || prev.patientDetails?.fullName,
            ageSex: card?.ageSex || card?.AgeSex || prev.patientDetails?.ageSex,
            mobile: card?.mobile || card?.Mobile || prev.patientDetails?.mobile,
            email: card?.email || card?.Email || "",
            dateOfBirth: dob ? moment(dob).format("DD/MM/YYYY") : "",
            address: card?.address || card?.Address || prev.patientDetails?.address,
            place: card?.place || card?.Place || "",
          },
        };
      });
    } catch {
      /* view still shows the queue row */
    }
  };

  const handleEdit = (row) => {
    onEditAppointment?.(row);
  };

  const handleStatusChange = async (row, newStatus) => {
    const appId = Number(row.patientAppId || row.id);
    if (!appId || !newStatus || newStatus === row.appointmentStatus) return;
    try {
      await updateAppointmentStatus({ patientAppId: appId, status: newStatus });
      onChanged?.();
    } catch (err) {
      Swal.fire({ icon: "error", text: apiMessage(err, "Could not update the appointment status.") });
    }
  };

  const handleDelete = async (row) => {
    const appId = Number(row.patientAppId || row.id);
    if (!appId) return;
    const result = await Swal.fire({
      icon: "warning",
      title: "Cancel this appointment?",
      text: `${row.patient} · ${row.time}`,
      showCancelButton: true,
      confirmButtonText: "Cancel appointment",
      cancelButtonText: "Keep",
    });
    if (!result.isConfirmed) return;
    try {
      await cancelAppointment({
        patientAppId: appId,
        reasonCode: "PatientRequest",
        reasonText: "Cancelled from reception desk",
      });
      onChanged?.();
    } catch (err) {
      Swal.fire({ icon: "error", text: apiMessage(err, "Could not cancel the appointment.") });
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedAppointment(null);
  };

  return (
    <Row className="reception-appointments-row">
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
                    <span className="doctor-patient-tab-label">Today ({todaySource.length})</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    style={{ cursor: "pointer" }}
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <span className="doctor-patient-tab-label">All ({allSource.length})</span>
                  </NavLink>
                </NavItem>
              </Nav>
              {activeTab === "2" ? (
                <div className="doctor-dashboard-appointment-date flex-shrink-0 d-inline-flex align-items-center gap-1">
                  <DateOfBirthPicker
                    name="receptionAllListDate"
                    value={allListDate}
                    minDate={null}
                    maxDate={null}
                    placeholder="All dates"
                    onChange={(dateStr) => setAllListDate(dateStr || "")}
                  />
                  {allListDate ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-soft-secondary"
                      title="Clear date"
                      aria-label="Clear date"
                      onClick={() => setAllListDate("")}
                    >
                      <i className="ri-close-line" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              ) : null}
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
            {loadError ? <div className="text-danger small px-3 py-2">{loadError}</div> : null}
            <TabContent activeTab={activeTab} className="text-muted">
              <TabPane tabId="1">
                <AppointmentTable
                  rows={todayRows}
                  searchTerm={searchTerm}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: "No appointments available",
                  }}
                />
              </TabPane>
              <TabPane tabId="2">
                <AppointmentTable
                  rows={allRows}
                  searchTerm={searchTerm}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: showingAllByDate
                      ? `No appointments on ${allListDate}`
                      : "Select a date to view appointments",
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
