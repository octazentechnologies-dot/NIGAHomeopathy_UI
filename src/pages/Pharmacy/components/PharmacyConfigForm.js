import React, { useEffect, useState } from "react";
import moment from "moment";

import { s4Message, savePharmacyRouting } from "../../../helpers/s4Week4Api";
import {
  WEEK_DAYS,
  formatConfigTime,
  pharmacyConfigFor,
  readPharmacyConfigs,
  writePharmacyConfig,
} from "../pharmacyConfigStore";
import "./pharmacyConfigForm.css";

const splitAreas = (raw) =>
  String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

/** Operating hours, working days, service areas, delivery charges and capacity for one pharmacy partner. */
const PharmacyConfigForm = ({ partner, onSaved, onError, disabled = false }) => {
  const [config, setConfig] = useState(() => pharmacyConfigFor(partner));
  const [areaDraft, setAreaDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    setConfig(pharmacyConfigFor(partner));
    setSavedAt(partner ? readPharmacyConfigs()[partner.id]?.savedAt || null : null);
    setAreaDraft("");
    setFormError("");
  }, [partner?.id]);

  const update = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setFormError("");
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
  };

  const removeArea = (area) => update({ areas: config.areas.filter((item) => item !== area) });

  const toggleDay = (day) =>
    update({
      days: config.days.includes(day)
        ? config.days.filter((d) => d !== day)
        : WEEK_DAYS.filter((d) => d === day || config.days.includes(d)),
    });

  const validate = (areas) => {
    if (!config.openTime || !config.closeTime) return "Set both opening and closing time.";
    if (config.closeTime <= config.openTime) return "Closing time must be after opening time.";
    if (!config.days.length) return "Select at least one working day.";
    if (!areas.length) return "Add at least one service area.";
    if (config.deliveryCharge === "" || Number(config.deliveryCharge) < 0) return "Enter a valid delivery charge (0 for free).";
    if (config.freeAbove !== "" && Number(config.freeAbove) < 0) return "Free-delivery amount cannot be negative.";
    if (!Number(config.capacity) || Number(config.capacity) < 1) return "Daily capacity must be at least 1 order.";
    return "";
  };

  const save = async () => {
    if (!partner) return;
    const pending = splitAreas(areaDraft).filter(
      (area) => !config.areas.some((existing) => existing.toLowerCase() === area.toLowerCase())
    );
    const areas = [...config.areas, ...pending];
    const problem = validate(areas);
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    try {
      if (!partner.sample) {
        await Promise.all(
          areas.map((area) =>
            savePharmacyRouting({
              pharmacyPartnerId: Number(partner.id),
              area,
              openTime: config.openTime,
              closeTime: config.closeTime,
              capacity: Number(config.capacity),
            })
          )
        );
      }
      const stamp = new Date().toISOString();
      const next = { ...config, areas, savedAt: stamp };
      writePharmacyConfig(partner.id, next);
      setConfig(next);
      setAreaDraft("");
      setSavedAt(stamp);
      if (onSaved) onSaved(next);
    } catch (err) {
      if (onError) onError(s4Message(err));
      else setFormError(s4Message(err));
    } finally {
      setSaving(false);
    }
  };

  const locked = disabled || saving || !partner;

  return (
    <div className="phc-config">
      <div className="phc-config__form">
        <div className="phc-config__row">
          <label className="phc-config__label">Operating Hours</label>
          <div className="phc-config__control phc-config__inline">
            <input
              type="time"
              className="form-control phc-config__time"
              value={config.openTime}
              disabled={locked}
              onChange={(e) => update({ openTime: e.target.value })}
              aria-label="Opening time"
            />
            <span>to</span>
            <input
              type="time"
              className="form-control phc-config__time"
              value={config.closeTime}
              disabled={locked}
              onChange={(e) => update({ closeTime: e.target.value })}
              aria-label="Closing time"
            />
          </div>
        </div>

        <div className="phc-config__row">
          <label className="phc-config__label">Working Days</label>
          <div className="phc-config__control phc-config__days">
            {WEEK_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                disabled={locked}
                className={config.days.includes(day) ? "is-on" : undefined}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="phc-config__row phc-config__row--top">
          <label className="phc-config__label" htmlFor={`phc-area-${partner?.id || "none"}`}>
            Service Areas
          </label>
          <div className="phc-config__control">
            <div className={`phc-config__tags${locked ? " is-disabled" : ""}`}>
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
              />
            </div>
            <small className="phc-config__hint">Press Enter or comma to add each city / area.</small>
          </div>
        </div>

        <div className="phc-config__row">
          <label className="phc-config__label" htmlFor={`phc-delivery-${partner?.id || "none"}`}>
            Delivery Charges
          </label>
          <div className="phc-config__control phc-config__inline phc-config__inline--wrap">
            <div className="phc-config__money">
              <span>₹</span>
              <input
                id={`phc-delivery-${partner?.id || "none"}`}
                type="number"
                min="0"
                className="form-control"
                value={config.deliveryCharge}
                disabled={locked}
                onChange={(e) => update({ deliveryCharge: e.target.value })}
              />
            </div>
            <span>Free above</span>
            <div className="phc-config__money">
              <span>₹</span>
              <input
                type="number"
                min="0"
                className="form-control"
                value={config.freeAbove}
                disabled={locked}
                onChange={(e) => update({ freeAbove: e.target.value })}
                placeholder="Optional"
                aria-label="Free delivery above amount"
              />
            </div>
          </div>
        </div>

        <div className="phc-config__row">
          <label className="phc-config__label" htmlFor={`phc-capacity-${partner?.id || "none"}`}>
            Daily Capacity
          </label>
          <div className="phc-config__control phc-config__inline">
            <input
              id={`phc-capacity-${partner?.id || "none"}`}
              type="number"
              min="1"
              className="form-control phc-config__capacity"
              value={config.capacity}
              disabled={locked}
              onChange={(e) => update({ capacity: e.target.value })}
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
        </span>
      </div>

      {formError ? <p className="phc-config__error">{formError}</p> : null}

      <div className="phc-config__footer">
        <span className="phc-config__saved">{savedAt ? `Last saved ${moment(savedAt).fromNow()}` : ""}</span>
        <div>
          <button
            type="button"
            className="phc-config__btn phc-config__btn--ghost"
            disabled={locked}
            onClick={() => {
              setConfig(pharmacyConfigFor(partner));
              setAreaDraft("");
              setFormError("");
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
