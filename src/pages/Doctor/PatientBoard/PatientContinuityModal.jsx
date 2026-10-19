import React, { useEffect, useMemo, useState } from "react";
import { Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";
import moment from "moment";
import {
  getPatientDiary,
  getPatientFollowUps,
  getPatientProgress,
  getPatientVisits,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";

import "./patientContinuityModal.css";

const TREND_META = {
  better: { label: "Better", className: "pc-trend--better", icon: "ri-arrow-down-line" },
  same: { label: "No change", className: "pc-trend--same", icon: "ri-subtract-line" },
  worse: { label: "Worse", className: "pc-trend--worse", icon: "ri-arrow-up-line" },
};

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ["data", "items", "entries", "tasks"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const diaryIcon = (note) => {
  const text = String(note || "").toLowerCase();
  if (/sleep|insomnia|rest/.test(text)) return "ri-moon-line";
  if (/acid|digest|stomach|nausea|fire/.test(text)) return "ri-fire-line";
  if (/joint|knee|arthritis|pain|walk/.test(text)) return "ri-walk-line";
  if (/head|migraine|brain|mind/.test(text)) return "ri-brain-line";
  return "ri-heart-pulse-line";
};

const emptyData = () => ({
  lastVisit: null,
  nextFollowUp: null,
  tasks: [],
  diary: [],
  improvement: 0,
  visits: 0,
  severitySeries: [],
});

const buildContinuity = ({ followUps, diaryRows, progressRaw, visits }) => {
  const tasks = followUps
    .map((row, index) => ({
      id: pick(row, "followUpTaskId", "FollowUpTaskId", "taskId", "TaskId", "id") || `f${index}`,
      title: pick(row, "title", "Title") || "Follow-up task",
      due: pick(row, "dueDate", "DueDate"),
      done:
        Boolean(pick(row, "completedAt", "CompletedAt")) ||
        /done|complete/i.test(String(pick(row, "status", "Status") || "")),
    }))
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));

  const nextOpen = tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];

  const diarySorted = [...diaryRows].sort((a, b) =>
    String(pick(b, "entryDate", "EntryDate") || "").localeCompare(String(pick(a, "entryDate", "EntryDate") || ""))
  );

  const diary = diarySorted.slice(0, 8).map((row, index) => {
    const note = pick(row, "note", "Note", "body", "Body") || "Symptom entry";
    const severity = Number(pick(row, "severity", "Severity"));
    const at = pick(row, "entryDate", "EntryDate", "createdAt", "CreatedAt");
    const older = diarySorted[index + 1];
    const prevSeverity = older != null ? Number(pick(older, "severity", "Severity")) : null;
    let trend = "same";
    if (Number.isFinite(severity) && Number.isFinite(prevSeverity)) {
      if (severity < prevSeverity) trend = "better";
      else if (severity > prevSeverity) trend = "worse";
    }
    const days = at ? Math.max(0, moment().startOf("day").diff(moment(at).startOf("day"), "days")) : null;
    return {
      id: pick(row, "symptomDiaryId", "SymptomDiaryId", "id") || `d${index}`,
      symptom: note,
      icon: diaryIcon(note),
      days: days == null ? "—" : days,
      severity: Number.isFinite(severity) ? severity : "—",
      trend,
    };
  });

  const seriesSource = asList(pick(progressRaw, "series", "Series") || []);
  const severitySeries = seriesSource
    .map((row) => Number(pick(row, "severity", "Severity") ?? row))
    .filter((n) => Number.isFinite(n));

  const first = severitySeries[0];
  const last = severitySeries.length ? severitySeries[severitySeries.length - 1] : null;
  const improvement =
    first > 0 && last != null
      ? Math.max(0, Math.min(100, Math.round(((first - last) / first) * 100)))
      : 0;

  const visitList = asList(visits);
  const lastVisitRow = visitList
    .map((row) => ({
      at: pick(row, "appointmentDate", "AppointmentDate"),
      status: String(pick(row, "status", "Status") || "").toUpperCase(),
    }))
    .filter((row) => row.at && row.status !== "CANCELLED")
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];

  return {
    lastVisit: lastVisitRow?.at ? moment(lastVisitRow.at) : null,
    nextFollowUp: nextOpen?.due ? moment(nextOpen.due) : null,
    tasks,
    diary,
    improvement,
    visits: Number(pick(progressRaw, "visitCount", "VisitCount") || visitList.length || 0),
    severitySeries,
  };
};

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

