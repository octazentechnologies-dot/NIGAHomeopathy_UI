import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import { getIntensitiesList, deleteIntensity } from '../../../../slices/admin/repertory/intensity/thunk';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const IntensityList = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [intensityToDelete, setIntensityToDelete] = useState(null);

  // Redux state
  const intensitiesLoading = useSelector((state) => state?.Intensity?.loading || false);
  const intensities = useSelector((state) => state?.Intensity?.intensitiesList?.resultObject || []);
  const totalPages = useSelector((state) => state?.Intensity?.intensitiesList?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getIntensitiesList({ PageNumber: currentPage, PageSize: pageSize }));
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getIntensitiesList({ PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getIntensitiesList({ PageNumber: currentPage + 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Delete functionality
  const onClickDelete = (intensity) => {
    setIntensityToDelete(intensity);
    setDeleteModal(true);
  };

  const handleDeleteIntensity = () => {
    if (intensityToDelete) {
      // Set deleteStatus to true and pass the whole item
      const intensityWithDeleteStatus = {
        ...intensityToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId
      };

      dispatch(deleteIntensity(intensityWithDeleteStatus));
      setDeleteModal(false);
      setIntensityToDelete(null);
    }
  };

  document.title = "List Intensity";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}

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
                        <Link to="/admin/addintensity"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Intensity No</th>
                            <th>Description</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {intensitiesLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="4" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {intensities?.length > 0 ? (
                              intensities?.map((intensity, index) => (
                                <tr key={index}>
                                  <td>{intensity.intensityId}</td>
                                  <td>{intensity.intensityNo}</td>
                                  <td>{intensity.description}</td>
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editintensity" state={{ selectedIntensity: intensity }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => onClickDelete(intensity)}><i className="ri-delete-bin-5-line" /> </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center">No Intensities Available</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>

                    <div class="align-items-center g-3 text-center text-sm-start row">
                      <div class="col-sm">
                        <div class="text-muted">
                          Showing<span class="fw-semibold ms-1">{currentPage}</span> of <span class="fw-semibold">{totalPages}</span> Pages
                        </div>
                      </div>
                      <div class="col-sm-auto">
                        <ul class="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handlePrevPage}>Previous</button>
                          </li>

                          {currentPage > 3 && (
                            <>
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                              </li>
                              {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            </>
                          )}

                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                              page === currentPage ||
                              page === currentPage - 1 ||
                              page === currentPage + 1
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                              </li>
                            </>
                          )}

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
        onDeleteClick={handleDeleteIntensity}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default IntensityList;