import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Form, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { updateDrugSystem } from "../../../../slices/admin/drugsystem/thunk";
import { setDrugSystemError, setDrugSystemSuccess } from '../../../../slices/admin/drugsystem/reducer';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const EditDrugSystem = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { drugSystemSuccess, drugSystemError } = useSelector((state) => state?.DrugSystem);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      drugSystemName: location.state?.selectedDrugSystem?.drugSystemName || '',
    },
    validationSchema: Yup.object({
      drugSystemName: Yup.string().required("Please Enter Drug System Name"),
    }),
    onSubmit: (values) => {
      dispatch(updateDrugSystem({
        "drugSystemId": location.state?.selectedDrugSystem?.drugSystemId,
        "drugSystemName": values.drugSystemName,
      }));
    }
  });

  useEffect(() => {
    if (drugSystemSuccess) {
      setTimeout(() => {
        dispatch(setDrugSystemSuccess(null));
      }, 2000);
    }
    if (drugSystemError) {
      setTimeout(() => {
        dispatch(setDrugSystemError(null));
      }, 2000);
    }
  }, [drugSystemSuccess, drugSystemError]);

  document.title = "Edit Drug System";
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
                      <h5 className="admin-form-title">Edit Drug System</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(drugSystemSuccess || drugSystemError) ? (
                      <div className="admin-form-alerts">
                        {drugSystemSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {drugSystemSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {drugSystemError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {drugSystemError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Drug System Name</Label>
                          <Input
                            name='drugSystemName'
                            type="input"
                            value={formik.values.drugSystemName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="placeholderInput"
                            placeholder="Enter Drug System Name"
                            invalid={
                              formik.touched.drugSystemName && formik.errors.drugSystemName ? true : false
                            } />
                          {formik.touched.drugSystemName && formik.errors.drugSystemName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.drugSystemName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listdrugsystem" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          Update
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

export default EditDrugSystem;
