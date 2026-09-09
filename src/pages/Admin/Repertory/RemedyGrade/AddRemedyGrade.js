import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createRemedyGrade } from "../../../../slices/thunks";
import { setRemedyGradeError, setRemedyGradeSuccess } from "../../../../slices/admin/repertory/remedygrade/reducer";

const AddRemedyGrade = () => {
  const dispatch = useDispatch();

  // Redux state
  const { remedyGradeSuccess, remedyGradeError } = useSelector((state) => state?.RemedyGrade || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      gradeNo: '',
      description: '',
      fontName: '',
      fontStyle: '',
      fontColor: ''
    },
    validationSchema: Yup.object({
      gradeNo: Yup.string().required("Please Enter Grade No"),
      fontName: Yup.string().required("Please Enter Font Name"),
      fontStyle: Yup.string().required("Please Enter Font Style"),
      fontColor: Yup.string().required("Please Enter Font Color")
    }),
    onSubmit: (values) => {
      dispatch(createRemedyGrade({
        gradeId: 0,
        GradeNo: values.gradeNo,
        Description: values.description,
        FontName: values.fontName,
        FontStyle: values.fontStyle,
        FontColor: values.fontColor,
        EnteredBy: 'Admin',
        DeleteStatus: false
      }));
    }
  });

  useEffect(() => {
    if (remedyGradeSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setRemedyGradeSuccess(null));
      }, 2000);
    }
    if (remedyGradeError) {
      setTimeout(() => {
        dispatch(setRemedyGradeError(null));
      }, 2000);
    }
  }, [remedyGradeSuccess, remedyGradeError, dispatch]);

  document.title = "Add Remedy Grade";
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
                      <h5 className="admin-form-title">New Remedy Grade</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(remedyGradeSuccess || remedyGradeError) ? (
                      <div className="admin-form-alerts">
                        {remedyGradeSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {remedyGradeSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {remedyGradeError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {remedyGradeError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="gradeNo" className="form-label">Grade No <span className="required">*</span></Label>
                          <Input
                            name='gradeNo'
                            type="text"
                            value={formik.values.gradeNo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="gradeNo"
                            placeholder="Enter Grade No"
                            invalid={
                              formik.touched.gradeNo && formik.errors.gradeNo ? true : false
                            }
                          />
                          {formik.touched.gradeNo && formik.errors.gradeNo ? (
                            <FormFeedback type="invalid">{formik.errors.gradeNo}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="fontName" className="form-label">Font Name <span className="required">*</span></Label>
                          <Input
                            name='fontName'
                            type="text"
                            value={formik.values.fontName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="fontName"
                            placeholder="Enter Font Name"
                            invalid={
                              formik.touched.fontName && formik.errors.fontName ? true : false
                            }
                          />
                          {formik.touched.fontName && formik.errors.fontName ? (
                            <FormFeedback type="invalid">{formik.errors.fontName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="fontStyle" className="form-label">Font Style <span className="required">*</span></Label>
                          <Input
                            name='fontStyle'
                            type="text"
                            value={formik.values.fontStyle}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="fontStyle"
                            placeholder="Enter Font Style"
                            invalid={
                              formik.touched.fontStyle && formik.errors.fontStyle ? true : false
                            }
                          />
                          {formik.touched.fontStyle && formik.errors.fontStyle ? (
                            <FormFeedback type="invalid">{formik.errors.fontStyle}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="fontColor" className="form-label">Font Color <span className="required">*</span></Label>
                          <Input
                            name='fontColor'
                            type="text"
                            value={formik.values.fontColor}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="fontColor"
                            placeholder="Enter Font Color"
                            invalid={
                              formik.touched.fontColor && formik.errors.fontColor ? true : false
                            }
                          />
                          {formik.touched.fontColor && formik.errors.fontColor ? (
                            <FormFeedback type="invalid">{formik.errors.fontColor}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={8} md={8}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            name='description'
                            type="textarea"
                            rows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="description"
                            placeholder="Enter Description"
                          />
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listremedygrade" className="d-inline-flex">
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

export default AddRemedyGrade;
