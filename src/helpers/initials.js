/** Up to two upper-case initials for an avatar placeholder ("Dr." prefix ignored). */
export const getInitials = (name, fallback = "?") => {
  const parts = String(name || "")
    .replace(/^Dr\.?\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};
