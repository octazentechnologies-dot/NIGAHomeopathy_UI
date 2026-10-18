/** True when any text or number on the row contains the query. Mobile matches ignore spaces and +91. */
export const recordMatchesQuery = (record, query) => {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;

  const parts = [];
  const visit = (value) => {
    if (value == null || value === "") return;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(String(value));
    }
  };

  if (record && typeof record === "object") {
    Object.values(record).forEach(visit);
  }

  const blob = parts.join(" ").toLowerCase();
  if (blob.includes(needle)) return true;

  const digits = needle.replace(/\D/g, "");
  if (digits.length >= 3) {
    return blob.replace(/\D/g, "").includes(digits);
  }
  return false;
};
