import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import moment from "moment";

import { listPharmacyPartners, pharmacyQueue, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";
import SummaryWidgets from "../components/SummaryWidgets";
import PharmacyConfigForm from "../components/PharmacyConfigForm";
import { pharmacyOpenState } from "../pharmacyConfigStore";
import "../components/pharmacyDashboard.css";

const RECENT_LIMIT = 4;

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizePartner = (row) => {
  const id = row?.pharmacyPartnerId ?? row?.PharmacyPartnerId ?? row?.id ?? row?.Id;
  return {
    id: id == null || id === "" ? "" : String(id),
    name: row?.name || row?.Name || "Pharmacy",
    area: row?.area || row?.Area || "",
    status: String(row?.status || row?.Status || "PENDING").toUpperCase(),
  };
};

/** Buckets: new (awaiting acceptance), process (accepted → out for delivery), delivered, closed. */
const orderBucket = (status) => {
  const s = String(status || "").toUpperCase().replace(/[\s-]/g, "_");
  if (/DELIVERED|COMPLETED/.test(s)) return "delivered";
  if (/REJECT|CANCEL|EXPIRE|FAILED/.test(s)) return "closed";
  if (/ACCEPT|QUOTE|PAY|PAID|READY|PACK|DISPATCH|OUT_FOR/.test(s)) return "process";
  return "new";
};

const BUCKET_CHIP = {
  new: { label: "New", tone: "new" },
  process: { label: "In process", tone: "process" },
  delivered: { label: "Delivered", tone: "done" },
  closed: { label: "Closed", tone: "closed" },
};

const normalizeOrder = (row) => {
  const status = String(row?.status || row?.Status || "PLACED").toUpperCase();
  return {
    id: row?.medicineOrderId ?? row?.MedicineOrderId ?? row?.id ?? row?.Id,
    status,
    bucket: orderBucket(status),
    amount: row?.quoteAmount ?? row?.QuoteAmount ?? row?.totalAmount ?? row?.TotalAmount ?? null,
    at: row?.createdAt || row?.CreatedAt || row?.createdDate || row?.CreatedDate || null,
  };
};

const prettyStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const PharmacyDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [notice, setNotice] = useState("");
  const [configError, setConfigError] = useState("");
  const [config, setConfig] = useState(null);

  document.title = "Pharmacy Dashboard | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setOrdersError("");
    const [orderRes, partnerRes] = await Promise.allSettled([pharmacyQueue(), listPharmacyPartners()]);
    if (orderRes.status === "fulfilled") {
      setOrders(asList(unwrapS4(orderRes.value)).map(normalizeOrder));
    } else {
      setOrders([]);
      setOrdersError(s4Message(orderRes.reason));
    }
    const rows =
      partnerRes.status === "fulfilled"
        ? asList(unwrapS4(partnerRes.value)).map(normalizePartner).filter((row) => row.id)
        : [];
    setPartners(rows);
    setPartnerId((prev) => {
      if (rows.some((row) => row.id === prev)) return prev;
      return (rows.find((row) => row.status === "ACTIVE") || rows[0])?.id || "";
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const partner = partners.find((row) => row.id === partnerId) || null;

  useEffect(() => {
    setConfig(null);
  }, [partnerId]);

  const counts = useMemo(() => {
    const result = { new: 0, process: 0, delivered: 0, quotes: 0 };
    orders.forEach((order) => {
      if (result[order.bucket] != null) result[order.bucket] += 1;
      if (/ACCEPT|QUOTE/.test(order.status) && !/QUOTE_ACCEPTED/.test(order.status)) result.quotes += 1;
    });
    return result;
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
        .slice(0, RECENT_LIMIT),
    [orders]
  );

  const status = useMemo(() => {
    if (loading) return null;
    if (ordersError) {
      return { tone: "error", icon: "ri-error-warning-fill", title: "Order service unavailable", text: ordersError };
    }
    if (!partner) {
      return {
        tone: "warn",
        icon: "ri-user-add-fill",
        title: "Onboarding not completed",
        text: "Submit your pharmacy details to start receiving HomeoMeds orders.",
        link: { to: "/pharmacy/onboarding", label: "Complete onboarding" },
      };
    }
    if (partner.status !== "ACTIVE") {
      return {
        tone: "warn",
        icon: "ri-time-fill",
        title: "Awaiting admin activation",
        text: "Orders will be routed to you once an admin activates your pharmacy.",
      };
    }
    if (!config) return null;
    const openState = pharmacyOpenState(config);
    if (!openState) {
      return {
        tone: "warn",
        icon: "ri-settings-3-fill",
        title: "Operating hours not set",
        text: "Set your hours, working days and service areas so orders can be routed to you.",
      };
    }
    if (!openState.open) {
      return {
        tone: "info",
        icon: "ri-moon-clear-fill",
        title: "Closed now",
        text: `Outside your operating hours.${openState.next ? ` Opens ${openState.next}.` : ""}`,
      };
    }
    const capacity = Number(config.capacity) || 0;
    if (capacity && counts.new + counts.process >= capacity) {
      return {
        tone: "warn",
        icon: "ri-error-warning-fill",
        title: "At daily capacity",
        text: `${counts.new + counts.process} open orders for a capacity of ${capacity}. New orders may be routed to other pharmacies.`,
      };
    }
    return {
      tone: "ok",
      icon: "ri-checkbox-circle-fill",
      title: "All systems operational",
      text: "Orders are being processed normally.",
    };
  }, [loading, ordersError, partner, counts, config]);

  const widgetValues = loading
    ? {}
    : {
        orders: ordersError ? null : counts.new + counts.process,
        quotes: ordersError ? null : counts.quotes,
        onboarding: partner ? (partner.status === "ACTIVE" ? "Active" : prettyStatus(partner.status)) : "Not started",
      };

  const tiles = [
    { id: "new", label: "New Orders", value: counts.new, icon: "ri-inbox-archive-line", tone: "blue" },
    { id: "process", label: "In Process", value: counts.process, icon: "ri-loader-2-line", tone: "amber" },
    { id: "delivered", label: "Delivered", value: counts.delivered, icon: "ri-truck-line", tone: "green" },
  ];

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page pharmacy-dashboard-page">
        <Container fluid>
          <SummaryWidgets values={widgetValues} />

          {notice ? (
            <div className="pcs-alert pcs-alert--success">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <span>{notice}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {configError ? (
            <div className="pcs-alert pcs-alert--error">
              <i className="ri-error-warning-line" aria-hidden="true" />
              <span>{configError}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setConfigError("")}>
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <div className="pcs-grid">
            {/* Pharmacy console */}
            <section className="pcs-card">
              <header className="pcs-card__head">
                <span className="pcs-card__title">
                  <i className="ri-dashboard-3-line" aria-hidden="true" />
                  Pharmacy Console
                </span>
                <button type="button" className="pcs-icon-btn" title="Refresh" onClick={load} disabled={loading}>
                  <i className={loading ? "ri-loader-4-line pcs-spin" : "ri-refresh-line"} aria-hidden="true" />
                </button>
              </header>
              <div className="pcs-card__body">
                {status ? (
                  <div className={`pcs-status pcs-status--${status.tone}`}>
                    <i className={status.icon} aria-hidden="true" />
                    <div>
                      <strong>{status.title}</strong>
                      <span>{status.text}</span>
                      {status.link ? (
                        <Link to={status.link.to} className="pcs-status__link">
                          {status.link.label}
                          <i className="ri-arrow-right-line" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="pcs-status pcs-status--loading">
                    <Spinner size="sm" />
                    <span>Checking status…</span>
                  </div>
                )}

                <div className="pcs-tiles">
                  {tiles.map((tile) => (
                    <Link key={tile.id} to="/pharmacy/orders" className={`pcs-tile pcs-tile--${tile.tone}`}>
                      <span className="pcs-tile__label">
                        <i className={tile.icon} aria-hidden="true" />
                        {tile.label}
                      </span>
                      <strong>{loading || ordersError ? "—" : tile.value}</strong>
                    </Link>
                  ))}
                </div>

                <div className="pcs-recent">
                  <div className="pcs-recent__head">
                    <span>Recent orders</span>
                    <Link to="/pharmacy/orders">
                      View all
                      <i className="ri-arrow-right-s-line" aria-hidden="true" />
                    </Link>
                  </div>
                  {loading ? (
                    <div className="pcs-recent__empty">
                      <Spinner size="sm" />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="pcs-recent__empty">
                      <i className="ri-shopping-bag-3-line" aria-hidden="true" />
                      <span>{ordersError ? "Orders could not be loaded." : "No medicine orders yet."}</span>
                    </div>
                  ) : (
                    <ul className="pcs-recent__list">
                      {recentOrders.map((order) => {
                        const chip = BUCKET_CHIP[order.bucket];
                        return (
                          <li key={order.id}>
                            <span className="pcs-recent__icon">
                              <i className="ri-capsule-line" aria-hidden="true" />
                            </span>
                            <div className="pcs-recent__main">
                              <strong>Order #{order.id}</strong>
                              <span>
                                {prettyStatus(order.status)}
                                {order.at ? ` · ${moment(order.at).fromNow()}` : ""}
                              </span>
                            </div>
                            {order.amount != null && order.amount !== "" ? (
                              <span className="pcs-recent__amount">₹{Number(order.amount).toLocaleString("en-IN")}</span>
                            ) : null}
                            <span className={`pcs-chip pcs-chip--${chip.tone}`}>{chip.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* Operating hours & service area */}
            <section className="pcs-card">
              <header className="pcs-card__head">
                <span className="pcs-card__title">
                  <i className="ri-time-line" aria-hidden="true" />
                  Operating Hours &amp; Service Area
                </span>
                {partners.length > 1 ? (
                  <select
                    className="pcs-select"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    aria-label="Select pharmacy"
                  >
                    {partners.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </header>
              <div className="pcs-card__body">
                {loading ? (
                  <div className="pcs-recent__empty">
                    <Spinner size="sm" />
                  </div>
                ) : !partner ? (
                  <div className="pcs-recent__empty">
                    <i className="ri-store-2-line" aria-hidden="true" />
                    <span>
                      Complete <Link to="/pharmacy/onboarding">pharmacy onboarding</Link> to set operating hours and service
                      areas.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="pcs-partner">
                      <span className="pcs-partner__avatar">
                        <i className="ri-store-2-line" aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{partner.name}</strong>
                        <span>{`Partner #${partner.id}${partner.area ? ` · ${partner.area}` : ""}`}</span>
                      </div>
                      <span className={`pcs-chip ${partner.status === "ACTIVE" ? "pcs-chip--done" : "pcs-chip--process"}`}>
                        {partner.status === "ACTIVE" ? "Active" : prettyStatus(partner.status)}
                      </span>
                    </div>
                    <PharmacyConfigForm
                      partner={partner}
                      onLoaded={setConfig}
                      onSaved={(next) => {
                        setConfigError("");
                        setNotice("Operating hours and service areas saved.");
                        setConfig(next);
                      }}
                      onError={setConfigError}
                    />
                  </>
                )}
              </div>
            </section>
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PharmacyDashboard;
