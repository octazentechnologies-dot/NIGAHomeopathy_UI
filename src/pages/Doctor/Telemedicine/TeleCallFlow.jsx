import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import doctorAvatar from "../../../assets/images/users/avatar-2.jpg";
import patientAvatar from "../../../assets/images/users/avatar-3.jpg";
import doctorPreview from "../../../assets/images/landing/hero-doctor.png";
import "./teleCallFlow.css";

const CALL_STEPS = {
  DEVICE: "device",
  CONSENT: "consent",
  WAITING: "waiting",
  CALL: "call",
  COMPLETED: "completed",
  INTERRUPTED: "interrupted",
  UNABLE: "unable",
};

const DEVICE_CHECKS = [
  { id: "camera", label: "Camera", icon: "ri-vidicon-line", ok: "Working", fail: "Not Available" },
  { id: "microphone", label: "Microphone", icon: "ri-mic-line", ok: "Working", fail: "Not Available" },
  { id: "speaker", label: "Speaker", icon: "ri-volume-up-line", ok: "Working", fail: "Check Device" },
  { id: "internet", label: "Internet", icon: "ri-wifi-line", ok: "Good Connection", fail: "Offline" },
];

const INITIAL_DEVICE_STATUS = {
  camera: false,
  microphone: false,
  speaker: true,
  internet: typeof navigator !== "undefined" ? navigator.onLine : true,
};

const stopMediaStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (_) {
      /* ignore */
    }
  });
};

const INITIAL_CHAT = [
  {
    id: 1,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:02 AM",
    text: "Please share your previous reports.",
  },
  {
    id: 2,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:02 AM",
    file: { name: "report.pdf", size: "2.4 MB" },
  },
  {
    id: 3,
    from: "patient",
    name: "Rohan Mehta",
    time: "10:04 AM",
    text: "Here is the report.",
  },
  {
    id: 4,
    from: "doctor",
    name: "Dr. Nikhil",
    time: "10:05 AM",
    text: "Thank you.",
  },
];

const formatTimer = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};

const StatusPill = ({ ok, checking, okLabel, failLabel }) => (
  <span className={`tele-call-status-pill ${ok ? "" : checking ? "is-checking" : "is-fail"}`}>
    {checking ? "Checking…" : ok ? okLabel : failLabel}
  </span>
);

const DeviceCheckStep = ({
  patient,
  deviceOk,
  deviceChecking,
  confirmed,
  previewStream,
  onConfirmChange,
  onRetest,
  onJoin,
  onClose,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    if (previewStream) {
      video.srcObject = previewStream;
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    } else {
      video.srcObject = null;
    }
    return undefined;
  }, [previewStream]);

  return (
    <Modal
      isOpen
      toggle={onClose}
      size="lg"
      className="patient-list-modal tele-call-modal tele-call-modal--device"
      backdrop="static"
      centered
    >
      <ModalHeader toggle={onClose} className="patient-list-modal__header tele-call-modal__header">
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-device-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">Check Your Device</span>
        </span>
      </ModalHeader>
      <ModalBody className="tele-call-modal__body">
        <div className="tele-device-grid">
          <div className="tele-device-checks">
            {DEVICE_CHECKS.map((item) => (
              <div key={item.id} className="tele-device-check-row">
                <span className="tele-device-check-row__icon" aria-hidden="true">
                  <i className={item.icon} />
                </span>
                <span className="tele-device-check-row__label">{item.label}</span>
                <StatusPill
                  ok={deviceOk[item.id]}
                  checking={deviceChecking}
                  okLabel={item.ok}
                  failLabel={item.fail}
                />
              </div>
            ))}
          </div>
          <div className="tele-device-preview">
            <div className="tele-device-preview__frame">
              {previewStream ? (
                <video
                  ref={videoRef}
                  className="tele-device-preview__video"
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <div className="tele-device-preview__fallback">
                  <i className="ri-camera-off-line" aria-hidden="true" />
                  <span>
                    {deviceChecking
                      ? "Accessing camera…"
                      : "Camera preview unavailable. Allow camera access and Retest."}
                  </span>
                </div>
              )}
              <span className="tele-device-preview__name">{patient?.patient || "You"}</span>
            </div>
            <label className="tele-call-confirm-check">
              <Input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => onConfirmChange(e.target.checked)}
              />
              <span>I can see and hear myself clearly</span>
            </label>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalActionButton action="update" iconClassName="ri-refresh-line" onClick={onRetest}>
          Retest
        </ModalActionButton>
        <ModalActionButton
          action="confirm"
          iconClassName="ri-vidicon-line"
          disabled={!confirmed || deviceChecking || !deviceOk.camera || !deviceOk.microphone}
          onClick={onJoin}
        >
          Join Consultation
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

