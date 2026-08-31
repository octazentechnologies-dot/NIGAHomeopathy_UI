import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Button } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getSectionForSubSectionList, getSubSectionBySectionList, createSubSection, getLanguages } from '../../../../slices/admin/repertory/subsection/thunk';
import { setSubSectionError, setSubSectionSuccess } from '../../../../slices/admin/repertory/subsection/reducer';

const AddSubSection = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Redux state
  const { sectionForSubSection, subSectionBySection, languages, subSectionError, subSectionSuccess } = useSelector((state) => state.SubSection);

  // Local state
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedParentSubSection, setSelectedParentSubSection] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedReferenceSection, setSelectedReferenceSection] = useState(null);
  const [selectedReferenceSubSections, setSelectedReferenceSubSections] = useState([]);
  const [languageReferences, setLanguageReferences] = useState([]);
  const [referenceRubrics, setReferenceRubrics] = useState([]);
  const [languageError, setLanguageError] = useState('');

  // Lazy loading state for SubSection dropdowns
  const [displayedParentSubSectionCount, setDisplayedParentSubSectionCount] = useState(10);
  const [displayedReferenceSubSectionCount, setDisplayedReferenceSubSectionCount] = useState(10);
  const ITEMS_PER_LOAD = 10;

  const formikRef = React.useRef(null);

  const initialValues = {
    sectionName: null,
    subSectionName: '',
    subSectionAlias: '',
    description: '',
    mainParentSubsection: false,
  };

  const validationSchema = Yup.object().shape({
    sectionName: Yup.object().required('Section Name is required'),
    subSectionName: Yup.string().required('Sub Section Name is required'),
    subSectionAlias: Yup.string(),
    description: Yup.string(),
  });

  // Dropdown options
  const sectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  // Full options for subsections
  const AllParentSubSectionOptions = subSectionBySection?.map((subSection) => ({
    label: subSection.subSectionName,
    value: subSection.subSectionId,
  })) || [];

  const AllReferenceSubSectionOptions = subSectionBySection?.map((subSection) => ({
    label: subSection.subSectionName,
    value: subSection.subSectionId,
  })) || [];

  // Lazy loaded options (only show limited items)
  const parentSubSectionOptions = AllParentSubSectionOptions.slice(0, displayedParentSubSectionCount);
  const referenceSubSectionOptions = AllReferenceSubSectionOptions.slice(0, displayedReferenceSubSectionCount);

  const languageOptions = languages?.map((language) => ({
    label: language.languageName,
    value: language.languageId,
  })) || [];

  useEffect(() => {
    dispatch(getSectionForSubSectionList(null));
    dispatch(getLanguages(null));
  }, []);

  const handleSectionChange = (selectedOption) => {
    setSelectedSection(selectedOption);
    setSelectedParentSubSection(null); // Reset parent subsection when section changes
    setDisplayedParentSubSectionCount(ITEMS_PER_LOAD); // Reset lazy load count
    if (selectedOption) {
      dispatch(getSubSectionBySectionList({ sectionId: selectedOption.value }));
    }
  };

  const handleReferenceSectionChange = (selectedOption) => {
    setSelectedReferenceSection(selectedOption);
    setSelectedReferenceSubSections([]); // Reset reference subsections when section changes
    setDisplayedReferenceSubSectionCount(ITEMS_PER_LOAD); // Reset lazy load count
    if (selectedOption) {
      dispatch(getSubSectionBySectionList({ sectionId: selectedOption.value }));
    }
  };

  // Handle Parent SubSection menu scroll to bottom
  const handleParentSubSectionMenuScrollToBottom = () => {
    if (displayedParentSubSectionCount < AllParentSubSectionOptions.length) {
      setDisplayedParentSubSectionCount(prev => prev + ITEMS_PER_LOAD);
    }
  };

  // Handle Reference SubSection menu scroll to bottom
  const handleReferenceSubSectionMenuScrollToBottom = () => {
    if (displayedReferenceSubSectionCount < AllReferenceSubSectionOptions.length) {
      setDisplayedReferenceSubSectionCount(prev => prev + ITEMS_PER_LOAD);
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
      setLanguageError(''); // Clear any previous error
    }
  };

  const handleAddReferenceRubric = () => {
    if (selectedReferenceSection && selectedReferenceSubSections.length > 0) {
      setReferenceRubrics(prevRubrics => {
        // Check if section already exists
        const existingSectionIndex = prevRubrics.findIndex(
          rubric => rubric.sectionId === selectedReferenceSection.value
        );

        if (existingSectionIndex !== -1) {
          // Section exists, add new subsections to it
          const updatedRubrics = [...prevRubrics];
          const existingSection = updatedRubrics[existingSectionIndex];

          // Filter out any subsections that already exist
          const newSubSections = selectedReferenceSubSections.filter(
            newSub => !existingSection.subSections.some(
              existingSub => existingSub.subSectionId === newSub.value
            )
          );

          // Add new subsections to existing section
          existingSection.subSections = [
            ...existingSection.subSections,
            ...newSubSections.map(sub => ({
              subSectionId: sub.value,
              subSectionName: sub.label
            }))
          ];

          return updatedRubrics;
        } else {
          // Section doesn't exist, create new entry
          const newRubric = {
            sectionId: selectedReferenceSection.value,
            sectionName: selectedReferenceSection.label,
            subSections: selectedReferenceSubSections.map(sub => ({
              subSectionId: sub.value,
              subSectionName: sub.label
            }))
          };
          return [...prevRubrics, newRubric];
        }
      });

      // Reset selections
      setSelectedReferenceSection(null);
      setSelectedReferenceSubSections([]);
    }
  };

  const handleRemoveLanguageReference = (index) => {
    setLanguageReferences(languageReferences.filter((_, i) => i !== index));
  };

  const handleRemoveReferenceRubric = (sectionIndex, subSectionIndex) => {
    setReferenceRubrics(prevRubrics => {
      const updatedRubrics = [...prevRubrics];
      const section = updatedRubrics[sectionIndex];

      if (section.subSections.length === 1) {
        // If this is the last subsection, remove the entire section
        return updatedRubrics.filter((_, index) => index !== sectionIndex);
      } else {
        // Remove only the specific subsection
        section.subSections = section.subSections.filter((_, index) => index !== subSectionIndex);
        return updatedRubrics;
      }
    });
  };

  useEffect(() => {
    if (subSectionSuccess) {
      // Reset Formik form
      formikRef.current?.resetForm();

      // Reset local UI states
      setSelectedSection(null);
      setSelectedParentSubSection(null);
      setSelectedLanguage(null);
      setSelectedReferenceSection(null);
      setSelectedReferenceSubSections([]);
      setLanguageReferences([]);
      setReferenceRubrics([]);
      setLanguageError('');

      // Clear language details textarea if present
      const detailsEl = document.getElementById('languageDetails');
      if (detailsEl) detailsEl.value = '';

      // Clear success flag so it does not re-trigger
      dispatch(setSubSectionSuccess(null));
      // Optionally clear previous error
      if (subSectionError) {
        dispatch(setSubSectionError(null));
      }

      // Redirect to list with success flag
      navigate('/admin/listsubsection', { state: { added: true } });
    }
  }, [subSectionSuccess, subSectionError]);

  document.title = "Add Sub Section";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">New Sub Section</h4>
                </CardHeader>

                <CardBody className="card-body">
                  <Formik
                    innerRef={formikRef}
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={(values) => {
                      const nowIso = new Date().toISOString();
                      const referencerubricPayload = referenceRubrics.flatMap(rubric =>
                        (rubric.subSections || []).map(sub => ({
                          referenceRubricId: 0,
                          sectionId: rubric.sectionId,
                          sectionName: rubric.sectionName,
                          subSectionId: 0,
                          refSubSectionId: sub.subSectionId,
                          enteredBy: userDetails.userId,
                          enteredDate: nowIso,
                          changedBy: userDetails.userId,
                          changedDate: nowIso,
                          deleteStatus: false,
                          refSubSectionName: sub.subSectionName
                        }))
                      );
                      const Object = {
                        sectionId: values.sectionName.value,
                        sectionName: values.sectionName.label,
                        parentSubSectionId: selectedParentSubSection?.value || null,
                        parentSubSectionName: selectedParentSubSection?.label || null,
                        subSectionName: values.subSectionName,
                        subSectionNameAlias: values.subSectionAlias,
                        description: values.description,
                        mainParentSubsection: Boolean(values.mainParentSubsection),
                        enteredBy: userDetails.userId,
                        changedBy: userDetails.userId,
                        deleteStatus: false,
                        referencerubric: referencerubricPayload,
                        subSectionLanguageDetails: languageReferences
                      };

                      dispatch(createSubSection([Object]));
                    }}
                  >
                    {({ errors, touched, setFieldValue, values }) => (
                      <Form className="live-preview">
                        <Row className="gy-4">
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="sectionName" className="form-label">Section Name</Label>
                              <Select
                                name="sectionName"
                                value={values.sectionName}
                                onChange={(option) => {
                                  setFieldValue('sectionName', option);
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
                              <Field
                                type="text"
                                name="subSectionName"
                                className="form-control"
                                placeholder="Enter Sub Section Name"
                              />
                              <ErrorMessage name="subSectionName" component="div" className="text-danger" />
                            </div>
                          </Col>

                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="subSectionAlias" className="form-label">Sub Section Alias</Label>
                              <Field
                                type="text"
                                name="subSectionAlias"
                                className="form-control"
                                placeholder="Enter Sub Section Alias"
                              />
                            </div>
                          </Col>
                        </Row>

                        <Row className='mt-3'>
                          <Col xxl={4} md={4}>
                            <div>
                              <Label htmlFor="parentSubSection" className="form-label">
                                Parent Sub Section
                                {AllParentSubSectionOptions.length > displayedParentSubSectionCount && (
                                  <small className="text-muted ms-2">
                                    (Showing {parentSubSectionOptions.length} of {AllParentSubSectionOptions.length})
                                  </small>
                                )}
                              </Label>
                              <Select
                                value={selectedParentSubSection}
                                onChange={setSelectedParentSubSection}
                                options={parentSubSectionOptions}
                                onMenuScrollToBottom={handleParentSubSectionMenuScrollToBottom}
                                isDisabled={!values.sectionName}
                              />
                            </div>
                          </Col>

                          <Col xxl={8} md={8}>
                            <div>
                              <Label htmlFor="description" className="form-label">Description</Label>
                              <Field
                                as="textarea"
                                name="description"
                                className="form-control"
                                rows="1"
                                placeholder="Enter Description"
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
                                checked={values.mainParentSubsection}
                                onChange={(e) => setFieldValue("mainParentSubsection", e.target.checked)}
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
                                value={selectedReferenceSection}
                                onChange={handleReferenceSectionChange}
                                options={sectionOptions}
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="mb-3">
                              <Label htmlFor="referenceSubSection" className="form-label">
                                Select Reference Sub Section
                                {AllReferenceSubSectionOptions.length > displayedReferenceSubSectionCount && (
                                  <small className="text-muted ms-2">
                                    (Showing {referenceSubSectionOptions.length} of {AllReferenceSubSectionOptions.length})
                                  </small>
                                )}
                              </Label>
                              <Select
                                isMulti
                                value={selectedReferenceSubSections}
                                onChange={setSelectedReferenceSubSections}
                                options={referenceSubSectionOptions}
                                onMenuScrollToBottom={handleReferenceSubSectionMenuScrollToBottom}
                                isDisabled={!selectedReferenceSection}
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="d-inline-flex gap-2 mt-4">
                              <button
                                type="button"
                                className="btn btn-soft-info btn-sm mt-2"
                                onClick={handleAddReferenceRubric}
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
                                {referenceRubrics.map((rubric, sectionIndex) => (
                                  <React.Fragment key={sectionIndex}>
                                    {rubric.subSections.map((subSection, subSectionIndex) => (
                                      <tr key={`${sectionIndex}-${subSectionIndex}`}>
                                        {subSectionIndex === 0 ? (
                                          <td rowSpan={rubric.subSections.length}>{rubric.sectionName}</td>
                                        ) : null}
                                        <td>{subSection.subSectionName}</td>
                                        <td className='text-center'>
                                          <div className="remove">
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-soft-danger remove-item-btn"
                                              onClick={() => handleRemoveReferenceRubric(sectionIndex, subSectionIndex)}
                                              title="Remove this reference"
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
                                value={selectedLanguage}
                                onChange={(option) => {
                                  setSelectedLanguage(option);
                                  setLanguageError(''); // Clear error when selection changes
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
                                id="languageDetails"
                                className="form-control"
                                rows="1"
                                placeholder="Enter Sub Section Details"
                              />
                            </div>
                          </Col>
                          <Col xxl={4} md={4}>
                            <div className="d-inline-flex gap-2 mt-4">
                              <button
                                type="button"
                                className="btn btn-soft-info btn-sm mt-2"
                                onClick={handleAddLanguageReference}
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
                                {languageReferences.map((reference, index) => (
                                  <tr key={index}>
                                    <td>{reference.languageName}</td>
                                    <td>{reference.subSectionDetails}</td>
                                    <td className='text-center'>
                                      <div className="remove">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-danger remove-item-btn"
                                          onClick={() => handleRemoveLanguageReference(index)}
                                        >
                                          <i className="ri-delete-bin-5-line" />
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
                                  <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
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
      
    </React.Fragment>
  );
};

export default AddSubSection;