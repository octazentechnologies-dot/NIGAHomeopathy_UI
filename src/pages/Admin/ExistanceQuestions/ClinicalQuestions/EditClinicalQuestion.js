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
  createOrUpdateClinicalQuestionBodyPart,
  getClinicalQuestionBodyPartDataById
} from "../../../../slices/thunks";

import { setQuestionError, setQuestionSuccess } from '../../../../slices/admin/existancequestions/clinicalquestions/reducer';
import { useLocation } from 'react-router-dom';

const EditClinicalQuestion = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux State
  const questionSectionDDL = useSelector((state) => state?.ClinicalQuestions?.questionSectionDDL || []);
  const questionSubSection = useSelector((state) => state?.ClinicalQuestions?.questionSubSectionDDL || []);
  const questionGroups = useSelector((state) => state?.ClinicalQuestions?.questionGroups || []);
  const questionBodyPart = useSelector((state) => state?.ClinicalQuestions?.questionBodyParts || []);
  const questionSubSectionList = useSelector((state) => state?.ClinicalQuestions?.questionSubSections || []);
  const questionSectionList = useSelector((state) => state?.ClinicalQuestions?.questionSections || []);
  const { questionError, questionSuccess, questionBodyPartDataById } = useSelector((state) => state.ClinicalQuestions);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedSubQuestionGroup, setSelectedSubQuestionGroup] = useState('');
  const [finalRequest, setFinalRequest] = useState({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [originalItemData, setOriginalItemData] = useState(null);
  const [sendArrayToApi, setSendArrayToApi] = useState({});

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
    enableReinitialize: true,
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
      // Build the request similar to EditClinicalQuestionsComponent
      const requestData = buildApiRequest();
      dispatch(createOrUpdateClinicalQuestionBodyPart(requestData));
    }
  });

  useEffect(() => {
    dispatch(getQuestionSectionDll());
    dispatch(getQuestionGroups());
    dispatch(getSectionForSubSectionForClinicalQuestion());
    if (location.state.selectedClinicalQuestion.questionsId) {
      dispatch(getClinicalQuestionBodyPartDataById({ questionId: location.state.selectedClinicalQuestion.questionsId, qbType: location.state.selectedClinicalQuestion.questionSubgroupName === "LOCATION" ? 0 : 1 }));
    }
  }, [dispatch, location]);

  useEffect(() => {
    if (questionSuccess) {
      setTimeout(() => {
        dispatch(setQuestionError(null));
        dispatch(setQuestionSuccess(null));
      }, 2000);
    }
  }, [questionSuccess, questionError]);

  // Populate form fields and table data from questionBodyPartDataById response
  useEffect(() => {
    if (questionBodyPartDataById && Object.keys(questionBodyPartDataById).length > 0 && !isFormInitialized) {
      // Set form values from the response data
      const responseData = questionBodyPartDataById;

      // Set existance (question section)
      const sectionId = responseData.questionSectionId || responseData.questionSectionID;
      if (sectionId && questionSectionDDL.length > 0) {
        const existanceOption = questionSectionDDL.find(item => item.questionSectionId === sectionId);
        if (existanceOption) {
          const existanceValue = {
            value: existanceOption.questionSectionId,
            label: existanceOption.questionSectionName
          };
          formik.setFieldValue("existance", existanceValue);
        }
      }

      // Set question group
      if (responseData.questionGroupId && questionGroups.length > 0) {
        const questionGroupOption = questionGroups.find(item => item.questionGroupId === responseData.questionGroupId);
        if (questionGroupOption) {
          formik.setFieldValue("questionGroup", {
            value: questionGroupOption.questionGroupId,
            label: questionGroupOption.questionGroupName
          });

          // Fetch sub question groups for this question group
          dispatch(getSubQuestionGroupDll({
            questionGroupId: responseData.questionGroupId,
            questionSectionId: responseData.questionSectionId
          }));
        }
      }

      // Set sub question group after sub groups are loaded
      if (responseData.questionSubGroupID && questionSubSection.length > 0) {
        const subQuestionGroupOption = questionSubSection.find(item => item.questionSubgroupId === responseData.questionSubGroupID);
        if (subQuestionGroupOption) {
          const subQuestionGroupValue = {
            value: subQuestionGroupOption.questionSubgroupId,
            label: subQuestionGroupOption.questionSubgroup1
          };
          formik.setFieldValue("subQuestionGroup", subQuestionGroupValue);
          setSelectedSubQuestionGroup(subQuestionGroupOption.questionSubgroup1);

          // Set location state based on sub question group
          if (subQuestionGroupOption.questionSubgroup1.toLowerCase() === "location") {
            setIsLocationSelected(true);
          } else {
            setIsLocationSelected(false);
          }
        }
      }

      // Set final request data
      setFinalRequest(responseData);

      // Populate table data based on the response
      const tableRows = [];
      console.log("Full response data:", responseData);
      console.log("clinicalQuestionBodyPartViewList:", responseData.clinicalQuestionBodyPartViewList);

      // Handle clinicalQuestionBodyPartViewList from response
      if (responseData.clinicalQuestionBodyPartViewList && responseData.clinicalQuestionBodyPartViewList.length > 0) {
        console.log("Processing clinicalQuestionBodyPartViewList...");
        responseData.clinicalQuestionBodyPartViewList.forEach((item, index) => {
          console.log(`Item ${index}:`, item);
          console.log(`keywordQuestion:`, item.keywordQuestion);
          console.log(`bodyPartName:`, item.bodyPartName);

          // Handle clinicalRubricViewList from the response structure
          const rubricList = item.clinicalRubricViewList || item.clinicalQuestionRubricList || item.clinicalBodyPartRubricList || item.rubricList || [];
          console.log(`Rubric list for item ${index}:`, rubricList);

          const subSectionNames = rubricList.map(rubric => {
            console.log(`Rubric item:`, rubric);
            return rubric.subsectionName || rubric.subSectionName || rubric.SubSectionName || rubric.subsection_name;
          }).filter(name => name); // Remove any undefined/null values

          console.log(`Subsection names for item ${index}:`, subSectionNames);

          const tableRow = {
            question: item.keywordQuestion || item.keyWords || item.question || item.bodyPart || 'No question found',
            bodyPartName: item.bodyPartName || 'No body part found',
            subSections: subSectionNames,
            // Store original item data for editing
            originalItem: item,
            sectionId: item.sectionId,
            bodyPartId: item.bodyPartId,
            clinicalRubricViewList: item.clinicalRubricViewList
          };
          console.log(`Table row for item ${index}:`, tableRow);
          tableRows.push(tableRow);
        });
      }

      // Fallback: Handle clinical questions (qbType: 1)
      else if (responseData.clinicalQuestionList && responseData.clinicalQuestionList.length > 0) {
        console.log("Processing clinicalQuestionList fallback...");
        responseData.clinicalQuestionList.forEach(question => {
          const subSectionNames = question.clinicalQuestionRubricList ?
            question.clinicalQuestionRubricList.map(rubric => rubric.subSectionName || rubric.SubSectionName) : [];

          tableRows.push({
            question: question.keyWords,
            bodyPartName: question.bodyPartName,
            subSections: subSectionNames
          });
        });
      }

      // Fallback: Handle clinical body parts (qbType: 2)
      else if (responseData.clinicalBodyPartList && responseData.clinicalBodyPartList.length > 0) {
        console.log("Processing clinicalBodyPartList fallback...");
        responseData.clinicalBodyPartList.forEach(bodyPart => {
          const subSectionNames = bodyPart.clinicalBodyPartRubricList ?
            bodyPart.clinicalBodyPartRubricList.map(rubric => rubric.subSectionName || rubric.SubSectionName) : [];

          tableRows.push({
            question: bodyPart.keyWords,
            bodyPartName: bodyPart.bodyPartName,
            subSections: subSectionNames
          });
        });
      }

      console.log("Final table rows:", tableRows);
      setTableData(tableRows);

      // Initialize sendArrayToApi similar to EditClinicalQuestionsComponent
      const clinicalQuestionList = [];
      const clinicalBodyPartList = [];
      const subQuestionGroupLabel = responseData.questionSubgroupId && questionSubSection.length > 0
        ? questionSubSection.find(sg => sg.value === responseData.questionSubgroupId)?.label
        : '';

      if (subQuestionGroupLabel?.toLowerCase() !== 'location') {
        responseData.clinicalQuestionBodyPartViewList.forEach(item => {
          clinicalQuestionList.push({
            clinicalQuestionKeywordID: item.clinicalQueKeywordId || 0,
            questionID: responseData.questionsId,
            keyWords: item.keywordQuestion,
            clinicalQuestionRubricList: item.clinicalRubricViewList?.map(rubric => ({
              subsectionID: rubric.subsectionID,
              clinicalQuestionBodyPartID: 0,
              clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
            })) || []
          });
        });
      } else {
        responseData.clinicalQuestionBodyPartViewList.forEach(item => {
          clinicalBodyPartList.push({
            clinicalQuestionBodyPartID: item.clinicalQuestionBodyPartId || 0,
            questionID: responseData.questionsId,
            bodypartID: item.bodyPartId,
            clinicalBodyPartRubricList: item.clinicalRubricViewList?.map(rubric => ({
              subsectionID: rubric.subsectionID,
              clinicalQuestionBodyPartID: 0,
              clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
            })) || []
          });
        });
      }

      const initialSendArrayToApi = {
        questionsId: responseData.questionsId,
        questionSectionID: responseData.questionSectionId,
        questionGroupId: responseData.questionGroupId,
        questionSubGroupID: responseData.questionSubgroupId,
        qbType: subQuestionGroupLabel?.toLowerCase() === 'location' ? 0 : 1,
        clinicalQuestionList: clinicalQuestionList,
        clinicalBodyPartList: clinicalBodyPartList
      };

      setSendArrayToApi(initialSendArrayToApi);
      setFinalRequest(initialSendArrayToApi);
      setIsFormInitialized(true);
    }
  }, [questionBodyPartDataById, questionSectionDDL, questionGroups, questionSubSection, dispatch, isFormInitialized]);

  // Separate effect to populate form when DDL data becomes available after response data
  useEffect(() => {
    if (questionBodyPartDataById && Object.keys(questionBodyPartDataById).length > 0 && questionSectionDDL.length > 0 && !isFormInitialized) {
      const responseData = questionBodyPartDataById;

      // Set existance (question section) - check for different possible field names
      const sectionId = responseData.questionSectionID || responseData.questionSectionId || responseData.sectionId;
      if (sectionId) {
        const existanceOption = questionSectionDDL.find(item => item.questionSectionId === sectionId);
        if (existanceOption && !formik.values.existance) {
          const existanceValue = {
            value: existanceOption.questionSectionId,
            label: existanceOption.questionSectionName
          };
          formik.setFieldValue("existance", existanceValue);
        }
      }
    }
  }, [questionSectionDDL, questionBodyPartDataById, isFormInitialized]);

  // Separate effect to set sub question group when sub groups are loaded
  useEffect(() => {
    if (questionBodyPartDataById && Object.keys(questionBodyPartDataById).length > 0 && questionSubSection.length > 0 && !formik.values.subQuestionGroup) {
      const responseData = questionBodyPartDataById;

      // Check for different possible field names for sub question group ID
      const subGroupId = responseData.questionSubgroupId || responseData.questionSubGroupID || responseData.subGroupId;
      if (subGroupId) {
        const subQuestionGroupOption = questionSubSection.find(item => item.questionSubgroupId === subGroupId);
        if (subQuestionGroupOption) {
          const subQuestionGroupValue = {
            value: subQuestionGroupOption.questionSubgroupId,
            label: subQuestionGroupOption.questionSubgroup1
          };
          formik.setFieldValue("subQuestionGroup", subQuestionGroupValue);
          setSelectedSubQuestionGroup(subQuestionGroupOption.questionSubgroup1);

          // Set location state based on sub question group
          if (subQuestionGroupOption.questionSubgroup1.toLowerCase() === "location") {
            setIsLocationSelected(true);
          } else {
            setIsLocationSelected(false);
          }
        }
      }
    }
  }, [questionSubSection, questionBodyPartDataById]);

  const addSelectedSubSectionQuestions = () => {
    if (formik.values.subQuestionGroup?.label?.toLowerCase() !== "location") {
      if (!formik.values.question || formik.values.question.trim() === "") {
        formik.setFieldError("question", "Please enter a question");
        formik.setFieldTouched("question", true);
        return;
      }
    } else {
      if (!formik.values.bodyPart) {
        return;
      }
    }

    if (!formik.values.subSection || formik.values.subSection.length === 0) {
      return;
    }

    const rubrics = formik.values.subSection.map((item) => ({
      subsectionID: item.value,
      SubSectionName: item.label,
    }));

    // Check if we're editing an existing item
    if (editingItem) {
      // Find existing item in table
      const foundIndex = tableData.findIndex(row => {
        if (formik.values.subQuestionGroup?.label?.toLowerCase() === 'location') {
          return row.originalItem?.bodyPartId === editingItem.bodyPartId;
        } else {
          return row.originalItem?.keywordQuestion === editingItem.keywordQuestion;
        }
      });

      if (foundIndex !== -1) {
        // Add new subsections to existing item
        const newRubrics = rubrics.filter(newRubric =>
          !tableData[foundIndex].originalItem?.clinicalRubricViewList?.some(existing =>
            existing.subsectionID === newRubric.subsectionID
          )
        );

        if (newRubrics.length > 0) {
          const updatedTableData = [...tableData];
          const updatedOriginalItem = { ...updatedTableData[foundIndex].originalItem };

          // Create a new array instead of trying to modify the existing one
          const existingRubrics = updatedOriginalItem.clinicalRubricViewList || [];
          const newRubricObjects = newRubrics.map(r => ({
            clinicalRubricID: 0,
            subsectionID: r.subsectionID,
            subsectionName: r.SubSectionName,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionKeywordID: updatedOriginalItem.clinicalQueKeywordId || updatedOriginalItem.clinicalQuestionBodyPartId,
            clinicalQuestionRubricID: 0
          }));

          // Create a completely new array by spreading both arrays
          updatedOriginalItem.clinicalRubricViewList = [...existingRubrics, ...newRubricObjects];

          updatedTableData[foundIndex] = {
            ...updatedTableData[foundIndex],
            subSections: updatedOriginalItem.clinicalRubricViewList.map(r => r.subsectionName),
            originalItem: updatedOriginalItem
          };

          setTableData(updatedTableData);
        }
      }

      // Clear editing state
      setEditingItem(null);
      setOriginalItemData(null);
    } else {
      // Add new item to table
      const updatedTableData = [...tableData];
      updatedTableData.push({
        question: formik.values.subQuestionGroup?.label?.toLowerCase() !== "location" ? formik.values.question : formik.values.bodyPart.label,
        bodyPartName: formik.values.subQuestionGroup?.label?.toLowerCase() === "location" ? formik.values.bodyPart.label : null,
        subSections: rubrics.map((r) => r.SubSectionName),
        originalItem: {
          questionsBodyPartId: 0,
          questionsBodyPartName: null,
          sectionId: formik.values.section?.value || formik.values.sectionForBodyPart?.value,
          bodyPartId: formik.values.bodyPart?.value,
          qbType: null,
          clinicalQueKeywordId: 0,
          keywordQuestion: formik.values.subQuestionGroup?.label?.toLowerCase() !== "location" ? formik.values.question : null,
          bodyPartName: formik.values.subQuestionGroup?.label?.toLowerCase() === "location" ? formik.values.bodyPart.label : null,
          clinicalQuestionBodyPartId: null,
          clinicalRubricViewList: rubrics.map((r) => ({
            clinicalRubricID: 0,
            subsectionID: r.subsectionID,
            subsectionName: r.SubSectionName,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionKeywordID: 0,
            clinicalQuestionRubricID: 0
          }))
        }
      });
      setTableData(updatedTableData);
    }

    // Update final request based on current table data
    updateFinalRequestFromTableData();

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
    document.activeElement.blur();
  };

  const deleteSubSection = (parentIndex, childIndex) => {
    const updatedTableData = [...tableData];
    const updatedSendArrayToApi = { ...sendArrayToApi };

    if (formik.values.subQuestionGroup?.label?.toLowerCase() !== "location") {
      const rubrics = [...updatedSendArrayToApi.clinicalQuestionList[parentIndex].clinicalQuestionRubricList];

      if (childIndex !== -1) {
        rubrics.splice(childIndex, 1);
        updatedSendArrayToApi.clinicalQuestionList[parentIndex].clinicalQuestionRubricList = rubrics;

        // Update original item's clinicalRubricViewList - create new array instead of modifying existing one
        if (updatedTableData[parentIndex].originalItem?.clinicalRubricViewList) {
          const existingRubrics = updatedTableData[parentIndex].originalItem.clinicalRubricViewList;
          updatedTableData[parentIndex].originalItem.clinicalRubricViewList = [
            ...existingRubrics.slice(0, childIndex),
            ...existingRubrics.slice(childIndex + 1)
          ];
        }

        if (rubrics.length === 0) {
          updatedSendArrayToApi.clinicalQuestionList.splice(parentIndex, 1);
          updatedTableData.splice(parentIndex, 1);
        } else {
          updatedTableData[parentIndex].subSections = rubrics.map((r) => r.SubSectionName || r.subsectionName);
        }
      }
    } else {
      const rubrics = [...updatedSendArrayToApi.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList];

      if (childIndex !== -1) {
        rubrics.splice(childIndex, 1);
        updatedSendArrayToApi.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList = rubrics;

        // Update original item's clinicalRubricViewList - create new array instead of modifying existing one
        if (updatedTableData[parentIndex].originalItem?.clinicalRubricViewList) {
          const existingRubrics = updatedTableData[parentIndex].originalItem.clinicalRubricViewList;
          updatedTableData[parentIndex].originalItem.clinicalRubricViewList = [
            ...existingRubrics.slice(0, childIndex),
            ...existingRubrics.slice(childIndex + 1)
          ];
        }

        if (rubrics.length === 0) {
          updatedSendArrayToApi.clinicalBodyPartList.splice(parentIndex, 1);
          updatedTableData.splice(parentIndex, 1);
        } else {
          updatedTableData[parentIndex].subSections = rubrics.map((r) => r.SubSectionName || r.subsectionName);
        }
      }
    }

    setSendArrayToApi(updatedSendArrayToApi);
    setFinalRequest(updatedSendArrayToApi);
    setTableData(updatedTableData);
  };

  const fetchBodyPartBySection = (sectionId) => {
    return new Promise((resolve) => {
      dispatch(getBodyPartBySection({ questionSectionForBodyPartId: sectionId }));
      // Resolve after a short delay to allow Redux state to update
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  };

  const handleEditItem = async (tableRow) => {
    try {
      console.log('Editing table row:', tableRow);
      const originalItem = tableRow.originalItem || tableRow;
      setEditingItem(originalItem);
      setOriginalItemData(originalItem);

      // If it's a location type, populate location-specific fields
      if (formik.values?.subQuestionGroup?.label?.toLowerCase() === 'location') {
        // Get body parts for the section if sectionId exists
        if (originalItem.sectionId) {
          await fetchBodyPartBySection(originalItem.sectionId);
        }

        // Set Section for Body Part
        if (originalItem.sectionId && questionSectionList.length > 0) {
          const sectionOption = questionSectionList.find(section => section.sectionId === originalItem.sectionId);
          if (sectionOption) {
            formik.setFieldValue("sectionForBodyPart", {
              value: sectionOption.sectionId,
              label: sectionOption.sectionName
            });
          }
        }

        // Set Body Part Name
        if (originalItem.bodyPartId && questionBodyPart.length > 0) {
          const bodyPartOption = questionBodyPart.find(bp => bp.bodyPartId === originalItem.bodyPartId);
          if (bodyPartOption) {
            formik.setFieldValue("bodyPart", {
              value: bodyPartOption.bodyPartId,
              label: bodyPartOption.bodyPartName
            });
          }
        }

        // Set Section (for subsections)
        if (originalItem.sectionId && questionSectionList.length > 0) {
          const sectionOption = questionSectionList.find(section => section.sectionId === originalItem.sectionId);
          if (sectionOption) {
            formik.setFieldValue("section", {
              value: sectionOption.sectionId,
              label: sectionOption.sectionName
            });
          }
        }

        // Set Sub Section
        if (originalItem.clinicalRubricViewList && originalItem.clinicalRubricViewList.length > 0) {
          const subSectionOptions = originalItem.clinicalRubricViewList.map(rubric => ({
            value: rubric.subsectionID,
            label: rubric.subsectionName
          }));

          // Get subsections for the selected section
          if (originalItem.sectionId) {
            dispatch(getSubSectionForClinicalQuestion(originalItem.sectionId));
          }

          formik.setFieldValue("subSection", subSectionOptions);
        }
      } else {
        // For non-location type, populate question-specific fields

        // Set Question
        if (originalItem.keywordQuestion) {
          formik.setFieldValue("question", originalItem.keywordQuestion);
        }

        // Set Section (for subsections)
        if (originalItem.sectionId && questionSectionList.length > 0) {
          const sectionOption = questionSectionList.find(section => section.sectionId === originalItem.sectionId);
          if (sectionOption) {
            formik.setFieldValue("section", {
              value: sectionOption.sectionId,
              label: sectionOption.sectionName
            });
          }
        }

        // Set Sub Section
        if (originalItem.clinicalRubricViewList && originalItem.clinicalRubricViewList.length > 0) {
          const subSectionOptions = originalItem.clinicalRubricViewList.map(rubric => ({
            value: rubric.subsectionID,
            label: rubric.subsectionName
          }));

          // Get subsections for the selected section
          if (originalItem.sectionId) {
            dispatch(getSubSectionForClinicalQuestion(originalItem.sectionId));
          }

          formik.setFieldValue("subSection", subSectionOptions);
        }
      }

    } catch (error) {
      console.error('Error editing item:', error);
    }
  };

  // Update final request based on current table data
  const updateFinalRequestFromTableData = () => {
    const clinicalQuestionList = [];
    const clinicalBodyPartList = [];

    tableData.forEach(item => {
      if (formik.values.subQuestionGroup?.label?.toLowerCase() !== 'location') {
        // For non-location type
        clinicalQuestionList.push({
          clinicalQuestionKeywordID: item.originalItem?.clinicalQueKeywordId || 0,
          questionID: location.state.selectedClinicalQuestion.questionsId,
          keyWords: item.originalItem?.keywordQuestion || item.question,
          clinicalQuestionRubricList: item.originalItem?.clinicalRubricViewList?.map(rubric => ({
            subsectionID: rubric.subsectionID,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
          })) || []
        });
      } else {
        // For location type
        clinicalBodyPartList.push({
          clinicalQuestionBodyPartID: item.originalItem?.clinicalQuestionBodyPartId || 0,
          questionID: location.state.selectedClinicalQuestion.questionsId,
          bodypartID: item.originalItem?.bodyPartId || item.originalItem?.bodyPartId,
          clinicalBodyPartRubricList: item.originalItem?.clinicalRubricViewList?.map(rubric => ({
            subsectionID: rubric.subsectionID,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
          })) || []
        });
      }
    });

    const requestData = {
      questionsId: location.state.selectedClinicalQuestion.questionsId,
      questionSectionID: formik.values.existance?.value,
      questionGroupId: formik.values.questionGroup?.value,
      questionSubGroupID: formik.values.subQuestionGroup?.value,
      qbType: formik.values.subQuestionGroup?.label?.toLowerCase() === 'location' ? 0 : 1,
      clinicalQuestionList: clinicalQuestionList,
      clinicalBodyPartList: clinicalBodyPartList
    };

    setSendArrayToApi(requestData);
    setFinalRequest(requestData);
  };

  // Build API request like EditClinicalQuestionsComponent
  const buildApiRequest = () => {
    const clinicalQuestionList = [];
    const clinicalBodyPartList = [];

    tableData.forEach(item => {
      if (formik.values.subQuestionGroup?.label?.toLowerCase() !== 'location') {
        // For non-location type
        clinicalQuestionList.push({
          clinicalQuestionKeywordID: item.originalItem?.clinicalQueKeywordId || 0,
          questionID: location.state.selectedClinicalQuestion.questionsId,
          keyWords: item.originalItem?.keywordQuestion || item.question,
          clinicalQuestionRubricList: item.originalItem?.clinicalRubricViewList?.map(rubric => ({
            subsectionID: rubric.subsectionID,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
          })) || []
        });
      } else {
        // For location type
        clinicalBodyPartList.push({
          clinicalQuestionBodyPartID: item.originalItem?.clinicalQuestionBodyPartId || 0,
          questionID: location.state.selectedClinicalQuestion.questionsId,
          bodypartID: item.originalItem?.bodyPartId || item.originalItem?.bodyPartId,
          clinicalBodyPartRubricList: item.originalItem?.clinicalRubricViewList?.map(rubric => ({
            subsectionID: rubric.subsectionID,
            clinicalQuestionBodyPartID: 0,
            clinicalQuestionRubricID: rubric.clinicalQuestionRubricID || 0
          })) || []
        });
      }
    });

    return {
      questionsId: location.state.selectedClinicalQuestion.questionsId,
      questionSectionID: formik.values.existance?.value,
      questionGroupId: formik.values.questionGroup?.value,
      questionSubGroupID: formik.values.subQuestionGroup?.value,
      qbType: formik.values.subQuestionGroup?.label?.toLowerCase() === 'location' ? 0 : 1,
      clinicalQuestionList: clinicalQuestionList,
      clinicalBodyPartList: clinicalBodyPartList
    };
  };

  document.title = "Edit Clinical Question";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
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
                    <h4 className="card-title mb-0 flex-grow-1">Edit Clinical Question</h4>
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
                            />
                            {formik.touched.subQuestionGroup && formik.errors.subQuestionGroup ? (
                              <FormFeedback>{formik.errors.subQuestionGroup}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      {console.log("Sub question group value:", formik.values?.subQuestionGroup?.label)}
                      {formik.values?.subQuestionGroup?.label?.toLowerCase() !== "location" ? (
                        <Row className='mt-3'>
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
                                invalid={formik.touched.question && formik.errors.question ? true : false}
                              />
                              {formik.touched.question && formik.errors.question ? (
                                <FormFeedback>{formik.errors.question}</FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        <Row className='mt-3'>
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
                              />
                              {formik.touched.bodyPart && formik.errors.bodyPart ? (
                                <FormFeedback>{formik.errors.bodyPart}</FormFeedback>
                              ) : null}
                            </div>
                          </Col>
                        </Row>
                      )}

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
                            />
                            {formik.touched.subSection && formik.errors.subSection ? (
                              <FormFeedback>{formik.errors.subSection}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div className="d-inline-flex gap-2 mt-4">
                            <button
                              type="button"
                              onClick={addSelectedSubSectionQuestions}
                              disabled={formik.values?.subSection?.length === 0}
                              className="btn btn-soft-info btn-sm mt-2"
                            >
                              <i className="ri-add-line align-middle"></i> Add Sub Section
                            </button>
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <table className="table table-responsive table-bordered table-nowrap">
                            <thead>
                              <tr>
                                <th scope="col">Question</th>
                                <th scope="col">Edit</th>
                                <th scope="col">Sub Section Name</th>
                                <th scope="col">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.length > 0 ?
                                tableData.map((row, index) => (
                                  <React.Fragment key={index}>
                                    {row.subSections.map((subSection, subIndex) => (
                                      <tr key={`${index}-${subIndex}`}>
                                        {subIndex === 0 ? (
                                          <td rowSpan={row.subSections.length}>{formik.values.subQuestionGroup?.label?.toLowerCase() !== "location" ? row.question : row.bodyPartName}</td>
                                        ) : null}
                                        {subIndex === 0 ? (
                                          <td rowSpan={row.subSections.length} className='text-center'>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-primary"
                                              onClick={async () => {
                                                console.log('Edit item:', row);
                                                await handleEditItem(row);
                                              }}
                                              title="Edit this item"
                                            >
                                              <i className="ri-pencil-line" />
                                            </button>
                                          </td>
                                        ) : null}
                                        <td>{subSection}</td>
                                        <td className='text-center'>
                                          <div className="remove">
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-soft-danger remove-item-btn"
                                              onClick={() => deleteSubSection(index, subIndex)}
                                              title="Remove this sub-section"
                                            >
                                              <i className="ri-delete-bin-5-line" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                )) :
                                <tr>
                                  <td colSpan="4" className="text-center">No data available</td>
                                </tr>
                              }
                            </tbody>
                          </table>
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
                          <Link to="/admin/listclinincalquestion">
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

export default EditClinicalQuestion;