const ConsentStep = ({ agreed, onAgreeChange, onCancel, onContinue }) => (
  <Modal
    isOpen
    toggle={onCancel}
    className="patient-list-modal tele-call-modal tele-call-modal--consent"
    backdrop="static"
    centered
  >
    <ModalHeader toggle={onCancel} className="patient-list-modal__header tele-call-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <span className="tele-call-consent-icon" aria-hidden="true">
          <i className="ri-record-circle-fill" />
        </span>
        <span className="patient-list-modal__title-text">Recording Consent</span>
      </span>
    </ModalHeader>
    <ModalBody className="tele-call-modal__body">
      <p className="tele-call-consent-text">
        This consultation may be recorded for clinical and quality purposes. By continuing, you
        agree to the recording of this consultation.
      </p>
      <label className="tele-call-confirm-check tele-call-confirm-check--strong">
        <Input type="checkbox" checked={agreed} onChange={(e) => onAgreeChange(e.target.checked)} />
        <span>I understand and agree.</span>
      </label>
    </ModalBody>
    <ModalFooter>
      <ModalActionButton action="cancel" onClick={onCancel} />
      <ModalActionButton
        action="confirm"
        iconClassName="ri-arrow-right-line"
        disabled={!agreed}
        onClick={onContinue}
      >
        Continue
      </ModalActionButton>
    </ModalFooter>
  </Modal>
);

const WaitingRoomStep = ({ onLeave }) => (
  <Modal
    isOpen
    toggle={onLeave}
    className="patient-list-modal tele-call-modal tele-call-modal--waiting"
    backdrop="static"
    centered
  >
    <ModalHeader toggle={onLeave} className="patient-list-modal__header tele-call-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <i className="ri-time-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
        <span className="patient-list-modal__title-text">Waiting Room</span>
      </span>
    </ModalHeader>
    <ModalBody className="tele-call-modal__body tele-waiting-body">
      <div className="tele-waiting-hero">
        <img src={doctorAvatar} alt="Doctor" className="tele-waiting-avatar" />
        <h4 className="tele-waiting-title">You&apos;re in the Waiting Room</h4>
        <p className="tele-waiting-doctor">Dr. Priya Sharma</p>
        <p className="tele-waiting-specialty">Homeopathy Specialist</p>
      </div>
      <div className="tele-waiting-meta">
        <div className="tele-waiting-meta__item">
          <span>Your position:</span>
          <strong>#2</strong>
        </div>
        <div className="tele-waiting-meta__item">
          <span>Estimated wait time:</span>
          <strong>03 minutes</strong>
        </div>
      </div>
    </ModalBody>
    <ModalFooter className="justify-content-center">
      <ModalActionButton
        action="close"
        iconClassName="ri-logout-box-r-line"
        onClick={onLeave}
      >
        Leave Waiting Room
      </ModalActionButton>
    </ModalFooter>
  </Modal>
);

const InterruptedStep = ({ isOpen, onRejoin, onLeave, onMinimize }) => (
  <Modal
    isOpen={isOpen}
    toggle={onLeave}
    className="patient-list-modal tele-call-modal tele-call-modal--alert"
    backdrop="static"
    centered
  >
    <ModalHeader className="patient-list-modal__header tele-call-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <span className="tele-alert-icon tele-alert-icon--danger tele-alert-icon--inline" aria-hidden="true">
          <i className="ri-wifi-off-line" />
        </span>
        <span className="patient-list-modal__title-text">Connection Interrupted</span>
      </span>
      <div className="tele-call-modal__header-actions">
        <button
          type="button"
          className="tele-call-modal__header-btn"
          aria-label="Minimize"
          title="Minimize"
          onClick={onMinimize}
        >
          <i className="ri-subtract-line" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onLeave}
        />
      </div>
    </ModalHeader>
    <ModalBody className="tele-call-modal__body tele-alert-body">
      <p className="tele-alert-text">Your consultation was disconnected.</p>
      <p className="tele-alert-text mb-0">Your session is still active. You can rejoin and continue.</p>
    </ModalBody>
    <ModalFooter>
      <ModalActionButton action="close" iconClassName="ri-logout-box-r-line" onClick={onLeave}>
        Leave Consultation
      </ModalActionButton>
      <ModalActionButton action="confirm" iconClassName="ri-vidicon-line" onClick={onRejoin}>
        Rejoin Consultation
      </ModalActionButton>
    </ModalFooter>
  </Modal>
);

const RejoinStickyButton = ({ onClick }) =>
  createPortal(
    <button
      type="button"
      className="tele-rejoin-sticky"
      onClick={onClick}
      aria-label="Rejoin consultation"
      title="Rejoin consultation"
    >
      <span className="tele-rejoin-sticky__pulse" aria-hidden="true" />
      <i className="ri-vidicon-line" aria-hidden="true" />
      <span>Rejoin</span>
    </button>,
    document.body
  );

