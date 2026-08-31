import React from 'react';
import { Modal, ModalBody } from 'reactstrap';
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
    className="ctm-modal"
    contentClassName="ctm-modal__content"
  >
    <ModalBody className="ctm-modal__body">
      <div className="ctm-modal__header">
        <div className="ctm-modal__title-wrap">
          <span className="ctm-modal__icon" aria-hidden="true">
            <i className="ri-stethoscope-line" />
          </span>
          <div>
            <h5 className="ctm-modal__title">Start case taking</h5>
            <p className="ctm-modal__patient mb-0">
              Patient
              {' '}
              <strong>{patientName || 'Patient'}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ctm-modal__close"
          onClick={toggle}
          aria-label="Close"
        >
          <i className="ri-close-line" aria-hidden="true" />
        </button>
      </div>

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

      <div className="ctm-modal__footer">
        <button type="button" className="ctm-modal__cancel" onClick={toggle}>
          Cancel
        </button>
      </div>
    </ModalBody>
  </Modal>
);

export default CaseTakingModeModal;
