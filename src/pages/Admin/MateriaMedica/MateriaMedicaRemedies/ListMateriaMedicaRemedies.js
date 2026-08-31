import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { CardHeader, CardFooter, Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { getRemedies, getRemedieList } from '../../../../slices/thunks';
//import { DefaultModalExample, CenteredModalExample, GridsModalExample, StaticBackdropModalExample, TogglebetweenExample, TooltipModalExample, ScrollableModalExample, VaryingModalExample, OptionalModalExample, FullscreenResponsiveExample, AnimationModalExample, PositionModalExample } from './UiModalCode';

const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const MateriaMedicaRemediesList = () => {

  const dispatch = useDispatch();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);

  // Redux state
  const materiaMedicaLoading = useSelector((state) => state?.RemedicalRubric?.loading || false);
  const remedys = useSelector((state) => state?.RemedicalRubric?.matriaMedicaRemedies?.resultObject || []);
  const totalPages = useSelector((state) => state?.RemedicalRubric?.matriaMedicaRemedies?.totalPageCount || 1);

  useEffect(() => {
    dispatch(getRemedieList({ PageNumber: currentPage, PageSize: pageSize, queryString: searchQuery }));
  }, [currentPage, searchQuery]);

  // After the first successful load, stop showing the global spinner on pagination
  useEffect(() => {
    if (firstLoad && !materiaMedicaLoading && Array.isArray(remedys)) {
      setFirstLoad(false);
    }
  }, [firstLoad, materiaMedicaLoading, remedys]);

  // Search Handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const [modal_standard, setmodal_standard] = useState(false);
  function tog_standard() {
    setmodal_standard(!modal_standard);
  }

  const [selectedSingle, setSelectedSingle] = useState(null);
  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  document.title = "List Materia Medica Remedies";
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
                            value={searchQuery}
                            onChange={handleSearch}
                          />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
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
                            <th>Remedy List</th>
                            <th className='text-center' style={{ width: '10%' }}>Remedy Details</th>
                          </tr>
                        </thead>
                        {(materiaMedicaLoading && firstLoad) ? (
                          <tbody className="list form-check-all">
                            <tr>
                              <td colSpan="5" className="text-center">
                                <Spinner color="primary" className="ms-1" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {remedys.map((remedy, index) => (
                              <tr key={index}>
                                <td>{remedy.remedyId}</td>
                                <td>{remedy?.remedyName}</td>
                                <td className='text-center '>
                                  <div className="d-inline-flex gap-2">
                                    <div className="remove">
                                      <Link to="/admin/viewmateriamedicaremedies" state={{
                                        selectedRemedy: remedy
                                      }}><button className="btn btn-sm btn-soft-warning remove-item-btn"><i className="ri-eye-line" /> </button></Link>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
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
                            <button className="page-link" onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>Previous</button>
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

                          {/* Dynamic Page Numbers (window around current) */}
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
                            <button className="page-link" onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>Next</button>
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


      {/* Modal */}
      <Modal id="myModal" isOpen={modal_standard} toggle={() => { tog_standard(); }} >
        <ModalHeader className="modal-title" id="myModalLabel" toggle={() => { tog_standard(); }}>
          Therapeutics Details
        </ModalHeader>
        <ModalBody>
          <h5 className="fs-15">
            Overflowing text to show scroll behavior
          </h5>
        </ModalBody>
        <div className="modal-footer">
          <Button color="primary" onClick={() => { tog_standard(); }} >Close </Button>
        </div>
      </Modal>
      {/* Modal */}

    </React.Fragment>
  );
};

export default MateriaMedicaRemediesList;