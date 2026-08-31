import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Form, FormFeedback, Button, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";

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

  document.title = "Add Clinical Question";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {questionSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {questionSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {questionError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {questionError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={formik.handleSubmit}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Clinical Question</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Existance Name</Label>
                            <Select
                              name="existance"
                              value={formik.values.existance}
                              onChange={(selectedOption) => formik.setFieldValue("existance", selectedOption)}
                              options={SectionDDLOptions}
                              onBlur={() => formik.setFieldTouched("existance", true)}
                              className={formik.touched.existance && formik.errors.existance ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.existance && formik.errors.existance ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.existance && formik.errors.existance ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.existance && formik.errors.existance ? (
                              <FormFeedback>{formik.errors.existance}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Question Group</Label>
                            <Select
                              name="questionGroup"
                              value={formik.values.questionGroup}
                              onChange={(selectedOption) => {
                                formik.setFieldValue("questionGroup", selectedOption);
                                dispatch(getSubQuestionGroupDll({ questionGroupId: selectedOption.value, questionSectionId: formik.values.existance.value }));
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
                            <Label htmlFor="placeholderInput" className="form-label">Sub Question Group</Label>
                            <Select
                              name="subQuestionGroup"
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
                              className={formik.touched.subQuestionGroup && formik.errors.subQuestionGroup ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.subQuestionGroup && formik.errors.subQuestionGroup ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.subQuestionGroup && formik.errors.subQuestionGroup ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.subQuestionGroup && formik.errors.subQuestionGroup ? (
                              <FormFeedback>{formik.errors.subQuestionGroup}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>
                      {formik.values?.subQuestionGroup?.label.toLowerCase() !== "location" ? (<Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Question</Label>
                            <Input
                              name='question'
                              type="input"
                              value={formik.values.question}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Question"
                              invalid={
                                formik.touched.question && formik.errors.question ? true : false
                              }
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.question && formik.errors.question ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.question && formik.errors.question ? "red" : base.borderColor,
                                  },
                                }),
                              }} />
                            {formik.touched.question && formik.errors.question ? (
                              <FormFeedback>{formik.errors.question}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>) :
                        (<Row className='mt-3'>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                              <Select
                                name="sectionForBodyPart"
                                value={formik.values.sectionForBodyPart}
                                onChange={(selectedOption) => {
                                  formik.setFieldValue("sectionForBodyPart", selectedOption);
                                  dispatch(getBodyPartBySection({ questionSectionForBodyPartId: selectedOption.value }));
                                }}
                                options={SectionListOptions}
                                onBlur={() => formik.setFieldTouched("sectionForBodyPart", true)}
                                className={formik.touched.sectionForBodyPart && formik.errors.sectionForBodyPart ? "is-invalid" : ""}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    borderColor: formik.touched.sectionForBodyPart && formik.errors.sectionForBodyPart ? "red" : base.borderColor,
                                    "&:hover": {
                                      borderColor: formik.touched.sectionForBodyPart && formik.errors.sectionForBodyPart ? "red" : base.borderColor,
                                    },
                                  }),
                                }}
                              />
                              {formik.touched.sectionForBodyPart && formik.errors.sectionForBodyPart ? (
                                <FormFeedback>{formik.errors.sectionForBodyPart}</FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="placeholderInput" className="form-label">Body Part Name</Label>
                              <Select
                                name="bodyPart"
                                value={formik.values.bodyPart}
                                onChange={(selectedOption) => formik.setFieldValue("bodyPart", selectedOption)}
                                options={BodyPartDDLOptions}
                                onBlur={() => formik.setFieldTouched("bodyPart", true)}
                                className={formik.touched.bodyPart && formik.errors.bodyPart ? "is-invalid" : ""}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    borderColor: formik.touched.bodyPart && formik.errors.bodyPart ? "red" : base.borderColor,
                                    "&:hover": {
                                      borderColor: formik.touched.bodyPart && formik.errors.bodyPart ? "red" : base.borderColor,
                                    },
                                  }),
                                }}
                              />
                              {formik.touched.bodyPart && formik.errors.bodyPart ? (
                                <FormFeedback>{formik.errors.bodyPart}</FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                        </Row>)
                      }

                      <Row className='mt-3'>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Section</Label>
                            <Select
                              name="section"
                              value={formik.values.section}
                              onChange={(selectedOption) => {
                                formik.setFieldValue("section", selectedOption);
                                dispatch(getSubSectionForClinicalQuestion(selectedOption.value))
                              }}
                              options={SectionListOptions}
                              onBlur={() => formik.setFieldTouched("section", true)}
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
                              <FormFeedback>{formik.errors.section}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label" data-choices data-choices-limit="Required Limit" data-choices-removeItem>Sub Section</Label>
                            <Select
                              name="subSection"
                              value={formik.values.subSection}
                              isMulti={true}
                              isClearable={true}
                              closeMenuOnSelect={false}
                              isLoading={formik.values.section ? SubSectionListOptions.length > 0 ? false : true : false}
                              onChange={(selectedOptions) => formik.setFieldValue("subSection", selectedOptions)}
                              options={SubSectionListOptions}
                              onBlur={() => formik.setFieldTouched("subSection", true)}
                              className={formik.touched.subSection && formik.errors.subSection ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.subSection && formik.errors.subSection ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.subSection && formik.errors.subSection ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.subSection && formik.errors.subSection ? (
                              <FormFeedback>{formik.errors.subSection}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div className="d-inline-flex gap-2  mt-4">
                            <button type="button"
                              onClick={addSelectedSubSectionQuestions}
                              disabled={formik.values?.subSection?.length === 0}
                              className="btn btn-soft-info btn-sm  mt-2">
                              <i className="ri-add-line align-middle"></i> Add Sub Section
                            </button>
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <table class="table table-responsive table-bordered table-nowrap">
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
                                      <td className='text-center'>
                                        <div className="remove">
                                          <button
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
                          <Link to="/admin/listclinincalquestion"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit"> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save </Button>
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
    </React.Fragment >
  );
};

export default AddClinicalQuestion;