import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createLanguage } from "../../../../slices/admin/repertory/language/thunk";
import { setLanguageError, setLanguageSuccess } from "../../../../slices/admin/repertory/language/reducer";

const AddLanguage = () => {
  const dispatch = useDispatch();

  // Redux state
  const { languageSuccess, languageError } = useSelector((state) => state?.Language || {});
  console.log(languageSuccess)

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      languageName: '',
      description: ''
    },
    validationSchema: Yup.object({
      languageName: Yup.string().required("Please Enter Language Name"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      dispatch(createLanguage({
        languageId: 0,
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

  document.title = "Add Language";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {languageSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {languageSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {languageError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {languageError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Language</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={3} md={3}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Language Name <span className="required">*</span></Label>
                            <Input
                              name='languageName'
                              type="input"
                              value={formik.values.languageName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
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
                            <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="exampleFormControlTextarea5"
                              rows="1"
                              placeholder="Enter Description"
                              invalid={
                                formik.touched.description && formik.errors.description ? true : false
                              }></textarea>
                            {formik.touched.description && formik.errors.description ?
                              (<FormFeedback type="invalid">{formik.errors.description}</FormFeedback>) : null
                            }
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
                          <Link to="/admin/listlanguage"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit"> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save </Button>
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
    </React.Fragment >
  );
};

export default AddLanguage;