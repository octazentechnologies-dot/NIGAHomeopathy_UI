import { pageWindow } from "../../helpers/pageWindow";
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
  if (status === "Closed" || status === "Resolved") return "bg-secondary";
  return "bg-success";
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getVisiblePageItems = (currentPage, totalPages) => pageWindow(currentPage, totalPages, "ellipsis");

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
