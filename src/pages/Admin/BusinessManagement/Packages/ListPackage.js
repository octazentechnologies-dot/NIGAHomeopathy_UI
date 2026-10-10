import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deletePackage, getPackageList } from '../../../../slices/admin/packages/thunk';
import { setPackageError, setPackageSuccess } from '../../../../slices/admin/packages/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import { exportListTableCsv } from '../../../../helpers/listExport';

const ListPackage = () => {
  const dispatch = useDispatch();
  const [deleteModal, setDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loading = useSelector((state) => state?.Package?.packageLoading || false);
  const packages = useSelector((state) => state?.Package?.packageList) || [];
  const success = useSelector((state) => state?.Package?.packageSuccess);
  const error = useSelector((state) => state?.Package?.packageError);

  useEffect(() => {
    dispatch(getPackageList());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(setPackageSuccess(null));
        dispatch(setPackageError(null));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, error, dispatch]);

  const filteredList = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return packages;
    return packages.filter((item) => {
      const name = (item.packageName || item.PackageName || '').toLowerCase();
      const amount = String(item.amount ?? item.Amount ?? '');
      const cases = String(item.caseCount ?? item.CaseCount ?? '');
      const validity = String(item.validityInDays ?? item.ValidityInDays ?? '');
      return name.includes(term) || amount.includes(term) || cases.includes(term) || validity.includes(term);
    });
  }, [packages, searchQuery]);

  const onClickDelete = (item) => {
    setPackageToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = () => {
    if (!packageToDelete) return;
    dispatch(deletePackage({ packageId: packageToDelete.packageId ?? packageToDelete.PackageId }));
    setDeleteModal(false);
    setPackageToDelete(null);
  };

  document.title = 'List Packages';

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
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import" disabled title="Import is not available for this list yet">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export" onClick={(e) => exportListTableCsv(e)}>
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/addpackage" className="d-inline-flex">
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
                          <th scope="col">Package Name</th>
                          <th scope="col">Case Count</th>
                          <th scope="col">Validity (Days)</th>
                          <th scope="col">Amount</th>
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
                              const id = item.packageId ?? item.PackageId;
                              return (
                                <tr key={id || index}>
                                  <td className="text-center patient-list-modal__index">{index + 1}</td>
                                  <td>{item.packageName ?? item.PackageName ?? '—'}</td>
                                  <td>{item.caseCount ?? item.CaseCount ?? '—'}</td>
                                  <td>{item.validityInDays ?? item.ValidityInDays ?? '—'}</td>
                                  <td>{item.amount ?? item.Amount ?? '—'}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <Link to="/admin/editpackage" state={{ selectedPackage: item }}>
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
                                {searchQuery ? 'No packages match your search' : 'No Packages Available'}
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
                        : `Showing ${filteredList.length} of ${packages.length} Results`}
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

export default ListPackage;
