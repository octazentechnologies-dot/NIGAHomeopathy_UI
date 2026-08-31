import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { CardHeader, Button, Card, CardBody, Col, Container, Row, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import { getBodyPartsList, deleteBodyPart, getSectionForBodyPart } from '../../../../slices/thunks';
import { useDispatch, useSelector } from 'react-redux';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListBodyParts = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [bodyPartToDelete, setBodyPartToDelete] = useState(null);

  // Redux state
  const bodyPartsList = useSelector((state) => state.BodyPart.bodyPartsList);
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const totalPages = useSelector((state) => state?.BodyPart?.bodyPartsList?.totalPageCount || 1);
  const { loading } = useSelector((state) => state.BodyPart);

  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  function handleSelectSection(section) {
    setSelectedSection(section);
    setCurrentPage(1);
    dispatch(getBodyPartsList({
      sectionId: section.value,
      pageNumber: 1,
      pageSize: pageSize
    }));
  }

  // Delete functionality
  const onClickDelete = (bodyPart) => {
    setBodyPartToDelete(bodyPart);
    setDeleteModal(true);
  };

  const handleDeleteBodyPart = () => {
    if (bodyPartToDelete) {
      // Set deleteStatus to true and pass the whole item
      const bodyPartWithDeleteStatus = {
        ...bodyPartToDelete,
        deleteStatus: true,
        changedBy: userDetails.userId
      };

      dispatch(deleteBodyPart(bodyPartWithDeleteStatus));
      setDeleteModal(false);
      setBodyPartToDelete(null);
    }
  };

  useEffect(() => {
    dispatch(getSectionForBodyPart());
    dispatch(getBodyPartsList({
      pageNumber: currentPage,
      pageSize: pageSize
    }));
  }, []);

  useEffect(() => {
    if (selectedSection) {
      dispatch(getBodyPartsList({
        sectionId: selectedSection?.value,
        pageNumber: currentPage,
        pageSize: pageSize
      }));
    } else {
      dispatch(getBodyPartsList({
        pageNumber: currentPage,
        pageSize: pageSize
      }));
    }

  }, [currentPage]);

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      dispatch(getBodyPartsList({
        sectionId: selectedSection?.value,
        pageNumber: currentPage - 1,
        pageSize: pageSize
      }));
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      dispatch(getBodyPartsList({
        sectionId: selectedSection?.value,
        pageNumber: currentPage + 1,
        pageSize: pageSize
      }));
      setCurrentPage((prev) => prev + 1);
    }
  };

  document.title = "List Body Parts";
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
                              setCurrentPage(1);
                              dispatch(getBodyPartsList({
                                pageNumber: 1,
                                pageSize: pageSize
                              }));
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
                          /* onChange={(e) => {
                            setSearchQuery(e.target.value);
                            dispatch(getBodyPartsList({
                              sectionId: selectedSection?.value,
                              queryString: e.target.value,
                              pageNumber: currentPage,
                              pageSize: pageSize
                            }));
                          }} */
                          />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm">
                          <i className="ri-newspaper-line align-middle"></i> Import
                        </button>
                        <button type="button" className="btn btn-soft-secondary btn-sm">
                          <i className="ri-file-list-3-line align-middle"></i> Export
                        </button>
                        <Link to="/admin/addbodyparts">
                          <button type="button" className="btn btn-soft-info btn-sm">
                            <i className="ri-add-line align-middle"></i> New
                          </button>
                        </Link>
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
                            <th>Body Part Name</th>
                            <th>Description</th>
                            <th>Section ID</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        <>
                          {loading ? (
                            <tbody className="list form-check-all">
                              <tr>
                                <td colSpan="5" className="text-center">
                                  <Spinner color="primary" className="ms-1" />
                                </td>
                              </tr>
                            </tbody>
                          ) : (
                            <tbody className="list form-check-all">
                              {bodyPartsList?.resultObject?.length > 0 ? (
                                bodyPartsList?.resultObject?.map((bodyPart) => (
                                  <tr key={bodyPart.bodyPartId}>
                                    <td>{bodyPart.bodyPartId}</td>
                                    <td>{bodyPart.bodyPartName}</td>
                                    <td>{bodyPart.description}</td>
                                    <td>{bodyPart.sectionId}</td>
                                    <td className='text-center'>
                                      <div className="d-inline-flex gap-2">
                                        <div className="edit">
                                          <Link to={`/admin/editbodyparts`} state={{ selectedBodyPart: bodyPart }}>
                                            <button className="btn btn-sm btn-soft-success edit-item-btn">
                                              <i className="ri-pencil-fill" />
                                            </button>
                                          </Link>
                                        </div>
                                        <div className="remove">
                                          <button
                                            className="btn btn-sm btn-soft-danger remove-item-btn"
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
                                  <td colSpan="5" className="text-center">
                                    No body parts found
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
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteBodyPart}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListBodyParts;