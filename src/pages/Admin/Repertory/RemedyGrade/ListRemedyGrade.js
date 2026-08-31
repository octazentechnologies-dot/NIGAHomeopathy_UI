import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import { getRemedyGradesList, deleteRemedyGrade } from '../../../../slices/thunks';
import Swal from "sweetalert2";

const RemedyGradeList = () => {
  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Redux state
  const remedyGradesLoading = useSelector((state) => state?.RemedyGrade?.loading || false);
  const remedyGrades = useSelector((state) => state?.RemedyGrade?.remedyGradesList || []);
  const totalPages = useSelector((state) => state?.RemedyGrade?.remedyGradesList?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getRemedyGradesList());
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getRemedyGradesList({ PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getRemedyGradesList({ PageNumber: currentPage + 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDelete = (remedyGrade) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete grade number "${remedyGrade.gradeNo}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        console.log({
          gradeId: remedyGrade.gradeId,
          GradeNo: remedyGrade.gradeNo,
          Description: remedyGrade.description,
          FontName: remedyGrade.fontName,
          FontStyle: remedyGrade.fontStyle,
          FontColor: remedyGrade.fontColor,
          EnteredBy: 'Admin',
          DeleteStatus: true
        })
        dispatch(deleteRemedyGrade({
          gradeId: remedyGrade.gradeId,
          GradeNo: remedyGrade.gradeNo,
          Description: remedyGrade.description,
          FontName: remedyGrade.fontName,
          FontStyle: remedyGrade.fontStyle,
          FontColor: remedyGrade.fontColor,
          EnteredBy: 'Admin',
          DeleteStatus: true
        })).then(() => {
          setCurrentPage(1);
          Swal.fire("Deleted!", "The remedy grade has been deleted.", "success");
        }).catch(() => {
          Swal.fire("Error!", "Something went wrong.", "error");
        });
      }
    });
  };

  document.title = "List Remedy Grade";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <Row className="g-4">
                    <Col className="col-sm">
                      <div className="d-flex justify-content-sm-start">
                        <div className="search-box">
                          <input type="text" className="form-control form-control-sm search" placeholder="Search..." /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addremedygrade"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>

                <CardBody>
                  <div className="listjs-table" id="customerList">
                    <div className="table-responsive table-card">
                      <table className="table align-middle table-nowrap" id="customerTable">
                        <thead className="">
                          <tr>
                            <th scope="col" style={{ width: "50px" }}>ID</th>
                            <th>Grade No</th>
                            <th>Description</th>
                            <th>Font Name</th>
                            <th>Font Style</th>
                            <th>Font Color</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {remedyGradesLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="7" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {remedyGrades?.length > 0 ? (
                              remedyGrades?.map((remedyGrade, index) => (
                                <tr key={index}>
                                  <td>{remedyGrade.gradeId}</td>
                                  <td>{remedyGrade.gradeNo}</td>
                                  <td>{remedyGrade.description}</td>
                                  <td>{remedyGrade.fontName}</td>
                                  <td>{remedyGrade.fontStyle}</td>
                                  <td>{remedyGrade.fontColor}</td>
                                  <td className='text-center'>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editremedygrade" state={{ selectedRemedyGrade: remedyGrade }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(remedyGrade)}>
                                          <i className="ri-delete-bin-5-line" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="text-center">No Remedy Grades Available</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="align-items-center g-3 text-center text-sm-start row mt-3">
                      <div className="col-sm">
                        <div className="text-muted">
                          Showing <span className="fw-semibold ms-1">{currentPage}</span> of <span className="fw-semibold">{totalPages}</span> Pages
                        </div>
                      </div>
                      <div className="col-sm-auto">
                        <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                          {/* Previous Button */}
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handlePrevPage}>Previous</button>
                          </li>

                          {/* First Page */}
                          {currentPage > 3 && (
                            <>
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                              </li>
                              {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            </>
                          )}

                          {/* Dynamic Page Numbers */}
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                              page === currentPage || // Current Page
                              page === currentPage - 1 || // One Before Current
                              page === currentPage + 1 // One After Current
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {/* Last Page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                              </li>
                            </>
                          )}

                          {/* Next Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handleNextPage}>Next</button>
                          </li>
                        </ul>
                      </div>
                    </div>
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