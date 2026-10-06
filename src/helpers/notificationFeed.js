import { UserRole } from "../Components/constants/roles";

const READ_STORAGE_KEY = "niga.notifications.read.v1";

const tab = (id, label) => ({ id, label });

const DOCTOR_FEED = {
  subtitle: "Appointments, payments, prescriptions and patient activity for your practice.",
  showUnreadTab: true,
  tabs: [
    tab("appointments", "Appointments"),
    tab("payments", "Payments"),
    tab("prescriptions", "Prescriptions"),
    tab("orders", "Orders"),
    tab("system", "System"),
  ],
  items: [
    { id: "doc-1", category: "appointments", tone: "blue", icon: "ri-calendar-check-line", title: "New Appointment Booked", message: "Priya Sharma has booked an appointment on 24 Sep 2026 at 10:00 AM.", minutesAgo: 10, unread: true, link: "/doctor/schedule" },
    { id: "doc-2", category: "payments", tone: "green", icon: "ri-shield-check-line", title: "Payment Received", message: "Payment of ₹500 received for consultation.", minutesAgo: 30, unread: true, link: "/doctor/earnings" },
    { id: "doc-3", category: "prescriptions", tone: "purple", icon: "ri-file-list-3-line", title: "Prescription Issued", message: "You have issued a new prescription for Amit Patil.", minutesAgo: 60, unread: true, link: "/doctor/erx" },
    { id: "doc-4", category: "orders", tone: "amber", icon: "ri-shopping-bag-3-line", title: "Medicine Order Placed", message: "A new medicine order has been placed by Neha Kulkarni.", minutesAgo: 120, link: "/doctor/erx" },
    { id: "doc-5", category: "prescriptions", tone: "red", icon: "ri-refresh-line", title: "Refill Request", message: "Ramesh Shah has requested a refill for previous prescription.", minutesAgo: 180, link: "/doctor/mobile/refill" },
    { id: "doc-6", category: "system", tone: "violet", icon: "ri-star-smile-line", title: "Review Received", message: "You received a new review from Priya Sharma.", minutesAgo: 300 },
    { id: "doc-7", category: "appointments", tone: "teal", icon: "ri-video-chat-line", title: "Teleconsult Starting Soon", message: "Video consultation with Sunil Desai starts in 15 minutes.", minutesAgo: 420, link: "/doctor/tele" },
    { id: "doc-8", category: "appointments", tone: "red", icon: "ri-calendar-close-line", title: "Appointment Cancelled", message: "Kavita Joshi cancelled the appointment on 25 Sep 2026 at 04:30 PM.", minutesAgo: 1440, link: "/doctor/schedule" },
    { id: "doc-9", category: "payments", tone: "green", icon: "ri-bank-line", title: "Payout Processed", message: "Weekly payout of ₹12,400 has been transferred to your bank account.", minutesAgo: 2880, link: "/doctor/earnings" },
    { id: "doc-10", category: "system", tone: "slate", icon: "ri-settings-3-line", title: "Scheduled Maintenance", message: "The platform will be under maintenance on Sunday from 02:00 AM to 04:00 AM.", minutesAgo: 4320 },
  ],
};

