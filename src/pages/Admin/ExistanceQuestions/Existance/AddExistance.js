import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Button, Form, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { createQuestionSection } from "../../../../slices/admin/existance/thunk";
import { setExistanceError, setExistanceSuccess } from '../../../../slices/admin/existance/reducer';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const AddExistance = () => {
  const dispatch = useDispatch();


  // Redux state
  const { existanceSuccess, existanceError } = useSelector((state) => state?.Existance);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      questionSectionName: '',
      description: '',
    },
    validationSchema: Yup.object({
      questionSectionName: Yup.string().required("Please Enter Question Section Name"),
      description: Yup.string().required("Please Enter Description"),
    }),
    onSubmit: (values) => {
      dispatch(createQuestionSection({
        "questionSectionId": 0,
        "questionSectionName": values.questionSectionName,
        "description": values.description,
        "enteredBy": "Admin",
        "deleteStatus": false
      }));
    }
  });

  useEffect(() => {
    if (existanceSuccess) {
      formik.resetForm({
        values: {
          questionSectionName: '',
          description: ''
        }
      });
      setTimeout(() => {
        dispatch(setExistanceSuccess(null));
      }, 3000);
    }
    if (existanceError) {
      setTimeout(() => {
        dispatch(setExistanceError(null));
      }, 3000);
    }
  }, [existanceSuccess, existanceError, dispatch, formik]);

  document.title = "Add Question Section";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                {/* <div className="p-2">
                  {existanceSuccess && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert" style={{ backgroundColor: '#00d084', color: 'white', border: 'none' }}>
                      <i className="ri-checkbox-circle-line me-2"></i>
                      {existanceSuccess}
                      <button type="button" className="btn-close" onClick={() => dispatch(setExistanceSuccess(null))}></button>
                    </div>
                  )}
                  {existanceError && (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0">
                      <i className="ri-error-warning-line label-icon"></i>
                      {existanceError}
                    </UncontrolledAlert>
                  )}
                </div> */}
                <div className="p-2">
                  {existanceSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {existanceSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {existanceError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {existanceError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Question Section</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="questionSectionName" className="form-label">Question Section Name</Label>
                            <Input
                              name='questionSectionName'
                              type="text"
                              value={formik.values.questionSectionName || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="questionSectionName"
                              placeholder="Enter Question Section Name"
                              invalid={
                                formik.touched.questionSectionName && formik.errors.questionSectionName ? true : false
                              } />
                            {formik.touched.questionSectionName && formik.errors.questionSectionName ? (
                              <FormFeedback type="invalid"><div>{formik.errors.questionSectionName}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="description" className="form-label">Description</Label>
                            <Input
                              name='description'
                              type="text"
                              value={formik.values.description || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="description"
                              placeholder="Enter Description"
                              invalid={
                                formik.touched.description && formik.errors.description ? true : false
                              } />
                            {formik.touched.description && formik.errors.description ? (
                              <FormFeedback type="invalid"><div>{formik.errors.description}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </CardBody>

                  <CardFooter className="gap-2">
                    <Row className="g-4">
                      <Col className="col-sm">
                        <div className="d-flex justify-content-sm-start">
                        </div>
                      </Col>
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <Link to="/admin/listexistance">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
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

export default AddExistance;