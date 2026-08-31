import React from 'react';

const renderList = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-muted">—</span>;
  }
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`summary-item-${index}`}>{item}</li>
      ))}
    </ul>
  );
};

const SummaryField = ({
  label,
  icon,
  children,
  wide = false,
  chief = false,
  alert = false,
}) => (
  <div
    className={[
      'ac-summary-field',
      wide ? 'ac-summary-field--wide' : '',
      chief ? 'ac-summary-field--chief' : '',
      alert ? 'ac-summary-field--alert' : '',
    ].filter(Boolean).join(' ')}
  >
    <div className="ac-summary-label">
      {icon ? <i className={icon} aria-hidden="true" /> : null}
      {label}
    </div>
    <div className="ac-summary-value">{children}</div>
  </div>
);

const AudioCaseSummaryPanel = ({ summary, onAppendToHistoryNote, embedded = false }) => {
  if (!summary) {
    return (
      <div className={`ac-col-card ac-col-card--summary${embedded ? ' is-embedded' : ''}`}>
        <div className="ac-col-card__header">
          <div className="ac-col-card__title">
            <span className="ac-col-card__title-icon" aria-hidden="true">
              <i className="ri-file-list-3-line" />
            </span>
            Summary
          </div>
        </div>
        <div className="ac-col-card__divider" />
        <div className="ac-col-card__body ac-conversation-empty">
          <p className="mb-0 text-muted small">No summary was generated for this analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ac-col-card ac-col-card--summary${embedded ? ' is-embedded' : ''}`}>
      <div className="ac-col-card__header">
        <div className="ac-col-card__title">
          <span className="ac-col-card__title-icon" aria-hidden="true">
            <i className="ri-file-list-3-line" />
          </span>
          Summary
        </div>
        {onAppendToHistoryNote && (
          <button
            type="button"
            className="btn btn-sm ac-btn-secondary ac-col-card__action"
            onClick={onAppendToHistoryNote}
            title="Append to history note"
          >
            <i className="ri-file-add-line" />
            <span className="ac-col-card__action-label">Append</span>
          </button>
        )}
      </div>
      <div className="ac-col-card__divider" />
      <div className="ac-col-card__body custom-scrollbar">
        <div className="ac-summary-grid ac-summary-grid--compact">
          <SummaryField label="Chief complaint" icon="ri-stethoscope-line" chief wide>
            {summary.chiefComplaint || '—'}
          </SummaryField>
          <SummaryField label="History" icon="ri-time-line" wide>
            {summary.historyOfPresentIllness || '—'}
          </SummaryField>
          <SummaryField label="Mentals" icon="ri-brain-line">
            {renderList(summary.mentals)}
          </SummaryField>
          <SummaryField label="Generals" icon="ri-user-heart-line">
            {renderList(summary.generals)}
          </SummaryField>
          <SummaryField label="Modalities" icon="ri-contrast-drop-2-line">
            {renderList(summary.modalities)}
          </SummaryField>
          <SummaryField label="Particulars" icon="ri-focus-3-line">
            {renderList(summary.particulars)}
          </SummaryField>
          {Array.isArray(summary.redFlags) && summary.redFlags.length > 0 && (
            <SummaryField label="Red flags" icon="ri-alarm-warning-line" alert wide>
              {renderList(summary.redFlags)}
            </SummaryField>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioCaseSummaryPanel;
