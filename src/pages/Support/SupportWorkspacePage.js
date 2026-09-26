import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import {
  addSupportTicketMessage,
  createSupportTicket,
  listAdminSupportTickets,
  listMySupportTickets,
  listSupportTicketMessages,
  updateSupportTicket,
} from "../../helpers/realbackend_helper";

const unwrap = (response) => {
  const body = response?.data ?? response;
  const data = body?.data ?? body?.Data ?? body;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  if (Array.isArray(data?.items)) return data.items;
  return data;
};

const SupportWorkspacePage = ({ mode = "mine" }) => {
  const isAdmin = mode === "admin";
  const { ticketId: routeTicketId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ category: "General", subject: "", body: "" });
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Open");

  document.title = isAdmin ? "Support tickets | Niga Homeocentrum" : "Support | Niga Homeocentrum";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = isAdmin ? await listAdminSupportTickets() : await listMySupportTickets();
      const list = unwrap(response);
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setRows([]);
      setError(err?.message || "Could not load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  useEffect(() => {
    const id = Number(routeTicketId);
    if (id > 0) openThread(id);
  }, [routeTicketId]);

  const openThread = async (ticketId) => {
    setActiveId(ticketId);
    setReply("");
    try {
      const response = await listSupportTicketMessages(ticketId);
      const list = unwrap(response);
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      setMessages([]);
      setError(err?.message || "Could not load messages.");
    }
  };

  const createTicket = async () => {
    setError("");
    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }
    try {
      await createSupportTicket({
        category: form.category,
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      setNote("Ticket created.");
      setForm({ category: "General", subject: "", body: "" });
      await load();
    } catch (err) {
      setError(err?.message || "Could not create the ticket.");
    }
  };

  const sendReply = async () => {
    if (!activeId || !reply.trim()) return;
    try {
      await addSupportTicketMessage(activeId, { body: reply.trim() });
      setReply("");
      await openThread(activeId);
    } catch (err) {
      setError(err?.message || "Could not send the message.");
    }
  };

  const saveAdmin = async () => {
    if (!activeId) return;
    try {
      await updateSupportTicket(activeId, { status });
      setNote("Ticket updated.");
      await load();
    } catch (err) {
      setError(err?.message || "Could not update the ticket.");
    }
  };

  const ticketIdOf = (row) => row.supportTicketId || row.SupportTicketId || row.id;

  return (
    <div className="page-content">
      <Container fluid>
        <h4>{isAdmin ? "Support tickets" : "My support tickets"}</h4>
        <p className="text-muted">
          {isAdmin
            ? "Assign status and reply on clinic issues."
            : "Open a ticket and follow the thread with clinic staff."}
        </p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        <Row className="g-3">
          <Col lg={5}>
            {!isAdmin ? (
              <Card className="mb-3">
                <CardBody>
                  <Label>Category</Label>
                  <Input
                    className="mb-2"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  />
                  <Label>Subject</Label>
                  <Input
                    className="mb-2"
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  />
                  <Label>Details</Label>
                  <Input
                    type="textarea"
                    className="mb-2"
                    value={form.body}
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  />
                  <Button color="primary" onClick={createTicket}>
                    Create ticket
                  </Button>
                </CardBody>
              </Card>
            ) : null}
            <Card>
              <CardBody>
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <Table responsive size="sm">
                    <thead>
                      <tr>
                        <th>Id</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const id = ticketIdOf(row);
                        return (
                          <tr
                            key={id}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              openThread(id);
                              if (isAdmin) navigate(`/admin/support-tickets/${id}`);
                            }}
                          >
                            <td>{id}</td>
                            <td>{row.subject || row.Subject}</td>
                            <td>{row.status || row.Status}</td>
                            <td>{String(row.slaDueAt || row.SlaDueAt || "—").slice(0, 16)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col lg={7}>
            <Card>
              <CardBody>
                {!activeId ? (
                  <p className="text-muted mb-0">Select a ticket to read the thread.</p>
                ) : (
                  <>
                    {isAdmin ? (
                      <div className="d-flex gap-2 mb-3">
                        <Input type="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                          <option>Open</option>
                          <option>InProgress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </Input>
                        <Button color="soft-secondary" onClick={saveAdmin}>
                          Save status
                        </Button>
                      </div>
                    ) : null}
                    <div style={{ maxHeight: 320, overflow: "auto" }} className="mb-3">
                      {messages.map((msg) => (
                        <p key={msg.supportMessageId || msg.SupportMessageId || msg.id} className="mb-2">
                          <strong>{msg.authorRole || msg.AuthorRole || "User"}:</strong>{" "}
                          {msg.body || msg.Body}
                        </p>
                      ))}
                    </div>
                    <Input
                      type="textarea"
                      className="mb-2"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <Button color="primary" onClick={sendReply}>
                      Reply
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SupportWorkspacePage;
