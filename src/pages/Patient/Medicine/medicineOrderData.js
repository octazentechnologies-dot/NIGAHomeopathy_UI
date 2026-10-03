import moment from "moment";

export const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

export const formatINR = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const formatDate = (value, format = "DD MMM YYYY") => (value ? moment(value).format(format) : "—");

export const TRACKING_STEPS = [
  { id: "placed", label: "Order Placed", icon: "ri-shopping-bag-3-line" },
  { id: "process", label: "In Process", icon: "ri-loader-4-line" },
  { id: "out", label: "Out for Delivery", icon: "ri-truck-line" },
  { id: "delivered", label: "Delivered", icon: "ri-checkbox-circle-line" },
];

/** Maps raw MedicineOrder statuses to the patient-facing stage, label and next action. */
export const orderStage = (rawStatus) => {
  const status = String(rawStatus || "").toUpperCase();
  if (/CANCEL|REJECT/.test(status)) {
    return { key: "cancelled", label: "Cancelled", tone: "danger", step: -1 };
  }
  if (/DELIVER|COMPLETE/.test(status)) {
    return { key: "delivered", label: "Delivered", tone: "success", step: 3 };
  }
  if (/DISPATCH|OUT_FOR/.test(status)) {
    return { key: "out", label: "Out for Delivery", tone: "info", step: 2 };
  }
  if (status === "QUOTED_ACCEPTED") {
    return { key: "payment", label: "Awaiting payment", tone: "warning", step: 0, action: "pay" };
  }
  if (status === "QUOTED") {
    return { key: "quoted", label: "Quote received", tone: "primary", step: 0, action: "accept" };
  }
  if (/PAID|COD|CONFIRM|PROCESS|READY|PACK/.test(status)) {
    return { key: "process", label: "In Process", tone: "info", step: 1 };
  }
  return { key: "placed", label: "Awaiting quote", tone: "muted", step: 0 };
};

export const isOrderOpen = (order) => !["delivered", "cancelled"].includes(orderStage(order.status).key);

const normalizeItem = (row) => ({
  name: pick(row, "remedyName", "RemedyName", "medicineName", "MedicineName", "name", "Name") || "Medicine",
  potency: pick(row, "potencyCode", "PotencyCode", "potency", "Potency") || "",
  qty: Number(pick(row, "qty", "Qty", "quantity", "Quantity") || 1),
  price: Number(pick(row, "price", "Price", "amount", "Amount") || 0),
});

export const normalizeOrder = (row, index = 0) => {
  const id = pick(row, "medicineOrderId", "MedicineOrderId", "id", "Id") || `order-${index}`;
  const items = pick(row, "items", "Items", "lines", "Lines") || [];
  const amount = Number(pick(row, "quoteAmount", "QuoteAmount", "amount", "Amount", "total", "Total") || 0);
  return {
    id,
    orderNo: pick(row, "orderNo", "OrderNo") || `HM${String(id).padStart(6, "0")}`,
    date: pick(row, "createdAt", "CreatedAt", "orderedAt", "OrderedAt"),
    pharmacy: pick(row, "pharmacyName", "PharmacyName", "sellerName", "SellerName") || "Auto-routed pharmacy",
    erxId: pick(row, "erxSnapshotId", "ErxSnapshotId"),
    doctorName: pick(row, "doctorName", "DoctorName") || "",
    items: Array.isArray(items) ? items.map(normalizeItem) : [],
    amount,
    deliveryFee: Number(pick(row, "deliveryFee", "DeliveryFee") || 0),
    payMode: pick(row, "payMode", "PayMode") || "",
    status: String(pick(row, "status", "Status") || "CREATED"),
    events: pick(row, "events", "Events", "tracking", "Tracking") || [],
    reviewed: false,
    isDemo: false,
  };
};

export const SAMPLE_PHARMACIES = [
  { id: "demo-ph-1", name: "HomeoCare Pharmacy", area: "Kothrud, Pune", distance: "2.5 km", eta: "Same day" },
  { id: "demo-ph-2", name: "HealthMed Store", area: "Baner, Pune", distance: "3.1 km", eta: "Same day" },
  { id: "demo-ph-3", name: "Sanjeevani Homeo Medicals", area: "Aundh, Pune", distance: "4.2 km", eta: "Next day" },
];

