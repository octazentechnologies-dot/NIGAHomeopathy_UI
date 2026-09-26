import React, { useMemo, useState } from "react";
import {
  Button,
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
  Row,
} from "reactstrap";
import { Link } from "react-router-dom";
import moment from "moment";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { getHomeDashboardPath } from "../../../helpers/dashboard_helper";
import "./telemedicine.css";

const DEFAULT_HOURS = [
  { id: 1, start: "09:00 AM", end: "01:00 PM" },
  { id: 2, start: "05:00 PM", end: "08:00 PM" },
];

const TODAY_STATS = [
  { id: "scheduled", label: "Scheduled", value: 4, tone: "scheduled" },
  { id: "waiting", label: "Waiting", value: 2, tone: "waiting" },
  { id: "completed", label: "Completed", value: 6, tone: "completed" },
];

const TELE_PATIENTS = [
  {
    id: 1,
    time: "09:30 AM",
    patient: "Rohan Mehta",
    ageSex: "34y / M",
    mobile: "9876543210",
    status: "Scheduled",
  },
  {
    id: 2,
    time: "10:00 AM",
    patient: "Sneha Patil",
    ageSex: "29y / F",
    mobile: "9123456780",
    status: "Waiting",
  },
  {
    id: 3,
    time: "10:30 AM",
    patient: "Amit Shah",
    ageSex: "47y / M",
    mobile: "9988776655",
    status: "Completed",
  },
  {
    id: 4,
    time: "11:15 AM",
    patient: "Priya Desai",
    ageSex: "37y / F",
    mobile: "9090909090",
    status: "Waiting",
  },
  {
    id: 5,
    time: "12:00 PM",
    patient: "Vikram Joshi",
    ageSex: "52y / M",
    mobile: "9811122233",
    status: "Scheduled",
  },
  {
    id: 6,
    time: "05:30 PM",
    patient: "Neha Joshi",
    ageSex: "26y / F",
    mobile: "9900112233",
    status: "Completed",
  },
];

const statusBadgeClass = (status) => {
  if (status === "Completed") return "bg-success-subtle text-success";
  if (status === "Waiting") return "bg-warning-subtle text-warning";
  return "bg-info-subtle text-info";
};

