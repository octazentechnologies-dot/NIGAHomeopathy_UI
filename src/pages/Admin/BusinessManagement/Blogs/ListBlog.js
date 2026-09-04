import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardBody, CardHeader, Col, Container, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { getAllBlogDetail, deleteBlogDetail } from '../../../../slices/admin/blog/thunk';
import { setBlogDetailsSuccess, setBlogDetailsError } from '../../../../slices/admin/blog/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import Swal from 'sweetalert2';

const ListBlog = () => {
  const dispatch = useDispatch();
  const { blogList, blogLoading, totalCount, totalPageCount, blogDetailsSuccess, blogDetailsError } = useSelector((state) => state.Blog);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const [deleteModal, setDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  const totalPages = totalPageCount || 1;
  const totalRecords = totalCount || 0;

  const fetchBlogs = useCallback(() => {
    dispatch(getAllBlogDetail({
      PageNumber: currentPage,
      PageSize: pageSize,
    }));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const onClickDelete = (blog) => {
    setBlogToDelete(blog);
    setDeleteModal(true);
  };

  const handleDeleteBlog = () => {
    if (blogToDelete) {
      dispatch(deleteBlogDetail({ blogId: blogToDelete.blogId }));
      setDeleteModal(false);
      setBlogToDelete(null);
    }
  };

  useEffect(() => {
    if (blogDetailsSuccess) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: blogDetailsSuccess,
        confirmButtonColor: '#800020',
        timer: 2000,
        showConfirmButton: false,
      });
      dispatch(setBlogDetailsSuccess(null));
      dispatch(getAllBlogDetail({
        PageNumber: currentPage,
        PageSize: pageSize,
      }));
    }
    if (blogDetailsError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: blogDetailsError,
        confirmButtonColor: '#800020',
      });
      setTimeout(() => {
        dispatch(setBlogDetailsError(null));
      }, 2000);
    }
  }, [blogDetailsSuccess, blogDetailsError, dispatch, currentPage, pageSize]);

  const filteredBlogs = useMemo(() => {
    if (!searchQuery) return blogList || [];
    const term = searchQuery.toLowerCase();
    return (blogList || []).filter((blog) =>
      blog.blogHead?.toLowerCase().includes(term) ||
      blog.blogSubHead?.toLowerCase().includes(term)
    );
  }, [blogList, searchQuery]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Blogs';

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
                      <Link to="/admin/addblog" className="d-inline-flex">
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
                          <th scope="col">Blog Heading</th>
                          <th scope="col">Blog Sub Heading</th>
                          <th scope="col">Blog Date</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {blogLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {filteredBlogs.length > 0 ? (
                            filteredBlogs.map((blog, index) => (
                              <tr key={blog.blogId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{blog.blogHead || '—'}</td>
                                <td>{blog.blogSubHead || '—'}</td>
                                <td>{blog.blogDate || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to={`/admin/editblog/${blog.blogId}`}>
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
                                        onClick={() => onClickDelete(blog)}
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
                              <td colSpan="5" className="text-center text-muted py-4">
                                {searchQuery ? 'No blogs match your search' : 'No blogs found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {blogLoading
                        ? 'Loading...'
                        : `Showing ${filteredBlogs.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
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
        onDeleteClick={handleDeleteBlog}
        onCloseClick={() => {
          setDeleteModal(false);
          setBlogToDelete(null);
        }}
      />
    </React.Fragment>
  );
};

export default ListBlog;
