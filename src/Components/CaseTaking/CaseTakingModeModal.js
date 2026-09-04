import React from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import './caseTakingModeModal.css';

const CaseTakingModeModal = ({
    isOpen,
    toggle,
    patientName,
    onManual,
    onAudio,
}) => (
    <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        className="patient-list-modal ctm-modal"
    >
        <ModalHeader className="patient-list-modal__header" toggle={toggle}>
            <span className="patient-list-modal__title patient-list-modal__title--simple">
                <i className="ri-stethoscope-line" style={{ color: '#25a0e2', fontSize: 20 }} />
                <span className="patient-list-modal__title-text">Start case taking</span>
            </span>
        </ModalHeader>
        <ModalBody className="ctm-modal__body">
            <p className="ctm-modal__patient mb-2">
                Patient
                {' '}
                <strong>{patientName || 'Patient'}</strong>
            </p>
            <p className="ctm-modal__lead">
                Choose how you want to take this case.
            </p>

            <div className="ctm-modal__choices" role="group" aria-label="Case taking mode">
                <button type="button" className="ctm-choice ctm-choice--manual" onClick={onManual}>
                    <span className="ctm-choice__icon" aria-hidden="true">
                        <i className="ri-keyboard-box-line" />
                    </span>
                    <span className="ctm-choice__content">
                        <span className="ctm-choice__title">Manual</span>
                        <span className="ctm-choice__desc">
                            Search and add rubrics yourself from Repertory and related tools.
                        </span>
                    </span>
                    <span className="ctm-choice__arrow" aria-hidden="true">
                        <i className="ri-arrow-right-s-line" />
                    </span>
                </button>

                <button type="button" className="ctm-choice ctm-choice--audio" onClick={onAudio}>
                    <span className="ctm-choice__icon" aria-hidden="true">
                        <i className="ri-mic-line" />
                    </span>
                    <span className="ctm-choice__content">
                        <span className="ctm-choice__title">
                            Audio
                            <span className="ctm-choice__badge">Recommended</span>
                        </span>
                        <span className="ctm-choice__desc">
                            Record live or upload a file, then get conversation, summary, and rubric suggestions.
                        </span>
                    </span>
                    <span className="ctm-choice__arrow" aria-hidden="true">
                        <i className="ri-arrow-right-s-line" />
                    </span>
                </button>
            </div>
        </ModalBody>
    </Modal>
);

export default CaseTakingModeModal;
