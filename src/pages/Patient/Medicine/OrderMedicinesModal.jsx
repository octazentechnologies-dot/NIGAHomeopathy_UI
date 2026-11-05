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
import { listDeliveryAddresses } from "../../../helpers/patientCareApi";
import { formatDosage } from "../../Doctor/Erx/erxOptions";
import {
  formatDate,
  formatPharmacyDeliveryFee,
  formatPharmacyHours,
  normalizePharmacy,
} from "./medicineOrderData";
import "./patientMedicine.css";

/* FUTURE: Auto-route (nearest pharmacy with stock) — re-enable when product ships it.
const AUTO_ROUTE = "auto";
*/

const unwrapList = (response) => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
};

const pickDefaultAddress = (addresses) => {
  if (!Array.isArray(addresses) || !addresses.length) return null;
  return addresses.find((row) => row.isDefault || row.IsDefault) || addresses[0];
};

const pickDefaultArea = (addresses) => {
  const preferred = pickDefaultAddress(addresses);
  if (!preferred) return "";
  return String(preferred?.city || preferred?.City || preferred?.area || preferred?.Area || "").trim();
};

const addressIdOf = (row) =>
  row?.deliveryAddressId ?? row?.DeliveryAddressId ?? row?.addressId ?? row?.AddressId ?? row?.id ?? null;

/**
 * MED-03.03 — order medicines from a signed eRx: pick a pharmacy, review remedies, place order.
 * Also used for approved refill "Start order" (refillId) — consent + ORDERED handled by API.
 * No payment here; the pharmacy quotes first.
 * Sellers list shows operating hours / service areas / delivery fee from pharmacy Config.
 * Auto-route is deferred (patient must select a pharmacy).
 */
const OrderMedicinesModal = ({ isOpen, toggle, prescription, refillId = null, onPlaced }) => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [pharmacyId, setPharmacyId] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryAddressId, setDeliveryAddressId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const isRefill = Number(refillId) > 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    setPharmacyId("");
    setDeliveryAddressId(null);
    setError("");
    let cancelled = false;
    setLoadingPharmacies(true);

    (async () => {
      let area = "";
      let addressId = null;
      try {
        const addrRes = await listDeliveryAddresses();
        const list = unwrapList(addrRes);
        const preferred = pickDefaultAddress(list);
        area = pickDefaultArea(list);
        const rawId = addressIdOf(preferred);
        const n = Number(rawId);
        addressId = Number.isFinite(n) && n > 0 ? n : null;
      } catch {
        area = "";
        addressId = null;
      }
      if (cancelled) return;
      setDeliveryArea(area);
      setDeliveryAddressId(addressId);

      try {
        const response = await listPharmacySellers(area || undefined);
        const data = unwrapS4(response);
        const rows = (Array.isArray(data) ? data : [])
          .map(normalizePharmacy)
          .filter((row) => row.id != null);
        if (!cancelled) {
          setPharmacies(rows);
          const firstOpen = rows.find((row) => row.serviceable !== false);
          if (firstOpen) setPharmacyId(String(firstOpen.id));
        }
      } catch (err) {
        if (!cancelled) {
          setPharmacies([]);
          setError(s4Message(err));
        }
      } finally {
        if (!cancelled) setLoadingPharmacies(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const remedies = prescription?.remedies || [];
  const selectedPharmacy = pharmacies.find((row) => String(row.id) === String(pharmacyId)) || null;
  const canOrder = isRefill ? Number(refillId) > 0 : Boolean(prescription?.erxId);
  const selectedBlocked = selectedPharmacy && selectedPharmacy.serviceable === false;
  const needsPharmacy = !selectedPharmacy;

  const placeOrder = async () => {
    if (!canOrder || selectedBlocked || !selectedPharmacy) return;
    setPlacing(true);
    setError("");
    try {
      const payload = { pharmacyPartnerId: Number(selectedPharmacy.id) };
      if (deliveryAddressId) payload.addressId = deliveryAddressId;
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
        {deliveryArea ? (
          <p className="med-muted med-area-hint">
            Matching pharmacies for delivery area <strong>{deliveryArea}</strong>
          </p>
        ) : null}

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
              {/* FUTURE Auto-route UI — re-enable with AUTO_ROUTE when nearest/stock ships
              <button type="button" className="med-pharmacy" onClick={() => setPharmacyId(AUTO_ROUTE)}>
                <strong>Auto-route</strong>
                <span>Nearest pharmacy with stock</span>
              </button>
              */}
              {pharmacies.map((row) => {
                const hours = formatPharmacyHours(row);
                const fee = formatPharmacyDeliveryFee(row);
                const areasLabel = (row.areas || []).length
                  ? row.areas.join(", ")
                  : row.area || "Partner pharmacy";
                const unavailable = row.serviceable === false;
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={unavailable}
                    className={`med-pharmacy${String(pharmacyId) === String(row.id) ? " is-active" : ""}${
                      unavailable ? " is-unavailable" : ""
                    }`}
                    onClick={() => {
                      if (unavailable) return;
                      setPharmacyId(row.id);
                    }}
                  >
                    <span className="med-pharmacy__icon">
                      <i className="ri-store-2-line" aria-hidden="true" />
                    </span>
                    <span className="med-pharmacy__main">
                      <strong>
                        {row.name}
                        {row.openNow === true ? (
                          <span className="med-pharmacy__badge med-pharmacy__badge--open">Open</span>
                        ) : row.openNow === false ? (
                          <span className="med-pharmacy__badge med-pharmacy__badge--closed">Closed</span>
                        ) : null}
                      </strong>
                      <span>{areasLabel}</span>
                      {hours || row.workingDays?.length ? (
                        <span className="med-pharmacy__meta">
                          {hours ? `Hours ${hours}` : null}
                          {hours && row.workingDays?.length ? " · " : null}
                          {row.workingDays?.length ? row.workingDays.join(", ") : null}
                        </span>
                      ) : null}
                      {fee ? <span className="med-pharmacy__meta">{fee}</span> : null}
                      {unavailable && row.closedReason ? (
                        <span className="med-pharmacy__meta med-pharmacy__meta--warn">{row.closedReason}</span>
                      ) : null}
                    </span>
                    <i className="med-pharmacy__radio" aria-hidden="true" />
                  </button>
                );
              })}
              {!pharmacies.length ? (
                <p className="med-muted">No partner pharmacies are available right now.</p>
              ) : null}
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
          disabled={!canOrder || selectedBlocked || needsPharmacy}
          onClick={placeOrder}
        >
          {isRefill ? "Start order" : "Place Order"}
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
};

export default OrderMedicinesModal;
