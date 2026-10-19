import React, { useEffect, useMemo, useState } from 'react';
import AdminListPagination from '../../../../Components/Common/AdminListPagination';
import classnames from "classnames";
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Accordion, CardHeader, Card, CardBody, Col, Container, Modal, ModalBody, ModalHeader, Row, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Swal from "sweetalert2";
import ReactHtmlParser from 'html-react-parser';
import Select from "react-select";
import makeAnimated from "react-select/animated";

import { adminFormSelectPortalProps, getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';
import { getDiagnosisForClinicalPatternList, getDiagnosisTherapeuticsList, getDiagnosisTherapeuticsById } from '../../../../slices/thunks';
import { setDiagnosisTherapeuticsList } from '../../../../slices/admin/clinicalpattern/diagnosistherapeutics/reducer';
import { useDispatch, useSelector } from 'react-redux';
import { exportListTableCsv } from '../../../../helpers/listExport';
import '../../../../Components/WhatsAppModal/WhatsAppModal.css';

const DiagnosisTherapeuticsList = () => {
  document.title = "List Diagnosis Therapeutics Details";

  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectedDiagnosis, setIsSelectedDiagnosis] = useState(false);
  const pageSize = 10;
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [selectedDiagnosisItem, setSelectedDiagnosisItem] = useState(null);

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


  const rowStart = (currentPage - 1) * pageSize;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>

              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <div className="live-preview">
                    <Row className="gy-3 align-items-end admin-list-filter-row">
                      <Col xs={12} md={5} lg={4} xl={4}>
                        <div className="mb-0">
                          <Label htmlFor="diagnosisFilter" className="form-label">Diagnosis Name</Label>
                          <Select
                            inputId="diagnosisFilter"
                            value={selectedDiagnosis}
                            onChange={(item) => { handleSelectDiagnosis(item); }}
                            options={DiagnosisForClinicalPatternOptions}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles()}
                            {...adminFormSelectPortalProps}
                          />
                        </div>
                      </Col>
                      <Col xs="auto" className="admin-list-filter-reset-col">
                        <div className="admin-list-filter-reset">
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--reset"
                            onClick={() => {
                              dispatch(getDiagnosisTherapeuticsList({ pageNumber: currentPage, pageSize: pageSize }));
                              setCurrentPage(1);
                              setSelectedDiagnosis(null);
                              setIsSelectedDiagnosis(false);
                            }}
                          >
                            <i className="ri-refresh-line align-middle me-1" aria-hidden="true" />
                            Reset
                          </button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </CardBody>
              </Card>

              <Card className="patient-list-modal admin-existance-list">
                <CardHeader className="border-0">
                  <div className="admin-list-toolbar d-flex align-items-center justify-content-end gap-2 flex-wrap w-100">
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import" disabled title="Import is not available for this list yet">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export" onClick={(e) => exportListTableCsv(e)}>
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/adddiagnosistherapeuticsdetails" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                          New
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>

                  <div className="listjs-table" id="customerList">

                    <div className="table-responsive patient-list-modal__table-wrap">
                      <table className="table mb-0 align-middle patient-list-modal__table" id="customerTable">
                        <thead className="">
                          <tr>
                            <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                            <th>Diagnosis Name</th>
                            <th className='text-center' style={{ width: '12%' }}>Therapeutics Details</th>
                            <th className='text-center' style={{ width: '12%' }}>Action</th>
                          </tr>
                        </thead>
                        <>
                          {
                            diagnosisTherapeuticsLoading ? (
                              <tbody className="list form-check-all">
                                <tr>
                                  <td colSpan="4" className="text-center">
                                    <Spinner color="primary" className="ms-1" />
                                  </td>
                                </tr>
                              </tbody>
                            ) : (
                              <tbody className="list form-check-all">
                                {diagnosisTherapeuticsList?.resultObject?.length > 0 ? (
                                  diagnosisTherapeuticsList?.resultObject?.map((diagnosis, index) => (
                                    <tr key={diagnosis.diagnosisTherapeuticsDetailId}>
                                      <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                      <td>{diagnosis.diagnosisName}</td>
                                      <td className='text-center '>
                                        <div className="d-inline-flex gap-2">
                                          <div className="remove">
                                            <button className="btn btn-sm btn-soft-warning remove-item-btn" onClick={() => {
                                              //dispatch(getDiagnosisTherapeuticsById({ diagnosisTherapeuticsId: diagnosis.diagnosisTherapeuticsId }))
                                              setSelectedDiagnosisItem(diagnosis);
                                              tog_standard();
                                            }} type="button" title="View"><i className="ri-eye-line" /> </button>
                                          </div>
                                        </div>
                                      </td>
                                      <td className='text-center '>
                                        <div className="d-inline-flex gap-2">
                                          <div className="edit">
                                            <Link to="/admin/editdiagnosistherapeuticsdetails" state={{ selectedDiagnosis: diagnosis }}>
                                              <button className="btn btn-sm btn-soft-success edit-item-btn" type="button" title="Edit">
                                                <i className="ri-pencil-fill" />
                                              </button>
                                            </Link>
                                          </div>
                                          <div className="remove">
                                            <button className="btn btn-sm btn-soft-danger remove-item-btn" type="button" disabled title="Delete is not available for therapeutics details yet"><i className="ri-delete-bin-5-line" /> </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="text-center">
                                      No diagnosis therapeutics found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            )}
                        </>
                      </table>
                    </div>

                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                      <div className="text-muted patient-list-modal__footer-text">
                        {diagnosisTherapeuticsLoading
                          ? 'Loading...'
                          : `Showing ${diagnosisTherapeuticsList?.resultObject?.length || 0} of ${diagnosisTherapeuticsList?.resultObject?.length || 0} Results · Page ${currentPage} of ${totalPages}`}
                      </div>

                                            <AdminListPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPage={setCurrentPage}
                      />
                    </div>

                  </div>

                </CardBody>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>

      {/* Modal */}
      <Modal
        id="myModal"
        isOpen={modal_standard}
        toggle={tog_standard}
        size="xl"
        className="whatsapp-modal diagnosis-therapeutics-details-modal"
      >
        <ModalHeader className="whatsapp-modal__header" id="myModalLabel" toggle={tog_standard}>
          <div className="whatsapp-modal__title">
            Therapeutics Details
          </div>
        </ModalHeader>
        <ModalBody className="whatsapp-modal__body">
          <>
            <Row>
              <Col xs="12" md="12">
                {selectedDiagnosisItem && ReactHtmlParser(selectedDiagnosisItem?.diagnosisTherapeuticsDetail1)}
              </Col>
            </Row>
          </>

        </ModalBody>
      </Modal>
      {/* Modal */}

    </React.Fragment>
  );
};

export default DiagnosisTherapeuticsList;