import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import { RECEPTION_QUICK_ACTIONS } from "./QuickActions";

const EditAppointmentStepsModal = ({
  isOpen,
  toggle,
  selectedPatient,
  completedActionIds = [],
  onSelectStep,
}) => (
  <Modal
    size="md"
    isOpen={isOpen}
    toggle={toggle}
    className="patient-list-modal reception-edit-steps-modal"
    backdrop="static"
  >
    <ModalHeader className="patient-list-modal__header" toggle={toggle}>
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <i
          className="ri-pencil-fill"
          style={{ color: "#25a0e2", fontSize: 15 }}
          aria-hidden="true"
        />
        <span>
          <span className="patient-list-modal__title-text d-block">Edit Appointment</span>
          <span className="reception-payment-subtitle">
            {selectedPatient?.fullName
              ? `Choose a step to update for ${selectedPatient.fullName}`
              : "Choose a check-in step to update"}
          </span>
        </span>
      </span>
    </ModalHeader>

    <ModalBody>
      <div className="reception-edit-steps-list">
        {RECEPTION_QUICK_ACTIONS.map((action, index) => {
          const isCompleted = completedActionIds.includes(action.id);
          return (
            <button
              key={action.id}
              type="button"
              className={`reception-edit-step-btn${isCompleted ? " is-completed" : ""}`}
              onClick={() => onSelectStep?.(action.id)}
            >
              <span className="reception-edit-step-btn__index">{index + 1}</span>
              <span className="reception-edit-step-btn__icon">
                <i className={action.icon} aria-hidden="true" />
              </span>
              <span className="reception-edit-step-btn__label">{action.label}</span>
              <span className="reception-edit-step-btn__meta">
                {isCompleted ? "Edit" : "Open"}
                <i className="ri-arrow-right-s-line" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </ModalBody>

    <ModalFooter className="reception-patient-details-footer">
      <ModalActionButton action="close" type="button" onClick={toggle}>
        Close
      </ModalActionButton>
    </ModalFooter>
  </Modal>
);

export default EditAppointmentStepsModal;
