import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Col, Container, Row } from "reactstrap";
import { Link } from "react-router-dom";
import { Spinner } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import DeleteModal from "../../../../Components/Common/DeleteModal";
import AdminListPagination from "../../../../Components/Common/AdminListPagination";
import {
  getAnatomyHotspotsList,
  deleteAnatomyHotspot,
} from "../../../../slices/admin/3dbodypart/hotspots/thunk";

const ListHotspots = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [deleteModal, setDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loading = useSelector((state) => state?.AnatomyHotspot?.loading || false);
  const items =
    useSelector((state) => state?.AnatomyHotspot?.anatomyHotspotList?.resultObject) || [];
  const totalPages =
    useSelector((state) => state?.AnatomyHotspot?.anatomyHotspotList?.totalPageCount) || 1;

  const fetchPage = (page) => {
    dispatch(getAnatomyHotspotsList({ PageNumber: page, PageSize: pageSize }));
    setCurrentPage(page);
  };

  useEffect(() => {
    dispatch(getAnatomyHotspotsList({ PageNumber: currentPage, PageSize: pageSize }));
  }, [dispatch]);

  const onClickDelete = (item) => {
    setItemToDelete(item);
    setDeleteModal(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      dispatch(
        deleteAnatomyHotspot({
          ...itemToDelete,
          deleteStatus: true,
          changedBy: userDetails?.userId,
        })
      );
      setDeleteModal(false);
      setItemToDelete(null);
    }
  };

  document.title = "Hotspots";
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
                          />
                          <i className="ri-search-line search-icon" />
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm">
                          <i className="ri-newspaper-line align-middle" /> Import
                        </button>
                        <button type="button" className="btn btn-soft-secondary btn-sm">
                          <i className="ri-file-list-3-line align-middle" /> Export
                        </button>
                        <Link to="/admin/add3dhotspots">
                          <button type="button" className="btn btn-soft-info btn-sm">
                            <i className="ri-add-line align-middle" /> New
                          </button>
                        </Link>
                      </div>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <div className="listjs-table">
                    <div className="table-responsive table-card">
                      <table className="table align-middle table-nowrap">
                        <thead>
                          <tr>
                            <th scope="col" style={{ width: "50px" }}>
                              ID
                            </th>
                            <th>Section Name</th>
                            <th>Hotspots Name</th>
                            <th className="text-center" style={{ width: "10%" }}>
                              Action
                            </th>
                          </tr>
                        </thead>
                        {loading ? (
                          <tbody>
                            <tr>
                              <td colSpan={4} className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {items.length > 0 ? (
                              items.map((row, index) => (
                                <tr key={row.hotspotId ?? row.anatomyHotspotId ?? index}>
                                  <td>{row.hotspotId ?? row.anatomyHotspotId}</td>
                                  <td>{row.sectionName}</td>
                                  <td>{row.hotspotName ?? row.hotspotsName}</td>
                                  <td className="text-center">
                                    <div className="d-inline-flex gap-2">
                                      <Link
                                        to="/admin/edit3dhotspots"
                                        state={{ selectedHotspot: row }}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-success edit-item-btn"
                                        >
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
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
                                <td colSpan={4} className="text-center">
                                  No Hotspots Available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>
                    <AdminListPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      setCurrentPage={setCurrentPage}
                      onPageChange={fetchPage}
                    />
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

export default ListHotspots;
