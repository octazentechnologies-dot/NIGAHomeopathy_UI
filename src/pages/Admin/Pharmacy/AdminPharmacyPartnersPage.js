import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap";
import { activatePharmacy, listPharmacyPartners, s4Message, savePharmacyRouting, sweepPharmacyLicences, unwrapS4 } from "../../../helpers/s4Week4Api";

/**
 * MED pharmacy partner admin — list pending/active partners and activate (New API :5002).
 */
const AdminPharmacyPartnersPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [routing, setRouting] = useState({
    pharmacyPartnerId: "",
    area: "",
    openTime: "09:00",
    closeTime: "21:00",
    capacity: "20",
  });

  document.title = "Pharmacy partners | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listPharmacyPartners();
      const data = unwrapS4(response);
      setRows(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setRows([]);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sweep = async () => {
    setBusyId("sweep");
    setError("");
    try {
      await sweepPharmacyLicences();
      setNote("Expired licences swept.");
      await load();
    } catch (err) {
      setError(s4Message(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">Pharmacy partners</h4>
            <p className="text-muted mb-0">Activate HomeoMeds partners. Expired licences are excluded from seller routing after a sweep.</p>
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" color="soft-warning" onClick={sweep} disabled={busyId === "sweep"}>
              Sweep licences
            </Button>
            <Button size="sm" color="soft-secondary" onClick={load} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : rows.length === 0 ? (
              <p className="text-muted mb-0">No pharmacy partners yet.</p>
            ) : (
              <Table size="sm" className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Area</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const id = row.pharmacyPartnerId || row.PharmacyPartnerId || row.id;
                    const status = String(row.status || row.Status || "");
                    return (
                      <tr key={id}>
                        <td>#{id}</td>
                        <td>{row.name || row.Name || "—"}</td>
                        <td>{row.area || row.Area || "—"}</td>
                        <td>{status || "—"}</td>
                        <td>
                          {status.toUpperCase() !== "ACTIVE" ? (
                            <Button
                              size="sm"
                              color="soft-success"
                              disabled={busyId === id}
                              onClick={async () => {
                                setBusyId(id);
                                try {
                                  await activatePharmacy(id);
                                  setNote(`Pharmacy #${id} activated.`);
                                  await load();
                                } catch (err) {
                                  setError(s4Message(err));
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                            >
                              Activate
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
        <Card className="mt-3">
          <CardBody>
            <h5>Seller routing hours</h5>
            <Row className="g-2">
              <Col md={2}>
                <FormGroup>
                  <Label>Partner id</Label>
                  <Input
                    type="number"
                    value={routing.pharmacyPartnerId}
                    onChange={(e) => setRouting({ ...routing, pharmacyPartnerId: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Area</Label>
                  <Input value={routing.area} onChange={(e) => setRouting({ ...routing, area: e.target.value })} />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Open</Label>
                  <Input type="time" value={routing.openTime} onChange={(e) => setRouting({ ...routing, openTime: e.target.value })} />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Close</Label>
                  <Input type="time" value={routing.closeTime} onChange={(e) => setRouting({ ...routing, closeTime: e.target.value })} />
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={routing.capacity}
                    onChange={(e) => setRouting({ ...routing, capacity: e.target.value })}
                  />
                </FormGroup>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  color="primary"
                  className="mb-3"
                  disabled={busyId === "routing" || !routing.pharmacyPartnerId}
                  onClick={async () => {
                    setBusyId("routing");
                    setError("");
                    try {
                      await savePharmacyRouting({
                        pharmacyPartnerId: Number(routing.pharmacyPartnerId),
                        area: routing.area.trim() || null,
                        openTime: routing.openTime,
                        closeTime: routing.closeTime,
                        capacity: Number(routing.capacity || 20),
                      });
                      setNote("Routing rule saved.");
                    } catch (err) {
                      setError(s4Message(err));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  Save routing
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default AdminPharmacyPartnersPage;
