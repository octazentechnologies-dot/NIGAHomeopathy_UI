import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ModalActionButton from './ModalActionButton';
import '../WhatsAppModal/WhatsAppModal.css';
import {
  deletePatientBoardBackup,
  fetchLatestPatientBoardBackupDetail,
  fetchPatientBoardBackupSummary,
  restorePatientBoardBackupSessions,
  restoreSinglePatientBoardBackupSession,
} from '../../slices/doctor/patientBoardBackup/thunk';
import {
  getBackupSessionsFromPayload,
  getBackupPayloadString,
  normalizeBackupSummary,
} from '../../helpers/patientBoardBackupHelper';
import { getSortedPatientSessions } from '../../helpers/patientBoardSessionHelper';
import { UserRole } from '../constants/roles';

const formatSavedAt = (savedAt) => {
  if (!savedAt) {
    return '';
  }
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return String(savedAt);
  }
  return date.toLocaleString();
};

const LastWorkBackupHeaderButton = ({ userRole }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const summary = useSelector((state) => state?.PatientBoardBackup?.summary);
  const summaryLoading = useSelector((state) => state?.PatientBoardBackup?.summaryLoading);
  const restoreLoading = useSelector((state) => state?.PatientBoardBackup?.restoreLoading);
  const deleteLoading = useSelector((state) => state?.PatientBoardBackup?.deleteLoading);
  const latestBackupDetail = useSelector((state) => state?.PatientBoardBackup?.latestBackupDetail);

  const normalizedSummary = useMemo(() => normalizeBackupSummary(summary), [summary]);

  const backupSessions = useMemo(
    () => getSortedPatientSessions(getBackupSessionsFromPayload(getBackupPayloadString(latestBackupDetail))),
    [latestBackupDetail]
  );

  useEffect(() => {
    if (userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION) {
      dispatch(fetchPatientBoardBackupSummary());
    }
  }, [dispatch, userRole]);

  const loadBackupDetail = useCallback(async () => {
    await dispatch(fetchLatestPatientBoardBackupDetail());
  }, [dispatch]);

  const openModal = async () => {
    setModalOpen(true);
    await loadBackupDetail();
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleRestoreAll = async () => {
    try {
      const restored = await dispatch(restorePatientBoardBackupSessions());
      if (restored) {
        closeModal();
        await Swal.fire({
          icon: 'success',
          title: 'Backup restored',
          text: 'Your saved patient work has been restored.',
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Restore failed',
        text: error?.message || 'Unable to restore backup.',
        confirmButtonColor: '#000000',
      });
    }
  };

  const handleRestoreOne = async (session) => {
    try {
      const restored = await dispatch(restoreSinglePatientBoardBackupSession(session));
      if (restored) {
        closeModal();
        if (session?.resumePath) {
          navigate(session.resumePath);
        }
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Restore failed',
        text: error?.message || 'Unable to restore this patient session.',
        confirmButtonColor: '#000000',
      });
    }
  };

  const handleDeleteBackup = async () => {
    const confirmDelete = await Swal.fire({
      icon: 'warning',
      title: 'Delete saved backup?',
      text: 'This will permanently remove your last saved patient work backup.',
      showCancelButton: true,
      confirmButtonText: 'Delete backup',
      cancelButtonText: 'Keep backup',
      confirmButtonColor: '#000000',
    });

    if (!confirmDelete.isConfirmed) {
      return;
    }

    try {
      await dispatch(deletePatientBoardBackup());
      closeModal();
      await Swal.fire({
        icon: 'success',
        title: 'Backup deleted',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: error?.message || 'Unable to delete backup.',
        confirmButtonColor: '#000000',
      });
    }
  };

  if (userRole !== UserRole.DOCTOR && userRole !== UserRole.RECEPTION) {
    return null;
  }

  if (!normalizedSummary.hasBackup && !summaryLoading) {
    return null;
  }

  return (
    <>
      <div className="ms-1 header-item last-work-backup-header">
        <button
          type="button"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle position-relative"
          title="Last work backup"
          aria-label="Last work backup"
          onClick={openModal}
          disabled={summaryLoading}
        >
          <i className="ri-history-line fs-20" />
          {normalizedSummary.patientCount > 0 ? (
            <Badge
              color="info"
              pill
              className="position-absolute last-work-backup-header__badge"
            >
              {normalizedSummary.patientCount}
            </Badge>
          ) : null}
        </button>
      </div>

      <Modal isOpen={modalOpen} toggle={closeModal} centered size="lg" className="whatsapp-modal last-work-backup-modal">
        <ModalHeader toggle={closeModal}>
          <div className="whatsapp-modal__header">
            <div className="whatsapp-modal__title">
              <i className="ri-history-line" style={{ color: '#25a0e2', fontSize: 20 }} />
              Last Work Backup
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="whatsapp-modal__body">
          {restoreLoading && !backupSessions.length ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <p className="whatsapp-modal__subtle mb-3">
                Saved on {formatSavedAt(normalizedSummary.savedAt || latestBackupDetail?.savedAt)}
                {' · '}
                {normalizedSummary.patientCount || backupSessions.length} patient(s)
              </p>

              {backupSessions.length ? (
                <div className="last-work-backup-modal__list">
                  {backupSessions.map((session) => (
                    <div
                      key={session.patientKey}
                      className="last-work-backup-modal__item d-flex align-items-center justify-content-between gap-3"
                    >
                      <div>
                        <div className="fw-semibold">{session.patientName || 'Patient'}</div>
                        <div className="whatsapp-modal__subtle">
                          Last updated {formatSavedAt(session.updatedAt)}
                        </div>
                      </div>
                      <ModalActionButton
                        action="update"
                        onClick={() => handleRestoreOne(session)}
                        disabled={restoreLoading}
                      >
                        Restore
                      </ModalActionButton>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="patient-list-modal__empty">
                  <span className="patient-list-modal__empty-icon" aria-hidden="true">
                    <i className="ri-history-line" />
                  </span>
                  No patient sessions found in this backup.
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter className="whatsapp-modal__footer d-flex flex-wrap gap-2 justify-content-between">
          <ModalActionButton
            action="delete"
            onClick={handleDeleteBackup}
            disabled={deleteLoading || restoreLoading}
            loading={deleteLoading}
            loadingLabel="Deleting..."
          >
            Delete backup
          </ModalActionButton>
          <div className="d-flex gap-2">
            <ModalActionButton action="close" onClick={closeModal} />
            <ModalActionButton
              action="save"
              iconClassName="ri-history-line"
              onClick={handleRestoreAll}
              disabled={restoreLoading || !backupSessions.length}
              loading={restoreLoading}
              loadingLabel="Restoring..."
            >
              Restore all
            </ModalActionButton>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default LastWorkBackupHeaderButton;
