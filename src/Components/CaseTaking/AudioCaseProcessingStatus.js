import React, { useEffect, useRef, useState } from 'react';
import { Card, CardBody, Progress, Spinner } from 'reactstrap';

const STEP_LABELS = {
  uploading: 'Uploading audio...',
  processing: 'Starting analysis...',
  processingstarted: 'Starting analysis...',
  transcribing: 'Transcribing audio (this is usually the longest step)...',
  transcriptionstarted: 'Transcribing audio...',
  transcriptioncompleted: 'Transcript ready...',
  extracting: 'Extracting clinical symptoms...',
  llmextractionstarted: 'Extracting clinical symptoms...',
  llmextractioncompleted: 'Symptoms extracted...',
  matchingrubrics: 'Matching database rubrics...',
  rubricmatchingstarted: 'Matching database rubrics...',
  conceptgraphpipelinestarted: 'Analyzing case concepts...',
  finalizingresults: 'Preparing your results...',
  finishing: 'Almost done...',
  waiting: 'Still processing on server...',
  reanalysisrequested: 'Re-analysis queued...',
  completed: 'Analysis complete',
};

const STAGE_ORDER = [
  { key: 'transcribe', label: 'Transcribe', minPct: 0 },
  { key: 'extract', label: 'Extract', minPct: 55 },
  { key: 'match', label: 'Match rubrics', minPct: 80 },
  { key: 'finalize', label: 'Finalize', minPct: 95 },
];

