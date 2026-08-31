import React from 'react';

const AudioCaseRubricApprovalBar = ({
  rubricKey,
  approvalState = 'pending',
  requireManualApproval = false,
  disabled = false,
  onApprove,
  onReject,
}) => {
  if (!requireManualApproval) {
    return (
      <button
        type="button"
        className="ac-icon-btn ac-icon-btn--approve"
        disabled={disabled}
        onClick={onApprove}
        title="Add to repertorization"
        aria-label="Add to repertorization"
      >
        <i className="ri-add-line" aria-hidden="true" />
      </button>
    );
  }

  if (approvalState === 'approved') {
    return (
      <span className="ac-status-chip ac-status-chip--approved" title="Approved">
        <i className="ri-checkbox-circle-fill" aria-hidden="true" />
        <span className="visually-hidden">Approved</span>
      </span>
    );
  }

  if (approvalState === 'rejected') {
    return (
      <span className="ac-status-chip ac-status-chip--rejected" title="Rejected">
        <i className="ri-close-circle-fill" aria-hidden="true" />
        <span className="visually-hidden">Rejected</span>
      </span>
    );
  }

  return (
    <div className="ac-approve-group" role="group" aria-label="Rubric decision">
      <button
        type="button"
        className="ac-icon-btn ac-icon-btn--approve"
        disabled={disabled}
        onClick={onApprove}
        title="Approve"
        aria-label="Approve rubric"
      >
        <i className="ri-check-line" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="ac-icon-btn ac-icon-btn--reject"
        disabled={disabled}
        onClick={() => onReject?.(rubricKey)}
        title="Reject"
        aria-label="Reject rubric"
      >
        <i className="ri-close-line" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AudioCaseRubricApprovalBar;
