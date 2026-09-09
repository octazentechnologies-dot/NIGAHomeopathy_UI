import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getRemedyGradesList, deleteRemedyGrade } from '../../../../slices/thunks';
import Swal from 'sweetalert2';

const RemedyGradeList = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const remedyGradesLoading = useSelector((state) => state?.RemedyGrade?.loading || false);
  const remedyGradesList = useSelector((state) => state?.RemedyGrade?.remedyGradesList);
  const remedyGrades = Array.isArray(remedyGradesList)
    ? remedyGradesList
    : (remedyGradesList?.resultObject || []);
  const totalPages = useSelector((state) => state?.RemedyGrade?.remedyGradesList?.totalPageCount || 1);
  const totalRecords = useSelector(
    (state) => state?.RemedyGrade?.remedyGradesList?.totalRecordCount || remedyGrades.length || 0
  );

  useEffect(() => {
    dispatch(getRemedyGradesList({ PageNumber: currentPage, PageSize: pageSize, queryString: searchQuery }));
  }, [currentPage, searchQuery, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = (remedyGrade) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete grade number "${remedyGrade.gradeNo}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteRemedyGrade({
          gradeId: remedyGrade.gradeId,
          GradeNo: remedyGrade.gradeNo,
          Description: remedyGrade.description,
          FontName: remedyGrade.fontName,
          FontStyle: remedyGrade.fontStyle,
          FontColor: remedyGrade.fontColor,
          EnteredBy: 'Admin',
          DeleteStatus: true,
        })).then(() => {
          setCurrentPage(1);
          Swal.fire('Deleted!', 'The remedy grade has been deleted.', 'success');
        }).catch(() => {
          Swal.fire('Error!', 'Something went wrong.', 'error');
        });
      }
    });
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Remedy Grade';
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list">
                <CardHeader className="border-0">
                  <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                    <div className="patient-list-modal__search flex-shrink-0">
                      <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export">
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/addremedygrade" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                          New
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table" id="customerTable">
                      <thead>
                        <tr>
                          <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                          <th scope="col">Grade No</th>
                          <th scope="col">Description</th>
                          <th scope="col">Font Name</th>
                          <th scope="col">Font Style</th>
                          <th scope="col">Font Color</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {remedyGradesLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="7" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {remedyGrades?.length > 0 ? (
                            remedyGrades.map((remedyGrade, index) => (
                              <tr key={remedyGrade.gradeId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{remedyGrade.gradeNo || '—'}</td>
                                <td>{remedyGrade.description || '—'}</td>
                                <td>{remedyGrade.fontName || '—'}</td>
                                <td>{remedyGrade.fontStyle || '—'}</td>
                                <td>{remedyGrade.fontColor || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editremedygrade" state={{ selectedRemedyGrade: remedyGrade }}>
                                        <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                    </div>
                                    <div className="remove">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => handleDelete(remedyGrade)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="text-center text-muted py-4">
                                {searchQuery ? 'No remedy grades match your search' : 'No Remedy Grades Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {remedyGradesLoading
                        ? 'Loading...'
                        : `Showing ${remedyGrades.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
                    </div>
                    <ul className="pagination pagination-separated pagination-md mb-0 admin-list-pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button type="button" className="page-link page-link--nav" onClick={handlePrevPage}>
                          Previous
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <li key={index} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                              <button type="button" className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                                {pageNumber}
                              </button>
                            </li>
                          );
                        }
                        if (pageNumber === 2 || pageNumber === totalPages - 1) {
                          return (
                            <li key={index} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button type="button" className="page-link page-link--nav" onClick={handleNextPage}>
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default RemedyGradeList;
