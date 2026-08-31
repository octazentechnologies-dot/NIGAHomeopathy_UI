import React, { useEffect, useState } from 'react';
import { CardHeader, Card, CardBody, Col, Container, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { getRoleList, deleteRole } from "../../../../slices/admin/role/thunk";
import DeleteModal from '../../../../Components/Common/DeleteModal';

const ListRole = () => {
  document.title = "List Roles";
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Redux state
  const roleLoading = useSelector((state) => state?.Role?.roleLoading || false);
  const roles = useSelector((state) => state?.Role?.roleList || []);

  useEffect(() => {
    dispatch(getRoleList());
  }, [dispatch]);

  // Delete functionality
  const onClickDelete = (roleItem) => {
    setRoleToDelete(roleItem);
    setDeleteModal(true);
  };

  const handleDeleteRole = () => {
    if (roleToDelete) {
      // Set deleteStatus to true and pass the whole item
      const roleWithDeleteStatus = {
        ...roleToDelete,
        deleteStatus: true,
        changedBy: userDetails?.userId || userDetails?.userName || "Admin"
      };

      dispatch(deleteRole(roleWithDeleteStatus));
      setDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <Row className="g-4">
                    <Col className="col-sm">
                      <div className="d-flex justify-content-sm-start">
                        <div className="search-box">
                          <input type="text" className="form-control form-control-sm search" placeholder="Search..." />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm">
                          <i className=" ri-newspaper-line align-middle"></i> Import
                        </button>
                        <button type="button" className="btn btn-soft-secondary btn-sm">
                          <i className="ri-file-list-3-line align-middle"></i> Export
                        </button>
                        <Link to="/admin/addrole">
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
                        <thead>
                          <tr>
                            <th scope="col" style={{ width: "50px" }}>ID</th>
                            <th>Role Name</th>
                            <th>Firm Name</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {roleLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="4" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody>
                            {roles?.length > 0 ? (
                              roles
                                .filter((role) => !role.deleteStatus)
                                .map((role, index) => (
                                  <tr key={role.roleId || index}>
                                    <td>{role.roleId}</td>
                                    <td>{role.roleName || "-"}</td>
                                    <td>{role.firmName || "N/A"}</td>
                                    <td className="text-center">
                                      <div className="d-inline-flex gap-2">
                                        <div className="edit">
                                          <Link to="/admin/editrole" state={{ roleId: role.roleId }}>
                                            <button className="btn btn-sm btn-soft-success edit-item-btn">
                                              <i className="ri-pencil-fill" />
                                            </button>
                                          </Link>
                                        </div>
                                        <div className="remove">
                                          <button
                                            className="btn btn-sm btn-soft-danger remove-item-btn"
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
                                <td colSpan="4" className="text-center">No Roles Available</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
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

