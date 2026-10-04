import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Spinner } from "reactstrap";

import {
  activatePharmacy,
  listPharmacyPartners,
  s4Message,
  sweepPharmacyLicences,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import PharmacyConfigForm from "../../Pharmacy/components/PharmacyConfigForm";
import "./pharmacyConfig.css";

const SAMPLE_PARTNERS = [
  { id: "sample-1", name: "HomeoCare Pharmacy", area: "Mumbai", status: "ACTIVE" },
  { id: "sample-2", name: "Wellness Homeo Store", area: "Thane", status: "ACTIVE" },
  { id: "sample-3", name: "Sai Homeopathic Medicals", area: "Navi Mumbai", status: "PENDING" },
  { id: "sample-4", name: "Pune Homeo Hub", area: "Pune", status: "PENDING" },
].map((row) => ({ ...row, sample: true }));

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
];

const normalizePartner = (row) => {
  const id = row?.pharmacyPartnerId ?? row?.PharmacyPartnerId ?? row?.id ?? row?.Id;
  return {
    id: id == null || id === "" ? "" : String(id),
    name: row?.name || row?.Name || "Pharmacy",
    area: row?.area || row?.Area || "",
    status: String(row?.status || row?.Status || "PENDING").toUpperCase(),
  };
};

const initialsOf = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

