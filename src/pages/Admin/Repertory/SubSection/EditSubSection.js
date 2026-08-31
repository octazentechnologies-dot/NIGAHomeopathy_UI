import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Button } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import { AsyncPaginate } from 'react-select-async-paginate';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage, useFormik } from 'formik';
import * as Yup from 'yup';
import { getSectionForSubSectionList, getSubSectionBySectionList, updateSubSection, getLanguages, getSubSectionById, deleteReferenceRubricDetails, deleteSubSectionLanguageDetails } from '../../../../slices/admin/repertory/subsection/thunk';
import { setSubSectionError, setSubSectionSuccess } from '../../../../slices/admin/repertory/subsection/reducer';
import { getSubSectionBySection } from '../../../../helpers/realbackend_helper';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SUB_SECTION_OPTIONS_PAGE_SIZE = 20;

const loadPaginatedSubSectionOptions = (subSectionList, search, prevOptions) => {
  const options = (subSectionList || []).map((subSection) => ({
    value: subSection.subSectionId,
    label: subSection.subSectionName,
  }));

  const searchLower = (search || '').toLowerCase();
  const filteredOptions = searchLower
    ? options.filter(({ label }) => label.toLowerCase().includes(searchLower))
    : options;

  const hasMore = filteredOptions.length > prevOptions.length + SUB_SECTION_OPTIONS_PAGE_SIZE;
  const slicedOptions = filteredOptions.slice(
    prevOptions.length,
    prevOptions.length + SUB_SECTION_OPTIONS_PAGE_SIZE
  );

  return { options: slicedOptions, hasMore };
};

