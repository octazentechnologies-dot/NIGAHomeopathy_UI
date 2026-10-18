import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, CardBody, Col, Container, Input, Label, Row, Spinner, Table } from "reactstrap";
import { clinicMessage, unwrapClinic } from "../../../helpers/doctorClinicApi";
import {
  acceptWaitlistOffer,
  cancelPatientAppointmentRequest,
  checkInVisit,
  createPatientAppointmentRequest,
  deleteDeliveryAddress,
  deletePatientReminder,
  listDeliveryAddresses,
  listPatientAppointmentRequests,
  listPatientReminders,
  listPatientVisits,
  listWaitlistOffers,
  respondPatientAppointmentRequest,
  saveDeliveryAddress,
  savePatientReminder,
} from "../../../helpers/patientCareApi";
import {
  getPatientProfileMe,
  getRegistrationCities,
  getRegistrationCountries,
  getRegistrationDistricts,
  getRegistrationPinCodes,
  getRegistrationStates,
} from "../../../helpers/realbackend_helper";

const emptyAddress = { label: "", line1: "", line2: "", city: "", state: "", pincode: "", phone: "", isDefault: false, countryId: "", stateId: "", districtId: "", cityId: "" };
const emptyReminder = { title: "", dueAt: "", kind: "", isDone: false };

const options = (rows, idKeys, nameKeys) =>
  (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      id: Number(idKeys.map((key) => row?.[key]).find((value) => value != null && value !== "")),
      name: String(nameKeys.map((key) => row?.[key]).find(Boolean) || "").trim(),
    }))
    .filter((row) => Number.isFinite(row.id) && row.id > 0 && row.name);

