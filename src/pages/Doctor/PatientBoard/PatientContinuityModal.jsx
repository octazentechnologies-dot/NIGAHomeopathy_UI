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
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["data", "items", "Items", "entries", "tasks", "resultObject", "ResultObject"]) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
};

const diaryCategory = (note) => {
  const text = String(note || "").toLowerCase();
  if (/sleep|insomnia|restless sleep|rest/.test(text)) {
    return { key: "sleep", label: "Sleep", icon: "ri-moon-line" };
  }
  if (/acid|digest|stomach|nausea|gastr|fire|heartburn/.test(text)) {
    return { key: "acidity", label: "Acidity", icon: "ri-fire-line" };
  }
  if (/joint|knee|arthritis|rheumat|walk|limb/.test(text)) {
    return { key: "joint", label: "Joint pain", icon: "ri-walk-line" };
  }
  if (/head|migraine|brain|mind|vertigo/.test(text)) {
    return { key: "head", label: "Headache", icon: "ri-brain-line" };
  }
  if (/cough|throat|cold|fever|breath/.test(text)) {
    return { key: "resp", label: "Cough / cold", icon: "ri-lungs-line" };
  }
  const short = String(note || "Symptom").trim().slice(0, 42);
  return { key: `note:${short.toLowerCase()}`, label: short || "Symptom", icon: "ri-heart-pulse-line" };
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
    .map((row, index) => {
      const status = String(pick(row, "status", "Status") || "");
      const done =
        Boolean(pick(row, "completedAt", "CompletedAt")) ||
        /^(done|complete|completed)$/i.test(status.trim()) ||
        /done|complete/i.test(status);
      return {
        id: pick(row, "followUpTaskId", "FollowUpTaskId", "taskId", "TaskId", "id") || `f${index}`,
        title: pick(row, "title", "Title") || "Follow-up task",
        due: pick(row, "dueDate", "DueDate"),
        done,
      };
    })
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));

  const nextOpen = tasks
    .filter((t) => !t.done && t.due)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];

  const diarySorted = [...diaryRows].sort((a, b) =>
    String(pick(a, "entryDate", "EntryDate") || "").localeCompare(String(pick(b, "entryDate", "EntryDate") || ""))
  );

  // Latest entry per symptom category, trend vs previous entry in the same category
  const byCategory = new Map();
  diarySorted.forEach((row) => {
    const note = pick(row, "note", "Note", "body", "Body") || "Symptom entry";
    const cat = diaryCategory(note);
    const severity = Number(pick(row, "severity", "Severity"));
    const at = pick(row, "entryDate", "EntryDate", "createdAt", "CreatedAt");
    const bucket = byCategory.get(cat.key) || [];
    bucket.push({
      id: pick(row, "symptomDiaryId", "SymptomDiaryId", "id"),
      note,
      cat,
      severity: Number.isFinite(severity) ? severity : null,
      at,
    });
    byCategory.set(cat.key, bucket);
  });

  const diary = [...byCategory.values()]
    .map((bucket, index) => {
      const latest = bucket[bucket.length - 1];
      const previous = bucket.length > 1 ? bucket[bucket.length - 2] : null;
      let trend = "same";
      if (latest.severity != null && previous?.severity != null) {
        if (latest.severity < previous.severity) trend = "better";
        else if (latest.severity > previous.severity) trend = "worse";
      }
      const days = latest.at
        ? Math.max(0, moment().startOf("day").diff(moment(latest.at).startOf("day"), "days"))
        : null;
      return {
        id: latest.id || `d${index}`,
        symptom: latest.cat.label,
        detail: latest.note,
        icon: latest.cat.icon,
        days: days == null ? "—" : days,
        severity: latest.severity == null ? "—" : latest.severity,
        trend,
        at: latest.at,
      };
    })
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, 8);

  const seriesSource = asList(pick(progressRaw, "series", "Series") || progressRaw?.series || []);
  let severitySeries = seriesSource
    .map((row) => Number(pick(row, "severity", "Severity") ?? (typeof row === "number" ? row : null)))
    .filter((n) => Number.isFinite(n));

  // Fallback: chronological diary severities if progress payload has no series
  if (!severitySeries.length) {
    severitySeries = diarySorted
      .map((row) => Number(pick(row, "severity", "Severity")))
      .filter((n) => Number.isFinite(n));
  }

  const first = severitySeries[0];
  const last = severitySeries.length ? severitySeries[severitySeries.length - 1] : null;
  const improvement =
    first > 0 && last != null
      ? Math.max(0, Math.min(100, Math.round(((first - last) / first) * 100)))
      : Number(pick(progressRaw, "improvementPercent", "ImprovementPercent")) || 0;

  const visitList = asList(visits);
  const lastVisitRow = visitList
    .map((row) => ({
      at: pick(row, "appointmentDate", "AppointmentDate"),
      status: String(pick(row, "status", "Status") || "").toUpperCase(),
      isExpired: Boolean(pick(row, "isExpired", "IsExpired")),
    }))
    .filter((row) => row.at && row.status !== "CANCELLED")
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];

  const visitCount =
    Number(pick(progressRaw, "visitCount", "VisitCount")) ||
    visitList.filter((row) => {
      const status = String(pick(row, "status", "Status") || "").toUpperCase();
      return status !== "CANCELLED" && !pick(row, "isExpired", "IsExpired");
    }).length ||
    0;

  return {
    lastVisit: lastVisitRow?.at ? moment(lastVisitRow.at) : null,
    nextFollowUp: nextOpen?.due ? moment(nextOpen.due) : null,
    tasks,
    diary,
    improvement: Number.isFinite(improvement) ? improvement : 0,
    visits: visitCount,
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
  const [partialError, setPartialError] = useState("");
  const [data, setData] = useState(emptyData);

  useEffect(() => {
    if (!isOpen) return undefined;
    const id = Number(patientId);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Patient id is missing for this board.");
      setPartialError("");
      setData(emptyData());
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setPartialError("");
      try {
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
        const progressRaw = value(2) && typeof value(2) === "object" ? value(2) : {};
        const visitsRaw = value(3);
        const visits = Array.isArray(visitsRaw) ? visitsRaw : asList(visitsRaw);

        const failed = results
          .map((row, index) =>
            row.status === "rejected" ? ["Follow-ups", "Diary", "Progress", "Visits"][index] : null
          )
          .filter(Boolean);

        if (results.every((r) => r.status === "rejected")) {
          setError(s4Message(results[0].reason) || "Could not load continuity data.");
          setData(emptyData());
        } else {
          setData(buildContinuity({ followUps, diaryRows, progressRaw, visits }));
          if (failed.length) {
            setPartialError(`Some sections could not load: ${failed.join(", ")}.`);
          }
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
        {!loading && !error && partialError ? <div className="pc-state pc-state--warn">{partialError}</div> : null}

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
                <p className="pc-note mb-0">No follow-up tasks for this patient yet. Tasks appear when you set a follow-up from eRx / tele complete.</p>
              ) : (
                <ul className="pc-tasks">
                  {data.tasks.map((task) => (
                    <li key={task.id} className={task.done ? "is-done" : ""}>
                      <i className={task.done ? "ri-checkbox-circle-fill" : "ri-time-line"} aria-hidden="true" />
                      <span>
                        {task.title}
                        {task.due ? (
                          <small className="pc-task-due"> · due {moment(task.due).format("DD MMM YYYY")}</small>
                        ) : null}
                      </span>
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
                <p className="pc-note">No diary entries yet. Patients add these from Care continuity in the patient app.</p>
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
                <div className="pc-trendbars" aria-label="Severity over time">
                  {data.severitySeries.map((value, index) => (
                    <span key={index} className="pc-trendbars__col" title={`V${index + 1}: ${value}/10`}>
                      <span className="pc-trendbars__bar" style={{ height: `${(value / maxSeverity) * 100}%` }} />
                      <span className="pc-trendbars__tick">V{index + 1}</span>
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
