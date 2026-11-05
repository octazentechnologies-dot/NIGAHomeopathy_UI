import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Alert, Badge, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import AddressCascadeFields from "../../Components/Common/AddressCascadeFields";
import {
  acceptMedicineOrder,
  deliverMedicine,
  dispatchMedicine,
  markMedicineReady,
  medicineAcceptOtp,
  medicineTracking,
  onboardPharmacy,
  listPharmacyPartners,
  pharmacyQueue,
  quoteMedicineOrder,
  rejectMedicineOrder,
  requestPharmacyClose,
  uploadPharmacyDocument,
  withdrawPharmacy,
  s4Message,
  unwrapS4,
} from "../../helpers/s4Week4Api";
import "./components/pharmacyDashboard.css";

const emptyOnboard = {
  name: "",
  ownerName: "",
  mobile: "",
  licenceNumber: "",
  expiryDate: "",
  area: "",
  countryId: "78",
  stateId: "",
  districtId: "",
  cityId: "",
  pinCodeId: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  postalCode: "",
};

const statusLabel = (status) => {
  const s = String(status || "PENDING").toUpperCase();
  if (s === "ACTIVE") return "Activated";
  if (s === "CLOSE_REQUESTED") return "Close requested";
  if (s === "CLOSED") return "Closed";
  if (s === "REJECTED") return "Rejected";
  if (s === "SUSPENDED") return "Suspended";
  return "Pending";
};

const orderStatus = (row) => String(row.status || row.Status || "").toUpperCase();
const orderIdOf = (row) => row.medicineOrderId || row.MedicineOrderId || row.id;
const quoteAmountOf = (row) => row.quoteAmount ?? row.QuoteAmount ?? "";
const deliveryFeeOf = (row) => row.deliveryFee ?? row.DeliveryFee ?? "";
const totalPaidOf = (row) => row.totalPaid ?? row.TotalPaid ?? "";
const field = (row, camel) => row?.[camel] ?? row?.[camel.charAt(0).toUpperCase() + camel.slice(1)];

const STATUS_META = {
  OFFERED: { color: "warning", label: "New offer", hint: "Confirm patient consent, send OTP, then accept or reject." },
  ACCEPTED: { color: "info", label: "Accepted", hint: "Send a price quote to the patient." },
  QUOTED: { color: "primary", label: "Quoted", hint: "Waiting for the patient to accept the quote." },
  QUOTED_ACCEPTED: { color: "primary", label: "Quote accepted", hint: "Waiting for the patient to pay." },
  PAID: { color: "success", label: "Paid", hint: "Pack the order and mark it ready." },
  COD_PENDING: { color: "success", label: "Cash on delivery", hint: "Pack the order and mark it ready." },
  READY: { color: "dark", label: "Ready", hint: "Hand over to delivery and mark dispatched." },
  DISPATCHED: { color: "info", label: "Dispatched", hint: "Mark delivered when the patient receives it." },
  DELIVERED: { color: "secondary", label: "Delivered", hint: "Completed." },
  REJECTED: { color: "danger", label: "Rejected", hint: "Closed." },
};

const REJECT_REASONS = { OUT_OF_STOCK: "Out of stock", CLOSED: "Pharmacy closed", OTHER: "Other" };

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatAmount = (value) => {
  if (value === "" || value === null || value === undefined) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : String(value);
};

