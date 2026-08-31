import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteQualification, getQualificationList } from "../../../../slices/admin/qualifications/thunk";
import { setQualificationError, setQualificationSuccess } from "../../../../slices/admin/qualifications/reducer";
import DeleteModal from "../../../../Components/Common/DeleteModal";

const ListQualification = () => {
  const dispatch = useDispatch();
  const [deleteModal, setDeleteModal] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState(null);
  const [search, setSearch] = useState("");

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
    const term = search.trim().toLowerCase();
    if (!term) return qualifications;
    return qualifications.filter((item) => {
      const name = (item.qualificationName || item.QualificationName || "").toLowerCase();
      const alias = (item.qualificationAlias || item.QualificationAlias || "").toLowerCase();
      const degree = (item.degreeLevel || item.DegreeLevel || "").toLowerCase();
      return name.includes(term) || alias.includes(term) || degree.includes(term);
    });
  }, [qualifications, search]);

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

  document.title = "List Qualifications";

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
                          placeholder="Search qualification..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <i className="ri-search-line search-icon"></i>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <Link to="/admin/addqualification">
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
                          <th>Qualification Name</th>
                          <th>Alias</th>
                          <th>Degree Level</th>
                          <th>Description</th>
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
                            filteredList.map((item) => {
                              const id = item.qualificationId ?? item.QualificationId;
                              return (
                                <tr key={id}>
                                  <td>{id}</td>
                                  <td>{item.qualificationName ?? item.QualificationName}</td>
                                  <td>{(item.qualificationAlias ?? item.QualificationAlias) || "-"}</td>
                                  <td>{(item.degreeLevel ?? item.DegreeLevel) || "-"}</td>
                                  <td>{(item.description ?? item.Description) || "-"}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <Link to="/admin/editqualification" state={{ selectedQualification: item }}>
                                        <button className="btn btn-sm btn-soft-success edit-item-btn" type="button">
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                      <button
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        type="button"
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
                              <td colSpan="6" className="text-center">
                                No Qualifications Available
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
      <DeleteModal show={deleteModal} onDeleteClick={handleDelete} onCloseClick={() => setDeleteModal(false)} />
    </React.Fragment>
  );
};

export default ListQualification;
