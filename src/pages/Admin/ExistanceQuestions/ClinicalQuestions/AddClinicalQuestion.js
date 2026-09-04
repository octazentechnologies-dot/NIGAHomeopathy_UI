import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Form, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from "react-select";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import {
  getQuestionSectionDll,
  getSubQuestionGroupDll,
  getQuestionGroups,
  getBodyPartBySection,
  getSubSectionForClinicalQuestion,
  getSectionForSubSectionForClinicalQuestion,
  createOrUpdateClinicalQuestionBodyPart
} from "../../../../slices/thunks";

import { setQuestionError, setQuestionSuccess } from '../../../../slices/admin/existancequestions/clinicalquestions/reducer';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const AddClinicalQuestion = () => {

  const dispatch = useDispatch();

  // Redux State
  const questionSectionDDL = useSelector((state) => state?.ClinicalQuestions?.questionSectionDDL || []);
  const questionSubSection = useSelector((state) => state?.ClinicalQuestions?.questionSubSectionDDL || []);
  const questionGroups = useSelector((state) => state?.ClinicalQuestions?.questionGroups || []);
  const questionBodyPart = useSelector((state) => state?.ClinicalQuestions?.questionBodyParts || []);
  const questionSubSectionList = useSelector((state) => state?.ClinicalQuestions?.questionSubSections || []);
  const questionSectionList = useSelector((state) => state?.ClinicalQuestions?.questionSections || []);
  const { questionError, questionSuccess } = useSelector((state) => state.ClinicalQuestions);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedSubQuestionGroup, setSelectedSubQuestionGroup] = useState('');
  const [finalRequest, setFinalRequest] = useState({});

  const SectionDDLOptions = useMemo(() => {
    return questionSectionDDL.map((item) => ({
      value: item.questionSectionId,
      label: item.questionSectionName,
    }));
  }, [questionSectionDDL]);

  const QuestionGroupDDLOptions = useMemo(() => {
    return questionGroups.map((item) => ({
      value: item.questionGroupId,
      label: item.questionGroupName,
    }));
  }, [questionGroups]);

  const SubSectionDDLOptions = useMemo(() => {
    return questionSubSection.map((item) => ({
      value: item.questionSubgroupId,
      label: item.questionSubgroup1,
    }));
  }, [questionSubSection]);

  const BodyPartDDLOptions = useMemo(() => {
    return questionBodyPart.map((item) => ({
      value: item.bodyPartId,
      label: item.bodyPartName,
    }));
  }, [questionBodyPart]);

  const SubSectionListOptions = useMemo(() => {
    return questionSubSectionList.map((item) => ({
      value: item.subSectionId,
      label: item.subSectionName,
    }));
  }, [questionSubSectionList]);

  const SectionListOptions = useMemo(() => {
    return questionSectionList.map((item) => ({
      value: item.sectionId,
      label: item.sectionName,
    }));
  }, [questionSectionList]);

  const formik = useFormik({
    enableReinitialize: false,
    initialValues: {
      existance: null,
      questionGroup: null,
      subQuestionGroup: null,
      sectionForBodyPart: null,
      bodyPart: null,
      section: null,
      subSection: [],
      question: ''
    },
    validationSchema: Yup.object({
      existance: Yup.object().shape({
        value: Yup.string().required("Please Select Existance Name"),
      }).nullable().required("Please Select Existance Name"),
      questionGroup: Yup.object().shape({
        value: Yup.string().required("Please Select Question Group"),
      }).nullable().required("Please Select Question Group"),
      subQuestionGroup: Yup.object().shape({
        value: Yup.string().required("Please Select Sub Question Group"),
      }).nullable().required("Please Select Sub Question Group"),
      sectionForBodyPart: tableData.length > 0 ? '' : !isLocationSelected ? '' : Yup.object().shape({
        value: Yup.string().required("Please Select Section"),
      }).nullable().required("Please Select Section"),
      bodyPart: tableData.length > 0 ? '' : !isLocationSelected ? '' : Yup.object().shape({
        value: Yup.string().required("Please Select Body Part"),
      }).nullable().required("Please Select Body Part"),
      section: tableData.length > 0 ? '' : Yup.object().shape({
        value: Yup.string().required("Please Select Section"),
      }).nullable().required("Please Select Section"),
      subSection: tableData.length > 0 ? '' : Yup.array().of(
        Yup.object().shape({
          value: Yup.string().required("Please Select Sub Section"),
        })
      ).min(1, "Please Select at least one Sub Section").required("Please Select at least one Sub Section"),
      question: tableData.length > 0 ? '' : !isLocationSelected ? Yup.string().required("Please enter question") : ''
    }),
    onSubmit: (values) => {
      console.log("Final clicked");
      dispatch(createOrUpdateClinicalQuestionBodyPart(finalRequest));
    }
  });

  useEffect(() => {
    dispatch(getQuestionSectionDll());
    dispatch(getQuestionGroups());
    dispatch(getSectionForSubSectionForClinicalQuestion());
  }, [dispatch]);

  useEffect(() => {
    if (questionSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setQuestionSuccess(null));
      }, 2000);
    }
    if (questionError) {
      setTimeout(() => {
        dispatch(setQuestionError(null));
      }, 2000);
    }
  }, [questionSuccess, questionError]);

  const addSelectedSubSectionQuestions = () => {

    if (formik.values.subQuestionGroup?.label?.toLowerCase() !== "location") {
      if (!formik.values.question || formik.values.question.trim() === "") {
        //alert("Please enter a question");
        formik.setFieldError("question", "Please enter a question");
        formik.setFieldTouched("question", true);
        return;
      }
    } else {
      if (!formik.values.bodyPart) {
        //alert("Please enter a question");
        return;
      }
    }

    if (!formik.values.subSection || formik.values.subSection.length === 0) {
      //alert("Please select at least one Sub Section");
      return;
    }

    const rubrics = formik.values.subSection.map((item) => ({
      subsectionID: item.value,
      SubSectionName: item.label,
    }));

    let finalRequest = {};
    let request = {};

    if (formik.values.subQuestionGroup?.label?.toLowerCase() !== "location") {
      request = {
        keyWords: formik.values.question,
        clinicalQuestionRubricList: rubrics,
      };

      finalRequest = {
        questionSectionID: formik.values.existance?.value,
        questionGroupId: formik.values.questionGroup?.value,
        questionSubGroupID: formik.values.subQuestionGroup?.value,
        qbType: 1,
        clinicalQuestionList: [
          {
            keyWords: formik.values.question,
            clinicalQuestionRubricList: rubrics,
          },
        ],
        clinicalBodyPartList: [],
      };
    } else {
      request = {
        bodypartID: formik.values.bodyPart?.value,
        keyWords: formik.values.bodyPart?.label,
        clinicalBodyPartRubricList: rubrics,
      };

      finalRequest = {
        questionSectionID: formik.values.existance?.value,
        questionGroupId: formik.values.questionGroup?.value,
        questionSubGroupID: formik.values.subQuestionGroup?.value,
        qbType: 2,
        clinicalQuestionList: [],
        clinicalBodyPartList: [
          {
            bodypartID: formik.values.bodyPart?.value,
            clinicalBodyPartRubricList: rubrics,
          },
        ],
      };
    }

    console.log("Final Request:", finalRequest);
    setFinalRequest(finalRequest);
    // Add the request to the table or state
    const updatedTableData = [...tableData];
    updatedTableData.push({
      question: formik.values.subQuestionGroup?.label?.toLowerCase() !== "location" ? formik.values.question : formik.values.bodyPart.label,
      subSections: rubrics.map((r) => r.SubSectionName),
    });
    setTableData(updatedTableData);

    // Reset the form fields related to sub-sections
    formik.setFieldValue("subSection", []);
    formik.setFieldTouched("subSection", false);
    formik.setFieldValue("question", "");
    formik.setFieldTouched("question", false);
    formik.setFieldValue("bodyPart", null);
    formik.setFieldTouched("bodyPart", false);
    formik.setFieldValue("sectionForBodyPart", null);
    formik.setFieldTouched("sectionForBodyPart", false);
    formik.setFieldValue("section", null);
    formik.setFieldTouched("section", false);
    // formik.setFieldValue("existance", null);
    //formik.setFieldValue("questionGroup", null);
    //formik.setFieldValue("subQuestionGroup", null);
    document.activeElement.blur();
  };

  const deleteSubSection = (parentIndex, childIndex) => {
    console.log("parentIndex:", parentIndex);
    console.log("childIndex:", childIndex);

    const updatedTableData = [...tableData]; // Create a copy of the table data
    const updatedFinalRequest = { ...finalRequest }; // Create a copy of the final request

    if (formik.values.subQuestionGroup?.label?.toLowerCase() !== "location") {
      // Handle clinicalQuestionRubricList
      const rubrics = [...updatedFinalRequest.clinicalQuestionList[parentIndex].clinicalQuestionRubricList];

      if (childIndex !== -1) {
        rubrics.splice(childIndex, 1); // Remove the specific sub-section
        updatedFinalRequest.clinicalQuestionList[parentIndex].clinicalQuestionRubricList = rubrics;

        // If no rubrics remain, remove the entire question
        if (rubrics.length === 0) {
          updatedFinalRequest.clinicalQuestionList.splice(parentIndex, 1);
          updatedTableData.splice(parentIndex, 1);
        } else {
          updatedTableData[parentIndex].subSections = rubrics.map((r) => r.SubSectionName);
        }
      }
    } else {
      // Handle clinicalBodyPartRubricList
      const rubrics = [...updatedFinalRequest.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList];

      if (childIndex !== -1) {
        rubrics.splice(childIndex, 1); // Remove the specific sub-section
        updatedFinalRequest.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList = rubrics;

        // If no rubrics remain, remove the entire body part
        if (rubrics.length === 0) {
          updatedFinalRequest.clinicalBodyPartList.splice(parentIndex, 1);
          updatedTableData.splice(parentIndex, 1);
        } else {
          updatedTableData[parentIndex].subSections = rubrics.map((r) => r.SubSectionName);
        }
      }
    }

    setFinalRequest(updatedFinalRequest); // Update the final request state
    setTableData(updatedTableData); // Update the table data state
  };

  const existanceInvalid = Boolean(formik.touched.existance && formik.errors.existance);
  const questionGroupInvalid = Boolean(formik.touched.questionGroup && formik.errors.questionGroup);
  const subQuestionGroupInvalid = Boolean(formik.touched.subQuestionGroup && formik.errors.subQuestionGroup);
  const sectionForBodyPartInvalid = Boolean(formik.touched.sectionForBodyPart && formik.errors.sectionForBodyPart);
  const bodyPartInvalid = Boolean(formik.touched.bodyPart && formik.errors.bodyPart);
  const sectionInvalid = Boolean(formik.touched.section && formik.errors.section);
  const subSectionInvalid = Boolean(formik.touched.subSection && formik.errors.subSection);
  const isLocation = formik.values?.subQuestionGroup?.label?.toLowerCase() === "location";

  document.title = "Add Clinical Question";
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
                      <h5 className="admin-form-title">New Clinical Question</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(questionSuccess || questionError) ? (
                      <div className="admin-form-alerts">
                        {questionSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {questionSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {questionError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {questionError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="existance" className="form-label">
                            Existance Name <span className="required">*</span>
                          </Label>
                          <Select
                            name="existance"
                            inputId="existance"
                            value={formik.values.existance}
                            onChange={(selectedOption) => formik.setFieldValue("existance", selectedOption)}
                            options={SectionDDLOptions}
                            onBlur={() => formik.setFieldTouched("existance", true)}
                            className={existanceInvalid ? "is-invalid" : ""}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: existanceInvalid })}
                            placeholder="Select..."
                          />
                          {existanceInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.existance === "string"
                                ? formik.errors.existance
                                : "Please Select Existance Name"}
                            </div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="questionGroup" className="form-label">
                            Question Group <span className="required">*</span>
                          </Label>
                          <Select
                            name="questionGroup"
                            inputId="questionGroup"
                            value={formik.values.questionGroup}
                            onChange={(selectedOption) => {
                              formik.setFieldValue("questionGroup", selectedOption);
                              dispatch(getSubQuestionGroupDll({ questionGroupId: selectedOption.value, questionSectionId: formik.values.existance.value }));
                            }}
                            options={QuestionGroupDDLOptions}
                            onBlur={() => formik.setFieldTouched("questionGroup", true)}
                            className={questionGroupInvalid ? "is-invalid" : ""}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: questionGroupInvalid })}
                            placeholder="Select..."
                          />
                          {questionGroupInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.questionGroup === "string"
                                ? formik.errors.questionGroup
                                : "Please Select Question Group"}
                            </div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="subQuestionGroup" className="form-label">
                            Sub Question Group <span className="required">*</span>
                          </Label>
                          <Select
                            name="subQuestionGroup"
                            inputId="subQuestionGroup"
                            value={formik.values.subQuestionGroup}
                            onChange={(selectedOption) => {
                              console.log(selectedOption)
                              if (selectedOption.label === "location") {
                                setIsLocationSelected(true);
                              } else {
                                setIsLocationSelected(false);
                              }
                              if (tableData.length > 0) {
                                dispatch(setQuestionError(`You already filled data in tabel for ${selectedSubQuestionGroup} sub question group.`));
                                setTimeout(() => {
                                  dispatch(setQuestionError(null));
                                }, 2000);
                              } else {
                                setSelectedSubQuestionGroup(selectedOption.label);
                                formik.setFieldValue("subQuestionGroup", selectedOption);
                              }
                            }}
                            options={SubSectionDDLOptions}
                            onBlur={() => formik.setFieldTouched("subQuestionGroup", true)}
                            className={subQuestionGroupInvalid ? "is-invalid" : ""}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: subQuestionGroupInvalid })}
                            placeholder="Select..."
                          />
                          {subQuestionGroupInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.subQuestionGroup === "string"
                                ? formik.errors.subQuestionGroup
                                : "Please Select Sub Question Group"}
                            </div>
                          ) : null}
                        </div>
                      </Col>

                      {!isLocation ? (
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="question" className="form-label">
                              Question <span className="required">*</span>
                            </Label>
                            <Input
                              name="question"
                              type="input"
                              value={formik.values.question}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="question"
                              placeholder="Enter Question"
                              invalid={Boolean(formik.touched.question && formik.errors.question)}
                            />
                            {formik.touched.question && formik.errors.question ? (
                              <FormFeedback>{formik.errors.question}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      ) : (
                        <>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="sectionForBodyPart" className="form-label">
                                Section <span className="required">*</span>
                              </Label>
                              <Select
                                name="sectionForBodyPart"
                                inputId="sectionForBodyPart"
                                value={formik.values.sectionForBodyPart}
                                onChange={(selectedOption) => {
                                  formik.setFieldValue("sectionForBodyPart", selectedOption);
                                  dispatch(getBodyPartBySection({ questionSectionForBodyPartId: selectedOption.value }));
                                }}
                                options={SectionListOptions}
                                onBlur={() => formik.setFieldTouched("sectionForBodyPart", true)}
                                className={sectionForBodyPartInvalid ? "is-invalid" : ""}
                                classNamePrefix="admin-form-select"
                                theme={neutralSelectTheme}
                                styles={getAdminFormSelectStyles({ invalid: sectionForBodyPartInvalid })}
                                placeholder="Select..."
                              />
                              {sectionForBodyPartInvalid ? (
                                <div className="invalid-feedback d-block">
                                  {typeof formik.errors.sectionForBodyPart === "string"
                                    ? formik.errors.sectionForBodyPart
                                    : "Please Select Section"}
                                </div>
                              ) : null}
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="bodyPart" className="form-label">
                                Body Part Name <span className="required">*</span>
                              </Label>
                              <Select
                                name="bodyPart"
                                inputId="bodyPart"
                                value={formik.values.bodyPart}
                                onChange={(selectedOption) => formik.setFieldValue("bodyPart", selectedOption)}
                                options={BodyPartDDLOptions}
                                onBlur={() => formik.setFieldTouched("bodyPart", true)}
                                className={bodyPartInvalid ? "is-invalid" : ""}
                                classNamePrefix="admin-form-select"
                                theme={neutralSelectTheme}
                                styles={getAdminFormSelectStyles({ invalid: bodyPartInvalid })}
                                placeholder="Select..."
                              />
                              {bodyPartInvalid ? (
                                <div className="invalid-feedback d-block">
                                  {typeof formik.errors.bodyPart === "string"
                                    ? formik.errors.bodyPart
                                    : "Please Select Body Part"}
                                </div>
                              ) : null}
                            </div>
                          </Col>
                        </>
                      )}

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="section" className="form-label">
                            Section <span className="required">*</span>
                          </Label>
                          <Select
                            name="section"
                            inputId="section"
                            value={formik.values.section}
                            onChange={(selectedOption) => {
                              formik.setFieldValue("section", selectedOption);
                              dispatch(getSubSectionForClinicalQuestion(selectedOption.value))
                            }}
                            options={SectionListOptions}
                            onBlur={() => formik.setFieldTouched("section", true)}
                            className={sectionInvalid ? "is-invalid" : ""}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: sectionInvalid })}
                            placeholder="Select..."
                          />
                          {sectionInvalid ? (
                            <div className="invalid-feedback d-block">
                              {typeof formik.errors.section === "string"
                                ? formik.errors.section
                                : "Please Select Section"}
                            </div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="subSection" className="form-label">
                            Sub Section <span className="required">*</span>
                          </Label>
                          <Select
                            name="subSection"
                            inputId="subSection"
                            value={formik.values.subSection}
                            isMulti={true}
                            isClearable={true}
                            closeMenuOnSelect={false}
                            isLoading={formik.values.section ? SubSectionListOptions.length > 0 ? false : true : false}
                            onChange={(selectedOptions) => formik.setFieldValue("subSection", selectedOptions)}
                            options={SubSectionListOptions}
                            onBlur={() => formik.setFieldTouched("subSection", true)}
                            className={subSectionInvalid ? "is-invalid" : ""}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: subSectionInvalid, isMulti: true })}
                            placeholder="Select..."
                          />
                          {subSectionInvalid ? (
                            <div className="invalid-feedback d-block">{formik.errors.subSection}</div>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div className="d-inline-flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={addSelectedSubSectionQuestions}
                            disabled={formik.values?.subSection?.length === 0}
                            className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                          >
                            <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                            Add Sub Section
                          </button>
                        </div>
                      </Col>

                      <Col xxl={12} md={12}>
                        <div className="table-responsive patient-list-modal__table-wrap">
                          <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                            <thead>
                              <tr>
                                <th scope="col">Question</th>
                                <th scope="col">Sub Section Name</th>
                                <th scope="col">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.map((row, index) => (
                                <React.Fragment key={index}>
                                  {row.subSections.map((subSection, subIndex) => (
                                    <tr key={`${index}-${subIndex}`}>
                                      {subIndex === 0 ? (
                                        <td rowSpan={row.subSections.length}>{row.question}</td>
                                      ) : null}
                                      <td>{subSection}</td>
                                      <td className="text-center">
                                        <div className="remove">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-soft-danger remove-item-btn"
                                            onClick={() => deleteSubSection(index, subIndex)}
                                            title="Remove this author"
                                          >
                                            <i className="ri-delete-bin-5-line" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listclinicalquestion" className="d-inline-flex">
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

export default AddClinicalQuestion;