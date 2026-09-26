import React, { useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Container, Input, Spinner, Table } from "reactstrap";
import { listMedicineExceptions, rerouteMedicine, s4Message, unwrapS4 } from "../../../helpers/s4Week4Api";

/**
 * MED-12 — admin HomeoMeds exception queue + re-route (New API :5002).
 */
const HomemedsExceptionsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pharmacyById, setPharmacyById] = useState({});

  document.title = "HomeoMeds exceptions | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listMedicineExceptions();
      const data = unwrapS4(response);
      setRows(Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.items) ? data.items : []);
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

  return (
    <div className="page-content">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-1">HomeoMeds exceptions</h4>
            <p className="text-muted mb-0">Failed or stuck medicine orders — re-route to another pharmacy partner.</p>
          </div>
          <Button size="sm" color="soft-secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Card>
          <CardBody>
            {loading ? (
              <div className="text-center py-4"><Spinner size="sm" /> Loading…</div>
            ) : rows.length === 0 ? (
              <p className="text-muted mb-0">No medicine exceptions.</p>
            ) : (
              <div className="table-responsive">
                <Table size="sm" className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Detail</th>
                      <th>Re-route pharmacy id</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const id = row.medicineOrderId || row.MedicineOrderId || row.orderId || row.id;
                      return (
                        <tr key={id}>
                          <td>#{id}</td>
                          <td>{row.status || row.Status || "—"}</td>
                          <td className="small text-muted">{row.detail || row.Detail || row.reason || "—"}</td>
                          <td>
                            <Input
                              bsSize="sm"
                              type="number"
                              style={{ width: 120 }}
                              value={pharmacyById[id] || ""}
                              onChange={(e) => setPharmacyById({ ...pharmacyById, [id]: e.target.value })}
                            />
                          </td>
                          <td>
                            <Button
                              size="sm"
                              color="soft-primary"
                              disabled={busyId === id || !pharmacyById[id]}
                              onClick={async () => {
                                setBusyId(id);
                                setError("");
                                try {
                                  await rerouteMedicine(id, Number(pharmacyById[id]));
                                  setNote(`Order #${id} re-routed.`);
                                  await load();
                                } catch (err) {
                                  setError(s4Message(err));
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                            >
                              Re-route
                            </Button>
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

export default HomemedsExceptionsPage;
