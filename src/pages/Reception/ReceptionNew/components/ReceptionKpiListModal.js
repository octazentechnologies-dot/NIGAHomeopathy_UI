import React, { useEffect, useMemo, useState } from "react";
import {
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
} from "reactstrap";

const PAGE_SIZE = 10;

export const statusBadgeClass = (status) => {
  if (status === "Paid" || status === "Completed" || status === "Active") {
    return "bg-success-subtle text-success";
  }
  if (status === "Waiting" || status === "Pending") {
    return "bg-warning-subtle text-warning";
  }
  if (status === "Unpaid") {
    return "bg-danger-subtle text-danger";
  }
  return "bg-secondary-subtle text-secondary";
};

const ReceptionKpiListModal = ({
  isOpen,
  toggle,
  title,
  icon = "ri-team-line",
  searchPlaceholder = "Search patient, mobile...",
  entityLabel = "Patients",
  emptyMessage = "No records available",
  columns = [],
  rows = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setCurrentPage(1);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const haystack = columns
        .map((col) => row[col.key])
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [rows, columns, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    if (column.type === "badge") {
      return <span className={`badge ${statusBadgeClass(value)}`}>{value}</span>;
    }
    if (column.type === "strong") {
      return <span className="fw-semibold">{value}</span>;
    }
    if (column.className) {
      return <span className={column.className}>{value}</span>;
    }
    return value;
  };

  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      toggle={toggle}
      className="patient-list-modal reception-kpi-list-modal"
      backdrop="static"
    >
      <ModalHeader className="patient-list-modal__header" toggle={toggle}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className={icon} style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">{title}</span>
        </span>
        <div className="patient-list-modal__header-actions">
          <div className="patient-list-modal__search">
            <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
            <Input
              size="sm"
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="table-responsive patient-list-modal__table-wrap">
          <table className="table mb-0 align-middle patient-list-modal__table">
            <thead>
              <tr>
                <th scope="col" className="text-center" style={{ width: "4%" }}>
                  #
                </th>
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row, index) => (
                <tr key={row.id}>
                  <td className="text-center patient-list-modal__index">
                    {startIndex + index + 1}
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className={column.tdClassName}>
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center text-muted py-4">
                    {searchTerm ? `No ${entityLabel.toLowerCase()} found matching your search` : emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 patient-list-modal__footer">
          <div className="text-muted patient-list-modal__footer-text">
            Showing {filtered.length === 0 ? 0 : startIndex + 1}–{startIndex + pageItems.length} of{" "}
            {filtered.length} {entityLabel}
            {searchTerm
              ? ` (filtered from ${rows.length} total)`
              : ` (from ${rows.length} total)`}
          </div>
          <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
            <PaginationItem disabled={safePage === 1}>
              <PaginationLink
                href="#"
                previous
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(Math.max(1, safePage - 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page} active={page === safePage}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem disabled={safePage === totalPages}>
              <PaginationLink
                href="#"
                next
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(Math.min(totalPages, safePage + 1));
                }}
              />
            </PaginationItem>
          </Pagination>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ReceptionKpiListModal;
