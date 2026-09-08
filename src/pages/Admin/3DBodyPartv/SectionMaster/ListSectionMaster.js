import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import {
  getAnatomySectionMastersList,
  deleteAnatomySectionMaster,
} from '../../../../slices/admin/3dbodypart/sectionmaster/thunk';

const ListSectionMaster = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loading = useSelector((state) => state?.AnatomySectionMaster?.loading || false);
  const items =
    useSelector(
      (state) => state?.AnatomySectionMaster?.anatomySectionMasterList?.resultObject
    ) || [];
  const totalPages =
    useSelector(
      (state) => state?.AnatomySectionMaster?.anatomySectionMasterList?.totalPageCount
    ) || 1;
  const totalRecords =
    useSelector(
      (state) => state?.AnatomySectionMaster?.anatomySectionMasterList?.totalRecordCount
    ) ||
    items.length ||
    0;

  useEffect(() => {
    dispatch(getAnatomySectionMastersList({
      PageNumber: currentPage,
      PageSize: pageSize,
      SearchText: searchQuery.trim(),
    }));
  }, [dispatch, currentPage, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const onClickDelete = (item) => {
    setItemToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      dispatch(
        deleteAnatomySectionMaster({
          ...itemToDelete,
          deleteStatus: true,
          changedBy: userDetails?.userId,
        })
      );
      setDeleteModal(false);
      setItemToDelete(null);
      setCurrentPage(1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'Section Master';
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
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
                      <Link to="/admin/add3dsectionmaster" className="d-inline-flex">
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
                    <table className="table mb-0 align-middle patient-list-modal__table">
                      <thead>
                        <tr>
                          <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                          <th scope="col">Mesh Key Name</th>
                          <th scope="col">Section Name</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan={4} className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {items.length > 0 ? (
                            items.map((row, index) => (
                              <tr key={row.ThreeDBodyPartSectionMasterID ?? index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{row.ThreeD_BodyPart_MeshKey_Name || '—'}</td>
                                <td>{row.SectionName || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <Link to="/admin/edit3dsectionmaster" state={{ selectedSection: row }}>
                                      <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                                        <i className="ri-pencil-fill" />
                                      </button>
                                    </Link>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-soft-danger remove-item-btn"
                                      title="Delete"
                                      onClick={() => onClickDelete(row)}
                                    >
                                      <i className="ri-delete-bin-5-line" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center text-muted py-4">
                                {searchQuery ? 'No sections match your search' : 'No Sections Available'}
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
                        : `Showing ${items.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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
        onDeleteClick={handleDelete}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListSectionMaster;
