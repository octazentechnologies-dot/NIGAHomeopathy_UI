import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Button, InputGroup, InputGroupText, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link, useLocation } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import DeleteModal from '../../../../Components/Common/DeleteModal';
import Swal from "sweetalert2";

import { getSectionForSubSectionList, getSubSectionsList, getSubSectionBySectionList, updateSubSection, deleteSubSection, updateMainParentSubsection } from '../../../../slices/admin/repertory/subsection/thunk';
import { setSubSectionList, setSubSectionSuccess } from '../../../../slices/admin/repertory/subsection/reducer';
import { exportSubSectionsToExcelThunk } from '../../../../slices/admin/repertory/subsection/thunk';
import { importSubSectionsFromExcel, uploadSubSectionsFromExcel } from '../../../../slices/admin/repertory/subsection/thunk';
import { downloadReferenceRubricsTemplate, importReferenceRubrics } from '../../../../helpers/realbackend_helper';
import moment from 'moment';

const triggerBlobDownload = (blob, fileName) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadBase64File = (base64Content, fileName, contentType = 'application/octet-stream') => {
  if (!base64Content) return;
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: contentType });
  triggerBlobDownload(blob, fileName);
};

const ListSubSection = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [isSelectedSection, setIsSelectedSection] = useState(false);
  const pageSize = 10;
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubSection, setSelectedSubSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [refRubricImportModal, setRefRubricImportModal] = useState(false);
  const [refRubricImportFile, setRefRubricImportFile] = useState(null);
  const [refRubricImportLoading, setRefRubricImportLoading] = useState(false);
  const [refRubricTemplateLoading, setRefRubricTemplateLoading] = useState(false);
  const fileInputRef = React.useRef(null);
  const uploadFileInputRef = React.useRef(null);
  const refRubricFileInputRef = React.useRef(null);
  
  // Lazy loading state for Parent Subsection dropdown
  const [displayedParentSubSectionCount, setDisplayedParentSubSectionCount] = useState(50);
  const ITEMS_PER_LOAD = 50;

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [subsectionToDelete, setSubsectionToDelete] = useState(null);

  // Redux state
  const subSectionList = useSelector((state) => state.SubSection.subSectionList);
  const sectionForSubSection = useSelector((state) => state.SubSection.sectionForSubSection);
  const subSectionBySection = useSelector((state) => state.SubSection.subSectionBySection);
  const totalPages = useSelector((state) => state?.SubSection?.subSectionList?.totalPageCount || 1);
  const { subSectionError, subSectionSuccess, loading } = useSelector((state) => state.SubSection);
  const subSectionSuccessResponse = useSelector((state) => state.SubSection.subSectionSuccess);

  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  // Full options for subsections
  const AllSubSectionBySectionOptions = subSectionBySection?.map((subSection) => ({
    label: subSection.subSectionName,
    value: subSection.subSectionId,
  })) || [];

  // Lazy loaded options (only show limited items for performance)
  const SubSectionBySectionOptions = AllSubSectionBySectionOptions.slice(0, displayedParentSubSectionCount);

  function handleSelectSection(section) {
    setSelectedSection(section);
    setIsSelectedSection(true);
    setCurrentPage(1);
    setDisplayedParentSubSectionCount(ITEMS_PER_LOAD); // Reset lazy load count
    dispatch(getSubSectionBySectionList({ sectionId: section.value }));
  }

  // Handle Parent SubSection menu scroll to bottom for lazy loading
  const handleParentSubSectionMenuScrollToBottom = () => {
    if (displayedParentSubSectionCount < AllSubSectionBySectionOptions.length) {
      setDisplayedParentSubSectionCount(prev => prev + ITEMS_PER_LOAD);
    }
  };

  function handleSelectSubSectionAlias(item, subsection) {
    // Only make API call when user actually selects a value, not when clearing or searching
    if (!item) {
      return; // Don't update if user clears the selection
    }
    
    dispatch(updateSubSection([{
      "subSectionId": subsection.subSectionId,
      "sectionId": subsection.sectionId,
      "sectionName": subsection.sectionName,
      "parentSubSectionId": item.value,
      "parentSubSectionName": item.label,
      "subSectionName": subsection.subSectionName,
      "subSectionNameAlias": subsection.subSectionNameAlias,
      "description": subsection.description,
      "mainParentSubsection": subsection.mainParentSubsection || false,
      "enteredBy": "",
      "changedBy": userDetails.userId,
      "deleteStatus": false,
      "referencerubric": [],
      "subSectionLanguageDetails": []
    }], selectedSection));
  }

  // Handle Main Parent Subsection checkbox change
  const handleMainParentSubsectionChange = async (subsection, isChecked) => {
    try {
      // Get username and replace spaces with nothing or use userId if username has spaces
      let changedByValue = userDetails.userName || userDetails.userId;
      // Replace spaces in username to avoid URL encoding issues
      if (changedByValue && typeof changedByValue === 'string') {
        changedByValue = changedByValue.replace(/\s+/g, '');
      }
      
      await dispatch(updateMainParentSubsection({
        subSectionId: subsection.subSectionId,
        mainParentSubsection: isChecked,
        changedBy: changedByValue
      }));
      // Refresh the list after update
      if (selectedSection?.value) {
        dispatch(getSubSectionsList({ 
          sectionId: selectedSection.value, 
          queryString: searchQuery, 
          PageNumber: currentPage, 
          PageSize: pageSize 
        }));
      }
    } catch (error) {
      console.error('Error updating main parent subsection:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update main parent subsection.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Delete functionality
  const onClickDelete = (subsection) => {
    setSubsectionToDelete(subsection);
    setDeleteModal(true);
  };

  const handleDeleteSubsection = () => {
    if (subsectionToDelete) {
      // Set deleteStatus to true and pass the whole item
      const subsectionWithDeleteStatus = {
        ...subsectionToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId
      };

      dispatch(deleteSubSection(subsectionWithDeleteStatus));
      setDeleteModal(false);
      setSubsectionToDelete(null);
    }
  };

  useEffect(() => {
    dispatch(getSectionForSubSectionList(null));
  }, []);

  // Show success alert if redirected after add
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    if (state.added) {
      Swal.fire({ title: 'Success!', text: 'Subsection added successfully.', icon: 'success', confirmButtonText: 'OK' });
    } else if (state.updated) {
      Swal.fire({ title: 'Success!', text: 'Subsection updated successfully.', icon: 'success', confirmButtonText: 'OK' });
    }
    // Clear the navigation state so the alert doesn't reappear
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // Watch for success responses and display messages
  useEffect(() => {
    if (subSectionSuccessResponse) {
      // Check if it's an import/upload response
      if (subSectionSuccessResponse || subSectionSuccessResponse.success) {
        let title = 'Success!';
        let message = 'Operation completed successfully.';
        let icon = 'success';

        // If it's an import response with detailed data
        if (subSectionSuccessResponse) {
          const data = subSectionSuccessResponse;
          if (data.totalRows !== undefined) {
            // Import response with summary
            title = 'Import Summary';
            message = `
              <div class="text-start">
                <p><strong>Total Rows:</strong> ${data.totalRows || 0}</p>
                <p><strong>Successfully Processed:</strong> ${data.successRows || 0}</p>
                <p><strong>Failed:</strong> ${data.failedRows || 0}</p>
                <p><strong>Message:</strong> ${data.message || 'No message available'}</p>
              </div>
            `;
            icon = (data.failedRows === 0) ? 'success' : 'warning';
          }
        }

        Swal.fire({
          title: title,
          html: message,
          icon: icon,
          confirmButtonText: 'OK'
        }).then(() => {
          dispatch(setSubSectionSuccess(null));
          // Refresh the list if a section is selected
          if (selectedSection) {
            dispatch(getSubSectionsList({ sectionId: selectedSection.value, queryString: searchQuery, PageNumber: currentPage, PageSize: pageSize }));
          }
        });
      }
    }
  }, [subSectionSuccessResponse, dispatch, selectedSection, searchQuery, currentPage, pageSize]);

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

  const handleGoToPageInputChange = (e) => {
    const digitsOnly = (e.target.value || '').replace(/[^\d]/g, '');
    setGoToPageInput(digitsOnly);
  };

  const handleGoToPage = () => {
    const page = Number.parseInt(goToPageInput, 10);

    if (!Number.isFinite(page) || Number.isNaN(page)) {
      Swal.fire({
        title: 'Invalid page number',
        text: `Please enter a page number between 1 and ${totalPages}.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (page < 1 || page > totalPages) {
      Swal.fire({
        title: 'Invalid page number',
        text: `Page number must be between 1 and ${totalPages}.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setCurrentPage(page);
    setGoToPageInput('');
  };

  const handleGoToPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToPage();
    }
  };

  // Fetch list whenever page, section, or search changes (like ListRemedialRubrics)
  useEffect(() => {
    if (isSelectedSection && selectedSection?.value) {
      dispatch(getSubSectionsList({ sectionId: selectedSection.value, queryString: searchQuery, PageNumber: currentPage, PageSize: pageSize }));
    }
  }, [dispatch, isSelectedSection, selectedSection, searchQuery, currentPage, pageSize]);

  const handleExport = async () => {
    if (!selectedSection) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please select a section to export.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    try {
      const response = await dispatch(exportSubSectionsToExcelThunk(selectedSection.value));
      
      // Check if response and response.data exist
      if (!response || !response.data) {
        throw new Error('No data received from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Safely get content-disposition header
      let fileName = "SubSections.xlsx";
      if (response.headers) {
        const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to export: ' + (error.message || error),
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsImporting(true);
      dispatch(importSubSectionsFromExcel(file))
        .catch((error) => {
          Swal.fire({
            title: 'Error!',
            text: error.message || 'Failed to import subsections.',
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

  const openRefRubricImportModal = () => {
    setRefRubricImportFile(null);
    setRefRubricImportLoading(false);
    setRefRubricTemplateLoading(false);
    if (refRubricFileInputRef.current) {
      refRubricFileInputRef.current.value = '';
    }
    setRefRubricImportModal(true);
  };

  const handleDownloadRefRubricTemplate = async (format) => {
    setRefRubricTemplateLoading(true);
    try {
      const response = await downloadReferenceRubricsTemplate(format);
      const blob = response?.data instanceof Blob
        ? response.data
        : new Blob([response?.data ?? ''], {
          type: response?.headers?.['content-type'] || 'application/octet-stream',
        });
      const fileName = format === 'csv'
        ? 'ReferenceRubrics_Import_Sample.csv'
        : 'ReferenceRubrics_Import_Sample.xlsx';
      triggerBlobDownload(blob, fileName);
    } catch (error) {
      Swal.fire({
        title: 'Download failed',
        text: typeof error === 'string' ? error : (error?.message || 'Unable to download sample file.'),
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setRefRubricTemplateLoading(false);
    }
  };

  const handleRefRubricFileChange = (event) => {
    setRefRubricImportFile(event.target.files?.[0] || null);
  };

  const handleRefRubricImportSubmit = async () => {
    if (!refRubricImportFile) {
      Swal.fire({
        title: 'No file selected',
        text: 'Please choose an Excel or CSV file to import.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const extension = refRubricImportFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension)) {
      Swal.fire({
        title: 'Invalid file',
        text: 'Only .xlsx and .csv files are supported.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    setRefRubricImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', refRubricImportFile);
      const result = await importReferenceRubrics(formData);

      const totalRows = result?.totalRows ?? result?.TotalRows ?? 0;
      const insertedCount = result?.insertedCount ?? result?.InsertedCount ?? 0;
      const skippedCount = result?.skippedCount ?? result?.SkippedCount ?? 0;
      const skippedFile = result?.skippedFile ?? result?.SkippedFile;

      if (skippedFile?.contentBase64 || skippedFile?.ContentBase64) {
        downloadBase64File(
          skippedFile.contentBase64 || skippedFile.ContentBase64,
          skippedFile.fileName || skippedFile.FileName || `ReferenceRubrics_Import_Skipped_${moment().format('YYYYMMDD_HHmmss')}.xlsx`,
          skippedFile.contentType || skippedFile.ContentType || 'application/octet-stream'
        );
      }

      setRefRubricImportModal(false);
      setRefRubricImportFile(null);
      if (refRubricFileInputRef.current) {
        refRubricFileInputRef.current.value = '';
      }

      const skippedNote = skippedCount > 0
        ? '<p class="mb-0 mt-2"><strong>Skipped rows file downloaded automatically.</strong></p>'
        : '';

      Swal.fire({
        title: insertedCount > 0 ? 'Import completed' : 'Import finished',
        html: `
          <div class="text-start">
            <p><strong>Total rows:</strong> ${totalRows}</p>
            <p><strong>Inserted:</strong> ${insertedCount}</p>
            <p><strong>Skipped:</strong> ${skippedCount}</p>
            ${skippedNote}
          </div>
        `,
        icon: insertedCount > 0 ? 'success' : (skippedCount > 0 ? 'warning' : 'info'),
        confirmButtonText: 'OK',
      });

      if (selectedSection) {
        dispatch(getSubSectionsList({
          sectionId: selectedSection.value,
          queryString: searchQuery,
          PageNumber: currentPage,
          PageSize: pageSize,
        }));
      }
    } catch (error) {
      Swal.fire({
        title: 'Import failed',
        text: typeof error === 'string' ? error : (error?.message || 'Unable to import reference rubrics.'),
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setRefRubricImportLoading(false);
    }
  };

  const handleUploadFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      dispatch(uploadSubSectionsFromExcel(file))
        .catch((error) => {
          Swal.fire({
            title: 'Error!',
            text: error.message || 'Failed to upload file.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        })
        .finally(() => {
          setIsUploading(false);
          event.target.value = null;
        });
    }
  };

  const handleUploadClick = () => {
    uploadFileInputRef.current.click();
  };

  document.title = "List Sub Section";
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
                              dispatch(setSubSectionList([]));
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
                              setCurrentPage(1);
                            }} /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <Button
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
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                          accept=".xlsx,.xls,.csv"
                        />
                        <input
                          type="file"
                          ref={uploadFileInputRef}
                          onChange={handleUploadFileSelect}
                          style={{ display: 'none' }}
                          accept=".xlsx,.xls,.csv"
                        />
                        <Button
                          type="button"
                          className="btn btn-soft-secondary btn-sm"
                          onClick={handleExport}
                        >
                          <i className="ri-file-list-3-line align-middle"></i> Export
                        </Button>
                        <Button
                          type="button"
                          className="btn btn-soft-primary btn-sm"
                          onClick={handleUploadClick}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Uploading...
                            </>
                          ) : (
                            <>
                              <i className=" ri-newspaper-line align-middle"></i> Update SubSection
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          className="btn btn-soft-primary btn-sm"
                          onClick={openRefRubricImportModal}
                        >
                          <i className="ri-links-line align-middle"></i> Import Ref Rubrics
                        </Button>
                        <Link to="/admin/addsubsection"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th scope="col" className="text-center" style={{ width: "50px" }}>ID</th>
                            <th className="text-center">Sub Section Name</th>
                            <th className="text-center">Section Id</th>
                            <th className="text-center" style={{ width: '15%' }}>Parent Subsection</th>
                            <th className='text-center' style={{ width: '10%' }}>Main Parent Subsection</th>
                            <th className="text-center">Parent Sub Section Id</th>
                            <th className="text-center">Parent Sub Section Name</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {isSelectedSection ?
                          <>
                            {
                              loading ? (
                                <tbody className="list form-check-all">
                                  <tr>
                                    <td colSpan="8" className="text-center">
                                      <Spinner color="primary" className="ms-1" />
                                    </td>
                                  </tr>
                                </tbody>
                              ) : (
                                <tbody className="list form-check-all">
                                  {subSectionList?.resultObject?.length > 0 ? (
                                    subSectionList?.resultObject?.map((subsection, index) => (
                                      <tr key={index}>
                                        <td className="text-center">{subsection.subSectionId}</td>
                                        <td className="text-center">{subsection.subSectionName}</td>
                                        <td className="text-center">{subsection.sectionId}</td>
                                        <td className="text-center">
                                          <Select 
                                            className="form-select form-select-sm"
                                            value={null}
                                            onChange={(item) => { handleSelectSubSectionAlias(item, subsection); }}
                                            options={SubSectionBySectionOptions}
                                            placeholder="Select..."
                                            isClearable
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            menuShouldScrollIntoView={false}
                                            onMenuScrollToBottom={handleParentSubSectionMenuScrollToBottom}
                                            filterOption={(option, inputValue) => {
                                              if (!inputValue) return true;
                                              return option.label.toLowerCase().includes(inputValue.toLowerCase());
                                            }}
                                            styles={{
                                              menuPortal: (base) => ({ 
                                                ...base, 
                                                zIndex: 9999
                                              }),
                                              menu: (base) => ({ 
                                                ...base, 
                                                zIndex: 9999,
                                                minWidth: '250px',
                                                maxWidth: '400px',
                                                maxHeight: '300px'
                                              }),
                                              control: (base) => ({ 
                                                ...base, 
                                                minHeight: '31px', 
                                                height: '31px',
                                                fontSize: '14px',
                                                borderColor: '#ced4da',
                                                minWidth: '120px',
                                                width: '100%'
                                              }),
                                              valueContainer: (base) => ({ 
                                                ...base, 
                                                padding: '2px 8px',
                                                height: '31px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                overflow: 'visible'
                                              }),
                                              placeholder: (base) => ({
                                                ...base,
                                                color: '#6c757d',
                                                whiteSpace: 'nowrap',
                                                overflow: 'visible',
                                                textOverflow: 'clip'
                                              }),
                                              input: (base) => ({ 
                                                ...base, 
                                                margin: 0, 
                                                padding: 0 
                                              }),
                                              indicatorsContainer: (base) => ({ 
                                                ...base, 
                                                height: '31px',
                                                padding: '0 4px'
                                              }),
                                              option: (base, state) => ({
                                                ...base,
                                                backgroundColor: state.isSelected 
                                                  ? '#0d6efd' 
                                                  : state.isFocused 
                                                    ? '#e7f1ff' 
                                                    : 'white',
                                                color: state.isSelected ? 'white' : '#212529',
                                                cursor: 'pointer',
                                                padding: '8px 12px',
                                                '&:hover': {
                                                  backgroundColor: state.isSelected ? '#0d6efd' : '#e7f1ff'
                                                }
                                              })
                                            }}
                                          />
                                        </td>
                                        <td className='text-center'>
                                          <div className="form-check d-flex justify-content-center">
                                            <Input
                                              className="form-check-input"
                                              type="checkbox"
                                              id={`mainParent-${subsection.subSectionId}`}
                                              checked={subsection.mainParentSubsection || false}
                                              onChange={(e) => handleMainParentSubsectionChange(subsection, e.target.checked)}
                                            />
                                            <Label className="form-check-label" htmlFor={`mainParent-${subsection.subSectionId}`}>
                                              &nbsp;
                                            </Label>
                                          </div>
                                        </td>
                                        <td className="text-center">{subsection.parentSubSectionId}</td>
                                        <td className="text-center">{subsection.parentSubSectionName}</td>
                                        <td className='text-center'>
                                          <div className="d-inline-flex gap-2">
                                            <div className="edit">
                                              <Link to="/admin/editsubsection" state={{ selectedSubSection: subsection }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                            </div>
                                            <div className="remove">
                                              <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => onClickDelete(subsection)}><i className="ri-delete-bin-5-line" /> </button>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="8" className="text-center">
                                        No subsections found
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              )}
                          </>
                          : (
                            <tr>
                              <td colSpan="8" className="text-center">
                                Please select a section
                              </td>
                            </tr>
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
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center justify-content-sm-start">
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
                                    <button className="page-link" onClick={() => {
                                      setCurrentPage(page);
                                    }}>{page}</button>
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

                          <InputGroup size="sm" style={{ width: '190px' }}>
                            <InputGroupText>Go to</InputGroupText>
                            <Input
                              value={goToPageInput}
                              onChange={handleGoToPageInputChange}
                              onKeyDown={handleGoToPageKeyDown}
                              placeholder="Page #"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              aria-label="Go to page number"
                              disabled={totalPages <= 1}
                            />
                            <Button
                              color="primary"
                              outline
                              onClick={handleGoToPage}
                              disabled={totalPages <= 1}
                            >
                              Go
                            </Button>
                          </InputGroup>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <Modal isOpen={refRubricImportModal} toggle={() => !refRubricImportLoading && setRefRubricImportModal(false)}>
        <ModalHeader toggle={() => !refRubricImportLoading && setRefRubricImportModal(false)}>
          Import Reference Rubrics
        </ModalHeader>
        <ModalBody>
          <p className="text-muted mb-3">
            Upload a 2-column file to link reference rubrics to existing subsections.
          </p>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Button
              color="info"
              size="sm"
              outline
              disabled={refRubricTemplateLoading || refRubricImportLoading}
              onClick={() => handleDownloadRefRubricTemplate('excel')}
            >
              <i className="ri-file-excel-2-line me-1"></i> Sample Excel
            </Button>
            <Button
              color="secondary"
              size="sm"
              outline
              disabled={refRubricTemplateLoading || refRubricImportLoading}
              onClick={() => handleDownloadRefRubricTemplate('csv')}
            >
              <i className="ri-file-text-line me-1"></i> Sample CSV
            </Button>
          </div>
          <div>
            <Label htmlFor="refRubricImportFile" className="form-label fw-semibold">Choose file</Label>
            <Input
              id="refRubricImportFile"
              type="file"
              innerRef={refRubricFileInputRef}
              accept=".csv,.xlsx,.xls"
              disabled={refRubricImportLoading}
              onChange={handleRefRubricFileChange}
            />
            {refRubricImportFile && (
              <small className="text-muted d-block mt-2">
                Selected: {refRubricImportFile.name}
              </small>
            )}
          </div>
          <small className="text-muted d-block mt-3">
            Columns: <strong>SubSectionName</strong> and <strong>RefSubSectionName</strong>.
            Existing links and invalid rows are skipped; skipped rows download automatically with reason.
          </small>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={handleRefRubricImportSubmit} disabled={refRubricImportLoading || !refRubricImportFile}>
            {refRubricImportLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Importing...
              </>
            ) : (
              <>
                <i className="ri-upload-2-line me-1"></i> Import
              </>
            )}
          </Button>
          <Button color="secondary" onClick={() => setRefRubricImportModal(false)} disabled={refRubricImportLoading}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteSubsection}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListSubSection;