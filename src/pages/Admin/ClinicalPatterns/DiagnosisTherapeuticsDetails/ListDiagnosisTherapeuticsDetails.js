import React, { useEffect, useMemo, useState } from 'react';
import classnames from "classnames";
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Accordion, AccordionItem, Collapse, CardHeader, CardFooter, Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Swal from "sweetalert2";
import ReactHtmlParser from 'html-react-parser';
import Select from "react-select";
import makeAnimated from "react-select/animated";

import { getDiagnosisForClinicalPatternList, getDiagnosisTherapeuticsList, getDiagnosisTherapeuticsById } from '../../../../slices/thunks';
import { setDiagnosisTherapeuticsList } from '../../../../slices/admin/clinicalpattern/diagnosistherapeutics/reducer';
import { useDispatch, useSelector } from 'react-redux';

const DiagnosisTherapeuticsList = () => {
  document.title = "List Diagnosis Therapeutics Details";

  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectedDiagnosis, setIsSelectedDiagnosis] = useState(false);
  const pageSize = 10;
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [selectedDiagnosisItem, setSelectedDiagnosisItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Redux state
  const diagnosisTherapeuticsList = useSelector((state) => state.DiagnosisTherapeutics.diagnosisTherapeuticsList);
  const diagnosisForClinicalPattern = useSelector((state) => state.DiagnosisTherapeutics.diagnosisListForClinicalPattern);
  const diagnosisTherapeuticsDetails = useSelector((state) => state.DiagnosisTherapeutics.diagnosisTherapeuticsDetails);
  const totalPages = useSelector((state) => state?.DiagnosisTherapeutics?.diagnosisTherapeuticsList?.totalPageCount || 1);
  const { diagnosisTherapeuticsError, diagnosisTherapeuticsSuccess, diagnosisTherapeuticsLoading } = useSelector((state) => state.DiagnosisTherapeutics);

  const DiagnosisForClinicalPatternOptions = diagnosisForClinicalPattern?.map((diagnosis) => ({
    label: diagnosis.diagnosisName,
    value: diagnosis.diagnosisID,
  })) || [];

  const [modal_standard, setmodal_standard] = useState(false);
  function tog_standard() {

    setmodal_standard(!modal_standard);
  }

  const [selectedSingle, setSelectedSingle] = useState(null);
  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  // Default Accordion
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (therapeuticId) => {
    setOpenAccordion(openAccordion === therapeuticId ? null : therapeuticId);
  };

  function handleSelectDiagnosis(diagnosis) {
    console.log('diagnosis', diagnosis);
    setSelectedDiagnosis(diagnosis);
    setIsSelectedDiagnosis(true);
    setCurrentPage(1);
    dispatch(getDiagnosisTherapeuticsList({ diagonosisId: diagnosis.value, pageNumber: 1, pageSize: pageSize }));
  }

  useEffect(() => {
    dispatch(getDiagnosisForClinicalPatternList(null));
    dispatch(getDiagnosisTherapeuticsList({ pageNumber: currentPage, pageSize: pageSize }));
  }, []);

  useEffect(() => {
    if (selectedDiagnosis) {
      dispatch(getDiagnosisTherapeuticsList({ diagonosisId: selectedDiagnosis.value, pageNumber: currentPage, pageSize: pageSize }));
    } else {
      dispatch(getDiagnosisTherapeuticsList({ pageNumber: currentPage, pageSize: pageSize }));
    }
  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getDiagnosisTherapeuticsList({ diagonosisId: selectedDiagnosis?.value, pageNumber: currentPage - 1, pageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getDiagnosisTherapeuticsList({ diagonosisId: selectedDiagnosis?.value, pageNumber: currentPage + 1, pageSize: pageSize }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>

              <Card>
                <CardBody className="card-body">
                  <div className="live-preview">
                    <Row className="gy-4">
                      <Col xxl={4} md={4}>
                        <div className="mb-3">
                          <Label htmlFor="placeholderInput" className="form-label">Diagnosis Name</Label>
                          <Select
                            value={selectedDiagnosis}
                            onChange={(item) => { handleSelectDiagnosis(item); }}
                            options={DiagnosisForClinicalPatternOptions}
                          />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div className="mt-4">
                          <Button className="btn-secondary btn-label m-btn-top"
                            onClick={() => {
                              dispatch(getDiagnosisTherapeuticsList({ pageNumber: currentPage, pageSize: pageSize }));
                              setCurrentPage(1);
                              setSelectedDiagnosis(null);
                              setIsSelectedDiagnosis(false);
                            }}>
                            <i className="ri-refresh-line label-icon align-middle fs-16 me-2"></i> Reset
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </CardBody>
              </Card>

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
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              dispatch(getDiagnosisTherapeuticsList({ diagonosisId: selectedDiagnosis?.value, queryString: e.target.value, pageNumber: currentPage, pageSize: pageSize }));
                            }}
                          />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/adddiagnosistherapeuticsdetails"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Diagnosis Name</th>
                            <th className='text-center' style={{ width: '10%' }}>Therapeutics Details</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        <>
                          {
                            diagnosisTherapeuticsLoading ? (
                              <tbody className="list form-check-all">
                                <tr>
                                  <td colSpan="5" className="text-center">
                                    <Spinner color="primary" className="ms-1" />
                                  </td>
                                </tr>
                              </tbody>
                            ) : (
                              <tbody className="list form-check-all">
                                {diagnosisTherapeuticsList?.resultObject?.length > 0 ? (
                                  diagnosisTherapeuticsList?.resultObject?.map((diagnosis, index) => (
                                    <tr key={diagnosis.diagnosisTherapeuticsDetailId}>
                                      <td>{diagnosis.diagnosisTherapeuticsDetailId}</td>
                                      <td>{diagnosis.diagnosisName}</td>
                                      <td className='text-center '>
                                        <div className="d-inline-flex gap-2">
                                          <div className="remove">
                                            <button className="btn btn-sm btn-soft-warning remove-item-btn" onClick={() => {
                                              //dispatch(getDiagnosisTherapeuticsById({ diagnosisTherapeuticsId: diagnosis.diagnosisTherapeuticsId }))
                                              setSelectedDiagnosisItem(diagnosis);
                                              tog_standard();
                                            }}><i className="ri-eye-line" /> </button>
                                          </div>
                                        </div>
                                      </td>
                                      <td className='text-center '>
                                        <div className="d-inline-flex gap-2">
                                          <div className="edit">
                                            <Link to="/admin/editdiagnosistherapeuticsdetails" state={{ selectedDiagnosis: diagnosis }}>
                                              <button className="btn btn-sm btn-soft-success edit-item-btn">
                                                <i className="ri-pencil-fill" />
                                              </button>
                                            </Link>
                                          </div>
                                          <div className="remove">
                                            <button className="btn btn-sm btn-soft-danger remove-item-btn"><i className="ri-delete-bin-5-line" /> </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="5" className="text-center">
                                      No diagnosis therapeutics found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            )}
                        </>
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

      {/* Modal */}
      <Modal id="myModal" isOpen={modal_standard} toggle={() => { tog_standard(); }} >
        <ModalHeader className="modal-title" id="myModalLabel" toggle={() => { tog_standard(); }}>
          Therapeutics Details
        </ModalHeader>
        <ModalBody>
          <>
            <Row>
              <Col xs="12" md="12">
                {selectedDiagnosisItem && ReactHtmlParser(selectedDiagnosisItem?.diagnosisTherapeuticsDetail1)}
              </Col>
            </Row>
          </>

        </ModalBody>
        <div className="modal-footer">
          <Button color="primary" onClick={() => { tog_standard(); }} >Close </Button>
        </div>
      </Modal>
      {/* Modal */}

    </React.Fragment>
  );
};

export default DiagnosisTherapeuticsList;