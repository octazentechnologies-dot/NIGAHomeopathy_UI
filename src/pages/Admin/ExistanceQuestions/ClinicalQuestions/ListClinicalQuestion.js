import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardBody, Col, Container, Label, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useSelector, useDispatch } from 'react-redux';
import {
  getQuestionGroups,
  getQuestionsSubGroups,
  getClinicalQuestionBodyPart,
  deleteClinicalQuestionBodyPart,
} from '../../../../slices/thunks';

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

const ClinicalQuestionList = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState(null);
  const [selectedSubQuestionGroup, setSelectedSubQuestionGroup] = useState(null);
  const pageSize = 10;

  const buildListParams = (pageNumber = currentPage) => ({
    questionGroupId: selectedQuestionGroup?.value ?? 0,
    questionSubgroupId: selectedSubQuestionGroup?.value ?? 0,
    PageNumber: pageNumber,
    PageSize: pageSize,
    queryString: searchQuery,
  });

  const clinicalQuestionsLoading = useSelector(
    (state) => state?.ClinicalQuestions?.clinicalQuestionsLoading || false
  );
  const clinicalQuestions = useSelector((state) => state?.ClinicalQuestions?.questions || []);
  const rows = clinicalQuestions?.resultObject || [];
  const totalPages = useSelector((state) => state?.ClinicalQuestions?.questions?.totalPageCount || 1);
  const totalRecords = useSelector(
    (state) => state?.ClinicalQuestions?.questions?.totalRecordCount || rows.length || 0
  );
  const questionGroups = useSelector((state) => state?.ClinicalQuestions?.questionGroups || []);
  const questionSubGroups = useSelector((state) => state?.ClinicalQuestions?.questionSubGroups || []);

  const questionGroupOptions = useMemo(
    () => questionGroups.map((group) => ({ value: group.questionGroupId, label: group.questionGroupName })),
    [questionGroups]
  );

  const questionSubGroupOptions = useMemo(
    () =>
      questionSubGroups.map((subGroup) => ({
        value: subGroup.questionSubgroupId,
        label: subGroup.questionSubgroup1,
      })),
    [questionSubGroups]
  );

  useEffect(() => {
    dispatch(getQuestionGroups());
    dispatch(getQuestionsSubGroups());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getClinicalQuestionBodyPart(buildListParams()));
  }, [currentPage, searchQuery, selectedQuestionGroup, selectedSubQuestionGroup, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleSelectQuestionGroup = (selected) => {
    setSelectedQuestionGroup(selected);
    setSelectedSubQuestionGroup(null);
    setCurrentPage(1);
  };

  const handleSelectSubQuestionGroup = (selected) => {
    setSelectedSubQuestionGroup(selected);
    setCurrentPage(1);
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

  const handleDelete = (clinicalQuestion) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete clinical question which is associated with existance name " ${clinicalQuestion.questionSectionName}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(
          deleteClinicalQuestionBodyPart({
            questionId: clinicalQuestion.questionsId,
            listParams: buildListParams(1),
          })
        )
          .then(() => {
            setCurrentPage(1);
            Swal.fire('Deleted!', 'The head has been deleted.', 'success');
          })
          .catch(() => {
            Swal.fire('Error!', 'Something went wrong.', 'error');
          });
      }
    });
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Clinical Question';

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <Row className="g-3 align-items-end">
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1">Question Group Name</Label>
                      <Select
                        value={selectedQuestionGroup}
                        onChange={handleSelectQuestionGroup}
                        options={questionGroupOptions}
                        placeholder="Select..."
                        isClearable
                      />
                    </Col>
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1">Sub Question Group Name</Label>
                      <Select
                        value={selectedSubQuestionGroup}
                        onChange={handleSelectSubQuestionGroup}
                        options={questionSubGroupOptions}
                        placeholder="Select..."
                        isClearable
                      />
                    </Col>
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1 opacity-0 user-select-none" aria-hidden="true">
                        Reset
                      </Label>
                      <div className="admin-list-filter-reset">
                        <button
                          type="button"
                          className="btn btn-sm admin-list-btn admin-list-btn--reset"
                          onClick={() => {
                            setSelectedQuestionGroup(null);
                            setSelectedSubQuestionGroup(null);
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                        >
                          <i className="ri-refresh-line align-middle me-1" aria-hidden="true" />
                          Reset
                        </button>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

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
                      <Link to="/admin/addclinicalquestion" className="d-inline-flex">
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
                          <th scope="col">Existance Name</th>
                          <th scope="col">Question Group Name</th>
                          <th scope="col">Sub Question Group Name</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      {clinicalQuestionsLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <div className="patient-list-modal__empty">
                                <Spinner color="primary" size="sm" />
                                Loading clinical questions...
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {rows.length > 0 ? (
                            rows.map((question, index) => (
                              <tr key={question.questionsId || index}>
                                <td className="text-center patient-list-modal__index">
                                  {rowStart + index + 1}
                                </td>
                                <td>{question.questionSectionName || '—'}</td>
                                <td>{question.questionGroupName || '—'}</td>
                                <td>{question.questionSubgroupName || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link
                                        to="/admin/editclinicalquestion"
                                        state={{ selectedClinicalQuestion: question }}
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
                                        onClick={() => handleDelete(question)}
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
                                  ? 'No clinical questions match your search'
                                  : 'No Clinical Questions Found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {clinicalQuestionsLoading
                        ? 'Loading...'
                        : `Showing ${rows.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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

export default ClinicalQuestionList;
