import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";

import { s4Message } from "../../../helpers/s4Week4Api";
import { savePharmacyConfig } from "../../../helpers/s5Week5Api";
import { EMPTY_PHARMACY_CONFIG, WEEK_DAYS, formatConfigTime, loadPharmacyConfig } from "../pharmacyConfigStore";
import "./pharmacyConfigForm.css";

const splitAreas = (raw) =>
  String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/** HTML time inputs may return HH:mm or HH:mm:ss — API expects HH:mm. */
const toHHmm = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const m = moment(raw, ["HH:mm:ss", "HH:mm", "H:mm"], true);
  return m.isValid() ? m.format("HH:mm") : raw.slice(0, 5);
};

const validateConfig = (config, areas) => {
  const openTime = toHHmm(config.openTime);
  const closeTime = toHHmm(config.closeTime);
  const delivery = config.deliveryCharge === "" || config.deliveryCharge == null ? null : Number(config.deliveryCharge);
  const freeAbove = config.freeAbove === "" || config.freeAbove == null ? null : Number(config.freeAbove);
  const capacity = config.capacity === "" || config.capacity == null ? null : Number(config.capacity);
  const fieldErrors = {};

  if (!openTime) fieldErrors.openTime = "Opening time is required.";
  if (!closeTime) fieldErrors.closeTime = "Closing time is required.";
  if (openTime && closeTime && closeTime <= openTime) {
    fieldErrors.closeTime = "Closing time must be after opening time on the same day (overnight hours are not supported).";
  }
  if (!config.days?.length) fieldErrors.days = "Select at least one working day.";
  if (!areas.length) fieldErrors.areas = "Add at least one service area.";
  else if (areas.some((a) => a.length < 2)) fieldErrors.areas = "Each service area needs at least 2 characters.";
  else if (areas.some((a) => a.length > 100)) fieldErrors.areas = "Each service area can be at most 100 characters.";
  else if (areas.length > 50) fieldErrors.areas = "Up to 50 service areas are allowed.";

  if (delivery == null || Number.isNaN(delivery)) fieldErrors.deliveryCharge = "Delivery charge is required (use 0 for free).";
  else if (delivery < 0) fieldErrors.deliveryCharge = "Delivery charge cannot be negative.";
  else if (delivery > 100000) fieldErrors.deliveryCharge = "Delivery charge is too high.";

  if (freeAbove != null) {
    if (Number.isNaN(freeAbove) || freeAbove < 0) fieldErrors.freeAbove = "Free-above amount cannot be negative.";
    else if (freeAbove > 1000000) fieldErrors.freeAbove = "Free-above amount is too high.";
    else if (delivery != null && !Number.isNaN(delivery) && freeAbove > 0 && freeAbove <= delivery) {
      fieldErrors.freeAbove = "Free-above must be greater than the delivery charge.";
    }
  }

  if (capacity == null || Number.isNaN(capacity)) fieldErrors.capacity = "Daily capacity is required.";
  else if (capacity < 1) fieldErrors.capacity = "Daily capacity must be at least 1 order.";
  else if (capacity > 500) fieldErrors.capacity = "Daily capacity cannot exceed 500 orders.";

  const order = ["openTime", "closeTime", "days", "areas", "deliveryCharge", "freeAbove", "capacity"];
  const first = order.map((key) => fieldErrors[key]).find(Boolean) || "";
  return { fieldErrors, first, openTime, closeTime, delivery, freeAbove, capacity };
};

