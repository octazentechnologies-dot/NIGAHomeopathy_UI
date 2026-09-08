import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getDrugGroupList, deleteDrugGroup } from '../../../../slices/admin/druggroup/thunk';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const DrugGroupList = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const [deleteModal, setDeleteModal] = useState(false);
  const [drugGroupToDelete, setDrugGroupToDelete] = useState(null);

  const drugGroupLoading = useSelector((state) => state?.DrugGroup?.drugGroupLoading || false);
  const drugGroups = useSelector((state) => state?.DrugGroup?.drugGroupList?.resultObject || []);
  const totalPages = useSelector((state) => state?.DrugGroup?.drugGroupList?.totalPageCount || 1);
  const totalRecords = useSelector(
    (state) => state?.DrugGroup?.drugGroupList?.totalRecordCount || drugGroups.length || 0
  );

  useEffect(() => {
    dispatch(getDrugGroupList({
      PageNumber: currentPage,
      PageSize: pageSize,
      queryString: searchQuery,
    }));
  }, [currentPage, searchQuery, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const onClickDelete = (drugGroup) => {
    setDrugGroupToDelete(drugGroup);
    setDeleteModal(true);
  };

  const handleDeleteDrugGroup = () => {
    if (drugGroupToDelete) {
      const drugGroupWithDeleteStatus = {
        ...drugGroupToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId,
      };

      dispatch(deleteDrugGroup(drugGroupWithDeleteStatus));
      setDeleteModal(false);
      setDrugGroupToDelete(null);
      setCurrentPage(1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Drug Group';
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
                      <Link to="/admin/adddruggroup" className="d-inline-flex">
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
                          <th scope="col">Drug Group Name</th>
                          <th scope="col">Drug System Name</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {drugGroupLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="4" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {drugGroups?.length > 0 ? (
                            drugGroups.map((drugGroup, index) => (
                              <tr key={drugGroup.drugGroupId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{drugGroup.drugGroupName || '—'}</td>
                                <td>{drugGroup.drugSystemName || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editdruggroup" state={{ selectedDrugGroup: drugGroup }}>
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
                              <td colSpan="4" className="text-center text-muted py-4">
                                {searchQuery ? 'No drug groups match your search' : 'No Drug Groups Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {drugGroupLoading
                        ? 'Loading...'
                        : `Showing ${drugGroups.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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
        onDeleteClick={handleDeleteDrugGroup}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default DrugGroupList;
