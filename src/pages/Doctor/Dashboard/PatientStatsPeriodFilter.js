import React, { useEffect, useState } from 'react';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import { Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { getYearToDateRange } from './patientStatsChartsHelper';

const PatientStatsPeriodFilter = ({ filter, onFilterChange }) => {
    const [showDateModal, setShowDateModal] = useState(false);
    const [draftFromDate, setDraftFromDate] = useState('');
    const [draftToDate, setDraftToDate] = useState('');

    useEffect(() => {
        if (!showDateModal) {
            return;
        }

        const defaults = getYearToDateRange();
        setDraftFromDate(filter?.fromDate || defaults.fromDate);
        setDraftToDate(filter?.toDate || defaults.toDate);
    }, [showDateModal, filter?.fromDate, filter?.toDate]);

    const handlePeriodClick = (period) => {
        if (period === 'ALL') {
            setShowDateModal(true);
            return;
        }

        onFilterChange({
            period,
            fromDate: null,
            toDate: null,
        });
    };

    const handleApplyDateRange = () => {
        if (!draftFromDate || !draftToDate) {
            return;
        }

        let fromDate = draftFromDate;
        let toDate = draftToDate;
        if (new Date(fromDate) > new Date(toDate)) {
            [fromDate, toDate] = [toDate, fromDate];
        }

        onFilterChange({
            period: 'ALL',
            fromDate,
            toDate,
        });
        setShowDateModal(false);
    };

    const isAllActive = filter?.period === 'ALL';

    return (
        <>
            <div className="d-flex gap-1">
                <button
                    type="button"
                    className={`btn btn-sm doctor-dashboard-toolbar-btn${isAllActive ? ' active' : ''}`}
                    onClick={() => handlePeriodClick('ALL')}
                >
                    ALL
                </button>
                <button
                    type="button"
                    className={`btn btn-sm doctor-dashboard-toolbar-btn${filter?.period === '1M' ? ' active' : ''}`}
                    onClick={() => handlePeriodClick('1M')}
                >
                    1M
                </button>
                <button
                    type="button"
                    className={`btn btn-sm doctor-dashboard-toolbar-btn${filter?.period === '3M' ? ' active' : ''}`}
                    onClick={() => handlePeriodClick('3M')}
                >
                    3M
                </button>
                <button
                    type="button"
                    className={`btn btn-sm doctor-dashboard-toolbar-btn${filter?.period === '6M' ? ' active' : ''}`}
                    onClick={() => handlePeriodClick('6M')}
                >
                    6M
                </button>
            </div>

            <Modal isOpen={showDateModal} toggle={() => setShowDateModal(false)} centered>
                <ModalHeader toggle={() => setShowDateModal(false)}>
                    Select Date Range
                </ModalHeader>
                <ModalBody>
                    <p className="text-muted small mb-3">
                        Choose any from and to date. Patient stats for both charts will update for this range.
                    </p>
                    <div className="mb-3">
                        <Label className="form-label">From Date</Label>
                        <Input
                            type="date"
                            value={draftFromDate}
                            onChange={(e) => setDraftFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="form-label">To Date</Label>
                        <Input
                            type="date"
                            value={draftToDate}
                            min={draftFromDate}
                            onChange={(e) => setDraftToDate(e.target.value)}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <ModalActionButton action="cancel" onClick={() => setShowDateModal(false)} />
                    <ModalActionButton
                        action="confirm"
                        onClick={handleApplyDateRange}
                        disabled={!draftFromDate || !draftToDate}
                    >
                        Apply
                    </ModalActionButton>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default PatientStatsPeriodFilter;
