import React from "react";
import { PaginationItem, PaginationLink } from "reactstrap";

export const PAGE_SIZE = 5;

export const priorityBadgeClass = (priority) => {
  if (priority === "High" || priority === "Urgent") return "bg-danger";
  if (priority === "Medium") return "bg-warning";
  return "bg-success";
};

export const priorityTextClass = (priority) => {
  if (priority === "High" || priority === "Urgent") return "text-danger";
  if (priority === "Medium") return "text-warning";
  return "text-success";
};

export const statusBadgeClass = (status) => {
  if (status === "Open") return "bg-primary";
  if (status === "Pending") return "bg-warning";
  if (status === "In Progress") return "bg-info";
  if (status === "Closed") return "bg-secondary";
  return "bg-success";
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getVisiblePageItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, idx) => {
    if (idx > 0 && page - sorted[idx - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
};

export const CompactPaginationPages = ({ currentPage, totalPages, onPageChange }) => {
  const items = getVisiblePageItems(currentPage, totalPages);
  let ellipsisKey = 0;
  return items.map((item) => {
    if (item === "ellipsis") {
      ellipsisKey += 1;
      return (
        <PaginationItem key={`ellipsis-${ellipsisKey}`} disabled>
          <PaginationLink href="#" onClick={(e) => e.preventDefault()}>
            …
          </PaginationLink>
        </PaginationItem>
      );
    }
    return (
      <PaginationItem active={item === currentPage} key={item}>
        <PaginationLink
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onPageChange(item);
          }}
        >
          {item}
        </PaginationLink>
      </PaginationItem>
    );
  });
};