const PatientCareHub = ({ tab = "addresses" }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [editId, setEditId] = useState(null);
  const [reminder, setReminder] = useState(emptyReminder);
  const [reminderId, setReminderId] = useState(null);
  const [request, setRequest] = useState({ doctorId: "", requestedDate: "", requestedTime: "10:00", consultMode: "CLINIC", reason: "" });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [pins, setPins] = useState([]);
  const [mobile, setMobile] = useState("");
  const [patientId, setPatientId] = useState(null);

  document.title = "Patient care | Niga Homeocentrum";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "addresses") {
        const data = unwrapClinic(await listDeliveryAddresses());
        setRows(Array.isArray(data) ? data : []);
      } else if (tab === "reminders") {
        const data = unwrapClinic(await listPatientReminders());
        setRows(Array.isArray(data) ? data : []);
      } else if (tab === "requests") {
        const data = unwrapClinic(await listPatientAppointmentRequests());
        const list = Array.isArray(data) ? data : data?.data || data?.items || data?.rows || [];
        setRows(Array.isArray(list) ? list : []);
      } else if (tab === "waitlist") {
        const profile = unwrapClinic(await getPatientProfileMe());
        const id = profile?.patientId || profile?.PatientId;
        const phone = profile?.mobileNo || profile?.MobileNo || "";
        setPatientId(id || null);
        setMobile(phone);
        const data = unwrapClinic(await listWaitlistOffers(id ? { patientId: id } : { contactMobile: phone }));
        const list = Array.isArray(data) ? data : data?.data || [];
        setRows(Array.isArray(list) ? list : []);
      } else if (tab === "checkin") {
        const today = new Date().toISOString().slice(0, 10);
        const data = unwrapClinic(await listPatientVisits({ fromDate: today, toDate: today, pageSize: 50 }));
        const list = Array.isArray(data) ? data : data?.data || data?.items || data?.rows || [];
        setRows(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(clinicMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== "addresses") return;
    getRegistrationCountries().then((list) => setCountries(options(list, ["countryId", "CountryId"], ["countryName", "CountryName"]))).catch(() => {});
  }, [tab]);

  const chooseCountry = async (countryId) => {
    setAddress((prev) => ({ ...prev, countryId, stateId: "", districtId: "", cityId: "", state: "", city: "", pincode: "" }));
    setStates([]);
    setDistricts([]);
    setCities([]);
    setPins([]);
    if (!countryId) return;
    const list = await getRegistrationStates(countryId).catch(() => []);
    setStates(options(list, ["stateId", "StateId"], ["stateName", "StateName"]));
  };

  const chooseState = async (stateId) => {
    const name = states.find((row) => String(row.id) === String(stateId))?.name || "";
    setAddress((prev) => ({ ...prev, stateId, state: name, districtId: "", cityId: "", city: "", pincode: "" }));
    setDistricts([]);
    setCities([]);
    setPins([]);
    if (!stateId) return;
    const list = await getRegistrationDistricts(stateId).catch(() => []);
    setDistricts(options(list, ["districtId", "DistrictId"], ["districtName", "DistrictName"]));
  };

  const chooseDistrict = async (districtId) => {
    setAddress((prev) => ({ ...prev, districtId, cityId: "", city: "", pincode: "" }));
    setCities([]);
    setPins([]);
    if (!districtId) return;
    const list = await getRegistrationCities(districtId).catch(() => []);
    setCities(options(list, ["cityId", "CityId"], ["cityName", "CityName"]));
  };

  const chooseCity = async (cityId) => {
    const name = cities.find((row) => String(row.id) === String(cityId))?.name || "";
    setAddress((prev) => ({ ...prev, cityId, city: name, pincode: "" }));
    setPins([]);
    if (!cityId) return;
    const list = await getRegistrationPinCodes(cityId).catch(() => []);
    setPins((Array.isArray(list) ? list : []).map((row) => ({
      id: row.pinCodeId || row.PinCodeId,
      name: row.pinCode || row.PinCode,
    })).filter((row) => row.id && row.name));
  };

  const run = async (work) => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await work();
      await load();
    } catch (err) {
      setError(clinicMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveAddress = () => run(async () => {
    if (!address.line1.trim()) throw new Error("Address line 1 is required.");
    await saveDeliveryAddress({
      label: address.label.trim() || null,
      line1: address.line1.trim(),
      line2: address.line2.trim() || null,
      city: address.city.trim() || null,
      state: address.state.trim() || null,
      pincode: address.pincode.trim() || null,
      phone: address.phone.trim() || null,
      isDefault: Boolean(address.isDefault),
    }, editId);
    setAddress(emptyAddress);
    setEditId(null);
    setNote(editId ? "Address updated." : "Address saved.");
  });

  const saveReminder = () => run(async () => {
    if (!reminder.title.trim() || !reminder.dueAt) throw new Error("Title and due time are required.");
    await savePatientReminder({
      title: reminder.title.trim(),
      dueAt: reminder.dueAt,
      kind: reminder.kind.trim() || null,
      isDone: Boolean(reminder.isDone),
    }, reminderId);
    setReminder(emptyReminder);
    setReminderId(null);
    setNote(reminderId ? "Reminder updated." : "Reminder saved.");
  });

  const titles = {
    addresses: ["Delivery addresses", "Save, edit, and delete addresses used for medicine delivery."],
    reminders: ["Reminders", "Create and edit reminders for this account."],
    requests: ["Appointment requests", "Ask a doctor for a time, and answer a proposed time."],
    waitlist: ["Waitlist offers", "When a slot opens, accept the offer here."],
    checkin: ["Visit check-in", "Check in for today's clinic visit."],
  };
  const [title, subtitle] = titles[tab] || titles.addresses;

  return (
    <div className="page-content admin-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">{title}</h2>
        <p className="clinic-page-subtitle">{subtitle}</p>
        {error ? <Alert color="danger">{error}</Alert> : null}
        {note ? <Alert color="success">{note}</Alert> : null}
        {loading ? <Spinner size="sm" /> : null}

        {tab === "addresses" ? (
          <>
            <Card className="admin-dash-card mb-3"><CardBody>
              <Row className="g-2">
                <Col md={3}><Label>Label</Label><Input value={address.label} onChange={(e) => setAddress({ ...address, label: e.target.value })} /></Col>
                <Col md={5}><Label>Line 1</Label><Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} /></Col>
                <Col md={4}><Label>Line 2</Label><Input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} /></Col>
                <Col md={3}><Label>Country</Label>
                  <Input type="select" value={address.countryId} onChange={(e) => chooseCountry(e.target.value)}>
                    <option value="">Select</option>
                    {countries.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </Input>
                </Col>
                <Col md={3}><Label>State</Label>
                  <Input type="select" value={address.stateId} onChange={(e) => chooseState(e.target.value)}>
                    <option value="">Select</option>
                    {states.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </Input>
                </Col>
                <Col md={3}><Label>District</Label>
                  <Input type="select" value={address.districtId} onChange={(e) => chooseDistrict(e.target.value)}>
                    <option value="">Select</option>
                    {districts.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </Input>
                </Col>
                <Col md={3}><Label>City</Label>
                  <Input type="select" value={address.cityId} onChange={(e) => chooseCity(e.target.value)}>
                    <option value="">Select</option>
                    {cities.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                  </Input>
                </Col>
                <Col md={3}><Label>Pincode</Label>
                  <Input type="select" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })}>
                    <option value="">Select</option>
                    {pins.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
                  </Input>
                </Col>
                <Col md={3}><Label>Phone</Label><Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></Col>
                <Col md={3} className="d-flex align-items-end">
                  <Label check><Input type="checkbox" checked={address.isDefault} onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })} /> Default</Label>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <Button color="primary" disabled={busy} onClick={saveAddress}>{editId ? "Update address" : "Save address"}</Button>
                </Col>
              </Row>
            </CardBody></Card>
            <Table responsive>
              <thead><tr><th>Label</th><th>Address</th><th>Phone</th><th /></tr></thead>
              <tbody>
                {rows.map((row) => {
                  const id = row.deliveryAddressId || row.addressId;
                  return (
                    <tr key={id}>
                      <td>{row.label || (row.isDefault ? "Default" : "—")}</td>
                      <td>{[row.line1, row.line2, row.city, row.state, row.pincode].filter(Boolean).join(", ")}</td>
                      <td>{row.phone || "—"}</td>
                      <td className="text-end">
                        <Button size="sm" color="light" className="me-2" onClick={() => { setEditId(id); setAddress({ ...emptyAddress, ...row, isDefault: Boolean(row.isDefault) }); }}>Edit</Button>
                        <Button size="sm" color="danger" outline disabled={busy} onClick={() => run(() => deleteDeliveryAddress(id))}>Delete</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        ) : null}

        {tab === "reminders" ? (
          <>
            <Card className="admin-dash-card mb-3"><CardBody>
              <Row className="g-2 align-items-end">
                <Col md={4}><Label>Title</Label><Input value={reminder.title} onChange={(e) => setReminder({ ...reminder, title: e.target.value })} /></Col>
                <Col md={3}><Label>Due</Label><Input type="datetime-local" value={reminder.dueAt} onChange={(e) => setReminder({ ...reminder, dueAt: e.target.value })} /></Col>
                <Col md={2}><Label>Kind</Label><Input value={reminder.kind} onChange={(e) => setReminder({ ...reminder, kind: e.target.value })} /></Col>
                <Col md={3}><Button color="primary" disabled={busy} onClick={saveReminder}>{reminderId ? "Update" : "Save"}</Button></Col>
              </Row>
            </CardBody></Card>
            <Table responsive>
              <thead><tr><th>Title</th><th>Due</th><th>Kind</th><th>Done</th><th /></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.patientReminderId}>
                    <td>{row.title}</td>
                    <td>{row.dueAt ? String(row.dueAt).replace("T", " ").slice(0, 16) : "—"}</td>
                    <td>{row.kind || "—"}</td>
                    <td>{row.isDone ? "Yes" : "No"}</td>
                    <td className="text-end">
                      <Button size="sm" color="light" className="me-2" onClick={() => {
                        setReminderId(row.patientReminderId);
                        setReminder({ title: row.title || "", dueAt: row.dueAt ? String(row.dueAt).slice(0, 16) : "", kind: row.kind || "", isDone: Boolean(row.isDone) });
                      }}>Edit</Button>
                      <Button size="sm" color="danger" outline disabled={busy} onClick={() => run(() => deletePatientReminder(row.patientReminderId))}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : null}

        {tab === "requests" ? (
          <>
            <Card className="admin-dash-card mb-3"><CardBody>
              <Row className="g-2 align-items-end">
                <Col md={2}><Label>Doctor id</Label><Input value={request.doctorId} onChange={(e) => setRequest({ ...request, doctorId: e.target.value })} /></Col>
                <Col md={2}><Label>Date</Label><Input type="date" value={request.requestedDate} onChange={(e) => setRequest({ ...request, requestedDate: e.target.value })} /></Col>
                <Col md={2}><Label>Time</Label><Input type="time" value={request.requestedTime} onChange={(e) => setRequest({ ...request, requestedTime: e.target.value })} /></Col>
                <Col md={2}><Label>Mode</Label>
                  <Input type="select" value={request.consultMode} onChange={(e) => setRequest({ ...request, consultMode: e.target.value })}>
                    <option value="CLINIC">Clinic</option>
                    <option value="TELE">Tele</option>
                  </Input>
                </Col>
                <Col md={3}><Label>Reason</Label><Input value={request.reason} onChange={(e) => setRequest({ ...request, reason: e.target.value })} /></Col>
                <Col md={1}>
                  <Button color="primary" disabled={busy} onClick={() => run(async () => {
                    await createPatientAppointmentRequest({
                      doctorId: Number(request.doctorId),
                      requestedDate: request.requestedDate,
                      requestedTime: request.requestedTime,
                      consultMode: request.consultMode,
                      reason: request.reason || null,
                    });
                    setNote("Request sent.");
                  })}>Send</Button>
                </Col>
              </Row>
            </CardBody></Card>
            <Table responsive>
              <thead><tr><th>Doctor</th><th>Requested</th><th>Status</th><th>Proposed</th><th /></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.appointmentRequestId}>
                    <td>{row.doctorName || row.doctorId}</td>
                    <td>{row.requestedDate} {row.requestedTime}</td>
                    <td>{row.status}</td>
                    <td>{row.proposedDate ? `${row.proposedDate} ${row.proposedTime || ""}` : "—"}</td>
                    <td className="text-end">
                      {String(row.status).toUpperCase() === "PROPOSED" ? (
                        <>
                          <Button size="sm" color="success" className="me-2" disabled={busy} onClick={() => run(() => respondPatientAppointmentRequest(row.appointmentRequestId, "ACCEPT"))}>Accept</Button>
                          <Button size="sm" color="danger" outline disabled={busy} onClick={() => run(() => respondPatientAppointmentRequest(row.appointmentRequestId, "DECLINE"))}>Decline</Button>
                        </>
                      ) : (
                        <Button size="sm" color="light" disabled={busy} onClick={() => run(() => cancelPatientAppointmentRequest(row.appointmentRequestId))}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : null}

        {tab === "waitlist" ? (
          <>
            <p className="text-muted">Offers for {patientId ? `patient ${patientId}` : mobile || "this account"}.</p>
            <Table responsive>
              <thead><tr><th>Doctor</th><th>Date</th><th>Mode</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={5} className="text-muted">No open waitlist offers.</td></tr> : rows.map((row) => (
                  <tr key={row.bookingWaitlistId}>
                    <td>{row.doctorId}</td>
                    <td>{row.requestedDate ? String(row.requestedDate).slice(0, 10) : "—"}</td>
                    <td>{row.consultMode || "—"}</td>
                    <td>{row.status}</td>
                    <td className="text-end">
                      {String(row.status).toUpperCase() === "OFFERED" ? (
                        <Button size="sm" color="success" disabled={busy} onClick={() => run(async () => {
                          await acceptWaitlistOffer(row.bookingWaitlistId);
                          setNote("Offer accepted.");
                        })}>Accept</Button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : null}

        {tab === "checkin" ? (
          <Table responsive>
            <thead><tr><th>When</th><th>Doctor</th><th>Status</th><th>Mode</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 ? <tr><td colSpan={5} className="text-muted">No visit today.</td></tr> : rows.map((row) => (
                <tr key={row.patientAppId}>
                  <td>{String(row.appointmentDate || "").slice(0, 10)} {row.appointmentTime || ""}</td>
                  <td>{row.doctorName || row.doctorId}</td>
                  <td>{row.status}</td>
                  <td>{row.consultMode || (row.isTele ? "Tele" : "Clinic")}</td>
                  <td className="text-end">
                    {["EARLY", "WAITING", "READY"].map((status) => (
                      <Button key={status} size="sm" color="primary" outline className="me-1" disabled={busy} onClick={() => run(async () => {
                        await checkInVisit(row.patientAppId, status);
                        setNote(`Checked in as ${status}.`);
                      })}>{status}</Button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : null}
      </Container>
    </div>
  );
};

export default PatientCareHub;
