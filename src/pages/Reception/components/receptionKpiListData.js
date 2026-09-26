export const APPOINTMENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "doctor", label: "Doctor", tdClassName: "text-nowrap" },
  { key: "time", label: "Time", type: "strong", tdClassName: "text-nowrap" },
  { key: "type", label: "Type", className: "text-muted" },
  { key: "status", label: "Status", type: "badge" },
];

export const WAITING_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "doctor", label: "Doctor", tdClassName: "text-nowrap" },
  { key: "time", label: "Time", type: "strong", tdClassName: "text-nowrap" },
  { key: "type", label: "Type", className: "text-muted" },
  { key: "status", label: "Status", type: "badge" },
];

export const PENDING_PAYMENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "doctor", label: "Doctor", tdClassName: "text-nowrap" },
  { key: "amount", label: "Amount", type: "strong", tdClassName: "text-nowrap" },
  { key: "method", label: "Method" },
  { key: "status", label: "Status", type: "badge" },
];

export const TOTAL_PATIENT_COLUMNS = [
  { key: "patient", label: "Patient", type: "strong" },
  { key: "ageSex", label: "Age / Sex" },
  { key: "mobile", label: "Mobile" },
  { key: "place", label: "Place" },
  { key: "lastVisit", label: "Last Visit", tdClassName: "text-nowrap" },
  { key: "status", label: "Status", type: "badge" },
];

export const TODAY_APPOINTMENT_ROWS = [
  { id: 1, patient: "Rohan Mehta", ageSex: "34y / M", mobile: "9876543210", doctor: "Dr. Priya Sharma", time: "09:30 AM", type: "In-Clinic", status: "Paid" },
  { id: 2, patient: "Sneha Patil", ageSex: "29y / F", mobile: "9123456780", doctor: "Dr. Rahul Mehta", time: "10:00 AM", type: "Teleconsult", status: "Unpaid" },
  { id: 3, patient: "Amit Shah", ageSex: "47y / M", mobile: "9988776655", doctor: "Dr. Priya Sharma", time: "10:30 AM", type: "In-Clinic", status: "Paid" },
  { id: 4, patient: "Priya Desai", ageSex: "37y / F", mobile: "9090909090", doctor: "Dr. Rahul Mehta", time: "11:00 AM", type: "In-Clinic", status: "Waiting" },
  { id: 5, patient: "Vikram Joshi", ageSex: "52y / M", mobile: "9811122233", doctor: "Dr. Priya Sharma", time: "11:30 AM", type: "Teleconsult", status: "Paid" },
  { id: 6, patient: "Ananya Kulkarni", ageSex: "31y / F", mobile: "9876501234", doctor: "Dr. Rahul Mehta", time: "12:00 PM", type: "In-Clinic", status: "Waiting" },
  { id: 7, patient: "Karan Verma", ageSex: "41y / M", mobile: "9765432109", doctor: "Dr. Priya Sharma", time: "12:30 PM", type: "In-Clinic", status: "Unpaid" },
  { id: 8, patient: "Neha Joshi", ageSex: "26y / F", mobile: "9900112233", doctor: "Dr. Rahul Mehta", time: "01:00 PM", type: "Teleconsult", status: "Paid" },
  { id: 9, patient: "Suresh Patil", ageSex: "45y / M", mobile: "9822012345", doctor: "Dr. Priya Sharma", time: "01:30 PM", type: "In-Clinic", status: "Waiting" },
  { id: 10, patient: "Meera Nair", ageSex: "33y / F", mobile: "9898989898", doctor: "Dr. Rahul Mehta", time: "02:00 PM", type: "In-Clinic", status: "Paid" },
  { id: 11, patient: "Rajesh Kumar", ageSex: "50y / M", mobile: "9700011223", doctor: "Dr. Priya Sharma", time: "02:30 PM", type: "Teleconsult", status: "Unpaid" },
  { id: 12, patient: "Pooja Sawant", ageSex: "28y / F", mobile: "9654321098", doctor: "Dr. Rahul Mehta", time: "03:00 PM", type: "In-Clinic", status: "Waiting" },
  { id: 13, patient: "Nikhil More", ageSex: "36y / M", mobile: "9543210987", doctor: "Dr. Priya Sharma", time: "03:30 PM", type: "In-Clinic", status: "Paid" },
  { id: 14, patient: "Shalini Deshmukh", ageSex: "42y / F", mobile: "9432109876", doctor: "Dr. Rahul Mehta", time: "04:00 PM", type: "Teleconsult", status: "Paid" },
  { id: 15, patient: "Aditya Kulkarni", ageSex: "27y / M", mobile: "9321098765", doctor: "Dr. Priya Sharma", time: "04:30 PM", type: "In-Clinic", status: "Unpaid" },
  { id: 16, patient: "Kavita Rane", ageSex: "39y / F", mobile: "9210987654", doctor: "Dr. Rahul Mehta", time: "05:00 PM", type: "In-Clinic", status: "Waiting" },
  { id: 17, patient: "Omkar Jadhav", ageSex: "31y / M", mobile: "9109876543", doctor: "Dr. Priya Sharma", time: "05:30 PM", type: "Teleconsult", status: "Paid" },
  { id: 18, patient: "Isha Bhosale", ageSex: "24y / F", mobile: "9098765432", doctor: "Dr. Rahul Mehta", time: "06:00 PM", type: "In-Clinic", status: "Paid" },
  { id: 19, patient: "Manish Pawar", ageSex: "48y / M", mobile: "8987654321", doctor: "Dr. Priya Sharma", time: "06:30 PM", type: "In-Clinic", status: "Waiting" },
  { id: 20, patient: "Rutuja Shinde", ageSex: "35y / F", mobile: "8876543210", doctor: "Dr. Rahul Mehta", time: "07:00 PM", type: "Teleconsult", status: "Unpaid" },
  { id: 21, patient: "Sagar Chavan", ageSex: "40y / M", mobile: "8765432109", doctor: "Dr. Priya Sharma", time: "07:15 PM", type: "In-Clinic", status: "Paid" },
  { id: 22, patient: "Deepa Gaikwad", ageSex: "30y / F", mobile: "8654321098", doctor: "Dr. Rahul Mehta", time: "07:30 PM", type: "In-Clinic", status: "Waiting" },
  { id: 23, patient: "Yash Thakur", ageSex: "22y / M", mobile: "8543210987", doctor: "Dr. Priya Sharma", time: "07:45 PM", type: "Teleconsult", status: "Paid" },
  { id: 24, patient: "Tanvi Kadam", ageSex: "29y / F", mobile: "8432109876", doctor: "Dr. Rahul Mehta", time: "08:00 PM", type: "In-Clinic", status: "Unpaid" },
];

