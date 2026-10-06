import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
  UncontrolledDropdown,
} from "reactstrap";
import moment from "moment";
import {
  createUser,
  getRoleMaster,
  getUserById,
  getUserList,
  updateUser,
} from "../../../helpers/realbackend_helper";
import {
  ConfirmUserModal,
  ImportUsersModal,
  StatusPill,
  UserFormModal,
  UserViewModal,
  VerificationPill,
} from "./PlatformUserModals";
import {
  STATUS_OPTIONS,
  USER_TYPES,
  VERIFICATION_LABELS,
  downloadCsv,
  downloadImportTemplate,
  formatJoined,
  initialsOf,
  normalizeApiUser,
  typeFromRoleName,
  typeLabel,
  userCode,
} from "./platformUsersData";
import "./platformUsers.css";

const PAGE_SIZE = 8;

const unwrap = (response) => response?.resultObject ?? response?.ResultObject ?? response?.data ?? response;

const currentUserName = () => {
  try {
    const auth = JSON.parse(sessionStorage.getItem("authUser") || "null");
    return auth?.userName || auth?.data?.userName || "Admin";
  } catch {
    return "Admin";
  }
};

const pageNumbers = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
};

/** Admin → Platform users: list, filter, import/export and manage every login on the platform. */
const PlatformUsersPage = () => {
  document.title = "Platform Users | Niga Homeocentrum";

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [typeTab, setTypeTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState(null);
  const [formError, setFormError] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [usersResult, rolesResult] = await Promise.allSettled([
      getUserList({ queryString: "", PageNumber: 1, PageSize: 1000 }),
      getRoleMaster(),
    ]);
    const roleList = rolesResult.status === "fulfilled" ? unwrap(rolesResult.value) : [];
    const activeRoles = (Array.isArray(roleList) ? roleList : []).filter((r) => !(r.deleteStatus ?? r.DeleteStatus));
    setRoles(activeRoles);
    const roleNameById = activeRoles.reduce((acc, r) => {
      acc[r.roleId ?? r.RoleId] = r.roleName ?? r.RoleName;
      return acc;
    }, {});

    const list = usersResult.status === "fulfilled" ? unwrap(usersResult.value) : null;
    const apiUsers = (Array.isArray(list) ? list : [])
      .filter((row) => !(row.deleteStatus ?? row.DeleteStatus))
      .map((row) => normalizeApiUser(row, roleNameById));

    setUsers(apiUsers);
    if (usersResult.status === "rejected") {
      const reason = usersResult.reason;
      setError(typeof reason === "string" ? reason : reason?.message || "Could not load users.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [typeTab, statusFilter, search]);

  const roleOptions = useMemo(() => {
    if (roles.length) {
      return roles.map((r) => {
        const label = r.roleName ?? r.RoleName;
        return { value: r.roleId ?? r.RoleId, label, type: typeFromRoleName(label) };
      });
    }
    return USER_TYPES.map((t) => ({ value: t.label, label: t.label, type: t.id }));
  }, [roles]);

  const typeCounts = useMemo(() => {
    const counts = { all: users.length };
    USER_TYPES.forEach((t) => {
      counts[t.id] = users.filter((u) => u.type === t.id).length;
    });
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      if (typeTab !== "all" && u.type !== typeTab) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!query) return true;
      return [u.name, u.email, u.phone, u.userName, userCode(u)].join(" ").toLowerCase().includes(query);
    });
  }, [users, typeTab, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const flash = (message) => {
    setNotice(message);
    setError("");
  };

  const fetchExistingUser = async (user) => {
    const existing = unwrap(await getUserById(user.userId));
    return existing && typeof existing === "object" ? existing : {};
  };

  const saveApiUser = async (user, changes) => {
    const existing = await fetchExistingUser(user);
    const payload = {
      ...existing,
      userId: user.userId,
      userName: changes.userName ?? existing.userName ?? user.userName,
      userPassword: changes.password || existing.userPassword,
      userStatus: changes.active ?? (existing.userStatus ?? user.status === "active"),
      emailId: changes.email ?? existing.emailId ?? user.email,
      enteredBy: existing.enteredBy || currentUserName(),
      deleteStatus: changes.deleteStatus ?? false,
      firstName: changes.firstName ?? existing.firstName ?? user.firstName,
      lastName: changes.lastName ?? existing.lastName ?? user.lastName,
      roleId: changes.roleId ?? existing.roleId ?? user.roleId,
      mobileNo: changes.phone ?? existing.mobileNo ?? user.phone,
    };
    await updateUser(payload);
  };

  const createApiUser = (values) =>
    createUser({
      userId: 0,
      userName: values.userName,
      userPassword: values.password,
      userStatus: values.active,
      emailId: values.email,
      enteredBy: currentUserName(),
      deleteStatus: false,
      firstName: values.firstName,
      lastName: values.lastName,
      roleId: values.roleId,
      mobileNo: values.phone,
    });

  const handleFormSubmit = async (values) => {
    setFormError("");
    const isEdit = formState?.mode === "edit";
    if (!Number.isFinite(Number(values.roleId))) {
      setFormError("User types could not be loaded from the server. Refresh and try again.");
      return;
    }
    setBusy(true);
    try {
      if (isEdit) {
        await saveApiUser(formState.user, { ...values, roleId: Number(values.roleId) });
        await load();
      } else {
        await createApiUser({ ...values, roleId: Number(values.roleId) });
        await load();
      }
      setFormState(null);
      flash(isEdit ? `${values.firstName} ${values.lastName} was updated.` : `${values.firstName} ${values.lastName} was added.`);
    } catch (e) {
      setFormError(e?.message || "Could not save the user. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmState) return;
    const { kind, user } = confirmState;
    setBusy(true);
    try {
      await saveApiUser(
        user,
        kind === "delete" ? { deleteStatus: true } : { active: kind === "activate" }
      );
      await load();
      setConfirmState(null);
      setViewUser(null);
      flash(
        kind === "delete"
          ? `${user.name} was deleted.`
          : `${user.name} was ${kind === "activate" ? "activated" : "deactivated"}.`
      );
    } catch (e) {
      setConfirmState(null);
      setError(e?.message || "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (rows) => {
    setBusy(true);
    setImportProgress({ done: 0, total: rows.length });
    let added = 0;
    const failed = [];
    for (const row of rows) {
      const role =
        roleOptions.find((r) => String(r.label).toLowerCase() === row.roleName.toLowerCase()) ||
        roleOptions.find((r) => r.type === row.type);
      const values = {
        firstName: row.firstName,
        lastName: row.lastName,
        userName: row.userName,
        email: row.email,
        phone: row.phone,
        roleId: role?.value,
        roleName: role?.label || row.roleName,
        type: row.type,
        active: row.status === "active",
        password: row.password || "Welcome@123",
      };
      try {
        if (!Number.isFinite(Number(values.roleId))) throw new Error("Unknown user type");
        await createApiUser({ ...values, roleId: Number(values.roleId) });
        added += 1;
      } catch (e) {
        failed.push(`Row ${row.line}`);
      }
      setImportProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    await load();
    setBusy(false);
    setImportProgress(null);
    setImportOpen(false);
    if (failed.length) {
      setError(`Imported ${added} user${added === 1 ? "" : "s"}. Failed: ${failed.join(", ")}.`);
      setNotice("");
    } else {
      flash(`Imported ${added} user${added === 1 ? "" : "s"} successfully.`);
    }
  };

  const handleExport = () => {
    downloadCsv(`platform-users-${moment().format("YYYYMMDD-HHmm")}.csv`, [
      ["ID", "Name", "User Type", "User Name", "Email", "Phone", "Status", "Verification", "Joined"],
      ...filtered.map((u) => [
        userCode(u),
        u.name,
        typeLabel(u.type),
        u.userName,
        u.email,
        u.phone,
        STATUS_OPTIONS.find((s) => s.id === u.status)?.label || u.status,
        VERIFICATION_LABELS[u.verification] || "",
        formatJoined(u.joined),
      ]),
    ]);
  };

  const resetFilters = () => {
    setTypeTab("all");
    setStatusFilter("all");
    setSearch("");
  };

  const openEdit = (user) => {
    setViewUser(null);
    setFormError("");
    setFormState({ mode: "edit", user });
  };

  const openStatusConfirm = (user) =>
    setConfirmState({ kind: user.status === "active" ? "deactivate" : "activate", user });

  const tabs = [{ id: "all", label: "All Users" }, ...USER_TYPES.map((t) => ({ id: t.id, label: t.tab }))];

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="pu-page">
          <div className="pu-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">
                Platform Users
              </h2>
              <p className="clinic-page-subtitle mb-0">Manage all users, import/export and account activation</p>
            </div>
            <div className="pu-page__actions">
              <button type="button" className="pu-btn pu-btn--soft" onClick={() => setImportOpen(true)}>
                <i className="ri-upload-2-line" aria-hidden="true" /> Import CSV
              </button>
              <button type="button" className="pu-btn pu-btn--soft" onClick={handleExport} disabled={!filtered.length}>
                <i className="ri-download-2-line" aria-hidden="true" /> Export CSV
              </button>
              <button
                type="button"
                className="pu-btn pu-btn--primary"
                onClick={() => {
                  setFormError("");
                  setFormState({ mode: "add", user: null });
                }}
              >
                <i className="ri-add-line" aria-hidden="true" /> Add User
              </button>
            </div>
          </div>

          {error ? (
            <div className="pu-alert pu-alert--error">
              <i className="ri-error-warning-line" aria-hidden="true" />
              <span>{error}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="pu-alert pu-alert--success">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="pu-card">
            <div className="pu-tabs" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={typeTab === t.id}
                  className={`pu-tab${typeTab === t.id ? " is-active" : ""}`}
                  onClick={() => setTypeTab(t.id)}
                >
                  {t.label}
                  <span>{typeCounts[t.id] ?? 0}</span>
                </button>
              ))}
            </div>

            <div className="pu-filters">
              <div className="pu-search">
                <i className="ri-search-line" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  aria-label="Search users"
                />
              </div>
              <div className="pu-select">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
                  <option value="all">All Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line" aria-hidden="true" />
              </div>
              <div className="pu-select">
                <select value={typeTab} onChange={(e) => setTypeTab(e.target.value)} aria-label="User type">
                  <option value="all">All User Types</option>
                  {USER_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line" aria-hidden="true" />
              </div>
              <UncontrolledDropdown className="pu-more">
                <DropdownToggle tag="button" type="button" className="pu-icon-btn" aria-label="More options">
                  <i className="ri-more-2-fill" aria-hidden="true" />
                </DropdownToggle>
                <DropdownMenu end className="pu-action-menu">
                  <DropdownItem onClick={load}>
                    <i className="ri-refresh-line" aria-hidden="true" /> Refresh list
                  </DropdownItem>
                  <DropdownItem onClick={resetFilters}>
                    <i className="ri-filter-off-line" aria-hidden="true" /> Reset filters
                  </DropdownItem>
                  <DropdownItem onClick={downloadImportTemplate}>
                    <i className="ri-file-download-line" aria-hidden="true" /> Download import template
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>

            <div className="pu-table-wrap">
              <table className="pu-table">
                <colgroup>
                  <col className="pu-col-id" />
                  <col className="pu-col-name" />
                  <col className="pu-col-type" />
                  <col className="pu-col-email" />
                  <col className="pu-col-phone" />
                  <col className="pu-col-status" />
                  <col className="pu-col-verify" />
                  <col className="pu-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>User Type</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="pu-table__state">
                        <Spinner size="sm" className="me-2" /> Loading users…
                      </td>
                    </tr>
                  ) : pageRows.length ? (
                    pageRows.map((u) => (
                      <tr key={u.id}>
                        <td className="pu-code">{userCode(u)}</td>
                        <td>
                          <button type="button" className="pu-person" onClick={() => setViewUser(u)} title={u.name}>
                            <span className={`pu-avatar pu-avatar--${u.type}`}>{initialsOf(u.name)}</span>
                            <span className="pu-person__name">{u.name}</span>
                          </button>
                        </td>
                        <td>{typeLabel(u.type)}</td>
                        <td title={u.email}>{u.email || "—"}</td>
                        <td>{u.phone || "—"}</td>
                        <td><StatusPill status={u.status} /></td>
                        <td><VerificationPill value={u.verification} /></td>
                        <td className="pu-action-cell">
                          <UncontrolledDropdown>
                            <DropdownToggle tag="button" type="button" className="pu-kebab" aria-label={`Actions for ${u.name}`}>
                              <i className="ri-more-2-fill" aria-hidden="true" />
                            </DropdownToggle>
                            <DropdownMenu end container="body" className="pu-action-menu">
                              <DropdownItem onClick={() => setViewUser(u)}>
                                <i className="ri-eye-line" aria-hidden="true" /> View details
                              </DropdownItem>
                              <DropdownItem onClick={() => openEdit(u)}>
                                <i className="ri-pencil-line" aria-hidden="true" /> Edit user
                              </DropdownItem>
                              <DropdownItem onClick={() => openStatusConfirm(u)}>
                                <i className={u.status === "active" ? "ri-forbid-line" : "ri-checkbox-circle-line"} aria-hidden="true" />
                                {u.status === "active" ? " Deactivate" : " Activate"}
                              </DropdownItem>
                              <DropdownItem divider />
                              <DropdownItem className="is-danger" onClick={() => setConfirmState({ kind: "delete", user: u })}>
                                <i className="ri-delete-bin-line" aria-hidden="true" /> Delete user
                              </DropdownItem>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="pu-table__state">
                        <i className="ri-user-search-line" aria-hidden="true" /> No users match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pu-footer">
              <span>
                {filtered.length
                  ? `Showing ${startIndex + 1} to ${Math.min(startIndex + PAGE_SIZE, filtered.length)} of ${filtered.length.toLocaleString("en-IN")} users`
                  : "Showing 0 users"}
              </span>
              <div className="pu-pager">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                  <i className="ri-arrow-left-s-line" aria-hidden="true" />
                </button>
                {pageNumbers(safePage, totalPages).map((p, index) =>
                  p === "…" ? (
                    <span key={`gap-${index}`} className="pu-pager__gap">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={p === safePage ? "is-active" : undefined}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                  <i className="ri-arrow-right-s-line" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <UserFormModal
          isOpen={Boolean(formState)}
          mode={formState?.mode}
          user={formState?.user}
          roleOptions={roleOptions}
          busy={busy}
          error={formError}
          onClose={() => setFormState(null)}
          onSubmit={handleFormSubmit}
        />
        <UserViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={openEdit}
          onToggleStatus={(u) => {
            setViewUser(null);
            openStatusConfirm(u);
          }}
          onDelete={(u) => {
            setViewUser(null);
            setConfirmState({ kind: "delete", user: u });
          }}
        />
        <ConfirmUserModal
          state={confirmState}
          busy={busy}
          onClose={() => setConfirmState(null)}
          onConfirm={handleConfirm}
        />
        <ImportUsersModal
          isOpen={importOpen}
          busy={busy}
          progress={importProgress}
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
        />
      </Container>
    </div>
  );
};

export default PlatformUsersPage;
