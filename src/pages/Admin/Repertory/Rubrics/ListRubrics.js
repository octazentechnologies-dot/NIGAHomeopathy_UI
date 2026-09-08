import React, { useEffect, useMemo, useState } from 'react';
import classnames from "classnames";
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Accordion, AccordionItem, Collapse, CardHeader, CardFooter, Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Swal from "sweetalert2";

import Select from "react-select";
import makeAnimated from "react-select/animated";
//import { DefaultModalExample, CenteredModalExample, GridsModalExample, StaticBackdropModalExample, TogglebetweenExample, TooltipModalExample, ScrollableModalExample, VaryingModalExample, OptionalModalExample, FullscreenResponsiveExample, AnimationModalExample, PositionModalExample } from './UiModalCode';

import { getSectionForSubSection, getRubricsList, importRubricsFromExcel, getGradeDetails, exportRubricsToExcelThunk } from '../../../../slices/thunks';
import { setRubricsList, setRubricError, setRubricSuccess, setRubricsLoading, setSectionForSubSection, setGradeDetails } from '../../../../slices/admin/repertory/rubric/reducer';
import { useDispatch, useSelector } from 'react-redux';
import '../../../../Components/WhatsAppModal/WhatsAppModal.css';
const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const RubricList = () => {

  const dispatch = useDispatch();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectedSection, setIsSelectedSection] = useState(false);
  const pageSize = 10;
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = React.useRef(null);

  // Redux state
  const rubricList = useSelector((state) => state.Rubric.rubricsList);
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const gradeDetails = useSelector((state) => state.Rubric.gradeDetails);
  const totalPages = useSelector((state) => state?.Rubric?.rubricsList?.totalPageCount || 1);
  const totalRecords = useSelector((state) => state?.Rubric?.rubricsList?.totalRecordCount || rubricList?.resultObject?.length || 0);
  const { rubricError, rubricSuccess, rubricsLoading } = useSelector((state) => state.Rubric);
  const rubricSuccessresponse = useSelector((state) => state.Rubric.rubricSuccess);
  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];


  const [modal_standard, setmodal_standard] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  function tog_standard() {
    setmodal_standard(!modal_standard);
  }



  // Default Accordion
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (gradeId) => {
    setOpenAccordion(openAccordion === gradeId ? null : gradeId);
  };

  function handleSelectSection(section) {
    setSelectedSection(section);
    setIsSelectedSection(true);
    setCurrentPage(1);
  }

  useEffect(() => {
    dispatch(getSectionForSubSection(null));
  }, []);

  useEffect(() => {
    if (isSelectedSection && selectedSection?.value) {
      dispatch(getRubricsList({
        sectionId: selectedSection.value,
        queryString: searchQuery,
        pageNumber: currentPage,
        pageSize: pageSize,
      }));
    }
  }, [dispatch, isSelectedSection, selectedSection, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    if (rubricSuccessresponse) {
      const skipped = rubricSuccessresponse.skippedRows || [];
      const skippedCount = rubricSuccessresponse.skippedCount || 0;
      let skippedHtml = '';
      if (skipped.length > 0) {
        const rows = skipped.slice(0, 20).map(s =>
          `<tr><td>${s.rowNumber}</td><td>${s.subsection || ''}</td><td>${s.gradeValue || ''}</td><td style="color:#c0392b">${s.reason || ''}</td></tr>`
        ).join('');
        skippedHtml = `
          <div style="max-height:200px;overflow-y:auto;margin-top:10px;">
            <table class="table table-sm table-bordered" style="font-size:12px;">
              <thead><tr><th>Row</th><th>Subsection</th><th>Grade</th><th>Skip Reason</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            ${skippedCount > 20 ? `<p class="text-muted" style="font-size:11px;">...and ${skippedCount - 20} more. Full details saved on server.</p>` : ''}
          </div>
        `;
      }

      // Auto-download skip file if available
      if (rubricSuccessresponse.skipFileBase64 && rubricSuccessresponse.skipFileName) {
        try {
          const byteChars = atob(rubricSuccessresponse.skipFileBase64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', rubricSuccessresponse.skipFileName);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        } catch (e) {
          console.error('Failed to download skip file:', e);
        }
      }

      Swal.fire({
        title: 'Import Summary',
        html: `
          <div class="text-start">
            <p><strong>Total Rows:</strong> ${rubricSuccessresponse.totalRows || 0}</p>
            <p><strong>Successfully Processed:</strong> ${rubricSuccessresponse.successCount || 0}</p>
            <p><strong>Failed:</strong> ${rubricSuccessresponse.failureCount || 0}</p>
            <p><strong>Newly Added:</strong> ${rubricSuccessresponse.newlyAddedremedyCount || 0}</p>
            <p><strong>Existing:</strong> ${rubricSuccessresponse.existingremedyCount || 0}</p>
            <p><strong>Skipped:</strong> ${skippedCount}</p>
            <p><strong>Message:</strong> ${rubricSuccessresponse.message || 'No message available'}</p>
            ${skippedHtml}
          </div>
        `,
        width: skipped.length > 0 ? '700px' : undefined,
        icon: (rubricSuccessresponse.failureCount === 0 && skippedCount === 0) ? 'success' : 'warning',
        confirmButtonText: 'OK'
      }).then(() => {
        dispatch(setRubricSuccess(null));
      });
    }
  }, [rubricSuccessresponse]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsImporting(true);
      let progressSwal = null;
      const ensureProgressSwal = () => {
        if (!progressSwal) {
          progressSwal = Swal.fire({
            title: 'Importing rubrics...',
            html: '<p>Upload accepted. Waiting for background job...</p>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
        }
      };
      ensureProgressSwal();

      dispatch(importRubricsFromExcel(file, (status) => {
        ensureProgressSwal();
        const pct = status?.progressPercent ?? 0;
        const processed = status?.processedRows ?? 0;
        const total = status?.totalRows ?? 0;
        const msg = status?.message || 'Processing...';
        Swal.update({
          html: `<p><strong>${pct}%</strong></p><p>${processed} / ${total} rows</p><p>${msg}</p>`,
        });
      }))
        .catch((error) => {
          Swal.fire({
            title: 'Error!',
            text: error.message || 'Failed to import rubrics.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        })
        .finally(() => {
          setIsImporting(false);
          event.target.value = null;
        });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleExport = async () => {
    if (!selectedSection?.value) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please select a section to export.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await dispatch(exportRubricsToExcelThunk(selectedSection.value));
      const blobData = response?.data instanceof Blob ? response.data : response;
      if (!blobData) {
        throw new Error('No data received from server');
      }

      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;

      let fileName = `Rubrics_${(selectedSection.label || selectedSection.value || 'Section')
        .toString()
        .replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
      if (response?.headers) {
        const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match?.[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to export: ' + (error?.message || error),
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = "List Rubrics";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <Row className="gy-3 align-items-end">
                    <Col xxl={4} md={4}>
                      <div className="mb-0">
                        <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                        <Select
                          value={selectedSection}
                          onChange={(item) => { handleSelectSection(item); }}
                          options={SectionForSubSectionOptions}
                        />
                      </div>
                    </Col>
                    <Col xxl={4} md={4}>
                      <div className="admin-list-filter-reset">
                        <button
                          type="button"
                          className="btn btn-sm admin-list-btn admin-list-btn--reset"
                          onClick={() => {
                            setSelectedSection(null);
                            dispatch(setRubricsList([]));
                            setIsSelectedSection(false);
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
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <button
                        type="button"
                        className="btn btn-sm admin-list-btn admin-list-btn--import"
                        onClick={handleImportClick}
                        disabled={isImporting}
                      >
                        {isImporting ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Importing...
                          </>
                        ) : (
                          <>
                            <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                            Import
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm admin-list-btn admin-list-btn--export"
                        onClick={handleExport}
                        disabled={isExporting}
                      >
                        {isExporting ? (
                          <>
                            <Spinner size="sm" className="me-1" /> Exporting...
                          </>
                        ) : (
                          <>
                            <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                            Export
                          </>
                        )}
                      </button>
                      <Link to="/admin/addrubrics" className="d-inline-flex">
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
                          <th scope="col">Sub Section Name</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Details</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {isSelectedSection ? (
                        rubricsLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="4" className="text-center">
                                <Spinner color="primary" size="sm" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {rubricList?.resultObject?.length > 0 ? (
                              rubricList.resultObject.map((rubric, index) => (
                                <tr key={rubric.subSectionId || index}>
                                  <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                  <td>{rubric.subSectionName || '—'}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <div className="remove">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-warning remove-item-btn"
                                          title="View"
                                          onClick={() => {
                                            dispatch(getGradeDetails({ subSectionId: rubric.subSectionId }));
                                            tog_standard();
                                          }}
                                        >
                                          <i className="ri-eye-line" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <div className="remove">
                                        <button type="button" className="btn btn-sm btn-soft-danger remove-item-btn" title="Delete">
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
                                  {searchQuery ? 'No rubrics match your search' : 'No rubrics found'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        )
                      ) : (
                        <tbody>
                          <tr>
                            <td colSpan="4" className="text-center text-muted py-4">
                              Please select a section
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {rubricsLoading
                        ? 'Loading...'
                        : `Showing ${rubricList?.resultObject?.length || 0} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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


      {/* Modal */}
      <Modal
        id="myModal"
        isOpen={modal_standard}
        toggle={tog_standard}
        size="lg"
        className="whatsapp-modal rubric-details-modal"
      >
        <ModalHeader className="whatsapp-modal__header" id="myModalLabel" toggle={tog_standard}>
          <div className="whatsapp-modal__title">
            Remedy Details
          </div>
        </ModalHeader>
        <ModalBody className="whatsapp-modal__body">
          <Accordion id="default-accordion-example" className="rubric-details-accordion">
            {gradeDetails && gradeDetails.length > 0 ? (
              gradeDetails.map((grade, index) => (
                <AccordionItem key={grade.gradeId}>
                  <h2 className="accordion-header" id={`heading${index + 1}`}>
                    <button
                      className={classnames("accordion-button gap-2", { collapsed: openAccordion !== grade.gradeId })}
                      type="button"
                      onClick={() => toggleAccordion(grade.gradeId)}
                      style={{ cursor: "pointer" }}
                    >
                      Grade - {grade.gradeNo}
                      <Link to="/admin/editrubrics" state={{ selectedGrade: grade }} onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                          <i className="ri-pencil-fill" />
                        </button>
                      </Link>
                    </button>
                  </h2>

                  <Collapse isOpen={openAccordion === grade.gradeId} className="accordion-collapse">
                    <div className="accordion-body m-0 p-0">
                      <table className="table table-responsive table-bordered table-nowrap m-0">
                        <thead>
                          <tr>
                            <th scope="col">Remedy Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grade.remediesModels?.map((remedy) => (
                            <tr key={remedy.remedyId}>
                              <td className={grade.gradeId == 5 ? 'grade1css !important' : grade.gradeId == 2 ? 'grade2css !important' : grade.gradeId == 3 ? 'grade3css !important' : grade.gradeId == 4 && 'grade4css !important'}>{remedy.remedyName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Collapse>
                </AccordionItem>
              ))
            ) : (
              <div className="text-center py-2">
                <p className="mb-0 text-muted">No data found</p>
              </div>
            )}
          </Accordion>
        </ModalBody>
      </Modal>
      {/* Modal */}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".xlsx,.csv"
      />

    </React.Fragment>
  );
};

export default RubricList;