import moment from "moment";
import { apiHelpers } from "../../../helpers/api_helper";

const nigahomeoAPI = apiHelpers.nigahomeo;

const rowsOf = (response) =>
  Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

export const getTeleDay = (date) =>
  nigahomeoAPI.get("/Tele/Day", date ? { date: moment(date).format("YYYY-MM-DD") } : {});
export const listTeleInstantOffers = () => nigahomeoAPI.get("/Tele/Instant/Offers", null);

const paymentLabel = (status) => {
  const key = String(status || "").toUpperCase();
  if (key === "PAID" || key === "SUCCESS" || key === "CAPTURED") return "Paid";
  if (key === "REFUNDED") return "Refunded";
  return "Unpaid";
};

const formatSlotTime = (value) => {
  if (!value) return "—";
  const m = moment(String(value), ["HH:mm:ss", "HH:mm"], true);
  return m.isValid() ? m.format("hh:mm A") : String(value);
};

export const mapTeleRow = (row) => {
  const age = row.age ?? row.Age;
  const gender = row.gender ?? row.Gender;
  const ageSex = [age != null ? `${age}y` : null, gender || null].filter(Boolean).join(" / ") || "—";
  return {
    id: row.patientAppId ?? row.PatientAppId,
    patientAppId: row.patientAppId ?? row.PatientAppId,
    patientId: row.patientId ?? row.PatientId,
    teleSessionId: row.teleSessionId ?? row.TeleSessionId ?? null,
    sessionStatus: row.sessionStatus ?? row.SessionStatus ?? null,
    time: formatSlotTime(row.appointmentTime ?? row.AppointmentTime),
    patient: row.patientName ?? row.PatientName ?? "Patient",
    ageSex,
    mobile: row.mobileNo ?? row.MobileNo ?? "",
    amount: row.amount ?? row.Amount ?? null,
    paymentStatus: paymentLabel(row.paymentStatus ?? row.PaymentStatus),
    consultType: row.consultType ?? row.ConsultType ?? "scheduled",
    queueStatus: row.boardStatus ?? row.BoardStatus ?? "Scheduled",
  };
};

export const loadTeleDay = async (date) => rowsOf(await getTeleDay(date)).map(mapTeleRow);

export const loadInstantOfferCount = async () => rowsOf(await listTeleInstantOffers()).length;

export const mapChatMessage = (row, patientName, doctorName) => {
  const role = String(row.senderRole ?? row.SenderRole ?? "");
  const isDoctor = role.toLowerCase() === "doctor";
  const at = row.at ?? row.At;
  return {
    id: row.teleChatMessageId ?? row.TeleChatMessageId,
    mine: isDoctor,
    from: isDoctor ? "doctor" : "patient",
    name: isDoctor ? doctorName || "Doctor" : patientName || "Patient",
    time: at ? moment(at).format("hh:mm A") : "",
    text: row.body ?? row.Body ?? "",
  };
};
