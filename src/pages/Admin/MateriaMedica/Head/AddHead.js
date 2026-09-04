import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from "react-select";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createHead, getAuthorForCreateOrUpdateHead } from "../../../../slices/thunks";
import { setHeadError, setHeadSuccess } from "../../../../slices/admin/materiaMedica/head/reducer";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const AddHead = () => {
  const dispatch = useDispatch();

  // Redux state
  const { authors } = useSelector((state) => state?.Head || {});
  const { headSuccess, headError } = useSelector((state) => state?.Head || {});
  const SingleOptions = authors?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];


  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti2, setselectedMulti2] = useState(null);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      headName: '',
      author: null,
      seqNo: '1',
      description: '',
      isSection: false
    },
    validationSchema: Yup.object({
      headName: Yup.string().required("Please Enter Head Name"),
      author: Yup.object().shape({
        value: Yup.string().required("Please Select Author"),
      }).nullable().required("Please Select Author"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      debugger
      dispatch(createHead({
        "materiaMedicaHeadId": 0,
        "authorId": values.author.value,
        "materiaMedicaHeadName": values.headName,
        "isSection": values.isSection,
        "description": values.description,
        "seqNo": values.seqNo,
        "isDeleted": false
      }));
    }
  });

  useEffect(() => {
    dispatch(getAuthorForCreateOrUpdateHead(null));
  }, [])

  useEffect(() => {
    if (headSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setHeadSuccess(null));
      }, 2000);
      if (headError) {
        setTimeout(() => {
          dispatch(setHeadError(null));
        }, 2000);
      }
    }
  }, [headSuccess, headError]);


  document.title = "Add Head";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form onSubmit={(e) => {
                  debugger
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New Head</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(headSuccess || headError) ? (
                      <div className="admin-form-alerts">
                        {headSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {headSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {headError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {headError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Head Name <span className="required">*</span></Label>
                          <Input
                            name='headName'
                            type="input"
                            value={formik.values.headName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="placeholderInput"
                            placeholder="Enter Head Name"
                            invalid={
                              formik.touched.headName && formik.errors.headName ? true : false
                            } />
                          {formik.touched.headName && formik.errors.headName ?
                            (<FormFeedback type="invalid">{formik.errors.headName}</FormFeedback>) : null
                          }
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="author" className="form-label">
                            Author Name <span className="required">*</span>
                          </Label>
                          <Select
                            name="author"
                            value={formik.values.author}
                            onChange={(selectedOption) => formik.setFieldValue("author", selectedOption)}
                            options={SingleOptions}
                            onBlur={() => formik.setFieldTouched("author", true)}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.author && formik.errors.author),
                            })}
                            className={formik.touched.author && formik.errors.author ? "is-invalid" : ""}
                          />
                          {formik.touched.author && formik.errors.author ? (
                            <FormFeedback type="invalid">{formik.errors.author}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Seq. No.</Label>
                          <Input
                            name='seqNo'
                            type="input"
                            value={formik.values.seqNo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="placeholderInput"
                            disabled placeholder="Seq. No."
                            invalid={formik.touched.seqNo && formik.errors.seqNo ? true : false} />
                          {formik.touched.seqNo && formik.errors.seqNo ?
                            <FormFeedback type="invalid">{formik.errors.seqNo}</FormFeedback> : null
                          }
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={8} md={8}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                          <textarea
                            name='description'
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="exampleFormControlTextarea5"
                            rows="1"
                            placeholder="Enter Description" ></textarea>
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Is Section ?</Label>
                          <div className="form-check form-switch form-switch-lg mt-1" dir="ltr">
                            <Input
                              name='isSection'
                              type="checkbox"
                              className="form-check-input"
                              id="customSwitchsizelg"
                              checked={formik.values.isSection}
                              onChange={() => formik.setFieldValue('isSection', !formik.values.isSection)} />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listhead" className="d-inline-flex">
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

export default AddHead;
