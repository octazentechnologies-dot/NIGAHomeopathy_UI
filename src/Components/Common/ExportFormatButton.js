import React, { useState } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import Swal from "sweetalert2";
import { EXPORT_FORMATS, downloadExport, downloadTableElement } from "../../helpers/exportFormats";

/**
 * Download dropdown: CSV / Excel / PDF.
 *
 * Pass either:
 * - columns + rows (+ fileBase / title), or
 * - fromTable: true (finds nearest table on the page), or
 * - onExport(format): custom async handler (return false to fall through)
 */
const ExportFormatButton = ({
  label = "Download",
  fileBase = "export",
  title = "Export",
  columns = null,
  rows = null,
  sheetName,
  fromTable = false,
  tableSelector = null,
  onExport = null,
  disabled = false,
  className = "btn btn-sm btn-soft-secondary",
  color = "soft-secondary",
  size = "sm",
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (format) => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      if (onExport) {
        const handled = await onExport(format);
        if (handled !== false) return;
      }
      if (fromTable) {
        const table = tableSelector
          ? document.querySelector(tableSelector)
          : document.querySelector(".clinic-data-table") ||
            document.querySelector(".patient-list-modal__table") ||
            document.querySelector(".card table") ||
            document.querySelector("table");
        downloadTableElement(table, format, fileBase, title);
        return;
      }
      downloadExport({ format, fileBase, columns, rows, title, sheetName });
    } catch (err) {
      if (err?.code === "EMPTY" || err?.code === "NO_TABLE") {
        Swal.fire({ icon: "info", title: "Nothing to export", text: err.message });
      } else {
        Swal.fire({
          icon: "error",
          title: "Export failed",
          text: err?.message || "Could not download the file.",
        });
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <Dropdown isOpen={open} toggle={() => !busy && setOpen((v) => !v)}>
      <DropdownToggle caret color={color} size={size} className={className} disabled={disabled || busy}>
        <i className={`${busy ? "ri-loader-4-line" : "ri-download-2-line"} me-1`} aria-hidden="true" />
        {busy ? "Preparing…" : label}
      </DropdownToggle>
      <DropdownMenu end>
        {EXPORT_FORMATS.map((fmt) => (
          <DropdownItem key={fmt.id} onClick={() => run(fmt.id)}>
            <i className={`${fmt.icon} me-2`} aria-hidden="true" />
            {fmt.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default ExportFormatButton;
