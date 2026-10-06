import React, { useEffect, useRef, useState } from "react";
import { Input, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  VERIFICATION_LABELS,
  buildImportRows,
  downloadImportTemplate,
  formatJoined,
  initialsOf,
  isValidEmail,
  parseCsv,
  typeLabel,
  userCode,
} from "./platformUsersData";

const ModalTitle = ({ icon, color = "#25a0e2", children }) => (
  <span className="patient-list-modal__title patient-list-modal__title--simple">
    <i className={icon} style={{ color, fontSize: 15 }} aria-hidden="true" />
    <span className="patient-list-modal__title-text">{children}</span>
  </span>
);

export const StatusPill = ({ status }) => (
  <span className={`pu-pill pu-pill--${status}`}>
    {status === "active" ? "Active" : status === "pending" ? "Pending" : "Inactive"}
  </span>
);

export const VerificationPill = ({ value }) => (
  <span className={`pu-pill pu-pill--v-${value}`}>{VERIFICATION_LABELS[value] || "Not verified"}</span>
);

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
  phone: "",
  roleId: "",
  active: true,
  password: "",
  confirmPassword: "",
};

export const UserFormModal = ({ isOpen, mode, user, roleOptions, busy, error, onClose, onSubmit }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;
    setTouched(false);
    setShowPassword(false);
    if (isEdit && user) {
      const matchedRole =
        roleOptions.find((r) => user.roleId != null && String(r.value) === String(user.roleId)) ||
        roleOptions.find((r) => r.type === user.type);
      setForm({
        ...EMPTY_FORM,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        userName: user.userName || "",
        email: user.email || "",
        phone: user.phone || "",
        roleId: matchedRole ? String(matchedRole.value) : "",
        active: user.status === "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, isEdit, user, roleOptions]);

  const set = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.userName.trim()) errors.userName = "User name is required";
  if (!isValidEmail(form.email)) errors.email = "Enter a valid email";
  if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) errors.phone = "Enter a valid phone number";
  if (!form.roleId) errors.roleId = "Select a user type";
  if (!isEdit || form.password) {
    if (form.password.length < 4) errors.password = "Minimum 4 characters";
    if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords do not match";
  }
  const invalid = Object.keys(errors).length > 0;
  const fieldError = (key) => (touched && errors[key] ? errors[key] : "");

  const submit = () => {
    setTouched(true);
    if (invalid) return;
    const role = roleOptions.find((r) => String(r.value) === String(form.roleId));
    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      userName: form.userName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      roleId: role?.value,
      roleName: role?.label || "",
      type: role?.type || "other",
      active: form.active,
      password: form.password,
    });
  };

  const field = (key, label, props = {}) => (
    <div className="pu-field">
      <label htmlFor={`pu-${key}`}>
        {label}
        {props.optional ? null : <span className="text-danger"> *</span>}
      </label>
      <Input
        id={`pu-${key}`}
        value={form[key]}
        onChange={set(key)}
        invalid={Boolean(fieldError(key))}
        type={props.type || "text"}
        placeholder={props.placeholder}
        autoComplete="off"
      />
      {fieldError(key) ? <div className="invalid-feedback d-block">{fieldError(key)}</div> : null}
    </div>
  );

  return (
    <Modal isOpen={isOpen} centered size="lg" toggle={busy ? undefined : onClose} className="patient-list-modal pu-modal">
      <ModalHeader toggle={busy ? undefined : onClose} className="patient-list-modal__header">
        <ModalTitle icon={isEdit ? "ri-user-settings-line" : "ri-user-add-line"}>
          {isEdit ? "Update user" : "Add user"}
        </ModalTitle>
      </ModalHeader>
      <ModalBody className="pu-modal__body">
        {error ? (
          <div className="pu-alert pu-alert--error">
            <i className="ri-error-warning-line" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
        <p className="pu-modal__section">Personal details</p>
        <div className="pu-form-grid">
          {field("firstName", "First name", { placeholder: "e.g. Aarav" })}
          {field("lastName", "Last name", { placeholder: "e.g. Patil" })}
          {field("email", "Email", { type: "email", placeholder: "name@example.com" })}
          {field("phone", "Phone", { optional: true, placeholder: "10-digit mobile number" })}
        </div>
        <p className="pu-modal__section">Account</p>
        <div className="pu-form-grid">
          {field("userName", "User name", { placeholder: "Login user name" })}
          <div className="pu-field">
            <label htmlFor="pu-roleId">
              User type<span className="text-danger"> *</span>
            </label>
            <Input id="pu-roleId" type="select" value={form.roleId} onChange={set("roleId")} invalid={Boolean(fieldError("roleId"))}>
              <option value="">Select user type</option>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Input>
            {fieldError("roleId") ? <div className="invalid-feedback d-block">{fieldError("roleId")}</div> : null}
          </div>
          <div className="pu-field">
            <label htmlFor="pu-password">
              {isEdit ? "New password" : "Password"}
              {isEdit ? null : <span className="text-danger"> *</span>}
            </label>
            <div className="pu-password">
              <Input
                id="pu-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                invalid={Boolean(fieldError("password"))}
                placeholder={isEdit ? "Leave blank to keep current" : "Minimum 4 characters"}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} aria-hidden="true" />
              </button>
            </div>
            {fieldError("password") ? <div className="invalid-feedback d-block">{fieldError("password")}</div> : null}
          </div>
          {field("confirmPassword", "Confirm password", { type: showPassword ? "text" : "password", optional: isEdit && !form.password })}
        </div>
        <label className="pu-switch">
          <input type="checkbox" checked={form.active} onChange={set("active")} />
          <span className="pu-switch__track" aria-hidden="true" />
          <span>
            <strong>{form.active ? "Active account" : "Inactive account"}</strong>
            <small>{form.active ? "User can sign in immediately." : "User cannot sign in until activated."}</small>
          </span>
        </label>
      </ModalBody>
      <ModalFooter className="pu-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton action={isEdit ? "update" : "save"} loading={busy} onClick={submit}>
          {isEdit ? "Update user" : "Save user"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export const UserViewModal = ({ user, onClose, onEdit, onToggleStatus, onDelete }) => {
  if (!user) return null;
  const details = [
    ["User ID", userCode(user)],
    ["User type", typeLabel(user.type)],
    ["User name", user.userName || "—"],
    ["Email", user.email || "—"],
    ["Phone", user.phone || "—"],
    ["Joined", formatJoined(user.joined)],
  ];
  return (
    <Modal isOpen centered toggle={onClose} className="patient-list-modal pu-modal">
      <ModalHeader toggle={onClose} className="patient-list-modal__header">
        <ModalTitle icon="ri-user-line">User details</ModalTitle>
      </ModalHeader>
      <ModalBody className="pu-modal__body">
        <div className="pu-profile">
          <span className={`pu-avatar pu-avatar--${user.type} pu-avatar--lg`}>{initialsOf(user.name)}</span>
          <div className="pu-profile__main">
            <strong>{user.name}</strong>
            <span>{user.email || user.userName}</span>
          </div>
          <div className="pu-profile__pills">
            <StatusPill status={user.status} />
            <VerificationPill value={user.verification} />
          </div>
        </div>
        <dl className="pu-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd title={value}>{value}</dd>
            </div>
          ))}
        </dl>
      </ModalBody>
      <ModalFooter className="pu-modal__footer pu-modal__footer--split">
        <ModalActionButton action="delete" onClick={() => onDelete(user)} />
        <div className="d-flex gap-2">
          <ModalActionButton
            action="confirm"
            iconClassName={user.status === "active" ? "ri-forbid-line" : "ri-checkbox-circle-line"}
            onClick={() => onToggleStatus(user)}
          >
            {user.status === "active" ? "Deactivate" : "Activate"}
          </ModalActionButton>
          <ModalActionButton action="edit" onClick={() => onEdit(user)} />
        </div>
      </ModalFooter>
    </Modal>
  );
};

const CONFIRM_COPY = {
  delete: {
    title: "Delete user",
    icon: "ri-delete-bin-line",
    color: "#ef4444",
    text: "This removes the account from the platform. The user will no longer be able to sign in.",
    action: "delete",
    label: "Delete user",
  },
  deactivate: {
    title: "Deactivate user",
    icon: "ri-forbid-line",
    color: "#f59e0b",
    text: "The user will be signed out and cannot sign in until the account is activated again.",
    action: "confirm",
    label: "Deactivate",
    confirmIcon: "ri-forbid-line",
  },
  activate: {
    title: "Activate user",
    icon: "ri-checkbox-circle-line",
    color: "#16a34a",
    text: "The user will be able to sign in and use the platform.",
    action: "confirm",
    label: "Activate",
    confirmIcon: "ri-checkbox-circle-line",
  },
};

export const ConfirmUserModal = ({ state, busy, onClose, onConfirm }) => {
  if (!state) return null;
  const copy = CONFIRM_COPY[state.kind];
  const { user } = state;
  return (
    <Modal isOpen centered toggle={busy ? undefined : onClose} className="patient-list-modal pu-modal">
      <ModalHeader toggle={busy ? undefined : onClose} className="patient-list-modal__header">
        <ModalTitle icon={copy.icon} color={copy.color}>{copy.title}</ModalTitle>
      </ModalHeader>
      <ModalBody className="pu-modal__body">
        <div className="pu-confirm-user">
          <span className={`pu-avatar pu-avatar--${user.type}`}>{initialsOf(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{userCode(user)} · {typeLabel(user.type)} · {user.email || user.userName}</span>
          </div>
        </div>
        <p className="pu-modal__text">{copy.text}</p>
      </ModalBody>
      <ModalFooter className="pu-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton action={copy.action} iconClassName={copy.confirmIcon} loading={busy} onClick={onConfirm}>
          {copy.label}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export const ImportUsersModal = ({ isOpen, busy, progress, onClose, onImport }) => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setRows([]);
      setParseError("");
      setDragging(false);
    }
  }, [isOpen]);

  const readFile = (file) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setParseError("Please choose a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const built = buildImportRows(parseCsv(reader.result));
      setFileName(file.name);
      setRows(built);
      setParseError(built.length ? "" : "No user rows found in this file.");
    };
    reader.onerror = () => setParseError("Could not read the file.");
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => !r.errors.length);
  const invalidCount = rows.length - validRows.length;

  return (
    <Modal isOpen={isOpen} centered size="lg" toggle={busy ? undefined : onClose} className="patient-list-modal pu-modal">
      <ModalHeader toggle={busy ? undefined : onClose} className="patient-list-modal__header">
        <ModalTitle icon="ri-upload-2-line">Import users from CSV</ModalTitle>
      </ModalHeader>
      <ModalBody className="pu-modal__body">
        <div
          className={`pu-drop${dragging ? " is-dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            readFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <i className="ri-file-upload-line" aria-hidden="true" />
          <strong>{fileName || "Drop your CSV file here or click to browse"}</strong>
          <span>Columns: First Name, Last Name, User Name, Email, Phone, User Type, Password, Status</span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              readFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <button type="button" className="pu-link-btn" onClick={downloadImportTemplate}>
          <i className="ri-download-2-line" aria-hidden="true" /> Download sample template
        </button>

        {parseError ? (
          <div className="pu-alert pu-alert--error">
            <i className="ri-error-warning-line" aria-hidden="true" />
            <span>{parseError}</span>
          </div>
        ) : null}

        {rows.length ? (
          <>
            <div className="pu-import-summary">
              <span><strong>{rows.length}</strong> rows found</span>
              <span className="is-ok"><i className="ri-checkbox-circle-line" aria-hidden="true" /> {validRows.length} ready</span>
              {invalidCount ? (
                <span className="is-bad"><i className="ri-error-warning-line" aria-hidden="true" /> {invalidCount} with errors (skipped)</span>
              ) : null}
            </div>
            <div className="pu-import-table">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>User type</th>
                    <th>Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className={r.errors.length ? "is-bad" : undefined}>
                      <td>{r.line}</td>
                      <td>{[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>{r.email || "—"}</td>
                      <td>{r.roleName || "—"}</td>
                      <td title={r.errors.join(", ")}>
                        {r.errors.length ? r.errors.join(", ") : <span className="text-success">OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {busy && progress ? (
          <div className="pu-progress">
            <div className="pu-progress__bar">
              <span style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }} />
            </div>
            <small>Importing {progress.done} of {progress.total}…</small>
          </div>
        ) : null}
      </ModalBody>
      <ModalFooter className="pu-modal__footer">
        <ModalActionButton action="cancel" onClick={onClose} disabled={busy} />
        <ModalActionButton action="import" loading={busy} disabled={!validRows.length} onClick={() => onImport(validRows)}>
          {validRows.length ? `Import ${validRows.length} user${validRows.length === 1 ? "" : "s"}` : "Import"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};
