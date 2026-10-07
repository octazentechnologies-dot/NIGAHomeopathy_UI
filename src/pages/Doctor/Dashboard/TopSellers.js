import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import Swal from 'sweetalert2';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import DateOfBirthPicker, { DATE_DISPLAY_FORMAT } from '../../../Components/Common/DateOfBirthPicker';
import { Card, CardBody, CardHeader, Col, Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Spinner } from 'reactstrap';
import {
    createDoctorReminder,
    deleteDoctorReminder,
    listDoctorReminders,
    updateDoctorReminder,
} from '../../../helpers/s5Week5Api';

const API_DATE = 'YYYY-MM-DD';

const emptyReminder = (date) => ({
    date: moment(date).format(DATE_DISPLAY_FORMAT),
    time: '',
    title: '',
    description: '',
    contact: '',
});

const formatTimeToDisplay = (time) => {
    if (!time) return '';
    const m = moment(String(time), ['HH:mm:ss', 'HH:mm'], true);
    return m.isValid() ? m.format('hh.mm A') : '';
};

const mapReminder = (row) => ({
    id: row.doctorReminderId ?? row.DoctorReminderId,
    date: moment(row.reminderDate ?? row.ReminderDate).format(API_DATE),
    time: row.reminderTime ?? row.ReminderTime ?? null,
    title: row.title ?? row.Title ?? '',
    description: row.description ?? row.Description ?? '',
    contact: row.contactNumber ?? row.ContactNumber ?? '',
    isDone: Boolean(row.isDone ?? row.IsDone),
});

const toWrite = (item) => ({
    reminderDate: item.date,
    reminderTime: item.time ? String(item.time).slice(0, 5) : null,
    title: item.title,
    description: item.description || null,
    contactNumber: item.contact || null,
    isDone: item.isDone,
});

