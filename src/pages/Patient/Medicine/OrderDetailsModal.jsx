import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Input, Modal, ModalBody, ModalHeader, Spinner } from "reactstrap";

import { TRACKING_STEPS, formatDate, formatINR, orderStage } from "./medicineOrderData";
import "./patientMedicine.css";

const PAY_OPTIONS = [
  { id: "ONLINE", label: "Pay Online", hint: "UPI, card or net banking", icon: "ri-bank-card-line" },
  { id: "COD", label: "Cash on Delivery", hint: "Pay when medicines arrive", icon: "ri-hand-coin-line" },
];

const StageChip = ({ status }) => {
  const stage = orderStage(status);
  return <span className={`med-status med-status--${stage.tone}`}>{stage.label}</span>;
};

/**
 * MED-14.02 / 08.03 / 09.02 / 10.03 / 15.01 — one order: summary & quote, payment, tracking, reorder and review.
 */
const OrderDetailsModal = ({ order, toggle, busy, onAcceptQuote, onPay, onTrack, onReorder, onReview }) => {
  const [payMode, setPayMode] = useState("ONLINE");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    setPayMode("ONLINE");
    setRating(0);
    setHoverRating(0);
    setReviewText("");
  }, [order?.id]);

  if (!order) return null;

  const stage = orderStage(order.status);
  const subtotal = order.items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);
  const total = order.amount || subtotal + (order.deliveryFee || 0);
  const hasQuote = total > 0 && stage.key !== "placed";
  const paid = stage.step >= 1 && stage.key !== "cancelled";

  return (
    <Modal isOpen={Boolean(order)} toggle={toggle} centered size="lg" className="patient-list-modal med-modal">
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-shopping-bag-3-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">Order Details — {order.orderNo}</span>
        </span>
      </ModalHeader>
      <ModalBody>
        <div className="med-order-strip">
          <div>
            <span>Ordered on</span>
            <strong>{formatDate(order.date)}</strong>
          </div>
          <div>
            <span>Pharmacy</span>
            <strong>{order.pharmacy}</strong>
          </div>
          {order.doctorName ? (
            <div>
              <span>Prescribed by</span>
              <strong>{order.doctorName}</strong>
            </div>
          ) : null}
          <StageChip status={order.status} />
        </div>

        <div className="med-detail-grid">
          <section className="med-panel">
            <header className="med-panel__head">
              <h6>
                <i className="ri-file-list-2-line" aria-hidden="true" />
                Order Summary
              </h6>
            </header>
            <div className="med-panel__body">
              {order.items.length ? (
                <ul className="med-items med-items--compact">
                  {order.items.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      <span className="med-items__icon">
                        <i className="ri-capsule-line" aria-hidden="true" />
                      </span>
                      <span className="med-items__main">
                        <strong>
                          {item.name}
                          {item.potency ? <span className="prx-potency">{item.potency}</span> : null}
                        </strong>
                        <span>Qty: {item.qty || 1}</span>
                      </span>
                      <span className="med-items__price">{item.price ? formatINR(item.price * (item.qty || 1)) : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="med-muted">Medicines are read from your signed prescription.</p>
              )}

              {hasQuote ? (
                <dl className="med-totals">
                  {subtotal > 0 ? (
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatINR(subtotal)}</dd>
                    </div>
                  ) : null}
                  {order.deliveryFee ? (
                    <div>
                      <dt>Delivery</dt>
                      <dd>{formatINR(order.deliveryFee)}</dd>
                    </div>
                  ) : null}
                  <div className="med-totals__grand">
                    <dt>Total</dt>
                    <dd>{formatINR(total)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="med-waiting">
                  <i className="ri-time-line" aria-hidden="true" />
                  <span>Waiting for the pharmacy to confirm stock and send a quote.</span>
                </div>
              )}

              {stage.action === "accept" ? (
                <button
                  type="button"
                  className="prx-btn prx-btn--primary med-block-btn"
                  disabled={busy}
                  onClick={() => onAcceptQuote(order)}
                >
                  {busy ? <Spinner size="sm" /> : <i className="ri-check-double-line" aria-hidden="true" />}
                  Accept Quote · {formatINR(total)}
                </button>
              ) : null}
            </div>
          </section>

          <section className="med-panel">
            <header className="med-panel__head">
              <h6>
                <i className="ri-map-pin-time-line" aria-hidden="true" />
                Order Tracking
              </h6>
              {!order.isDemo && stage.key !== "cancelled" ? (
                <button type="button" className="med-link-btn" disabled={busy} onClick={() => onTrack(order)}>
                  <i className="ri-refresh-line" aria-hidden="true" />
                  Refresh
                </button>
              ) : null}
            </header>
            <div className="med-panel__body">
              {stage.key === "cancelled" ? (
                <div className="med-waiting med-waiting--danger">
                  <i className="ri-close-circle-line" aria-hidden="true" />
                  <span>This order was cancelled. You can reorder from the same prescription.</span>
                </div>
              ) : (
                <ol className="med-track">
                  {TRACKING_STEPS.map((step, index) => {
                    const state = index < stage.step ? "done" : index === stage.step ? "current" : "todo";
                    return (
                      <li key={step.id} className={`med-track__step is-${state}`}>
                        <span className="med-track__dot">
                          <i className={state === "done" ? "ri-check-line" : step.icon} aria-hidden="true" />
                        </span>
                        <span className="med-track__text">
                          <strong>{step.label}</strong>
                          <span>
                            {index === 0
                              ? formatDate(order.date, "DD MMM YYYY, hh:mm A")
                              : state === "current"
                                ? "In progress"
                                : state === "done"
                                  ? "Completed"
                                  : "Pending"}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>

        {stage.action === "pay" ? (
          <section className="med-panel med-panel--spaced">
            <header className="med-panel__head">
              <h6>
                <i className="ri-wallet-3-line" aria-hidden="true" />
                Payment Method
              </h6>
            </header>
            <div className="med-panel__body">
              <div className="med-pay-options">
                {PAY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`med-pay-option${payMode === option.id ? " is-active" : ""}`}
                    onClick={() => setPayMode(option.id)}
                  >
                    <i className="med-pharmacy__radio" aria-hidden="true" />
                    <i className={`${option.icon} med-pay-option__icon`} aria-hidden="true" />
                    <span>
                      <strong>{option.label}</strong>
                      <span>{option.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="prx-btn prx-btn--primary med-block-btn"
                disabled={busy}
                onClick={() => onPay(order, payMode)}
              >
                {busy ? <Spinner size="sm" /> : <i className="ri-secure-payment-line" aria-hidden="true" />}
                {payMode === "COD" ? `Confirm COD · ${formatINR(total)}` : `Pay ${formatINR(total)}`}
              </button>
            </div>
          </section>
        ) : null}

        {paid && order.payMode ? (
          <div className="med-paid">
            <i className={order.payMode === "COD" ? "ri-hand-coin-line" : "ri-bank-card-line"} aria-hidden="true" />
            <span>
              {order.payMode === "COD"
                ? `Cash on delivery · pay ${formatINR(total)} when the medicines arrive`
                : `Paid online · ${formatINR(total)}`}
            </span>
          </div>
        ) : null}

        {stage.key === "delivered" ? (
          <section className="med-panel med-panel--spaced">
            <header className="med-panel__head">
              <h6>
                <i className="ri-star-smile-line" aria-hidden="true" />
                Review Order
              </h6>
            </header>
            <div className="med-panel__body">
              {order.reviewed ? (
                <div className="med-paid">
                  <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                  <span>Thanks! Your review has been added.</span>
                </div>
              ) : (
                <>
                  <div className="med-stars" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} star`}
                        className={(hoverRating || rating) >= value ? "is-on" : ""}
                        onMouseEnter={() => setHoverRating(value)}
                        onClick={() => setRating(value)}
                      >
                        <i className={(hoverRating || rating) >= value ? "ri-star-fill" : "ri-star-line"} aria-hidden="true" />
                      </button>
                    ))}
                    <span>{rating ? `${rating}/5` : "Tap to rate"}</span>
                  </div>
                  <Input
                    type="textarea"
                    className="med-review-input"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="How was the packaging and delivery?"
                  />
                  <button
                    type="button"
                    className="prx-btn prx-btn--primary med-block-btn"
                    disabled={!rating}
                    onClick={() => onReview(order, rating, reviewText.trim())}
                  >
                    <i className="ri-send-plane-line" aria-hidden="true" />
                    Add Review
                  </button>
                </>
              )}
            </div>
          </section>
        ) : null}

        <div className="med-detail-actions">
          <Link className="med-link-btn" to="/patient/prescriptions" onClick={toggle}>
            <i className="ri-file-list-3-line" aria-hidden="true" />
            View prescription
          </Link>
          {stage.key === "delivered" || stage.key === "cancelled" ? (
            <button type="button" className="prx-btn med-soft-btn" disabled={busy} onClick={() => onReorder(order)}>
              <i className="ri-repeat-line" aria-hidden="true" />
              Reorder
            </button>
          ) : null}
        </div>
      </ModalBody>
    </Modal>
  );
};

export default OrderDetailsModal;
