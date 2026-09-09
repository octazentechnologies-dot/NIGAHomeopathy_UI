import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteQualification, getQualificationList } from '../../../../slices/admin/qualifications/thunk';
import { setQualificationError, setQualificationSuccess } from '../../../../slices/admin/qualifications/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListQualification = () => {
  const dispatch = useDispatch();
  const [deleteModal, setDeleteModal] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loading = useSelector((state) => state?.Qualification?.qualificationLoading || false);
  const qualifications = useSelector((state) => state?.Qualification?.qualificationList || []);
  const success = useSelector((state) => state?.Qualification?.qualificationSuccess);
  const error = useSelector((state) => state?.Qualification?.qualificationError);

  useEffect(() => {
    dispatch(getQualificationList({ PageNumber: 1, PageSize: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(setQualificationSuccess(null));
        dispatch(setQualificationError(null));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, error, dispatch]);

  const filteredList = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return qualifications;
    return qualifications.filter((item) => {
      const name = (item.qualificationName || item.QualificationName || '').toLowerCase();
      const alias = (item.qualificationAlias || item.QualificationAlias || '').toLowerCase();
      const degree = (item.degreeLevel || item.DegreeLevel || '').toLowerCase();
      return name.includes(term) || alias.includes(term) || degree.includes(term);
    });
  }, [qualifications, searchQuery]);

  const onClickDelete = (item) => {
    setQualificationToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = () => {
    if (!qualificationToDelete) return;
    const id = qualificationToDelete.qualificationId ?? qualificationToDelete.QualificationId;
    dispatch(deleteQualification(id));
    setDeleteModal(false);
    setQualificationToDelete(null);
  };

  document.title = 'List Qualifications';

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
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                      <Link to="/admin/addqualification" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                          New
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {success ? <div className="alert alert-success mb-3">{success}</div> : null}
                  {error ? <div className="alert alert-danger mb-3">{error}</div> : null}
                  <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table" id="customerTable">
                      <thead>
                        <tr>
                          <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                          <th scope="col">Qualification Name</th>
                          <th scope="col">Alias</th>
                          <th scope="col">Degree Level</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan="6" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {filteredList.length > 0 ? (
                            filteredList.map((item, index) => {
                              const id = item.qualificationId ?? item.QualificationId;
                              return (
                                <tr key={id || index}>
                                  <td className="text-center patient-list-modal__index">{index + 1}</td>
                                  <td>{item.qualificationName ?? item.QualificationName ?? '—'}</td>
                                  <td>{(item.qualificationAlias ?? item.QualificationAlias) || '—'}</td>
                                  <td>{(item.degreeLevel ?? item.DegreeLevel) || '—'}</td>
                                  <td>{(item.description ?? item.Description) || '—'}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <Link to="/admin/editqualification" state={{ selectedQualification: item }}>
                                        <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => onClickDelete(item)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center text-muted py-4">
                                {searchQuery ? 'No qualifications match your search' : 'No Qualifications Available'}
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
                        : `Showing ${filteredList.length} of ${qualifications.length} Results`}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />
    </React.Fragment>
  );
};

export default ListQualification;
