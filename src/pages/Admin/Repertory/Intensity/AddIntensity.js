import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createIntensity } from "../../../../slices/admin/repertory/intensity/thunk";
import { setIntensityError, setIntensitySuccess } from "../../../../slices/admin/repertory/intensity/reducer";

const AddIntensity = () => {
  const dispatch = useDispatch();

  // Redux state
  const { intensitySuccess, intensityError } = useSelector((state) => state?.Intensity || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      intensityNo: '',
      description: ''
    },
    validationSchema: Yup.object({
      intensityNo: Yup.number()
        .typeError('Please enter a valid number')
        .required("Please Enter Intensity Number")
        .positive('Intensity number must be positive')
        .integer('Intensity number must be an integer'),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      dispatch(createIntensity({
        intensityId: 0,
        IntensityNo: parseInt(values.intensityNo),
        Description: values.description,
        deleteStatus: false
      }));
    }
  });

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

  document.title = "Add Intensity";
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
                      <h5 className="admin-form-title">New Intensity</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(intensitySuccess || intensityError) ? (
                      <div className="admin-form-alerts">
                        {intensitySuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {intensitySuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {intensityError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {intensityError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="intensityNo" className="form-label">Intensity No <span className="required">*</span></Label>
                          <Input
                            name='intensityNo'
                            type="text"
                            value={formik.values.intensityNo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="intensityNo"
                            placeholder="Enter Intensity Name"
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
                        <Link to="/admin/listintensity" className="d-inline-flex">
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

export default AddIntensity;
