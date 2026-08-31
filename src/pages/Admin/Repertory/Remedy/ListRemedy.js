import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, Col, Container, Row, Button, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import { getRemedyList, deleteRemedy } from '../../../../slices/admin/repertory/remedy/thunk';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListRemedy = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [remedyToDelete, setRemedyToDelete] = useState(null);

  // Redux state
  const remediesLoading = useSelector((state) => state?.Remedy?.loading || false);
  const remedies = useSelector((state) => state?.Remedy?.remedyList?.resultObject || []);
  const totalPages = useSelector((state) => state?.Remedy?.remedyList?.totalPageCount || 1);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery) {
      dispatch(getRemedyList({ queryString: searchQuery, PageNumber: currentPage, PageSize: pageSize }));
    } else {
      dispatch(getRemedyList({ PageNumber: currentPage, PageSize: pageSize }));
    }
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (searchQuery) {
        dispatch(getRemedyList({ queryString: searchQuery, PageNumber: currentPage - 1, PageSize: pageSize }));
      } else {
        dispatch(getRemedyList({ PageNumber: currentPage - 1, PageSize: pageSize }));
      }
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (searchQuery) {
        dispatch(getRemedyList({ queryString: searchQuery, PageNumber: currentPage + 1, PageSize: pageSize }));
      } else {
        dispatch(getRemedyList({ PageNumber: currentPage + 1, PageSize: pageSize }));
      }
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Delete functionality
  const onClickDelete = (remedy) => {
    setRemedyToDelete(remedy);
    setDeleteModal(true);
  };

  const handleDeleteRemedy = () => {
    if (remedyToDelete) {
      // Set deleteStatus to true and pass the whole item
      const remedyWithDeleteStatus = {
        ...remedyToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId
      };

      dispatch(deleteRemedy(remedyWithDeleteStatus));
      setDeleteModal(false);
      setRemedyToDelete(null);
    }
  };

  document.title = "List Remedy";
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
                          <input type="text" value={searchQuery} className="form-control form-control-sm search" placeholder="Search..."
                            onChange={(e) => {
                              if (e.target.value !== "") {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                                dispatch(getRemedyList({ queryString: e.target.value, PageNumber: 1, PageSize: pageSize }));
                              } else {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                                dispatch(getRemedyList({ PageNumber: 1, PageSize: pageSize }));
                              }
                            }} /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addremedy"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Remedy Name</th>
                            <th>Remedy Alias</th>
                            <th>Description</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {remediesLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="5" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {remedies?.length > 0 ? (
                              remedies?.map((remedy, index) => (
                                <tr key={index}>
                                  <td>{remedy.remedyId}</td>
                                  <td>{remedy.remedyName}</td>
                                  <td>{remedy.remedyAlias}</td>
                                  <td>{remedy.description}</td>
                                  <td className='text-center'>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editremedy" state={{ selectedRemedy: remedy }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => onClickDelete(remedy)}>
                                          <i className="ri-delete-bin-5-line" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">No Remedies Available</td>
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteRemedy}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListRemedy;