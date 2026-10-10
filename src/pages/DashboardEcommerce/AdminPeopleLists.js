import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Col, Spinner } from "reactstrap";
import moment from "moment";

import { getRoleMaster, getUserList } from "../../helpers/realbackend_helper";
import { listPublicDoctors } from "../../helpers/publicBookingApi";
import "./adminPeopleLists.css";

const PAGE_SIZE = 6;

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

const isActiveStatus = (row) => {
  const status = String(pick(row, "userStatus", "UserStatus", "status", "Status") ?? "").toLowerCase();
  if (status) return !/inactive|block|disable|pending|reject/.test(status);
  return Boolean(row?.isActive ?? row?.IsActive ?? true);
};

const normalizeUser = (row, roleNameById = {}) => {
  const name =
    [pick(row, "firstName", "FirstName"), pick(row, "lastName", "LastName")].filter(Boolean).join(" ") ||
    pick(row, "fullName", "FullName", "userName", "UserName") ||
    "—";
  return {
    id: pick(row, "userId", "UserId", "id"),
    userId: pick(row, "userId", "UserId"),
    name,
    userName: pick(row, "userName", "UserName") || "",
    email: pick(row, "emailId", "EmailId", "email", "Email") || "",
    detail: pick(row, "mobileNo", "MobileNo", "phoneNumber", "PhoneNumber", "city", "City") || "",
    active: isActiveStatus(row),
    status: pick(row, "userStatus", "UserStatus") || "",
    joined: pick(row, "createdDate", "CreatedDate", "createdAt", "CreatedAt"),
    role: String(
      pick(row, "role", "Role", "roleName", "RoleName") || roleNameById[pick(row, "roleId", "RoleId")] || ""
    ).toLowerCase(),
    deleted: Boolean(row?.deleteStatus ?? row?.DeleteStatus),
  };
};

