import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { getQuestionGroups, deleteQuestionGroup } from "../../../../slices/admin/questiongroup/thunk";
import Swal from "sweetalert2";

const ListQuestionGroup = () => {
  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const buildListParams = (pageNumber = currentPage) => ({
    PageNumber: pageNumber,
    PageSize: pageSize,
    queryString: searchQuery,
  });

  // Redux state
  const questionGroupLoading = useSelector((state) => state?.QuestionGroup?.loading || false);
  const questionGroups = useSelector((state) => state?.QuestionGroup?.questionGroups?.resultObject || []);
  const totalPages = useSelector((state) => state?.QuestionGroup?.questionGroups?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getQuestionGroups(buildListParams()));
  }, [currentPage, searchQuery, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  // Delete Handler
  const handleDelete = (group) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteQuestionGroup({
          "questionGroupId": group.questionGroupId,
          "QuestionGroupName": group.questionGroupName,
          "enteredBy": "Admin",
          "deleteStatus": true
        }));
        Swal.fire(
          'Deleted!',
          'Your question group has been deleted.',
          'success'
        );
      }
    });
  };

  // Pagination Handlers
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

  document.title = "List Question Groups";
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
                          <input
                            value={searchQuery}
                            type="text"
                            className="form-control form-control-sm search"
                            placeholder="Search..."
                            onChange={handleSearchChange}
                          />
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
                        <Link to="/admin/addquestiongroup">
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
                            <th>Question Group Name</th>
                            <th>Question Section Name</th>
                            <th>Description</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {questionGroupLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="5" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {questionGroups?.length > 0 ? (
                              questionGroups.map((group, index) => (
                                <tr key={index}>
                                  <td>{group.questionGroupId}</td>
                                  <td>{group.questionGroupName}</td>
                                  <td>{group.questionSectionName}</td>
                                  <td>{group.description}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editquestiongroup" state={{ selectedQuestionGroup: group }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
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
                                <td colSpan="5" className="text-center">No Question Groups Available</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        Showing <span>{currentPage}</span> of <span>{totalPages}</span> Pages
                      </div>
                      <div>
                        <ul className="pagination pagination-separated pagination-md mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handlePrevPage}>Previous</button>
                          </li>
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first page, current page, and last page
                            // Show dots if there are gaps
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(pageNumber)}
                                  >
                                    {pageNumber}
                                  </button>
                                </li>
                              );
                            } else if (
                              pageNumber === 2 ||
                              pageNumber === totalPages - 1
                            ) {
                              return (
                                <li key={index} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}
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

export default ListQuestionGroup;