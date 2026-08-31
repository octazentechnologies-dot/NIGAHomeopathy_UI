import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, Button, UncontrolledAlert } from 'reactstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getBlogDetailById, saveBlogDetail } from '../../../../slices/admin/blog/thunk';
import { setBlogDetailsError, setBlogDetailsSuccess } from '../../../../slices/admin/blog/reducer';

// Import Draft.js components
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const EditBlog = () => {
  document.title = "Edit Blog";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const selectedBlog = useSelector((state) => state?.Blog?.selectedBlog || null);
  const selectedBlogLoading = useSelector((state) => state?.Blog?.selectedBlogLoading || false);
  const { blogDetailsSuccess, blogDetailsError, blogDetailsLoading } = useSelector((state) => state?.Blog || {});

  // Create an empty editor state
  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText('');
    return EditorState.createWithContent(contentState);
  });

  // Image states
  const [blogImage1, setBlogImage1] = useState(null);
  const [blogImage2, setBlogImage2] = useState(null);

  // Flag to track if form has been populated
  const formPopulatedRef = useRef(false);

  // Convert image to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image change
  const handleImageChange = async (e, imageNumber) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await convertImageToBase64(file);
        if (imageNumber === 1) setBlogImage1(base64);
        else if (imageNumber === 2) setBlogImage2(base64);
      } catch (error) {
        console.error('Error converting image to base64:', error);
      }
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      blogHead: '',
      blogSubHead: '',
      blogDate: '',
      blogDetails1: ''
    },
    validationSchema: Yup.object({
      blogHead: Yup.string().required("Please enter Blog Heading"),
      blogSubHead: Yup.string().required("Please enter Blog Sub Heading"),
      blogDate: Yup.string().required("Please select Blog Date"),
    }),
    onSubmit: async (values) => {
      try {
        const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

        const requestData = {
          blogId: parseInt(id),
          blogHead: values.blogHead,
          blogSubHead: values.blogSubHead,
          blogImage1: blogImage1 || selectedBlog?.blogImage1 || "",
          blogImage2: blogImage2 || selectedBlog?.blogImage2 || "",
          blogDetails1: htmlContent,
          isActive: selectedBlog?.isActive !== undefined ? selectedBlog.isActive : true,
          enteredBy: selectedBlog?.enteredBy || userDetails?.userId || userDetails?.user?.userId || null,
          BlogDate: new Date(values.blogDate).toISOString()
        };

        await dispatch(saveBlogDetail(requestData));
      } catch (error) {
        console.error('Error updating blog:', error);
      }
    }
  });

  // Load blog details on mount
  useEffect(() => {
    if (id) {
      dispatch(getBlogDetailById(id));
    } else {
      // If no id, redirect back to list
      navigate('/admin/listblog');
    }
  }, [dispatch, id, navigate]);

  // Populate form when blog details are loaded (only once)
  useEffect(() => {
    if (selectedBlog && !formPopulatedRef.current) {
      formPopulatedRef.current = true; // Mark as populated

      // Set form values
      formik.setFieldValue('blogHead', selectedBlog.blogHead || '');
      formik.setFieldValue('blogSubHead', selectedBlog.blogSubHead || '');

      // Format date for input
      if (selectedBlog.blogDate) {
        const date = new Date(selectedBlog.blogDate);
        const formattedDate = date.toISOString().split('T')[0];
        formik.setFieldValue('blogDate', formattedDate);
      }

      // Set editor content from HTML
      const blogContent = selectedBlog.blogDetails1 || '';
      if (blogContent) {
        try {
          const blocksFromHTML = htmlToDraft(blogContent);
          if (blocksFromHTML && blocksFromHTML.contentBlocks && blocksFromHTML.contentBlocks.length > 0) {
            const contentState = ContentState.createFromBlockArray(
              blocksFromHTML.contentBlocks,
              blocksFromHTML.entityMap
            );
            const editorState = EditorState.createWithContent(contentState);
            setEditorState(editorState);
          }
        } catch (error) {
          console.error('Error converting HTML to editor state:', error);
        }
      }

      // Set images if they exist
      if (selectedBlog.blogImage1) setBlogImage1(selectedBlog.blogImage1);
      if (selectedBlog.blogImage2) setBlogImage2(selectedBlog.blogImage2);
    }
  }, [selectedBlog, formik]);

  // Handle success/error messages
  useEffect(() => {
    if (blogDetailsSuccess) {
      const timer = setTimeout(() => {
        dispatch(setBlogDetailsSuccess(null));
        navigate('/admin/listblog');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (blogDetailsError) {
      const timer = setTimeout(() => {
        dispatch(setBlogDetailsError(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [blogDetailsSuccess, blogDetailsError, dispatch, navigate]);

  if (selectedBlogLoading) {
    return (
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading blog details...</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {blogDetailsSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {blogDetailsSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {blogDetailsError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {blogDetailsError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">Edit Blog</h4>
                </CardHeader>
                <Form onSubmit={formik.handleSubmit}>
                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="blogHead" className="form-label">Blog Heading</Label>
                            <Input
                              type="text"
                              className="form-control"
                              id="blogHead"
                              name="blogHead"
                              placeholder="Enter Blog Heading"
                              value={formik.values.blogHead}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.blogHead && formik.errors.blogHead ? true : false}
                            />
                            {formik.touched.blogHead && formik.errors.blogHead ? (
                              <FormFeedback type="invalid">{formik.errors.blogHead}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="blogSubHead" className="form-label">Blog SubHeading</Label>
                            <Input
                              type="text"
                              className="form-control"
                              id="blogSubHead"
                              name="blogSubHead"
                              placeholder="Enter Blog Sub Heading"
                              value={formik.values.blogSubHead}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.blogSubHead && formik.errors.blogSubHead ? true : false}
                            />
                            {formik.touched.blogSubHead && formik.errors.blogSubHead ? (
                              <FormFeedback type="invalid">{formik.errors.blogSubHead}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="blogDate" className="form-label">Blog Date</Label>
                            <Input
                              type="date"
                              className="form-control"
                              id="blogDate"
                              name="blogDate"
                              value={formik.values.blogDate}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.blogDate && formik.errors.blogDate ? true : false}
                            />
                            {formik.touched.blogDate && formik.errors.blogDate ? (
                              <FormFeedback type="invalid">{formik.errors.blogDate}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-3">
                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="blogImage1" className="form-label">Upload Image 1</Label>
                            <Input
                              type="file"
                              className="form-control"
                              id="blogImage1"
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, 1)}
                            />
                            {blogImage1 && (
                              <div className="mt-2">
                                <img src={blogImage1} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                              </div>
                            )}
                          </div>
                        </Col>
                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="blogImage2" className="form-label">Upload Image 2</Label>
                            <Input
                              type="file"
                              className="form-control"
                              id="blogImage2"
                              accept="image/*"
                              onChange={(e) => handleImageChange(e, 2)}
                            />
                            {blogImage2 && (
                              <div className="mt-2">
                                <img src={blogImage2} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="blogDetails1" className="form-label">Blog Details</Label>
                            <div>
                              <Editor
                                wrapperClassName="demo-wrapper"
                                editorClassName="demo-editor"
                                onEditorStateChange={(newEditorState) => {
                                  setEditorState(newEditorState);
                                  formik.setFieldValue('blogDetails1', draftToHtml(convertToRaw(newEditorState.getCurrentContent())));
                                }}
                                toolbarClassName="toolbar-class"
                                editorState={editorState}
                                wrapperStyle={{
                                  borderRadius: 5,
                                  borderWidth: 1,
                                  borderColor: '#0000'
                                }}
                                editorStyle={{
                                  borderRadius: 2,
                                  border: '1px solid lightgrey',
                                  backgroundColor: '#FFFFFF',
                                  height: '300px'
                                }}
                              />
                            </div>
                          </div>
                        </Col>
                      </Row>

                    </div>
                  </CardBody>

                  <CardFooter className=" gap-2">
                    <Row className="g-4">
                      <Col className="col-sm">
                        <div className="d-flex justify-content-sm-start">
                        </div>
                      </Col>
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <Link to="/admin/listblog">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button
                            color="success"
                            className="btn-label"
                            type="submit"
                            disabled={blogDetailsLoading}
                          >
                            {blogDetailsLoading ? (
                              <>
                                <Spinner size="sm" className="me-2" /> Updating...
                              </>
                            ) : (
                              <>
                                <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update
                              </>
                            )}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </CardFooter>
                </Form>

              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default EditBlog;
