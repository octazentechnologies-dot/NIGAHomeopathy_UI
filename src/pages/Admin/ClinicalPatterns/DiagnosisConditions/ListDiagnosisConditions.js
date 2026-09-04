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

  // Initial load + refresh on search/page
  useEffect(() => {
    dispatch(getDiagnosisConditionsList({ PageNumber: currentPage, PageSize: pageSize, queryString: search }, true));
  }, [currentPage, search, dispatch]);

  // On search
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // On page change
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
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
  const rowStart = (currentPage - 1) * pageSize;
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}

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
                        value={search}
                        onChange={handleSearch}
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
                      <Link to="/admin/adddiagnosisconditions" className="d-inline-flex">
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
                          <th scope="col">Diagnosis Name</th>
                          <th scope="col">Diagnosis Name Alias</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>

                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan="4" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {conditions?.length > 0 ? (
                            conditions.map((condition, index) => (
                              <tr key={condition.diagnosisId}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{condition.diagnosisName || '—'}</td>
                                <td>{condition.diagnosisNameAlias || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link
                                        to="/admin/editdiagnosisconditions"
                                        state={{ selectedCondition: condition }}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-success edit-item-btn"
                                          title="Edit"
                                        >
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                    </div>
                                    <div className="remove">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => onClickDelete(condition)}
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
                              <td colSpan="4" className="text-center text-muted py-4">
                                {search ? 'No Diagnosis Conditions match your search' : 'No Diagnosis Conditions Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {loading ? (
                        'Loading...'
                      ) : (
                        `Showing ${conditions.length} of ${conditions.length} Results · Page ${currentPage} of ${totalPages}`
                      )}
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteDiagnosisSystem}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListDiagnosisConditions;