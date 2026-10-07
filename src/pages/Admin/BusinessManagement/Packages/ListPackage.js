import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deletePackage, getPackageList } from "../../../../slices/admin/packages/thunk";
import { setPackageError, setPackageSuccess } from "../../../../slices/admin/packages/reducer";
import DeleteModal from "../../../../Components/Common/DeleteModal";

const ListPackage = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const [deleteModal, setDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [search, setSearch] = useState("");

  const loading = useSelector((state) => state?.Package?.packageLoading || false);
  const packages = useSelector((state) => state?.Package?.packageList || []);
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
    const term = search.trim().toLowerCase();
    if (!term) return packages;
    return packages.filter((item) => {
      const name = (item.packageName || item.PackageName || "").toLowerCase();
      return name.includes(term);
    });
  }, [packages, search]);

  const onClickDelete = (item) => {
    setPackageToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = () => {
    if (!packageToDelete) return;
    dispatch(
      deletePackage({
        ...packageToDelete,
        deleteStatus: true,
        changedBy: userDetails?.userName || userDetails?.userId || "Admin",
      })
    );
    setDeleteModal(false);
    setPackageToDelete(null);
  };

  document.title = "List Packages";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <Row className="g-4 align-items-center">
                    <Col className="col-sm">
                      <div className="search-box">
                        <input
                          type="text"
                          className="form-control form-control-sm search"
                          placeholder="Search package..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <Link to="/admin/addpackage">
                        <button type="button" className="btn btn-soft-info btn-sm">
                          <i className="ri-add-line align-middle"></i> New
                        </button>
                      </Link>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  {success ? <div className="alert alert-success">{success}</div> : null}
                  {error ? <div className="alert alert-danger">{error}</div> : null}
                  <div className="table-responsive table-card">
                    <table className="table align-middle table-nowrap">
                      <thead>
                        <tr>
                          <th style={{ width: "70px" }}>ID</th>
                          <th>Package Name</th>
                          <th>Case Count</th>
                          <th>Validity (Days)</th>
                          <th>Amount</th>
                          <th className="text-center" style={{ width: "10%" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      {loading ? (
                        <tbody>
                          <tr>
                            <td colSpan="6" className="text-center">
                              <Spinner color="primary" />
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
                                  <td>{id}</td>
                                  <td>{item.packageName || item.PackageName || "-"}</td>
                                  <td>{item.caseCount ?? item.CaseCount ?? "-"}</td>
                                  <td>{item.validityInDays ?? item.ValidityInDays ?? "-"}</td>
                                  <td>{item.amount ?? item.Amount ?? "-"}</td>
                                  <td className="text-center">
                                    <div className="d-flex gap-2 justify-content-center">
                                      <Link
                                        to="/admin/editpackage"
                                        state={{ selectedPackage: item }}
                                        className="btn btn-sm btn-soft-info"
                                      >
                                        <i className="ri-pencil-fill"></i>
                                      </Link>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger"
                                        onClick={() => onClickDelete(item)}
                                      >
                                        <i className="ri-delete-bin-5-fill"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center text-muted">
                                No packages found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
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

export default ListPackage;
