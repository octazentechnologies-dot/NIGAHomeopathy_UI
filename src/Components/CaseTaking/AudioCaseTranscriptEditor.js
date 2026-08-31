import React, { useEffect, useMemo, useState } from 'react';
import { Input } from 'reactstrap';

const countWords = (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const AudioCaseTranscriptEditor = ({
  transcript = '',
  onTranscriptChange,
  onReAnalyze,
  reAnalyzeLoading = false,
  disabled = false,
  embedded = false,
}) => {
  const [draft, setDraft] = useState(transcript || '');

  useEffect(() => {
    setDraft(transcript || '');
  }, [transcript]);

  const isDirty = draft.trim() !== String(transcript || '').trim();
  const canReAnalyze = Boolean(draft.trim()) && !disabled && !reAnalyzeLoading;
  const wordCount = useMemo(() => countWords(draft), [draft]);
  const charCount = draft.length;

  return (
    <div className={`ac-col-card ac-col-card--transcript${embedded ? ' is-embedded' : ''}`}>
      <div className="ac-col-card__header">
        <div className="ac-col-card__title">
          <span className="ac-col-card__title-icon" aria-hidden="true">
            <i className="ri-text-block" />
          </span>
          Transcript
        </div>
        <button
          type="button"
          className={`btn btn-sm ac-col-card__action ${isDirty ? 'ac-btn-primary' : 'ac-btn-secondary'}`}
          disabled={!canReAnalyze}
          onClick={() => onReAnalyze?.(draft.trim())}
          title="Re-analyze from transcript"
        >
          {reAnalyzeLoading ? (
            <i className="ri-loader-4-line" />
          ) : (
            <i className="ri-refresh-line" />
          )}
          <span className="ac-col-card__action-label">
            {reAnalyzeLoading ? 'Re-analyzing…' : 'Re-analyze'}
          </span>
        </button>
      </div>
      <div className="ac-col-card__divider" />
      <div className="ac-col-card__body ac-transcript-body ac-transcript-body--embedded">
        <Input
          type="textarea"
          value={draft}
          disabled={disabled || reAnalyzeLoading}
          onChange={(event) => {
            setDraft(event.target.value);
            onTranscriptChange?.(event.target.value);
          }}
          aria-label="Editable transcript"
          className="ac-transcript-textarea"
        />
        <div className="ac-transcript-meta">
          <span>
            {wordCount.toLocaleString()}
            {' '}
            words ·
            {' '}
            {charCount.toLocaleString()}
            {' '}
            chars
          </span>
          {isDirty ? (
            <span className="text-warning">Edited — re-analyze to refresh</span>
          ) : (
            <span>Matches last analysis</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioCaseTranscriptEditor;
