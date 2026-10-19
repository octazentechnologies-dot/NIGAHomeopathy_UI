import React, { useMemo, useState } from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import DailyScheduleSetupModal from "../../../Components/Common/DailyScheduleSetupModal";
import { getAuthUserId } from "../../../helpers/appointmentSlotHelper";

/**
 * APT-07.01 — full-page week schedule. Reuses Get/SaveDailySchedule via DailyScheduleSetupModal.
 */
const DoctorSchedulePage = () => {
  const doctorId = getAuthUserId();
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + mondayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [openDate, setOpenDate] = useState(null);

  document.title = "Schedule | Niga Homeocentrum";

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const shiftWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + delta * 7);
    setWeekStart(next);
  };

  return (
    <div className="page-content doctor-dashboard-page admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title">Clinic schedule</h2>
            <p className="clinic-page-subtitle mb-0">Set slot interval and work hours per day. Same SaveDailySchedule API as the dashboard modal.</p>
          </div>
          <div className="clinic-table-actions">
            <button type="button" className="btn btn-sm btn-soft-secondary clinic-action-btn" onClick={() => shiftWeek(-1)}>
              <i className="ri-arrow-left-s-line" aria-hidden="true" />
              Previous week
            </button>
            <button type="button" className="btn btn-sm btn-soft-secondary clinic-action-btn" onClick={() => shiftWeek(1)}>
              Next week
              <i className="ri-arrow-right-s-line" aria-hidden="true" />
            </button>
          </div>
        </div>
        <Row className="g-2">
          {days.map((d) => {
            const key = d.toISOString().slice(0, 10);
            return (
              <Col key={key} md={6} xl={3}>
                <Card className="admin-dash-card">
                  <CardBody>
                    <div className="fw-medium">{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
                    <button type="button" className="btn btn-sm clinic-primary-btn mt-2" onClick={() => setOpenDate(d)}>
                      <i className="ri-time-line" aria-hidden="true" />
                      Edit hours
                    </button>
                  </CardBody>
                </Card>
              </Col>
            );
          })}
        </Row>
        <DailyScheduleSetupModal
          isOpen={!!openDate}
          doctorId={doctorId}
          scheduleDate={openDate || new Date()}
          requireSave={false}
          onSaved={() => setOpenDate(null)}
          onClose={() => setOpenDate(null)}
        />
      </Container>
    </div>
  );
};

export default DoctorSchedulePage;