export const normalizePharmacy = (row) => ({
  id: pick(row, "pharmacyPartnerId", "PharmacyPartnerId", "id", "Id"),
  name: pick(row, "name", "Name", "pharmacyName", "PharmacyName") || "Pharmacy",
  area: pick(row, "area", "Area", "city", "City") || "",
  distance: pick(row, "distance", "Distance") || "",
  eta: pick(row, "eta", "Eta") || "",
});

const daysAgo = (days) => moment().subtract(days, "days").toISOString();

export const SAMPLE_ORDERS = [
  {
    id: "demo-1",
    orderNo: "HM2026S0972",
    date: daysAgo(0),
    pharmacy: "Auto-routed pharmacy",
    doctorName: "Dr. Rohit Mehta",
    items: [
      { name: "Nux Vomica", potency: "30C", qty: 1, price: 0 },
      { name: "Carbo Vegetabilis", potency: "6X", qty: 1, price: 0 },
    ],
    amount: 0,
    deliveryFee: 0,
    payMode: "",
    status: "CREATED",
    events: [],
  },
  {
    id: "demo-2",
    orderNo: "HM2026S0951",
    date: daysAgo(1),
    pharmacy: "HealthMed Store",
    doctorName: "Dr. Anjali Deshmukh",
    items: [
      { name: "Sulphur", potency: "200C", qty: 1, price: 280 },
      { name: "Graphites", potency: "30C", qty: 2, price: 150 },
    ],
    amount: 640,
    deliveryFee: 60,
    payMode: "",
    status: "QUOTED",
    events: [],
  },
  {
    id: "demo-3",
    orderNo: "HM2026S0938",
    date: daysAgo(4),
    pharmacy: "Sanjeevani Homeo Medicals",
    doctorName: "Dr. Sameer Kulkarni",
    items: [
      { name: "Rhus Toxicodendron", potency: "200C", qty: 1, price: 320 },
      { name: "Bryonia Alba", potency: "30C", qty: 1, price: 210 },
      { name: "Calcarea Fluorica", potency: "6X", qty: 2, price: 150 },
    ],
    amount: 890,
    deliveryFee: 60,
    payMode: "COD",
    status: "DISPATCHED",
    events: [],
  },
  {
    id: "demo-4",
    orderNo: "HM2026S0923",
    date: daysAgo(9),
    pharmacy: "HomeoCare Pharmacy",
    doctorName: "Dr. Rohit Mehta",
    items: [{ name: "Arsenicum Album", potency: "30C", qty: 2, price: 595 }],
    amount: 1250,
    deliveryFee: 60,
    payMode: "ONLINE",
    status: "DELIVERED",
    events: [],
  },
].map((order) => ({ ...order, erxId: null, reviewed: false, isDemo: true }));

const DEMO_STORAGE_KEY = "niga.patientDemoMedicineOrders";

export const readDemoOrders = () => {
  try {
    const list = JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
};

export const saveDemoOrder = (order) => {
  const list = [order, ...readDemoOrders()].slice(0, 20);
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list));
};

export const replaceDemoOrder = (order) => {
  const list = readDemoOrders();
  if (!list.some((row) => row.id === order.id)) return;
  sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(list.map((row) => (row.id === order.id ? order : row))));
};

export const buildDemoOrder = ({ prescription, pharmacy }) => ({
  id: `demo-${Date.now()}`,
  orderNo: `HM${moment().format("YYYY")}S${String(Date.now()).slice(-4)}`,
  date: new Date().toISOString(),
  pharmacy: pharmacy?.name || "Auto-routed pharmacy",
  doctorName: prescription?.doctorName || "",
  erxId: null,
  items: (prescription?.remedies || []).map((remedy) => ({
    name: remedy.name,
    potency: remedy.potency,
    qty: 1,
    price: 0,
  })),
  amount: 0,
  deliveryFee: 0,
  payMode: "",
  status: "CREATED",
  events: [],
  reviewed: false,
  isDemo: true,
});