const PATIENT_FEED = {
  subtitle: "Updates about your appointments, payments, prescriptions and medicine orders.",
  showUnreadTab: false,
  tabs: [
    tab("appointments", "Appointments"),
    tab("payments", "Payments"),
    tab("prescriptions", "Prescriptions"),
    tab("orders", "Orders"),
    tab("offers", "Offers"),
  ],
  items: [
    { id: "pat-1", category: "appointments", tone: "blue", icon: "ri-calendar-check-line", title: "Appointment Confirmed", message: "Your appointment with Dr. N. Gaurav is confirmed on 24 Sep 2026 at 10:00 AM.", minutesAgo: 10, unread: true, link: "/patient/continuity" },
    { id: "pat-2", category: "payments", tone: "green", icon: "ri-shield-check-line", title: "Payment Successful", message: "Payment of ₹500 completed for consultation.", minutesAgo: 30, unread: true },
    { id: "pat-3", category: "prescriptions", tone: "purple", icon: "ri-file-list-3-line", title: "Prescription Issued", message: "Your prescription is now available.", minutesAgo: 60, link: "/patient/prescriptions" },
    { id: "pat-4", category: "orders", tone: "amber", icon: "ri-shopping-bag-3-line", title: "Medicine Order Placed", message: "Your medicine order has been placed with Mumbai Pharmacy.", minutesAgo: 120, link: "/patient/medicine-orders" },
    { id: "pat-5", category: "prescriptions", tone: "red", icon: "ri-refresh-line", title: "Refill Reminder", message: "It's time to refill your prescription.", minutesAgo: 180, link: "/patient/prescriptions" },
    { id: "pat-6", category: "offers", tone: "violet", icon: "ri-coupon-3-line", title: "New Offer", message: "Get 20% off on follow-up consultation. Use code FOLLOW20.", minutesAgo: 300 },
    { id: "pat-7", category: "orders", tone: "teal", icon: "ri-truck-line", title: "Order Out for Delivery", message: "Your medicines from Mumbai Pharmacy will be delivered today.", minutesAgo: 1440, link: "/patient/medicine-orders" },
    { id: "pat-8", category: "appointments", tone: "blue", icon: "ri-time-line", title: "Appointment Reminder", message: "Your follow-up with Dr. N. Gaurav is tomorrow at 11:30 AM.", minutesAgo: 2880, link: "/patient/continuity" },
  ],
};

const ADMIN_FEED = {
  subtitle: "Platform activity across doctors, reviews, payments, pharmacies and support.",
  showUnreadTab: true,
  tabs: [
    tab("doctors", "Doctors"),
    tab("reviews", "Reviews"),
    tab("payments", "Payments"),
    tab("pharmacy", "Pharmacy"),
    tab("support", "Support"),
    tab("system", "System"),
  ],
  items: [
    { id: "adm-1", category: "doctors", tone: "blue", icon: "ri-user-add-line", title: "New Doctor Registration", message: "Dr. Meera Iyer has registered and submitted credentials for verification.", minutesAgo: 8, unread: true, link: "/admin/trust-queue" },
    { id: "adm-2", category: "reviews", tone: "violet", icon: "ri-star-smile-line", title: "Review Awaiting Approval", message: "A visitor review for Dr. N. Gaurav is pending moderation.", minutesAgo: 25, unread: true, link: "/admin/trust-queue" },
    { id: "adm-3", category: "payments", tone: "green", icon: "ri-secure-payment-line", title: "Consultation Payment Settled", message: "₹18,750 settled across 32 consultations today.", minutesAgo: 55, unread: true, link: "/admin/consult-payments" },
    { id: "adm-4", category: "pharmacy", tone: "amber", icon: "ri-store-3-line", title: "Pharmacy Activation Pending", message: "Mumbai Pharmacy completed onboarding and is waiting for activation.", minutesAgo: 90, unread: true, link: "/admin/pharmacy-partners" },
    { id: "adm-5", category: "support", tone: "teal", icon: "ri-customer-service-2-line", title: "New Support Ticket", message: "Neha Kulkarni raised a ticket about a failed payment refund.", minutesAgo: 140, link: "/admin/support-tickets" },
    { id: "adm-6", category: "support", tone: "blue", icon: "ri-question-answer-line", title: "New Enquiry Received", message: "A clinic owner from Pune enquired about the subscription plans.", minutesAgo: 200, link: "/admin/enquiries" },
    { id: "adm-7", category: "doctors", tone: "red", icon: "ri-file-warning-line", title: "Credential Document Expiring", message: "Registration certificate of Dr. Arjun Rao expires in 7 days.", minutesAgo: 360, link: "/admin/trust-queue" },
    { id: "adm-8", category: "pharmacy", tone: "red", icon: "ri-capsule-line", title: "HomeoMeds Exception", message: "3 medicine orders could not be routed to a pharmacy partner.", minutesAgo: 720, link: "/admin/homemeds-exceptions" },
    { id: "adm-9", category: "reviews", tone: "purple", icon: "ri-scales-3-line", title: "Review Appeal Raised", message: "Dr. Sameer Khan appealed against a rejected review decision.", minutesAgo: 1440, link: "/admin/trust-queue" },
    { id: "adm-10", category: "system", tone: "slate", icon: "ri-settings-3-line", title: "Scheduled Maintenance", message: "The platform will be under maintenance on Sunday from 02:00 AM to 04:00 AM.", minutesAgo: 4320 },
  ],
};

