import React, { useEffect, useMemo, useState } from 'react';
import { CardHeader, Card, CardBody, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getRoleList, deleteRole } from '../../../../slices/admin/role/thunk';
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListRole = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  const [deleteModal, setDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const roleLoading = useSelector((state) => state?.Role?.roleLoading || false);
  const roles = useSelector((state) => state?.Role?.roleList || []);

  useEffect(() => {
    dispatch(getRoleList());
  }, [dispatch]);

  const filteredRoles = useMemo(() => {
    const activeRoles = (roles || []).filter((role) => !role.deleteStatus);
    const term = searchQuery.trim().toLowerCase();
    if (!term) return activeRoles;
    return activeRoles.filter((role) => {
      const name = (role.roleName || '').toLowerCase();
      const firm = (role.firmName || '').toLowerCase();
      return name.includes(term) || firm.includes(term);
    });
  }, [roles, searchQuery]);

  const onClickDelete = (roleItem) => {
    setRoleToDelete(roleItem);
    setDeleteModal(true);
  };

  const handleDeleteRole = () => {
    if (roleToDelete) {
      const roleWithDeleteStatus = {
        ...roleToDelete,
        deleteStatus: true,
        changedBy: userDetails?.userId || userDetails?.userName || 'Admin',
      };

      dispatch(deleteRole(roleWithDeleteStatus));
      setDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  document.title = 'List Roles';

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
                      <Link to="/admin/addrole" className="d-inline-flex">
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
                          <th scope="col">Role Name</th>
                          <th scope="col">Firm Name</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {roleLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="4" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {filteredRoles.length > 0 ? (
                            filteredRoles.map((role, index) => (
                              <tr key={role.roleId || index}>
                                <td className="text-center patient-list-modal__index">{index + 1}</td>
                                <td>{role.roleName || '—'}</td>
                                <td>{role.firmName || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editrole" state={{ roleId: role.roleId }}>
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
                                        onClick={() => onClickDelete(role)}
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
                              <td colSpan="4" className="text-center text-muted py-4">
                                {searchQuery ? 'No roles match your search' : 'No Roles Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {roleLoading
                        ? 'Loading...'
                        : `Showing ${filteredRoles.length} Results`}
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
        onDeleteClick={handleDeleteRole}
        onCloseClick={() => setDeleteModal(false)}
      />
    </React.Fragment>
  );
};

export default ListRole;
