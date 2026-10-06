import moment from "moment";

export const USER_TYPES = [
  { id: "patient", label: "Patient", tab: "Patients", prefix: "P", roleNames: ["patient"] },
  { id: "doctor", label: "Doctor", tab: "Doctors", prefix: "D", roleNames: ["doctor"] },
  { id: "admin", label: "Admin", tab: "Admins", prefix: "A", roleNames: ["admin", "management"] },
  { id: "reception", label: "Reception", tab: "Reception", prefix: "R", roleNames: ["reception"] },
  { id: "pharmacy", label: "Pharmacy", tab: "Pharmacy", prefix: "PH", roleNames: ["pharmacy", "pharmacypartner"] },
  { id: "account", label: "Account", tab: "Accounts", prefix: "AC", roleNames: ["account"] },
];

export const STATUS_OPTIONS = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "pending", label: "Pending" },
];

export const VERIFICATION_LABELS = {
  verified: "Verified",
  pending: "Pending",
  unverified: "Not verified",
};

export const CSV_COLUMNS = ["First Name", "Last Name", "User Name", "Email", "Phone", "User Type", "Password", "Status"];

const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return null;
};

export const typeFromRoleName = (roleName) => {
  const key = String(roleName || "").replace(/\s+/g, "").toLowerCase();
  if (!key) return "other";
  const match = USER_TYPES.find((t) => t.roleNames.includes(key));
  return match ? match.id : "other";
};

export const typeLabel = (typeId) => USER_TYPES.find((t) => t.id === typeId)?.label || "Other";

export const userCode = (user) => {
  const prefix = USER_TYPES.find((t) => t.id === user.type)?.prefix || "U";
  const raw = String(user.userId ?? user.id ?? "").replace(/\D/g, "");
  return `#${prefix}${raw.padStart(3, "0")}`;
};

const statusFrom = (row) => {
  const value = pick(row, "userStatus", "UserStatus", "status", "Status");
  if (typeof value === "boolean") return value ? "active" : "inactive";
  const text = String(value ?? "").toLowerCase();
  if (/pending|await/.test(text)) return "pending";
  if (/inactive|block|disable|reject|false/.test(text)) return "inactive";
  if (text) return "active";
  return row?.isActive === false || row?.IsActive === false ? "inactive" : "active";
};

const verificationFrom = (row, status) => {
  const value = pick(row, "isVerified", "IsVerified", "emailVerified", "EmailVerified", "verificationStatus", "VerificationStatus");
  if (typeof value === "boolean") return value ? "verified" : "unverified";
  const text = String(value ?? "").toLowerCase();
  if (/verified|approved/.test(text) && !/un|not/.test(text)) return "verified";
  if (/pending|review|submitted/.test(text)) return "pending";
  if (text) return "unverified";
  if (status === "active") return "verified";
  return status === "pending" ? "pending" : "unverified";
};

export const normalizeApiUser = (row, roleNameById = {}) => {
  const roleId = pick(row, "roleId", "RoleId");
  const roleName = pick(row, "roleName", "RoleName", "role", "Role") || roleNameById[roleId] || "";
  const firstName = pick(row, "firstName", "FirstName") || "";
  const lastName = pick(row, "lastName", "LastName") || "";
  const userName = pick(row, "userName", "UserName") || "";
  const status = statusFrom(row);
  return {
    id: String(pick(row, "userId", "UserId", "id") ?? userName),
    userId: pick(row, "userId", "UserId"),
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || pick(row, "fullName", "FullName") || userName || "—",
    userName,
    email: pick(row, "emailId", "EmailId", "email", "Email") || "",
    phone: pick(row, "mobileNo", "MobileNo", "phoneNumber", "PhoneNumber", "mobile", "Mobile") || "",
    roleId: roleId != null ? Number(roleId) : null,
    roleName,
    type: typeFromRoleName(roleName),
    status,
    verification: verificationFrom(row, status),
    joined: pick(row, "createdDate", "CreatedDate", "createdAt", "CreatedAt", "enteredDate", "EnteredDate"),
    sample: false,
  };
};

const daysAgo = (days) => moment().subtract(days, "days").toISOString();