/** Format seconds as 45s · 3m 12s · 1h 05m 03s */
export const formatElapsed = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds))) return null;
  const total = Math.max(0, Math.floor(Number(seconds)));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${secs}s`;
};

const resolveActiveStage = (percent, stepKey) => {
  if (stepKey.includes('final')) return 'finalize';
  if (stepKey.includes('match') || stepKey.includes('rubric') || stepKey.includes('concept')) return 'match';
  if (stepKey.includes('extract') || stepKey.includes('llm')) return 'extract';
  if (percent >= 95) return 'finalize';
  if (percent >= 80) return 'match';
  if (percent >= 55) return 'extract';
  return 'transcribe';
};

const AudioCaseProcessingStatus = ({
  status,
  progressStep,
  progressPercent,
  elapsedSeconds,
  takingLonger,
  error,
  usedMockData,
  onContinueWaiting,
  stageLabel,
  engineVersion,
}) => {
  const clientStartedAtRef = useRef(null);
  const frozenElapsedRef = useRef(null);
  const [displayElapsed, setDisplayElapsed] = useState(
    typeof elapsedSeconds === 'number' ? elapsedSeconds : 0,
  );

  const isActive = status === 'processing' || status === 'uploading';
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';

  // Start / reset client stopwatch when analysis begins.
  useEffect(() => {
    if (isActive) {
      if (clientStartedAtRef.current == null) {
        clientStartedAtRef.current = Date.now();
        frozenElapsedRef.current = null;
      }
      return undefined;
    }

    if (isCompleted || isFailed) {
      if (frozenElapsedRef.current == null) {
        const fromClient = clientStartedAtRef.current != null
          ? Math.max(0, Math.floor((Date.now() - clientStartedAtRef.current) / 1000))
          : null;
        const fromServer = typeof elapsedSeconds === 'number' ? elapsedSeconds : null;
        // Prefer client wall-clock when available; fall back to corrected server value.
        frozenElapsedRef.current = fromClient ?? fromServer ?? 0;
      }
      setDisplayElapsed(frozenElapsedRef.current);
      return undefined;
    }

    // idle / reset
    clientStartedAtRef.current = null;
    frozenElapsedRef.current = null;
    setDisplayElapsed(0);
    return undefined;
  }, [isActive, isCompleted, isFailed, elapsedSeconds]);

  // Tick while active — client clock is authoritative so TZ bugs on the server cannot inflate UI time.
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const tick = () => {
      const startedAt = clientStartedAtRef.current ?? Date.now();
      if (clientStartedAtRef.current == null) {
        clientStartedAtRef.current = startedAt;
      }
      const clientSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setDisplayElapsed(clientSeconds);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // When a completed/restored session arrives with server elapsed only (no live client start).
  useEffect(() => {
    if (!isCompleted && !isFailed) return;
    if (clientStartedAtRef.current != null) return;
    if (typeof elapsedSeconds === 'number' && elapsedSeconds >= 0) {
      frozenElapsedRef.current = elapsedSeconds;
      setDisplayElapsed(elapsedSeconds);
    }
  }, [isCompleted, isFailed, elapsedSeconds]);

  if (status === 'idle' || status === 'ready' || status === 'recording') {
    return null;
  }

  const stepKey = String(progressStep || status).toLowerCase();
  const label = stageLabel || STEP_LABELS[stepKey] || 'Processing audio case...';
  const elapsedLabel = formatElapsed(displayElapsed);
  const canContinue = status === 'processing' && stepKey === 'waiting' && typeof onContinueWaiting === 'function';
  const pct = typeof progressPercent === 'number' ? Math.min(100, Math.max(0, progressPercent)) : null;
  const activeStage = resolveActiveStage(pct ?? 0, stepKey);

  return (
    <Card className={`border ac-status-card${isCompleted ? ' is-complete' : ''}${isFailed ? ' is-failed' : ''}`}>
      <CardBody className="py-3">
        <div className="d-flex align-items-start gap-2">
          {!isFailed && !isCompleted && <Spinner size="sm" color="primary" className="mt-1" />}
          {isCompleted && (
            <i className="ri-checkbox-circle-fill text-success fs-4 lh-1" aria-hidden="true" />
          )}
          {isFailed && (
            <i className="ri-error-warning-fill text-danger fs-4 lh-1" aria-hidden="true" />
          )}
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="fw-semibold">{isFailed ? 'Analysis failed' : label}</div>
              <div className="ac-status-meta">
                {!isFailed && pct != null && (
                  <span className="ac-status-chip">{pct}%</span>
                )}
                {!isFailed && elapsedLabel && (
                  <span className="ac-status-chip" title="Analysis duration">
                    <i className="ri-time-line" aria-hidden="true" />
                    {elapsedLabel}
                  </span>
                )}
                {!isFailed && engineVersion && (
                  <span className="ac-status-chip">
                    Engine
                    {' '}
                    {engineVersion}
                  </span>
                )}
              </div>
            </div>

            {!isFailed && !isCompleted && pct != null && (
              <div className="mt-2">
                <Progress value={pct} style={{ height: 6 }} />
              </div>
            )}

            {!isFailed && !isCompleted && (
              <div className="ac-stage-pills">
                {STAGE_ORDER.map((s) => {
                  const isStageActive = s.key === activeStage;
                  const isDone = pct != null && pct > s.minPct && !isStageActive;
                  return (
                    <span
                      key={s.key}
                      className={`ac-stage-pill${isStageActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                    >
                      {isDone ? '✓ ' : isStageActive ? '● ' : '○ '}
                      {s.label}
                    </span>
                  );
                })}
              </div>
            )}

            {takingLonger && !isFailed && !isCompleted && (
              <div className="text-muted small mt-2">
                Transcription can take a few minutes for longer recordings.
                Rubric matching is usually much faster afterward — keep this screen open.
              </div>
            )}
            {usedMockData && isCompleted && (
              <div className="text-warning small mt-1">
                Demo data shown — backend API not available yet.
              </div>
            )}
            {error && <div className="text-danger small mt-1">{error}</div>}
            {canContinue && (
              <div className="mt-2 d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm ac-btn-primary" onClick={onContinueWaiting}>
                  Continue waiting
                </button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default AudioCaseProcessingStatus;
