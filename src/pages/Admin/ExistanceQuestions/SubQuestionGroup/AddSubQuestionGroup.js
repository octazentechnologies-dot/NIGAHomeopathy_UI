import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Input, Label, Row, Button, Form, FormFeedback } from 'reactstrap';
import { Link } from 'react-router-dom';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";
//redux
import { useSelector, useDispatch } from "react-redux";
import { setSubQuestionGroupError, setSubQuestionGroupSuccess } from '../../../../slices/admin/existancequestions/subquestiongroup/reducer';
import { createUpdateSubQuestionGroup, getQuestionGroupsForSubQuestionGroup, getSectionsForSubQuestionGroup } from "../../../../slices/admin/existancequestions/subquestiongroup/thunk";

const AddSubQuestionGroup = () => {
  const dispatch = useDispatch();

  // Redux state
  const { subQuestionGroupSuccess, subQuestionGroupError, questionGroups, sections } = useSelector((state) => state?.SubQuestionGroup);

  const QuestionGroupDDLOptions = useMemo(() => {
    return (questionGroups || []).map((item) => ({
      value: item.questionGroupId,
      label: item.questionGroupName,
    }));
  }, [questionGroups]);

  const SectionDDLOptions = useMemo(() => {
    return (sections || []).map((item) => ({
      value: item.sectionId,
      label: item.sectionName,
    }));
  }, [sections]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      subQuestionGroupName: '',
      questionGroup: null,
      sections: [],
      description: ''
    },
    validationSchema: Yup.object({
      subQuestionGroupName: Yup.string().required("Please Enter Sub Question Group Name"),
      questionGroup: Yup.object().shape({
        value: Yup.string().required("Please Select Question Group"),
      }).nullable().required("Please Select Question Group"),
      sections: Yup.array().min(1, "Please Select at least one Section").required("Please Select Section"),
    }),
    onSubmit: (values) => {
      dispatch(createUpdateSubQuestionGroup({
        "questionSubgroupId": 0,
        "questionSubGroupName": values.subQuestionGroupName,
        "questionGroupId": values.questionGroup.value,
        "questionGroupName": values.questionGroup.label,
        "description": values.description,
        "sectionIds": (values.sections || []).map((s) => s.value),
        "deleteStatus": false
      }));
    }
  });

  useEffect(() => {
    dispatch(getQuestionGroupsForSubQuestionGroup());
    dispatch(getSectionsForSubQuestionGroup());
  }, [dispatch]);

  useEffect(() => {
    if (subQuestionGroupSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setSubQuestionGroupSuccess(null));
      }, 2000);
      if (subQuestionGroupError) {
        setTimeout(() => {
          dispatch(setSubQuestionGroupError(null));
        }, 2000);
      }
    }
  }, [subQuestionGroupSuccess, subQuestionGroupError]);

  document.title = "Add Sub Question Group";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {subQuestionGroupSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {subQuestionGroupSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {subQuestionGroupError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {subQuestionGroupError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Sub Question Group</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Question Group <span className="text-danger">*</span></Label>
                            <Select
                              name="questionGroup"
                              value={formik.values.questionGroup}
                              onChange={(selectedOption) => {
                                formik.setFieldValue("questionGroup", selectedOption);
                              }}
                              options={QuestionGroupDDLOptions}
                              onBlur={() => formik.setFieldTouched("questionGroup", true)}
                              className={formik.touched.questionGroup && formik.errors.questionGroup ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.questionGroup && formik.errors.questionGroup ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.questionGroup && formik.errors.questionGroup ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.questionGroup && formik.errors.questionGroup ? (
                              <FormFeedback>{formik.errors.questionGroup}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Sub Question Group Name <span className="text-danger">*</span></Label>
                            <Input
                              name='subQuestionGroupName'
                              type="input"
                              value={formik.values.subQuestionGroupName || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Sub Question Group Name"
                              invalid={
                                formik.touched.subQuestionGroupName && formik.errors.subQuestionGroupName ? true : false
                              } />
                            {formik.touched.subQuestionGroupName && formik.errors.subQuestionGroupName ? (
                              <FormFeedback type="invalid"><div>{formik.errors.subQuestionGroupName}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={8} md={8}>
                          <div>
                            <Label htmlFor="sections" className="form-label">Section <span className="text-danger">*</span></Label>
                            <Select
                              name="sections"
                              isMulti
                              isClearable
                              closeMenuOnSelect={false}
                              value={formik.values.sections}
                              onChange={(selectedOptions) => {
                                formik.setFieldValue("sections", selectedOptions || []);
                              }}
                              options={SectionDDLOptions}
                              onBlur={() => formik.setFieldTouched("sections", true)}
                              placeholder="Select Section(s)..."
                              className={formik.touched.sections && formik.errors.sections ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.sections && formik.errors.sections ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.sections && formik.errors.sections ? "red" : base.borderColor,
                                  },
                                }),
                                multiValue: (base) => ({
                                  ...base,
                                  backgroundColor: "#e9ecef",
                                }),
                                multiValueLabel: (base) => ({
                                  ...base,
                                  color: "#212529",
                                }),
                                multiValueRemove: (base) => ({
                                  ...base,
                                  color: "#495057",
                                  ":hover": {
                                    backgroundColor: "#ced4da",
                                    color: "#212529",
                                  },
                                }),
                              }}
                            />
                            {formik.touched.sections && formik.errors.sections ? (
                              <div className="invalid-feedback d-block">{formik.errors.sections}</div>
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

                  <CardFooter className="gap-2">
                    <Row className="g-4">
                      <Col className="col-sm">
                        <div className="d-flex justify-content-sm-start">
                        </div>
                      </Col>
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <Link to="/admin/listsubquestiongroup">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type='submit'>
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

export default AddSubQuestionGroup;
