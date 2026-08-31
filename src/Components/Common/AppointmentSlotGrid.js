import React, { useMemo } from 'react';
import { Spinner } from 'reactstrap';
import {
  getSlotStatusSummary,
  groupSlotsByHour,
} from '../../helpers/appointmentSlotHelper';

const AppointmentSlotGrid = ({
  slots = [],
  loading = false,
  onSlotClick,
  emptyMessage = 'No appointment slots available.',
  showSummaryBar = true,
}) => {
  const groupedSlots = useMemo(() => groupSlotsByHour(slots), [slots]);
  const statusSummary = useMemo(() => getSlotStatusSummary(slots), [slots]);

  const summarySegments = useMemo(() => {
    if (!statusSummary.total) return [];
    return [
      { key: 'available', count: statusSummary.available, className: 'available' },
      { key: 'booked', count: statusSummary.booked, className: 'booked' },
      { key: 'past', count: statusSummary.past, className: 'past' },
      { key: 'current', count: statusSummary.current, className: 'current' },
    ].filter((segment) => segment.count > 0);
  }, [statusSummary]);

  if (loading) {
    return (
      <div className="appointment-slot-grid-loading text-center py-3">
        <Spinner size="sm" color="primary" />
        <div className="text-muted mt-2">Loading time slots...</div>
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="appointment-slot-grid-empty text-muted text-center py-3">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="appointment-slot-grid appointment-slot-grid--compact">
      {showSummaryBar && summarySegments.length > 0 && (
        <div className="appointment-slot-summary">
          <div className="appointment-slot-summary-bar" aria-hidden="true">
            {summarySegments.map((segment) => (
              <div
                key={segment.key}
                className={`appointment-slot-summary-segment ${segment.className}`}
                style={{ flexGrow: segment.count, flexBasis: 0 }}
              />
            ))}
          </div>
          <div className="appointment-slot-legend appointment-slot-legend--inline">
            <span className="appointment-slot-legend-item">
              <span className="appointment-slot-legend-swatch available" />
              Available ({statusSummary.available})
            </span>
            <span className="appointment-slot-legend-item">
              <span className="appointment-slot-legend-swatch booked" />
              Booked ({statusSummary.booked})
            </span>
            <span className="appointment-slot-legend-item">
              <span className="appointment-slot-legend-swatch past" />
              Past ({statusSummary.past})
            </span>
            {statusSummary.current > 0 && (
              <span className="appointment-slot-legend-item">
                <span className="appointment-slot-legend-swatch current" />
                Current ({statusSummary.current})
              </span>
            )}
          </div>
        </div>
      )}

      <div className="appointment-slot-grid-body">
        {groupedSlots.map(([hourLabel, hourSlots]) => (
          <div key={hourLabel} className="appointment-slot-hour-row">
            <div className="appointment-slot-hour-label">{hourLabel}</div>
            <div
              className="appointment-slot-row"
              style={{ gridTemplateColumns: `repeat(${hourSlots.length}, minmax(0, 1fr))` }}
            >
              {hourSlots.map((slot) => {
                const isClickable = slot.status === 'available' && typeof onSlotClick === 'function';
                return (
                  <button
                    key={slot.time}
                    type="button"
                    className={`appointment-slot-chip ${slot.status}`}
                    disabled={!isClickable}
                    title={
                      slot.status === 'booked'
                        ? slot.patientName || 'Booked'
                        : slot.label
                    }
                    onClick={() => {
                      if (isClickable) {
                        onSlotClick(slot);
                      }
                    }}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentSlotGrid;
