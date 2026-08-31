import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import { useLocation } from 'react-router-dom';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateBodyPart, getSectionForBodyPart } from "../../../../slices/admin/repertory/bodypart/thunk";
import { setBodyPartError, setBodyPartSuccess } from "../../../../slices/admin/repertory/bodypart/reducer";

const EditBodyParts = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { bodyPartSuccess, bodyPartError } = useSelector((state) => state?.BodyPart || {});
  const sectionForSubSection = useSelector((state) => state.BodyPart.sectionForSubSection);

  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      bodyPartName: location.state.selectedBodyPart.bodyPartName,
      description: location.state.selectedBodyPart.description,
      section: SectionForSubSectionOptions.find(option => option.value === location.state.selectedBodyPart.sectionId)
    },
    validationSchema: Yup.object({
      bodyPartName: Yup.string().required("Please Enter Body Part Name"),
      section: Yup.object().required("Please Select Section")
    }),
    onSubmit: (values) => {
      dispatch(updateBodyPart({
        bodyPartId: location.state.selectedBodyPart.bodyPartId,
        BodyPartName: values.bodyPartName,
        Description: values.description,
        SectionId: values.section.value,
        DeleteStatus: false
      }));
    }
  });

  useEffect(() => {
    dispatch(getSectionForBodyPart());
  }, [dispatch]);

  useEffect(() => {
    if (bodyPartSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setBodyPartSuccess(null));
      }, 2000);
    }
    if (bodyPartError) {
      setTimeout(() => {
        dispatch(setBodyPartError(null));
      }, 2000);
    }
  }, [bodyPartSuccess, bodyPartError, dispatch]);

  document.title = "Edit Body Parts";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {bodyPartSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {bodyPartSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {bodyPartError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {bodyPartError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Body Part</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="bodyPartName" className="form-label">Body Part Name <span className="required">*</span></Label>
                            <Input
                              name='bodyPartName'
                              type="text"
                              value={formik.values.bodyPartName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="bodyPartName"
                              placeholder="Enter Body Part Name"
                              invalid={
                                formik.touched.bodyPartName && formik.errors.bodyPartName ? true : false
                              }
                            />
                            {formik.touched.bodyPartName && formik.errors.bodyPartName ? (
                              <FormFeedback type="invalid">{formik.errors.bodyPartName}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="sectionId" className="form-label">Section <span className="required">*</span></Label>
                            <Select
                              name='section'
                              value={formik.values.section}
                              onChange={(value) => formik.setFieldValue('section', value)}
                              onBlur={() => formik.setFieldTouched('section', true)}
                              options={SectionForSubSectionOptions}
                              className={formik.touched.section && formik.errors.section ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.section && formik.errors.section ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.section && formik.errors.section ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.section && formik.errors.section ? (
                              <div className="invalid-feedback">{formik.errors.section}</div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>
                      <Row className="mt-3">
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="description" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="description"
                              rows="3"
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
                          <Link to="/admin/listbodyparts">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i>
                              Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i>
                            Update
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

export default EditBodyParts;