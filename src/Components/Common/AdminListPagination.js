import React, { useState } from "react";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import Swal from "sweetalert2";

/** Same page bar as /admin/listsubsection, including Go to page. */
const AdminListPagination = ({ currentPage, totalPages, onPage }) => {
  const [goToPageInput, setGoToPageInput] = useState("");
  const pages = Math.max(1, Math.floor(Number(totalPages) || 1));
  const page = Math.min(Math.max(1, Math.floor(Number(currentPage) || 1)), pages);

  const goTo = (next) => {
    if (typeof onPage === "function") onPage(next);
  };

  const handleGoToPageInputChange = (event) => {
    setGoToPageInput(String(event.target.value || "").replace(/[^\d]/g, ""));
  };

  const handleGoToPage = () => {
    const target = Number.parseInt(goToPageInput, 10);
    if (!Number.isFinite(target) || Number.isNaN(target)) {
      Swal.fire({
        title: "Invalid page number",
        text: `Please enter a page number between 1 and ${pages}.`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    if (target < 1 || target > pages) {
      Swal.fire({
        title: "Invalid page number",
        text: `Page number must be between 1 and ${pages}.`,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    goTo(target);
    setGoToPageInput("");
  };

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <ul className="pagination pagination-separated pagination-md mb-0 admin-list-pagination">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button type="button" className="page-link page-link--nav" onClick={() => page > 1 && goTo(page - 1)}>
            Previous
          </button>
        </li>
        {[...Array(pages)].map((_, index) => {
          const pageNumber = index + 1;
          if (
            pageNumber === 1 ||
            pageNumber === pages ||
            (pageNumber >= page - 1 && pageNumber <= page + 1)
          ) {
            return (
              <li key={pageNumber} className={`page-item ${page === pageNumber ? "active" : ""}`}>
                <button type="button" className="page-link" onClick={() => goTo(pageNumber)}>
                  {pageNumber}
                </button>
              </li>
            );
          }
          if (pageNumber === 2 || pageNumber === pages - 1) {
            return (
              <li key={pageNumber} className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            );
          }
          return null;
        })}
        <li className={`page-item ${page === pages ? "disabled" : ""}`}>
          <button type="button" className="page-link page-link--nav" onClick={() => page < pages && goTo(page + 1)}>
            Next
          </button>
        </li>
      </ul>
      <InputGroup size="sm" style={{ width: "190px" }}>
        <InputGroupText>Go to</InputGroupText>
        <Input
          value={goToPageInput}
          onChange={handleGoToPageInputChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleGoToPage();
            }
          }}
          placeholder="Page #"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Go to page number"
          disabled={pages <= 1}
        />
        <Button color="primary" outline onClick={handleGoToPage} disabled={pages <= 1}>
          Go
        </Button>
      </InputGroup>
    </div>
  );
};

export default AdminListPagination;
