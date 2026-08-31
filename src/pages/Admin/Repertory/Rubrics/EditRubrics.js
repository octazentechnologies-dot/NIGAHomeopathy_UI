import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Label, Row, Button, UncontrolledAlert, Spinner } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useDispatch, useSelector } from 'react-redux';
import { getAuthorForRubric, getSubSection, getRemedyGrades, getRemediesByGrade, updateRubric, getSectionForSubSection, getRubricRemedyBySectionIdGreadId } from '../../../../slices/admin/repertory/rubric/thunk';
import { setRubricError, setRubricSuccess } from '../../../../slices/admin/repertory/rubric/reducer';

const EditRubrics = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedGrade = location.state?.selectedGrade;
  console.log('location', location)
  console.log('selectedGrade', selectedGrade)
  const [authorRemedyList, setAuthorRemedyList] = useState([]);

  // Lazy loading state for SubSection dropdown
  const [displayedSubSectionCount, setDisplayedSubSectionCount] = useState(10);
  const ITEMS_PER_LOAD = 10;

  // Redux State
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const authorForRubric = useSelector((state) => state.Rubric.authorForRubric);
  const subSection = useSelector((state) => state.Rubric.subSection);
  const remedyGrades = useSelector((state) => state.Rubric.remedyGrades);
  const remediesByGrade = useSelector((state) => state.Rubric.remediesByGrade);
  const rubricRemedyData = useSelector((state) => state.Rubric.rubricRemedyData);
  const { rubricError, rubricSuccess, rubricsLoading } = useSelector((state) => state.Rubric);
  const rubricRemedyBySectionIdGreadId = useSelector((state) => state.Rubric.rubricRemedyBySectionIdGreadId);

  console.log('rubricRemedyBySectionIdGreadId', rubricRemedyBySectionIdGreadId)

  // Formik validation schema
  const validationSchema = Yup.object().shape({
    section: Yup.object().required('Section is required'),
    subSection: Yup.object().required('Sub Section is required'),
    grade: Yup.object().required('Grade is required'),
    // remedy: Yup.object().required('Remedy is required'),
    // authors: Yup.array().min(1, 'At least one author is required'),
  });

  // Formik initialization
  const formik = useFormik({
    initialValues: {
      section: null,
      subSection: null,
      grade: null,
      remedy: null,
      authors: [],
    },
    validationSchema,
    onSubmit: (values) => {
      // Format data according to API requirements
      const rubricData = {
        SectionId: values.section?.value,
        SubSectionId: values.subSection?.value,
        GradeId: values.grade?.value,
        rubricRemedyAuthorList: authorRemedyList.map(item => ({
          // If id is a number, it's from DB (existing), otherwise it's new (starts with 'new_')
          rubricRemedyId: typeof item.id === 'number' ? item.id : 0,
          remedyId: item.remedy.value,
          remedyName: item.remedy.label,
          rubricAuthorList: item.authors.map(author => ({
            remedyRubricAuthorId: 0, // Set to 0 for both new and existing during edit
            authorId: author.value,
            authorName: author.label
          }))
        }))
      };

      console.log('Submitting rubric data:', rubricData);
      dispatch(updateRubric(rubricData));
    },
  });

  // Prepare options for selects
  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  // Full SubSection options
  const AllSubSectionOptions = subSection?.map((section) => ({
    label: section.subSectionName,
    value: section.subSectionId,
  })) || [];

  // Lazy loaded SubSection options (only show limited items)
  const SubSectionOptions = AllSubSectionOptions.slice(0, displayedSubSectionCount);

  const GradeOptions = remedyGrades?.map((grade) => ({
    label: grade.gradeNo,
    value: grade.gradeId,
  })) || [];

  const AuthorForRubricOptions = authorForRubric?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];

  const RemediesByGradeOptions = remediesByGrade?.map((remedy) => ({
    label: remedy.remedyName,
    value: remedy.remedyId,
  })) || [];

  // Fetch initial data
  useEffect(() => {
    dispatch(getSectionForSubSection(null));
    dispatch(getRemedyGrades(null));
    dispatch(getAuthorForRubric(null));
    dispatch(getRubricRemedyBySectionIdGreadId({
      subSectionId: selectedGrade.subSectionId,
      gradeId: selectedGrade.gradeId
    }));
  }, []);

  // Set initial values when selectedGrade is available
  useEffect(() => {
    if (selectedGrade && SectionForSubSectionOptions.length > 0 && GradeOptions.length > 0 && rubricRemedyBySectionIdGreadId) {
      const sectionOption = SectionForSubSectionOptions.find(
        option => option.value === rubricRemedyBySectionIdGreadId.sectionId
      );
      const gradeOption = GradeOptions.find(
        option => option.value === rubricRemedyBySectionIdGreadId.gradeId
      );

      // Find in all subsection options to ensure we can find it even if not loaded yet
      const subSectionOption = AllSubSectionOptions.find(
        option => option.value === rubricRemedyBySectionIdGreadId.subSectionId
      );

      // If subsection exists but not displayed, load enough items to show it
      if (subSectionOption && !formik.values.subSection) {
        const subSectionIndex = AllSubSectionOptions.findIndex(
          option => option.value === rubricRemedyBySectionIdGreadId.subSectionId
        );
        if (subSectionIndex >= displayedSubSectionCount) {
          setDisplayedSubSectionCount(subSectionIndex + ITEMS_PER_LOAD);
        }
      }

      if (sectionOption && !formik.values.section) {
        formik.setFieldValue('section', sectionOption);
        dispatch(getSubSection(sectionOption.value));
      }
      if (gradeOption && !formik.values.grade) {
        formik.setFieldValue('grade', gradeOption);
        // Load remedies when grade is selected
        dispatch(getRemediesByGrade({
          SubSectionId: rubricRemedyBySectionIdGreadId.subSectionId,
          GradeId: rubricRemedyBySectionIdGreadId.gradeId
        }));
      }
      if (subSectionOption && !formik.values.subSection) {
        formik.setFieldValue('subSection', subSectionOption);
      }
    }
  }, [selectedGrade, SectionForSubSectionOptions, GradeOptions, AllSubSectionOptions, displayedSubSectionCount, formik.values.section, formik.values.grade, formik.values.subSection, rubricRemedyBySectionIdGreadId]);


  // Update authorRemedyList when rubricRemedyBySectionIdGreadId changes (load existing data)
  useEffect(() => {
    if (rubricRemedyBySectionIdGreadId?.rubricRemedyAuthorList && rubricRemedyBySectionIdGreadId.rubricRemedyAuthorList.length > 0) {
      const formattedList = rubricRemedyBySectionIdGreadId.rubricRemedyAuthorList.map(item => ({
        id: item.rubricRemedyId, // Keep the actual database ID
        remedy: {
          label: item.remedyName,
          value: item.remedyId
        },
        authors: item.rubricAuthorList ? item.rubricAuthorList.map(author => ({
          label: author.authorName,
          value: author.authorId
        })) : []
      }));
      setAuthorRemedyList(formattedList);
    }
  }, [rubricRemedyBySectionIdGreadId]);

  // Handle section change
  const handleSectionChange = (selectedOption) => {
    formik.setFieldValue('section', selectedOption);
    formik.setFieldValue('subSection', null); // Reset subsection when section changes
    setDisplayedSubSectionCount(ITEMS_PER_LOAD); // Reset lazy load count
    if (selectedOption) {
      dispatch(getSubSection(selectedOption.value));
    }
  };

  // Handle SubSection menu scroll to bottom
  const handleSubSectionMenuScrollToBottom = () => {
    if (displayedSubSectionCount < AllSubSectionOptions.length) {
      setDisplayedSubSectionCount(prev => prev + ITEMS_PER_LOAD);
    }
  };

  // Handle grade change
  const handleGradeChange = (selectedOption) => {
    formik.setFieldValue('grade', selectedOption);
    if (selectedOption && formik.values.subSection) {
      dispatch(getRemediesByGrade({
        SubSectionId: formik.values.subSection.value,
        GradeId: selectedOption.value
      }));
    }
  };

  // Add author and remedy to table
  const handleAddAuthorRemedy = () => {
    if (formik.values.remedy && formik.values.authors.length > 0) {
      const existingRemedyIndex = authorRemedyList.findIndex(
        item => item.remedy?.value === formik.values.remedy?.value
      );

      if (existingRemedyIndex === -1) {
        // New remedy - use temporary unique ID (will be converted to 0 on submit)
        const newItem = {
          id: `new_${Date.now()}_${Math.random()}`,
          remedy: formik.values.remedy,
          authors: formik.values.authors,
        };
        setAuthorRemedyList([...authorRemedyList, newItem]);
      } else {
        // Remedy already exists - add new authors to it
        const updatedList = [...authorRemedyList];
        const existingAuthors = updatedList[existingRemedyIndex].authors || [];
        const newAuthors = formik.values.authors.filter(
          newAuthor => !existingAuthors.some(existing => existing.value === newAuthor.value)
        );

        if (newAuthors.length > 0) {
          updatedList[existingRemedyIndex].authors = [...existingAuthors, ...newAuthors];
          setAuthorRemedyList(updatedList);
        }
      }

      formik.setFieldValue('remedy', null);
      formik.setFieldValue('authors', []);
    }
  };

  // Remove author and remedy from table
  const handleRemoveAuthorRemedy = (id, authorValue) => {
    setAuthorRemedyList(prevList => {
      return prevList.map(item => {
        if (item.id === id) {
          // Remove the specific author from this remedy
          const updatedAuthors = item.authors.filter(author => author.value !== authorValue);
          return { ...item, authors: updatedAuthors };
        }
        return item;
      }).filter(item => item.authors.length > 0); // Remove remedies with no authors left
    });
  };

  document.title = "Edit Rubrics";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {rubricError && (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {rubricError}
                    </UncontrolledAlert>
                  )}
                  {rubricSuccess && (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {rubricSuccess}
                    </UncontrolledAlert>
                  )}
                </div>
                <Form id="rubric-form" onSubmit={formik.handleSubmit}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Rubrics</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="section" className="form-label">Section Name</Label>
                            <Select
                              id="section"
                              name="section"
                              value={formik.values.section}
                              onChange={handleSectionChange}
                              options={SectionForSubSectionOptions}
                              isClearable
                              placeholder="Select Section"
                              className={formik.touched.section && formik.errors.section ? 'is-invalid' : ''}
                            />
                            {formik.touched.section && formik.errors.section && (
                              <FormFeedback type="invalid">{formik.errors.section}</FormFeedback>
                            )}
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="subSection" className="form-label">
                              Sub Section Name
                              {AllSubSectionOptions.length > displayedSubSectionCount && (
                                <small className="text-muted ms-2">
                                  (Showing {SubSectionOptions.length} of {AllSubSectionOptions.length})
                                </small>
                              )}
                            </Label>
                            <Select
                              id="subSection"
                              name="subSection"
                              value={formik.values.subSection}
                              onChange={(selected) => formik.setFieldValue('subSection', selected)}
                              options={SubSectionOptions}
                              onMenuScrollToBottom={handleSubSectionMenuScrollToBottom}
                              isClearable
                              placeholder="Select Sub Section"
                              isDisabled={!formik.values.section}
                              className={formik.touched.subSection && formik.errors.subSection ? 'is-invalid' : ''}
                            />
                            {formik.touched.subSection && formik.errors.subSection && (
                              <FormFeedback type="invalid">{formik.errors.subSection}</FormFeedback>
                            )}
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="grade" className="form-label">Grade</Label>
                            <Select
                              id="grade"
                              name="grade"
                              value={formik.values.grade}
                              onChange={handleGradeChange}
                              options={GradeOptions}
                              isClearable
                              placeholder="Select Grade"
                              className={formik.touched.grade && formik.errors.grade ? 'is-invalid' : ''}
                            />
                            {formik.touched.grade && formik.errors.grade && (
                              <FormFeedback type="invalid">{formik.errors.grade}</FormFeedback>
                            )}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="remedy" className="form-label">Select Remedy</Label>
                            <Select
                              id="remedy"
                              name="remedy"
                              value={formik.values.remedy}
                              onChange={(selected) => formik.setFieldValue('remedy', selected)}
                              options={RemediesByGradeOptions}
                              isClearable
                              placeholder="Select Remedy"
                              isDisabled={!formik.values.grade}
                              className={formik.touched.remedy && formik.errors.remedy ? 'is-invalid' : ''}
                            />
                            {formik.touched.remedy && formik.errors.remedy && (
                              <FormFeedback type="invalid">{formik.errors.remedy}</FormFeedback>
                            )}
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="authors" className="form-label">Select One Or More Authors</Label>
                            <Select
                              id="authors"
                              name="authors"
                              value={formik.values.authors}
                              onChange={(selected) => formik.setFieldValue('authors', selected)}
                              options={AuthorForRubricOptions}
                              isMulti
                              isClearable
                              placeholder="Select Authors"
                              className={formik.touched.authors && formik.errors.authors ? 'is-invalid' : ''}
                              components={makeAnimated()}
                              closeMenuOnSelect={false}
                            />
                            {formik.touched.authors && formik.errors.authors && (
                              <FormFeedback type="invalid">{formik.errors.authors}</FormFeedback>
                            )}
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div className="d-inline-flex gap-2 mt-4">
                            <button
                              type="button"
                              className="btn btn-soft-info btn-sm mt-2"
                              onClick={handleAddAuthorRemedy}
                              disabled={!formik.values.remedy || formik.values.authors.length === 0}
                            >
                              <i className="ri-add-line align-middle"></i> Add Author & Remedy
                            </button>
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <table className="table table-responsive table-bordered table-nowrap">
                            <thead>
                              <tr>
                                <th scope="col">Remedy Name</th>
                                <th scope="col">Author Name</th>
                                <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rubricsLoading ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    <Spinner color="primary" className="ms-1" />
                                  </td>
                                </tr>
                              ) : authorRemedyList.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center">No items added yet</td>
                                </tr>
                              ) : (
                                authorRemedyList.map((item) => (
                                  <React.Fragment key={item.id}>
                                    {item.authors && item.authors.map((author, authorIndex) => (
                                      <tr key={`${item.id}-${author.value}`}>
                                        {authorIndex === 0 ? (
                                          <td rowSpan={item.authors.length}>{item.remedy.label}</td>
                                        ) : null}
                                        <td>{author.label}</td>
                                        <td className='text-center'>
                                          <div className="remove">
                                            <button
                                              className="btn btn-sm btn-soft-danger remove-item-btn"
                                              onClick={() => handleRemoveAuthorRemedy(item.id, author.value)}
                                              title="Remove this author"
                                            >
                                              <i className="ri-delete-bin-5-line" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))
                              )}
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
                          <Link to="/admin/listrubrics">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button
                            color="success"
                            className="btn-label"
                            type="submit"
                            disabled={rubricsLoading || authorRemedyList.length === 0}
                          >
                            {rubricsLoading ? (
                              <Spinner size="sm" className="me-2" />
                            ) : (
                              <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i>
                            )}
                            Update
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

export default EditRubrics;