export const WAITING_PATIENT_ROWS = [
  { id: 1, patient: "Priya Desai", ageSex: "37y / F", mobile: "9090909090", doctor: "Dr. Rahul Mehta", time: "11:00 AM", type: "In-Clinic", status: "Waiting" },
  { id: 2, patient: "Ananya Kulkarni", ageSex: "31y / F", mobile: "9876501234", doctor: "Dr. Rahul Mehta", time: "12:00 PM", type: "In-Clinic", status: "Waiting" },
  { id: 3, patient: "Suresh Patil", ageSex: "45y / M", mobile: "9822012345", doctor: "Dr. Priya Sharma", time: "01:30 PM", type: "In-Clinic", status: "Waiting" },
  { id: 4, patient: "Pooja Sawant", ageSex: "28y / F", mobile: "9654321098", doctor: "Dr. Rahul Mehta", time: "03:00 PM", type: "In-Clinic", status: "Waiting" },
  { id: 5, patient: "Kavita Rane", ageSex: "39y / F", mobile: "9210987654", doctor: "Dr. Rahul Mehta", time: "05:00 PM", type: "In-Clinic", status: "Waiting" },
];

export const PENDING_PAYMENT_ROWS = [
  { id: 1, patient: "Sneha Patil", ageSex: "29y / F", mobile: "9123456780", doctor: "Dr. Rahul Mehta", amount: "₹ 600", method: "UPI", status: "Unpaid" },
  { id: 2, patient: "Karan Verma", ageSex: "41y / M", mobile: "9765432109", doctor: "Dr. Priya Sharma", amount: "₹ 800", method: "Cash", status: "Unpaid" },
  { id: 3, patient: "Rajesh Kumar", ageSex: "50y / M", mobile: "9700011223", doctor: "Dr. Priya Sharma", amount: "₹ 600", method: "Card", status: "Unpaid" },
];

