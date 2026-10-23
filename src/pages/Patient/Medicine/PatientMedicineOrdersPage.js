import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Container, Input, Spinner } from "reactstrap";
import Swal from "sweetalert2";

import {
  acceptMedicineQuote,
  createMedicineOrder,
  createMedicinePayment,
  grantMedicineConsent,
  listErxRefills,
  medicineTracking,
  patientPayments,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { patientMedicineHistory, reviewMedicineOrder } from "../../../helpers/s5Week5Api";
import OrderDetailsModal from "./OrderDetailsModal";
import OrderMedicinesModal from "./OrderMedicinesModal";
import {
  formatDate,
  formatINR,
  isOrderOpen,
  normalizeOrder,
  orderStage,
  pick,
} from "./medicineOrderData";
import "../Prescriptions/patientPrescriptions.css";
import "./patientMedicine.css";

const refillStatusOf = (row) => String(pick(row, "status", "Status") || "").toUpperCase();

const refillTitle = (row) => {
  const first = pick(row, "firstRemedyName", "FirstRemedyName");
  const count = Number(pick(row, "itemCount", "ItemCount") || 0);
  if (first) {
    return count > 1 ? `${first} + ${count - 1} more` : first;
  }
  const erxId = pick(row, "erxSnapshotId", "ErxSnapshotId");
  return erxId ? `Prescription #${erxId}` : "Approved refill";
};

const refillSubtitle = (row) => {
  const doctor = pick(row, "doctorName", "DoctorName") || "Your doctor";
  const signed = pick(row, "signedAt", "SignedAt") || pick(row, "decidedAt", "DecidedAt") || pick(row, "createdAt", "CreatedAt");
  const erxId = pick(row, "erxSnapshotId", "ErxSnapshotId");
  return [doctor, erxId ? `eRx #${erxId}` : null, signed ? formatDate(signed) : null].filter(Boolean).join(" · ");
};

const toRefillPrescription = (row) => {
  const erxId = Number(pick(row, "erxSnapshotId", "ErxSnapshotId"));
  const first = pick(row, "firstRemedyName", "FirstRemedyName");
  return {
    erxId,
    erxNo: erxId ? `eRx #${erxId}` : "Prescription",
    doctorName: pick(row, "doctorName", "DoctorName") || "Doctor",
    date: pick(row, "signedAt", "SignedAt") || pick(row, "createdAt", "CreatedAt"),
    remedies: first
      ? [{ name: first, potency: "", dose: "", frequency: "", duration: "", instructions: "" }]
      : [],
  };
};

const asList = (payload) => {
  const data = unwrapS4(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
};

const ORDER_TABS = [
  { id: "all", label: "All" },
  { id: "processing", label: "Processing" },
  { id: "delivered", label: "Delivered" },
];

const HOW_IT_WORKS = [
  { icon: "ri-file-list-3-line", title: "Order from eRx", text: "Pick a signed prescription and a pharmacy." },
  { icon: "ri-refresh-line", title: "Refills", text: "Request refill → doctor approves → Start order here." },
  { icon: "ri-price-tag-3-line", title: "Get a quote", text: "The pharmacy confirms stock and price." },
  { icon: "ri-wallet-3-line", title: "Accept & pay", text: "Pay online or choose cash on delivery." },
  { icon: "ri-truck-line", title: "Track delivery", text: "Follow your order until it arrives." },
];

const ACTION_LABEL = { accept: "Accept Quote", pay: "Pay Now" };

/**
 * MED-16.02 — patient orders list; MED-14.02 order details (quote, payment, tracking, reorder, review).
 */
const PatientMedicineOrdersPage = () => {
  document.title = "My Orders | Niga Homeocentrum";
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingRefills, setPendingRefills] = useState([]);
  const [approvedRefills, setApprovedRefills] = useState([]);
  const [refillOrderFor, setRefillOrderFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [ordersResult, paymentsResult, refillResult] = await Promise.allSettled([
      patientMedicineHistory(),
      patientPayments(),
      listErxRefills(),
    ]);
    setOrders(
      ordersResult.status === "fulfilled"
        ? asList(ordersResult.value).map(normalizeOrder).filter((row) => row.id != null)
        : []
    );
    if (ordersResult.status === "rejected") setError(s4Message(ordersResult.reason));
    setPayments(paymentsResult.status === "fulfilled" ? asList(paymentsResult.value) : []);
    const refills = refillResult.status === "fulfilled" ? asList(refillResult.value) : [];
    setPendingRefills(refills.filter((row) => refillStatusOf(row) === "PENDING"));
    setApprovedRefills(refills.filter((row) => refillStatusOf(row) === "APPROVED"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      processing: orders.filter(isOrderOpen).length,
      delivered: orders.filter((row) => orderStage(row.status).key === "delivered").length,
    }),
    [orders]
  );

  const totalSpent = useMemo(
    () =>
      orders
        .filter((row) => orderStage(row.status).step >= 1)
        .reduce((sum, row) => sum + (row.amount || 0), 0),
    [orders]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((row) => {
        if (tab === "processing" && !isOrderOpen(row)) return false;
        if (tab === "delivered" && orderStage(row.status).key !== "delivered") return false;
        if (!query) return true;
        return [row.orderNo, row.pharmacy, row.doctorName, ...row.items.map((item) => item.name)]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [orders, tab, search]);

  const activeOrder = orders.find((row) => row.id === activeId) || null;

  const updateLocal = (order, changes) => {
    setOrders((prev) => prev.map((row) => (row.id === order.id ? { ...row, ...changes } : row)));
  };

  const runAction = async (task) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (err) {
      setError(s4Message(err));
      setActiveId(null);
    } finally {
      setBusy(false);
    }
  };

  const onAcceptQuote = (order) =>
    runAction(async () => {
      await acceptMedicineQuote(order.id);
      await load();
    });

  const onPay = (order, payMode) =>
    runAction(async () => {
      const response = unwrapS4(await createMedicinePayment({ medicineOrderId: order.id, payMode }));
      const payUrl = pick(response, "paymentUrl", "PaymentUrl", "checkoutUrl", "CheckoutUrl", "url", "Url");
      if (payUrl) window.open(payUrl, "_blank", "noopener");
      await load();
      Swal.fire({
        title: payMode === "COD" ? "Cash on delivery confirmed" : "Payment started",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    });

  const onTrack = (order) =>
    runAction(async () => {
      const data = unwrapS4(await medicineTracking(order.id)) || {};
      const status = pick(data, "status", "Status");
      const events = pick(data, "events", "Events");
      updateLocal(order, {
        status: status || order.status,
        events: Array.isArray(events)
          ? events.map((row) => ({ status: pick(row, "status", "Status") || "", detail: pick(row, "detail", "Detail") || "", at: pick(row, "at", "At") }))
          : order.events,
      });
    });

  const onStartRefill = (row) => {
    const id = Number(pick(row, "refillRequestId", "RefillRequestId", "id", "Id"));
    if (!id) return;
    setRefillOrderFor({ refillId: id, prescription: toRefillPrescription(row) });
  };

  const onRefillOrderPlaced = async (order) => {
    setRefillOrderFor(null);
    await load();
    Swal.fire({
      title: "Refill order started",
      text: `${order?.orderNo ? `Order ${order.orderNo} created. ` : ""}The pharmacy will send a quote.`,
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const onReorder = (order) =>
    runAction(async () => {
      if (!order.erxId) throw new Error("This order has no prescription to reorder from.");
      const created = unwrapS4(await createMedicineOrder({ erxSnapshotId: order.erxId }));
      const orderId = created?.medicineOrderId || created?.MedicineOrderId;
      if (orderId) await grantMedicineConsent(orderId);
      setActiveId(null);
      await load();
      Swal.fire({ title: "Reorder placed", text: "The pharmacy will send a new quote.", icon: "success", timer: 1800, showConfirmButton: false });
    });

  const onReview = (order, rating, comment) =>
    runAction(async () => {
      const saved = unwrapS4(await reviewMedicineOrder(order.id, rating, comment || null)) || {};
      updateLocal(order, {
        review: { rating, comment: comment || "", createdAt: pick(saved, "createdAt", "CreatedAt") || new Date().toISOString() },
      });
      Swal.fire({ title: "Review added", icon: "success", timer: 1300, showConfirmButton: false });
    });

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page prx-page">
      <Container fluid>
        <div className="prx-page__header">
          <div>
            <h2 className="clinic-page-title">My Orders</h2>
            <p className="clinic-page-subtitle">Medicines ordered from your signed prescriptions. You pay only after you accept a quote.</p>
          </div>
          <button type="button" className="prx-btn prx-btn--primary med-header-btn" onClick={() => navigate("/patient/prescriptions")}>
            <i className="ri-add-line" aria-hidden="true" />
            Order from prescription
          </button>
        </div>

        {error ? <Alert color="danger">{error}</Alert> : null}

        {pendingRefills.length ? (
          <div className="med-refill-banner med-refill-banner--pending">
            <div className="med-refill-banner__head">
              <i className="ri-time-line" aria-hidden="true" />
              <div>
                <strong>Waiting for doctor approval</strong>
                <p>You requested a refill. Start order appears here after your doctor approves.</p>
              </div>
            </div>
            <ul className="med-refill-banner__list">
              {pendingRefills.map((row) => {
                const id = pick(row, "refillRequestId", "RefillRequestId");
                return (
                  <li key={id}>
                    <div className="med-refill-banner__main">
                      <strong>{refillTitle(row)}</strong>
                      <span>{refillSubtitle(row)}</span>
                    </div>
                    <span className="med-refill-banner__chip">Pending</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {approvedRefills.length ? (
          <div className="med-refill-banner med-refill-banner--approved">
            <div className="med-refill-banner__head">
              <i className="ri-checkbox-circle-line" aria-hidden="true" />
              <div>
                <strong>Approved refills</strong>
                <p>Your doctor approved these. Pick a pharmacy to start the medicine order.</p>
              </div>
            </div>
            <ul className="med-refill-banner__list">
              {approvedRefills.map((row) => {
                const id = pick(row, "refillRequestId", "RefillRequestId");
                return (
                  <li key={id}>
                    <div className="med-refill-banner__main">
                      <strong>{refillTitle(row)}</strong>
                      <span>{refillSubtitle(row)}</span>
                    </div>
                    <button
                      type="button"
                      className="prx-btn prx-btn--primary med-refill-banner__btn"
                      disabled={busy}
                      onClick={() => onStartRefill(row)}
                    >
                      Start order
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="prx-stats">
          <div className="prx-stat">
            <span className="prx-stat__icon"><i className="ri-shopping-bag-3-line" aria-hidden="true" /></span>
            <div><strong>{counts.all}</strong><span>Total orders</span></div>
          </div>
          <div className="prx-stat prx-stat--warning">
            <span className="prx-stat__icon"><i className="ri-loader-4-line" aria-hidden="true" /></span>
            <div><strong>{counts.processing}</strong><span>In progress</span></div>
          </div>
          <div className="prx-stat prx-stat--success">
            <span className="prx-stat__icon"><i className="ri-checkbox-circle-line" aria-hidden="true" /></span>
            <div><strong>{counts.delivered}</strong><span>Delivered</span></div>
          </div>
          <div className="prx-stat prx-stat--info">
            <span className="prx-stat__icon"><i className="ri-wallet-3-line" aria-hidden="true" /></span>
            <div><strong>{formatINR(totalSpent)}</strong><span>Total spent</span></div>
          </div>
        </div>

        <div className="prx-card med-orders-card">
          <div className="prx-card__head">
            <h5 className="prx-card__title">
              <i className="ri-shopping-bag-3-line" aria-hidden="true" />
              My Orders
            </h5>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="prx-search">
                <i className="ri-search-line" aria-hidden="true" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order, medicine or pharmacy"
                />
              </div>
              <div className="prx-tabs">
                {ORDER_TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`prx-tabs__tab${tab === item.id ? " is-active" : ""}`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                    <span>{counts[item.id]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="prx-card__body">
            {loading ? (
              <div className="prx-empty">
                <Spinner size="sm" />
                <span>Loading orders…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="prx-empty">
                <i className="ri-shopping-bag-3-line" aria-hidden="true" />
                <strong>No orders here</strong>
                <span>Order medicines from a signed prescription to see them here.</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table prx-table med-orders-table mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Medicines</th>
                      <th>Pharmacy</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => {
                      const stage = orderStage(order.status);
                      const first = order.items[0];
                      return (
                        <tr key={order.id} onClick={() => setActiveId(order.id)}>
                          <td>
                            <span className="med-order-no">{order.orderNo}</span>
                            <span className="med-order-date">{formatDate(order.date)}</span>
                          </td>
                          <td>
                            {first ? (
                              <span className="med-order-items">
                                {first.name}
                                {first.potency ? ` ${first.potency}` : ""}
                                {order.items.length > 1 ? <span>+{order.items.length - 1} more</span> : null}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{order.pharmacy}</td>
                          <td className="med-order-amount">{stage.key === "placed" ? "Awaiting quote" : formatINR(order.amount)}</td>
                          <td>
                            <span className={`med-status med-status--${stage.tone}`}>{stage.label}</span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className={`prx-btn ${stage.action ? "prx-btn--primary" : "med-soft-btn"}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveId(order.id);
                              }}
                            >
                              {ACTION_LABEL[stage.action] || "View"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="med-bottom-grid">
          <div className="prx-card">
            <div className="prx-card__head">
              <h5 className="prx-card__title">
                <i className="ri-question-line" aria-hidden="true" />
                How ordering works
              </h5>
            </div>
            <div className="prx-card__body">
              <ol className="med-how">
                {HOW_IT_WORKS.map((step, index) => (
                  <li key={step.title}>
                    <span className="med-how__icon">
                      <i className={step.icon} aria-hidden="true" />
                      <em>{index + 1}</em>
                    </span>
                    <strong>{step.title}</strong>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="prx-card">
            <div className="prx-card__head">
              <h5 className="prx-card__title">
                <i className="ri-secure-payment-line" aria-hidden="true" />
                Payments
              </h5>
            </div>
            <div className="prx-card__body">
              {payments.length === 0 ? (
                <div className="prx-empty med-empty--sm">
                  <i className="ri-wallet-3-line" aria-hidden="true" />
                  <span>No consult or medicine payments yet.</span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table prx-table mb-0">
                    <thead>
                      <tr>
                        <th>Payment</th>
                        <th>For</th>
                        <th>Status</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((row, index) => (
                        <tr key={row.paymentOrderId || row.PaymentOrderId || index}>
                          <td>{row.paymentOrderId || row.PaymentOrderId || "—"}</td>
                          <td>{row.stream || row.Stream || "—"}</td>
                          <td>{row.status || row.Status || "—"}</td>
                          <td className="text-end">{formatINR(row.amount ?? row.Amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <OrderDetailsModal
          order={activeOrder}
          toggle={() => setActiveId(null)}
          busy={busy}
          onAcceptQuote={onAcceptQuote}
          onPay={onPay}
          onTrack={onTrack}
          onReorder={onReorder}
          onReview={onReview}
        />

        <OrderMedicinesModal
          isOpen={Boolean(refillOrderFor)}
          toggle={() => setRefillOrderFor(null)}
          prescription={refillOrderFor?.prescription || null}
          refillId={refillOrderFor?.refillId || null}
          onPlaced={onRefillOrderPlaced}
        />
      </Container>
    </div>
  );
};

export default PatientMedicineOrdersPage;