const PHARMACY_FEED = {
  subtitle: "New orders, quotes, prescriptions and partner updates for your pharmacy.",
  showUnreadTab: true,
  tabs: [
    tab("orders", "Orders"),
    tab("quotes", "Quotes"),
    tab("prescriptions", "Prescriptions"),
    tab("payments", "Payments"),
    tab("system", "System"),
  ],
  items: [
    { id: "phm-1", category: "orders", tone: "blue", icon: "ri-shopping-bag-3-line", title: "New Medicine Order", message: "Order #MO-2041 received from Neha Kulkarni for 4 medicines.", minutesAgo: 6, unread: true, link: "/pharmacy/orders" },
    { id: "phm-2", category: "quotes", tone: "amber", icon: "ri-price-tag-3-line", title: "Quote Requested", message: "Amit Patil requested a price quote for his prescription.", minutesAgo: 22, unread: true, link: "/pharmacy/quotes" },
    { id: "phm-3", category: "prescriptions", tone: "purple", icon: "ri-file-list-3-line", title: "Prescription Attached", message: "Dr. N. Gaurav attached a prescription to order #MO-2038.", minutesAgo: 70, unread: true, link: "/pharmacy/orders" },
    { id: "phm-4", category: "payments", tone: "green", icon: "ri-shield-check-line", title: "Payment Received", message: "Payment of ₹1,240 received for order #MO-2033.", minutesAgo: 130, link: "/pharmacy/orders" },
    { id: "phm-5", category: "orders", tone: "teal", icon: "ri-truck-line", title: "Order Delivered", message: "Order #MO-2029 was delivered to Ramesh Shah.", minutesAgo: 240, link: "/pharmacy/orders" },
    { id: "phm-6", category: "orders", tone: "red", icon: "ri-close-circle-line", title: "Order Cancelled", message: "Kavita Joshi cancelled order #MO-2026 before dispatch.", minutesAgo: 600, link: "/pharmacy/orders" },
    { id: "phm-7", category: "system", tone: "violet", icon: "ri-store-3-line", title: "Partner Profile Approved", message: "Your pharmacy is now active and visible to patients.", minutesAgo: 1440, link: "/pharmacy/onboarding" },
    { id: "phm-8", category: "system", tone: "slate", icon: "ri-time-line", title: "Operating Hours Reminder", message: "Update your holiday hours so patients see the correct availability.", minutesAgo: 2880, link: "/pharmacydashboard" },
  ],
};

const RECEPTION_FEED = {
  subtitle: "Front-desk updates for appointments, patient check-ins and payments.",
  showUnreadTab: true,
  tabs: [
    tab("appointments", "Appointments"),
    tab("patients", "Patients"),
    tab("payments", "Payments"),
    tab("system", "System"),
  ],
  items: [
    { id: "rec-1", category: "appointments", tone: "blue", icon: "ri-calendar-check-line", title: "New Appointment Booked", message: "Priya Sharma booked an appointment on 24 Sep 2026 at 10:00 AM.", minutesAgo: 5, unread: true, link: "/reception/appointments" },
    { id: "rec-2", category: "patients", tone: "teal", icon: "ri-user-follow-line", title: "Patient Checked In", message: "Amit Patil has checked in and is waiting for consultation.", minutesAgo: 18, unread: true, link: "/reception/patients" },
    { id: "rec-3", category: "payments", tone: "green", icon: "ri-shield-check-line", title: "Payment Collected", message: "₹500 collected from Neha Kulkarni at the front desk.", minutesAgo: 45, link: "/reception/payments" },
    { id: "rec-4", category: "appointments", tone: "red", icon: "ri-calendar-close-line", title: "Appointment Cancelled", message: "Kavita Joshi cancelled the appointment on 25 Sep 2026 at 04:30 PM.", minutesAgo: 120, link: "/reception/schedule" },
    { id: "rec-5", category: "appointments", tone: "amber", icon: "ri-time-line", title: "Doctor Running Late", message: "Dr. N. Gaurav is running 20 minutes behind schedule.", minutesAgo: 200, link: "/reception/schedule" },
    { id: "rec-6", category: "system", tone: "slate", icon: "ri-settings-3-line", title: "Scheduled Maintenance", message: "The platform will be under maintenance on Sunday from 02:00 AM to 04:00 AM.", minutesAgo: 4320 },
  ],
};

