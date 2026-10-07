import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Alert, Badge, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
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
  s4Message,
  unwrapS4,
} from "../../helpers/s4Week4Api";
import "./components/pharmacyDashboard.css";

const orderStatus = (row) => String(row.status || row.Status || "").toUpperCase();
const orderIdOf = (row) => row.medicineOrderId || row.MedicineOrderId || row.id;
const quoteAmountOf = (row) => row.quoteAmount ?? row.QuoteAmount ?? "";
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
  const [detailById, setDetailById] = useState({});
  const [openId, setOpenId] = useState(null);
  const [onboard, setOnboard] = useState({
    name: "",
    mobile: "",
    licenceNumber: "",
    expiryDate: "",
    area: "",
  });
  const [submitted, setSubmitted] = useState(null);
  const [mine, setMine] = useState([]);

  document.title = `${
    mode === "onboarding" ? "Pharmacy onboarding" : mode === "quotes" ? "Quotes" : "Medicine orders"
  } | Niga Homeocentrum`;

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
    if (mode === "orders" || mode === "quotes") loadOrders();
    else {
      setLoading(false);
      loadMine();
    }
  }, [mode]);

  const isQuotes = mode === "quotes";
  const visibleRows = isQuotes
    ? rows.filter((row) => {
        const status = orderStatus(row);
        return status === "ACCEPTED" || status === "QUOTED";
      })
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
    const amount = Number(quoteById[id] || 0);
    if (!(amount > 0)) {
      setError("Enter a quote amount greater than 0.");
      return;
    }
    runAction(id, () => quoteMedicineOrder(id, { amount }), `Quote of ${formatAmount(amount)} sent for order ${id}.`).then(
      (result) => {
        if (result) setQuoteById((prev) => ({ ...prev, [id]: "" }));
      }
    );
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
    try {
      const payload = {
        name: onboard.name.trim(),
        mobile: onboard.mobile.trim(),
        licenceNumber: onboard.licenceNumber.trim(),
        expiryDate: onboard.expiryDate,
        area: onboard.area.trim(),
      };
      const response = await onboardPharmacy(payload);
      const inner = unwrapS4(response);
      const message =
        response?.message ||
        inner?.message ||
        "Pharmacy stored as pending until admin activation.";
      setSubmitted({
        ...payload,
        pharmacyPartnerId: inner?.pharmacyPartnerId || inner?.PharmacyPartnerId,
        status: inner?.status || inner?.Status || "PENDING",
        message,
      });
      setNote(message);
      setOnboard({ name: "", mobile: "", licenceNumber: "", expiryDate: "", area: "" });
      await loadMine();
    } catch (err) {
      setSubmitted(null);
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (mode === "onboarding") {
    return (
      <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
        <Container fluid>
          <h2 className="pharmacy-page-title">Pharmacy onboarding</h2>
          <p className="pharmacy-page-subtitle">Submit once. Pending stays here until an admin activates it on Pharmacy partners.</p>
          {error ? <Alert color="danger">{error}</Alert> : null}
          {submitted ? (
            <>
              <Alert color="success" className="mb-3">
                {submitted.message || "Pharmacy stored as pending until admin activation."}
              </Alert>
              <Card className="admin-dash-card">
                <CardBody>
                  <h5 className="mb-3">Submitted for activation</h5>
                  <Row className="g-3">
                    <Col md={4}>
                      <FormGroup>
                        <Label>Pharmacy name</Label>
                        <Input value={submitted.name} disabled />
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
                        <Label>Licence expiry</Label>
                        <Input value={submitted.expiryDate} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Service area</Label>
                        <Input value={submitted.area} disabled />
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Label>Status</Label>
                        <Input value={submitted.status || "PENDING"} disabled />
                      </FormGroup>
                    </Col>
                  </Row>
                  <p className="text-muted small mb-3">
                    {submitted.name} is {String(submitted.status || "PENDING").toUpperCase() === "ACTIVE" ? "activated" : "pending"}.
                    {submitted.pharmacyPartnerId ? ` Id ${submitted.pharmacyPartnerId}.` : ""}
                  </p>
                  <Button
                    color="soft-secondary"
                    onClick={() => {
                      setSubmitted(null);
                      setNote("");
                      setError("");
                    }}
                  >
                    Submit another pharmacy
                  </Button>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card className="admin-dash-card">
              <CardBody>
                <Row className="g-3">
                  <Col md={4}>
                    <FormGroup>
                      <Label>Pharmacy name</Label>
                      <Input value={onboard.name} onChange={(e) => setOnboard({ ...onboard, name: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Mobile</Label>
                      <Input value={onboard.mobile} onChange={(e) => setOnboard({ ...onboard, mobile: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence number</Label>
                      <Input value={onboard.licenceNumber} onChange={(e) => setOnboard({ ...onboard, licenceNumber: e.target.value })} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Label>Licence expiry</Label>
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
                <Button className="pharmacy-primary-btn mt-2" disabled={busyId === "onboard"} onClick={saveOnboard}>
                  {busyId === "onboard" ? "Submitting…" : "Submit for activation"}
                </Button>
              </CardBody>
            </Card>
          )}
          <Card className="admin-dash-card mt-3">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Submitted pharmacies</h5>
                <Button size="sm" color="soft-secondary" onClick={loadMine}>Refresh</Button>
              </div>
              <p className="text-muted small">Pending means submitted and waiting for admin. Active means activated.</p>
              {mine.length === 0 ? (
                <p className="text-muted mb-0">Nothing submitted on this login yet.</p>
              ) : (
                <Table size="sm" className="mb-0">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Name</th>
                      <th>Area</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mine.map((row) => {
                      const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
                      const status = String(row.status || row.Status || "PENDING");
                      return (
                        <tr key={id}>
                          <td>{id || "—"}</td>
                          <td>{row.name || row.Name || "—"}</td>
                          <td>{row.area || row.Area || "—"}</td>
                          <td>{status.toUpperCase() === "ACTIVE" ? "Activated" : status || "Pending"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
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
          <Button size="sm" color="soft-secondary" disabled={busy} onClick={() => requestOtp(id)}>
            {otpSentById[id] ? "Resend OTP" : "Send OTP"}
          </Button>
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
          <Button size="sm" color="soft-success" disabled={busy || otp.length !== 6} onClick={() => acceptOrder(id)}>
            Accept
          </Button>
          <Button size="sm" color="soft-danger" disabled={busy} onClick={() => rejectOrder(id)}>
            Reject
          </Button>
        </div>
      );
    }

    if (status === "ACCEPTED") {
      return (
        <div className="d-flex flex-wrap gap-1 align-items-center">
          <Input
            bsSize="sm"
            type="number"
            min="1"
            style={{ width: 110 }}
            placeholder="Amount ₹"
            value={quoteById[id] || ""}
            disabled={busy}
            onChange={(e) => setQuoteById({ ...quoteById, [id]: e.target.value })}
          />
          <Button size="sm" color="soft-primary" disabled={busy || !(Number(quoteById[id]) > 0)} onClick={() => saveQuote(id)}>
            Send quote
          </Button>
          {!isQuotes ? (
            <Button size="sm" color="soft-danger" disabled={busy} onClick={() => rejectOrder(id)}>
              Reject
            </Button>
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
          Mark ready
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
          Dispatch
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
          Mark delivered
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
    return (
      <Row className="g-3">
        <Col md={6}>
          <h6 className="mb-2">Medicines</h6>
          {items.length === 0 ? (
            <p className="small text-muted mb-0">No medicines on this order.</p>
          ) : (
            <ul className="small mb-0 ps-3">
              {items.map((item, index) => (
                <li key={`${field(item, "remedyCode")}-${index}`}>
                  {field(item, "remedyName") || `Remedy code ${field(item, "remedyCode") || "—"} (name shown after accept)`}
                </li>
              ))}
            </ul>
          )}
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
                  {field(event, "detail") ? ` · ${field(event, "detail")}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Col>
      </Row>
    );
  };

  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="pharmacy-page-title mb-1">{isQuotes ? "Quotes" : "Medicine orders"}</h2>
            <p className="pharmacy-page-subtitle mb-0">
              {isQuotes
                ? "Accepted orders waiting for a price, and quotes waiting for the patient."
                : "Send the OTP and accept or reject new offers, quote a price, then mark ready and dispatch after the patient pays."}
            </p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={loadOrders} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
        {error ? <Alert color="danger" toggle={() => setError("")}>{error}</Alert> : null}
        {note ? <Alert color="success" toggle={() => setNote("")}>{note}</Alert> : null}
        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : visibleRows.length === 0 ? (
              <p className="text-muted mb-0">
                {isQuotes
                  ? "No orders are waiting for a quote. Accept the order on Medicine orders first."
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
                      <th>Received</th>
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
                      const payMode = field(row, "payMode");
                      return (
                        <React.Fragment key={id}>
                          <tr>
                            <td>
                              <div className="fw-semibold">#{id}</div>
                              <div className="small text-muted">
                                eRx #{field(row, "erxSnapshotId") ?? "—"} · {field(row, "itemCount") ?? 0} item(s)
                              </div>
                              {field(row, "pharmacyName") ? (
                                <div className="small text-muted">{field(row, "pharmacyName")}</div>
                              ) : null}
                            </td>
                            <td>
                              {patientName ? (
                                <>
                                  <div>{patientName}</div>
                                  <div className="small text-muted">
                                    {[mobile, address].filter(Boolean).join(" · ") || "—"}
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
                            <td className="small">{formatDateTime(field(row, "createdAt"))}</td>
                            <td>{renderActions(row)}</td>
                            <td>
                              <Button size="sm" color="link" className="p-0" onClick={() => toggleDetail(id)}>
                                {openId === id ? "Hide" : "Details"}
                              </Button>
                            </td>
                          </tr>
                          {openId === id ? (
                            <tr>
                              <td colSpan={7} className="bg-light">
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
