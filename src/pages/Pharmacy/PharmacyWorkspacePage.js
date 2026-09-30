import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  acceptMedicineOrder,
  dispatchMedicine,
  markMedicineReady,
  medicineAcceptOtp,
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

const PharmacyWorkspacePage = ({ mode = "orders" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [otpById, setOtpById] = useState({});
  const [quoteById, setQuoteById] = useState({});
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
      // Pharmacy console uses patient medicine-order list until a dedicated queue endpoint is filtered by partner.
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

  return (
    <div className="page-content admin-dashboard-page pharmacy-dashboard-page clinic-workspace-page">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="pharmacy-page-title mb-1">{isQuotes ? "Quotes" : "Medicine orders"}</h2>
            <p className="pharmacy-page-subtitle mb-0">
              {isQuotes
                ? "Orders that are accepted and waiting for a price. Stock, ready, and dispatch stay on Medicine orders."
                : "Confirm the OTP, accept or reject stock, then mark ready and dispatch after the patient pays."}
            </p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={loadOrders} disabled={loading}>Refresh</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card className="admin-dash-card">
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : visibleRows.length === 0 ? (
              <p className="text-muted mb-0">
                {isQuotes
                  ? "No orders are waiting for a quote. Accept the order on Medicine orders first."
                  : "No medicine orders yet."}
              </p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>{isQuotes ? "Amount" : "Quote"}</th>
                      <th>{isQuotes ? "Save quote" : "Fulfilment"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const id = orderIdOf(row);
                      const status = orderStatus(row);
                      const savedQuote = quoteAmountOf(row);
                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{status || "—"}</td>
                          <td>
                            {isQuotes && status === "ACCEPTED" ? (
                              <Input
                                bsSize="sm"
                                type="number"
                                style={{ width: 110 }}
                                placeholder="Amount"
                                value={quoteById[id] || ""}
                                onChange={(e) => setQuoteById({ ...quoteById, [id]: e.target.value })}
                              />
                            ) : (
                              savedQuote !== "" && savedQuote != null ? savedQuote : "—"
                            )}
                          </td>
                          <td>
                            {isQuotes ? (
                              status === "ACCEPTED" ? (
                                <Button
                                  size="sm"
                                  color="soft-primary"
                                  disabled={busyId === id}
                                  onClick={async () => {
                                    setBusyId(id);
                                    try {
                                      await quoteMedicineOrder(id, { amount: Number(quoteById[id] || 0) });
                                      setNote(`Quote saved for order ${id}.`);
                                      await loadOrders();
                                    } catch (err) {
                                      setError(s4Message(err));
                                    } finally {
                                      setBusyId(null);
                                    }
                                  }}
                                >
                                  Save quote
                                </Button>
                              ) : (
                                <span className="text-muted">Quote saved</span>
                              )
                            ) : (
                            <div className="d-flex flex-wrap gap-1 align-items-center">
                              <Button
                                size="sm"
                                color="soft-secondary"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await medicineAcceptOtp(id);
                                    setNote(`OTP requested for order #${id}.`);
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                OTP
                              </Button>
                              <Input
                                bsSize="sm"
                                style={{ width: 80 }}
                                placeholder="OTP"
                                value={otpById[id] || ""}
                                onChange={(e) => setOtpById({ ...otpById, [id]: e.target.value })}
                              />
                              <Button
                                size="sm"
                                color="soft-success"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await acceptMedicineOrder(id, {
                                      otp: otpById[id] || "",
                                      stockConfirmed: true,
                                    });
                                    setNote(`Order #${id} accepted. Remedy names are revealed after OTP.`);
                                    await loadOrders();
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                color="soft-danger"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await rejectMedicineOrder(id, { reason: "OUT_OF_STOCK" });
                                    setNote(`Order #${id} rejected.`);
                                    await loadOrders();
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                Out of stock
                              </Button>
                              <Button
                                size="sm"
                                color="soft-info"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await markMedicineReady(id);
                                    setNote(`Order #${id} marked ready.`);
                                    await loadOrders();
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                Ready
                              </Button>
                              <Button
                                size="sm"
                                color="soft-dark"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await dispatchMedicine(id);
                                    setNote(`Order #${id} dispatched.`);
                                    await loadOrders();
                                  } catch (err) {
                                    setError(s4Message(err));
                                  } finally {
                                    setBusyId(null);
                                  }
                                }}
                              >
                                Dispatch
                              </Button>
                            </div>
                            )}
                          </td>
                        </tr>
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
