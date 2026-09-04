import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getQuestionGroups, deleteQuestionGroup } from '../../../../slices/admin/questiongroup/thunk';
import Swal from 'sweetalert2';

const renderAdminListPagination = ({ currentPage, totalPages, onPrev, onNext, onPage }) => (
  <ul className="pagination pagination-separated pagination-md mb-0 admin-list-pagination">
    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
      <button type="button" className="page-link page-link--nav" onClick={onPrev}>
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
            <button type="button" className="page-link" onClick={() => onPage(pageNumber)}>
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
      <button type="button" className="page-link page-link--nav" onClick={onNext}>
        Next
      </button>
    </li>
  </ul>
);

const ListQuestionGroup = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const buildListParams = (pageNumber = currentPage) => ({
    PageNumber: pageNumber,
    PageSize: pageSize,
    queryString: searchQuery,
  });

  const questionGroupLoading = useSelector((state) => state?.QuestionGroup?.loading || false);
  const questionGroups = useSelector((state) => state?.QuestionGroup?.questionGroups?.resultObject || []);
  const totalPages = useSelector((state) => state?.QuestionGroup?.questionGroups?.totalPageCount || 1);
  const totalRecords = useSelector(
    (state) => state?.QuestionGroup?.questionGroups?.totalRecordCount || questionGroups.length || 0
  );

  useEffect(() => {
    dispatch(getQuestionGroups(buildListParams()));
  }, [currentPage, searchQuery, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (group) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(
          deleteQuestionGroup({
            questionGroupId: group.questionGroupId,
            QuestionGroupName: group.questionGroupName,
            enteredBy: 'Admin',
            deleteStatus: true,
          })
        );
        Swal.fire('Deleted!', 'Your question group has been deleted.', 'success');
      }
    });
  };

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

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Question Groups';

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
                      <Link to="/admin/addquestiongroup" className="d-inline-flex">
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
                          <th scope="col" className="text-center" style={{ width: '5%' }}>
                            #
                          </th>
                          <th scope="col">Question Group Name</th>
                          <th scope="col">Question Section Name</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      {questionGroupLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <div className="patient-list-modal__empty">
                                <Spinner color="primary" size="sm" />
                                Loading question groups...
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {questionGroups?.length > 0 ? (
                            questionGroups.map((group, index) => (
                              <tr key={group.questionGroupId || index}>
                                <td className="text-center patient-list-modal__index">
                                  {rowStart + index + 1}
                                </td>
                                <td>{group.questionGroupName || '—'}</td>
                                <td>{group.questionSectionName || '—'}</td>
                                <td>{group.description || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link
                                        to="/admin/editquestiongroup"
                                        state={{ selectedQuestionGroup: group }}
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
                                        onClick={() => handleDelete(group)}
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
                              <td colSpan="5" className="text-center text-muted py-4">
                                {searchQuery
                                  ? 'No question groups match your search'
                                  : 'No Question Groups Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {questionGroupLoading
                        ? 'Loading...'
                        : `Showing ${questionGroups.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
                    </div>
                    {renderAdminListPagination({
                      currentPage,
                      totalPages,
                      onPrev: handlePrevPage,
                      onNext: handleNextPage,
                      onPage: setCurrentPage,
                    })}
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

export default ListQuestionGroup;
