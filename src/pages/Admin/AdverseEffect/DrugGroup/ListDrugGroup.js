import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { getDrugGroupList, deleteDrugGroup } from "../../../../slices/admin/druggroup/thunk";
import DeleteModal from '../../../../Components/Common/DeleteModal';

const DrugGroupList = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [drugGroupToDelete, setDrugGroupToDelete] = useState(null);

  // Redux state
  const drugGroupLoading = useSelector((state) => state?.DrugGroup?.drugGroupLoading || false);
  const drugGroups = useSelector((state) => state?.DrugGroup?.drugGroupList?.resultObject || []);
  const totalPages = useSelector((state) => state?.DrugGroup?.drugGroupList?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getDrugGroupList({ PageNumber: currentPage, PageSize: pageSize }));
  }, [currentPage]);

  // Delete functionality
  const onClickDelete = (drugGroup) => {
    setDrugGroupToDelete(drugGroup);
    setDeleteModal(true);
  };

  const handleDeleteDrugGroup = () => {
    if (drugGroupToDelete) {
      // Set deleteStatus to true and pass the whole item
      const drugGroupWithDeleteStatus = {
        ...drugGroupToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId
      };

      dispatch(deleteDrugGroup(drugGroupWithDeleteStatus));
      setDeleteModal(false);
      setDrugGroupToDelete(null);
    }
  };

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getDrugGroupList({ PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getDrugGroupList({ PageNumber: currentPage + 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  document.title = "List Drug Group";
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
                          <input type="text" className="form-control form-control-sm search" placeholder="Search..." />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm">
                          <i className=" ri-newspaper-line align-middle"></i> Import
                        </button>
                        <button type="button" className="btn btn-soft-secondary btn-sm">
                          <i className="ri-file-list-3-line align-middle"></i> Export
                        </button>
                        <Link to="/admin/adddruggroup">
                          <button type="button" className="btn btn-soft-info btn-sm">
                            <i className="ri-add-line align-middle"></i> New
                          </button>
                        </Link>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <div className="listjs-table" id="customerList">
                    <div className="table-responsive table-card">
                      <table className="table align-middle table-nowrap" id="customerTable">
                        <thead>
                          <tr>
                            <th scope="col" style={{ width: "50px" }}>ID</th>
                            <th>Drug Group Name</th>
                            <th>Drug System Name</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {drugGroupLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="4" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {drugGroups?.length > 0 ? (
                              drugGroups.map((drugGroup, index) => (
                                <tr key={index}>
                                  <td>{drugGroup.drugGroupId}</td>
                                  <td>{drugGroup.drugGroupName}</td>
                                  <td>{drugGroup.drugSystemName}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editdruggroup" state={{ selectedDrugGroup: drugGroup }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
                                          onClick={() => onClickDelete(drugGroup)}
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
                                <td colSpan="4" className="text-center">No Drug Groups Available</td>
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
        onDeleteClick={handleDeleteDrugGroup}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default DrugGroupList;