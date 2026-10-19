import React from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import DoctorErxPage from "../Erx/DoctorErxPage";

/**
 * In-app Digital Prescription modal for tele call / post-call flows.
 * Locks eRx to one visit so other patients cannot be selected.
 */
const TeleErxAppModal = ({ isOpen, toggle, patientAppId, patientName, onClosed }) => {
  const handleToggle = () => {
    toggle?.();
    onClosed?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={handleToggle}
      size="xl"
      className="patient-list-modal tele-call-modal tele-erx-app-modal"
      backdrop="static"
      centered
      scrollable
      zIndex={20600}
    >
      <ModalHeader toggle={handleToggle} className="patient-list-modal__header tele-call-modal__header">
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-file-list-3-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">
            Digital Prescription{patientName ? ` · ${patientName}` : ""}
          </span>
        </span>
      </ModalHeader>
      <ModalBody className="tele-erx-app-modal__body p-0">
        {isOpen && patientAppId ? (
          <DoctorErxPage lockedPatientAppId={patientAppId} embedded onClose={handleToggle} />
        ) : null}
      </ModalBody>
    </Modal>
  );
};

export default TeleErxAppModal;
