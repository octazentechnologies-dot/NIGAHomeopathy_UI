import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useLocation } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateIntensity } from "../../../../slices/admin/repertory/intensity/thunk";
import { setIntensityError, setIntensitySuccess } from "../../../../slices/admin/repertory/intensity/reducer";

const EditIntensity = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { intensitySuccess, intensityError } = useSelector((state) => state?.Intensity || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      intensityNo: location.state.selectedIntensity.intensityNo,
      description: location.state.selectedIntensity.description
    },
    validationSchema: Yup.object({
      intensityNo: Yup.number()
        .typeError('Please enter a valid number')
        .required("Please Enter Intensity Number")
        .positive('Intensity number must be positive')
        .integer('Intensity number must be an integer'),
      // description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      dispatch(updateIntensity({
        intensityId: location.state.selectedIntensity.intensityId,
        intensityNo: parseInt(values.intensityNo),
        description: values.description,
        isDeleted: false
      }));
    }
  });

  // Handle numeric input
  const handleNumericInput = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      formik.handleChange(e);
    }
  };

  useEffect(() => {
    if (intensitySuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setIntensitySuccess(null));
      }, 2000);
      if (intensityError) {
        setTimeout(() => {
          dispatch(setIntensityError(null));
        }, 2000);
      }
    }
  }, [intensitySuccess, intensityError]);

  document.title = "Edit Intensity";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {intensitySuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {intensitySuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {intensityError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {intensityError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Intensity</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={3} md={3}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Intensity Number <span className="required">*</span></Label>
                            <Input
                              name='intensityNo'
                              type="text"
                              value={formik.values.intensityNo}
                              onChange={handleNumericInput}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Intensity Number"
                              invalid={
                                formik.touched.intensityNo && formik.errors.intensityNo ? true : false
                              } />
                            {formik.touched.intensityNo && formik.errors.intensityNo ?
                              (<FormFeedback type="invalid">{formik.errors.intensityNo}</FormFeedback>) : null
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
                          <Link to="/admin/listintensity"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit"> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update </Button>
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

export default EditIntensity;