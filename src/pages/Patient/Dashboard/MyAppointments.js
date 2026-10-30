import React, { useMemo, useState } from "react";
import classnames from "classnames";
import moment from "moment";
import { Link } from "react-router-dom";
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
} from "reactstrap";
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../Components/Common/DateOfBirthPicker";

const localDay = (value) => {
  if (!value) return "";
  const m = moment(value);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
};

const formatTime = (value) => {
  if (!value) return "—";
  const m = moment(value, ["HH:mm:ss", "HH:mm", moment.ISO_8601], true);
  if (m.isValid()) return m.format("h:mm A");
  return String(value);
};

const statusTone = (status) => {
  const s = String(status || "").toUpperCase();
  if (/CANCEL|REJECT|FAIL/.test(s)) return "danger";
  if (/COMPLETE|DONE|DELIVER/.test(s)) return "success";
  if (/WAIT|ARRIV|CHECK/.test(s)) return "warning";
  return "info";
};

const AppointmentTable = ({ rows, searchTerm, emptyMessage }) => {
  const needle = searchTerm.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    if (!needle) return true;
    const hay = [row.time, row.doctor, row.mode, row.status, row.date]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0 dashboard-patient-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Doctor</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-muted py-4">
                {needle ? emptyMessage.search : emptyMessage.empty}
              </td>
            </tr>
          ) : (
            filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.dateDisplay}</td>
                <td>{row.time}</td>
                <td>{row.doctor}</td>
                <td>{row.mode}</td>
                <td>
                  <span className={`badge bg-${statusTone(row.status)}-subtle text-${statusTone(row.status)}`}>
                    {row.status || "—"}
                  </span>
                </td>
                <td>
                  <div className="d-inline-flex gap-1">
                    {row.isTele ? (
                      <Link
                        to={`/patient/rejoin?patientAppId=${row.id}`}
                        className="btn btn-sm btn-soft-success"
                        title="Tele visit"
                      >
                        <i className="ri-vidicon-line" />
                      </Link>
                    ) : null}
                    <Link
                      to={`/patient/summary?patientAppId=${row.id}`}
                      className="btn btn-sm btn-soft-info"
                      title="Summary"
                    >
                      <i className="ri-eye-line" />
                    </Link>
                    <Link
                      to={`/patient/check-in?patientAppId=${row.id}`}
                      className="btn btn-sm btn-soft-primary"
                      title="Check in"
                    >
                      <i className="ri-checkbox-circle-line" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const MyAppointments = ({ visits = [], loading = false }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [allListDate, setAllListDate] = useState("");

  const todayIso = moment().format("YYYY-MM-DD");

  const mapped = useMemo(
    () =>
      (Array.isArray(visits) ? visits : []).map((row) => {
        const dateRaw = row.appointmentDate ?? row.AppointmentDate;
        const day = localDay(dateRaw);
        const timeRaw = row.appointmentTime ?? row.AppointmentTime;
        const mode = row.consultMode ?? row.ConsultMode ?? (row.isTele || row.IsTele ? "Tele" : "InClinic");
        return {
          id: row.patientAppId ?? row.PatientAppId ?? `${day}-${timeRaw}`,
          date: day,
          dateDisplay: day ? moment(day).format("DD MMM YYYY") : "—",
          time: formatTime(timeRaw),
          doctor: row.doctorName ?? row.DoctorName ?? "Doctor",
          mode,
          status: row.status ?? row.Status ?? "",
          isTele: !!(row.isTele ?? row.IsTele) || String(mode).toLowerCase().includes("tele"),
        };
      }),
    [visits]
  );

  const todayRows = useMemo(() => mapped.filter((row) => row.date === todayIso), [mapped, todayIso]);

  const allRows = useMemo(() => {
    if (!allListDate) return mapped;
    const iso = moment(allListDate, [DOB_DISPLAY_FORMAT, "YYYY-MM-DD", "MM/DD/YYYY"], true);
    if (!iso.isValid()) return mapped;
    const day = iso.format("YYYY-MM-DD");
    return mapped.filter((row) => row.date === day);
  }, [mapped, allListDate]);

  return (
    <Row className="mt-3" id="patient-appointments">
      <Col xs={12}>
        <Card className="doctor-appointments-card patient-appointments-card mb-0">
          <CardHeader className="align-items-center d-flex flex-wrap gap-2 doctor-dashboard-card-header doctor-patient-nav-tabs doctor-appointments-toolbar">
            <div className="d-flex align-items-center gap-2 flex-wrap doctor-appointments-toolbar__primary">
              <Nav pills className="nav-customs doctor-patient-custom-nav mb-0 flex-shrink-0">
                <NavItem>
                  <NavLink
                    style={{ cursor: "pointer" }}
                    className={classnames({ active: activeTab === "1" })}
                    onClick={() => setActiveTab("1")}
                  >
                    <span className="doctor-patient-tab-label">Today({todayRows.length})</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    style={{ cursor: "pointer" }}
                    className={classnames({ active: activeTab === "2" })}
                    onClick={() => setActiveTab("2")}
                  >
                    <span className="doctor-patient-tab-label">All({mapped.length})</span>
                  </NavLink>
                </NavItem>
              </Nav>
              {activeTab === "2" ? (
                <div className="doctor-dashboard-appointment-date flex-shrink-0 d-inline-flex align-items-center gap-1">
                  <DateOfBirthPicker
                    name="patientAllListDate"
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
            {loading ? <div className="text-muted small px-3 py-3">Loading appointments…</div> : null}
            <TabContent activeTab={activeTab} className="text-muted">
              <TabPane tabId="1">
                <AppointmentTable
                  rows={todayRows}
                  searchTerm={searchTerm}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: "No appointments today",
                  }}
                />
              </TabPane>
              <TabPane tabId="2">
                <AppointmentTable
                  rows={allRows}
                  searchTerm={searchTerm}
                  emptyMessage={{
                    search: "No appointments found matching your search",
                    empty: allListDate ? `No appointments on ${allListDate}` : "No appointments yet",
                  }}
                />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default MyAppointments;
