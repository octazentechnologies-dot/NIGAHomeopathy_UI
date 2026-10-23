import React, { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";

import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  cloneMedicineRefill,
  createMedicineOrder,
  grantMedicineConsent,
  listPharmacySellers,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { formatDosage } from "../../Doctor/Erx/erxOptions";
import { formatDate, normalizePharmacy } from "./medicineOrderData";
import "./patientMedicine.css";

const AUTO_ROUTE = "auto";

/**
 * MED-03.03 — order medicines from a signed eRx: pick a pharmacy, review remedies, place order.
 * Also used for approved refill "Start order" (refillId) — consent + ORDERED handled by API.
 * No payment here; the pharmacy quotes first.
 */
const OrderMedicinesModal = ({ isOpen, toggle, prescription, refillId = null, onPlaced }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(AUTO_ROUTE);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const isRefill = Number(refillId) > 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    setPharmacyId(AUTO_ROUTE);
    setError("");
    let cancelled = false;
    setLoadingPharmacies(true);
    listPharmacySellers()
      .then((response) => {
        const data = unwrapS4(response);
        const rows = (Array.isArray(data) ? data : []).map(normalizePharmacy).filter((row) => row.id != null);
        if (!cancelled) setPharmacies(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setPharmacies([]);
          setError(s4Message(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPharmacies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const remedies = prescription?.remedies || [];
  const selectedPharmacy = pharmacies.find((row) => String(row.id) === String(pharmacyId)) || null;
  const canOrder = isRefill ? Number(refillId) > 0 : Boolean(prescription?.erxId);

  const placeOrder = async () => {
    if (!canOrder) return;
    setPlacing(true);
    setError("");
    try {
      const payload = {};
      if (selectedPharmacy) payload.pharmacyPartnerId = Number(selectedPharmacy.id);
      let created;
      if (isRefill) {
        created = unwrapS4(await cloneMedicineRefill(Number(refillId), payload));
      } else {
        payload.erxSnapshotId = prescription.erxId;
        created = unwrapS4(await createMedicineOrder(payload));
        const orderId = created?.medicineOrderId || created?.MedicineOrderId;
        if (orderId) await grantMedicineConsent(orderId);
      }
      const orderId = created?.medicineOrderId || created?.MedicineOrderId;
      onPlaced?.({ id: orderId, orderNo: orderId ? `HM${String(orderId).padStart(6, "0")}` : "", refill: isRefill });
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg" className="patient-list-modal med-modal">
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-capsule-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">{isRefill ? "Start refill order" : "Order Medicines"}</span>
        </span>
      </ModalHeader>
      <ModalBody>
        {prescription ? (
          <div className="med-erx-strip">
            <span className="med-erx-strip__icon">
              <i className="ri-file-list-3-line" aria-hidden="true" />
            </span>
            <div className="med-erx-strip__main">
              <strong>{prescription.erxNo}</strong>
              <span>
                {prescription.doctorName} · {formatDate(prescription.date)}
              </span>
            </div>
            <span className="prx-chip prx-chip--signed">
              <i className="ri-checkbox-circle-fill" aria-hidden="true" />
              Signed
            </span>
          </div>
        ) : null}

        {prescription && !canOrder ? (
          <div className="med-alert med-alert--danger">
            This prescription has not been signed as an eRx yet. Ask your doctor to sign it before ordering medicines.
          </div>
        ) : null}
        {error ? <div className="med-alert med-alert--danger">{error}</div> : null}

        <section className="med-section">
          <h6 className="med-section__title">
            <i className="ri-store-2-line" aria-hidden="true" />
            Select Pharmacy
          </h6>
          {loadingPharmacies ? (
            <div className="med-loading">
              <Spinner size="sm" /> Loading pharmacies…
            </div>
          ) : (
            <div className="med-pharmacies">
              <button
                type="button"
                className={`med-pharmacy${pharmacyId === AUTO_ROUTE ? " is-active" : ""}`}
                onClick={() => setPharmacyId(AUTO_ROUTE)}
              >
                <span className="med-pharmacy__icon med-pharmacy__icon--auto">
                  <i className="ri-route-line" aria-hidden="true" />
                </span>
                <span className="med-pharmacy__main">
                  <strong>Auto-route</strong>
                  <span>Nearest pharmacy with stock</span>
                </span>
                <i className="med-pharmacy__radio" aria-hidden="true" />
              </button>
              {pharmacies.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`med-pharmacy${String(pharmacyId) === String(row.id) ? " is-active" : ""}`}
                  onClick={() => setPharmacyId(row.id)}
                >
                  <span className="med-pharmacy__icon">
                    <i className="ri-store-2-line" aria-hidden="true" />
                  </span>
                  <span className="med-pharmacy__main">
                    <strong>{row.name}</strong>
                    <span>{row.area || "Partner pharmacy"}</span>
                  </span>
                  <i className="med-pharmacy__radio" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="med-section">
          <h6 className="med-section__title">
            <i className="ri-medicine-bottle-line" aria-hidden="true" />
            Medicines
            <span className="med-count">{remedies.length}</span>
          </h6>
          {remedies.length ? (
            <ul className="med-items">
              {remedies.map((remedy, index) => (
                <li key={`${remedy.name}-${index}`}>
                  <span className="med-items__icon">
                    <i className="ri-capsule-line" aria-hidden="true" />
                  </span>
                  <span className="med-items__main">
                    <strong>
                      {remedy.name}
                      {remedy.potency ? <span className="prx-potency">{remedy.potency}</span> : null}
                    </strong>
                    <span>{formatDosage(remedy) || "As directed by your doctor"}</span>
                  </span>
                  <span className="med-items__qty">Qty: 1</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="med-muted">Remedy details are not available. The pharmacy reads them from your signed prescription.</p>
          )}
        </section>

        <div className="med-note">
          <i className="ri-information-line" aria-hidden="true" />
          <span>
            {isRefill
              ? "Your doctor already approved this refill. Pick a pharmacy to create the order. No payment now — you pay after you accept the quote."
              : "No payment now. The pharmacy confirms stock and sends a quote. You pay online or choose cash on delivery only after you accept it."}
          </span>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalActionButton action="cancel" onClick={toggle} disabled={placing} />
        <ModalActionButton
          action="confirm"
          iconClassName="ri-shopping-bag-3-line"
          loading={placing}
          loadingLabel={isRefill ? "Starting…" : "Placing…"}
          disabled={!canOrder}
          onClick={placeOrder}
        >
          {isRefill ? "Start order" : "Place Order"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default OrderMedicinesModal;
