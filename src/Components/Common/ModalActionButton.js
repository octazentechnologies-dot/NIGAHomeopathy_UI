import React from 'react';
import { Spinner } from 'reactstrap';

/** Standard modal actions — soft Velzon buttons with Remix icons. */
export const MODAL_ACTIONS = {
  save: { soft: 'success', icon: 'ri-save-line', label: 'Save' },
  update: { soft: 'info', icon: 'ri-refresh-line', label: 'Update' },
  edit: { soft: 'success', icon: 'ri-pencil-fill', label: 'Edit' },
  cancel: { soft: 'secondary', icon: 'ri-close-line', label: 'Cancel' },
  close: { soft: 'secondary', icon: 'ri-close-circle-line', label: 'Close' },
  delete: { soft: 'danger', icon: 'ri-delete-bin-line', label: 'Delete' },
  submit: { soft: 'primary', icon: 'ri-check-line', label: 'Submit' },
  confirm: { soft: 'primary', icon: 'ri-checkbox-circle-line', label: 'Confirm' },
  send: { soft: 'success', icon: 'ri-send-plane-fill', label: 'Send' },
  add: { soft: 'info', icon: 'ri-add-line', label: 'Add' },
  import: { soft: 'primary', icon: 'ri-upload-2-line', label: 'Import' },
  download: { soft: 'primary', icon: 'ri-download-2-line', label: 'Download' },
  yes: { soft: 'success', icon: 'ri-check-line', label: 'Yes' },
  no: { soft: 'secondary', icon: 'ri-close-line', label: 'No' },
};

/**
 * Soft modal footer button with icon.
 * @param {keyof typeof MODAL_ACTIONS} action — preset (save, cancel, update, …)
 */
export default function ModalActionButton({
  action = 'save',
  children,
  className = '',
  iconClassName,
  loading = false,
  loadingLabel,
  disabled,
  ...props
}) {
  const preset = MODAL_ACTIONS[action] || MODAL_ACTIONS.save;
  const label = children ?? preset.label;
  const icon = iconClassName || preset.icon;

  return (
    <button
      type="button"
      className={`btn btn-soft-${preset.soft} modal-action-btn ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>{loadingLabel || label}</span>
        </>
      ) : (
        <>
          <i className={`${icon} align-middle`} aria-hidden />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/** Map legacy reactstrap `color` to btn-soft-* className (for gradual migration). */
export function modalSoftBtnClass(color = 'primary') {
  const map = {
    primary: 'btn-soft-primary',
    secondary: 'btn-soft-secondary',
    success: 'btn-soft-success',
    info: 'btn-soft-info',
    warning: 'btn-soft-warning',
    danger: 'btn-soft-danger',
    dark: 'btn-soft-dark',
    light: 'btn-soft-secondary',
    link: 'btn-soft-secondary',
  };
  return `btn ${map[color] || map.primary} modal-action-btn`;
}
