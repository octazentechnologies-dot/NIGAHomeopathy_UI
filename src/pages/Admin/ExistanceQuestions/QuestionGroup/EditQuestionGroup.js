import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateQuestionGroup } from "../../../../slices/admin/questiongroup/thunk";
import { getQuestionSections } from "../../../../slices/admin/existance/thunk";
import { setQuestionGroupSuccess, setQuestionGroupError } from "../../../../slices/admin/questiongroup/reducer";

const EditQuestionGroup = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { questionSections, loading: existanceLoading } = useSelector((state) => state?.Existance);
  const { success: questionGroupSuccess, error: questionGroupError } = useSelector((state) => state?.QuestionGroup);

  // Format question section options for Select component
  const selectedQuestionGroup = location.state?.selectedQuestionGroup;

  const questionSectionOptions = useMemo(() => {
    return questionSections?.resultObject?.map((section) => ({
      label: section.questionSectionName,
      value: section.questionSectionId,
    })) || [];
  }, [questionSections]);

  const initialValues = useMemo(() => ({
    questionGroupId: selectedQuestionGroup?.questionGroupId,
    questionGroupName: selectedQuestionGroup?.questionGroupName || '',
    questionSectionId: questionSectionOptions.find(
      (section) => section.value === selectedQuestionGroup?.questionSectionId
    ) || null,
    questionSectionName: selectedQuestionGroup?.questionSectionName || '',
    description: selectedQuestionGroup?.description || '',
    enteredBy: 'Admin',
    deleteStatus: false
  }), [selectedQuestionGroup, questionSectionOptions]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: Yup.object({
      questionGroupName: Yup.string().required("Please Enter Question Group Name"),
      questionSectionId: Yup.object().shape({
        value: Yup.string().required("Please Select Question Section"),
      }).nullable().required("Please Select Question Section"),
      description: Yup.string().required("Please Enter Description"),
    }),
    onSubmit: (values) => {
      dispatch(updateQuestionGroup({
        questionGroupId: values.questionGroupId,
        questionGroupName: values.questionGroupName,
        questionSectionId: values.questionSectionId.value,
        questionSectionName: values.questionSectionId.label,
        description: values.description,
        enteredBy: values.enteredBy,
        enteredDate: new Date().toISOString(),
        deleteStatus: false
      }));
    }
  });

  useEffect(() => {
    dispatch(getQuestionSections());
  }, [dispatch]);

  useEffect(() => {
    if (questionGroupSuccess) {
      setTimeout(() => {
        dispatch(setQuestionGroupSuccess(null));
      }, 2000);
    }
    if (questionGroupError) {
      setTimeout(() => {
        dispatch(setQuestionGroupError(null));
      }, 2000);
    }
  }, [questionGroupSuccess, questionGroupError]);

  document.title = "Edit Question Group";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Edit Question Group" pageTitle="Question Group" />
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {questionGroupSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {questionGroupSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {questionGroupError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {questionGroupError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Question Group</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="questionSectionId" className="form-label">
                              Existance Name <span className="required">*</span>
                            </Label>
                            <Select
                              name="questionSectionId"
                              value={formik.values.questionSectionId}
                              onChange={(selectedOption) => {
                                formik.setFieldValue("questionSectionId", selectedOption);
                                formik.setFieldValue("questionSectionName", selectedOption?.label || '');
                              }}
                              options={questionSectionOptions}
                              isLoading={existanceLoading}
                              onBlur={() => formik.setFieldTouched("questionSectionId", true)}
                              className={formik.touched.questionSectionId && formik.errors.questionSectionId ? "is-invalid" : ""}
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: formik.touched.questionSectionId && formik.errors.questionSectionId ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.questionSectionId && formik.errors.questionSectionId ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.questionSectionId && formik.errors.questionSectionId ? (
                              <FormFeedback type="invalid">{formik.errors.questionSectionId}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="questionGroupName" className="form-label">Question Group Name <span className="required">*</span></Label>
                            <Input
                              name='questionGroupName'
                              type="text"
                              value={formik.values.questionGroupName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="questionGroupName"
                              placeholder="Enter Question Group Name"
                              invalid={formik.touched.questionGroupName && formik.errors.questionGroupName ? true : false}
                            />
                            {formik.touched.questionGroupName && formik.errors.questionGroupName ? (
                              <FormFeedback type="invalid">{formik.errors.questionGroupName}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="description" className="form-label">Description <span className="required">*</span></Label>
                            <Input
                              name='description'
                              type="textarea"
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="description"
                              placeholder="Enter Description"
                              invalid={formik.touched.description && formik.errors.description ? true : false}
                            />
                            {formik.touched.description && formik.errors.description ? (
                              <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                            ) : null}
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
                          <Link to="/admin/listquestiongroup">
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

export default EditQuestionGroup;