const PharmacyWorkspacePage = ({ mode = "orders" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otpById, setOtpById] = useState({});
  const [otpSentById, setOtpSentById] = useState({});
  const [quoteById, setQuoteById] = useState({});
  const [medicinesAmountById, setMedicinesAmountById] = useState({});
  const [deliveryFeeById, setDeliveryFeeById] = useState({});
  const [detailById, setDetailById] = useState({});
  const [openId, setOpenId] = useState(null);
  const [onboard, setOnboard] = useState({ ...emptyOnboard });
  // Document slots in rows of 3; start with one row. + appears after 3rd when that row is full.
  const [docSlots, setDocSlots] = useState([null, null, null]);
  // Bump per-slot key only on clear so the native file input resets without wiping the chosen name on select.
  const [docInputKeys, setDocInputKeys] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [mine, setMine] = useState([]);
  const licenceFiles = docSlots.filter(Boolean);

  const pageTitle =
    mode === "onboarding"
      ? "Pharmacy onboarding"
      : mode === "quotes"
        ? "Quotes"
        : mode === "stock"
          ? "Stock confirmation"
          : mode === "prescriptions"
            ? "Prescriptions"
            : "Medicine orders";
  const pageIcon =
    mode === "onboarding"
      ? "ri-store-3-line"
      : mode === "quotes"
        ? "ri-price-tag-3-line"
        : mode === "stock"
          ? "ri-checkbox-circle-line"
          : mode === "prescriptions"
            ? "ri-file-list-3-line"
            : "ri-capsule-line";
  document.title = `${pageTitle} | Niga Homeocentrum`;

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = mode === "onboarding" ? { data: [] } : await pharmacyQueue();
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.data) ? data.data : [];
      setRows(list);
    } catch (err) {
      setRows([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    try {
      const response = await listPharmacyPartners();
      const data = unwrapS4(response);
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setMine(list);
    } catch (err) {
      setMine([]);
      setError(s4Message(err));
    }
  };

  useEffect(() => {
    if (mode === "orders" || mode === "quotes" || mode === "stock" || mode === "prescriptions") loadOrders();
    else {
      setLoading(false);
      loadMine();
    }
  }, [mode]);

  const isQuotes = mode === "quotes";
  const isStock = mode === "stock";
  const isPrescriptions = mode === "prescriptions";
  const visibleRows = isQuotes
    ? rows.filter((row) => {
        const status = orderStatus(row);
        return status === "ACCEPTED" || status === "QUOTED";
      })
    : isStock
      ? rows.filter((row) => orderStatus(row) === "OFFERED")
      : rows;

  const runAction = async (id, work, successText, reload = true) => {
    setBusyId(id);
    setError("");
    setNote("");
    try {
      const result = await work();
      if (successText) setNote(typeof successText === "function" ? successText(result) : successText);
      if (reload) {
        setDetailById((prev) => ({ ...prev, [id]: undefined }));
        await loadOrders();
      }
      return result;
    } catch (err) {
      setError(s4Message(err));
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const requestOtp = (id) =>
    runAction(
      id,
      async () => {
        const response = await medicineAcceptOtp(id);
        const devCode = response?.devCode ?? response?.data?.devCode;
        setOtpSentById((prev) => ({ ...prev, [id]: true }));
        if (devCode) setOtpById((prev) => ({ ...prev, [id]: String(devCode) }));
        return response;
      },
      `OTP created for order ${id}. Enter it to accept.`,
      false
    );

  const acceptOrder = (id) =>
    runAction(
      id,
      () => acceptMedicineOrder(id, { otp: otpById[id] || "", stockConfirmed: true }),
      `Order ${id} accepted. Remedy names are now visible. Send a quote next.`
    ).then((result) => {
      if (result) {
        setOtpById((prev) => ({ ...prev, [id]: "" }));
        setOtpSentById((prev) => ({ ...prev, [id]: false }));
      }
    });

  const rejectOrder = async (id) => {
    const choice = await Swal.fire({
      title: `Reject order ${id}?`,
      input: "select",
      inputOptions: REJECT_REASONS,
      inputPlaceholder: "Select a reason",
      showCancelButton: true,
      confirmButtonText: "Reject order",
      confirmButtonColor: "#dc3545",
      inputValidator: (value) => (!value ? "Select a reason." : undefined),
    });
    if (!choice.isConfirmed) return;
    await runAction(id, () => rejectMedicineOrder(id, { reason: choice.value }), `Order ${id} rejected.`);
  };

  const saveQuote = (id) => {
    const medicinesAmount = Number(medicinesAmountById[id] || 0);
    if (!(medicinesAmount > 0)) {
      setError("Enter medicines amount greater than 0.");
      return;
    }
    const feeRaw = deliveryFeeById[id];
    let deliveryFee = 0;
    if (feeRaw !== "" && feeRaw != null && String(feeRaw).trim() !== "") {
      deliveryFee = Number(feeRaw);
      if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
        setError("Delivery fee must be 0 or greater.");
        return;
      }
    }
    const amount = medicinesAmount + deliveryFee;
    const payload = {
      medicinesAmount,
      deliveryFee,
      amount,
    };
    runAction(
      id,
      () => quoteMedicineOrder(id, payload),
      `Quote sent: medicines ${formatAmount(medicinesAmount)} + delivery ${formatAmount(deliveryFee)} = ${formatAmount(amount)}.`
    ).then((result) => {
      if (result) {
        setMedicinesAmountById((prev) => ({ ...prev, [id]: "" }));
        setQuoteById((prev) => ({ ...prev, [id]: "" }));
        setDeliveryFeeById((prev) => ({ ...prev, [id]: "" }));
      }
    });
  };

  const toggleDetail = async (id) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (detailById[id]) return;
    try {
      const response = await medicineTracking(id);
      setDetailById((prev) => ({ ...prev, [id]: unwrapS4(response) || {} }));
    } catch (err) {
      setDetailById((prev) => ({ ...prev, [id]: { error: s4Message(err) } }));
    }
  };

  const saveOnboard = async () => {
    setBusyId("onboard");
    setError("");
    setNote("");
    if (!onboard.name.trim() || onboard.name.trim().length < 2) {
      setError("Pharmacy name is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.ownerName.trim() || onboard.ownerName.trim().length < 2) {
      setError("Owner name is required.");
      setBusyId(null);
      return;
    }
    const mobile = String(onboard.mobile || "").replace(/\D/g, "");
    if (mobile.length < 8) {
      setError("A valid mobile is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.licenceNumber.trim() || onboard.licenceNumber.trim().length < 3) {
      setError("Licence number is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.expiryDate) {
      setError("Licence expiry is required.");
      setBusyId(null);
      return;
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    if (onboard.expiryDate < todayIso) {
      setError("Licence expiry must be today or later.");
      setBusyId(null);
      return;
    }
    if (!onboard.countryId) {
      setError("Country is required.");
      setBusyId(null);
      return;
    }
    if (!onboard.addressLine1.trim() || onboard.addressLine1.trim().length < 3) {
      setError("Address line 1 is required.");
      setBusyId(null);
      return;
    }
    if (!licenceFiles.length) {
      setError("Upload at least one licence document.");
      setBusyId(null);
      return;
    }
    try {
      const toId = (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
      };
      const payload = {
        name: onboard.name.trim(),
        ownerName: onboard.ownerName.trim(),
        mobile: onboard.mobile.trim(),
        licenceNumber: onboard.licenceNumber.trim(),
        expiryDate: onboard.expiryDate,
        area: onboard.area.trim() || null,
        countryId: toId(onboard.countryId),
        stateId: toId(onboard.stateId),
        districtId: toId(onboard.districtId),
        cityId: toId(onboard.cityId),
        pinCodeId: toId(onboard.pinCodeId),
        addressLine1: onboard.addressLine1.trim(),
        addressLine2: onboard.addressLine2.trim() || null,
        landmark: onboard.landmark.trim() || null,
        postalCode: onboard.postalCode.trim() || null,
      };
      const response = await onboardPharmacy(payload);
      const inner = unwrapS4(response);
      const pharmacyPartnerId = inner?.pharmacyPartnerId || inner?.PharmacyPartnerId;
      if (pharmacyPartnerId && licenceFiles.length) {
        for (const file of licenceFiles) {
          await uploadPharmacyDocument(pharmacyPartnerId, { file, documentType: "Licence" });
        }
      }
      const message =
        response?.message ||
        inner?.message ||
        "Pharmacy stored as pending until admin activation.";
      setSubmitted({
        ...payload,
        pharmacyPartnerId,
        status: inner?.status || inner?.Status || "PENDING",
        documentCount: licenceFiles.length,
        message,
      });
      setNote(message);
      setOnboard({ ...emptyOnboard });
      setDocSlots([null, null, null]);
      setDocInputKeys({});
      await loadMine();
    } catch (err) {
      setSubmitted(null);
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const closePharmacy = async (row) => {
    const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
    const name = row.name || row.Name || "Pharmacy";
    const result = await Swal.fire({
      icon: "question",
      title: "Request close?",
      text: `Admin will verify and approve closing ${name}.`,
      input: "text",
      inputPlaceholder: "Reason (optional)",
      showCancelButton: true,
      confirmButtonText: "Request close",
      confirmButtonColor: "#000000",
    });
    if (!result.isConfirmed) return;
    setBusyId(`close-${id}`);
    setError("");
    try {
      await requestPharmacyClose(id, result.value || undefined);
      setNote(`Close requested for ${name}. Waiting for admin approval.`);
      await loadMine();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  const deletePharmacy = async (row) => {
    const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
    const name = row.name || row.Name || "Pharmacy";
    const result = await Swal.fire({
      icon: "warning",
      title: "Withdraw / delete?",
      text: `Remove ${name} from onboarding? Only pending/rejected pharmacies without orders can be deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;
    setBusyId(`del-${id}`);
    setError("");
    try {
      await withdrawPharmacy(id);
      setNote(`${name} withdrawn.`);
      await loadMine();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (mode === "onboarding") {
    return (
      <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
        <Container fluid>
          <h2 className="pharmacy-page-title"><i className="ri-store-3-line" aria-hidden="true" />Pharmacy onboarding</h2>
          {error ? <Alert color="danger">{error}</Alert> : null}
          <div className="pharmacy-stack">
          {note ? <Alert color="success">{note}</Alert> : null}
          {submitted ? (
            <>
              <Alert color="success">
                {submitted.message || "Pharmacy stored as pending until admin activation."}
              </Alert>
              <Card className="admin-dash-card mb-0">
                <CardBody>
                  <h5 className="pharmacy-section-title">Submitted for activation</h5>
                  <Row className="g-3 pharmacy-form">
                    <Col md={4}>
                      <FormGroup>
                        <Label>Pharmacy name</Label>
                        <Input value={submitted.name} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Owner name</Label>
                        <Input value={submitted.ownerName} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Mobile</Label>
                        <Input value={submitted.mobile} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Licence number</Label>
                        <Input value={submitted.licenceNumber} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Documents uploaded</Label>
                        <Input value={String(submitted.documentCount || 0)} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Status</Label>
                        <Input value={submitted.status || "PENDING"} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <Label>Address</Label>
                        <Input
                          value={[submitted.addressLine1, submitted.addressLine2, submitted.landmark, submitted.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                          disabled
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <p className="text-muted small mb-3">
                    Admin and pharmacy both receive a notification. Id {submitted.pharmacyPartnerId || "—"}.
                  </p>
                  <Button
                    className="btn btn-sm btn-soft-secondary"
                    onClick={() => {
                      setSubmitted(null);
                      setNote("");
                      setError("");
                    }}
                  >
                    <i className="ri-store-2-line" aria-hidden="true" /> Submit another pharmacy
                  </Button>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="admin-dash-card mb-0">
              <CardBody>
                <Row className="g-3 pharmacy-form">
                  <Col md={4}>
                    <FormGroup>
                      <Label>Pharmacy name *</Label>
                      <Input value={onboard.name} onChange={(e) => setOnboard({ ...onboard, name: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Owner name *</Label>
                      <Input
                        value={onboard.ownerName}
                        onChange={(e) => setOnboard({ ...onboard, ownerName: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Mobile *</Label>
                      <Input value={onboard.mobile} onChange={(e) => setOnboard({ ...onboard, mobile: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence number *</Label>
                      <Input
                        value={onboard.licenceNumber}
                        onChange={(e) => setOnboard({ ...onboard, licenceNumber: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence expiry *</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={onboard.expiryDate}
                        onChange={(e) => setOnboard({ ...onboard, expiryDate: e.target.value })}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Service area</Label>
                      <Input value={onboard.area} onChange={(e) => setOnboard({ ...onboard, area: e.target.value })} />
                    </FormGroup>
                  </Col>
                </Row>
                <Label className="mt-2 mb-2 d-block">Licence documents *</Label>
                {Array.from({ length: Math.ceil(docSlots.length / 3) }, (_, rowIndex) => {
                  const start = rowIndex * 3;
                  const rowSlots = docSlots.slice(start, start + 3);
                  const rowFilled = rowSlots.length === 3 && rowSlots.every(Boolean);
                  const isLastRow = start + 3 >= docSlots.length;
                  return (
                    <Row className="g-3 align-items-end mb-2" key={`doc-row-${rowIndex}`}>
                      {rowSlots.map((file, colIndex) => {
                        const slotIndex = start + colIndex;
                        const isThirdInRow = colIndex === 2;
                        const showAdd = isThirdInRow && rowFilled && isLastRow;
                        const inputId = `pharmacy-doc-slot-${slotIndex}`;
                        return (
                          <Col md={4} sm={6} xs={12} key={`doc-slot-${slotIndex}`}>
                            <FormGroup className="mb-0">
                              <Label className="small text-muted mb-1" htmlFor={inputId}>
                                Document {slotIndex + 1}
                              </Label>
                              <div className="d-flex gap-1 align-items-center">
                                <Input
                                  id={inputId}
                                  key={`doc-input-${slotIndex}-${docInputKeys[slotIndex] || 0}`}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  title={file?.name || "Choose file"}
                                  onChange={(e) => {
                                    const next = e.target.files?.[0] || null;
                                    setDocSlots((prev) => {
                                      const copy = [...prev];
                                      copy[slotIndex] = next;
                                      return copy;
                                    });
                                  }}
                                />
                                {file ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-secondary flex-shrink-0"
                                    title="Clear"
                                    onClick={() => {
                                      setDocSlots((prev) => {
                                        const copy = [...prev];
                                        copy[slotIndex] = null;
                                        return copy;
                                      });
                                      setDocInputKeys((prev) => ({
                                        ...prev,
                                        [slotIndex]: (prev[slotIndex] || 0) + 1,
                                      }));
                                    }}
                                  >
                                    <i className="ri-close-line" aria-hidden="true" />
                                  </button>
                                ) : null}
                                {showAdd ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-soft-primary flex-shrink-0"
                                    title="Add another row of documents"
                                    onClick={() => setDocSlots((prev) => [...prev, null, null, null])}
                                  >
                                    <i className="ri-add-line" aria-hidden="true" />
                                  </button>
                                ) : null}
                              </div>
                            </FormGroup>
                          </Col>
                        );
                      })}
                    </Row>
                  );
                })}
                <h6 className="mt-3 mb-2">Registered address</h6>
                <AddressCascadeFields value={onboard} onChange={setOnboard} />
                <div className="pharmacy-form-actions mt-3">
                  <Button className="btn btn-sm btn-soft-primary" disabled={busyId === "onboard"} onClick={saveOnboard}>
                    <i className="ri-checkbox-circle-line" aria-hidden="true" />
                    {busyId === "onboard" ? "Submitting…" : "Submit for activation"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
          <Card className="admin-dash-card mb-0">
            <div className="pharmacy-card-head">
              <h5 className="mb-0">Submitted pharmacies</h5>
              <button type="button" className="btn btn-sm btn-soft-secondary" onClick={loadMine}>
                <i className="ri-refresh-line" aria-hidden="true" />
                Refresh
              </button>
            </div>
            <CardBody>
              <p className="pharmacy-hint">
                Pending awaits admin. Use Delete to withdraw pending/rejected. Use Close pharmacy when active so admin can approve shutdown.
              </p>
              {mine.length === 0 ? (
                <p className="text-muted mb-0">Nothing submitted on this login yet.</p>
              ) : (
                <Table size="sm" className="mb-0" responsive>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>Owner</th>
                      <th>Area / City</th>
                      <th>Docs</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mine.map((row) => {
                      const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
                      const status = String(row.status || row.Status || "PENDING").toUpperCase();
                      const canDelete = status === "PENDING" || status === "REJECTED";
                      const canClose = status === "ACTIVE" || status === "SUSPENDED";
                      return (
                        <tr key={id}>
                          <td>{id || "—"}</td>
                          <td>{row.name || row.Name || "—"}</td>
                          <td>{row.ownerName || row.OwnerName || "—"}</td>
                          <td>{row.area || row.Area || row.postalCode || row.PostalCode || "—"}</td>
                          <td>{row.documentCount ?? row.DocumentCount ?? "—"}</td>
                          <td>{statusLabel(status)}</td>
                          <td className="text-end">
                            <div className="d-inline-flex flex-wrap gap-1 justify-content-end">
                              {canClose ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-warning"
                                  disabled={busyId === `close-${id}`}
                                  onClick={() => closePharmacy(row)}
                                >
                                  Close
                                </button>
                              ) : null}
                              {canDelete ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-danger"
                                  disabled={busyId === `del-${id}`}
                                  onClick={() => deletePharmacy(row)}
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
          </div>
        </Container>
      </div>
    );
  }

  const renderActions = (row) => {
    const id = orderIdOf(row);
    const status = orderStatus(row);
    const busy = busyId === id;
    const consent = Boolean(field(row, "consentGranted"));

    if (status === "OFFERED") {
      if (!consent) {
        return <span className="small text-muted">Waiting for patient consent.</span>;
      }
      const otp = String(otpById[id] || "");
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <button type="button" className="btn btn-sm btn-soft-secondary clinic-action-btn" disabled={busy} onClick={() => requestOtp(id)}>
            {otpSentById[id] ? "Resend OTP" : "Send OTP"}
          </button>
          <Input
            bsSize="sm"
            style={{ width: 90 }}
            placeholder="OTP"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            disabled={busy || !otpSentById[id]}
            onChange={(e) => setOtpById({ ...otpById, [id]: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          />
          <button type="button" className="btn btn-sm btn-soft-success clinic-action-btn" disabled={busy || otp.length !== 6} onClick={() => acceptOrder(id)}>
            Accept
          </button>
          <button type="button" className="btn btn-sm btn-soft-danger clinic-action-btn" disabled={busy} onClick={() => rejectOrder(id)}>
            Reject
          </button>
        </div>
      );
    }

    if (status === "ACCEPTED") {
      const meds = Number(medicinesAmountById[id] || 0);
      const fee = Number(deliveryFeeById[id] || 0);
      const totalPreview = (Number.isFinite(meds) && meds > 0 ? meds : 0) + (Number.isFinite(fee) && fee >= 0 ? fee : 0);
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <Input
            bsSize="sm"
            type="number"
            min="1"
            step="0.01"
            style={{ width: 120 }}
            placeholder="Medicines ₹"
            title="Medicines amount (required)"
            value={medicinesAmountById[id] || ""}
            disabled={busy}
            onChange={(e) => setMedicinesAmountById({ ...medicinesAmountById, [id]: e.target.value })}
          />
          <Input
            bsSize="sm"
            type="number"
            min="0"
            step="0.01"
            style={{ width: 110 }}
            placeholder="Delivery ₹"
            title="Delivery fee (0 if free)"
            value={deliveryFeeById[id] ?? ""}
            disabled={busy}
            onChange={(e) => setDeliveryFeeById({ ...deliveryFeeById, [id]: e.target.value })}
          />
          <span className="small text-muted" title="Quoted total">
            Total {formatAmount(totalPreview > 0 ? totalPreview : "")}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-soft-primary clinic-action-btn"
            disabled={busy || !(Number(medicinesAmountById[id]) > 0)}
            onClick={() => saveQuote(id)}
          >
            <i className="ri-send-plane-line" aria-hidden="true" /> Send quote
          </button>
          {!isQuotes ? (
            <button type="button" className="btn btn-sm btn-soft-danger clinic-action-btn" disabled={busy} onClick={() => rejectOrder(id)}>
              <i className="ri-close-circle-line" aria-hidden="true" /> Reject
            </button>
          ) : null}
        </div>
      );
    }

    if (status === "PAID" || status === "COD_PENDING") {
      return (
        <Button
          size="sm"
          color="soft-info"
          disabled={busy}
          onClick={() => runAction(id, () => markMedicineReady(id), `Order ${id} marked ready.`)}
        >
          <i className="ri-checkbox-circle-line" aria-hidden="true" /> Mark ready
        </Button>
      );
    }

    if (status === "READY") {
      return (
        <Button
          size="sm"
          color="soft-dark"
          disabled={busy}
          onClick={() => runAction(id, () => dispatchMedicine(id), `Order ${id} dispatched.`)}
        >
          <i className="ri-truck-line" aria-hidden="true" /> Dispatch
        </Button>
      );
    }

    if (status === "DISPATCHED") {
      return (
        <Button
          size="sm"
          color="soft-success"
          disabled={busy}
          onClick={() => runAction(id, () => deliverMedicine(id), `Order ${id} delivered.`)}
        >
          <i className="ri-checkbox-circle-line" aria-hidden="true" /> Mark delivered
        </Button>
      );
    }

    return <span className="small text-muted">{STATUS_META[status]?.hint || "No action."}</span>;
  };

  const renderDetail = (id) => {
    const detail = detailById[id];
    if (!detail) {
      return (
        <div className="small text-muted">
          <Spinner size="sm" /> Loading order details…
        </div>
      );
    }
    if (detail.error) return <div className="small text-danger">{detail.error}</div>;
    const items = detail.items || detail.Items || [];
    const events = detail.events || detail.Events || [];
    const deliveryFee = field(detail, "deliveryFee");
    const quoteAmount = field(detail, "quoteAmount");
    const subtotal =
      field(detail, "subtotalMedicines") ??
      (quoteAmount != null && deliveryFee != null && quoteAmount !== "" && deliveryFee !== ""
        ? Number(quoteAmount) - Number(deliveryFee)
        : null);
    const deliveryCity = field(detail, "deliveryCity");
    return (
      <Row className="g-2">
        <Col md={6}>
          <h6 className="mb-2">Medicines</h6>
          {deliveryCity ? (
            <p className="small mb-2">
              <strong>Deliver to:</strong> {deliveryCity}
            </p>
          ) : null}
          {items.length === 0 ? (
            <p className="small text-muted mb-0">No medicines on this order.</p>
          ) : (
            <ul className="small mb-0 ps-3">
              {items.map((item, index) => (
                <li key={`${field(item, "remedyCode")}-${index}`}>
                  {field(item, "remedyName") || field(item, "remedyCode") || "—"}
                </li>
              ))}
            </ul>
          )}
          <p className="small text-muted mt-2 mb-0">
            Medicines {formatAmount(subtotal)}
            {deliveryFee != null && deliveryFee !== ""
              ? ` · Delivery ${Number(deliveryFee) === 0 ? "Free" : formatAmount(deliveryFee)}`
              : ""}
            {quoteAmount != null && quoteAmount !== "" ? ` · Total ${formatAmount(quoteAmount)}` : ""}
            {field(detail, "doctorName") ? ` · ${field(detail, "doctorName")}` : ""}
            {field(detail, "rxLabel") ? ` · ${field(detail, "rxLabel")}` : ""}
          </p>
        </Col>
        <Col md={6}>
          <h6 className="mb-2">Timeline</h6>
          {events.length === 0 ? (
            <p className="small text-muted mb-0">No events yet.</p>
          ) : (
            <ul className="small mb-0 ps-3">
              {events.map((event, index) => (
                <li key={index}>
                  <strong>{field(event, "status")}</strong> · {formatDateTime(field(event, "at"))}
                  {field(event, "label") || field(event, "detail")
                    ? ` · ${field(event, "label") || field(event, "detail")}`
                    : ""}
                </li>
              ))}
            </ul>
          )}
          {field(detail, "deliveredAt") ? (
            <p className="small text-muted mt-2 mb-0">Delivered {formatDateTime(field(detail, "deliveredAt"))}</p>
          ) : null}
        </Col>
      </Row>
    );
  };

  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="clinic-page-header">
          <div>
            <h2 className="clinic-page-title pharmacy-page-title"><i className={pageIcon} aria-hidden="true" />{pageTitle}</h2>
            <p className="clinic-page-subtitle pharmacy-page-subtitle mb-0">
              {isQuotes
                ? "Accepted orders waiting for a price, and quotes waiting for the patient."
                : isStock
                  ? "Confirm the pack is in stock when you accept. There is no separate stock catalogue."
                  : isPrescriptions
                    ? "Each order is the signed prescription. Remedy names stay hidden until you accept with the OTP."
                    : "Send the OTP and accept or reject new offers, quote a price, then mark ready and dispatch after the patient pays."}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-soft-secondary clinic-action-btn"
            onClick={loadOrders}
            disabled={loading}
          >
            <i className="ri-refresh-line" aria-hidden="true" />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {error ? <Alert color="danger" className="py-2 small" toggle={() => setError("")}>{error}</Alert> : null}
        {note ? <Alert color="success" className="py-2 small" toggle={() => setNote("")}>{note}</Alert> : null}
        <Card className="admin-dash-card pharmacy-list-card mb-0">
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : visibleRows.length === 0 ? (
              <p className="text-muted mb-0">
                {isQuotes
                  ? "No orders are waiting for a quote. Accept the order on Medicine orders first."
                  : isStock
                    ? "No orders are waiting for a stock check."
                    : isPrescriptions
                      ? "No signed prescriptions have been handed to your pharmacy yet."
                      : "No medicine orders assigned to your pharmacy yet."}
              </p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Patient</th>
                      <th>Status</th>
                      <th>Quote</th>
                      <th>Delivery</th>
                      <th>Total received</th>
                      <th>Ordered at</th>
                      <th>Action</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const id = orderIdOf(row);
                      const status = orderStatus(row);
                      const meta = STATUS_META[status] || { color: "secondary", label: status || "—" };
                      const patientName = field(row, "patientName");
                      const mobile = field(row, "patientMobile");
                      const address = field(row, "patientAddress");
                      const deliveryCity = field(row, "deliveryCity");
                      const payMode = field(row, "payMode");
                      return (
                        <React.Fragment key={id}>
                          <tr>
                            <td>
                              <div className="fw-semibold">#{id}</div>
                              <div className="small text-muted">
                                eRx #{field(row, "erxSnapshotId") ?? "—"} · {field(row, "itemCount") ?? 0} item(s)
                              </div>
                              {deliveryCity ? (
                                <div className="small text-muted">Deliver to {deliveryCity}</div>
                              ) : null}
                              {field(row, "pharmacyName") ? (
                                <div className="small text-muted">{field(row, "pharmacyName")}</div>
                              ) : null}
                            </td>
                            <td>
                              {patientName ? (
                                <>
                                  <div>{patientName}</div>
                                  <div className="small text-muted">
                                    {[mobile, deliveryCity || address].filter(Boolean).join(" · ") || "—"}
                                  </div>
                                </>
                              ) : (
                                <span className="small text-muted">Shown after accept</span>
                              )}
                            </td>
                            <td>
                              <Badge color={meta.color}>{meta.label}</Badge>
                              {status === "OFFERED" && !field(row, "consentGranted") ? (
                                <div className="small text-muted">No consent yet</div>
                              ) : null}
                              {payMode ? <div className="small text-muted">Pay: {payMode}</div> : null}
                            </td>
                            <td>{formatAmount(quoteAmountOf(row))}</td>
                            <td>{formatAmount(deliveryFeeOf(row))}</td>
                            <td>{formatAmount(totalPaidOf(row))}</td>
                            <td className="small">{formatDateTime(field(row, "createdAt"))}</td>
                            <td>{renderActions(row)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="pharmacy-row-view"
                                title={openId === id ? "Hide details" : "View details"}
                                aria-label={openId === id ? "Hide details" : "View details"}
                                onClick={() => toggleDetail(id)}
                              >
                                <i className={openId === id ? "ri-eye-off-line" : "ri-eye-line"} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                          {openId === id ? (
                            <tr>
                              <td colSpan={9} className="bg-light">
                                {renderDetail(id)}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default PharmacyWorkspacePage;
