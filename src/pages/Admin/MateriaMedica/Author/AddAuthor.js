import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createAuthor } from '../../../../slices/admin/materiaMedica/author/thunk';
import { setAuthorError, setAuthorSuccess } from '../../../../slices/admin/materiaMedica/author/reducer';

const AddAuthor = (props) => {
  const dispatch = useDispatch();

  // Redux state
  const { authorSuccess, authorError } = useSelector((state) => state?.Author);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      authorName: '',
      authorAlias: '',
      isForRepertory: false,
      description: ''
    },
    validationSchema: Yup.object({
      authorName: Yup.string().required("Please Enter Author Name"),
      authorAlias: Yup.string().required("Please Enter Author Alias"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      dispatch(createAuthor({
        "authorId": 0,
        "authorName": values.authorName,
        "authorAlias": values.authorAlias,
        "isForRepertory": values.isForRepertory,
        "description": values.description,
        "enteredBy": "Admin",
        "isDeleted": false
      }));
    }
  });

  useEffect(() => {
    if (authorSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setAuthorSuccess(null));
      }, 2000);
      if (authorError) {
        setTimeout(() => {
          dispatch(setAuthorError(null));
        }, 2000);
      }
    }
  }, [authorSuccess, authorError]);


  document.title = "Add Author";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New Author</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(authorSuccess || authorError) ? (
                      <div className="admin-form-alerts">
                        {authorSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {authorSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {authorError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {authorError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Author Name</Label>
                          <Input
                            name='authorName'
                            type="input"
                            value={formik.values.authorName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="placeholderInput"
                            placeholder="Enter Author Name"
                            invalid={
                              formik.touched.authorName && formik.errors.authorName ? true : false
                            } />
                          {formik.touched.authorName && formik.errors.authorName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.authorName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Author Alias</Label>
                          <Input
                            name='authorAlias'
                            type="input"
                            value={formik.values.authorAlias || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="placeholderInput"
                            placeholder="Enter Author Alias"
                            invalid={
                              formik.touched.authorAlias && formik.errors.authorAlias ? true : false
                            } />
                          {formik.touched.authorAlias && formik.errors.authorAlias ? (
                            <FormFeedback type="invalid"><div>{formik.errors.authorAlias}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Is For Repertory ?</Label>
                          <div className="form-check form-switch form-switch-lg mt-1" dir="ltr">
                            <Input
                              name='isForRepertory'
                              type="checkbox"
                              checked={!!formik.values.isForRepertory}
                              onChange={(e) => formik.setFieldValue('isForRepertory', e.target.checked)}
                              onBlur={formik.handleBlur}
                              className="form-check-input"
                              id="customSwitchsizelg"
                              invalid={formik.touched.isForRepertory && !!formik.errors.isForRepertory} />
                            {formik.touched.isForRepertory && formik.errors.isForRepertory && (
                              <FormFeedback>{formik.errors.isForRepertory}</FormFeedback>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                          <textarea
                            name='description'
                            value={formik.values.description || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="exampleFormControlTextarea5"
                            rows="1"
                            placeholder="Enter Description"
                            invalid={
                              formik.touched.description && formik.errors.description ? true : false
                            }></textarea>
                          {formik.touched.description && formik.errors.description && (
                            <FormFeedback>{formik.errors.description}</FormFeedback>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listauthor" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          Save
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

export default AddAuthor;