/** Operating hours, working days, service areas, delivery charges and capacity for one pharmacy partner. */
const PharmacyConfigForm = ({ partner, onSaved, onLoaded, onError, disabled = false, readOnly = false }) => {
  const [config, setConfig] = useState(EMPTY_PHARMACY_CONFIG);
  const [loaded, setLoaded] = useState(EMPTY_PHARMACY_CONFIG);
  const [loading, setLoading] = useState(false);
  const [areaDraft, setAreaDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAreaDraft("");
    setFormError("");
    setFieldErrors({});
    setSavedFlash(false);
    if (!partner?.id) {
      setConfig(EMPTY_PHARMACY_CONFIG);
      setLoaded(EMPTY_PHARMACY_CONFIG);
      return undefined;
    }
    setLoading(true);
    loadPharmacyConfig(partner)
      .then((next) => {
        if (cancelled) return;
        setConfig(next);
        setLoaded(next);
        if (onLoaded) onLoaded(next);
      })
      .catch((err) => {
        if (!cancelled) setFormError(s4Message(err) || "Configuration could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partner?.id]);

  const update = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setFormError("");
    setFieldErrors({});
    setSavedFlash(false);
  };

  const addAreas = (raw) => {
    const incoming = splitAreas(raw);
    if (!incoming.length) return;
    setConfig((prev) => {
      const seen = new Set(prev.areas.map((area) => area.toLowerCase()));
      const merged = [...prev.areas];
      incoming.forEach((area) => {
        if (seen.has(area.toLowerCase())) return;
        seen.add(area.toLowerCase());
        merged.push(area);
      });
      return { ...prev, areas: merged };
    });
    setAreaDraft("");
    setFormError("");
    setFieldErrors((prev) => {
      if (!prev.areas) return prev;
      const next = { ...prev };
      delete next.areas;
      return next;
    });
    setSavedFlash(false);
  };

  const removeArea = (area) => update({ areas: config.areas.filter((item) => item !== area) });

  const toggleDay = (day) =>
    update({
      days: config.days.includes(day)
        ? config.days.filter((d) => d !== day)
        : WEEK_DAYS.filter((d) => d === day || config.days.includes(d)),
    });

  const isReadOnly = Boolean(readOnly);
  const locked = disabled || saving || loading || !partner || isReadOnly;

  const save = async () => {
    if (!partner || locked) return;
    const pending = splitAreas(areaDraft).filter(
      (area) => !config.areas.some((existing) => existing.toLowerCase() === area.toLowerCase())
    );
    const areas = [...config.areas, ...pending];
    const checked = validateConfig(config, areas);
    if (checked.first) {
      setFieldErrors(checked.fieldErrors);
      setFormError(checked.first);
      return;
    }
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    try {
      const response = await savePharmacyConfig(partner.id, {
        openTime: checked.openTime,
        closeTime: checked.closeTime,
        days: config.days,
        areas,
        deliveryCharge: checked.delivery,
        freeAbove: checked.freeAbove,
        capacity: checked.capacity,
      });
      const updatedAt = response?.updatedAt || response?.data?.updatedAt || new Date().toISOString();
      const next = {
        ...config,
        openTime: checked.openTime,
        closeTime: checked.closeTime,
        areas,
        deliveryCharge: String(checked.delivery),
        freeAbove: checked.freeAbove == null ? "" : String(checked.freeAbove),
        capacity: String(checked.capacity),
        configured: true,
        updatedAt,
      };
      setConfig(next);
      setLoaded(next);
      setAreaDraft("");
      setSavedFlash(true);
      if (onSaved) onSaved(next);
    } catch (err) {
      const message = s4Message(err);
      setFormError(message);
      if (onError) onError(message);
    } finally {
      setSaving(false);
    }
  };

  const pendingAreas = useMemo(() => splitAreas(areaDraft), [areaDraft]);
  const previewAreas = useMemo(() => {
    const seen = new Set(config.areas.map((a) => a.toLowerCase()));
    return [...config.areas, ...pendingAreas.filter((a) => !seen.has(a.toLowerCase()))];
  }, [config.areas, pendingAreas]);

  const daysLabel =
    config.days.length === 7 ? "All days" : config.days.length ? config.days.join(", ") : "None set";
  const deliveryLabel =
    Number(config.deliveryCharge) > 0 ? `₹ ${Number(config.deliveryCharge)}` : "Free";
  const freeAboveLabel =
    config.freeAbove !== "" && config.freeAbove != null && Number(config.freeAbove) > 0
      ? `₹ ${Number(config.freeAbove)}`
      : "—";
  const capacityLabel = config.capacity ? `${config.capacity} orders / day` : "—";
  const statusLine = loading
    ? "Loading configuration…"
    : savedFlash
      ? "Saved"
      : config.updatedAt
        ? `Last saved ${moment(config.updatedAt).fromNow()}`
        : config.configured
          ? ""
          : "Not configured yet";

  const invalid = (key) => (fieldErrors[key] ? " is-invalid" : "");

  if (isReadOnly) {
    return (
      <div className="phc-config phc-config--readonly">
        <div className="phc-config__form">
          <div className="phc-config__row">
            <span className="phc-config__label">Operating Hours</span>
            <div className="phc-config__control phc-config__value">
              {loading
                ? "…"
                : `${formatConfigTime(config.openTime)} – ${formatConfigTime(config.closeTime)}`}
            </div>
          </div>
          <div className="phc-config__row">
            <span className="phc-config__label">Working Days</span>
            <div className="phc-config__control phc-config__days phc-config__days--readonly">
              {WEEK_DAYS.map((day) => (
                <span key={day} className={config.days.includes(day) ? "is-on" : undefined}>
                  {day}
                </span>
              ))}
            </div>
          </div>
          <div className="phc-config__row phc-config__row--top">
            <span className="phc-config__label">Service Areas</span>
            <div className="phc-config__control">
              {loading ? (
                <span className="phc-config__value">…</span>
              ) : config.areas.length ? (
                <div className="phc-config__tags is-disabled">
                  {config.areas.map((area) => (
                    <span key={area} className="phc-config__tag">
                      {area}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="phc-config__value phc-config__value--muted">No service areas set</span>
              )}
            </div>
          </div>
          <div className="phc-config__row">
            <span className="phc-config__label">Delivery Charges</span>
            <div className="phc-config__control phc-config__value">
              {loading ? "…" : `${deliveryLabel}${freeAboveLabel !== "—" ? ` · Free above ${freeAboveLabel}` : ""}`}
            </div>
          </div>
          <div className="phc-config__row">
            <span className="phc-config__label">Daily Capacity</span>
            <div className="phc-config__control phc-config__value">{loading ? "…" : capacityLabel}</div>
          </div>
        </div>

        <div className="phc-config__summary">
          <i className="ri-information-line" aria-hidden="true" />
          <span>
            Open {formatConfigTime(config.openTime)} – {formatConfigTime(config.closeTime)} on{" "}
            {daysLabel.toLowerCase()} ·{" "}
            {Number(config.deliveryCharge) > 0 ? `₹${Number(config.deliveryCharge)} delivery` : "Free delivery"}
            {Number(config.freeAbove) > 0 && Number(config.deliveryCharge) > 0
              ? `, free above ₹${Number(config.freeAbove)}`
              : ""}
          </span>
        </div>

        {formError ? <p className="phc-config__error">{formError}</p> : null}

        <div className="phc-config__footer">
          <span className="phc-config__saved">{statusLine}</span>
          <span className="phc-config__readonly-note">
            View only — filling pharmacies manage hours on their pharmacy dashboard.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="phc-config">
      <div className="phc-config__form">
        <div className={`phc-config__row${invalid("openTime") || invalid("closeTime")}`}>
          <label className="phc-config__label">
            Operating Hours <span className="phc-config__req" aria-hidden="true">*</span>
          </label>
          <div className="phc-config__control phc-config__inline">
            <input
              type="time"
              required
              className={`form-control phc-config__time${invalid("openTime")}`}
              value={toHHmm(config.openTime)}
              disabled={locked}
              onChange={(e) => update({ openTime: toHHmm(e.target.value) })}
              aria-label="Opening time"
              aria-invalid={Boolean(fieldErrors.openTime)}
            />
            <span>to</span>
            <input
              type="time"
              required
              className={`form-control phc-config__time${invalid("closeTime")}`}
              value={toHHmm(config.closeTime)}
              disabled={locked}
              onChange={(e) => update({ closeTime: toHHmm(e.target.value) })}
              aria-label="Closing time"
              aria-invalid={Boolean(fieldErrors.closeTime)}
            />
          </div>
        </div>

        <div className={`phc-config__row${invalid("days")}`}>
          <label className="phc-config__label">
            Working Days <span className="phc-config__req" aria-hidden="true">*</span>
          </label>
          <div className={`phc-config__control phc-config__days${invalid("days")}`} role="group" aria-label="Working days">
            {WEEK_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                disabled={locked}
                className={config.days.includes(day) ? "is-on" : undefined}
                onClick={() => toggleDay(day)}
                aria-pressed={config.days.includes(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className={`phc-config__row phc-config__row--top${invalid("areas")}`}>
          <label className="phc-config__label" htmlFor={`phc-area-${partner?.id || "none"}`}>
            Service Areas <span className="phc-config__req" aria-hidden="true">*</span>
          </label>
          <div className="phc-config__control">
            <div className={`phc-config__tags${locked ? " is-disabled" : ""}${invalid("areas")}`}>
              {config.areas.map((area) => (
                <span key={area} className="phc-config__tag">
                  {area}
                  {!locked ? (
                    <button type="button" aria-label={`Remove ${area}`} onClick={() => removeArea(area)}>
                      <i className="ri-close-line" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
              <input
                id={`phc-area-${partner?.id || "none"}`}
                type="text"
                value={areaDraft}
                disabled={locked}
                onChange={(e) => setAreaDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addAreas(areaDraft);
                  } else if (e.key === "Backspace" && !areaDraft && config.areas.length) {
                    removeArea(config.areas[config.areas.length - 1]);
                  }
                }}
                onBlur={() => addAreas(areaDraft)}
                placeholder={config.areas.length ? "Add area" : "e.g. Mumbai, Thane, Navi Mumbai"}
                aria-invalid={Boolean(fieldErrors.areas)}
              />
            </div>
            <small className="phc-config__hint">Press Enter or comma to add each city / area.</small>
          </div>
        </div>

        <div className={`phc-config__row${invalid("deliveryCharge") || invalid("freeAbove")}`}>
          <label className="phc-config__label" htmlFor={`phc-delivery-${partner?.id || "none"}`}>
            Delivery Charges <span className="phc-config__req" aria-hidden="true">*</span>
          </label>
          <div className="phc-config__control phc-config__inline phc-config__inline--wrap">
            <div className="phc-config__money">
              <span>₹</span>
              <input
                id={`phc-delivery-${partner?.id || "none"}`}
                type="number"
                min="0"
                step="1"
                required
                className={`form-control${invalid("deliveryCharge")}`}
                value={config.deliveryCharge}
                disabled={locked}
                onChange={(e) => update({ deliveryCharge: e.target.value })}
                aria-invalid={Boolean(fieldErrors.deliveryCharge)}
              />
            </div>
            <span>Free above</span>
            <div className="phc-config__money">
              <span>₹</span>
              <input
                type="number"
                min="0"
                step="1"
                className={`form-control${invalid("freeAbove")}`}
                value={config.freeAbove}
                disabled={locked}
                onChange={(e) => update({ freeAbove: e.target.value })}
                placeholder="Optional"
                aria-label="Free delivery above amount"
                aria-invalid={Boolean(fieldErrors.freeAbove)}
              />
            </div>
          </div>
        </div>

        <div className={`phc-config__row${invalid("capacity")}`}>
          <label className="phc-config__label" htmlFor={`phc-capacity-${partner?.id || "none"}`}>
            Daily Capacity <span className="phc-config__req" aria-hidden="true">*</span>
          </label>
          <div className="phc-config__control phc-config__inline">
            <input
              id={`phc-capacity-${partner?.id || "none"}`}
              type="number"
              min="1"
              max="500"
              step="1"
              required
              className={`form-control phc-config__capacity${invalid("capacity")}`}
              value={config.capacity}
              disabled={locked}
              onChange={(e) => update({ capacity: e.target.value })}
              aria-invalid={Boolean(fieldErrors.capacity)}
            />
            <span>orders / day</span>
          </div>
        </div>
      </div>

      <div className="phc-config__summary">
        <i className="ri-information-line" aria-hidden="true" />
        <span>
          Open {formatConfigTime(config.openTime)} – {formatConfigTime(config.closeTime)} on{" "}
          {config.days.length === 7 ? "all days" : config.days.join(", ") || "no days"} ·{" "}
          {Number(config.deliveryCharge) > 0 ? `₹${Number(config.deliveryCharge)} delivery` : "Free delivery"}
          {Number(config.freeAbove) > 0 && Number(config.deliveryCharge) > 0 ? `, free above ₹${Number(config.freeAbove)}` : ""}
          {previewAreas.length ? ` · ${previewAreas.length} area${previewAreas.length === 1 ? "" : "s"}` : ""}
        </span>
      </div>

      {formError ? <p className="phc-config__error">{formError}</p> : null}
      {savedFlash && !formError ? <p className="phc-config__success">Configuration saved.</p> : null}

      <div className="phc-config__footer">
        <span className={`phc-config__saved${savedFlash ? " is-saved" : ""}`}>{statusLine}</span>
        <div>
          <button
            type="button"
            className="phc-config__btn phc-config__btn--ghost"
            disabled={locked}
            onClick={() => {
              setConfig(loaded);
              setAreaDraft("");
              setFormError("");
              setFieldErrors({});
              setSavedFlash(false);
            }}
          >
            Reset
          </button>
          <button type="button" className="phc-config__btn phc-config__btn--primary" disabled={locked} onClick={save}>
            <i className={saving ? "ri-loader-4-line phc-config__spin" : "ri-save-3-line"} aria-hidden="true" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyConfigForm;
