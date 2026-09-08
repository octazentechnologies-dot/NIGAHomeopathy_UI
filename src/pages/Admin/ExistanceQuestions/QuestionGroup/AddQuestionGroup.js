import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSelector, useDispatch } from 'react-redux';
import { createQuestionGroup } from '../../../../slices/admin/questiongroup/thunk';
import { getQuestionSections } from '../../../../slices/admin/existance/thunk';
import { setQuestionGroupSuccess, setQuestionGroupError } from '../../../../slices/admin/questiongroup/reducer';
import { neutralSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const AddQuestionGroup = () => {
  const dispatch = useDispatch();

  const { questionSections, loading: existanceLoading } = useSelector((state) => state?.Existance);
  const { success: questionGroupSuccess, error: questionGroupError } = useSelector((state) => state?.QuestionGroup);

  const questionSectionOptions = useMemo(() => {
    return questionSections?.resultObject?.map((section) => ({
      label: section.questionSectionName,
      value: section.questionSectionId,
    })) || [];
  }, [questionSections]);

  const formik = useFormik({
    enableReinitialize: false,
    initialValues: {
      questionGroupId: 0,
      questionGroupName: '',
      questionSectionId: null,
      questionSectionName: '',
      description: '',
      enteredBy: 'Admin',
      enteredDate: new Date().toISOString(),
      deleteStatus: false,
    },
    validationSchema: Yup.object({
      questionGroupName: Yup.string().required('Please Enter Question Group Name'),
      questionSectionId: Yup.object().shape({
        value: Yup.string().required('Please Select Question Section'),
      }).nullable().required('Please Select Question Section'),
      description: Yup.string().required('Please Enter Description'),
    }),
    onSubmit: (values) => {
      dispatch(createQuestionGroup({
        questionGroupId: values.questionGroupId,
        questionGroupName: values.questionGroupName,
        questionSectionId: values.questionSectionId.value,
        questionSectionName: values.questionSectionId.label,
        description: values.description,
        enteredBy: values.enteredBy,
        enteredDate: values.enteredDate,
        deleteStatus: false,
      }));
    },
  });

  useEffect(() => {
    dispatch(getQuestionSections());
  }, [dispatch]);

  useEffect(() => {
    if (questionGroupSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setQuestionGroupSuccess(null));
      }, 2000);
    }
    if (questionGroupError) {
      setTimeout(() => {
        dispatch(setQuestionGroupError(null));
      }, 2000);
    }
  }, [questionGroupSuccess, questionGroupError]);

  const sectionSelectInvalid = Boolean(formik.touched.questionSectionId && formik.errors.questionSectionId);

  const sectionSelectStyles = useMemo(() => ({
    ...neutralSelectStyles,
    control: (base, state) => ({
      ...neutralSelectStyles.control(base, state),
      ...(sectionSelectInvalid
        ? {
            borderColor: '#dc3545',
            '&:hover': { borderColor: '#dc3545' },
          }
        : {}),
    }),
  }), [sectionSelectInvalid]);

  document.title = 'Add Question Group';

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
                      <h5 className="admin-form-title">New Question Group</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(questionGroupSuccess || questionGroupError) ? (
                      <div className="admin-form-alerts">
                        {questionGroupSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {questionGroupSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {questionGroupError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {questionGroupError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="questionSectionId" className="form-label">
                            Existance Name <span className="required">*</span>
                          </Label>
                          <Select
                            name="questionSectionId"
                            inputId="questionSectionId"
                            value={formik.values.questionSectionId}
                            onChange={(selectedOption) => {
                              formik.setFieldValue('questionSectionId', selectedOption);
                              formik.setFieldValue('questionSectionName', selectedOption?.label || '');
                            }}
                            options={questionSectionOptions}
                            isLoading={existanceLoading}
                            onBlur={() => formik.setFieldTouched('questionSectionId', true)}
                            className={sectionSelectInvalid ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={sectionSelectStyles}
                            placeholder="Select..."
                          />
                          {sectionSelectInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.questionSectionId === 'string'
                                ? formik.errors.questionSectionId
                                : formik.errors.questionSectionId?.value || 'Please Select Question Section'}
                            </div>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="questionGroupName" className="form-label">
                            Question Group Name <span className="required">*</span>
                          </Label>
                          <Input
                            name="questionGroupName"
                            type="text"
                            value={formik.values.questionGroupName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="questionGroupName"
                            placeholder="Enter Question Group Name"
                            invalid={Boolean(formik.touched.questionGroupName && formik.errors.questionGroupName)}
                          />
                          {formik.touched.questionGroupName && formik.errors.questionGroupName ? (
                            <FormFeedback type="invalid">{formik.errors.questionGroupName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="description" className="form-label">
                            Description <span className="required">*</span>
                          </Label>
                          <Input
                            name="description"
                            type="textarea"
                            rows={3}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="description"
                            placeholder="Enter Description"
                            invalid={Boolean(formik.touched.description && formik.errors.description)}
                          />
                          {formik.touched.description && formik.errors.description ? (
                            <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listquestiongroup" className="d-inline-flex">
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

export default AddQuestionGroup;
