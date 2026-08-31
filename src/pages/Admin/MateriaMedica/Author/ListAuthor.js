import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import Swal from "sweetalert2";
import { getAuthorsList, deleteAuthor } from '../../../../slices/thunks';

const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const AuthorList = () => {
  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Redux state
  const authorsLoading = useSelector((state) => state?.Author?.authorsLoading || false);
  const authors = useSelector((state) => state?.Author?.authors?.resultObject || []);
  const totalPages = useSelector((state) => state?.Author?.authors?.totalPageCount || 1);
  const { authorSuccess, authorError } = useSelector((state) => state?.Author || {});

  useEffect(() => {
    dispatch(getAuthorsList({ queryString: '', PageNumber: currentPage, PageSize: pageSize }));
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getAuthorsList({ queryString: '', PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getAuthorsList({ queryString: '', PageNumber: currentPage + 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDelete = (author) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${author.authorName}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteAuthor({
          authorId: author.authorId,
          authorName: author.authorName,
          Description: author.description,
          EnteredBy: 'Admin',
          DeleteStatus: true
        })).then(() => {
          setCurrentPage(1);
          Swal.fire("Deleted!", "The section has been deleted.", "success");
        }).catch(() => {
          Swal.fire("Error!", "Something went wrong.", "error");
        });
      }
    });
  };

  const handleSearch = (queryString) => {
    console.log(queryString);
    dispatch(getAuthorsList({ queryString: queryString, PageNumber: 1, PageSize: 10 }));
  };

  const [selectedSingle, setSelectedSingle] = useState(null);
  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }


  document.title = "List Author";
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
                            type="text"
                            className="form-control form-control-sm search"
                            placeholder="Search..."
                            onChange={(e) => handleSearch(e.target.value)} /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addauthor"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Author Name</th>
                            <th>Description</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>

                        {authorsLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="5" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {authors?.length > 0 ? (
                              authors.map((author, index) => (
                                <tr>
                                  <td>{author.authorId}</td>
                                  <td>{author.authorName}</td>
                                  <td>{author.description}</td>
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editauthor" state={{ selectedAuthor: author }}
                                        ><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(author)}>
                                          <i className="ri-delete-bin-5-line" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">No Authors Available</td>
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

export default AuthorList;