const ACCOUNT_FEED = {
  subtitle: "Finance updates for payments, payouts, refunds and settlements.",
  showUnreadTab: true,
  tabs: [
    tab("payments", "Payments"),
    tab("payouts", "Payouts"),
    tab("refunds", "Refunds"),
    tab("settlements", "Settlements"),
    tab("system", "System"),
  ],
  items: [
    { id: "acc-1", category: "payments", tone: "green", icon: "ri-secure-payment-line", title: "Consultation Payments Received", message: "₹18,750 received across 32 consultations today.", minutesAgo: 12, unread: true, link: "/account/consult-recon" },
    { id: "acc-2", category: "refunds", tone: "red", icon: "ri-arrow-go-back-line", title: "Refund Requested", message: "Neha Kulkarni requested a refund of ₹500 for a cancelled consultation.", minutesAgo: 40, unread: true, link: "/account/refunds" },
    { id: "acc-3", category: "payouts", tone: "blue", icon: "ri-bank-line", title: "Payout Batch Ready", message: "Weekly doctor payout batch of ₹2,14,600 is ready for approval.", minutesAgo: 95, unread: true, link: "/account/payouts" },
    { id: "acc-4", category: "settlements", tone: "purple", icon: "ri-exchange-funds-line", title: "Pharmacy Settlement Due", message: "Settlement of ₹42,300 is due to Mumbai Pharmacy.", minutesAgo: 180, link: "/account/settlements" },
    { id: "acc-5", category: "payments", tone: "amber", icon: "ri-error-warning-line", title: "Payment Mismatch", message: "2 transactions did not match the gateway report.", minutesAgo: 360, link: "/account/exceptions" },
    { id: "acc-6", category: "system", tone: "slate", icon: "ri-file-chart-line", title: "Monthly Report Generated", message: "The September 2026 finance report is ready to download.", minutesAgo: 1440, link: "/account/reports" },
  ],
};

const roleKey = (role) => {
  if (role === UserRole.ADMIN || role === UserRole.MANAGEMENT) return "admin";
  if (role === UserRole.PATIENT) return "patient";
  if (role === UserRole.PHARMACY || role === UserRole.PHARMACY_PARTNER) return "pharmacy";
  if (role === UserRole.RECEPTION) return "reception";
  if (role === UserRole.ACCOUNT) return "account";
  return "doctor";
};

const FEEDS = {
  admin: ADMIN_FEED,
  patient: PATIENT_FEED,
  pharmacy: PHARMACY_FEED,
  reception: RECEPTION_FEED,
  account: ACCOUNT_FEED,
  doctor: DOCTOR_FEED,
};

const readReadMap = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeReadMap = (map) => {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
};

export const getNotificationFeed = (role) => {
  const key = roleKey(role);
  const feed = FEEDS[key];
  const readIds = new Set(readReadMap()[key] || []);
  return {
    key,
    subtitle: feed.subtitle,
    showUnreadTab: feed.showUnreadTab,
    tabs: feed.tabs,
    items: feed.items.map((item) => ({ ...item, unread: Boolean(item.unread) && !readIds.has(item.id) })),
  };
};

export const markNotificationsRead = (role, ids) => {
  const key = roleKey(role);
  const map = readReadMap();
  map[key] = Array.from(new Set([...(map[key] || []), ...ids]));
  writeReadMap(map);
};

export const formatNotificationTime = (minutesAgo) => {
  const minutes = Math.max(0, Number(minutesAgo) || 0);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};