const SAMPLE_ROWS = [
  [210245, "Aarav", "Patil", "aarav.patil", "aarav@gmail.com", "9876543210", "Patient", "active", "verified", 2],
  [210244, "Ananya", "Shah", "ananya.shah", "ananya@gmail.com", "9876501234", "Patient", "active", "verified", 4],
  [21, "N.", "Gaurav", "dr.gaurav", "dr.gaurav@clinic.com", "9876512345", "Doctor", "active", "verified", 40],
  [22, "Priya", "Kulkarni", "dr.priya", "dr.priya@clinic.com", "9876523456", "Doctor", "pending", "pending", 3],
  [210243, "Rohan", "Deshmukh", "rohan.d", "rohan@gmail.com", "9876549876", "Patient", "active", "verified", 8],
  [210241, "Sneha", "Joshi", "sneha.joshi", "sneha@gmail.com", "9876598765", "Patient", "active", "verified", 12],
  [10, "Rekha", "Shinde", "rekha.shinde", "rekha@mclinic.com", "9876505678", "Reception", "active", "verified", 60],
  [2, "Mumbai", "Pharmacy", "mumbai.pharmacy", "pharmacy@mumbai.com", "9876234566", "Pharmacy", "active", "verified", 75],
  [1, "Digvijay", "Admin", "a.digvijay", "admin@homeocentrum.com", "9822011223", "Admin", "active", "verified", 300],
  [5, "Kiran", "Mehta", "kiran.accounts", "accounts@homeocentrum.com", "9890011122", "Account", "active", "verified", 120],
  [23, "Imran", "Shaikh", "dr.imran", "dr.imran@clinic.com", "9765432109", "Doctor", "inactive", "unverified", 90],
  [210240, "Rahul", "Verma", "rahul.v", "rahul.v@gmail.com", "9004022110", "Patient", "inactive", "unverified", 30],
  [3, "Pune", "MedPlus", "pune.medplus", "medplus@pune.com", "9850077889", "Pharmacy", "pending", "pending", 1],
  [210239, "Meera", "Iyer", "meera.i", "meera.i@gmail.com", "9819033221", "Patient", "active", "verified", 52],
];

export const SAMPLE_USERS = SAMPLE_ROWS.map(
  ([userId, firstName, lastName, userName, email, phone, roleName, status, verification, joinedDays]) => {
    const type = typeFromRoleName(roleName);
    return {
      id: `sample-${type}-${userId}`,
      userId,
      firstName: type === "doctor" ? `Dr. ${firstName}` : firstName,
      lastName,
      name: `${type === "doctor" ? "Dr. " : ""}${firstName} ${lastName}`,
      userName,
      email,
      phone,
      roleId: null,
      roleName,
      type,
      status,
      verification,
      joined: daysAgo(joinedDays),
      sample: true,
    };
  }
);

export const formatJoined = (value) => {
  const m = value ? moment(value) : null;
  return m && m.isValid() ? m.format("DD MMM YYYY") : "—";
};

export const initialsOf = (name) =>
  String(name || "?")
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const downloadCsv = (filename, rows) => {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadImportTemplate = () =>
  downloadCsv("platform-users-template.csv", [
    CSV_COLUMNS,
    ["Aarav", "Patil", "aarav.patil", "aarav@gmail.com", "9876543210", "Patient", "Welcome@123", "Active"],
  ]);

export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim()));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => EMAIL_RE.test(String(value || "").trim());

/** Maps parsed CSV rows (first row = header) to import candidates with per-row validation errors. */
export const buildImportRows = (parsed) => {
  if (!parsed.length) return [];
  const header = parsed[0].map((h) => String(h).trim().toLowerCase().replace(/[\s_]+/g, ""));
  const col = (row, ...names) => {
    const index = header.findIndex((h) => names.includes(h));
    return index >= 0 ? String(row[index] ?? "").trim() : "";
  };
  return parsed.slice(1).map((row, index) => {
    const candidate = {
      line: index + 2,
      firstName: col(row, "firstname"),
      lastName: col(row, "lastname"),
      userName: col(row, "username"),
      email: col(row, "email", "emailid"),
      phone: col(row, "phone", "mobile", "mobileno"),
      roleName: col(row, "usertype", "role", "rolename"),
      password: col(row, "password"),
      status: /inactive|false|no/i.test(col(row, "status")) ? "inactive" : "active",
    };
    const errors = [];
    if (!candidate.firstName) errors.push("First name missing");
    if (!candidate.userName) errors.push("User name missing");
    if (!isValidEmail(candidate.email)) errors.push("Invalid email");
    if (typeFromRoleName(candidate.roleName) === "other") errors.push("Unknown user type");
    return { ...candidate, type: typeFromRoleName(candidate.roleName), errors };
  });
};