const PatientContinuityModal = ({ isOpen, toggle, patientName, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(emptyData);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (!patientId) {
      setError("Patient id is missing for this board.");
      setData(emptyData());
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const id = Number(patientId);
        const results = await Promise.allSettled([
          getPatientFollowUps(id),
          getPatientDiary(id),
          getPatientProgress(id),
          getPatientVisits({ patientId: id, pageSize: 50 }),
        ]);
        if (cancelled) return;

        const value = (index) =>
          results[index].status === "fulfilled" ? unwrapS4(results[index].value) : null;

        const followUps = asList(value(0));
        const diaryRows = asList(value(1));
        const progressRaw = value(2) || {};
        const visitsRaw = value(3);
        const visits = Array.isArray(visitsRaw) ? visitsRaw : asList(visitsRaw);

        if (results.every((r) => r.status === "rejected")) {
          setError(s4Message(results[0].reason));
          setData(emptyData());
        } else {
          setData(buildContinuity({ followUps, diaryRows, progressRaw, visits }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(s4Message(err));
          setData(emptyData());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, patientId]);

  const daysToFollowUp = useMemo(() => {
    if (!data.nextFollowUp) return null;
    return data.nextFollowUp.clone().startOf("day").diff(moment().startOf("day"), "days");
  }, [data.nextFollowUp]);

  const doneTasks = data.tasks.filter((task) => task.done).length;
  const maxSeverity = Math.max(...(data.severitySeries.length ? data.severitySeries : [10]), 1);
  const followUpLabel =
    daysToFollowUp == null
      ? null
      : daysToFollowUp === 0
        ? "today"
        : daysToFollowUp > 0
          ? `in ${daysToFollowUp} days`
          : `${Math.abs(daysToFollowUp)}d overdue`;

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
        {loading ? (
          <div className="pc-state">
            <Spinner size="sm" color="primary" /> Loading continuity…
          </div>
        ) : null}

        {!loading && error ? <div className="pc-state pc-state--error">{error}</div> : null}

        {!loading && !error ? (
          <div className="pc-grid">
            <Card icon="ri-calendar-check-line" title="Follow-up Panel">
              <dl className="pc-facts">
                <div>
                  <dt>Last Visit</dt>
                  <dd>{data.lastVisit ? data.lastVisit.format("DD MMM YYYY") : "—"}</dd>
                </div>
                <div>
                  <dt>Next Follow-up</dt>
                  <dd>
                    {data.nextFollowUp ? data.nextFollowUp.format("DD MMM YYYY") : "—"}
                    {followUpLabel ? <span className="pc-pill">{followUpLabel}</span> : null}
                  </dd>
                </div>
              </dl>
              <div className="pc-subhead">
                Follow-up tasks
                <span>{data.tasks.length ? `${doneTasks}/${data.tasks.length} done` : "None yet"}</span>
              </div>
              {data.tasks.length === 0 ? (
                <p className="pc-note mb-0">No follow-up tasks for this patient.</p>
              ) : (
                <ul className="pc-tasks">
                  {data.tasks.map((task) => (
                    <li key={task.id} className={task.done ? "is-done" : ""}>
                      <i className={task.done ? "ri-checkbox-circle-fill" : "ri-time-line"} aria-hidden="true" />
                      {task.title}
                    </li>
                  ))}
                </ul>
              )}
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
              {data.diary.length === 0 ? (
                <p className="pc-note">No diary entries yet.</p>
              ) : (
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
                            {row.days === "—"
                              ? "—"
                              : `${row.days} ${row.days === 1 ? "day" : "days"}`}{" "}
                            · severity {row.severity}/10
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
              )}
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
                    {data.severitySeries.length ? (
                      <>
                        {data.severitySeries[0]} <i className="ri-arrow-right-line" aria-hidden="true" />{" "}
                        {data.severitySeries[data.severitySeries.length - 1]}
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                  <span className="pc-stats__label">Severity (first → now)</span>
                </div>
              </div>
              <div className="pc-subhead">Severity trend</div>
              {data.severitySeries.length === 0 ? (
                <p className="pc-note mb-0">No severity history yet.</p>
              ) : (
                <div className="pc-trendbars" aria-label="Severity by diary entry">
                  {data.severitySeries.map((value, index) => (
                    <span key={index} className="pc-trendbars__col" title={`Entry ${index + 1}: ${value}/10`}>
                      <span className="pc-trendbars__bar" style={{ height: `${(value / maxSeverity) * 100}%` }} />
                      <span className="pc-trendbars__tick">E{index + 1}</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : null}
      </ModalBody>
    </Modal>
  );
};

export default PatientContinuityModal;