const UnableConnectStep = ({ onRetry, onRejoin, onClose }) => (
  <Modal
    isOpen
    toggle={onClose}
    className="patient-list-modal tele-call-modal tele-call-modal--alert"
    backdrop="static"
    centered
  >
    <ModalHeader toggle={onClose} className="patient-list-modal__header tele-call-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <span className="tele-alert-icon tele-alert-icon--danger tele-alert-icon--inline" aria-hidden="true">
          <i className="ri-error-warning-fill" />
        </span>
        <span className="patient-list-modal__title-text">Unable to Connect</span>
      </span>
    </ModalHeader>
    <ModalBody className="tele-call-modal__body tele-alert-body tele-alert-body--left">
      <p className="tele-alert-text">
        We couldn&apos;t connect you to the consultation. Please check your internet connection and try
        again.
      </p>
      <ul className="tele-alert-tips">
        <li>
          <i className="ri-checkbox-circle-fill" aria-hidden="true" />
          Check your internet connection
        </li>
        <li>
          <i className="ri-checkbox-circle-fill" aria-hidden="true" />
          Allow camera and microphone access
        </li>
        <li>
          <i className="ri-checkbox-circle-fill" aria-hidden="true" />
          Try using a different network
        </li>
      </ul>
    </ModalBody>
    <ModalFooter>
      <button type="button" className="btn btn-link btn-sm text-primary p-0 me-auto" onClick={onClose}>
        Contact Support
      </button>
      <ModalActionButton action="close" iconClassName="ri-vidicon-line" onClick={onRejoin}>
        Rejoin
      </ModalActionButton>
      <ModalActionButton action="update" iconClassName="ri-refresh-line" onClick={onRetry}>
        Retry
      </ModalActionButton>
    </ModalFooter>
  </Modal>
);

