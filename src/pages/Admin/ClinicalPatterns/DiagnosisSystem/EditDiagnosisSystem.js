import React, { useEffect } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { Spinner } from 'reactstrap';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateDiagnosisSystem } from "../../../../slices/admin/clinicalpattern/diagnosissystem/thunk";
import { setDiagnosisSystemError, setDiagnosisSystemSuccess } from "../../../../slices/admin/clinicalpattern/diagnosissystem/reducer";

const EditDiagnosisSystem = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { diagnosisSystemSuccess, diagnosisSystemError } = useSelector((state) => state?.DiagnosisSystem || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      diagnosisSystemName: location.state?.selectedDiagnosisSystem?.diagnosisSystemName || '',
      description: location.state?.selectedDiagnosisSystem?.description || ''
    },
    validationSchema: Yup.object({
      diagnosisSystemName: Yup.string().required("Please Enter Diagnosis System Name"),
      description: Yup.string()
    }),
    onSubmit: (values) => {
      dispatch(updateDiagnosisSystem({
        "diagnosisSystemId": location.state?.selectedDiagnosisSystem?.diagnosisSystemId,
        "diagnosisSystemName": values.diagnosisSystemName,
        "description": values.description,
        "isDeleted": false
      }));
    }
  });

  useEffect(() => {
    if (diagnosisSystemSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setDiagnosisSystemSuccess(null));
      }, 2000);
    }
    if (diagnosisSystemError) {
      setTimeout(() => {
        dispatch(setDiagnosisSystemError(null));
      }, 2000);
    }
  }, [diagnosisSystemSuccess, diagnosisSystemError]);

  document.title = "Edit Diagnosis System";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {diagnosisSystemSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {diagnosisSystemSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {diagnosisSystemError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {diagnosisSystemError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Diagnosis System</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={3} md={3}>
                          <div>
                            <Label htmlFor="diagnosisSystemName" className="form-label">
                              Diagnosis System Name <span className="required">*</span>
                            </Label>
                            <Input
                              name='diagnosisSystemName'
                              type="input"
                              value={formik.values.diagnosisSystemName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="diagnosisSystemName"
                              placeholder="Enter Diagnosis System Name"
                              invalid={
                                formik.touched.diagnosisSystemName && formik.errors.diagnosisSystemName ? true : false
                              }
                            />
                            {formik.touched.diagnosisSystemName && formik.errors.diagnosisSystemName ?
                              (<FormFeedback type="invalid">{formik.errors.diagnosisSystemName}</FormFeedback>) : null
                            }
                          </div>
                        </Col>
                        <Col xxl={9} md={9}>
                          <div>
                            <Label htmlFor="description" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="description"
                              rows="1"
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
                          <Link to="/admin/listdiagnosissystem">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update
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

export default EditDiagnosisSystem;