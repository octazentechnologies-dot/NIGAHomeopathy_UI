import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Col, Container, Row } from "reactstrap";

import { clinicMessage, unwrapClinic } from "../../../helpers/doctorClinicApi";
import { listPatientVisits } from "../../../helpers/patientCareApi";
import {
  erxHistory,
  patientMedicineOrders,
  patientPayments,
  s4Message,
  unwrapS4,
} from "../../../helpers/s4Week4Api";
import { subscribePatientAppointmentChanged } from "../../../helpers/patientRealtime";
import MyAppointments from "./MyAppointments";
import PatientCharts from "./PatientCharts";
import QuickActions from "./QuickActions";
import SummaryWidgets from "./SummaryWidgets";
import "./patientDashboard.css";

const asList = (payload) => {
  const data = unwrapS4(payload) ?? unwrapClinic(payload) ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
};

const loadAllVisits = async (from, to) => {
  const pageSize = 100;
  const first = await listPatientVisits({ fromDate: from, toDate: to, pageNumber: 1, pageSize });
  const rows = asList(first);
  const total = Number(first?.totalRecords ?? first?.TotalRecords ?? rows.length) || rows.length;
  const pages = Math.ceil(total / pageSize);
  for (let page = 2; page <= pages; page += 1) {
    const next = await listPatientVisits({ fromDate: from, toDate: to, pageNumber: page, pageSize });
    rows.push(...asList(next));
  }
  return rows;
};

const visitDay = (row) => {
  const raw = row?.appointmentDate ?? row?.AppointmentDate;
  if (!raw) return "";
  const m = moment(raw);
  return m.isValid() ? m.format("YYYY-MM-DD") : "";
};

const PatientDashboard = () => {
  document.title = "Patient Dashboard | Niga Homeocentrum";

  const [visits, setVisits] = useState([]);
  const [payments, setPayments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const from = moment().subtract(180, "days").format("YYYY-MM-DD");
    const to = moment().add(90, "days").format("YYYY-MM-DD");
    const [visitRes, payRes, erxRes, medRes] = await Promise.allSettled([
      loadAllVisits(from, to),
      patientPayments(),
      erxHistory({ pageSize: 100 }),
      patientMedicineOrders(),
    ]);

    if (visitRes.status === "fulfilled") {
      setVisits(visitRes.value);
    } else {
      setVisits([]);
      setError(clinicMessage(visitRes.reason) || s4Message(visitRes.reason));
    }

    setPayments(payRes.status === "fulfilled" ? asList(payRes.value) : []);
    setPrescriptions(erxRes.status === "fulfilled" ? asList(erxRes.value) : []);
    setMedicines(medRes.status === "fulfilled" ? asList(medRes.value) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Other tabs/sessions: SignalR appointmentChanged → refetch visits (server is source of truth).
  useEffect(() => {
    let timer = null;
    const unsub = subscribePatientAppointmentChanged(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        load();
      }, 400);
    });
    return () => {
      if (timer) window.clearTimeout(timer);
      unsub();
    };
  }, [load]);

  const todayIso = moment().format("YYYY-MM-DD");

  const widgetValues = useMemo(() => {
    const todayCount = visits.filter((row) => visitDay(row) === todayIso).length;
    const upcomingCount = visits.filter((row) => {
      const day = visitDay(row);
      return day && day >= todayIso;
    }).length;
    const pendingPay = payments.filter((row) => {
      const status = String(
        row?.status ?? row?.Status ?? row?.paymentStatus ?? row?.PaymentStatus ?? ""
      ).toUpperCase();
      return status && !/PAID|CAPTURED|COLLECTED|SUCCESS|REFUNDED/.test(status);
    }).length;
    const openMeds = medicines.filter((row) => {
      const status = String(row?.status ?? row?.Status ?? "").toUpperCase();
      return status && !/DELIVER|COMPLETE|CANCEL|REJECT/.test(status);
    }).length;
    return {
      today: loading ? null : todayCount,
      upcoming: loading ? null : upcomingCount,
      payments: loading ? null : pendingPay,
      prescriptions: loading ? null : prescriptions.length,
      medicines: loading ? null : openMeds || medicines.length,
    };
  }, [visits, payments, prescriptions, medicines, todayIso, loading]);

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page patient-dashboard-page">
        <Container fluid>
          <Row className="mb-2">
            <Col>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h2 className="patient-page-title mb-0"><i className="ri-dashboard-2-line" aria-hidden="true" />Patient dashboard</h2>
                  <p className="patient-page-subtitle mb-0">
                    Your visits, payments, prescriptions and medicine orders at a glance.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-soft-secondary"
                  onClick={load}
                  disabled={loading}
                  title="Refresh"
                >
                  <i className={`ri-refresh-line me-1${loading ? " patient-spin" : ""}`} aria-hidden="true" />
                  Refresh
                </button>
              </div>
            </Col>
          </Row>

          {error ? (
            <div className="alert alert-warning py-2 mb-3" role="alert">
              {error}
            </div>
          ) : null}

          <SummaryWidgets values={widgetValues} />
          <PatientCharts visits={visits} payments={payments} loading={loading} />
          <QuickActions />
          <MyAppointments visits={visits} loading={loading} />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default PatientDashboard;
