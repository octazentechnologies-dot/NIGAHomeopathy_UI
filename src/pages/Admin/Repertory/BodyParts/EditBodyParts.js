import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import Select from "react-select";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

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

  const sectionInvalid = Boolean(formik.touched.section && formik.errors.section);

  document.title = "Edit Body Parts";
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
                      <h5 className="admin-form-title">Edit Body Part</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(bodyPartSuccess || bodyPartError) ? (
                      <div className="admin-form-alerts">
                        {bodyPartSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {bodyPartSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {bodyPartError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {bodyPartError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: sectionInvalid })}
                          />
                          {sectionInvalid ? (
                            <div className="invalid-feedback d-block">{formik.errors.section}</div>
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
                            rows={3}
                            value={formik.values.description}
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
                        <Link to="/admin/listbodyparts" className="d-inline-flex">
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

export default EditBodyParts;
