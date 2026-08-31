import React, { useEffect, useState } from 'react';
import { CardHeader, Card, CardBody, Col, Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from "react-redux";
import { getUserList } from "../../../../slices/admin/users/thunk";

const ListUser = () => {
  document.title = "List Users";
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const userLoading = useSelector((state) => state?.User?.userLoading || false);
  const users = useSelector((state) => state?.User?.userList || []);
  const totalCount = useSelector((state) => state?.User?.totalCount || 0);
  const totalPageCount = useSelector((state) => state?.User?.totalPageCount || 0);

  useEffect(() => {
    dispatch(
      getUserList({
        queryString: searchTerm,
        PageNumber: pageNumber,
        PageSize: pageSize
      })
    );
  }, [dispatch, searchTerm, pageNumber]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPageNumber(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (totalPageCount || 1)) {
      setPageNumber(newPage);
    }
  };

  const paginationItems = Array.from(
    { length: totalPageCount || 1 },
    (_, idx) => idx + 1
  );

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
                          <input
                            type="text"
                            className="form-control form-control-sm search"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                          />
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
                        <Link to="/admin/adduser">
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
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>User Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {userLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="8" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {users?.length > 0 ? (
                              users.map((user) => (
                                <tr key={user.userId}>
                                  <td>{user.userId}</td>
                                  <td>{user.firstName || "-"}</td>
                                  <td>{user.lastName || "-"}</td>
                                  <td>{user.userName || "-"}</td>
                                  <td>{user.emailId || "-"}</td>
                                  <td>{user.role || "-"}</td>
                                  <td>{user.userStatus || "-"}</td>
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/edituser" state={{ userId: user.userId }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn">
                                          <i className="ri-delete-bin-5-line" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" className="text-center">No Users Found</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>

                    <div className="align-items-center g-3 text-center text-sm-start row">
                      <div className="col-sm">
                        <div className="text-muted">
                          Showing <span className="fw-semibold ms-1">{users?.length || 0}</span> of <span className="fw-semibold">{totalCount}</span> Results
                        </div>
                      </div>
                      <div className="col-sm-auto">
                        <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                          <li className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber === 1}>Previous</button>
                          </li>
                          {paginationItems.map((page) => (
                            <li key={page} className={`page-item ${pageNumber === page ? "active" : ""}`}>
                              <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                            </li>
                          ))}
                          <li className={`page-item ${pageNumber === (totalPageCount || 1) ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber === (totalPageCount || 1)}>Next</button>
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

    </React.Fragment>
  );
};

export default ListUser;