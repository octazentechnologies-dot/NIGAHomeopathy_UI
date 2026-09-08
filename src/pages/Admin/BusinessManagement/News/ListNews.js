import React, { useEffect, useMemo, useState } from 'react';
import { CardHeader, Card, CardBody, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNews, deleteNewsDetails } from '../../../../slices/admin/news/thunk';
import { setNewsDetailsSuccess, setNewsDetailsError } from '../../../../slices/admin/news/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import Swal from 'sweetalert2';

const ListNews = () => {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const newsLoading = useSelector((state) => state?.News?.newsLoading || false);
  const newsList = useSelector((state) => state?.News?.newsList || []);
  const totalRecords = useSelector((state) => state?.News?.totalCount || 0);
  const totalPages = useSelector((state) => state?.News?.totalPageCount || 1);
  const { newsDetailsSuccess, newsDetailsError } = useSelector((state) => state?.News || {});

  const [deleteModal, setDeleteModal] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  useEffect(() => {
    dispatch(getAllNews({
      PageNumber: currentPage,
      PageSize: pageSize,
    }));
  }, [dispatch, currentPage]);

  const filteredNews = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return newsList || [];
    return (newsList || []).filter((news) => {
      const heading = (news.newsHeading || '').toLowerCase();
      const subHeading = (news.newsSubHeading || '').toLowerCase();
      const category = (news.newsCategory || '').toLowerCase();
      return heading.includes(term) || subHeading.includes(term) || category.includes(term);
    });
  }, [newsList, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

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

  useEffect(() => {
    if (newsDetailsSuccess) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: newsDetailsSuccess,
        confirmButtonColor: '#800020',
        timer: 2000,
        showConfirmButton: false,
      });
      dispatch(setNewsDetailsSuccess(null));
      dispatch(getAllNews({
        PageNumber: currentPage,
        PageSize: pageSize,
      }));
    }
    if (newsDetailsError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: newsDetailsError,
        confirmButtonColor: '#800020',
      });
      setTimeout(() => {
        dispatch(setNewsDetailsError(null));
      }, 2000);
    }
  }, [newsDetailsSuccess, newsDetailsError, dispatch, currentPage, pageSize]);

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List News';

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
                      <Link to="/admin/addnews" className="d-inline-flex">
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
                          <th scope="col">News Heading</th>
                          <th scope="col">News Sub Heading</th>
                          <th scope="col">News Category</th>
                          <th scope="col">News Date</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {newsLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="6" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {filteredNews.length > 0 ? (
                            filteredNews.map((news, index) => (
                              <tr key={news.newsId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{news.newsHeading || '—'}</td>
                                <td>{news.newsSubHeading || '—'}</td>
                                <td>{news.newsCategory || '—'}</td>
                                <td>{news.newsDate || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editnews" state={{ newsId: news.newsId || news.id }}>
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
                              <td colSpan="6" className="text-center text-muted py-4">
                                {searchQuery ? 'No news match your search' : 'No News Found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {newsLoading
                        ? 'Loading...'
                        : `Showing ${filteredNews.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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
        onDeleteClick={handleDeleteNews}
        onCloseClick={() => {
          setDeleteModal(false);
          setNewsToDelete(null);
        }}
      />
    </React.Fragment>
  );
};

export default ListNews;
