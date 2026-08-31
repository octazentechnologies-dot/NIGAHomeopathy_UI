import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner, FormFeedback, Form, Alert } from 'reactstrap';
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
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {sectionSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {sectionSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {sectionError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {sectionError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Section</h4>
                  </CardHeader>
                  <CardBody className="card-body">

                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Section Name</Label>
                            <Input
                              name='sectionName'
                              type="input"
                              value={formik.values.sectionName || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
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
                            <Label htmlFor="placeholderInput" className="form-label">Section Alias</Label>
                            <Input
                              name='sectionAlias'
                              type="input"
                              value={formik.values.sectionAlias || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
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

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
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
                          <Link to="/admin/listsection"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type='submit'> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save </Button>
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

export default AddSection;