import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import moment from 'moment';

export const DATE_DISPLAY_FORMAT = 'M/D/YYYY';
export const DOB_DISPLAY_FORMAT = DATE_DISPLAY_FORMAT;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const YEARS_PER_PAGE = 24;
const POPOVER_WIDTH = 248;

const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = moment(value, [DATE_DISPLAY_FORMAT, 'MM/DD/YYYY', 'DD-MM-YYYY', 'D-M-YYYY', 'YYYY-MM-DD'], true);
    return parsed.isValid() ? parsed.startOf('day') : null;
};

const formatDateValue = (date) => moment(date).format(DATE_DISPLAY_FORMAT);

const resolveBoundary = (boundary, today) => {
    if (!boundary) return null;
    if (boundary === 'today') return today.clone();
    const parsed = moment(boundary).startOf('day');
    return parsed.isValid() ? parsed : null;
};

const DateOfBirthPicker = ({
    value = '',
    onChange,
    onBlur,
    className = '',
    hasError = false,
    placeholder = DATE_DISPLAY_FORMAT,
    name,
    minDate = null,
    maxDate = 'today',
    hideIcon = false,
}) => {
    const wrapperRef = useRef(null);
    const popoverRef = useRef(null);
    const today = useMemo(() => moment().startOf('day'), []);
    const minBoundary = useMemo(() => resolveBoundary(minDate, today), [minDate, today]);
    const maxBoundary = useMemo(() => resolveBoundary(maxDate, today), [maxDate, today]);
    const selectedDate = useMemo(() => parseDateValue(value), [value]);

    const clampToBounds = (date) => {
        let next = date.clone().startOf('day');
        if (minBoundary && next.isBefore(minBoundary, 'day')) next = minBoundary.clone();
        if (maxBoundary && next.isAfter(maxBoundary, 'day')) next = maxBoundary.clone();
        return next;
    };

    const getAnchorDate = () => clampToBounds(selectedDate || minBoundary || today.clone());
    const yearPageFor = (anchorYear) => {
        if (minBoundary && maxBoundary && maxBoundary.year() - minBoundary.year() <= 5) {
            return minBoundary.year();
        }
        if (minBoundary) return minBoundary.year();
        return Math.max(anchorYear - (YEARS_PER_PAGE - 1), 0);
    };

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('day');
    const [viewDate, setViewDate] = useState(() => getAnchorDate());
    const [popoverStyle, setPopoverStyle] = useState(null);
    const [yearPageStart, setYearPageStart] = useState(() => yearPageFor(getAnchorDate().year()));

    useEffect(() => {
        if (isOpen) return;
        const anchor = getAnchorDate();
        setViewDate(anchor.clone());
        setYearPageStart(yearPageFor(anchor.year()));
    }, [selectedDate, minBoundary, maxBoundary, isOpen]);

    const updatePopoverPosition = useCallback(() => {
        if (!wrapperRef.current) return;

        const rect = wrapperRef.current.getBoundingClientRect();
        let left = rect.left;
        const viewportPadding = 8;

        if (left + POPOVER_WIDTH > window.innerWidth - viewportPadding) {
            left = Math.max(viewportPadding, window.innerWidth - POPOVER_WIDTH - viewportPadding);
        }

        setPopoverStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left,
            width: POPOVER_WIDTH,
            zIndex: 2000,
        });
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setPopoverStyle(null);
            return undefined;
        }

        updatePopoverPosition();

        const handleReposition = () => updatePopoverPosition();
        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);

        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [isOpen, updatePopoverPosition]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const clickedInsideInput = wrapperRef.current?.contains(event.target);
            const clickedInsidePopover = popoverRef.current?.contains(event.target);

            if (!clickedInsideInput && !clickedInsidePopover) {
                setIsOpen(false);
                setView('day');
                onBlur?.({ target: { name } });
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, name, onBlur]);

    const isDayDisabled = (day) => {
        if (minBoundary && day.isBefore(minBoundary, 'day')) return true;
        if (maxBoundary && day.isAfter(maxBoundary, 'day')) return true;
        return false;
    };

    const isMonthDisabled = (year, monthIndex) => {
        const monthStart = moment({ year, month: monthIndex, day: 1 });
        const monthEnd = monthStart.clone().endOf('month');
        if (minBoundary && monthEnd.isBefore(minBoundary, 'day')) return true;
        if (maxBoundary && monthStart.isAfter(maxBoundary, 'day')) return true;
        return false;
    };

    const isYearDisabled = (year) => {
        const yearStart = moment({ year, month: 0, day: 1 });
        const yearEnd = moment({ year, month: 11, day: 31 });
        if (minBoundary && yearEnd.isBefore(minBoundary, 'day')) return true;
        if (maxBoundary && yearStart.isAfter(maxBoundary, 'day')) return true;
        return false;
    };

    const canNavigateMonth = (direction) => {
        const target = viewDate.clone().add(direction, 'month');
        const targetStart = target.clone().startOf('month');
        const targetEnd = target.clone().endOf('month');
        if (minBoundary && targetEnd.isBefore(minBoundary, 'day')) return false;
        if (maxBoundary && targetStart.isAfter(maxBoundary, 'day')) return false;
        return true;
    };

    const openPicker = () => {
        const anchor = getAnchorDate();
        setViewDate(anchor.clone());
        setYearPageStart(yearPageFor(anchor.year()));
        setView('day');
        setIsOpen(true);
    };

    const selectDate = (date) => {
        if (isDayDisabled(date)) return;
        const formatted = formatDateValue(date);
        onChange?.(formatted);
        setViewDate(date.clone());
        setIsOpen(false);
        setView('day');
        // Wait until the new value is stored, then recheck so a valid day clears the error.
        setTimeout(() => onBlur?.({ target: { name, value: formatted } }), 0);
    };

    const commitTypedDate = (rawValue) => {
        const typed = String(rawValue || '').trim();
        if (!typed) {
            if (value) onChange?.('');
            return '';
        }

        const parsed = parseDateValue(typed);
        if (parsed && !isDayDisabled(parsed)) {
            const formatted = formatDateValue(parsed);
            if (formatted !== value) onChange?.(formatted);
            setViewDate(parsed.clone());
            return formatted;
        }

        if (selectedDate) {
            const formatted = formatDateValue(selectedDate);
            onChange?.(formatted);
            return formatted;
        }

        onChange?.('');
        return '';
    };

    const handleInputChange = (event) => {
        onChange?.(event.target.value);
    };

    const handleInputBlur = (event) => {
        const committed = commitTypedDate(event.target.value);
        onBlur?.({ target: { name, value: committed } });
    };

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleInputBlur(event);
            setIsOpen(false);
            setView('day');
            return;
        }
        if (event.key === 'Escape') {
            setIsOpen(false);
            setView('day');
            return;
        }
        if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            openPicker();
        }
    };

    const compactYearSpan = minBoundary && maxBoundary && maxBoundary.year() - minBoundary.year() <= 5;
    const yearPageEnd = compactYearSpan
        ? maxBoundary.year()
        : yearPageStart + YEARS_PER_PAGE - 1;
    const years = compactYearSpan
        ? Array.from(
            { length: maxBoundary.year() - minBoundary.year() + 1 },
            (_, index) => minBoundary.year() + index
        )
        : Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index);

    const canGoPrevYearPage = minBoundary
        ? yearPageStart > minBoundary.year()
        : yearPageStart > 0;

    const canGoNextYearPage = maxBoundary
        ? yearPageEnd < maxBoundary.year()
        : true;

    const calendarDays = useMemo(() => {
        const monthStart = viewDate.clone().startOf('month');
        const gridStart = monthStart.clone().startOf('week');
        return Array.from({ length: 42 }, (_, index) => gridStart.clone().add(index, 'day'));
    }, [viewDate]);

    const renderHeader = () => {
        if (view === 'year') {
            return (
                <div className="dob-picker__header">
                    <button
                        type="button"
                        className="dob-picker__header-title"
                        onClick={() => setView('year')}
                    >
                        {yearPageStart} – {yearPageEnd}
                    </button>
                    <div className="dob-picker__nav">
                        <button
                            type="button"
                            className="dob-picker__nav-btn"
                            disabled={!canGoPrevYearPage}
                            onClick={() => setYearPageStart((prev) => Math.max(prev - YEARS_PER_PAGE, minBoundary?.year() || 0))}
                            aria-label="Previous years"
                        >
                            <i className="ri-arrow-left-s-line" />
                        </button>
                        <button
                            type="button"
                            className="dob-picker__nav-btn"
                            disabled={!canGoNextYearPage}
                            onClick={() => setYearPageStart((prev) => prev + YEARS_PER_PAGE)}
                            aria-label="Next years"
                        >
                            <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                </div>
            );
        }

        if (view === 'month') {
            const canGoPrevYear = minBoundary
                ? viewDate.year() > minBoundary.year()
                : true;
            const canGoNextYear = maxBoundary
                ? viewDate.year() < maxBoundary.year()
                : true;

            return (
                <div className="dob-picker__header">
                    <button
                        type="button"
                        className="dob-picker__header-title"
                        onClick={() => {
                            setYearPageStart(yearPageFor(viewDate.year()));
                            setView('year');
                        }}
                    >
                        {viewDate.year()}
                        <i className="ri-arrow-down-s-line ms-1" />
                    </button>
                    <div className="dob-picker__nav">
                        <button
                            type="button"
                            className="dob-picker__nav-btn"
                            disabled={!canGoPrevYear}
                            onClick={() => setViewDate((prev) => prev.clone().subtract(1, 'year'))}
                            aria-label="Previous year"
                        >
                            <i className="ri-arrow-left-s-line" />
                        </button>
                        <button
                            type="button"
                            className="dob-picker__nav-btn"
                            disabled={!canGoNextYear}
                            onClick={() => setViewDate((prev) => prev.clone().add(1, 'year'))}
                            aria-label="Next year"
                        >
                            <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="dob-picker__header">
                <button
                    type="button"
                    className="dob-picker__header-title"
                    onClick={() => {
                        setYearPageStart(yearPageFor(viewDate.year()));
                        setView('year');
                    }}
                >
                    {viewDate.format('MMM').toUpperCase()} {viewDate.year()}
                    <i className="ri-arrow-down-s-line ms-1" />
                </button>
                <div className="dob-picker__nav">
                    <button
                        type="button"
                        className="dob-picker__nav-btn"
                        disabled={!canNavigateMonth(-1)}
                        onClick={() => setViewDate((prev) => prev.clone().subtract(1, 'month'))}
                        aria-label="Previous month"
                    >
                        <i className="ri-arrow-left-s-line" />
                    </button>
                    <button
                        type="button"
                        className="dob-picker__nav-btn"
                        disabled={!canNavigateMonth(1)}
                        onClick={() => setViewDate((prev) => prev.clone().add(1, 'month'))}
                        aria-label="Next month"
                    >
                        <i className="ri-arrow-right-s-line" />
                    </button>
                </div>
            </div>
        );
    };

    const renderBody = () => {
        if (view === 'year') {
            return (
                <div className="dob-picker__grid dob-picker__grid--years">
                    {years.map((year) => {
                        const disabled = isYearDisabled(year);
                        const selected = selectedDate && selectedDate.year() === year;
                        const isCurrentYear = year === today.year();
                        return (
                            <button
                                key={year}
                                type="button"
                                className={`dob-picker__cell ${selected ? 'is-selected' : ''} ${isCurrentYear ? 'is-today' : ''} ${disabled ? 'is-disabled' : ''}`}
                                disabled={disabled}
                                onClick={() => {
                                    setViewDate((prev) => prev.clone().year(year));
                                    setView('month');
                                }}
                            >
                                {year}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (view === 'month') {
            const currentMonthIndex = today.month();
            const currentYear = today.year();

            return (
                <>
                    <div className="dob-picker__subheading">{viewDate.year()}</div>
                    <div className="dob-picker__grid dob-picker__grid--months">
                        {MONTHS.map((monthLabel, monthIndex) => {
                            const disabled = isMonthDisabled(viewDate.year(), monthIndex);
                            const selected = selectedDate
                                && selectedDate.year() === viewDate.year()
                                && selectedDate.month() === monthIndex;
                            const isCurrentMonth = viewDate.year() === currentYear && monthIndex === currentMonthIndex;
                            return (
                                <button
                                    key={monthLabel}
                                    type="button"
                                    className={`dob-picker__cell ${selected ? 'is-selected' : ''} ${isCurrentMonth ? 'is-today' : ''} ${disabled ? 'is-disabled' : ''}`}
                                    disabled={disabled}
                                    onClick={() => {
                                        setViewDate((prev) => prev.clone().month(monthIndex));
                                        setView('day');
                                    }}
                                >
                                    {monthLabel}
                                </button>
                            );
                        })}
                    </div>
                </>
            );
        }

        return (
            <>
                <div className="dob-picker__weekdays">
                    {WEEKDAYS.map((day, index) => (
                        <span key={`${day}-${index}`} className="dob-picker__weekday">{day}</span>
                    ))}
                </div>
                <div className="dob-picker__subheading">{viewDate.format('MMM').toUpperCase()}</div>
                <div className="dob-picker__grid dob-picker__grid--days">
                    {calendarDays.map((day) => {
                        const inCurrentMonth = day.month() === viewDate.month();
                        const disabled = isDayDisabled(day);
                        const selected = selectedDate && day.isSame(selectedDate, 'day');
                        const isToday = day.isSame(today, 'day');
                        return (
                            <button
                                key={day.format('YYYY-MM-DD')}
                                type="button"
                                className={`dob-picker__cell dob-picker__cell--day ${selected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${disabled ? 'is-disabled' : ''} ${!inCurrentMonth ? 'is-outside' : ''}`}
                                disabled={disabled}
                                onClick={() => selectDate(day)}
                            >
                                {day.date()}
                            </button>
                        );
                    })}
                </div>
            </>
        );
    };

    const popoverContent = isOpen && popoverStyle ? (
        <div
            ref={popoverRef}
            className="dob-picker__popover dob-picker__popover--portal"
            style={popoverStyle}
        >
            {renderHeader()}
            <div className="dob-picker__body">
                {renderBody()}
            </div>
        </div>
    ) : null;

    return (
        <div className={`dob-picker ${hideIcon ? 'dob-picker--no-icon' : ''} ${className}`.trim()} ref={wrapperRef}>
            <div className={`dob-picker__input-group ${hasError ? 'is-invalid' : ''}`}>
                <button
                    type="button"
                    className="dob-picker__icon"
                    onClick={openPicker}
                    aria-label="Open calendar"
                >
                    <i className="ri-calendar-line" aria-hidden="true" />
                </button>
                <input
                    type="text"
                    name={name}
                    className={`form-control dob-picker__input ${hasError ? 'is-invalid' : ''}`}
                    value={value}
                    placeholder={placeholder}
                    autoComplete="off"
                    inputMode="numeric"
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                />
            </div>
            {typeof document !== 'undefined' && popoverContent
                ? createPortal(popoverContent, document.body)
                : null}
        </div>
    );
};

export default DateOfBirthPicker;
