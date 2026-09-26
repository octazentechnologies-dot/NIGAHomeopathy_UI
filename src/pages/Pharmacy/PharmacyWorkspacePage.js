import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  acceptMedicineOrder,
  dispatchMedicine,
  markMedicineReady,
  medicineAcceptOtp,
  onboardPharmacy,
  pharmacyQueue,
  quoteMedicineOrder,
  rejectMedicineOrder,
  s4Message,
  unwrapS4,
} from "../../helpers/s4Week4Api";

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

  document.title = `${mode === "onboarding" ? "Pharmacy onboarding" : "Pharmacy orders"} | Niga Homeocentrum`;

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

  useEffect(() => {
    if (mode === "orders" || mode === "quotes") loadOrders();
    else setLoading(false);
  }, [mode]);

  const saveOnboard = async () => {
    setBusyId("onboard");
    setError("");
    try {
      const response = await onboardPharmacy({
        name: onboard.name.trim(),
        mobile: onboard.mobile.trim(),
        licenceNumber: onboard.licenceNumber.trim(),
        expiryDate: onboard.expiryDate,
        area: onboard.area.trim(),
      });
      setNote(unwrapS4(response)?.message || response?.message || "Pharmacy partner submitted for activation.");
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  if (mode === "onboarding") {
    return (
      <div className="page-content">
        <Container fluid>
          <h4>Pharmacy onboarding</h4>
          <p className="text-muted">Licensed premises details for HomeoMeds activation.</p>
          {error ? <Alert color="danger">{error}</Alert> : null}
          {note ? <Alert color="success">{note}</Alert> : null}
          <Card>
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
                    <Input type="date" value={onboard.expiryDate} onChange={(e) => setOnboard({ ...onboard, expiryDate: e.target.value })} />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label>Service area</Label>
                    <Input value={onboard.area} onChange={(e) => setOnboard({ ...onboard, area: e.target.value })} />
                  </FormGroup>
                </Col>
              </Row>
              <Button color="primary" className="mt-2" disabled={busyId === "onboard"} onClick={saveOnboard}>
                Submit for activation
              </Button>
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-content">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">{mode === "quotes" ? "Quotes" : "Medicine orders"}</h4>
            <p className="text-muted mb-0">Accept with OTP, confirm stock, and enter the quote before payment.</p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={loadOrders} disabled={loading}>Refresh</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : rows.length === 0 ? (
              <p className="text-muted mb-0">No medicine orders yet.</p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Quote</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const id = row.medicineOrderId || row.MedicineOrderId || row.id;
                      return (
                        <tr key={id}>
                          <td>#{id}</td>
                          <td>{row.status || row.Status || "—"}</td>
                          <td>
                            <Input
                              bsSize="sm"
                              type="number"
                              style={{ width: 110 }}
                              placeholder="Amount"
                              value={quoteById[id] || ""}
                              onChange={(e) => setQuoteById({ ...quoteById, [id]: e.target.value })}
                            />
                          </td>
                          <td>
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
                                color="soft-primary"
                                disabled={busyId === id}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await quoteMedicineOrder(id, { amount: Number(quoteById[id] || 0) });
                                    setNote(`Quote saved for order #${id}.`);
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