const normalizePublicDoctor = (row, index) => {
  const name = pick(row, "displayName", "DisplayName") || "Doctor";
  return {
    id: pick(row, "doctorId", "DoctorId") || `pub-${index}`,
    name: /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`,
    userName: "",
    email: "",
    detail: [pick(row, "qualification", "Qualification"), pick(row, "city", "City")].filter(Boolean).join(" · "),
    active: Boolean(row?.verified ?? row?.Verified ?? true),
    status: pick(row, "verificationStatus", "VerificationStatus") || "",
    joined: null,
    publicOnly: true,
  };
};

const initialsOf = (name) =>
  String(name || "?")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

const PeopleCard = ({ kind, title, icon, rows, loading, detailLabel }) => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((row) => row.active).length,
      inactive: rows.filter((row) => !row.active).length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "active" && !row.active) return false;
      if (tab === "inactive" && row.active) return false;
      if (!query) return true;
      return [row.name, row.userName, row.email, row.detail].join(" ").toLowerCase().includes(query);
    });
  }, [rows, search, tab]);

  useEffect(() => {
    setPage(1);
  }, [search, tab, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  return (
    <Card className="card-height-100 admin-dash-card apl-card">
      <CardHeader className="align-items-center d-flex admin-dash-card-header apl-card__header">
        <h4 className="card-title mb-0 flex-grow-1 apl-card__title">
          <span className={`apl-card__icon apl-card__icon--${kind}`}>
            <i className={icon} aria-hidden="true" />
          </span>
          {title}
          <span className="apl-count">{rows.length}</span>
        </h4>
        <Link to="/admin/listusers" className="btn btn-sm doctor-dashboard-toolbar-btn flex-shrink-0">
          View all
        </Link>
      </CardHeader>
      <CardBody className="apl-card__body">
        <div className="apl-toolbar">
          <div className="apl-search">
            <i className="ri-search-line" aria-hidden="true" />
            <input
              type="text"
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
            />
          </div>
          <div className="apl-tabs">
            {STATUS_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`apl-tabs__tab${tab === item.id ? " is-active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                <span>{counts[item.id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="apl-table-wrap">
          <table className="table apl-table mb-0">
            <colgroup>
              <col />
              <col className="apl-col-detail" />
              <col className="apl-col-joined" />
              <col className="apl-col-status" />
              <col className="apl-col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>{kind === "doctor" ? "Doctor" : "Patient"}</th>
                <th>{detailLabel}</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    <Spinner size="sm" />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="apl-empty">
                    {search || tab !== "all" ? `No ${title.toLowerCase()} match your filters.` : `No ${title.toLowerCase()} yet.`}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="apl-person">
                        <span className={`apl-avatar apl-avatar--${kind}`} aria-hidden="true">
                          {initialsOf(row.name)}
                        </span>
                        <span className="apl-person__name" title={row.name}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="apl-detail">{row.detail || "—"}</td>
                    <td className="apl-joined">{row.joined ? moment(row.joined).format("DD MMM YYYY") : "—"}</td>
                    <td>
                      <span className={`apl-status ${row.active ? "apl-status--active" : "apl-status--inactive"}`}>
                        {row.status || (row.active ? "Active" : "Inactive")}
                      </span>
                    </td>
                    <td className="text-end">
                      {row.userId ? (
                        <Link to="/admin/edituser" state={{ userId: row.userId, returnTo: "/dashboard", mode: "view" }} className="apl-view-btn" title="View">
                          <i className="ri-eye-line" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="apl-view-btn is-disabled" title="Not linked to a user account">
                          <i className="ri-eye-off-line" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="apl-footer">
          <span>
            {filtered.length
              ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length}`
              : "Showing 0 results"}
          </span>
          <div className="apl-pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <i className="ri-arrow-left-s-line" aria-hidden="true" />
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <i className="ri-arrow-right-s-line" aria-hidden="true" />
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

/** Admin dashboard — doctor and patient lists (from user master, filtered by role). */
const AdminPeopleLists = () => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [usersResult, rolesResult] = await Promise.allSettled([
        getUserList({ queryString: "", PageNumber: 1, PageSize: 500 }),
        getRoleMaster(),
      ]);
      const roleList =
        rolesResult.status === "fulfilled"
          ? rolesResult.value?.resultObject || rolesResult.value?.ResultObject || rolesResult.value?.data || []
          : [];
      const roleNameById = (Array.isArray(roleList) ? roleList : []).reduce((acc, r) => {
        acc[r.roleId ?? r.RoleId] = r.roleName ?? r.RoleName;
        return acc;
      }, {});
      const list =
        usersResult.status === "fulfilled"
          ? usersResult.value?.resultObject || usersResult.value?.ResultObject || usersResult.value?.data || []
          : [];
      const users = (Array.isArray(list) ? list : [])
        .map((row) => normalizeUser(row, roleNameById))
        .filter((row) => !row.deleted);

      let doctorRows = users.filter((row) => row.role === "doctor");
      const patientRows = users.filter((row) => row.role === "patient");

      if (!doctorRows.length) {
        try {
          const response = await listPublicDoctors({ pageNumber: 1, pageSize: 100 });
          doctorRows = (response?.data || []).map(normalizePublicDoctor);
        } catch (_) {
          doctorRows = [];
        }
      }

      if (cancelled) return;
      setDoctors(doctorRows);
      setPatients(patientRows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Col xl={6}>
        <PeopleCard
          kind="doctor"
          title="Doctors"
          icon="ri-stethoscope-line"
          rows={doctors}
          loading={loading}
          detailLabel="Contact"
        />
      </Col>
      <Col xl={6}>
        <PeopleCard
          kind="patient"
          title="Patients"
          icon="ri-user-heart-line"
          rows={patients}
          loading={loading}
          detailLabel="Mobile"
        />
      </Col>
    </>
  );
};

export default AdminPeopleLists;
