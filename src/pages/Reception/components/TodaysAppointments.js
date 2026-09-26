import React, { useMemo, useState } from "react";
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
import AppointmentPatientViewModal from "./AppointmentPatientViewModal";

const buildAppointmentDetails = (base, details) => ({
  ...base,
  dateDisplay: moment().format("DD MMM YYYY"),
  appointmentStatus: "Scheduled",
  ...details,
});

const APPOINTMENT_ROWS = [
  buildAppointmentDetails(
    {
      id: 1,
      time: "09:30 AM",
      patient: "Rohan Mehta",
      doctor: "Dr. Priya Sharma",
      type: "In-Clinic",
      payment: "₹ 800",
      status: "Paid",
    },
    {
      severity: "Moderate",
      duration: "5 days",
      chiefComplaints: "Headache, mild fever, body ache",
      patientDetails: {
        fullName: "Rohan Mehta",
        ageSex: "34y / Male",
        mobile: "9876543210",
        email: "rohan.mehta@email.com",
        dateOfBirth: "15/03/1992",
        bloodGroup: "B+",
        address: "12, Shivaji Nagar",
        place: "Kolhapur",
        emergencyContact: "9822011111",
        patientId: "PAT-1001",
      },
      vitals: {
        bloodPressure: "120/80 mmHg",
        pulse: "78 bpm",
        temperature: "98.6 °F",
        weight: "72 kg",
        height: "172 cm",
        spo2: "98 %",
        respiratoryRate: "16",
        bloodSugar: "98 mg/dL",
        notes: "Stable vitals at check-in",
      },
      paymentDetails: {
        amount: "₹ 800",
        gst: "₹ 0",
        total: "₹ 800",
        method: "UPI",
        notes: "Paid at reception",
      },
    }
  ),
  buildAppointmentDetails(
    {
      id: 2,
      time: "10:00 AM",
      patient: "Sneha Patil",
      doctor: "Dr. Rahul Mehta",
      type: "Teleconsult",
      payment: "₹ 600",
      status: "Unpaid",
    },
    {
      severity: "Mild",
      duration: "2 weeks",
      chiefComplaints: "Seasonal allergy, sneezing, watery eyes",
      patientDetails: {
        fullName: "Sneha Patil",
        ageSex: "29y / Female",
        mobile: "9123456780",
        email: "sneha.patil@email.com",
        dateOfBirth: "22/08/1996",
        bloodGroup: "O+",
        address: "45, FC Road",
        place: "Pune",
        emergencyContact: "9123400000",
        patientId: "PAT-1002",
      },
      vitals: {
        bloodPressure: "118/76 mmHg",
        pulse: "82 bpm",
        temperature: "98.4 °F",
        weight: "58 kg",
        height: "162 cm",
        spo2: "99 %",
        respiratoryRate: "15",
        bloodSugar: "—",
        notes: "Teleconsult – vitals self-reported",
      },
      paymentDetails: {
        amount: "₹ 0",
        gst: "₹ 0",
        total: "₹ 600",
        method: "—",
        notes: "Payment pending",
      },
    }
  ),
  buildAppointmentDetails(
    {
      id: 3,
      time: "10:30 AM",
      patient: "Amit Shah",
      doctor: "Dr. Priya Sharma",
      type: "In-Clinic",
      payment: "₹ 800",
      status: "Paid",
    },
    {
      severity: "Severe",
      duration: "3 days",
      chiefComplaints: "High fever, cough, fatigue",
      patientDetails: {
        fullName: "Amit Shah",
        ageSex: "47y / Male",
        mobile: "9988776655",
        email: "amit.shah@email.com",
        dateOfBirth: "10/01/1979",
        bloodGroup: "A+",
        address: "88, Andheri West",
        place: "Mumbai",
        emergencyContact: "9988700000",
        patientId: "PAT-1003",
      },
      vitals: {
        bloodPressure: "132/88 mmHg",
        pulse: "92 bpm",
        temperature: "100.2 °F",
        weight: "78 kg",
        height: "175 cm",
        spo2: "96 %",
        respiratoryRate: "18",
        bloodSugar: "110 mg/dL",
        notes: "Mild fever present",
      },
      paymentDetails: {
        amount: "₹ 800",
        gst: "₹ 0",
        total: "₹ 800",
        method: "Card",
        notes: "",
      },
    }
  ),
];