const TopSellers = () => {
    const today = moment().startOf('day');
    const [selectedDate, setSelectedDate] = useState(today.format(API_DATE));
    const [monthReminders, setMonthReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReminder, setNewReminder] = useState(emptyReminder(today));

    const monthStart = today.clone().startOf('month');
    const monthEnd = today.clone().endOf('month');

    const loadReminders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listDoctorReminders({
                from: monthStart.format(API_DATE),
                to: monthEnd.format(API_DATE),
            });
            const rows = Array.isArray(res?.data) ? res.data : [];
            setMonthReminders(rows.map(mapReminder));
        } catch (_) {
            setMonthReminders([]);
        } finally {
            setLoading(false);
        }
    }, [monthStart.format(API_DATE)]);

    useEffect(() => {
        loadReminders();
    }, [loadReminders]);

    const reminders = useMemo(
        () => monthReminders.filter((r) => r.date === selectedDate),
        [monthReminders, selectedDate]
    );
    const datesWithReminders = useMemo(
        () => new Set(monthReminders.filter((r) => !r.isDone).map((r) => r.date)),
        [monthReminders]
    );

    const openModal = () => {
        setNewReminder(emptyReminder(selectedDate));
        setIsModalOpen(true);
    };
    const closeModal = () => setIsModalOpen(false);

    const saveNewReminder = async () => {
        const title = newReminder.title.trim();
        if (!title) {
            Swal.fire({ icon: 'warning', title: 'Title is required', timer: 1600, showConfirmButton: false });
            return;
        }
        const parsedDate = moment(newReminder.date, [DATE_DISPLAY_FORMAT, 'MM/DD/YYYY', API_DATE], true);
        setSaving(true);
        try {
            await createDoctorReminder({
                reminderDate: (parsedDate.isValid() ? parsedDate : moment(selectedDate)).format(API_DATE),
                reminderTime: newReminder.time || null,
                title,
                description: newReminder.description.trim() || null,
                contactNumber: newReminder.contact.trim() || null,
            });
            setIsModalOpen(false);
            if (parsedDate.isValid()) setSelectedDate(parsedDate.format(API_DATE));
            await loadReminders();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Reminder not saved',
                text: err?.data?.message || err?.message || 'Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleDone = async (item) => {
        const next = { ...item, isDone: !item.isDone };
        setMonthReminders((prev) => prev.map((r) => (r.id === item.id ? next : r)));
        try {
            await updateDoctorReminder(item.id, toWrite(next));
        } catch (_) {
            setMonthReminders((prev) => prev.map((r) => (r.id === item.id ? item : r)));
        }
    };

    const removeReminder = async (item) => {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Delete reminder?',
            text: item.title,
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#f06548',
        });
        if (!result.isConfirmed) return;
        try {
            await deleteDoctorReminder(item.id);
            setMonthReminders((prev) => prev.filter((r) => r.id !== item.id));
        } catch (_) {
            Swal.fire({ icon: 'error', title: 'Could not delete reminder', timer: 1600, showConfirmButton: false });
        }
    };

    const remindersCountLabel = String(reminders.length).padStart(2, '0');
    const isTodaySelected = selectedDate === today.format(API_DATE);
    const cardTitle = isTodaySelected
        ? `Today's Reminders (${remindersCountLabel})`
        : `Reminders ${moment(selectedDate).format('DD MMM')} (${remindersCountLabel})`;

    const startWeekday = monthStart.day();
    const daysInMonth = today.daysInMonth();

    const leadingEmptyCells = startWeekday;
    const totalCells = leadingEmptyCells + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const trailingEmptyCells = rows * 7 - totalCells;

    const calendarCells = [
        ...Array.from({ length: leadingEmptyCells }).map(() => ({ label: '', empty: true })),
        ...Array.from({ length: daysInMonth }).map((_, i) => {
            const day = monthStart.clone().date(i + 1);
            const key = day.format(API_DATE);
            return {
                label: String(i + 1),
                key,
                empty: false,
                isToday: day.isSame(today, 'day'),
                isSelected: key === selectedDate,
                hasReminder: datesWithReminders.has(key),
            };
        }),
        ...Array.from({ length: trailingEmptyCells }).map(() => ({ label: '', empty: true })),
    ];

    const calendarWeeks = Array.from({ length: rows }).map((_, rowIdx) =>
        calendarCells.slice(rowIdx * 7, rowIdx * 7 + 7)
    );

    const calendarStyles = `
        .doctor-reminders-card {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        .doctor-reminders-card > .card-body {
            flex: 1 1 auto;
            min-height: 0;
        }
        .doctor-reminders-card .calendar-grid {
            border: 1px solid #e3e8ee;
            border-radius: 5px;
            overflow: hidden;
            background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }
        .doctor-reminders-card .calendar-header {
            background: #f4f7fa;
            border-bottom: 1px solid #e9ecef;
        }
        .doctor-reminders-card .calendar-day-header {
            flex: 1;
            text-align: center;
            font-size: 0.625rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #868e96;
            padding: 0.35rem 0;
            border-right: 1px solid #eef1f4;
        }
        .doctor-reminders-card .calendar-day-header:last-child {
            border-right: none;
        }
        .doctor-reminders-card .reminders-list {
            list-style: none;
            counter-reset: reminder-counter;
            padding-left: 0;
            padding-bottom: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 0;
        }
        .doctor-reminders-card .reminders-list li {
            counter-increment: reminder-counter;
            display: grid;
            grid-template-columns: 22px 1fr;
            column-gap: 0.4rem;
            padding: 0.28rem 0.35rem;
            border-radius: 6px;
            margin-bottom: 0;
            flex: 1 1 0;
            align-content: center;
            transition: background-color 0.15s ease;
        }
        .doctor-reminders-card .reminders-list li:hover {
            background: #f4faff;
        }
        .doctor-reminders-card .reminders-list li::before {
            content: counter(reminder-counter);
            width: 1.15rem;
            height: 1.15rem;
            border-radius: 50%;
            background: #e8f5ff;
            color: #25a0e2;
            font-size: 0.625rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 1px;
        }
        .doctor-reminders-card .reminders-list .reminder-time {
            font-size: 0.625rem;
            font-weight: 600;
            color: #6c757d;
            white-space: nowrap;
            padding: 0.1rem 0.4rem;
            border-radius: 999px;
            background: #f1f3f5;
        }
        .doctor-reminders-card .reminders-list p {
            font-size: 0.6875rem !important;
            line-height: 1.25 !important;
            margin-bottom: 0 !important;
        }
        .doctor-reminders-card .calendar-row {
            border-bottom: 1px solid #eef1f4;
        }
        .doctor-reminders-card .calendar-row:last-child {
            border-bottom: none;
        }
        .doctor-reminders-card .calendar-day {
            flex: 1;
            text-align: center;
            font-size: 0.6875rem;
            color: #212529;
            border-right: 1px solid #eef1f4;
            min-height: 1.65rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.15s ease, color 0.15s ease;
        }
        .doctor-reminders-card .calendar-day:last-child {
            border-right: none;
        }
        .doctor-reminders-card .calendar-day:hover {
            background-color: #f4faff;
        }
        .doctor-reminders-card .calendar-day.today {
            background-color: #e8f5ff;
            color: #25a0e2;
            font-weight: 700;
            border: 1px solid #cfe9ff;
            border-radius: 4px;
            margin: 2px;
            min-height: 1.4rem;
        }
        .doctor-reminders-card .calendar-day.empty {
            background-color: #fafbfc;
            color: #ced4da;
            cursor: default;
        }
        .doctor-reminders-card .calendar-day.empty:hover {
            background-color: #fafbfc;
        }
        .doctor-reminders-card .calendar-day {
            position: relative;
        }
        .doctor-reminders-card .calendar-day.selected:not(.today) {
            background-color: #25a0e2;
            color: #fff;
            font-weight: 700;
            border-radius: 4px;
            margin: 2px;
            min-height: 1.4rem;
        }
        .doctor-reminders-card .calendar-day.has-reminder::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #f06548;
        }
        .doctor-reminders-card .reminders-list li.is-done p {
            text-decoration: line-through;
            color: #adb5bd;
        }
        .doctor-reminders-card .reminder-actions .btn {
            padding: 0 0.3rem;
            font-size: 0.6875rem;
            line-height: 1.4;
        }
        .doctor-reminders-card .reminders-empty {
            font-size: 0.75rem;
            color: #868e96;
            text-align: center;
            padding: 1rem 0;
        }
    `;

    return (
        <React.Fragment>
            <style>{calendarStyles}</style>
            <Col xl={3} className="d-flex">
                <Card className="card-height-100 doctor-reminders-card w-100">
                    <CardHeader className="align-items-center d-flex flex-wrap gap-2 doctor-dashboard-card-header">
                        <h4 className="card-title mb-0 flex-grow-1">{cardTitle}</h4>
                        <Button
                            type="button"
                            color="primary"
                            outline
                            size="sm"
                            className="doctor-dashboard-create-new-btn text-truncate mb-0 flex-shrink-0"
                            onClick={openModal}
                        >
                            <i className="mdi mdi-bell-plus me-1 align-middle" />
                            Create New
                        </Button>
                    </CardHeader>
                    <CardBody className="pb-2 pt-2 d-flex flex-column">
                        <div className="calendar-grid mb-2 flex-shrink-0">
                            <div className="calendar-header d-flex">
                                <div className="calendar-day-header">Sun</div>
                                <div className="calendar-day-header">Mon</div>
                                <div className="calendar-day-header">Tue</div>
                                <div className="calendar-day-header">Wed</div>
                                <div className="calendar-day-header">Thu</div>
                                <div className="calendar-day-header">Fri</div>
                                <div className="calendar-day-header">Sat</div>
                            </div>
                            <div className="calendar-body">
                                {calendarWeeks.map((week, wIdx) => (
                                    <div className="calendar-row d-flex" key={`week-${wIdx}`}>
                                        {week.map((cell, cIdx) => (
                                            <div
                                                key={`cell-${wIdx}-${cIdx}`}
                                                className={`calendar-day${cell.empty ? ' empty' : ''}${cell.isToday ? ' today' : ''}${cell.isSelected ? ' selected' : ''}${cell.hasReminder ? ' has-reminder' : ''}`}
                                                title={cell.label}
                                                role={cell.empty ? undefined : 'button'}
                                                onClick={cell.empty ? undefined : () => setSelectedDate(cell.key)}
                                            >
                                                {cell.label}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {loading && monthReminders.length === 0 ? (
                            <div className="reminders-empty"><Spinner size="sm" color="primary" /></div>
                        ) : reminders.length === 0 ? (
                            <div className="reminders-empty">No reminders for this day</div>
                        ) : (
                            <ol className="mb-0 reminders-list flex-grow-1">
                                {reminders.map((item) => (
                                    <li key={item.id} className={item.isDone ? 'is-done' : ''}>
                                        <div className="d-flex align-items-center gap-1">
                                            <div
                                                className="flex-grow-1 overflow-hidden"
                                                role="button"
                                                title={item.description || (item.isDone ? 'Mark as pending' : 'Mark as done')}
                                                onClick={() => toggleDone(item)}
                                            >
                                                <p className="fw-medium text-truncate mb-0">{item.title}</p>
                                            </div>
                                            <div className="flex-shrink-0 d-flex align-items-center gap-1 reminder-actions">
                                                {item.time ? <span className="reminder-time">{formatTimeToDisplay(item.time)}</span> : null}
                                                {item.contact ? (
                                                    <a href={`tel:${item.contact}`} className="btn btn-sm btn-soft-success" title={`Call ${item.contact}`}>
                                                        <i className="ri-phone-fill" />
                                                    </a>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-soft-danger remove-item-btn"
                                                    title="Delete"
                                                    onClick={() => removeReminder(item)}
                                                >
                                                    <i className="ri-delete-bin-5-line" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}

                        <Modal
                            isOpen={isModalOpen}
                            toggle={closeModal}
                            centered
                            className="patient-list-modal new-patient-modal new-reminder-modal"
                        >
                            <ModalHeader className="patient-list-modal__header" toggle={closeModal}>
                                <span className="patient-list-modal__title patient-list-modal__title--simple">
                                    <i className="ri-notification-3-line" style={{ color: '#25a0e2', fontSize: 15 }} aria-hidden="true" />
                                    <span className="patient-list-modal__title-text">Create New Reminder</span>
                                </span>
                            </ModalHeader>
                            <ModalBody>
                                <div className="row g-3 new-patient-modal__fields">
                                    <div className="col-md-6">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-calendar-line" aria-hidden="true" />
                                            Reminder Date
                                        </Label>
                                        <DateOfBirthPicker
                                            name="reminderDate"
                                            value={newReminder.date}
                                            minDate={null}
                                            maxDate={null}
                                            onChange={(dateStr) => setNewReminder({ ...newReminder, date: dateStr })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-time-line" aria-hidden="true" />
                                            Reminder Time
                                        </Label>
                                        <Input
                                            type="time"
                                            value={newReminder.time}
                                            onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-bookmark-line" aria-hidden="true" />
                                            Reminder Title
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="Enter title"
                                            value={newReminder.title}
                                            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-file-text-line" aria-hidden="true" />
                                            Reminder Description
                                        </Label>
                                        <Input
                                            type="textarea"
                                            rows={3}
                                            placeholder="Enter description"
                                            value={newReminder.description}
                                            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <Label className="form-label new-patient-modal__label">
                                            <i className="ri-phone-line" aria-hidden="true" />
                                            Contact Number
                                        </Label>
                                        <Input
                                            type="tel"
                                            placeholder="Enter contact number"
                                            value={newReminder.contact}
                                            onChange={(e) => setNewReminder({ ...newReminder, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className="justify-content-end">
                                <ModalActionButton action="cancel" onClick={closeModal} />
                                <ModalActionButton action="save" onClick={saveNewReminder} disabled={saving || !newReminder.title.trim()} />
                            </ModalFooter>
                        </Modal>

                    </CardBody>
                </Card>
            </Col>

        </React.Fragment>
    );
};

export default TopSellers;
