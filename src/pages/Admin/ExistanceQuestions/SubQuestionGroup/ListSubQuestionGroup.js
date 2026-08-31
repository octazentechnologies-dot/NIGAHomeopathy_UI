import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';

import { Card, CardBody, CardHeader, Col, Container, Row, Button, Spinner } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { getSubQuestionGroupList, deleteSubQuestionGroup } from "../../../../slices/admin/existancequestions/subquestiongroup/thunk";
import Swal from "sweetalert2";

const ListSubQuestionGroup = () => {
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
  const subQuestionGroupLoading = useSelector((state) => state?.SubQuestionGroup?.subQuestionGroupLoading || false);
  const subQuestionGroups = useSelector((state) => state?.SubQuestionGroup?.subQuestionGroupList?.resultObject || []);
  const totalPages = useSelector((state) => state?.SubQuestionGroup?.subQuestionGroupList?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getSubQuestionGroupList(buildListParams()));
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
        dispatch(deleteSubQuestionGroup({
          questionSubgroupId: group.questionSubgroupId,
          questionSubGroupName: group.questionSubGroupName,
          deleteStatus: true
        }));
        Swal.fire(
          'Deleted!',
          'Your sub question group has been deleted.',
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

  document.title = "List Sub Question Group";
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
                          <input
                            value={searchQuery}
                            type="text"
                            className="form-control form-control-sm search"
                            placeholder="Search..."
                            onChange={handleSearchChange}
                          /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addsubquestiongroup"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Sub Question Group Name</th>
                            <th>Question Group Name</th>
                            <th>Description</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {subQuestionGroupLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="5" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {subQuestionGroups?.length > 0 ? (
                              subQuestionGroups.map((group, index) => (
                                <tr key={index}>
                                  <td>{group.questionSubgroupId}</td>
                                  <td>{group.questionSubGroupName}</td>
                                  <td>{group.questionGroupName}</td>
                                  <td>{group.description}</td>
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editsubquestiongroup" state={{ selectedSubQuestionGroup: group }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(group)}><i className="ri-delete-bin-5-line" /> </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">No Sub Question Groups Available</td>
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

export default ListSubQuestionGroup;