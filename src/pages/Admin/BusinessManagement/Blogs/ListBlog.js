import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardBody, CardHeader, Col, Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { getAllBlogDetail, deleteBlogDetail } from '../../../../slices/admin/blog/thunk';
import { setBlogDetailsSuccess, setBlogDetailsError } from '../../../../slices/admin/blog/reducer';
import DeleteModal from '../../../../Components/Common/DeleteModal';
import Swal from 'sweetalert2';

const Starter = () => {
  document.title = "List Blogs";

  const dispatch = useDispatch();
  const { blogList, blogLoading, totalCount, totalPageCount, blogDetailsSuccess, blogDetailsError } = useSelector((state) => state.Blog);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  const fetchBlogs = useCallback(() => {
    const params = {
      PageNumber: currentPage,
      PageSize: pageSize
    };
    dispatch(getAllBlogDetail(params));
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Delete functionality
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

  // Handle success/error messages and refresh list
  useEffect(() => {
    if (blogDetailsSuccess) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: blogDetailsSuccess,
        confirmButtonColor: '#800020',
        timer: 2000,
        showConfirmButton: false
      });
      // Clear success message
      dispatch(setBlogDetailsSuccess(null));
      // Refresh the list
      const params = {
        PageNumber: currentPage,
        PageSize: pageSize
      };
      dispatch(getAllBlogDetail(params));
    }
    if (blogDetailsError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: blogDetailsError,
        confirmButtonColor: '#800020'
      });
      // Clear error message after showing
      setTimeout(() => {
        dispatch(setBlogDetailsError(null));
      }, 2000);
    }
  }, [blogDetailsSuccess, blogDetailsError, dispatch, currentPage, pageSize]);

  const filteredBlogs = useMemo(() => {
    if (!searchQuery) return blogList;
    return blogList.filter(blog => 
      blog.blogHead?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.blogSubHead?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [blogList, searchQuery]);

  const startIndex = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = totalCount > 0 ? Math.min(currentPage * pageSize, totalCount) : 0;

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
                            value={searchQuery}
                            onChange={handleSearch}
                          />
                          <i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                      <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addblog"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
                      </div>
                    </Col>
                  </Row>

                </CardHeader>
                <CardBody>
                  
                    <div className="listjs-table" id="customerList">
                      {blogLoading ? (
                        <div className="text-center py-4">
                          <Spinner color="primary" />
                        </div>
                      ) : (
                        <>
                          <div className="table-responsive table-card">
                              <table className="table align-middle table-nowrap" id="customerTable">
                                  <thead className="">
                                    <tr>
                                      <th scope="col" style={{ width: "50px" }}>ID</th>
                                      <th>Blog Heading</th>
                                      <th>Blog Sub Heading</th>
                                      <th>Blog Date</th>
                                      <th className='text-center' style={{ width : '10%'}}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="list form-check-all">
                                      {filteredBlogs && filteredBlogs.length > 0 ? (
                                        filteredBlogs.map((blog, index) => (
                                          <tr key={blog.blogId || index}>
                                            <td>{blog.blogId}</td>
                                            <td>{blog.blogHead || '-'}</td>
                                            <td>{blog.blogSubHead || '-'}</td>
                                            <td>{blog.blogDate || '-'}</td>
                                            <td className='text-center '>
                                                <div className="d-inline-flex gap-2">
                                                  <div className="edit">
                                                    <Link to={`/admin/editblog/${blog.blogId}`}>
                                                      <button className="btn btn-sm btn-soft-success edit-item-btn">
                                                        <i className="ri-pencil-fill" />
                                                      </button>
                                                    </Link>
                                                  </div>
                                                  <div className="remove">
                                                    <button
                                                      className="btn btn-sm btn-soft-danger remove-item-btn"
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
                                          <td colSpan="5" className="text-center py-4">
                                            No blogs found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                              </table>
                          </div>
                                        
                          <div className="align-items-center g-3 text-center text-sm-start row">
                            <div className="col-sm">
                              <div className="text-muted">
                                Showing <span className="fw-semibold ms-1">{startIndex}</span> to <span className="fw-semibold">{endIndex}</span> of <span className="fw-semibold">{totalCount}</span> Results
                              </div>
                            </div>
                            <div className="col-sm-auto">
                              <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                  >
                                    Previous
                                  </button>
                                </li>
                                {Array.from({ length: totalPageCount }, (_, i) => i + 1).map((page) => (
                                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button 
                                      className="page-link" 
                                      onClick={() => handlePageChange(page)}
                                    >
                                      {page}
                                    </button>
                                  </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPageCount ? 'disabled' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPageCount}
                                  >
                                    Next
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </>
                      )}

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
        onDeleteClick={handleDeleteBlog}
        onCloseClick={() => {
          setDeleteModal(false);
          setBlogToDelete(null);
        }}
      />

    </React.Fragment>
  );
};

export default Starter;