const ALL_APPOINTMENT_ROWS = [
  ...APPOINTMENT_ROWS,
  buildAppointmentDetails(
    {
      id: 4,
      time: "11:00 AM",
      patient: "Priya Desai",
      doctor: "Dr. Rahul Mehta",
      type: "In-Clinic",
      payment: "₹ 800",
      status: "Unpaid",
    },
    {
      severity: "Moderate",
      duration: "1 week",
      chiefComplaints: "Back pain, stiffness in morning",
      appointmentStatus: "Waiting",
      patientDetails: {
        fullName: "Priya Desai",
        ageSex: "37y / Female",
        mobile: "9090909090",
        email: "priya.desai@email.com",
        dateOfBirth: "05/11/1988",
        bloodGroup: "AB+",
        address: "21, Station Road",
        place: "Sangli",
        emergencyContact: "9090911111",
        patientId: "PAT-1004",
      },
      vitals: {
        bloodPressure: "124/82 mmHg",
        pulse: "76 bpm",
        temperature: "98.2 °F",
        weight: "64 kg",
        height: "165 cm",
        spo2: "98 %",
        respiratoryRate: "16",
        bloodSugar: "102 mg/dL",
        notes: "Waiting for doctor",
      },
      paymentDetails: {
        amount: "₹ 0",
        gst: "₹ 0",
        total: "₹ 800",
        method: "—",
        notes: "Collect after consultation",
      },
    }
  ),
  buildAppointmentDetails(
    {
      id: 5,
      time: "11:30 AM",
      patient: "Vikram Joshi",
      doctor: "Dr. Priya Sharma",
      type: "Teleconsult",
      payment: "₹ 600",
      status: "Paid",
    },
    {
      severity: "Mild",
      duration: "4 days",
      chiefComplaints: "Acid reflux, bloating after meals",
      patientDetails: {
        fullName: "Vikram Joshi",
        ageSex: "52y / Male",
        mobile: "9811122233",
        email: "vikram.joshi@email.com",
        dateOfBirth: "30/06/1973",
        bloodGroup: "B-",
        address: "9, College Road",
        place: "Nashik",
        emergencyContact: "9811100000",
        patientId: "PAT-1005",
      },
      vitals: {
        bloodPressure: "128/84 mmHg",
        pulse: "74 bpm",
        temperature: "98.5 °F",
        weight: "81 kg",
        height: "178 cm",
        spo2: "97 %",
        respiratoryRate: "15",
        bloodSugar: "118 mg/dL",
        notes: "",
      },
      paymentDetails: {
        amount: "₹ 600",
        gst: "₹ 0",
        total: "₹ 600",
        method: "Cash",
        notes: "Paid online confirmation",
      },
    }
  ),
];

const matchesSearch = (row, needle) => {
  if (!needle) return true;
  const haystack = [
    row.time,
    row.patient,
    row.doctor,
    row.type,
    row.payment,
    row.status,
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
      aria-label="Delete"
    >
      <i className="ri-delete-bin-5-line" />
    </button>
    <UncontrolledTooltip placement="top" target={`reception-appt-del-${row.id}`}>
      Delete
    </UncontrolledTooltip>
  </div>
);

const AppointmentTable = ({ rows, searchTerm, emptyMessage, onView, onEdit }) => (
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
      </tbody>
    </table>
  </div>
);

const TodaysAppointments = ({ onEditAppointment }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(moment().format(DOB_DISPLAY_FORMAT));
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const needle = searchTerm.trim().toLowerCase();
  const todayRows = useMemo(
    () => APPOINTMENT_ROWS.filter((row) => matchesSearch(row, needle)),
    [needle]
  );
  const allRows = useMemo(
    () => ALL_APPOINTMENT_ROWS.filter((row) => matchesSearch(row, needle)),
    [needle]
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
            <TabContent activeTab={activeTab} className="text-muted">
              <TabPane tabId="1">
                <AppointmentTable
                  rows={todayRows}
                  searchTerm={searchTerm}
                  onView={handleView}
                  onEdit={handleEdit}
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
