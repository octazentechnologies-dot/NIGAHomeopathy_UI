import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { addEditPatientLabTest } from '../../../../slices/admin/labtests/thunk';
import { setLabTestDetailsError, setLabTestDetailsSuccess } from '../../../../slices/admin/labtests/reducer';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const AddLabsImaging = () => {
  document.title = "Add Labs & Imaging";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { labTestDetailsSuccess, labTestDetailsError, labTestDetailsLoading } = useSelector((state) => state?.LabTest || {});

  const formik = useFormik({
    enableReinitialize: false,
    initialValues: {
      labTestName: '',
      description: ''
    },
    validationSchema: Yup.object({
      labTestName: Yup.string().required("Please enter Test Name"),
      description: Yup.string().required("Please enter Description"),
    }),
    onSubmit: async (values) => {
      try {
        const requestData = {
          patientLabTestId: 0,
          labTestName: values.labTestName,
          description: values.description
        };

        await dispatch(addEditPatientLabTest(requestData));
      } catch (error) {
        console.error('Error saving lab test:', error);
      }
    }
  });

  // Handle success/error messages
  useEffect(() => {
    if (labTestDetailsSuccess) {
      const timer = setTimeout(() => {
        formik.resetForm();
        dispatch(setLabTestDetailsSuccess(null));
        navigate('/admin/listlabsimaging');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (labTestDetailsError) {
      const timer = setTimeout(() => {
        dispatch(setLabTestDetailsError(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [labTestDetailsSuccess, labTestDetailsError, dispatch, navigate, formik]);

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
                      <h5 className="admin-form-title">New Labs & Imaging</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(labTestDetailsSuccess || labTestDetailsError) ? (
                      <div className="admin-form-alerts">
                        {labTestDetailsSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {labTestDetailsSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {labTestDetailsError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {labTestDetailsError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="labTestName" className="form-label">Test Name</Label>
                          <Input
                            type="text"
                            className="form-control"
                            id="labTestName"
                            name="labTestName"
                            placeholder="Enter Test Name"
                            value={formik.values.labTestName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.labTestName && formik.errors.labTestName ? true : false}
                          />
                          {formik.touched.labTestName && formik.errors.labTestName ? (
                            <FormFeedback type="invalid">{formik.errors.labTestName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={9} md={9}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            type="textarea"
                            className="form-control"
                            id="description"
                            name="description"
                            rows="1"
                            placeholder="Enter Description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.description && formik.errors.description ? true : false}
                          />
                          {formik.touched.description && formik.errors.description ? (
                            <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listlabsimaging" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-sm admin-list-btn admin-list-btn--new"
                          disabled={labTestDetailsLoading}
                        >
                          {labTestDetailsLoading ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Saving...
                            </>
                          ) : (
                            <>
                              <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                              Save
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

export default AddLabsImaging;
