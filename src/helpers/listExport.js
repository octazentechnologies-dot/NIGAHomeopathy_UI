import Swal from "sweetalert2";
import { downloadTableElement } from "./exportFormats";

const fileNameFromTitle = () => {
  const base = String(document.title || "export")
    .split("|")[0]
    .replace(/^list\s+/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "export";
};

/**
 * Click handler for admin list "Export" buttons: prompts CSV / Excel / PDF,
 * then downloads the list table in the same card (Action column excluded).
 */
export const exportListTableCsv = async (event, fileName) => {
  const card = event?.currentTarget?.closest(".card") || document;
  const table = card.querySelector("table");
  if (!table) {
    Swal.fire({ icon: "info", title: "Nothing to export", text: "No table found on this page." });
    return;
  }

  const { value: format } = await Swal.fire({
    title: "Download as",
    input: "radio",
    inputOptions: {
      csv: "CSV",
      excel: "Excel (.xlsx)",
      pdf: "PDF",
    },
    inputValue: "csv",
    showCancelButton: true,
    confirmButtonText: "Download",
    inputValidator: (value) => (!value ? "Pick a format" : undefined),
  });
  if (!format) return;

  try {
    downloadTableElement(table, format, fileName || fileNameFromTitle(), document.title?.split("|")[0]?.trim() || "Export");
  } catch (err) {
    Swal.fire({
      icon: err?.code === "EMPTY" ? "info" : "error",
      title: err?.code === "EMPTY" ? "Nothing to export" : "Export failed",
      text: err?.message || "Could not download the file.",
    });
  }
};