export const TOTAL_PATIENT_ROWS = [
  { id: 1, patient: "Rohan Mehta", ageSex: "34y / M", mobile: "9876543210", place: "Kolhapur", lastVisit: "23 Sep 2026", status: "Active" },
  { id: 2, patient: "Sneha Patil", ageSex: "29y / F", mobile: "9123456780", place: "Pune", lastVisit: "23 Sep 2026", status: "Active" },
  { id: 3, patient: "Amit Shah", ageSex: "47y / M", mobile: "9988776655", place: "Mumbai", lastVisit: "23 Sep 2026", status: "Active" },
  { id: 4, patient: "Priya Desai", ageSex: "37y / F", mobile: "9090909090", place: "Sangli", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 5, patient: "Vikram Joshi", ageSex: "52y / M", mobile: "9811122233", place: "Nashik", lastVisit: "23 Sep 2026", status: "Active" },
  { id: 6, patient: "Ananya Kulkarni", ageSex: "31y / F", mobile: "9876501234", place: "Pune", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 7, patient: "Karan Verma", ageSex: "41y / M", mobile: "9765432109", place: "Satara", lastVisit: "23 Sep 2026", status: "Pending" },
  { id: 8, patient: "Neha Joshi", ageSex: "26y / F", mobile: "9900112233", place: "Kolhapur", lastVisit: "22 Sep 2026", status: "Active" },
  { id: 9, patient: "Suresh Patil", ageSex: "45y / M", mobile: "9822012345", place: "Ichalkaranji", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 10, patient: "Meera Nair", ageSex: "33y / F", mobile: "9898989898", place: "Pune", lastVisit: "21 Sep 2026", status: "Active" },
  { id: 11, patient: "Rajesh Kumar", ageSex: "50y / M", mobile: "9700011223", place: "Mumbai", lastVisit: "23 Sep 2026", status: "Pending" },
  { id: 12, patient: "Pooja Sawant", ageSex: "28y / F", mobile: "9654321098", place: "Sangli", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 13, patient: "Nikhil More", ageSex: "36y / M", mobile: "9543210987", place: "Pune", lastVisit: "20 Sep 2026", status: "Active" },
  { id: 14, patient: "Shalini Deshmukh", ageSex: "42y / F", mobile: "9432109876", place: "Nashik", lastVisit: "19 Sep 2026", status: "Active" },
  { id: 15, patient: "Aditya Kulkarni", ageSex: "27y / M", mobile: "9321098765", place: "Kolhapur", lastVisit: "23 Sep 2026", status: "Pending" },
  { id: 16, patient: "Kavita Rane", ageSex: "39y / F", mobile: "9210987654", place: "Ratnagiri", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 17, patient: "Omkar Jadhav", ageSex: "31y / M", mobile: "9109876543", place: "Pune", lastVisit: "18 Sep 2026", status: "Active" },
  { id: 18, patient: "Isha Bhosale", ageSex: "24y / F", mobile: "9098765432", place: "Solapur", lastVisit: "17 Sep 2026", status: "Active" },
  { id: 19, patient: "Manish Pawar", ageSex: "48y / M", mobile: "8987654321", place: "Ahmednagar", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 20, patient: "Rutuja Shinde", ageSex: "35y / F", mobile: "8876543210", place: "Pune", lastVisit: "23 Sep 2026", status: "Pending" },
  { id: 21, patient: "Sagar Chavan", ageSex: "40y / M", mobile: "8765432109", place: "Kolhapur", lastVisit: "16 Sep 2026", status: "Active" },
  { id: 22, patient: "Deepa Gaikwad", ageSex: "30y / F", mobile: "8654321098", place: "Sangli", lastVisit: "23 Sep 2026", status: "Waiting" },
  { id: 23, patient: "Yash Thakur", ageSex: "22y / M", mobile: "8543210987", place: "Pune", lastVisit: "15 Sep 2026", status: "Active" },
  { id: 24, patient: "Tanvi Kadam", ageSex: "29y / F", mobile: "8432109876", place: "Mumbai", lastVisit: "23 Sep 2026", status: "Pending" },
  { id: 25, patient: "Harish Naik", ageSex: "55y / M", mobile: "8321098765", place: "Goa", lastVisit: "14 Sep 2026", status: "Active" },
  { id: 26, patient: "Sonal Patil", ageSex: "32y / F", mobile: "8210987654", place: "Pune", lastVisit: "13 Sep 2026", status: "Active" },
  { id: 27, patient: "Gaurav Desai", ageSex: "38y / M", mobile: "8109876543", place: "Kolhapur", lastVisit: "12 Sep 2026", status: "Active" },
  { id: 28, patient: "Nisha More", ageSex: "27y / F", mobile: "8098765432", place: "Satara", lastVisit: "11 Sep 2026", status: "Active" },
];

export const RECEPTION_KPI_MODALS = {
  "today-appointments": {
    title: "Today's Appointments",
    icon: "ri-calendar-check-line",
    searchPlaceholder: "Search patient, mobile, doctor...",
    entityLabel: "Patients",
    emptyMessage: "No appointments available",
    columns: APPOINTMENT_COLUMNS,
    rows: TODAY_APPOINTMENT_ROWS,
  },
  "waiting-patients": {
    title: "Waiting Patients",
    icon: "ri-hourglass-line",
    searchPlaceholder: "Search patient, mobile, doctor...",
    entityLabel: "Waiting Patients",
    emptyMessage: "No waiting patients available",
    columns: WAITING_COLUMNS,
    rows: WAITING_PATIENT_ROWS,
  },
  "pending-payments": {
    title: "Pending Payments",
    icon: "ri-wallet-3-line",
    searchPlaceholder: "Search patient, mobile, amount...",
    entityLabel: "Pending Payments",
    emptyMessage: "No pending payments available",
    columns: PENDING_PAYMENT_COLUMNS,
    rows: PENDING_PAYMENT_ROWS,
  },
  "today-patients": {
    title: "Total Patients",
    icon: "ri-team-line",
    searchPlaceholder: "Search patient, mobile, place...",
    entityLabel: "Patients",
    emptyMessage: "No patients available",
    columns: TOTAL_PATIENT_COLUMNS,
    rows: TOTAL_PATIENT_ROWS,
  },
};