const TelemedicineDashboard = () => {
  document.title = "Telemedicine | Niga Homeocentrum";

  const [isOnline, setIsOnline] = useState(true);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [editHoursOpen, setEditHoursOpen] = useState(false);
  const [draftHours, setDraftHours] = useState(DEFAULT_HOURS);
  const [queueOpen, setQueueOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const newRequests = 0;

  const dateWiseHours = useMemo(() => {
    const days = [0, 1, 2, 3, 4].map((offset) => {
      const date = moment().add(offset, "day");
      return {
        key: date.format("YYYY-MM-DD"),
        label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.format("dddd"),
        dateDisplay: date.format("DD MMM YYYY"),
        slots: hours,
      };
    });
    return days;
  }, [hours]);

  const filteredPatients = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return TELE_PATIENTS;
    return TELE_PATIENTS.filter((row) =>
      [row.time, row.patient, row.ageSex, row.mobile, row.status]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [searchTerm]);

  const openEditHours = () => {
    setDraftHours(hours.map((slot) => ({ ...slot })));
    setEditHoursOpen(true);
  };

  const saveHours = () => {
    setHours(draftHours.map((slot) => ({ ...slot })));
    setEditHoursOpen(false);
  };

  const updateDraftHour = (id, field, value) => {
    setDraftHours((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  return (
    <React.Fragment>
      <div className="page-content doctor-dashboard-page telemedicine-dashboard-page">
        <Container fluid>
          <div className="telemedicine-page-header mb-2">
            <Link to={getHomeDashboardPath()} className="telemedicine-back-link">
              <i className="ri-arrow-left-line" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </div>

          <Row className="g-2 telemedicine-kpi-row">
            <Col xs={12} sm={6} xl={3}>
              <div className="telemedicine-card h-100">
                <h5 className="telemedicine-card__title">Teleconsultation Status</h5>
                <div className="telemedicine-status-row">
                  <label className="telemedicine-toggle" htmlFor="teleStatusToggle">
                    <input
                      id="teleStatusToggle"
                      type="checkbox"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                    />
                    <span className="telemedicine-toggle__track" aria-hidden="true" />
                  </label>
                  <div>
                    <strong className="telemedicine-status-label">
                      {isOnline ? "Online" : "Offline"}
                    </strong>
                    <p className="telemedicine-status-help mb-0">
                      {isOnline
                        ? "You are available for teleconsultations"
                        : "You are currently unavailable for teleconsultations"}
                    </p>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={6} xl={3}>
              <div className="telemedicine-card h-100">
                <h5 className="telemedicine-card__title">Today&apos;s Teleconsultations</h5>
                <div className="telemedicine-stat-grid">
                  {TODAY_STATS.map((stat) => (
                    <div
                      key={stat.id}
                      className={`telemedicine-stat-pill telemedicine-stat-pill--${stat.tone}`}
                    >
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col xs={12} sm={6} xl={3}>
              <div className="telemedicine-card h-100">
                <div className="telemedicine-card__header">
                  <h5 className="telemedicine-card__title mb-0">Teleconsultation Hours</h5>
                  <button
                    type="button"
                    className="telemedicine-edit-link"
                    onClick={openEditHours}
                  >
                    <i className="ri-edit-box-line" aria-hidden="true" />
                    Edit
                  </button>
                </div>
                <ul className="telemedicine-hours-list">
                  {hours.map((slot) => (
                    <li key={slot.id}>
                      <span className="telemedicine-hours-list__icon" aria-hidden="true">
                        <i className="ri-time-line" />
                      </span>
                      <span>
                        {slot.start} – {slot.end}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>

            <Col xs={12} sm={6} xl={3}>
              <div className="telemedicine-card h-100">
                <h5 className="telemedicine-card__title">Instant Consultation Requests</h5>
                <div className="telemedicine-requests-row">
                  <div className="telemedicine-requests-count">
                    <span className="telemedicine-requests-count__icon" aria-hidden="true">
                      <i className="ri-smartphone-line" />
                    </span>
                    <div>
                      <strong>{newRequests}</strong>
                      <span>New Requests</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    color="soft-info"
                    className="telemedicine-queue-btn"
                    onClick={() => setQueueOpen(true)}
                  >
                    View Queue
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

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
                    <i className="ri-search-line search-icon" />
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle telemedicine-patient-table">
                      <thead>
                        <tr>
                          <th scope="col">Time</th>
                          <th scope="col">Patient</th>
                          <th scope="col">Age / Sex</th>
                          <th scope="col">Mobile</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatients.map((row) => (
                          <tr key={row.id}>
                            <td className="fw-medium text-nowrap">{row.time}</td>
                            <td className="fw-semibold">{row.patient}</td>
                            <td>{row.ageSex}</td>
                            <td>{row.mobile}</td>
                            <td>
                              <span className={`badge ${statusBadgeClass(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-soft-info"
                                aria-label={`View ${row.patient}`}
                              >
                                <i className="ri-eye-line" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-4">
                              {searchTerm
                                ? "No patients found matching your search"
                                : "No telemedicine patients available"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                          <strong>{day.label}</strong>
                          <span>{day.dateDisplay}</span>
                        </div>
                        <ul className="telemedicine-hours-list mb-0">
                          {day.slots.map((slot) => (
                            <li key={`${day.key}-${slot.id}`}>
                              <span className="telemedicine-hours-list__icon" aria-hidden="true">
                                <i className="ri-time-line" />
                              </span>
                              <span>
                                {slot.start} – {slot.end}
                              </span>
                            </li>
                          ))}
                        </ul>
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

      <Modal
        isOpen={queueOpen}
        toggle={() => setQueueOpen(false)}
        className="patient-list-modal"
      >
        <ModalHeader
          className="patient-list-modal__header"
          toggle={() => setQueueOpen(false)}
        >
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i
              className="ri-list-check-2"
              style={{ color: "#25a0e2", fontSize: 15 }}
              aria-hidden="true"
            />
            <span className="patient-list-modal__title-text">Instant Consultation Queue</span>
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="text-center text-muted py-4">
            <i className="ri-inbox-2-line fs-1 d-block mb-2" aria-hidden="true" />
            No instant consultation requests right now.
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="close" type="button" onClick={() => setQueueOpen(false)}>
            Close
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default TelemedicineDashboard;
