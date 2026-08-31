import React, { useEffect } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row, Button } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateRemedyGrade } from "../../../../slices/thunks";
import { setRemedyGradeError, setRemedyGradeSuccess } from "../../../../slices/admin/repertory/remedygrade/reducer";

const EditRemedyGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { remedyGradeSuccess, remedyGradeError } = useSelector((state) => state?.RemedyGrade || {});

  const selectedRemedyGrade = location.state?.selectedRemedyGrade || {};

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      gradeId: selectedRemedyGrade.gradeId,
      gradeNo: selectedRemedyGrade.gradeNo,
      description: selectedRemedyGrade.description,
      fontName: selectedRemedyGrade.fontName,
      fontStyle: selectedRemedyGrade.fontStyle,
      fontColor: selectedRemedyGrade.fontColor
    },
    validationSchema: Yup.object({
      gradeNo: Yup.string().required("Please Enter Grade No"),
      fontName: Yup.string().required("Please Enter Font Name"),
      fontStyle: Yup.string().required("Please Enter Font Style"),
      fontColor: Yup.string().required("Please Enter Font Color")
    }),
    onSubmit: (values) => {
      dispatch(updateRemedyGrade({
        gradeId: values.gradeId,
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
      const timer = setTimeout(() => {
        dispatch(setRemedyGradeSuccess(null));
        navigate('/admin/listremedygrade');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (remedyGradeError) {
      const timer = setTimeout(() => {
        dispatch(setRemedyGradeError(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [remedyGradeSuccess, remedyGradeError, dispatch, navigate]);

  document.title = "Edit Remedy Grade";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {remedyGradeSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {remedyGradeSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {remedyGradeError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {remedyGradeError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Remedy Grade</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
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
                      <Row className="mt-3">
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
                            <textarea
                              name='description'
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="description"
                              rows="3"
                              placeholder="Enter Description"
                            ></textarea>
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
                          <Link to="/admin/listremedygrade">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i>
                              Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i>
                            Update
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

export default EditRemedyGrade;