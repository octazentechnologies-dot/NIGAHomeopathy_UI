import React, { useState } from 'react';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import DateOfBirthPicker from '../../../Components/Common/DateOfBirthPicker';
import { Card, CardBody, CardHeader, Col, Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label } from 'reactstrap';

const TopSellers = () => {
    // Reminders state (with default 10th item)
    const [reminders, setReminders] = useState([
        { title: 'Medicine Restoration', time: '08.00 AM' },
        { title: 'Hospital Cleanup', time: '08.30 AM' },
        { title: 'Hospital Round', time: '09.00 AM' },
        { title: 'Patient Checkup', time: '11.00 AM' },
        { title: 'Staff Meeting', time: '12.00 PM' },
        { title: 'Conference Call', time: '03.00 PM' },
        { title: 'Dr. Sharma', time: '04.00 PM' },
        { title: 'Hospital Round', time: '05.00 PM' },
        { title: 'Patient Checkup', time: '06.00 PM' },
        { title: 'Staff Meeting', time: '07.00 PM' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReminder, setNewReminder] = useState({
        date: '',
        time: '',
        title: '',
        description: '',
        contact: ''
    });

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const formatTimeToDisplay = (time24) => {
        if (!time24) return '';
        const [hhStr, mmStr] = time24.split(':');
        const hours = parseInt(hhStr || '0', 10);
        const minutes = parseInt(mmStr || '0', 10);
        const isPM = hours >= 12;
        const h12 = ((hours + 11) % 12) + 1;
        const hourStr = String(h12).padStart(2, '0');
        const minuteStr = String(minutes).padStart(2, '0');
        return `${hourStr}.${minuteStr} ${isPM ? 'PM' : 'AM'}`;
    };

    const saveNewReminder = () => {
        const title = newReminder.title && newReminder.title.trim().length > 0 ? newReminder.title.trim() : 'Untitled Reminder';
        const timeDisplay = formatTimeToDisplay(newReminder.time);
        const newItem = timeDisplay
            ? { title, time: timeDisplay, date: newReminder.date, description: newReminder.description, contact: newReminder.contact }
            : { title, action: 'call', date: newReminder.date, description: newReminder.description, contact: newReminder.contact };
        setReminders((prev) => [...prev, newItem]);
        setNewReminder({ date: '', time: '', title: '', description: '', contact: '' });
        setIsModalOpen(false);
    };

    const remindersCountLabel = String(reminders.length).padStart(2, '0');

    // Dynamic calendar for current month with today's highlight
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const leadingEmptyCells = startWeekday;
    const totalCells = leadingEmptyCells + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const trailingEmptyCells = rows * 7 - totalCells;

    const calendarCells = [
        ...Array.from({ length: leadingEmptyCells }).map(() => ({ label: '', empty: true })),
        ...Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = dayNum === today.getDate();
            return { label: String(dayNum), empty: false, isToday };
        }),
        ...Array.from({ length: trailingEmptyCells }).map(() => ({ label: '', empty: true })),
    ];

    const calendarWeeks = Array.from({ length: rows }).map((_, rowIdx) =>
        calendarCells.slice(rowIdx * 7, rowIdx * 7 + 7)
    );

    const calendarStyles = `
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
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #868e96;
            padding: 8px 0;
            border-right: 1px solid #eef1f4;
        }
        .doctor-reminders-card .calendar-day-header:last-child {
            border-right: none;
        }
        .doctor-reminders-card .reminders-list {
            list-style: none;
            counter-reset: reminder-counter;
            padding-left: 0;
            padding-bottom: 0.5rem;
            margin: 0;
        }
        .doctor-reminders-card .reminders-list li {
            counter-increment: reminder-counter;
            display: grid;
            grid-template-columns: 28px 1fr;
            column-gap: 8px;
            padding: 10px 10px;
            border-radius: 10px;
            margin-bottom: 4px;
            transition: background-color 0.15s ease;
        }
        .doctor-reminders-card .reminders-list li:hover {
            background: #f4faff;
        }
        .doctor-reminders-card .reminders-list li::before {
            content: counter(reminder-counter);
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #e8f5ff;
            color: #25a0e2;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 1px;
        }
        .doctor-reminders-card .reminders-list .reminder-time {
            font-size: 12px;
            font-weight: 600;
            color: #6c757d;
            white-space: nowrap;
            padding: 2px 8px;
            border-radius: 999px;
            background: #f1f3f5;
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
            font-size: 13px;
            color: #212529;
            border-right: 1px solid #eef1f4;
            min-height: 34px;
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
            border-radius: 5px;
            margin: 3px;
            min-height: 28px;
        }
        .doctor-reminders-card .calendar-day.empty {
            background-color: #fafbfc;
            color: #ced4da;
            cursor: default;
        }
        .doctor-reminders-card .calendar-day.empty:hover {
            background-color: #fafbfc;
        }
    `;

    return (
        <React.Fragment>
            <style>{calendarStyles}</style>
            <Col xl={3}>
                <Card className="card-height-100 doctor-reminders-card">
                    <CardHeader className="align-items-center d-flex doctor-dashboard-card-header">
                        <h4 className="card-title mb-0 flex-grow-1">Today's Reminders ({remindersCountLabel})</h4>
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
                    <CardBody className="pb-3">
                        <div className="calendar-grid mb-3">
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
                                                className={`calendar-day${cell.empty ? ' empty' : ''}${cell.isToday ? ' today' : ''}`}
                                                title={cell.label}
                                            >
                                                {cell.label}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ol className="mb-0 reminders-list">
                            {reminders.map((item, idx) => (
                                <li key={`${item.title}-${idx}`}>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="fw-medium text-truncate mb-0">{item.title}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {item.action === 'call' ? (
                                                <button type="button" className="btn btn-sm btn-soft-danger remove-item-btn"><i className="ri-phone-fill" /> </button>
                                            ) : (
                                                <span className="reminder-time">{item.time}</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <Modal
                            isOpen={isModalOpen}
                            toggle={closeModal}
                            centered
                            className="patient-list-modal new-patient-modal new-reminder-modal"
                        >
                            <ModalHeader className="patient-list-modal__header" toggle={closeModal}>
                                <span className="patient-list-modal__title patient-list-modal__title--simple">
                                    <i className="ri-notification-3-line" style={{ color: '#25a0e2', fontSize: 20 }} aria-hidden="true" />
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
                                <ModalActionButton action="save" onClick={saveNewReminder} />
                            </ModalFooter>
                        </Modal>

                    </CardBody>
                </Card>
            </Col>

        </React.Fragment>
    );
};

export default TopSellers;
