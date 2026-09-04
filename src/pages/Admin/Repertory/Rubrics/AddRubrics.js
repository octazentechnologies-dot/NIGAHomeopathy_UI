import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Label, Row, UncontrolledAlert, Spinner } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useDispatch, useSelector } from 'react-redux';
import { getAuthorForRubric, getSubSection, getRemedyGrades, getRemediesByGrade, createRubric, getSectionForSubSection } from '../../../../slices/admin/repertory/rubric/thunk';
import { setRubricError, setRubricSuccess } from '../../../../slices/admin/repertory/rubric/reducer';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const AddRubrics = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authorRemedyList, setAuthorRemedyList] = useState([]);

  // Redux State
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const authorForRubric = useSelector((state) => state.Rubric.authorForRubric);
  const subSection = useSelector((state) => state.Rubric.subSection);
  const remedyGrades = useSelector((state) => state.Rubric.remedyGrades);
  const remediesByGrade = useSelector((state) => state.Rubric.remediesByGrade);
  const { rubricError, rubricSuccess, rubricsLoading } = useSelector((state) => state.Rubric);

  // Formik validation schema
  const validationSchema = Yup.object().shape({
    section: Yup.object().required('Section is required'),
    subSection: Yup.object().required('Sub Section is required'),
    grade: Yup.object().required('Grade is required'),
    // Remove remedy and authors validation from Formik - we'll validate the table instead
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
      // Validate that authorRemedyList has data
      if (authorRemedyList.length === 0) {
        dispatch(setRubricError('Please add at least one remedy and author to the table'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Format the data for API - nested structure with rubricAuthorList inside each remedy
      const rubricRemedyAuthorList = authorRemedyList.map((item) => ({
        rubricRemedyId: 0,
        remedyId: item.remedy?.value,
        remedyName: item.remedy?.label,
        rubricAuthorList: item.authors.map((author) => ({
          authorId: author.value,
          authorName: author.label,
          remedyRubricAuthorId: 0,
        })),
      }));

      const rubricData = {
        SectionId: values.section?.value,
        SubSectionId: values.subSection?.value,
        GradeId: values.grade?.value,
        rubricRemedyAuthorList: rubricRemedyAuthorList,
      };

      console.log('Submitting rubric data:', rubricData);
      dispatch(createRubric(rubricData));
    },
  });

  // Prepare options for selects
  const SectionForSubSectionOptions = sectionForSubSection?.map((section) => ({
    label: section.sectionName,
    value: section.sectionId,
  })) || [];

  const SubSectionOptions = subSection?.map((section) => ({
    label: section.subSectionName,
    value: section.subSectionId,
  })) || [];

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
    // Clear any previous success/error messages on component mount
    dispatch(setRubricSuccess(null));
    dispatch(setRubricError(null));

    dispatch(getSectionForSubSection(null));
    dispatch(getRemedyGrades(null));
    dispatch(getAuthorForRubric(null));
  }, [dispatch]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (rubricSuccess) {
      const timer = setTimeout(() => {
        dispatch(setRubricSuccess(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rubricSuccess, dispatch]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (rubricError) {
      const timer = setTimeout(() => {
        dispatch(setRubricError(null));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [rubricError, dispatch]);

  // Handle successful submission - redirect after showing success message
  useEffect(() => {
    if (rubricSuccess) {
      const timer = setTimeout(() => {
        navigate('/admin/listrubrics');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rubricSuccess, navigate]);

  // Handle section change
  const handleSectionChange = (selectedOption) => {
    formik.setFieldValue('section', selectedOption);
    if (selectedOption) {
      dispatch(getSubSection(selectedOption.value));
    }
  };

  // Handle grade change
  const handleGradeChange = (selectedOption) => {
    formik.setFieldValue('grade', selectedOption);
    if (selectedOption) {
      dispatch(getRemediesByGrade({ SubSectionId: formik.values.subSection.value, GradeId: selectedOption.value }));
    }
  };

  // Add author and remedy to table
  const handleAddAuthorRemedy = () => {
    if (formik.values.remedy && formik.values.authors.length > 0) {
      // Check if remedy already exists in the list
      const existingRemedyIndex = authorRemedyList.findIndex(
        item => item.remedy?.value === formik.values.remedy?.value
      );

      if (existingRemedyIndex === -1) {
        // If remedy doesn't exist, create a new entry with all authors
        const newItem = {
          id: Date.now() + Math.random(),
          remedy: formik.values.remedy,
          authors: formik.values.authors,
        };
        setAuthorRemedyList([...authorRemedyList, newItem]);
      } else {
        // If remedy exists, add new authors to the existing entry
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
    setAuthorRemedyList(authorRemedyList.filter(item => {
      if (item.id === id) {
        if (item.authors) {
          item.authors = item.authors.filter(author => author.value !== authorValue);
        }
        return true;
      }
      return false;
    }));
  };

  document.title = "Add Rubrics";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form id="rubric-form" onSubmit={formik.handleSubmit}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New Rubrics</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(rubricSuccess || rubricError) ? (
                      <div className="admin-form-alerts">
                        {rubricSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {rubricSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {rubricError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {rubricError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.section && formik.errors.section) })}
                          />
                          {formik.touched.section && formik.errors.section && (
                            <FormFeedback type="invalid">{formik.errors.section}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="subSection" className="form-label">Sub Section Name</Label>
                          <Select
                            id="subSection"
                            name="subSection"
                            value={formik.values.subSection}
                            onChange={(selected) => formik.setFieldValue('subSection', selected)}
                            options={SubSectionOptions}
                            isClearable
                            placeholder="Select Sub Section"
                            isDisabled={!formik.values.section}
                            className={formik.touched.subSection && formik.errors.subSection ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.subSection && formik.errors.subSection) })}
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.grade && formik.errors.grade) })}
                          />
                          {formik.touched.grade && formik.errors.grade && (
                            <FormFeedback type="invalid">{formik.errors.grade}</FormFeedback>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles()}
                          />
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
                            components={makeAnimated()}
                            closeMenuOnSelect={false}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ isMulti: true })}
                          />
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div className="d-inline-flex gap-2 mt-4">
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--import mt-2"
                            onClick={handleAddAuthorRemedy}
                            disabled={!formik.values.remedy || formik.values.authors.length === 0}
                          >
                            <i className="ri-add-line align-middle me-1" aria-hidden="true" /> Add Author & Remedy
                          </button>
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={12} md={12}>
                        <div className="table-responsive patient-list-modal__table-wrap">
                          <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                            <thead>
                              <tr>
                                <th scope="col">Remedy Name</th>
                                <th scope="col">Author Name</th>
                                <th scope="col" className='text-center' style={{ width: '10%' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {authorRemedyList.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center">No items added yet</td>
                                </tr>
                              ) : (
                                authorRemedyList.map((item) => (
                                  <React.Fragment key={item.id}>
                                    {item.authors.map((author, index) => (
                                      <tr key={`${item.id}-${author.value}`}>
                                        {index === 0 ? (
                                          <td rowSpan={item.authors.length}>{item.remedy?.label}</td>
                                        ) : null}
                                        <td>{author.label}</td>
                                        <td className='text-center'>
                                          <div className="remove">
                                            <button
                                              type="button"
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
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listrubrics" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-sm admin-list-btn admin-list-btn--new"
                          disabled={rubricsLoading || authorRemedyList.length === 0}
                        >
                          {rubricsLoading ? (
                            <Spinner size="sm" className="me-1" />
                          ) : (
                            <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          )}
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

export default AddRubrics;