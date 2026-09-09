import React, { useEffect, useState } from 'react';
import { CardHeader, Card, CardBody, Col, Container, Row, Label, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { getBodyPartsList, deleteBodyPart, getSectionForBodyPart } from '../../../../slices/thunks';
import { useDispatch, useSelector } from 'react-redux';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListBodyParts = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [deleteModal, setDeleteModal] = useState(false);
  const [bodyPartToDelete, setBodyPartToDelete] = useState(null);

  const bodyPartsList = useSelector((state) => state.BodyPart.bodyPartsList);
  const rows = bodyPartsList?.resultObject || [];
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const totalPages = useSelector((state) => state?.BodyPart?.bodyPartsList?.totalPageCount || 1);
  const totalRecords = useSelector((state) => state?.BodyPart?.bodyPartsList?.totalRecordCount || rows.length || 0);
  const { loading } = useSelector((state) => state.BodyPart);

  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  function handleSelectSection(section) {
    setSelectedSection(section);
    setCurrentPage(1);
  }

  const onClickDelete = (bodyPart) => {
    setBodyPartToDelete(bodyPart);
    setDeleteModal(true);
  };

  const handleDeleteBodyPart = () => {
    if (bodyPartToDelete) {
      const bodyPartWithDeleteStatus = {
        ...bodyPartToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId,
      };

      dispatch(deleteBodyPart(bodyPartWithDeleteStatus));
      setDeleteModal(false);
      setBodyPartToDelete(null);
    }
  };

  useEffect(() => {
    dispatch(getSectionForBodyPart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getBodyPartsList({
      sectionId: selectedSection?.value,
      queryString: searchQuery,
      pageNumber: currentPage,
      pageSize: pageSize,
    }));
  }, [currentPage, selectedSection, searchQuery, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Body Parts';
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
                            setSearchQuery('');
                            setCurrentPage(1);
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
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export">
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/addbodyparts" className="d-inline-flex">
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
                          <th scope="col">Body Part Name</th>
                          <th scope="col">Description</th>
                          <th scope="col">Section ID</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {rows.length > 0 ? (
                            rows.map((bodyPart, index) => (
                              <tr key={bodyPart.bodyPartId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{bodyPart.bodyPartName || '—'}</td>
                                <td>{bodyPart.description || '—'}</td>
                                <td>{bodyPart.sectionId || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editbodyparts" state={{ selectedBodyPart: bodyPart }}>
                                        <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                    </div>
                                    <div className="remove">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => onClickDelete(bodyPart)}
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
                              <td colSpan="5" className="text-center text-muted py-4">
                                {searchQuery ? 'No body parts match your search' : 'No body parts found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {loading
                        ? 'Loading...'
                        : `Showing ${rows.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBodyPart}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListBodyParts;
