import React, { useEffect, useState } from "react";
import { Container, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import Flatpickr from "react-flatpickr";
import ReactApexChart from "react-apexcharts";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { formatCount } from "./reportData";
import "./doctorReports.css";

export const ReportShell = ({ title, subtitle, range, onRangeChange, onExport, sample = true, children }) => (
  <div className="page-content clinic-workspace-page">
    <Container fluid>
      <div className="drp-page">
        <div className="drp-page__head">
          <div>
            <h2 className="clinic-page-title mb-1">
              {title}
              {sample ? <span className="drp-sample">Sample data</span> : null}
            </h2>
            {subtitle ? <p className="clinic-page-subtitle mb-0">{subtitle}</p> : null}
          </div>
          <div className="drp-page__controls">
            <label className="drp-range" aria-label="Date range">
              <i className="ri-calendar-2-line" aria-hidden="true" />
              <Flatpickr
                className="drp-range__input"
                value={range}
                onChange={(dates) => {
                  if (dates.length === 2) onRangeChange(dates);
                }}
                options={{ mode: "range", dateFormat: "d M Y", maxDate: "today", disableMobile: true }}
              />
            </label>
            <button type="button" className="drp-icon-btn" title="Export report (CSV)" aria-label="Export report" onClick={onExport}>
              <i className="ri-upload-2-line" aria-hidden="true" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </Container>
  </div>
);

export const KpiGrid = ({ items }) => (
  <div className="drp-kpis" style={{ "--drp-kpi-cols": items.length }}>
    {items.map((k) => (
      <div key={k.label} className={`drp-kpi drp-kpi--${k.tone}${k.emphasis ? " is-emphasis" : ""}`}>
        <span className="drp-kpi__icon"><i className={k.icon} aria-hidden="true" /></span>
        <div className="drp-kpi__body">
          <span className="drp-kpi__label">{k.label}</span>
          <span className="drp-kpi__value">
            <strong>{k.value}</strong>
            {k.share ? <em className="drp-kpi__share">({k.share})</em> : null}
            {typeof k.change === "number" ? (
              <em className={`drp-kpi__change ${k.change >= 0 ? "is-up" : "is-down"}`}>
                <i className={k.change >= 0 ? "ri-arrow-up-line" : "ri-arrow-down-line"} aria-hidden="true" />
                {Math.abs(k.change)}%
              </em>
            ) : null}
          </span>
        </div>
      </div>
    ))}
  </div>
);

export const ChartLegend = ({ items }) => (
  <div className="drp-legend">
    {items.map((item) => (
      <span key={item.label}>
        <i style={{ background: item.color }} aria-hidden="true" />
        {item.label}
      </span>
    ))}
  </div>
);

export const Card = ({ title, actions, children, className = "" }) => (
  <section className={`drp-card ${className}`.trim()}>
    {title || actions ? (
      <div className="drp-card__head">
        {title ? <h3 className="drp-card__title">{title}</h3> : <span />}
        {actions}
      </div>
    ) : null}
    <div className="drp-card__body">{children}</div>
  </section>
);

export const StackedBarChart = ({ categories, series, colors, height = 210, valueFormatter }) => {
  const options = {
    chart: { type: "bar", stacked: true, toolbar: { show: false }, fontFamily: "inherit", animations: { speed: 350 } },
    plotOptions: { bar: { columnWidth: "58%", borderRadius: 2 } },
    dataLabels: { enabled: false },
    colors,
    xaxis: {
      categories,
      tickAmount: Math.min(7, categories.length),
      labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: "9px", colors: "#94a3b8" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "9px", colors: "#94a3b8" },
        formatter: (v) => (valueFormatter ? valueFormatter(v) : formatCount(Math.round(v))),
      },
    },
    grid: { borderColor: "#eef2f6", strokeDashArray: 3, padding: { left: 4, right: 4 } },
    legend: { show: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (v) => (valueFormatter ? valueFormatter(v) : formatCount(v)) },
    },
    states: { hover: { filter: { type: "darken", value: 0.9 } } },
  };
  return <ReactApexChart type="bar" options={options} series={series} height={height} />;
};

export const DonutChart = ({ labels, values, colors, totalLabel = "Total", totalValue, height = 190 }) => {
  const options = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels,
    colors,
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: true, offsetY: 14, fontSize: "10px", color: "#64748b" },
            value: { show: true, offsetY: -12, fontSize: "15px", fontWeight: 700, color: "#1e293b" },
            total: {
              show: true,
              showAlways: true,
              label: totalLabel,
              fontSize: "10px",
              color: "#64748b",
              formatter: () => totalValue,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v) => formatCount(v) } },
  };
  return <ReactApexChart type="donut" options={options} series={values} height={height} />;
};

export const DonutLegend = ({ items }) => (
  <ul className="drp-donut-legend">
    {items.map((item) => (
      <li key={item.label}>
        <i style={{ background: item.color }} aria-hidden="true" />
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </li>
    ))}
  </ul>
);

export const StatusPill = ({ tone, children }) => <span className={`drp-pill drp-pill--${tone}`}>{children}</span>;

export const RowActions = ({ actions }) => (
  <div className="drp-row-actions">
    {actions.map((a) => (
      <button
        key={a.label}
        type="button"
        className={`drp-act drp-act--${a.tone || "view"}`}
        title={a.label}
        aria-label={a.label}
        onClick={a.onClick}
        disabled={a.disabled}
      >
        <i className={a.icon} aria-hidden="true" />
      </button>
    ))}
  </div>
);

export const TableEmpty = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan} className="drp-table__empty">{children}</td>
  </tr>
);

const ModalTitle = ({ icon, color = "#25a0e2", children }) => (
  <span className="patient-list-modal__title patient-list-modal__title--simple">
    <i className={icon} style={{ color, fontSize: 15 }} aria-hidden="true" />
    <span className="patient-list-modal__title-text">{children}</span>
  </span>
);

/**
 * Generic add / edit form. `fields`: [{ key, label, type: text|number|date|select|textarea, options, required, placeholder, full, min }]
 */
export const RecordFormModal = ({ state, fields, onClose, onSubmit }) => {
  const [values, setValues] = useState({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!state) return;
    setTouched(false);
    const initial = {};
    fields.forEach((f) => {
      initial[f.key] = state.values?.[f.key] ?? f.defaultValue ?? "";
    });
    setValues(initial);
  }, [state]);

  if (!state) return null;

  const errors = {};
  fields.forEach((f) => {
    const v = values[f.key];
    if (f.required && (v === "" || v == null)) errors[f.key] = `${f.label} is required`;
    else if (f.type === "number" && v !== "" && (Number.isNaN(Number(v)) || Number(v) < (f.min ?? 0))) {
      errors[f.key] = `Enter a valid ${f.label.toLowerCase()}`;
    }
  });
  const err = (key) => (touched ? errors[key] : "");

  const submit = () => {
    setTouched(true);
    if (Object.keys(errors).length) return;
    const out = {};
    fields.forEach((f) => {
      out[f.key] = f.type === "number" ? Number(values[f.key]) : values[f.key];
    });
    onSubmit(out);
  };

  return (
    <Modal isOpen centered size={state.size || undefined} toggle={onClose} className="patient-list-modal drp-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon={state.icon || "ri-pencil-line"}>{state.title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {state.subject ? <div className="drp-modal__subject">{state.subject}</div> : null}
        <div className="drp-form-grid">
          {fields.map((f) => (
            <div key={f.key} className={`drp-field${f.full || f.type === "textarea" ? " is-full" : ""}`}>
              <label htmlFor={`drp-${f.key}`}>
                {f.label}
                {f.required ? <span className="text-danger"> *</span> : null}
              </label>
              {f.type === "select" ? (
                <Input
                  id={`drp-${f.key}`}
                  type="select"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  invalid={Boolean(err(f.key))}
                >
                  {f.placeholder ? <option value="">{f.placeholder}</option> : null}
                  {f.options.map((o) => (
                    <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                  ))}
                </Input>
              ) : (
                <Input
                  id={`drp-${f.key}`}
                  type={f.type || "text"}
                  rows={f.type === "textarea" ? 3 : undefined}
                  value={values[f.key] ?? ""}
                  min={f.type === "number" ? f.min ?? 0 : f.minDate}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  invalid={Boolean(err(f.key))}
                />
              )}
              {err(f.key) ? <div className="invalid-feedback d-block">{err(f.key)}</div> : null}
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter className="drp-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} />
        <ModalActionButton action={state.isNew ? "save" : "update"} onClick={submit}>
          {state.submitLabel || (state.isNew ? "Save" : "Update")}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

/** Read-only details. `rows`: [[label, value]] */
export const RecordViewModal = ({ state, onClose }) => {
  if (!state) return null;
  return (
    <Modal isOpen centered toggle={onClose} className="patient-list-modal drp-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon={state.icon || "ri-eye-line"}>{state.title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {state.header ? <div className="drp-modal__subject">{state.header}</div> : null}
        <dl className="drp-details">
          {state.rows.map(([label, value]) => (
            <div key={label} className={label === "Notes" ? "is-full" : undefined}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>
      </ModalBody>
      <ModalFooter className="drp-modal__footer">
        {state.onEdit ? <ModalActionButton action="edit" onClick={state.onEdit} /> : null}
        <ModalActionButton action="close" onClick={onClose} />
      </ModalFooter>
    </Modal>
  );
};

export const ConfirmModal = ({ state, onClose, onConfirm }) => {
  if (!state) return null;
  return (
    <Modal isOpen centered toggle={onClose} className="patient-list-modal drp-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon={state.icon || "ri-delete-bin-line"} color={state.color || "#ef4444"}>{state.title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {state.subject ? <div className="drp-modal__subject">{state.subject}</div> : null}
        <p className="drp-modal__text">{state.text}</p>
      </ModalBody>
      <ModalFooter className="drp-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} />
        <ModalActionButton action={state.action || "delete"} iconClassName={state.confirmIcon} onClick={onConfirm}>
          {state.confirmLabel || "Delete"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};
