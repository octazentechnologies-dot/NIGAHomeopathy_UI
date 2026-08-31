import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Spinner, Input } from 'reactstrap';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useSelector, useDispatch } from 'react-redux';
import { getDiagnosisConditionsList, deleteDiagnosisCondition } from '../../../../slices/thunks';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListDiagnosisConditions = () => {
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');

  const [deleteModal, setDeleteModal] = useState(false);
  const [diagnosisConditonToDelete, setDiagnosisSystemToDelete] = useState(null);


  // Redux state
  const loading = useSelector((state) => state?.DiagnosisCondition?.diagnosisConditionLoading || false);
  const conditions = useSelector((state) => state?.DiagnosisCondition?.diagnosisConditionsList?.resultObject || []);
  const totalPages = useSelector((state) => state?.DiagnosisCondition?.diagnosisConditionsList?.totalPageCount || 1);

  // Initial load with loading spinner
  useEffect(() => {
    dispatch(getDiagnosisConditionsList({ PageNumber: currentPage, PageSize: pageSize, queryString: search }, true));
    // eslint-disable-next-line
  }, []);

  // On search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
    dispatch(getDiagnosisConditionsList({ PageNumber: 1, PageSize: pageSize, queryString: e.target.value }, false));
  };

  // On page change
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      dispatch(getDiagnosisConditionsList({ PageNumber: newPage, PageSize: pageSize, queryString: search }, false));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      dispatch(getDiagnosisConditionsList({ PageNumber: newPage, PageSize: pageSize, queryString: search }, false));
    }
  };

  // Delete functionality
  const onClickDelete = (diagnosisCondition) => {
    setDiagnosisSystemToDelete(diagnosisCondition);
    setDeleteModal(true);
  };

  const handleDeleteDiagnosisSystem = () => {
    if (diagnosisConditonToDelete) {
      // Set deleteStatus to true and pass the whole item
      const diagnosisConditonWithDeleteStatus = {
        ...diagnosisConditonToDelete,
        DeleteStatus: true,
      };

      dispatch(deleteDiagnosisCondition(diagnosisConditonWithDeleteStatus));
      setDeleteModal(false);
      setDiagnosisSystemToDelete(null);
    }
  };

  const handleDelete = (condition) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete "${condition.diagnosisName}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteDiagnosisCondition({
          diagnosisId: condition.diagnosisId,
          DiagnosisName: "jddj",
          DiagnosisNameAlias: "mccm",
          Description: "mcmcm",
          Keywords: "nxx",
          DiagnosisGroupId: "3",
          SectionId: "5",
          SubSectionId: "6",
          EnteredBy: 'Admin',
          DeleteStatus: true
        }))
          .then(() => {
            setCurrentPage(1);
            Swal.fire('Deleted!', 'The diagnosis condition has been deleted.', 'success');
          })
          .catch(() => {
            Swal.fire('Error!', 'Something went wrong.', 'error');
          });
      }
    });
  };

  document.title = 'List Diagnosis & Conditions';
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
                          <input type="text" className="form-control form-control-sm search" placeholder="Search..."
                            value={search} onChange={handleSearch} /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/adddiagnosisconditions"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th scope="col" style={{ width: '50px' }}>ID</th>
                            <th>Diagnosis Name</th>
                            <th>Diagnosis Name Alias</th>
                            <th className="text-center" style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {loading ? (
                          <tbody>
                            <tr>
                              <td colSpan="4" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {conditions?.length > 0 ? (
                              conditions.map((condition, index) => (
                                <tr key={condition.diagnosisId}>
                                  <td>{condition.diagnosisId}</td>
                                  <td>{condition.diagnosisName}</td>
                                  <td>{condition.diagnosisNameAlias}</td>
                                  <td className="text-center ">
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editdiagnosisconditions" state={{ selectedCondition: condition }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => onClickDelete(condition)}><i className="ri-delete-bin-5-line" /> </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center">No Diagnosis Conditions Available</td>
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
                                <button className="page-link" onClick={() => { setCurrentPage(1); dispatch(getDiagnosisConditionsList({ PageNumber: 1, PageSize: pageSize, queryString: search }, false)); }}>1</button>
                              </li>
                              {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            </>
                          )}
                          {/* Dynamic Page Numbers */}
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                              page === currentPage ||
                              page === currentPage - 1 ||
                              page === currentPage + 1
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => { setCurrentPage(page); dispatch(getDiagnosisConditionsList({ PageNumber: page, PageSize: pageSize, queryString: search }, false)); }}>{page}</button>
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
                                <button className="page-link" onClick={() => { setCurrentPage(totalPages); dispatch(getDiagnosisConditionsList({ PageNumber: totalPages, PageSize: pageSize, queryString: search }, false)); }}>{totalPages}</button>
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
        onDeleteClick={handleDeleteDiagnosisSystem}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListDiagnosisConditions;