import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';

const DEFAULT_TIME = { hour: 9, minute: 0, period: 'AM' };

const parseTimeValue = (value) => {
    if (!value) return { ...DEFAULT_TIME };

    const parsed = moment(value, ['h:mm A', 'h:i K', 'HH:mm', 'HH:mm:ss'], true);
    if (!parsed.isValid()) return { ...DEFAULT_TIME };

    const hour12 = Number(parsed.format('h'));
    return {
        hour: Number.isNaN(hour12) ? DEFAULT_TIME.hour : hour12,
        minute: parsed.minute(),
        period: parsed.format('A'),
    };
};

const formatTimeValue = ({ hour, minute, period }) =>
    moment(`${hour}:${minute} ${period}`, 'h:m A').format('h:mm A');

const pad2 = (num) => String(num).padStart(2, '0');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizePeriod = (text, fallback = 'AM') => {
    const normalized = String(text || '').trim().toUpperCase();
    if (normalized.startsWith('P')) return 'PM';
    if (normalized.startsWith('A')) return 'AM';
    return fallback;
};

const TimeSegment = ({
    label,
    value,
    min,
    max,
    onChange,
    onIncrement,
    onDecrement,
}) => {
    const [draft, setDraft] = useState(() => pad2(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDraft(pad2(value));
        }
    }, [value, isFocused]);

    const commitDraft = useCallback((rawValue) => {
        const digits = String(rawValue).replace(/\D/g, '');
        if (!digits) {
            setDraft(pad2(value));
            return;
        }

        const parsed = clamp(parseInt(digits, 10), min, max);
        onChange(parsed);
        setDraft(pad2(parsed));
    }, [max, min, onChange, value]);

    const handleChange = (event) => {
        const nextDraft = event.target.value.replace(/\D/g, '').slice(0, 2);
        setDraft(nextDraft);

        if (nextDraft.length === 2) {
            const parsed = parseInt(nextDraft, 10);
            if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
                onChange(parsed);
            }
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        commitDraft(draft);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            onIncrement();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            onDecrement();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft(draft);
            event.currentTarget.blur();
        }
    };

    return (
        <div className="appointment-time-picker__segment" role="group" aria-label={label}>
            <input
                type="text"
                inputMode="numeric"
                className="appointment-time-picker__input"
                value={draft}
                onChange={handleChange}
                onFocus={(event) => {
                    setIsFocused(true);
                    event.target.select();
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-label={label}
                maxLength={2}
                autoComplete="off"
            />
            <div className="appointment-time-picker__arrows">
                <button
                    type="button"
                    className="appointment-time-picker__step"
                    onClick={onIncrement}
                    aria-label={`Increase ${label}`}
                    tabIndex={-1}
                >
                    <i className="ri-arrow-up-s-line" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="appointment-time-picker__step"
                    onClick={onDecrement}
                    aria-label={`Decrease ${label}`}
                    tabIndex={-1}
                >
                    <i className="ri-arrow-down-s-line" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

const PeriodSegment = ({ value, onChange, onToggle }) => {
    const [draft, setDraft] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDraft(value);
        }
    }, [value, isFocused]);

    const commitDraft = useCallback((rawValue) => {
        const nextPeriod = normalizePeriod(rawValue, value);
        onChange(nextPeriod);
        setDraft(nextPeriod);
    }, [onChange, value]);

    const handleChange = (event) => {
        const nextDraft = event.target.value.replace(/[^aApPmM]/g, '').slice(0, 2).toUpperCase();
        setDraft(nextDraft);

        if (nextDraft.length === 2) {
            commitDraft(nextDraft);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        commitDraft(draft);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            onToggle();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft(draft);
            event.currentTarget.blur();
        }
    };

    return (
        <div className="appointment-time-picker__segment appointment-time-picker__segment--period" role="group" aria-label="AM or PM">
            <input
                type="text"
                className="appointment-time-picker__input appointment-time-picker__input--period"
                value={draft}
                onChange={handleChange}
                onFocus={(event) => {
                    setIsFocused(true);
                    event.target.select();
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-label="AM or PM"
                maxLength={2}
                autoComplete="off"
            />
            <div className="appointment-time-picker__arrows">
                <button
                    type="button"
                    className="appointment-time-picker__step"
                    onClick={onToggle}
                    aria-label={`Switch to ${value === 'AM' ? 'PM' : 'AM'}`}
                    tabIndex={-1}
                >
                    <i className="ri-arrow-up-s-line" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="appointment-time-picker__step"
                    onClick={onToggle}
                    aria-label={`Switch to ${value === 'AM' ? 'PM' : 'AM'}`}
                    tabIndex={-1}
                >
                    <i className="ri-arrow-down-s-line" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
};

const AppointmentTimePicker = ({
    name,
    value = '',
    onChange,
    onBlur,
    hasError = false,
    className = '',
}) => {
    const containerRef = useRef(null);
    const timeParts = useMemo(() => parseTimeValue(value), [value]);

    const emitChange = useCallback((nextParts) => {
        onChange?.(formatTimeValue(nextParts));
    }, [onChange]);

    const stepHour = useCallback((delta) => {
        let nextHour = timeParts.hour + delta;
        if (nextHour > 12) nextHour = 1;
        if (nextHour < 1) nextHour = 12;
        emitChange({ ...timeParts, hour: nextHour });
    }, [emitChange, timeParts]);

    const stepMinute = useCallback((delta) => {
        let nextMinute = timeParts.minute + delta;
        if (nextMinute > 59) nextMinute = 0;
        if (nextMinute < 0) nextMinute = 59;
        emitChange({ ...timeParts, minute: nextMinute });
    }, [emitChange, timeParts]);

    const togglePeriod = useCallback(() => {
        emitChange({
            ...timeParts,
            period: timeParts.period === 'AM' ? 'PM' : 'AM',
        });
    }, [emitChange, timeParts]);

    const handleContainerBlur = (event) => {
        if (!containerRef.current?.contains(event.relatedTarget)) {
            onBlur?.();
        }
    };

    return (
        <div
            ref={containerRef}
            className={`appointment-time-picker ${hasError ? 'is-invalid' : ''} ${className}`.trim()}
            onBlur={handleContainerBlur}
        >
            <input type="hidden" name={name} value={value} readOnly />
            <div className="appointment-time-picker__controls">
                <TimeSegment
                    label="hour"
                    value={timeParts.hour}
                    min={1}
                    max={12}
                    onChange={(hour) => emitChange({ ...timeParts, hour })}
                    onIncrement={() => stepHour(1)}
                    onDecrement={() => stepHour(-1)}
                />
                <span className="appointment-time-picker__separator" aria-hidden="true">:</span>
                <TimeSegment
                    label="minute"
                    value={timeParts.minute}
                    min={0}
                    max={59}
                    onChange={(minute) => emitChange({ ...timeParts, minute })}
                    onIncrement={() => stepMinute(1)}
                    onDecrement={() => stepMinute(-1)}
                />
                <PeriodSegment
                    value={timeParts.period}
                    onChange={(period) => emitChange({ ...timeParts, period })}
                    onToggle={togglePeriod}
                />
            </div>
            <span className="appointment-time-picker__icon" aria-hidden="true">
                <i className="bx bx-time" />
            </span>
        </div>
    );
};

export default AppointmentTimePicker;