/** MED-05 — admin pharmacy partners: activation, licence sweep and per-partner configuration. */
const AdminPharmacyPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selectedId, setSelectedId] = useState("");

  document.title = "Pharmacy partners | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    let rows = [];
    try {
      const data = unwrapS4(await listPharmacyPartners());
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      rows = list.map(normalizePartner).filter((row) => row.id);
    } catch (err) {
      setError(s4Message(err));
    }
    const next = rows.length ? rows : SAMPLE_PARTNERS;
    setPartners(next);
    setIsSample(!rows.length);
    setSelectedId((prev) => (next.some((row) => row.id === prev) ? prev : next[0]?.id || ""));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = partners.find((row) => row.id === selectedId) || null;

  const counts = useMemo(
    () => ({
      all: partners.length,
      active: partners.filter((row) => row.status === "ACTIVE").length,
      pending: partners.filter((row) => row.status !== "ACTIVE").length,
    }),
    [partners]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return partners.filter((row) => {
      if (tab === "active" && row.status !== "ACTIVE") return false;
      if (tab === "pending" && row.status === "ACTIVE") return false;
      if (!query) return true;
      return [row.id, row.name, row.area].join(" ").toLowerCase().includes(query);
    });
  }, [partners, search, tab]);

  const sweep = async () => {
    setBusyId("sweep");
    setError("");
    try {
      await sweepPharmacyLicences();
      setNotice("Expired licences swept. Those pharmacies are excluded from seller routing.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const activate = async (partner) => {
    setBusyId(`act-${partner.id}`);
    setError("");
    try {
      if (!partner.sample) await activatePharmacy(partner.id);
      setPartners((prev) => prev.map((row) => (row.id === partner.id ? { ...row, status: "ACTIVE" } : row)));
      setNotice(`${partner.name} activated.`);
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="phc-page">
          <div className="phc-page__head">
            <div>
              <h2 className="clinic-page-title mb-1">Pharmacy partners &amp; configuration</h2>
              <p className="clinic-page-subtitle mb-0">
                Activate HomeoMeds partners and configure their operating hours, service areas and delivery charges.
              </p>
            </div>
            <div className="phc-page__actions">
              <button type="button" className="phc-btn phc-btn--warn" onClick={sweep} disabled={busyId === "sweep"}>
                <i className={busyId === "sweep" ? "ri-loader-4-line phc-spin" : "ri-shield-flash-line"} aria-hidden="true" />
                Sweep licences
              </button>
              <button type="button" className="phc-btn phc-btn--soft" onClick={load} disabled={loading}>
                <i className={loading ? "ri-loader-4-line phc-spin" : "ri-refresh-line"} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="phc-alert phc-alert--error">
              <i className="ri-error-warning-line" aria-hidden="true" />
              <span>{error}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setError("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="phc-alert phc-alert--success">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="phc-grid">
            {/* Partners */}
            <section className="phc-card">
              <header className="phc-card__head">
                <span className="phc-card__title">
                  <i className="ri-store-3-line" aria-hidden="true" />
                  Pharmacy Partners
                  {isSample ? <span className="phc-sample">Sample data</span> : null}
                </span>
                <span className="phc-card__meta">{partners.length} partners</span>
              </header>
              <div className="phc-card__body">
                <div className="phc-toolbar">
                  <div className="phc-search">
                    <i className="ri-search-line" aria-hidden="true" />
                    <input
                      type="text"
                      className="form-control"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search pharmacy or area"
                    />
                  </div>
                  <div className="phc-tabs">
                    {STATUS_TABS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`phc-tabs__tab${tab === item.id ? " is-active" : ""}`}
                        onClick={() => setTab(item.id)}
                      >
                        {item.label}
                        <span>{counts[item.id]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <table className="table phc-table mb-0">
                  <colgroup>
                    <col />
                    <col className="phc-col-area" />
                    <col className="phc-col-status" />
                    <col className="phc-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Pharmacy</th>
                      <th>Area</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="phc-empty">
                          <Spinner size="sm" />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="phc-empty">
                          No pharmacies match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((partner) => {
                        const active = partner.status === "ACTIVE";
                        return (
                          <tr
                            key={partner.id}
                            className={partner.id === selectedId ? "is-selected" : undefined}
                            onClick={() => setSelectedId(partner.id)}
                          >
                            <td>
                              <div className="phc-person">
                                <span className="phc-avatar">{initialsOf(partner.name)}</span>
                                <span className="phc-person__name" title={partner.name}>
                                  {partner.name}
                                </span>
                              </div>
                            </td>
                            <td title={partner.area}>{partner.area || "—"}</td>
                            <td>
                              <span className={`phc-chip ${active ? "phc-chip--active" : "phc-chip--pending"}`}>
                                {active ? "Active" : partner.status.charAt(0) + partner.status.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td>
                              <div className="phc-actions">
                                {!active ? (
                                  <button
                                    type="button"
                                    className="phc-icon-btn phc-icon-btn--approve"
                                    title="Activate"
                                    disabled={busyId === `act-${partner.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      activate(partner);
                                    }}
                                  >
                                    <i className="ri-check-line" aria-hidden="true" />
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className={`phc-icon-btn${partner.id === selectedId ? " is-active" : ""}`}
                                  title="Configure"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(partner.id);
                                  }}
                                >
                                  <i className="ri-settings-3-line" aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Configuration */}
            <section className="phc-card">
              <header className="phc-card__head">
                <span className="phc-card__title">
                  <i className="ri-settings-3-line" aria-hidden="true" />
                  Pharmacy Configuration
                </span>
              </header>
              {!selected ? (
                <div className="phc-card__body">
                  <div className="phc-empty-state">
                    <i className="ri-store-2-line" aria-hidden="true" />
                    <span>Select a pharmacy to configure it.</span>
                  </div>
                </div>
              ) : (
                <div className="phc-card__body">
                  <div className="phc-selected">
                    <span className="phc-avatar phc-avatar--lg">{initialsOf(selected.name)}</span>
                    <div>
                      <strong>{selected.name}</strong>
                      <span>
                        {selected.sample ? "Sample partner" : `Partner #${selected.id}`}
                        {selected.area ? ` · ${selected.area}` : ""}
                      </span>
                    </div>
                    <span
                      className={`phc-chip ${selected.status === "ACTIVE" ? "phc-chip--active" : "phc-chip--pending"}`}
                    >
                      {selected.status === "ACTIVE" ? "Active" : "Pending"}
                    </span>
                  </div>

                  <PharmacyConfigForm
                    partner={selected}
                    onSaved={() => setNotice(`Configuration saved for ${selected.name}.`)}
                    onError={setError}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default AdminPharmacyPartnersPage;