const EditSubSection = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const [selectedSubSection, setSelectedSubSection] = useState(location.state?.selectedSubSection || null);

  // console.log(`selectedSubSection = `, selectedSubSection)

  // Redux state
  const { sectionForSubSection, subSectionBySection, languages, subSectionError, subSectionSuccess, subSectionById } = useSelector((state) => state.SubSection);

  // Dropdown options
  const sectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  // console.log(sectionOptions)

  const languageOptions = languages?.map((language) => ({
    label: language.languageName,
    value: language.languageId,
  })) || [];



  // Local state
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedParentSubSection, setSelectedParentSubSection] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedReferenceSection, setSelectedReferenceSection] = useState(null);
  const [referenceSubSectionLoading, setReferenceSubSectionLoading] = useState(false);
  const [languageReferences, setLanguageReferences] = useState([]);
  const parentSubSectionListRef = useRef([]);
  const referenceSubSectionListRef = useRef([]);
  const referenceSubSectionCacheRef = useRef({});
  const [referenceRubrics, setReferenceRubrics] = useState([]);
  const [languageError, setLanguageError] = useState('');
  const [deletingRubricIndex, setDeletingRubricIndex] = useState(null);
  const [deletingLanguageIndex, setDeletingLanguageIndex] = useState(null);

  // console.log(sectionOptions.find(option => option.value === selectedSubSection.sectionId))

  // Fetch subsection by ID if not present in location.state
  useEffect(() => {
    if (selectedSubSection && !selectedSubSection.subSectionLanguageDetails) {
      // console.log('in if selectedSubSection =', selectedSubSection?.subSectionId)
      dispatch(getSubSectionById(selectedSubSection?.subSectionId)).then((res) => {
        // console.log('res =', res)
        setSelectedSubSection(res);
      });
    }
  }, [selectedSubSection, dispatch]);

  const initialValues = useMemo(() => ({
    sectionName: sectionOptions.find(option => option.value === selectedSubSection?.sectionId),
    subSectionName: selectedSubSection?.subSectionName || '',
    subSectionAlias: selectedSubSection?.subSectionNameAlias || '',
    description: selectedSubSection?.description || '',
    parentSubSection: selectedSubSection?.parentSubSectionId ? {
      value: selectedSubSection.parentSubSectionId,
      label: selectedSubSection.parentSubSectionName,
    } : null,
    mainParentSubsection: selectedSubSection?.mainParentSubsection || false,
    referenceSection: null,
    referenceSubSections: null,
    languageName: null,
    languageDetails: '',
  }), [selectedSubSection, sectionOptions]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema: Yup.object().shape({
      sectionName: Yup.object().required('Section Name is required'),
      subSectionName: Yup.string().required('Sub Section Name is required'),
      subSectionAlias: Yup.string(),
      description: Yup.string(),
      parentSubSection: Yup.object().nullable(),
      referenceSection: Yup.object().nullable(),
      referenceSubSections: Yup.object().nullable(),
      languageName: Yup.object().nullable(),
      languageDetails: Yup.string(),
    }),
    onSubmit: (values) => {
      const formData = {
        subSectionId: selectedSubSection.subSectionId,
        sectionId: values.sectionName.value,
        sectionName: values.sectionName.label,
        parentSubSectionId: values.parentSubSection?.value || null,
        parentSubSectionName: values.parentSubSection?.label || null,
        subSectionName: values.subSectionName,
        subSectionNameAlias: values.subSectionAlias,
        description: values.description,
        mainParentSubsection: Boolean(values.mainParentSubsection),
        enteredBy: userDetails.userId,
        changedBy: userDetails.userId,
        deleteStatus: false,
        referencerubric: referenceRubrics,
        subSectionLanguageDetails: languageReferences
      };

      console.log('formData =', JSON.stringify(formData))
      dispatch(updateSubSection([formData]));
    }
  });


  useEffect(() => {
    dispatch(getSectionForSubSectionList(null));
    dispatch(getLanguages(null));

    if (selectedSubSection && selectedSubSection.sectionId) {
      // Set initial parent subsection if exists
      if (selectedSubSection.parentSubSectionId) {
        setSelectedParentSubSection({
          value: selectedSubSection.parentSubSectionId,
          label: selectedSubSection.parentSubSectionName
        });
      }

      // Get subsections for the selected section
      dispatch(getSubSectionBySectionList({ sectionId: selectedSubSection.sectionId }));
    }
  }, [selectedSubSection?.sectionId]);

  useEffect(() => {
    // console.log('subSectionById =', subSectionById);
    if (subSectionById) {
      // Set initial reference rubrics
      if (subSectionById.referencerubric) {
        // console.log('subSectionById.referencerubric =', subSectionById.referencerubric);
        setReferenceRubrics(subSectionById.referencerubric || []);
      }

      // Set initial language references
      if (subSectionById.subSectionLanguageDetails) {
        // console.log('subSectionById.subSectionLanguageDetails =', subSectionById.subSectionLanguageDetails);
        setLanguageReferences(subSectionById.subSectionLanguageDetails || []);
      }
    }

  }, [subSectionById]);

  useEffect(() => {
    parentSubSectionListRef.current = subSectionBySection || [];
  }, [subSectionBySection]);

  const loadParentSubSectionOptions = useCallback((search, prevOptions) => {
    return loadPaginatedSubSectionOptions(parentSubSectionListRef.current, search, prevOptions);
  }, []);

  const loadReferenceSubSectionOptions = useCallback((search, prevOptions) => {
    return loadPaginatedSubSectionOptions(referenceSubSectionListRef.current, search, prevOptions);
  }, []);

  useEffect(() => {
    if (subSectionSuccess) {
      // Show success modal and redirect to list with success state
      // This will only trigger for main operations like update, not for delete operations
      dispatch(setSubSectionSuccess(null));
      navigate('/admin/listsubsection', { state: { updated: true } });
    }
    if (subSectionError) {
      // Clear error flag after brief delay to allow any UI message to be seen
      setTimeout(() => {
        dispatch(setSubSectionError(null));
      }, 1500);
    }
  }, [subSectionSuccess, subSectionError]);

  const handleSectionChange = (selectedOption) => {
    setSelectedSection(selectedOption);
    if (selectedOption) {
      dispatch(getSubSectionBySectionList({ sectionId: selectedOption.value }));
    }
  };

  const handleReferenceSectionChange = async (selectedOption) => {
    setSelectedReferenceSection(selectedOption);
    formik.setFieldValue('referenceSubSections', null);

    if (!selectedOption) {
      referenceSubSectionListRef.current = [];
      return;
    }

    const sectionId = selectedOption.value;
    const cachedList = referenceSubSectionCacheRef.current[sectionId];

    if (cachedList) {
      referenceSubSectionListRef.current = cachedList;
      return;
    }

    setReferenceSubSectionLoading(true);
    try {
      const response = await getSubSectionBySection({ sectionId });
      const list = Array.isArray(response) ? response : [];
      referenceSubSectionCacheRef.current[sectionId] = list;
      referenceSubSectionListRef.current = list;
    } catch (error) {
      referenceSubSectionListRef.current = [];
      toast.error('Failed to load reference sub sections', { autoClose: 3000 });
    } finally {
      setReferenceSubSectionLoading(false);
    }
  };

  const handleAddLanguageReference = () => {
    if (selectedLanguage && document.getElementById('languageDetails').value) {
      // Check if language already exists
      const languageExists = languageReferences.some(
        ref => ref.languageId === selectedLanguage.value
      );

      if (languageExists) {
        setLanguageError('This language has already been added');
        return;
      }

      const newReference = {
        languageId: selectedLanguage.value,
        languageName: selectedLanguage.label,
        subSectionDetails: document.getElementById('languageDetails').value
      };
      setLanguageReferences([...languageReferences, newReference]);
      setSelectedLanguage(null);
      document.getElementById('languageDetails').value = '';
      setLanguageError('');
    }
  };



  const handleRemoveLanguageReference = async (index) => {
    try {
      // Validate index bounds
      if (index < 0 || index >= languageReferences.length) {
        toast.error("Invalid language index", { autoClose: 3000 });
        return;
      }

      const languageToRemove = languageReferences[index];
      
      if (languageToRemove && languageToRemove.subSectionLanguageId) {
        // Set loading state for this specific language
        setDeletingLanguageIndex(index);
        
        // Call API to delete language reference
        const response = await dispatch(deleteSubSectionLanguageDetails({
          subSectionLanguageId: languageToRemove.subSectionLanguageId
        }));
        
        console.log('Delete language reference API response:', response);
        
        // Check if response exists and handle different success scenarios
        if (response) {
          // Check if response indicates success (handle different API response formats)
          const isSuccess = response.success !== false && response.status !== 'error' && response.error !== true;
          
          if (isSuccess) {
            // Remove from local state after successful API call
            setLanguageReferences(prevReferences => {
              return prevReferences.filter((_, i) => i !== index);
            });
            toast.success("Language Reference deleted successfully", { autoClose: 3000 });
          } else {
            // API returned an error response
            const errorMessage = response.message || response.errorMessage || "Failed to delete language reference";
            toast.error(errorMessage, { autoClose: 3000 });
          }
        } else {
          toast.error("Failed to delete language reference", { autoClose: 3000 });
        }
      } else {
        // If no subSectionLanguageId, just remove from local state (for newly added items)
        setLanguageReferences(prevReferences => {
          return prevReferences.filter((_, i) => i !== index);
        });
        toast.success("Language Reference removed from form", { autoClose: 3000 });
      }
    } catch (error) {
      console.error('Error removing language reference:', error);
      toast.error("Error deleting language reference", { autoClose: 3000 });
      // Error will be handled by Redux state (subSectionError)
    } finally {
      // Clear loading state
      setDeletingLanguageIndex(null);
    }
  };

  const handleRemoveReferenceRubric = async (index) => {
    try {
      // Validate index bounds
      if (index < 0 || index >= referenceRubrics.length) {
        toast.error("Invalid rubric index", { autoClose: 3000 });
        return;
      }

      const rubricToRemove = referenceRubrics[index];
      
      if (rubricToRemove && rubricToRemove.referenceRubricId) {
        // Set loading state for this specific rubric
        setDeletingRubricIndex(index);
        
        // Call API to delete reference rubric
        const response = await dispatch(deleteReferenceRubricDetails({
          referenceRubricId: rubricToRemove.referenceRubricId
        }));
        
        console.log('Delete reference rubric API response:', response);
        
        // Check if response exists and handle different success scenarios
        if (response) {
          // Check if response indicates success (handle different API response formats)
          const isSuccess = response.success !== false && response.status !== 'error' && response.error !== true;
          
          if (isSuccess) {
            // Remove from local state after successful API call
            setReferenceRubrics(prevRubrics => {
              return prevRubrics.filter((_, i) => i !== index);
            });
            toast.success("Reference Rubric deleted successfully", { autoClose: 3000 });
          } else {
            // API returned an error response
            const errorMessage = response.message || response.errorMessage || "Failed to delete reference rubric";
            toast.error(errorMessage, { autoClose: 3000 });
          }
        } else {
          toast.error("Failed to delete reference rubric", { autoClose: 3000 });
        }
      } else {
        // If no referenceRubricId, just remove from local state (for newly added items)
        setReferenceRubrics(prevRubrics => {
          return prevRubrics.filter((_, i) => i !== index);
        });
        toast.success("Reference Rubric removed from form", { autoClose: 3000 });
      }
    } catch (error) {
      console.error('Error removing reference rubric:', error);
      toast.error("Error deleting reference rubric", { autoClose: 3000 });
      // Error will be handled by Redux state (subSectionError)
    } finally {
      // Clear loading state
      setDeletingRubricIndex(null);
    }
  };

  document.title = "Edit Sub Section";

  // console.log('referenceRubrics =', referenceRubrics);
  console.log('languageOptions= ', languageOptions);


  if (!selectedSubSection) {
    return (
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <div className="text-center">
                <h4>No subsection selected for editing</h4>
                <Link to="/admin/listsubsection">
                  <Button color="primary" className="mt-3">Back to List</Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">Edit Sub Section</h4>
                </CardHeader>

                <CardBody className="card-body">
                  <Formik
                    initialValues={formik.initialValues}
                    validationSchema={formik.validationSchema}
                    onSubmit={formik.handleSubmit}
                  >
                    {({ errors, touched, setFieldValue }) => (
                      <Form className="live-preview">
                        <Row className="gy-4">
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="sectionName" className="form-label">Section Name</Label>
                              <Select
                              isDisabled={true}
                                name="sectionName"
                                value={formik.values.sectionName}
                                onChange={(option) => {
                                  formik.setFieldValue('sectionName', option);
                                  handleSectionChange(option);
                                }}
                                options={sectionOptions}
                              />
                              <ErrorMessage name="sectionName" component="div" className="text-danger" />
                            </div>
                          </Col>

                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="subSectionName" className="form-label">Sub Section Name</Label>
                              <input
                             
                                type="text"
                                name="subSectionName"
                                className="form-control"
                                placeholder="Enter Sub Section Name"
                                value={formik.values.subSectionName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                              <ErrorMessage name="subSectionName" component="div" className="text-danger" />
                            </div>
                          </Col>

                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="subSectionAlias" className="form-label">Sub Section Alias</Label>
                              <input
                                type="text"
                                name="subSectionAlias"
                                className="form-control"
                                placeholder="Enter Sub Section Alias"
                                value={formik.values.subSectionAlias}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                            </div>
                          </Col>
                        </Row>

                        <Row className='mt-3'>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="parentSubSection" className="form-label">Parent Sub Section</Label>
                              <AsyncPaginate
                                key={`parent-${formik.values.sectionName?.value ?? 'none'}`}
                                name="parentSubSection"
                                value={formik.values.parentSubSection}
                                onChange={option => formik.setFieldValue('parentSubSection', option)}
                                loadOptions={loadParentSubSectionOptions}
                                debounceTimeout={200}
                                additional={{ page: 1 }}
                                isDisabled={!formik.values.sectionName}
                                placeholder="Select..."
                              />
                            </div>
                          </Col>

                          <Col xxl={8} md={8}>
                            <div>
                              <Label htmlFor="description" className="form-label">Description</Label>
                              <textarea
                                name="description"
                                className="form-control"
                                rows="1"
                                placeholder="Enter Description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                            </div>
                          </Col>
                        </Row>

                        <Row className='mt-3'>
                          <Col xxl={12} md={12}>
                            <div className="d-flex align-items-center">
                              <Label htmlFor="mainParentSubsection" className="form-label mb-0">Main Parent Subsection ? :</Label>
                              <Input
                                type="checkbox"
                                id="mainParentSubsection"
                                name="mainParentSubsection"
                                checked={formik.values.mainParentSubsection}
                                onChange={(e) => formik.setFieldValue("mainParentSubsection", e.target.checked)}
                                style={{ marginLeft: '1.25em' }}
                              />
                            </div>
                          </Col>
                        </Row>

                        <hr />

                        <Row className="g-4">
                          <Col className="col-sm">
                            <h4 className="card-title mb-0 flex-grow-1 mb-2">List of Reference Rubrics</h4>
                          </Col>
                        </Row>

                        <Row className="mt-3">
                          <Col xxl={4} md={4}>
                            <div className="mb-3">
                              <Label htmlFor="referenceSection" className="form-label">Reference Section Name</Label>
                              <Select
                                name="referenceSection"
                                value={formik.values.referenceSection}
                                onChange={option => {
                                  formik.setFieldValue('referenceSection', option);
                                  handleReferenceSectionChange(option);
                                }}
                                options={sectionOptions}
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="mb-3">
                              <Label htmlFor="referenceSubSections" className="form-label">Select Reference Sub Section</Label>
                              <AsyncPaginate
                                key={`reference-${formik.values.referenceSection?.value ?? 'none'}`}
                                name="referenceSubSections"
                                value={formik.values.referenceSubSections}
                                onChange={option => formik.setFieldValue('referenceSubSections', option)}
                                loadOptions={loadReferenceSubSectionOptions}
                                debounceTimeout={200}
                                additional={{ page: 1 }}
                                isDisabled={!formik.values.referenceSection || referenceSubSectionLoading}
                                isLoading={referenceSubSectionLoading}
                                placeholder={referenceSubSectionLoading ? 'Loading...' : 'Select...'}
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="d-inline-flex gap-2 mt-4">
                              <button
                                type="button"
                                className="btn btn-soft-info btn-sm mt-2"
                                onClick={() => {
                                  if (formik.values.referenceSection && formik.values.referenceSubSections) {
                                    const currentDate = new Date().toISOString();
                                    const newRubric = {
                                      changedBy: userDetails.userId,
                                      changedDate: null,
                                      deleteStatus: false,
                                      enteredBy: userDetails.userId,
                                      enteredDate: currentDate,
                                      refSubSectionId: formik.values.referenceSubSections.value,
                                      refSubSectionName: formik.values.referenceSubSections.label,
                                      referenceRubricId: 0, // Will be set by backend
                                      sectionId: formik.values.referenceSection.value,
                                      sectionName: formik.values.referenceSection.label,
                                      subSectionId: selectedSubSection.subSectionId
                                    };

                                    setReferenceRubrics(prevRubrics => {
                                      // Filter out any duplicates
                                      const existingRefSubSectionIds = prevRubrics.map(rubric => rubric.refSubSectionId);
                                      if (existingRefSubSectionIds.includes(newRubric.refSubSectionId)) {
                                        return prevRubrics; // Don't add if already exists
                                      }
                                      return [...prevRubrics, newRubric];
                                    });

                                    formik.setFieldValue('referenceSection', null);
                                    formik.setFieldValue('referenceSubSections', null);
                                  }
                                }}
                              >
                                <i className="ri-add-line align-middle"></i> Add Reference Rubrics
                              </button>
                            </div>
                          </Col>
                        </Row>

                        <Row className='mt-3'>
                          <Col xxl={12} md={12}>
                            <table className="table table-responsive table-bordered table-nowrap">
                              <thead>
                                <tr>
                                  <th scope="col">Reference Section Name</th>
                                  <th scope="col">Reference Sub Section Name</th>
                                  <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {referenceRubrics?.map((rubric, index) => (
                                  <tr key={index}>
                                    <td>{rubric.sectionName}</td>
                                    <td>{rubric.refSubSectionName}</td>
                                    <td className='text-center'>
                                      <div className="remove">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
                                          onClick={() => handleRemoveReferenceRubric(index)}
                                          disabled={deletingRubricIndex === index}
                                          title="Remove this reference"
                                        >
                                          {deletingRubricIndex === index ? (
                                            <Spinner size="sm" />
                                          ) : (
                                            <i className="ri-delete-bin-5-line" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Col>
                        </Row>

                        <hr />

                        <Row className="g-4">
                          <Col className="col-sm">
                            <h4 className="card-title mb-0 flex-grow-1 mb-2">Language Reference</h4>
                          </Col>
                        </Row>

                        <Row className="mt-3">
                          <Col xxl={4} md={4}>
                            <div className="mb-3">
                              <Label htmlFor="languageName" className="form-label">Language Name</Label>
                              <Select
                                name="languageName"
                                value={formik.values.languageName}
                                onChange={option => {
                                  formik.setFieldValue('languageName', option);
                                  setLanguageError('');
                                }}
                                options={languageOptions}
                              />
                              {languageError && <div className="text-danger mt-1">{languageError}</div>}
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="mb-3">
                              <Label htmlFor="languageDetails" className="form-label">Sub Section Details</Label>
                              <textarea
                                name="languageDetails"
                                className="form-control"
                                rows="1"
                                placeholder="Enter Sub Section Details"
                                value={formik.values.languageDetails}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="d-inline-flex gap-2 mt-4">
                              <button
                                type="button"
                                className="btn btn-soft-info btn-sm mt-2"
                                onClick={() => {
                                  if (formik.values.languageName && formik.values.languageDetails) {
                                    const languageExists = languageReferences.some(
                                      ref => ref.languageId === formik.values.languageName.value
                                    );
                                    if (languageExists) {
                                      setLanguageError('This language has already been added');
                                      return;
                                    }
                                    const newReference = {
                                      languageId: formik.values.languageName.value,
                                      languageName: formik.values.languageName.label,
                                      subSectionDetails: formik.values.languageDetails
                                    };
                                    setLanguageReferences([...languageReferences, newReference]);
                                    formik.setFieldValue('languageName', null);
                                    formik.setFieldValue('languageDetails', '');
                                    setLanguageError('');
                                  }
                                }}
                              >
                                <i className="ri-add-line align-middle"></i> Add Language Reference
                              </button>
                            </div>
                          </Col>
                        </Row>

                        <Row className='mt-3'>
                          <Col xxl={12} md={12}>
                            <table className="table table-responsive table-bordered table-nowrap">
                              <thead>
                                <tr>
                                  <th scope="col">Language</th>
                                  <th scope="col">Language Details</th>
                                  <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {languageReferences?.map((reference, index) => (
                                  <tr key={index}>
                                    <td>{reference.languageName}</td>
                                    <td>{reference.subSectionDetails}</td>
                                    <td className='text-center'>
                                      <div className="remove">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
                                          onClick={() => handleRemoveLanguageReference(index)}
                                          disabled={deletingLanguageIndex === index}
                                          title="Remove this language"
                                        >
                                          {deletingLanguageIndex === index ? (
                                            <Spinner size="sm" />
                                          ) : (
                                            <i className="ri-delete-bin-5-line" />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Col>
                        </Row>

                        <CardFooter className="gap-2">
                          <Row className="g-4">
                            <Col className="col-sm">
                              <div className="d-flex justify-content-sm-start">
                              </div>
                            </Col>
                            <Col className="col-sm-auto">
                              <div className="d-inline-flex gap-2">
                                <Link to="/admin/listsubsection">
                                  <Button color="danger" className="btn-label">
                                    <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                                  </Button>
                                </Link>
                                <Button type="submit" color="success" className="btn-label">
                                  <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </CardFooter>
                      </Form>
                    )}
                  </Formik>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <ToastContainer closeButton={false} limit={1} />
    </React.Fragment>
  );
};

export default EditSubSection;