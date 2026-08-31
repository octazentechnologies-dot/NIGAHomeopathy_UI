import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Button, Form, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { createDrugSystem } from "../../../../slices/admin/drugsystem/thunk";
import { setDrugSystemError, setDrugSystemSuccess } from '../../../../slices/admin/drugsystem/reducer';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

const AddDrugSystem = () => {
  const dispatch = useDispatch();

  // Redux state
  const { drugSystemSuccess, drugSystemError } = useSelector((state) => state?.DrugSystem);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      drugSystemName: '',
    },
    validationSchema: Yup.object({
      drugSystemName: Yup.string().required("Please Enter Drug System Name"),
    }),
    onSubmit: (values) => {
      dispatch(createDrugSystem({
        "drugSystemId": 0,
        "drugSystemName": values.drugSystemName,
      }));
    }
  });

  useEffect(() => {
    if (drugSystemSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setDrugSystemSuccess(null));
      }, 2000);
    }
    if (drugSystemError) {
      setTimeout(() => {
        dispatch(setDrugSystemError(null));
      }, 2000);
    }
  }, [drugSystemSuccess, drugSystemError]);

  document.title = "Add Drug System";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {drugSystemSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {drugSystemSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {drugSystemError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {drugSystemError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Drug System</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
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

                        {/* <Col xxl={8} md={8}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="exampleFormControlTextarea5"
                              rows="1"
                              placeholder="Enter Description" ></textarea>
                          </div>
                        </Col> */}
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
                          <Link to="/admin/listdrugsystem">
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

export default AddDrugSystem;