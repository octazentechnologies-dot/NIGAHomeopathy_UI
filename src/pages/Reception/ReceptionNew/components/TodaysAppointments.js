import React, { useEffect, useMemo, useState } from "react";
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
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../../Components/Common/DateOfBirthPicker";
import moment from "moment";
import Swal from "sweetalert2";
import {
  cancelAppointment,
  getAppointmentQueue,
  getReceptionPatientCard,
  getReceptionVitals,
} from "../../../../helpers/realbackend_helper";
import { getPublicFee, unwrapS4 } from "../../../../helpers/s4Week4Api";
import { paymentStatusMeta } from "../../../../helpers/paymentStatusBadge";
import { apiMessage, readReceptionDoctorId, unwrap } from "../../receptionSession";
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
  const pay = paymentStatusMeta(apiRow.paymentStatus ?? apiRow.PaymentStatus);
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
    appointmentStatus: apiRow.status || apiRow.Status || "—",
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

const matchesSearch = (row, needle) => {
  if (!needle) return true;
  const haystack = [row.time, row.patient, row.doctor, row.type, row.payment, row.status]
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

const AppointmentTable = ({ rows, searchTerm, emptyMessage, onView, onEdit, onDelete }) => (
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
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="fw-medium text-nowrap">{row.time}</td>
            <td>{row.patient}</td>
            <td className="text-nowrap">{row.doctor}</td>
            <td className="text-muted">{row.type}</td>
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
            <td colSpan={7} className="text-center text-muted">
              {searchTerm ? emptyMessage.search : emptyMessage.empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const TodaysAppointments = ({ onEditAppointment, refreshKey = 0, onChanged }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(moment().format(DOB_DISPLAY_FORMAT));
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [todaySource, setTodaySource] = useState([]);
  const [allSource, setAllSource] = useState([]);
  const [loadError, setLoadError] = useState("");
  const doctorId = readReceptionDoctorId();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!doctorId) {
        setTodaySource([]);
        setAllSource([]);
        setLoadError("Reception doctor context is missing.");
        return;
      }
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
        if (cancelled) return;
        const fee = unwrapS4(feeRes) || {};
        const data = fee.data || fee.Data || fee;
        const feeByType = {
          inClinic: data.inClinicFee ?? data.InClinicFee ?? null,
          tele: data.teleFee ?? data.TeleFee ?? data.inClinicFee ?? data.InClinicFee ?? null,
        };
        setTodaySource(unwrapQueue(queueRes).map((row) => mapQueueRow(row, feeByType)));
        setAllSource(unwrapQueue(dayRes).map((row) => mapQueueRow(row, feeByType)));
      } catch (err) {
        if (cancelled) return;
        setTodaySource([]);
        setAllSource([]);
        setLoadError(apiMessage(err, "Could not load appointments."));
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
                  minDate={null}
                  maxDate={null}
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
            {loadError ? <div className="text-danger small px-3 py-2">{loadError}</div> : null}
            <TabContent activeTab={activeTab} className="text-muted">
              <TabPane tabId="1">
                <AppointmentTable
                  rows={todayRows}
                  searchTerm={searchTerm}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: "No appointments available",
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
