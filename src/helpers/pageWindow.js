/** Page buttons: 1 2 3 … last once there are more than four pages. */
export const pageWindow = (page, total, ellipsis = "…") => {
  const pages = Math.max(0, Number(total) || 0);
  if (pages <= 0) return [];
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  if (pages <= 4) return Array.from({ length: pages }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, ellipsis, pages];
  if (current >= pages - 2) return [1, ellipsis, pages - 2, pages - 1, pages];
  return [1, ellipsis, current - 1, current, current + 1, ellipsis, pages];
};
