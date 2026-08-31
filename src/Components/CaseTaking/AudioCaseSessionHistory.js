import React, { useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  formatAudioSessionTime,
  formatDurationFromSeconds,
  getAudioSessionStatusKey,
  groupAudioSessionsByDate,
  isLiveAudioSource,
} from '../../helpers/audioCaseTakingHelper';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'processing', label: 'In progress' },
  { id: 'failed', label: 'Failed' },
];

const statusLabel = (statusKey, stageLabel) => {
  if (statusKey === 'completed') return 'Completed';
  if (statusKey === 'failed') return 'Failed';
  if (statusKey === 'processing') return stageLabel || 'In progress';
  return stageLabel || 'Recorded';
};

const AudioCaseSessionHistory = ({
  sessions = [],
  totalCount = 0,
  completedCount = 0,
  processingCount = 0,
  failedCount = 0,
  loading = false,
  error = null,
  hasMore = false,
  viewingSessionId = null,
  onOpenSession,
  onLoadMore,
  openingSessionId = null,
  onClose,
  onDownloadSession,
  downloadingSessionId = null,
}) => {
  const [filter, setFilter] = useState('all');

  const filterCounts = {
    all: totalCount,
    completed: completedCount,
    processing: processingCount,
    failed: failedCount,
  };

  const visibleSessions = useMemo(() => {
    if (filter === 'all') {
      return sessions;
    }
    return sessions.filter((session) => getAudioSessionStatusKey(session.status) === filter);
  }, [filter, sessions]);

  const groups = useMemo(() => groupAudioSessionsByDate(visibleSessions), [visibleSessions]);

  return (
    <section className="ac-history" aria-label="Audio session history">
      <div className="ac-history__toolbar">
        <div className="ac-history__intro">
          <div className="ac-history__kicker">Patient archive</div>
          <div className="ac-history__title">Session history</div>
          <p className="ac-history__subtitle">
            {totalCount === 0
              ? 'Recordings for this patient will appear here, grouped by date.'
              : `${totalCount} session${totalCount === 1 ? '' : 's'} · open a card to review, or download the audio file`}
          </p>
        </div>
        <div className="ac-history__filters" role="tablist" aria-label="Filter sessions">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={classnames('ac-history__chip', { 'is-active': filter === item.id })}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span className="ac-history__chip-count">{filterCounts[item.id] ?? 0}</span>
            </button>
          ))}
          {onClose && (
            <button type="button" className="ac-history__chip ac-history__chip--close" onClick={onClose}>
              Hide
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="ac-history__error" role="alert">
          <i className="ri-error-warning-line" aria-hidden="true" />
          {error}
        </div>
      )}

      {loading && sessions.length === 0 && (
        <div className="ac-history__skeleton ac-history__skeleton--grid" aria-hidden="true">
          <div className="ac-history__skeleton-row" />
          <div className="ac-history__skeleton-row" />
          <div className="ac-history__skeleton-row" />
          <div className="ac-history__skeleton-row" />
          <div className="ac-history__skeleton-row" />
        </div>
      )}

      {!loading && !error && totalCount === 0 && (
        <div className="ac-history__empty">
          <span className="ac-history__empty-icon" aria-hidden="true">
            <i className="ri-mic-line" />
          </span>
          <div className="fw-semibold">No audio sessions yet</div>
          <p>Record live or upload a file. Each completed, in-progress, and failed session is kept here for this patient.</p>
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="ac-history__timeline">
          {groups.map((group) => (
            <div key={group.label} className="ac-history__group">
              <div className="ac-history__date">{group.label}</div>
              <div className="ac-history__list">
                {group.items.map((session) => {
                  const statusKey = getAudioSessionStatusKey(session.status);
                  const isActive = viewingSessionId === session.sessionId;
                  const isOpening = openingSessionId === session.sessionId;
                  const isDownloading = downloadingSessionId === session.sessionId;
                  const duration = formatDurationFromSeconds(session.audioDurationSeconds);
                  const live = isLiveAudioSource(session.audioSourceType);
                  const headline = session.chiefComplaintSnippet
                    || (statusKey === 'failed'
                      ? (session.errorMessage || 'Analysis did not complete')
                      : statusKey === 'processing'
                        ? (session.stageLabel || 'Analysis in progress')
                        : 'Audio case session');

                  return (
                    <article
                      key={session.sessionId}
                      className={classnames('ac-history-card', `is-${statusKey}`, {
                        'is-active': isActive,
                        'is-opening': isOpening,
                      })}
                    >
                      <button
                        type="button"
                        className="ac-history-card__main"
                        onClick={() => onOpenSession?.(session)}
                        aria-label={`Open session from ${formatAudioSessionTime(session.enteredDate)}: ${headline}`}
                      >
                        <span className="ac-history-card__top">
                          <span className="ac-history-card__time">
                            {formatAudioSessionTime(session.enteredDate)}
                            {duration ? ` · ${duration}` : ''}
                          </span>
                          <span className={classnames('ac-history-card__status', `is-${statusKey}`)}>
                            {isOpening ? 'Opening…' : statusLabel(statusKey, session.stageLabel)}
                          </span>
                        </span>
                        <span className="ac-history-card__headline" title={headline}>
                          {headline}
                        </span>
                        <span className="ac-history-card__meta">
                          <span className="ac-history-card__pill">
                            <i className={live ? 'ri-mic-line' : 'ri-upload-2-line'} aria-hidden="true" />
                            {live ? 'Live' : 'Upload'}
                          </span>
                          {statusKey === 'completed' && (
                            <>
                              <span className="ac-history-card__pill" title={`${session.messageCount || 0} conversation turns`}>
                                <i className="ri-chat-3-line" aria-hidden="true" />
                                {session.messageCount || 0}
                              </span>
                              <span className="ac-history-card__pill" title={`${session.rubricCount || 0} rubrics`}>
                                <i className="ri-list-check-3" aria-hidden="true" />
                                {session.rubricCount || 0}
                              </span>
                            </>
                          )}
                        </span>
                      </button>
                      <div className="ac-history-card__footer">
                        <button
                          type="button"
                          className="ac-history-card__download"
                          disabled={!session.hasAudioFile || isDownloading}
                          title={session.hasAudioFile ? 'Download audio file' : 'Audio file is not available'}
                          aria-label={session.hasAudioFile ? `Download audio file for ${headline}` : 'Audio file is not available'}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onDownloadSession?.(session);
                          }}
                        >
                          <i
                            className={isDownloading ? 'ri-loader-4-line ac-history-card__spin' : 'ri-download-2-line'}
                            aria-hidden="true"
                          />
                          <span>
                            {isDownloading
                              ? 'Downloading…'
                              : session.hasAudioFile
                                ? 'Download audio file'
                                : 'No audio file'}
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && sessions.length > 0 && visibleSessions.length === 0 && (
        <div className="ac-history__empty ac-history__empty--compact">
          <div className="fw-semibold">No {filter === 'all' ? '' : FILTERS.find((item) => item.id === filter)?.label.toLowerCase()} sessions</div>
          <p>Try another filter to see the rest of this patient’s archive.</p>
        </div>
      )}

      {hasMore && filter === 'all' && (
        <div className="ac-history__more">
          <button
            type="button"
            className="btn btn-sm ac-btn-ghost"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load earlier sessions'}
          </button>
        </div>
      )}
    </section>
  );
};

export default AudioCaseSessionHistory;
