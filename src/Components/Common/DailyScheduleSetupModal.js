import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Swal from 'sweetalert2';
import {
  APPOINTMENT_SLOT_INTERVALS,
  CUSTOM_INTERVAL_VALUE,
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
  apiTimeToTimeInput,
  formatApiDate,
  getAuthUserId,
  timeInputToApiTime,
  validateSlotIntervalMinutes,
} from '../../helpers/appointmentSlotHelper';
import { saveDailySchedule } from '../../helpers/realbackend_helper';

const DailyScheduleSetupModal = ({
  isOpen,
  doctorId,
  scheduleDate,
  onSaved,
  onClose,
  requireSave = true,
}) => {
  const [intervalSelection, setIntervalSelection] = useState('10');
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState('');
  const [workStartTime, setWorkStartTime] = useState(apiTimeToTimeInput(DEFAULT_WORK_START));
  const [workEndTime, setWorkEndTime] = useState(apiTimeToTimeInput(DEFAULT_WORK_END));
  const [saving, setSaving] = useState(false);

  const isCustomInterval = intervalSelection === CUSTOM_INTERVAL_VALUE;

  const resolvedIntervalMinutes = useMemo(() => {
    if (isCustomInterval) {
      return customIntervalMinutes;
    }
    return intervalSelection;
  }, [customIntervalMinutes, intervalSelection, isCustomInterval]);

  useEffect(() => {
    if (!isOpen) return;
    setIntervalSelection('10');
    setCustomIntervalMinutes('');
    setWorkStartTime(apiTimeToTimeInput(DEFAULT_WORK_START));
    setWorkEndTime(apiTimeToTimeInput(DEFAULT_WORK_END));
  }, [isOpen]);

  const handleSave = async () => {
    const userId = getAuthUserId();
    const apiDate = formatApiDate(scheduleDate);
    const intervalValidation = validateSlotIntervalMinutes(resolvedIntervalMinutes);

    if (!doctorId || !apiDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing details',
        text: 'Doctor and schedule date are required.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (!userId) {
      Swal.fire({
        icon: 'error',
        title: 'Session expired',
        text: 'Please log in again.',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (!intervalValidation.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid slot interval',
        text: intervalValidation.message,
        timer: 2400,
        showConfirmButton: false,
      });
      return;
    }

    const start = timeInputToApiTime(workStartTime);
    const end = timeInputToApiTime(workEndTime);

    if (!start || !end || start >= end) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid working hours',
        text: 'Work end time must be after work start time.',
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    setSaving(true);
    try {
      const result = await saveDailySchedule({
        doctorId: Number(doctorId),
        scheduleDate: apiDate,
        slotIntervalMinutes: intervalValidation.value,
        workStartTime: start,
        workEndTime: end,
        createdByUserId: Number(userId),
      });
      onSaved?.(result);
      onClose?.();
      Swal.fire({
        icon: 'success',
        title: 'Schedule saved',
        text: 'Appointment slots are now available for this date.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      const message = typeof error === 'string'
        ? error
        : (error?.response?.data?.message || error?.message || 'Failed to save daily schedule.');
      Swal.fire({
        icon: 'error',
        title: 'Unable to save schedule',
        text: message,
        timer: 2600,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={requireSave ? undefined : onClose}
      backdrop={requireSave ? 'static' : true}
      keyboard={!requireSave}
      centered
      className="daily-schedule-setup-modal"
    >
      <ModalHeader toggle={requireSave ? undefined : onClose}>
        Set Appointment Slots
      </ModalHeader>
      <ModalBody>
        <div className="daily-schedule-setup-form">
          <p className="text-muted mb-3">
            Choose the slot interval and working hours for this day. Once saved, the schedule is locked for the day.
          </p>
          <div className="mb-3">
            <Label className="form-label">Slot interval (minutes)</Label>
            <Input
              type="select"
              value={intervalSelection}
              onChange={(event) => setIntervalSelection(event.target.value)}
            >
              {APPOINTMENT_SLOT_INTERVALS.map((value) => (
                <option key={value} value={value}>{value} minutes</option>
              ))}
              <option value={CUSTOM_INTERVAL_VALUE}>Custom...</option>
            </Input>
          </div>
          {isCustomInterval && (
            <div className="mb-3">
              <Label className="form-label">Custom interval (minutes)</Label>
              <Input
                type="number"
                min={1}
                max={180}
                step={1}
                placeholder="e.g. 12"
                value={customIntervalMinutes}
                onChange={(event) => setCustomIntervalMinutes(event.target.value.replace(/\D/g, '').slice(0, 3))}
              />
              <div className="text-muted mt-1" style={{ fontSize: '0.875rem' }}>
                Enter any whole number from 1 to 180 minutes.
              </div>
            </div>
          )}
          <div className="row g-3">
            <div className="col-md-6">
              <Label className="form-label">Work start</Label>
              <Input
                type="time"
                value={workStartTime}
                onChange={(event) => setWorkStartTime(event.target.value)}
              />
            </div>
            <div className="col-md-6">
              <Label className="form-label">Work end</Label>
              <Input
                type="time"
                value={workEndTime}
                onChange={(event) => setWorkEndTime(event.target.value)}
              />
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {!requireSave && (
          <Button color="light" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button color="success" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DailyScheduleSetupModal;
