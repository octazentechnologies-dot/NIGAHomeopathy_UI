import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
              color="dark"
              pill
              className="position-absolute last-work-backup-header__badge"
            >
              {normalizedSummary.patientCount}
            </Badge>
          ) : null}
        </button>
      </div>

      <Modal isOpen={modalOpen} toggle={closeModal} centered size="lg">
        <ModalHeader toggle={closeModal}>Last Work Backup</ModalHeader>
        <ModalBody>
          {restoreLoading && !backupSessions.length ? (
            <div className="text-center py-4">
              <Spinner color="dark" />
            </div>
          ) : (
            <>
              <p className="text-muted mb-3">
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
                        <div className="text-muted small">
                          Last updated {formatSavedAt(session.updatedAt)}
                        </div>
                      </div>
                      <Button
                        color="dark"
                        size="sm"
                        outline
                        disabled={restoreLoading}
                        onClick={() => handleRestoreOne(session)}
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-0">No patient sessions found in this backup.</p>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter className="d-flex flex-wrap gap-2 justify-content-between">
          <Button color="danger" outline disabled={deleteLoading || restoreLoading} onClick={handleDeleteBackup}>
            {deleteLoading ? <Spinner size="sm" /> : 'Delete backup'}
          </Button>
          <div className="d-flex gap-2">
            <Button color="light" onClick={closeModal}>
              Close
            </Button>
            <Button
              color="dark"
              disabled={restoreLoading || !backupSessions.length}
              onClick={handleRestoreAll}
            >
              {restoreLoading ? <Spinner size="sm" /> : 'Restore all'}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default LastWorkBackupHeaderButton;
