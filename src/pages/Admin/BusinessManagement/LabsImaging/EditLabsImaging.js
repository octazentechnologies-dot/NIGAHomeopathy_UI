import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, Button, UncontrolledAlert } from 'reactstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { getPatientLabTestById, addEditPatientLabTest } from '../../../../slices/admin/labtests/thunk';
import { setLabTestDetailsError, setLabTestDetailsSuccess } from '../../../../slices/admin/labtests/reducer';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const EditLabsImaging = () => {
  document.title = "Edit Labs & Imaging";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const selectedLabTest = useSelector((state) => state?.LabTest?.selectedLabTest || null);
  const selectedLabTestLoading = useSelector((state) => state?.LabTest?.selectedLabTestLoading || false);
  const { labTestDetailsSuccess, labTestDetailsError, labTestDetailsLoading } = useSelector((state) => state?.LabTest || {});

  // Flag to track if form has been populated
  const formPopulatedRef = useRef(false);

  const formik = useFormik({
    enableReinitialize: true,
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
          patientLabTestId: parseInt(id),
          labTestName: values.labTestName,
          description: values.description
        };

        await dispatch(addEditPatientLabTest(requestData));
      } catch (error) {
        console.error('Error updating lab test:', error);
      }
    }
  });

  // Load lab test details on mount
  useEffect(() => {
    if (id) {
      dispatch(getPatientLabTestById(id));
    } else {
      // If no id, redirect back to list
      navigate('/admin/listlabsimaging');
    }
  }, [dispatch, id, navigate]);

  // Populate form when lab test details are loaded (only once)
  useEffect(() => {
    if (selectedLabTest && !formPopulatedRef.current) {
      formPopulatedRef.current = true; // Mark as populated

      // Set form values
      formik.setFieldValue('labTestName', selectedLabTest.labTestName || '');
      formik.setFieldValue('description', selectedLabTest.description || '');
    }
  }, [selectedLabTest, formik]);

  // Handle success/error messages
  useEffect(() => {
    if (labTestDetailsSuccess) {
      const timer = setTimeout(() => {
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
  }, [labTestDetailsSuccess, labTestDetailsError, dispatch, navigate]);

  if (selectedLabTestLoading) {
    return (
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading lab test details...</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {labTestDetailsSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {labTestDetailsSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {labTestDetailsError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {labTestDetailsError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">Edit Labs & Imaging</h4>
                </CardHeader>
                <Form onSubmit={formik.handleSubmit}>
                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
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
                          <Link to="/admin/listlabsimaging">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button
                            color="success"
                            className="btn-label"
                            type="submit"
                            disabled={labTestDetailsLoading}
                          >
                            {labTestDetailsLoading ? (
                              <>
                                <Spinner size="sm" className="me-2" /> Updating...
                              </>
                            ) : (
                              <>
                                <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update
                              </>
                            )}
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

export default EditLabsImaging;
