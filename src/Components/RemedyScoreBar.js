import React, { useMemo } from "react";

/** Numeric score for bar width (0–100). Uses `final` from common/uncommon remedy API. */
export function parseRemedyFinalPercent(value) {
  if (value == null || value === "") return 0;
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.min(100, Math.max(0, num));
  }
  const text = String(value).trim();
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const numeral = Number(fraction[1]);
    const denom = Number(fraction[2]);
    if (denom > 0) {
      return Math.min(100, Math.max(0, (numeral / denom) * 100));
    }
  }
  return 0;
}

export function formatRemedyFinalLabel(value) {
  if (value == null || value === "") return "";
  const num = Number(value);
  if (Number.isFinite(num)) {
    return String(Math.round(num));
  }
  return String(value).trim();
}

export default function RemedyScoreBar({ value, className = "" }) {
  const percent = useMemo(() => parseRemedyFinalPercent(value), [value]);
  const label = useMemo(() => formatRemedyFinalLabel(value), [value]);
  const thumbLeft = useMemo(
    () => Math.min(100, Math.max(0, percent)),
    [percent]
  );

  if (!label) {
    return null;
  }

  return (
    <div
      className={`pb-remedy-score-bar ${className}`.trim()}
      onClick={(e) => e.stopPropagation()}
      role="img"
      aria-label={`Score ${label}`}
    >
      <div className="pb-remedy-score-bar__track">
        <div
          className="pb-remedy-score-bar__fill"
          style={{ width: `${thumbLeft}%` }}
        />
        <div
          className="pb-remedy-score-bar__thumb"
          style={{ left: `${thumbLeft}%` }}
        >
          <span className="pb-remedy-score-bar__dot">{label}</span>
        </div>
      </div>
    </div>
  );
}
