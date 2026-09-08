import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import { createDiagnosisSystem } from '../../../../slices/admin/clinicalpattern/diagnosissystem/thunk';
import { setDiagnosisSystemError, setDiagnosisSystemSuccess } from '../../../../slices/admin/clinicalpattern/diagnosissystem/reducer';

const AddDiagnosisSystem = () => {
  const dispatch = useDispatch();
  const { diagnosisSystemSuccess, diagnosisSystemError } = useSelector((state) => state?.DiagnosisSystem || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      diagnosisSystemName: '',
      description: '',
    },
    validationSchema: Yup.object({
      diagnosisSystemName: Yup.string().required('Please Enter Diagnosis System Name'),
      description: Yup.string(),
    }),
    onSubmit: (values) => {
      dispatch(createDiagnosisSystem({
        diagnosisSystemId: 0,
        diagnosisSystemName: values.diagnosisSystemName,
        description: values.description,
        isDeleted: false,
      }));
    },
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
  }, [diagnosisSystemSuccess, diagnosisSystemError, dispatch, formik]);

  document.title = 'Add Diagnosis System';

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                    return false;
                  }}
                >
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New Diagnosis System</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(diagnosisSystemSuccess || diagnosisSystemError) ? (
                      <div className="admin-form-alerts">
                        {diagnosisSystemSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {diagnosisSystemSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {diagnosisSystemError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {diagnosisSystemError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={3} md={3}>
                        <div>
                          <Label htmlFor="diagnosisSystemName" className="form-label">
                            Diagnosis System Name <span className="required">*</span>
                          </Label>
                          <Input
                            name="diagnosisSystemName"
                            type="text"
                            value={formik.values.diagnosisSystemName || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="diagnosisSystemName"
                            placeholder="Enter Diagnosis System Name"
                            invalid={Boolean(formik.touched.diagnosisSystemName && formik.errors.diagnosisSystemName)}
                          />
                          {formik.touched.diagnosisSystemName && formik.errors.diagnosisSystemName ? (
                            <FormFeedback type="invalid">{formik.errors.diagnosisSystemName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={9} md={9}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            name="description"
                            type="textarea"
                            rows={1}
                            value={formik.values.description || ''}
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
                        <Link to="/admin/listdiagnosissystem" className="d-inline-flex">
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

export default AddDiagnosisSystem;
