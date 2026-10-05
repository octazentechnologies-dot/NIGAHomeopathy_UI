import React, { useMemo } from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import moment from "moment";

import "./patientContinuityModal.css";

const TREND_META = {
  better: { label: "Better", className: "pc-trend--better", icon: "ri-arrow-down-line" },
  same: { label: "No change", className: "pc-trend--same", icon: "ri-subtract-line" },
  worse: { label: "Worse", className: "pc-trend--worse", icon: "ri-arrow-up-line" },
};

const buildSampleContinuity = () => ({
  lastVisit: moment().subtract(9, "days"),
  nextFollowUp: moment().add(21, "days"),
  tasks: [
    { id: "t1", title: "Take remedy as prescribed", done: true },
    { id: "t2", title: "Log symptoms daily in diary", done: true },
    { id: "t3", title: "Share blood report", done: false },
  ],
  diary: [
    { id: "d1", symptom: "Headache", icon: "ri-brain-line", days: 2, severity: 3, trend: "better" },
    { id: "d2", symptom: "Sleep", icon: "ri-moon-line", days: 5, severity: 5, trend: "same" },
    { id: "d3", symptom: "Acidity", icon: "ri-fire-line", days: 3, severity: 2, trend: "better" },
    { id: "d4", symptom: "Joint pain", icon: "ri-walk-line", days: 1, severity: 6, trend: "worse" },
  ],
  improvement: 75,
  visits: 6,
  severitySeries: [8, 7, 7, 5, 4, 3],
});

const Card = ({ icon, title, extra, children }) => (
  <section className="pc-card">
    <header className="pc-card__head">
      <h6 className="pc-card__title">
        <i className={icon} aria-hidden="true" />
        {title}
      </h6>
      {extra}
    </header>
    <div className="pc-card__body">{children}</div>
  </section>
);

const PatientContinuityModal = ({ isOpen, toggle, patientName }) => {
  const data = useMemo(buildSampleContinuity, []);
  const daysToFollowUp = data.nextFollowUp.diff(moment().startOf("day"), "days");
  const doneTasks = data.tasks.filter((task) => task.done).length;
  const maxSeverity = Math.max(...data.severitySeries, 10);

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="xl" className="patient-list-modal pc-modal">
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-heart-pulse-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">
            Patient Continuity{patientName ? ` — ${patientName}` : ""}
          </span>
        </span>
      </ModalHeader>
      <ModalBody>
        <div className="pc-grid">
          <Card icon="ri-calendar-check-line" title="Follow-up Panel">
            <dl className="pc-facts">
              <div>
                <dt>Last Visit</dt>
                <dd>{data.lastVisit.format("DD MMM YYYY")}</dd>
              </div>
              <div>
                <dt>Next Follow-up</dt>
                <dd>
                  {data.nextFollowUp.format("DD MMM YYYY")}
                  <span className="pc-pill">in {daysToFollowUp} days</span>
                </dd>
              </div>
            </dl>
            <div className="pc-subhead">
              Follow-up tasks
              <span>
                {doneTasks}/{data.tasks.length} done
              </span>
            </div>
            <ul className="pc-tasks">
              {data.tasks.map((task) => (
                <li key={task.id} className={task.done ? "is-done" : ""}>
                  <i className={task.done ? "ri-checkbox-circle-fill" : "ri-time-line"} aria-hidden="true" />
                  {task.title}
                </li>
              ))}
            </ul>
          </Card>

          <Card
            icon="ri-book-2-line"
            title="Symptom Diary"
            extra={
              <span className="pc-readonly">
                <i className="ri-lock-line" aria-hidden="true" />
                Read only
              </span>
            }
          >
            <ul className="pc-diary">
              {data.diary.map((row) => {
                const trend = TREND_META[row.trend] || TREND_META.same;
                return (
                  <li key={row.id}>
                    <span className="pc-diary__icon" aria-hidden="true">
                      <i className={row.icon} />
                    </span>
                    <span className="pc-diary__name">
                      {row.symptom}
                      <small>
                        {row.days} {row.days === 1 ? "day" : "days"} · severity {row.severity}/10
                      </small>
                    </span>
                    <span className={`pc-trend ${trend.className}`}>
                      <i className={trend.icon} aria-hidden="true" />
                      {trend.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="pc-note mb-0">Entries are written by the patient from the app.</p>
          </Card>

          <Card icon="ri-line-chart-line" title="Patient Progress">
            <div className="pc-progress">
              <div className="pc-progress__label">
                Overall Improvement
                <strong>{data.improvement}%</strong>
              </div>
              <div
                className="pc-progress__bar"
                role="progressbar"
                aria-valuenow={data.improvement}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${data.improvement}%` }} />
              </div>
            </div>
            <div className="pc-stats">
              <div>
                <span className="pc-stats__value">{data.visits}</span>
                <span className="pc-stats__label">Visits</span>
              </div>
              <div>
                <span className="pc-stats__value">
                  {data.severitySeries[0]} <i className="ri-arrow-right-line" aria-hidden="true" />{" "}
                  {data.severitySeries[data.severitySeries.length - 1]}
                </span>
                <span className="pc-stats__label">Severity (first → now)</span>
              </div>
            </div>
            <div className="pc-subhead">Severity trend</div>
            <div className="pc-trendbars" aria-label="Severity by visit">
              {data.severitySeries.map((value, index) => (
                <span key={index} className="pc-trendbars__col" title={`Visit ${index + 1}: ${value}/10`}>
                  <span className="pc-trendbars__bar" style={{ height: `${(value / maxSeverity) * 100}%` }} />
                  <span className="pc-trendbars__tick">V{index + 1}</span>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default PatientContinuityModal;
