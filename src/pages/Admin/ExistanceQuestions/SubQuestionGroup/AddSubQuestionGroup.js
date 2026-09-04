import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Input, Label, Row, Form, FormFeedback } from 'reactstrap';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import Select from 'react-select';
import { useSelector, useDispatch } from 'react-redux';
import { setSubQuestionGroupError, setSubQuestionGroupSuccess } from '../../../../slices/admin/existancequestions/subquestiongroup/reducer';
import { createUpdateSubQuestionGroup, getQuestionGroupsForSubQuestionGroup, getSectionsForSubQuestionGroup } from '../../../../slices/admin/existancequestions/subquestiongroup/thunk';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const AddSubQuestionGroup = () => {
  const dispatch = useDispatch();
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
      description: '',
    },
    validationSchema: Yup.object({
      subQuestionGroupName: Yup.string().required('Please Enter Sub Question Group Name'),
      questionGroup: Yup.object().shape({
        value: Yup.string().required('Please Select Question Group'),
      }).nullable().required('Please Select Question Group'),
      sections: Yup.array().min(1, 'Please Select at least one Section').required('Please Select Section'),
    }),
    onSubmit: (values) => {
      dispatch(createUpdateSubQuestionGroup({
        questionSubgroupId: 0,
        questionSubGroupName: values.subQuestionGroupName,
        questionGroupId: values.questionGroup.value,
        questionGroupName: values.questionGroup.label,
        description: values.description,
        sectionIds: (values.sections || []).map((s) => s.value),
        deleteStatus: false,
      }));
    },
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
    }
    if (subQuestionGroupError) {
      setTimeout(() => {
        dispatch(setSubQuestionGroupError(null));
      }, 2000);
    }
  }, [subQuestionGroupSuccess, subQuestionGroupError]);

  const questionGroupInvalid = Boolean(formik.touched.questionGroup && formik.errors.questionGroup);
  const sectionsInvalid = Boolean(formik.touched.sections && formik.errors.sections);

  document.title = 'Add Sub Question Group';

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
                      <h5 className="admin-form-title">New Sub Question Group</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(subQuestionGroupSuccess || subQuestionGroupError) ? (
                      <div className="admin-form-alerts">
                        {subQuestionGroupSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {subQuestionGroupSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {subQuestionGroupError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {subQuestionGroupError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="questionGroup" className="form-label">
                            Question Group <span className="required">*</span>
                          </Label>
                          <Select
                            name="questionGroup"
                            inputId="questionGroup"
                            value={formik.values.questionGroup}
                            onChange={(selectedOption) => formik.setFieldValue('questionGroup', selectedOption)}
                            options={QuestionGroupDDLOptions}
                            onBlur={() => formik.setFieldTouched('questionGroup', true)}
                            className={questionGroupInvalid ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: questionGroupInvalid })}
                            placeholder="Select..."
                          />
                          {questionGroupInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.questionGroup === 'string'
                                ? formik.errors.questionGroup
                                : 'Please Select Question Group'}
                            </div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="subQuestionGroupName" className="form-label">
                            Sub Question Group Name <span className="required">*</span>
                          </Label>
                          <Input
                            name="subQuestionGroupName"
                            type="text"
                            value={formik.values.subQuestionGroupName || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="subQuestionGroupName"
                            placeholder="Enter Sub Question Group Name"
                            invalid={Boolean(formik.touched.subQuestionGroupName && formik.errors.subQuestionGroupName)}
                          />
                          {formik.touched.subQuestionGroupName && formik.errors.subQuestionGroupName ? (
                            <FormFeedback type="invalid">{formik.errors.subQuestionGroupName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="sections" className="form-label">
                            Section <span className="required">*</span>
                          </Label>
                          <Select
                            name="sections"
                            inputId="sections"
                            isMulti
                            isClearable
                            closeMenuOnSelect={false}
                            value={formik.values.sections}
                            onChange={(selectedOptions) => formik.setFieldValue('sections', selectedOptions || [])}
                            options={SectionDDLOptions}
                            onBlur={() => formik.setFieldTouched('sections', true)}
                            placeholder="Select Section(s)..."
                            className={sectionsInvalid ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: sectionsInvalid, isMulti: true })}
                          />
                          {sectionsInvalid ? (
                            <div className="invalid-feedback d-block">{formik.errors.sections}</div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="description" className="form-label">Description</Label>
                          <Input
                            name="description"
                            type="textarea"
                            rows={3}
                            value={formik.values.description || ''}
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
                        <Link to="/admin/listsubquestiongroup" className="d-inline-flex">
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

export default AddSubQuestionGroup;
