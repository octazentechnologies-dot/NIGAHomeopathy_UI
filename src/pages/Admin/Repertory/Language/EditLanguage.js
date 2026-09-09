import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateLanguage } from "../../../../slices/admin/repertory/language/thunk";
import { setLanguageError, setLanguageSuccess } from "../../../../slices/admin/repertory/language/reducer";

const EditLanguage = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { languageSuccess, languageError } = useSelector((state) => state?.Language || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      languageName: location.state.selectedLanguage.languageName,
      description: location.state.selectedLanguage.description
    },
    validationSchema: Yup.object({
      languageName: Yup.string().required("Please Enter Language Name"),
      // description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      debugger
      dispatch(updateLanguage({
        languageId: location.state.selectedLanguage.languageId,
        languageName: values.languageName,
        description: values.description,
        isDeleted: false
      }));
    }
  });

  useEffect(() => {
    if (languageSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setLanguageSuccess(null));
      }, 2000);
      if (languageError) {
        setTimeout(() => {
          dispatch(setLanguageError(null));
        }, 2000);
      }
    }
  }, [languageSuccess, languageError]);

  document.title = "Edit Language";
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
                      <h5 className="admin-form-title">Edit Language</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(languageSuccess || languageError) ? (
                      <div className="admin-form-alerts">
                        {languageSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {languageSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {languageError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {languageError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="languageName" className="form-label">Language Name <span className="required">*</span></Label>
                          <Input
                            name='languageName'
                            type="text"
                            value={formik.values.languageName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="languageName"
                            placeholder="Enter Language Name"
                            invalid={
                              formik.touched.languageName && formik.errors.languageName ? true : false
                            } />
                          {formik.touched.languageName && formik.errors.languageName ?
                            (<FormFeedback type="invalid">{formik.errors.languageName}</FormFeedback>) : null
                          }
                        </div>
                      </Col>
                      <Col xxl={9} md={9}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            name='description'
                            type="textarea"
                            rows={1}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="description"
                            placeholder="Enter Description"
                          />
                          {formik.touched.description && formik.errors.description ?
                            (<FormFeedback type="invalid">{formik.errors.description}</FormFeedback>) : null
                          }
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listlanguage" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          Update
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

export default EditLanguage;
