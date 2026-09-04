import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, FormFeedback, Form, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { setSectionError, setSectionSuccess } from '../../../../slices/admin/section/reducer';
import { createSection } from "../../../../slices/admin/section/thunk";

const AddSection = (props) => {
  const dispatch = useDispatch();

  // Redux state
  const { sectionSuccess, sectionError } = useSelector((state) => state?.Section);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      sectionName: '',
      sectionAlias: '',
      description: ''
    },
    validationSchema: Yup.object({
      sectionName: Yup.string().required("Please Enter Section Name"),
      sectionAlias: Yup.string().required("Please Enter Section Alias"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      console.log(values);
      dispatch(createSection({
        "sectionId": 0,
        "SectionName": values.sectionName,
        "SectionAlias": values.sectionAlias,
        "Description": values.description,
        "EnteredBy": "Admin",
        "DeleteStatus": false
      }));
    }
  });

  useEffect(() => {
    if (sectionSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setSectionSuccess(null));
      }, 2000);
      if (sectionError) {
        setTimeout(() => {
          dispatch(setSectionError(null));
        }, 2000);
      }
    }
  }, [sectionSuccess, sectionError]);



  document.title = "Add Section";
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
                      <h5 className="admin-form-title">New Section</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(sectionSuccess || sectionError) ? (
                      <div className="admin-form-alerts">
                        {sectionSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {sectionSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {sectionError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {sectionError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="sectionName" className="form-label">
                            Section Name <span className="required">*</span>
                          </Label>
                          <Input
                            name='sectionName'
                            type="text"
                            value={formik.values.sectionName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="sectionName"
                            placeholder="Enter Section Name"
                            invalid={
                              formik.touched.sectionName && formik.errors.sectionName ? true : false
                            } />
                          {formik.touched.sectionName && formik.errors.sectionName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.sectionName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="sectionAlias" className="form-label">
                            Section Alias <span className="required">*</span>
                          </Label>
                          <Input
                            name='sectionAlias'
                            type="text"
                            value={formik.values.sectionAlias || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="sectionAlias"
                            placeholder="Enter Section Alias"
                            invalid={
                              formik.touched.sectionAlias && formik.errors.sectionAlias ? true : false
                            } />
                          {formik.touched.sectionAlias && formik.errors.sectionAlias ? (
                            <FormFeedback type="invalid"><div>{formik.errors.sectionAlias}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            name='description'
                            type="textarea"
                            rows={1}
                            value={formik.values.description || ""}
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
                        <Link to="/admin/listsection" className="d-inline-flex">
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

export default AddSection;
