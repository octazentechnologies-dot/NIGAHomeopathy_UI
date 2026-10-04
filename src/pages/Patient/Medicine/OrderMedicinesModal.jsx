import React, { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "reactstrap";

import ModalActionButton from "../../../Components/Common/ModalActionButton";
import {
  createMedicineOrder,
  grantMedicineConsent,
  listPharmacySellers,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { formatDosage } from "../../Doctor/Erx/erxOptions";
import {
  SAMPLE_PHARMACIES,
  buildDemoOrder,
  formatDate,
  normalizePharmacy,
  saveDemoOrder,
} from "./medicineOrderData";
import "./patientMedicine.css";

const AUTO_ROUTE = "auto";

/**
 * MED-03.03 — order medicines from a signed eRx: pick a pharmacy, review remedies, place order.
 * No payment here; the pharmacy quotes first.
 */
const OrderMedicinesModal = ({ isOpen, toggle, prescription, onPlaced }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(AUTO_ROUTE);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

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
        if (!cancelled) setPharmacies(rows.length ? rows : SAMPLE_PHARMACIES);
      })
      .catch(() => {
        if (!cancelled) setPharmacies(SAMPLE_PHARMACIES);
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

  const placeOrder = async () => {
    if (!prescription) return;
    setPlacing(true);
    setError("");
    try {
      if (!prescription.erxId) {
        const order = buildDemoOrder({ prescription, pharmacy: selectedPharmacy });
        saveDemoOrder(order);
        onPlaced?.(order);
        return;
      }
      const payload = { erxSnapshotId: prescription.erxId };
      if (selectedPharmacy && !String(selectedPharmacy.id).startsWith("demo-")) {
        payload.pharmacyPartnerId = Number(selectedPharmacy.id);
      }
      const created = unwrapS4(await createMedicineOrder(payload));
      const orderId = created?.medicineOrderId || created?.MedicineOrderId;
      if (orderId) await grantMedicineConsent(orderId);
      onPlaced?.({ id: orderId, orderNo: orderId ? `HM${String(orderId).padStart(6, "0")}` : "" });
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
          <span className="patient-list-modal__title-text">Order Medicines</span>
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
                    <span>{[row.distance, row.area].filter(Boolean).join(" · ") || "Partner pharmacy"}</span>
                  </span>
                  {row.eta ? <span className="med-pharmacy__eta">{row.eta}</span> : null}
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
            No payment now. The pharmacy confirms stock and sends a quote. You pay online or choose cash on delivery only
            after you accept it.
          </span>
        </div>
      </ModalBody>
      <ModalFooter>
        <ModalActionButton action="cancel" onClick={toggle} disabled={placing} />
        <ModalActionButton
          action="confirm"
          iconClassName="ri-shopping-bag-3-line"
          loading={placing}
          loadingLabel="Placing…"
          disabled={!prescription}
          onClick={placeOrder}
        >
          Place Order
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default OrderMedicinesModal;
