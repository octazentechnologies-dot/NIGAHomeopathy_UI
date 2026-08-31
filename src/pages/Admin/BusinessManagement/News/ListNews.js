import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { CardHeader, CardFooter, Alert, Button, Card, CardBody, Col, Container, Input, Modal, ModalBody, ModalHeader, PopoverBody, PopoverHeader, Row, UncontrolledPopover, UncontrolledTooltip, Label } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNews, deleteNewsDetails } from '../../../../slices/admin/news/thunk';
import { setNewsDetailsSuccess, setNewsDetailsError } from '../../../../slices/admin/news/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import Swal from 'sweetalert2';

import Select from "react-select";
import makeAnimated from "react-select/animated";
//import { DefaultModalExample, CenteredModalExample, GridsModalExample, StaticBackdropModalExample, TogglebetweenExample, TooltipModalExample, ScrollableModalExample, VaryingModalExample, OptionalModalExample, FullscreenResponsiveExample, AnimationModalExample, PositionModalExample } from './UiModalCode';

const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const ListNews = () => {
  document.title = "List News";
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const newsLoading = useSelector((state) => state?.News?.newsLoading || false);
  const newsList = useSelector((state) => state?.News?.newsList || []);
  const totalCount = useSelector((state) => state?.News?.totalCount || 0);
  const totalPageCount = useSelector((state) => state?.News?.totalPageCount || 0);
  const { newsDetailsSuccess, newsDetailsError, newsDetailsLoading } = useSelector((state) => state?.News || {});

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  useEffect(() => {
    dispatch(
      getAllNews({
        PageNumber: pageNumber,
        PageSize: pageSize
      })
    );
  }, [dispatch, pageNumber]);

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

  const [modal_standard, setmodal_standard] = useState(false);
  function tog_standard() {
    setmodal_standard(!modal_standard);
  }

  const [selectedSingle, setSelectedSingle] = useState(null);
  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  // Delete functionality
  const onClickDelete = (news) => {
    setNewsToDelete(news);
    setDeleteModal(true);
  };

  const handleDeleteNews = () => {
    if (newsToDelete) {
      dispatch(deleteNewsDetails({ newsId: newsToDelete.newsId }));
      setDeleteModal(false);
      setNewsToDelete(null);
    }
  };

  // Handle success/error messages and refresh list
  useEffect(() => {
    if (newsDetailsSuccess) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: newsDetailsSuccess,
        confirmButtonColor: '#800020',
        timer: 2000,
        showConfirmButton: false
      });
      // Clear success message
      dispatch(setNewsDetailsSuccess(null));
      // Refresh the list
      dispatch(
        getAllNews({
          PageNumber: pageNumber,
          PageSize: pageSize
        })
      );
    }
    if (newsDetailsError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: newsDetailsError,
        confirmButtonColor: '#800020'
      });
      // Clear error message after showing
      setTimeout(() => {
        dispatch(setNewsDetailsError(null));
      }, 2000);
    }
  }, [newsDetailsSuccess, newsDetailsError, dispatch, pageNumber, pageSize]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}

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
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addnews"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>News Heading</th>
                            <th>News Sub Heading</th>
                            <th>News Category</th>
                            <th>News Date</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {newsLoading ? (
                          <tbody>
                            <tr>
                              <td colSpan="6" className="text-center">
                                <Spinner color="primary" />
                              </td>
                            </tr>
                          </tbody>
                        ) : (
                          <tbody className="list form-check-all">
                            {newsList?.length > 0 ? (
                              newsList.map((news) => (
                                <tr key={news.newsId}>
                                  <td>{news.newsId || "-"}</td>
                                  <td>{news.newsHeading || "-"}</td>
                                  <td>{news.newsSubHeading || "-"}</td>
                                  <td>{news.newsCategory || "-"}</td>
                                  <td>{news.newsDate || "-"}</td>
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editnews" state={{ newsId: news.newsId || news.id }}>
                                          <button className="btn btn-sm btn-soft-success edit-item-btn">
                                            <i className="ri-pencil-fill" />
                                          </button>
                                        </Link>
                                      </div>
                                      <div className="remove">
                                        <button
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
                                          onClick={() => onClickDelete(news)}
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
                                <td colSpan="6" className="text-center">No News Found</td>
                              </tr>
                            )}
                          </tbody>
                        )}
                      </table>
                    </div>

                    <div className="align-items-center g-3 text-center text-sm-start row">
                      <div className="col-sm">
                        <div className="text-muted">
                          Showing <span className="fw-semibold ms-1">{newsList?.length || 0}</span> of <span className="fw-semibold">{totalCount}</span> Results
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


      {/* Delete Modal */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteNews}
        onCloseClick={() => {
          setDeleteModal(false);
          setNewsToDelete(null);
        }}
      />

      {/* Modal */}
      <Modal id="myModal" isOpen={modal_standard} toggle={() => { tog_standard(); }} >
        <ModalHeader className="modal-title" id="myModalLabel" toggle={() => { tog_standard(); }}>
          Therapeutics Details
        </ModalHeader>
        <ModalBody>
          <h5 className="fs-15">
            Overflowing text to show scroll behavior
          </h5>
        </ModalBody>
        <div className="modal-footer">
          <Button color="primary" onClick={() => { tog_standard(); }} >Close </Button>
        </div>
      </Modal>
      {/* Modal */}

    </React.Fragment>
  );
};

export default ListNews;