const ConsultationChat = ({ messages, draft, onDraftChange, onSend, onClose }) => (
  <div className="tele-chat-panel">
    <div className="tele-chat-panel__header">
      <h5 className="mb-0">Consultation Chat</h5>
      <button type="button" className="btn-close" aria-label="Close chat" onClick={onClose} />
    </div>
    <div className="tele-chat-panel__messages">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`tele-chat-msg ${msg.from === "patient" ? "tele-chat-msg--mine" : ""}`}
        >
          {msg.from === "doctor" && (
            <div className="tele-chat-msg__avatar" aria-hidden="true">
              <i className="ri-user-3-fill" />
            </div>
          )}
          <div className="tele-chat-msg__content">
            <div className="tele-chat-msg__meta">
              <strong>{msg.name}</strong>
              <span>{msg.time}</span>
            </div>
            {msg.text && <div className="tele-chat-msg__bubble">{msg.text}</div>}
            {msg.file && (
              <div className="tele-chat-msg__file">
                <i className="ri-file-pdf-2-line" aria-hidden="true" />
                <div>
                  <strong>{msg.file.name}</strong>
                  <span>{msg.file.size}</span>
                </div>
                <button type="button" className="tele-chat-msg__download" aria-label="Download">
                  <i className="ri-download-2-line" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    <div className="tele-chat-panel__composer">
      <div className="tele-chat-input-wrap">
        <input
          type="text"
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button type="button" className="tele-chat-attach" aria-label="Attach file">
          <i className="ri-attachment-2" />
        </button>
      </div>
      <button type="button" className="tele-chat-send" aria-label="Send" onClick={onSend}>
        <i className="ri-send-plane-2-fill" />
      </button>
    </div>
  </div>
);

const DEFAULT_CASE_NOTES =
  "Patient reports reduced headache frequency after last remedy.";

const DEFAULT_PRESCRIPTION = {
  remedy: "Belladonna 30C",
  potency: "30C",
  duration: "3 days",
  dosage: "4 pills, thrice daily",
  instructions: "Take after food. Avoid coffee and mint.",
};

const SidebarViewEditModal = ({
  isOpen,
  toggle,
  title,
  icon,
  children,
  onSave,
  saveLabel = "Save",
}) => (
  <Modal
    isOpen={isOpen}
    toggle={toggle}
    className="patient-list-modal tele-call-modal tele-sidebar-edit-modal"
    backdrop="static"
    centered
    zIndex={22000}
  >
    <ModalHeader toggle={toggle} className="patient-list-modal__header tele-call-modal__header">
      <span className="patient-list-modal__title patient-list-modal__title--simple">
        <i className={icon} style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
        <span className="patient-list-modal__title-text">{title}</span>
      </span>
    </ModalHeader>
    <ModalBody className="tele-call-modal__body">{children}</ModalBody>
    <ModalFooter>
      <ModalActionButton action="cancel" onClick={toggle} />
      {onSave ? (
        <ModalActionButton action="save" onClick={onSave}>
          {saveLabel}
        </ModalActionButton>
      ) : (
        <ModalActionButton action="close" onClick={toggle} />
      )}
    </ModalFooter>
  </Modal>
);

const InCallStep = ({
  patient,
  elapsed,
  muted,
  videoOff,
  chatOpen,
  messages,
  chatDraft,
  sidebarTab,
  localStream,
  onToggleMute,
  onToggleVideo,
  onToggleChat,
  onSidebarTab,
  onChatDraftChange,
  onSendChat,
  onEndCall,
  onSimulateInterrupt,
}) => {
  const genderAge = patient?.ageSex || "—";
  const mobile = patient?.mobile ? `+91 ${patient.mobile}` : "—";
  const localVideoRef = useRef(null);
  const [popup, setPopup] = useState(null);
  const [caseNotes, setCaseNotes] = useState(DEFAULT_CASE_NOTES);
  const [draftCaseNotes, setDraftCaseNotes] = useState(DEFAULT_CASE_NOTES);
  const [prescription, setPrescription] = useState(DEFAULT_PRESCRIPTION);
  const [draftPrescription, setDraftPrescription] = useState(DEFAULT_PRESCRIPTION);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return undefined;
    if (localStream) {
      video.srcObject = localStream;
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    } else {
      video.srcObject = null;
    }
    return undefined;
  }, [localStream]);

  const openHistory = () => setPopup("history");
  const openCaseEdit = () => {
    setDraftCaseNotes(caseNotes);
    setPopup("case");
  };
  const openRxEdit = () => {
    setDraftPrescription({ ...prescription });
    setPopup("prescription");
  };
  const closePopup = () => setPopup(null);

  const saveCaseNotes = () => {
    setCaseNotes(draftCaseNotes);
    closePopup();
  };

  const savePrescription = () => {
    setPrescription({ ...draftPrescription });
    closePopup();
  };

  const updateDraftRx = (field, value) => {
    setDraftPrescription((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="tele-call-stage">
      <div className="tele-call-stage__main">
        <div className="tele-call-video">
          <img
            src={patientAvatar}
            alt={patient?.patient || "Patient"}
            className="tele-call-video__main"
          />
          <div className="tele-call-video__top">
            <span className="tele-call-video__patient">{patient?.patient || "Patient"}</span>
            <span className="tele-call-video__timer">{formatTimer(elapsed)}</span>
            <button type="button" className="tele-call-video__fs" aria-label="Fullscreen">
              <i className="ri-fullscreen-line" />
            </button>
          </div>
          <div className="tele-call-video__pip">
            {localStream ? (
              <video
                ref={localVideoRef}
                className="tele-call-video__pip-video"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <img src={doctorPreview} alt="You" />
            )}
            {videoOff && <span className="tele-call-video__pip-off">Video Off</span>}
          </div>
          <div className="tele-call-controls">
            <button
              type="button"
              className={`tele-call-ctrl ${muted ? "is-off" : ""}`}
              onClick={onToggleMute}
            >
              <i className={muted ? "ri-mic-off-fill" : "ri-mic-fill"} />
              <span>Mute</span>
            </button>
            <button
              type="button"
              className={`tele-call-ctrl ${videoOff ? "is-off" : ""}`}
              onClick={onToggleVideo}
            >
              <i className={videoOff ? "ri-camera-off-fill" : "ri-vidicon-fill"} />
              <span>Stop Video</span>
            </button>
            <button type="button" className="tele-call-ctrl">
              <i className="ri-share-box-line" />
              <span>Share</span>
            </button>
            <button
              type="button"
              className={`tele-call-ctrl ${chatOpen ? "is-active" : ""}`}
              onClick={onToggleChat}
            >
              <i className="ri-chat-smile-2-line" />
              <span>Chat</span>
            </button>
            <button type="button" className="tele-call-ctrl" onClick={onSimulateInterrupt}>
              <i className="ri-more-fill" />
              <span>More</span>
            </button>
            <button
              type="button"
              className="tele-call-ctrl tele-call-ctrl--end"
              onClick={() => setEndConfirmOpen(true)}
            >
              <i className="ri-phone-fill" />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {chatOpen && (
          <ConsultationChat
            messages={messages}
            draft={chatDraft}
            onDraftChange={onChatDraftChange}
            onSend={onSendChat}
            onClose={onToggleChat}
          />
        )}
      </div>

      <aside className="tele-call-sidebar">
        <div className="tele-call-sidebar__tabs">
          {["Patient Info", "Case", "Prescription"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tele-call-sidebar__tab ${sidebarTab === tab ? "is-active" : ""}`}
              onClick={() => onSidebarTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {sidebarTab === "Patient Info" && (
          <div className="tele-call-sidebar__body">
            <div className="tele-call-patient-card">
              <img src={patientAvatar} alt="" className="tele-call-patient-card__avatar" />
              <div>
                <h5 className="mb-1">{patient?.patient || "Patient"}</h5>
                <p className="mb-0 text-muted">{genderAge.replace(" / ", " • ")}</p>
                <p className="mb-0 text-muted">{mobile}</p>
              </div>
            </div>
            <div className="tele-call-info-list">
              <div>
                <span>Chief Complaint</span>
                <strong>Follow-up, Migraine</strong>
              </div>
              <div>
                <span>Previous Visits</span>
                <strong>3</strong>
              </div>
              <div>
                <span>Last Visit</span>
                <strong>12 Sep 2026</strong>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-soft-primary modal-action-btn w-100"
              onClick={openHistory}
            >
              <i className="ri-history-line align-middle" aria-hidden />
              <span>View Full History</span>
            </button>
          </div>
        )}

        {sidebarTab === "Case" && (
          <div className="tele-call-sidebar__body">
            <div className="tele-call-section-head">
              <p className="tele-call-section-head__label mb-0">Case notes for this consultation.</p>
              <button type="button" className="btn btn-link btn-sm tele-call-section-head__link" onClick={openCaseEdit}>
                <i className="ri-pencil-fill" aria-hidden="true" />
                Edit
              </button>
            </div>
            <div className="tele-call-notes-preview">{caseNotes}</div>
            <button
              type="button"
              className="btn btn-soft-primary modal-action-btn w-100 mt-2"
              onClick={openCaseEdit}
            >
              <i className="ri-file-edit-line align-middle" aria-hidden />
              <span>View / Edit Case</span>
            </button>
          </div>
        )}

        {sidebarTab === "Prescription" && (
          <div className="tele-call-sidebar__body">
            <div className="tele-call-rx-card">
              <i className="ri-file-list-3-line" aria-hidden="true" />
              <div>
                <strong>Current Prescription</strong>
                <p className="mb-0 text-muted">
                  {prescription.remedy} · {prescription.duration}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-soft-primary modal-action-btn w-100 mt-2"
              onClick={openRxEdit}
            >
              <i className="ri-file-list-3-line align-middle" aria-hidden />
              <span>View / Edit Prescription</span>
            </button>
          </div>
        )}
      </aside>

      <SidebarViewEditModal
        isOpen={popup === "history"}
        toggle={closePopup}
        title="Patient History"
        icon="ri-history-line"
      >
        <div className="tele-call-patient-card mb-3">
          <img src={patientAvatar} alt="" className="tele-call-patient-card__avatar" />
          <div>
            <h5 className="mb-1">{patient?.patient || "Patient"}</h5>
            <p className="mb-0 text-muted">
              {genderAge.replace(" / ", " • ")} · {mobile}
            </p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0 tele-sidebar-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Complaint</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>12 Sep 2026</td>
                <td>Follow-up</td>
                <td>Migraine</td>
                <td>Improving</td>
              </tr>
              <tr>
                <td>28 Aug 2026</td>
                <td>Telemedicine</td>
                <td>Headache</td>
                <td>Stable</td>
              </tr>
              <tr>
                <td>05 Aug 2026</td>
                <td>In-clinic</td>
                <td>Migraine onset</td>
                <td>New case</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SidebarViewEditModal>

      <SidebarViewEditModal
        isOpen={popup === "case"}
        toggle={closePopup}
        title="View / Edit Case"
        icon="ri-file-edit-line"
        onSave={saveCaseNotes}
      >
        <label className="tele-complete-label">Case Notes</label>
        <textarea
          className="form-control tele-call-textarea"
          rows={8}
          value={draftCaseNotes}
          onChange={(e) => setDraftCaseNotes(e.target.value)}
        />
      </SidebarViewEditModal>

      <SidebarViewEditModal
        isOpen={popup === "prescription"}
        toggle={closePopup}
        title="View / Edit Prescription"
        icon="ri-file-list-3-line"
        onSave={savePrescription}
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="tele-complete-label">Remedy</label>
            <Input
              value={draftPrescription.remedy}
              onChange={(e) => updateDraftRx("remedy", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Potency</label>
            <Input
              value={draftPrescription.potency}
              onChange={(e) => updateDraftRx("potency", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Dosage</label>
            <Input
              value={draftPrescription.dosage}
              onChange={(e) => updateDraftRx("dosage", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Duration</label>
            <Input
              value={draftPrescription.duration}
              onChange={(e) => updateDraftRx("duration", e.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="tele-complete-label">Instructions</label>
            <textarea
              className="form-control tele-call-textarea"
              rows={4}
              value={draftPrescription.instructions}
              onChange={(e) => updateDraftRx("instructions", e.target.value)}
            />
          </div>
        </div>
      </SidebarViewEditModal>

      <Modal
        isOpen={endConfirmOpen}
        toggle={() => setEndConfirmOpen(false)}
        className="patient-list-modal tele-call-modal tele-call-modal--alert tele-end-confirm-modal"
        backdrop="static"
        centered
        zIndex={21000}
      >
        <ModalHeader
          toggle={() => setEndConfirmOpen(false)}
          className="patient-list-modal__header tele-call-modal__header"
        >
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <span className="tele-alert-icon tele-alert-icon--danger tele-alert-icon--inline" aria-hidden="true">
              <i className="ri-phone-fill" />
            </span>
            <span className="patient-list-modal__title-text">End Consultation?</span>
          </span>
        </ModalHeader>
        <ModalBody className="tele-call-modal__body tele-alert-body">
          <p className="tele-alert-text mb-0">
            Are you sure you want to end this call with{" "}
            <strong>{patient?.patient || "the patient"}</strong>? You can complete notes and
            prescription after ending.
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={() => setEndConfirmOpen(false)} />
          <ModalActionButton
            action="delete"
            iconClassName="ri-phone-fill"
            onClick={() => {
              setEndConfirmOpen(false);
              onEndCall();
            }}
          >
            End Call
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

const CompletedStep = ({ patient, durationMin, onClose, onSave }) => {
  const [summary, setSummary] = useState("Patient reports reduced headache frequency...");
  const [diagnosis, setDiagnosis] = useState("Migraine (improving)");
  const [followUp, setFollowUp] = useState("15 Days");
  const [shareSummary, setShareSummary] = useState(true);
  const [shareRx, setShareRx] = useState(true);
  const [sendVia, setSendVia] = useState({ whatsapp: true, email: false, inApp: false });
  const [rxEditOpen, setRxEditOpen] = useState(false);
  const [prescription, setPrescription] = useState(DEFAULT_PRESCRIPTION);
  const [draftPrescription, setDraftPrescription] = useState(DEFAULT_PRESCRIPTION);

  const openRxEdit = () => {
    setDraftPrescription({ ...prescription });
    setRxEditOpen(true);
  };

  const saveRxEdit = () => {
    setPrescription({ ...draftPrescription });
    setRxEditOpen(false);
  };

  const updateDraftRx = (field, value) => {
    setDraftPrescription((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Modal
        isOpen
        toggle={onClose}
        size="xl"
        className="patient-list-modal tele-call-modal tele-call-modal--completed"
        backdrop="static"
        centered
      >
        <ModalHeader toggle={onClose} className="patient-list-modal__header tele-call-modal__header">
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <span className="tele-call-complete-icon" aria-hidden="true">
              <i className="ri-checkbox-circle-fill" />
            </span>
            <span className="patient-list-modal__title-text">Consultation Completed</span>
          </span>
          <span className="tele-call-duration-pill">Duration: {durationMin} min</span>
        </ModalHeader>
        <ModalBody className="tele-call-modal__body">
          <div className="tele-complete-grid">
            <div className="tele-complete-card">
              <h6 className="tele-complete-card__title">Patient Details</h6>
              <div className="tele-call-patient-card mb-3">
                <img src={patientAvatar} alt="" className="tele-call-patient-card__avatar" />
                <div>
                  <h5 className="mb-1">{patient?.patient || "Patient"}</h5>
                  <p className="mb-0 text-muted">
                    {(patient?.ageSex || "—").replace(" / ", " • ")}
                    {patient?.mobile ? ` • +91 ${patient.mobile}` : ""}
                  </p>
                </div>
              </div>
              <label className="tele-complete-label">
                Consultation Summary <span>*</span>
              </label>
              <textarea
                className="form-control tele-call-textarea mb-3"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="tele-complete-label">Diagnosis / Impression</label>
                  <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="tele-complete-label">Follow-up</label>
                  <Input type="select" value={followUp} onChange={(e) => setFollowUp(e.target.value)}>
                    <option>7 Days</option>
                    <option>15 Days</option>
                    <option>30 Days</option>
                    <option>As needed</option>
                  </Input>
                </div>
              </div>
            </div>

            <div className="tele-complete-side">
              <div className="tele-complete-card tele-complete-card--row">
                <div>
                  <h6 className="tele-complete-card__title mb-1">Prescription</h6>
                  <p className="tele-complete-rx-summary mb-0">
                    {prescription.remedy} · {prescription.duration}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-link btn-sm text-primary p-0 tele-complete-view-edit"
                  onClick={openRxEdit}
                >
                  View / Edit
                </button>
              </div>
              <div className="tele-complete-card">
                <h6 className="tele-complete-card__title">Share with Patient</h6>
                <label className="tele-complete-toggle">
                  <span>Consultation Summary</span>
                  <Input
                    type="switch"
                    checked={shareSummary}
                    onChange={(e) => setShareSummary(e.target.checked)}
                  />
                </label>
                <label className="tele-complete-toggle">
                  <span>Prescription</span>
                  <Input
                    type="switch"
                    checked={shareRx}
                    onChange={(e) => setShareRx(e.target.checked)}
                  />
                </label>
                <p className="tele-complete-label mt-3 mb-2">Send via</p>
                <div className="tele-send-via-options" role="group" aria-label="Send via">
                  {[
                    { key: "whatsapp", label: "WhatsApp" },
                    { key: "email", label: "Email" },
                    { key: "inApp", label: "In-app" },
                  ].map((item) => (
                    <label key={item.key} className="tele-send-via-option" htmlFor={`send-via-${item.key}`}>
                      <Input
                        id={`send-via-${item.key}`}
                        type="checkbox"
                        checked={sendVia[item.key]}
                        onChange={(e) =>
                          setSendVia((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={onClose} />
          <ModalActionButton action="save" onClick={onSave}>
            Save &amp; Complete
          </ModalActionButton>
        </ModalFooter>
      </Modal>

      <SidebarViewEditModal
        isOpen={rxEditOpen}
        toggle={() => setRxEditOpen(false)}
        title="View / Edit Prescription"
        icon="ri-file-list-3-line"
        onSave={saveRxEdit}
      >
        <div className="row g-2">
          <div className="col-md-6">
            <label className="tele-complete-label">Remedy</label>
            <Input
              value={draftPrescription.remedy}
              onChange={(e) => updateDraftRx("remedy", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Potency</label>
            <Input
              value={draftPrescription.potency}
              onChange={(e) => updateDraftRx("potency", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Dosage</label>
            <Input
              value={draftPrescription.dosage}
              onChange={(e) => updateDraftRx("dosage", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="tele-complete-label">Duration</label>
            <Input
              value={draftPrescription.duration}
              onChange={(e) => updateDraftRx("duration", e.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="tele-complete-label">Instructions</label>
            <textarea
              className="form-control tele-call-textarea"
              rows={4}
              value={draftPrescription.instructions}
              onChange={(e) => updateDraftRx("instructions", e.target.value)}
            />
          </div>
        </div>
      </SidebarViewEditModal>
    </>
  );
};

const TeleCallFlow = ({ isOpen, patient, onClose }) => {
  const [step, setStep] = useState(CALL_STEPS.DEVICE);
  const [deviceOk, setDeviceOk] = useState(INITIAL_DEVICE_STATUS);
  const [deviceChecking, setDeviceChecking] = useState(false);
  const [deviceConfirmed, setDeviceConfirmed] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [retestToken, setRetestToken] = useState(0);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [interruptedMinimized, setInterruptedMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("Patient Info");
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [chatDraft, setChatDraft] = useState("");
  const mediaStreamRef = useRef(null);

  const clearPreviewStream = () => {
    stopMediaStream(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setPreviewStream(null);
  };

  const closeFlow = () => {
    clearPreviewStream();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      clearPreviewStream();
      return undefined;
    }
    setStep(CALL_STEPS.DEVICE);
    setDeviceConfirmed(false);
    setConsentAgreed(false);
    setInterruptedMinimized(false);
    setElapsed(0);
    setMuted(false);
    setVideoOff(false);
    setChatOpen(false);
    setSidebarTab("Patient Info");
    setMessages(INITIAL_CHAT);
    setChatDraft("");
    setDeviceOk(INITIAL_DEVICE_STATUS);
    setDeviceChecking(false);
    setRetestToken((token) => token + 1);
    return () => {
      clearPreviewStream();
    };
  }, [isOpen, patient?.id]);

  useEffect(() => {
    if (!isOpen || step !== CALL_STEPS.DEVICE) return undefined;

    let cancelled = false;

    const startDeviceCheck = async () => {
      setDeviceChecking(true);
      setDeviceOk({
        camera: false,
        microphone: false,
        speaker: true,
        internet: navigator.onLine,
      });
      clearPreviewStream();

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setDeviceOk((prev) => ({
            ...prev,
            camera: false,
            microphone: false,
            speaker: false,
            internet: navigator.onLine,
          }));
          setDeviceChecking(false);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        mediaStreamRef.current = stream;
        setPreviewStream(stream);
        const hasVideo = stream.getVideoTracks().some((track) => track.readyState === "live");
        const hasAudio = stream.getAudioTracks().some((track) => track.readyState === "live");
        setDeviceOk({
          camera: hasVideo,
          microphone: hasAudio,
          speaker: true,
          internet: navigator.onLine,
        });
      } catch (_) {
        if (cancelled) return;
        let cameraOk = false;
        let micOk = false;
        try {
          const videoOnly = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (!cancelled) {
            mediaStreamRef.current = videoOnly;
            setPreviewStream(videoOnly);
            cameraOk = videoOnly.getVideoTracks().some((track) => track.readyState === "live");
          } else {
            stopMediaStream(videoOnly);
          }
        } catch (__) {
          cameraOk = false;
        }
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          if (!cancelled) {
            micOk = audioOnly.getAudioTracks().some((track) => track.readyState === "live");
            if (!mediaStreamRef.current) {
              mediaStreamRef.current = audioOnly;
              setPreviewStream(audioOnly);
            } else {
              stopMediaStream(audioOnly);
            }
          } else {
            stopMediaStream(audioOnly);
          }
        } catch (__) {
          micOk = false;
        }
        setDeviceOk({
          camera: cameraOk,
          microphone: micOk,
          speaker: true,
          internet: navigator.onLine,
        });
      } finally {
        if (!cancelled) setDeviceChecking(false);
      }
    };

    startDeviceCheck();

    return () => {
      cancelled = true;
    };
  }, [isOpen, step, retestToken]);

  useEffect(() => {
    if (!previewStream) return undefined;
    const videoTrack = previewStream.getVideoTracks()[0];
    const audioTrack = previewStream.getAudioTracks()[0];
    if (videoTrack) videoTrack.enabled = !videoOff;
    if (audioTrack) audioTrack.enabled = !muted;
    return undefined;
  }, [previewStream, muted, videoOff]);

  useEffect(() => {
    if (!isOpen || step !== CALL_STEPS.WAITING) return undefined;
    const timer = setTimeout(() => {
      setElapsed(18 * 60 + 24);
      setStep(CALL_STEPS.CALL);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || step !== CALL_STEPS.CALL) return undefined;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  const durationMin = useMemo(() => Math.max(1, Math.round(elapsed / 60) || 18), [elapsed]);

  if (!isOpen || !patient) return null;

  const handleRetest = () => {
    setDeviceConfirmed(false);
    setRetestToken((token) => token + 1);
  };

  const handleSendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        from: "patient",
        name: patient.patient,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text,
      },
    ]);
    setChatDraft("");
  };

  if (step === CALL_STEPS.DEVICE) {
    return (
      <DeviceCheckStep
        patient={patient}
        deviceOk={deviceOk}
        deviceChecking={deviceChecking}
        confirmed={deviceConfirmed}
        previewStream={previewStream}
        onConfirmChange={setDeviceConfirmed}
        onRetest={handleRetest}
        onJoin={() => setStep(CALL_STEPS.CONSENT)}
        onClose={closeFlow}
      />
    );
  }

  if (step === CALL_STEPS.CONSENT) {
    return (
      <ConsentStep
        agreed={consentAgreed}
        onAgreeChange={setConsentAgreed}
        onCancel={closeFlow}
        onContinue={() => setStep(CALL_STEPS.WAITING)}
      />
    );
  }

  if (step === CALL_STEPS.WAITING) {
    return <WaitingRoomStep onLeave={closeFlow} />;
  }

  if (step === CALL_STEPS.INTERRUPTED) {
    return (
      <>
        <InterruptedStep
          isOpen={!interruptedMinimized}
          onRejoin={() => {
            setInterruptedMinimized(false);
            setStep(CALL_STEPS.CALL);
          }}
          onLeave={closeFlow}
          onMinimize={() => setInterruptedMinimized(true)}
        />
        {interruptedMinimized && (
          <RejoinStickyButton onClick={() => setInterruptedMinimized(false)} />
        )}
      </>
    );
  }

  if (step === CALL_STEPS.UNABLE) {
    return (
      <UnableConnectStep
        onRetry={() => {
          setStep(CALL_STEPS.DEVICE);
          setRetestToken((token) => token + 1);
        }}
        onRejoin={() => setStep(CALL_STEPS.WAITING)}
        onClose={closeFlow}
      />
    );
  }

  if (step === CALL_STEPS.CALL) {
    return createPortal(
      <InCallStep
        patient={patient}
        elapsed={elapsed}
        muted={muted}
        videoOff={videoOff}
        chatOpen={chatOpen}
        messages={messages}
        chatDraft={chatDraft}
        sidebarTab={sidebarTab}
        localStream={previewStream}
        onToggleMute={() => setMuted((v) => !v)}
        onToggleVideo={() => setVideoOff((v) => !v)}
        onToggleChat={() => setChatOpen((v) => !v)}
        onSidebarTab={setSidebarTab}
        onChatDraftChange={setChatDraft}
        onSendChat={handleSendChat}
        onEndCall={() => {
          clearPreviewStream();
          setStep(CALL_STEPS.COMPLETED);
        }}
        onSimulateInterrupt={() => {
          setInterruptedMinimized(false);
          setStep(CALL_STEPS.INTERRUPTED);
        }}
      />,
      document.body
    );
  }

  if (step === CALL_STEPS.COMPLETED) {
    return (
      <CompletedStep
        patient={patient}
        durationMin={durationMin}
        onClose={closeFlow}
        onSave={closeFlow}
      />
    );
  }

  return null;
};

export default TeleCallFlow;
