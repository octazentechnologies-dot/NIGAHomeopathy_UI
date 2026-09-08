import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNewsCategories, getNewsDetailsById, updateNewsDetails } from '../../../../slices/admin/news/thunk';
import { setNewsDetailsError, setNewsDetailsSuccess } from '../../../../slices/admin/news/reducer';

// Import Draft.js components
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

import Select from "react-select";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const EditNews = () => {
  document.title = "Edit News";
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const newsCategoriesList = useSelector((state) => state?.News?.newsCategoriesList || []);
  const newsCategoriesLoading = useSelector((state) => state?.News?.newsCategoriesLoading || false);
  const newsDetailsData = useSelector((state) => {
    const details = state?.News?.newsDetailsList;
    // Handle both array and object responses
    return Array.isArray(details) && details.length > 0 ? details[0] : (details || null);
  });
  const { newsDetailsSuccess, newsDetailsError, newsDetailsLoading } = useSelector((state) => state?.News || {});

  // Get newsId from location state
  const newsId = location.state?.newsId || null;

  // Editor state
  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText('');
    return EditorState.createWithContent(contentState);
  });

  // Image states
  const [newsImage1, setNewsImage1] = useState(null);
  const [newsImage2, setNewsImage2] = useState(null);
  const [newsImage3, setNewsImage3] = useState(null);
  const [newsImage4, setNewsImage4] = useState(null);

  // Flag to track if form has been populated
  const formPopulatedRef = useRef(false);

  // News Category Options - memoized to prevent unnecessary recalculations
  const newsCategoryOptions = useMemo(() => {
    return newsCategoriesList?.map((category) => ({
      label: category.newsCategory1,
      value: String(category.newsCategoryId)
    })) || [];
  }, [newsCategoriesList]);

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
        if (imageNumber === 1) setNewsImage1(base64);
        else if (imageNumber === 2) setNewsImage2(base64);
        else if (imageNumber === 3) setNewsImage3(base64);
        else if (imageNumber === 4) setNewsImage4(base64);
      } catch (error) {
        console.error('Error converting image to base64:', error);
      }
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      newsHeading: '',
      newsSubHeading: '',
      newsCategory: null,
      newsDate: '',
      newsContent: ''
    },
    validationSchema: Yup.object({
      newsHeading: Yup.string().required("Please enter News Heading"),
      newsSubHeading: Yup.string().required("Please enter News Sub Heading"),
      newsCategory: Yup.object().shape({
        value: Yup.string().required("Please Select News Category"),
      }).nullable().required("Please Select News Category"),
      newsDate: Yup.string().required("Please select News Date"),
    }),
    onSubmit: async (values) => {
      try {
        const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));

        const requestData = {
          newsId: newsId,
          newsDate: new Date(values.newsDate).toISOString(),
          newsCategoryId: values.newsCategory.value,
          NewsHeading: values.newsHeading,
          NewsSubHeading: values.newsSubHeading,
          NewsContent: htmlContent,
          enteredBy: userDetails?.userId || userDetails?.user?.userId || null,
          enteredDate: newsDetailsData?.enteredDate || new Date().toISOString(),
          changedBy: userDetails?.userId || userDetails?.user?.userId || null,
          changedDate: new Date().toISOString(),
          isActive: newsDetailsData?.isActive !== undefined ? newsDetailsData.isActive : true,
          newsCategory1: "",
          newsImage1: newsImage1 || newsDetailsData?.newsImage1 || "",
          newsImage2: newsImage2 || newsDetailsData?.newsImage2 || "",
          newsImage3: newsImage3 || newsDetailsData?.newsImage3 || "",
          newsImage4: newsImage4 || newsDetailsData?.newsImage4 || ""
        };

        await dispatch(updateNewsDetails(requestData));
      } catch (error) {
        console.error('Error updating news:', error);
      }
    }
  });

  // Load news categories and news details on mount
  useEffect(() => {
    dispatch(getAllNewsCategories({}));
    if (newsId) {
      dispatch(getNewsDetailsById({ newsId: newsId }));
    } else {
      // If no newsId, redirect back to list
      navigate('/admin/listnews');
    }
  }, [dispatch, newsId, navigate]);

  // Populate form when news details are loaded (only once)
  useEffect(() => {
    if (newsDetailsData && newsCategoryOptions.length > 0 && !formPopulatedRef.current) {
      formPopulatedRef.current = true; // Mark as populated

      // Set form values
      formik.setFieldValue('newsHeading', newsDetailsData.newsHeading || newsDetailsData.NewsHeading || '');
      formik.setFieldValue('newsSubHeading', newsDetailsData.newsSubHeading || newsDetailsData.NewsSubHeading || '');

      // Format date for input
      if (newsDetailsData.newsDate) {
        const date = new Date(newsDetailsData.newsDate);
        const formattedDate = date.toISOString().split('T')[0];
        formik.setFieldValue('newsDate', formattedDate);
      }

      // Set category dropdown
      if (newsDetailsData.newsCategoryId) {
        const selectedCategory = newsCategoryOptions.find(
          cat => cat.value === String(newsDetailsData.newsCategoryId)
        );
        if (selectedCategory) {
          formik.setFieldValue('newsCategory', selectedCategory);
        }
      }

      // Set editor content from HTML
      const newsContent = newsDetailsData.newsContent || newsDetailsData.NewsContent || '';
      if (newsContent) {
        try {
          const blocksFromHTML = htmlToDraft(newsContent);
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
      if (newsDetailsData.newsImage1) setNewsImage1(newsDetailsData.newsImage1);
      if (newsDetailsData.newsImage2) setNewsImage2(newsDetailsData.newsImage2);
      if (newsDetailsData.newsImage3) setNewsImage3(newsDetailsData.newsImage3);
      if (newsDetailsData.newsImage4) setNewsImage4(newsDetailsData.newsImage4);
    }
  }, [newsDetailsData, newsCategoryOptions.length]); // Only depend on length, not the array itself

  // Handle success/error messages
  useEffect(() => {
    if (newsDetailsSuccess) {
      setTimeout(() => {
        dispatch(setNewsDetailsSuccess(null));
        navigate('/admin/listnews');
      }, 2000);
    }
    if (newsDetailsError) {
      setTimeout(() => {
        dispatch(setNewsDetailsError(null));
      }, 2000);
    }
  }, [newsDetailsSuccess, newsDetailsError, dispatch, navigate]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form onSubmit={formik.handleSubmit}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit News</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(newsDetailsSuccess || newsDetailsError) ? (
                      <div className="admin-form-alerts">
                        {newsDetailsSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {newsDetailsSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {newsDetailsError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {newsDetailsError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsHeading" className="form-label">News Heading</Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="newsHeading"
                            name="newsHeading"
                            placeholder="Enter News Heading"
                            value={formik.values.newsHeading}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.newsHeading && formik.errors.newsHeading ? true : false}
                          />
                          {formik.touched.newsHeading && formik.errors.newsHeading ? (
                            <FormFeedback type="invalid">{formik.errors.newsHeading}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsSubHeading" className="form-label">News SubHeading</Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="newsSubHeading"
                            name="newsSubHeading"
                            placeholder="Enter News Sub Heading"
                            value={formik.values.newsSubHeading}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.newsSubHeading && formik.errors.newsSubHeading ? true : false}
                          />
                          {formik.touched.newsSubHeading && formik.errors.newsSubHeading ? (
                            <FormFeedback type="invalid">{formik.errors.newsSubHeading}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsCategory" className="form-label">News Category</Label>
                          <Select
                            name="newsCategory"
                            value={formik.values.newsCategory}
                            onChange={(selectedOption) => {
                              formik.setFieldValue("newsCategory", selectedOption);
                            }}
                            options={newsCategoryOptions}
                            isLoading={newsCategoriesLoading}
                            onBlur={() => formik.setFieldTouched("newsCategory", true)}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.newsCategory && formik.errors.newsCategory),
                            })}
                            className={formik.touched.newsCategory && formik.errors.newsCategory ? "is-invalid" : ""}
                          />
                          {formik.touched.newsCategory && formik.errors.newsCategory ? (
                            <FormFeedback type="invalid" style={{ display: 'block' }}>{formik.errors.newsCategory}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsDate" className="form-label">News Date</Label>
                          <Input
                            type="date"
                            className="form-control"
                            id="newsDate"
                            name="newsDate"
                            value={formik.values.newsDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.newsDate && formik.errors.newsDate ? true : false}
                          />
                          {formik.touched.newsDate && formik.errors.newsDate ? (
                            <FormFeedback type="invalid">{formik.errors.newsDate}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsImage1" className="form-label">Upload Image 1</Label>
                          <Input
                            type="file"
                            className="form-control"
                            id="newsImage1"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 1)}
                          />
                          {newsImage1 && (
                            <div className="mt-2">
                              <img src={newsImage1} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsImage2" className="form-label">Upload Image 2</Label>
                          <Input
                            type="file"
                            className="form-control"
                            id="newsImage2"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 2)}
                          />
                          {newsImage2 && (
                            <div className="mt-2">
                              <img src={newsImage2} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsImage3" className="form-label">Upload Image 3</Label>
                          <Input
                            type="file"
                            className="form-control"
                            id="newsImage3"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 3)}
                          />
                          {newsImage3 && (
                            <div className="mt-2">
                              <img src={newsImage3} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="newsImage4" className="form-label">Upload Image 4</Label>
                          <Input
                            type="file"
                            className="form-control"
                            id="newsImage4"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 4)}
                          />
                          {newsImage4 && (
                            <div className="mt-2">
                              <img src={newsImage4} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                          )}
                        </div>
                      </Col>

                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="newsContent" className="form-label">News Details</Label>
                          <div>
                            <Editor
                              wrapperClassName="demo-wrapper"
                              editorClassName="demo-editor"
                              onEditorStateChange={(newEditorState) => {
                                setEditorState(newEditorState);
                                formik.setFieldValue('newsContent', draftToHtml(convertToRaw(newEditorState.getCurrentContent())));
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
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listnews" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-sm admin-list-btn admin-list-btn--new"
                          disabled={newsDetailsLoading}
                        >
                          {newsDetailsLoading ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Updating...
                            </>
                          ) : (
                            <>
                              <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                              Update
                            </>
                          )}
                        </button>
                      </div>
                    </div>
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

export default EditNews;
