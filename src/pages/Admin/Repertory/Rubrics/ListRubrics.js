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
    dispatch(getRubricsList({ sectionId: section.value, queryString: searchQuery, pageNumber: currentPage, pageSize: pageSize }));
  }

  useEffect(() => {
    dispatch(getSectionForSubSection(null));
  }, []);

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
    if (currentPage > 1) {
      dispatch(getRubricsList({ sectionId: selectedSection?.value, queryString: searchQuery, PageNumber: currentPage - 1, PageSize: pageSize }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  // const handleNextPage = () => {
  //   if (currentPage < totalPages) {
  //     dispatch(getRubricsList({ sectionId: selectedSection?.value, queryString: searchQuery, PageNumber: currentPage + 1, PageSize: pageSize }));
  //     setCurrentPage((prev) => prev + 1);
  //   }
  // };

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

  document.title = "List Rubrics";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}

          <Row>
            <Col lg={12}>


              <Card>

                <CardBody className="card-body">
                  <div className="live-preview">
                    <Row className="gy-4">
                      <Col xxl={4} md={4}>
                        <div className="mb-3">
                          <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                          <Select
                            value={selectedSection}
                            onChange={(item) => { handleSelectSection(item); }}
                            options={SectionForSubSectionOptions} />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div className="mt-4">
                          <Button className="btn-secondary btn-label m-btn-top"
                            onClick={() => {
                              setSelectedSection(null);
                              dispatch(setRubricsList([]));
                              setIsSelectedSection(false);
                            }}> <i className="ri-refresh-line label-icon align-middle fs-16 me-2"></i> Reset </Button>
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
                          <input value={searchQuery} type="text" className="form-control form-control-sm search" placeholder="Search..."
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              dispatch(getRubricsList({ sectionId: selectedSection?.value, queryString: e.target.value, pageNumber: currentPage, pageSize: pageSize }));
                            }} /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-soft-primary btn-sm"
                          onClick={handleImportClick}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Importing...
                            </>
                          ) : (
                            <>
                              <i className="ri-newspaper-line align-middle"></i> Import
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-soft-secondary btn-sm"
                          onClick={handleExport}
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Exporting...
                            </>
                          ) : (
                            <>
                              <i className="ri-file-list-3-line align-middle"></i> Export
                            </>
                          )}
                        </button>
                        <Link to="/admin/addrubrics"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Sub Section Name</th>
                            <th className='text-center' style={{ width: '10%' }}>Details</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {isSelectedSection ?
                          <>
                            {
                              rubricsLoading ? (
                                <tbody className="list form-check-all">
                                  <tr>
                                    <td colSpan="5" className="text-center">
                                      <Spinner color="primary" className="ms-1" />
                                    </td>
                                  </tr>
                                </tbody>
                              ) : (
                                <tbody className="list form-check-all">
                                  {rubricList?.resultObject?.length > 0 ? (
                                    rubricList?.resultObject?.map((rubric, index) => (
                                      <tr key={index}>
                                        <td>{rubric.subSectionId}</td>
                                        <td>{rubric.subSectionName}</td>
                                        <td className='text-center '>
                                          <div className="d-inline-flex gap-2">
                                            <div className="remove">
                                              <button className="btn btn-sm btn-soft-warning remove-item-btn" onClick={() => {
                                                dispatch(getGradeDetails({ subSectionId: rubric.subSectionId }))
                                                tog_standard();
                                              }}><i className="ri-eye-line" /> </button>
                                            </div>
                                          </div>
                                        </td>
                                        <td className='text-center '>
                                          <div className="d-inline-flex gap-2">
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
                                        No rubrics found
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              )}
                          </> :
                          <tr>
                            <td colSpan="5" className="text-center">
                              Please select a section
                            </td>
                          </tr>
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
                                <button
                                  className="page-link"
                                  onClick={() => {
                                    dispatch(getRubricsList({
                                      sectionId: selectedSection?.value,
                                      queryString: searchQuery,
                                      pageNumber: 1,
                                      pageSize: pageSize
                                    }));
                                    setCurrentPage(1);
                                  }}
                                >
                                  1
                                </button>
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
                                  <button
                                    className="page-link"
                                    onClick={() => {
                                      dispatch(getRubricsList({
                                        sectionId: selectedSection?.value,
                                        queryString: searchQuery,
                                        pageNumber: page,
                                        pageSize: pageSize
                                      }));
                                      setCurrentPage(page);
                                    }}
                                  >
                                    {page}
                                  </button>
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
                                <button
                                  className="page-link"
                                  onClick={() => {
                                    dispatch(getRubricsList({
                                      sectionId: selectedSection?.value,
                                      queryString: searchQuery,
                                      pageNumber: totalPages,
                                      pageSize: pageSize
                                    }));
                                    setCurrentPage(totalPages);
                                  }}
                                >
                                  {totalPages}
                                </button>
                              </li>
                            </>
                          )}

                          {/* Next Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => {
                                if (currentPage < totalPages) {
                                  const nextPage = currentPage + 1;
                                  dispatch(getRubricsList({
                                    sectionId: selectedSection?.value,
                                    queryString: searchQuery,
                                    pageNumber: nextPage,
                                    pageSize: pageSize
                                  }));
                                  setCurrentPage(nextPage);
                                }
                              }}
                            >
                              Next
                            </button>
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
          Remedy Details
        </ModalHeader>
        <ModalBody>
          <Accordion id="default-accordion-example">
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
                      <Link to="/admin/editrubrics" state={{ selectedGrade: grade }}>
                        <button className="btn btn-sm btn-soft-success edit-item-btn">
                          <i className="ri-pencil-fill" />
                        </button>
                      </Link>
                    </button>
                  </h2>

                  <Collapse isOpen={openAccordion === grade.gradeId} className="accordion-collapse">
                    <div className="accordion-body m-1 p-0">
                      <table className="table table-responsive table-bordered table-nowrap m-0">
                        <thead>
                          <tr>
                            <th scope="col">Remedy Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grade.remediesModels?.map((remedy, remedyIndex) => (
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
              <div className="text-center p-3">
                <p className="mb-0">No data found</p>
              </div>
            )}
          </Accordion>
        </ModalBody>
        <div className="modal-footer">
          <Button color="primary" onClick={() => { tog_standard(); }}>Close</Button>
        </div>
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