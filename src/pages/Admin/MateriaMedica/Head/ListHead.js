import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import Swal from "sweetalert2";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import { getHeadsList, deleteHead, updateDifferentialMateriaMedicaDefaultStatus } from '../../../../slices/thunks';
import { head } from 'lodash';

const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const Starter = () => {

  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedSingle, setSelectedSingle] = useState(null);

  // Redux state
  const headsLoading = useSelector((state) => state?.Head?.headsLoading || false);
  const heads = useSelector((state) => state?.Head?.heads?.resultObject || []);
  const totalPages = useSelector((state) => state?.Head?.heads?.totalPageCount || 1);
  const { headSuccess, headError } = useSelector((state) => state?.Head || {});

  //console.log(heads.length);

  useEffect(() => {
    dispatch(getHeadsList({ PageNumber: currentPage, PageSize: pageSize }));
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getHeadsList({ PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getHeadsList({ PageNumber: currentPage + 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDelete = (head) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${head.materiaMedicaHeadName}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteHead({
          materiaMedicaHeadId: head.materiaMedicaHeadId,
          seqNo: head.seqNo,
          materiaMedicaHeadName: head.materiaMedicaHeadName,
          description: head.description,
          isSection: head.isSection,
          authorId: head.authorId,
          differentialMM: head.differentialMM,
        })).then(() => {
          setCurrentPage(1);
          Swal.fire("Deleted!", "The head has been deleted.", "success");
        }).catch(() => {
          Swal.fire("Error!", "Something went wrong.", "error");
        });
      }
    });
  };

  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  document.title = "List Head";
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
                        <Link to="/admin/addhead" ><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Head Name</th>
                            <th>Author Name</th>
                            <th>Description</th>
                            <th>Seq. No.</th>
                            <th className='text-center' style={{ width: '10%' }}>Differential MM</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {headsLoading ?
                          (
                            <tbody>
                              <tr>
                                <td colSpan="7" className="text-center">
                                  <Spinner color="primary" />
                                </td>
                              </tr>
                            </tbody>
                          ) :
                          (
                            <tbody className="list form-check-all">
                              {heads?.length > 0 ? (
                                heads.map((head, index) => (
                                  < tr >
                                    <td>{head.materiaMedicaHeadId}</td>
                                    <td>{head.materiaMedicaHeadName}</td>
                                    <td>{head.authorName}</td>
                                    <td>{head.description}</td>
                                    <td>{head.seqNo}</td>
                                    <td>
                                      <div className="form-check form-switch form-switch-lg text-center" dir="ltr">
                                        <Input type="checkbox" className="form-check-input" id="customSwitchsizelg" checked={head.differentialMM}
                                          onChange={() => {
                                            dispatch(updateDifferentialMateriaMedicaDefaultStatus({
                                              materiaMedicaHeadId: head.materiaMedicaHeadId,
                                              differentialMM: !head.differentialMM
                                            }))
                                          }} />
                                      </div>
                                    </td>
                                    <td className='text-center '>
                                      <div className="d-inline-flex gap-2">
                                        <div className="edit">
                                          <Link to="/admin/edithead" state={{ selectedHead: head }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                        </div>
                                        <div className="remove">
                                          <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(head)}><i className="ri-delete-bin-5-line" /> </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))) : (
                                <tr>
                                  <td colSpan="7" className="text-center">No Heads Available</td>
                                </tr>
                              )}
                            </tbody>
                          )
                        }
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
    </React.Fragment >
  );
};

export default Starter;