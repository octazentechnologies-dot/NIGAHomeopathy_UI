import React from "react";

/**
 * Shared pagination footer used by admin list pages (matches Language list pattern).
 */
const AdminListPagination = ({ currentPage, totalPages, setCurrentPage, onPageChange }) => {
  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) onPageChange(page);
    else setCurrentPage(page);
  };

  const handlePrev = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  return (
    <div className="align-items-center g-3 text-center text-sm-start row mt-3">
      <div className="col-sm">
        <div className="text-muted">
          Showing <span className="fw-semibold ms-1">{currentPage}</span> of{" "}
          <span className="fw-semibold">{totalPages}</span> Pages
        </div>
      </div>
      <div className="col-sm-auto">
        <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button type="button" className="page-link" onClick={handlePrev}>
              Previous
            </button>
          </li>
          {currentPage > 3 && (
            <>
              <li className="page-item">
                <button type="button" className="page-link" onClick={() => goToPage(1)}>
                  1
                </button>
              </li>
              {currentPage > 4 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}
          {[...Array(totalPages)].map((_, index) => {
            const page = index + 1;
            if (page === currentPage || page === currentPage - 1 || page === currentPage + 1) {
              return (
                <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                  <button type="button" className="page-link" onClick={() => goToPage(page)}>
                    {page}
                  </button>
                </li>
              );
            }
            return null;
          })}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button type="button" className="page-link" onClick={() => goToPage(totalPages)}>
                  {totalPages}
                </button>
              </li>
            </>
          )}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button type="button" className="page-link" onClick={handleNext}>
              Next
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminListPagination;
