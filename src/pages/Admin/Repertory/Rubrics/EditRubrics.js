import React, { useEffect, useRef, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Label, Row, UncontrolledAlert, Spinner } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Select from "react-select";
import AsyncSelect from "react-select/async";
import makeAnimated from "react-select/animated";
import { useDispatch, useSelector } from 'react-redux';
import { searchSubSections } from '../../../../helpers/realbackend_helper';
import { getAuthorForRubric, getRemedyGrades, getRemediesByGrade, updateRubric, getSectionForSubSection, getRubricRemedyBySectionIdGreadId } from '../../../../slices/admin/repertory/rubric/thunk';
import { setRubricError, setRubricSuccess } from '../../../../slices/admin/repertory/rubric/reducer';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const EditRubrics = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const selectedGrade = location.state?.selectedGrade;
  console.log('location', location)
  console.log('selectedGrade', selectedGrade)
  const [authorRemedyList, setAuthorRemedyList] = useState([]);
  const hydratedRef = useRef(false);

  // Redux State
  const sectionForSubSection = useSelector((state) => state.Rubric.sectionForSubSection);
  const authorForRubric = useSelector((state) => state.Rubric.authorForRubric);
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

  const loadSubSectionOptions = (inputValue) => {
    const sectionId = formik.values.section?.value;
    const term = (inputValue || '').trim();
    if (!sectionId || term.length < 2) return Promise.resolve([]);
    return searchSubSections(sectionId, term)
      .then((rows) => (Array.isArray(rows) ? rows : []).map((row) => ({
        value: row.subSectionId ?? row.SubSectionId,
        label: row.subSectionName ?? row.SubSectionName,
      })))
      .catch(() => []);
  };

  // Fetch initial data. The subsection is not the whole section list: MIND alone is large enough to time out.
  useEffect(() => {
    dispatch(getSectionForSubSection(null));
    dispatch(getRemedyGrades(null));
    dispatch(getAuthorForRubric(null));
    if (selectedGrade?.subSectionId && selectedGrade?.gradeId) {
      dispatch(getRubricRemedyBySectionIdGreadId({
        subSectionId: selectedGrade.subSectionId,
        gradeId: selectedGrade.gradeId
      }));
    }
  }, [dispatch]);

  // Show the row the list already knows, before the remedy request returns.
  useEffect(() => {
    if (!selectedGrade || hydratedRef.current) return;
    if (selectedGrade.sectionId && selectedGrade.sectionName) {
      formik.setFieldValue('section', { value: selectedGrade.sectionId, label: selectedGrade.sectionName });
    }
    if (selectedGrade.subSectionId && selectedGrade.subSectionName) {
      formik.setFieldValue('subSection', { value: selectedGrade.subSectionId, label: selectedGrade.subSectionName });
    }
    if (selectedGrade.gradeId != null && selectedGrade.gradeNo != null) {
      formik.setFieldValue('grade', { value: selectedGrade.gradeId, label: selectedGrade.gradeNo });
    }
  }, [selectedGrade]);

  // Fill section, subsection and grade from the saved rubric once the small lookup lists are in.
  useEffect(() => {
    const saved = rubricRemedyBySectionIdGreadId;
    if (hydratedRef.current || !saved || SectionForSubSectionOptions.length === 0 || GradeOptions.length === 0) return;
    const sectionOption = SectionForSubSectionOptions.find((option) => option.value === saved.sectionId);
    const gradeOption = GradeOptions.find((option) => option.value === saved.gradeId);
    if (sectionOption) formik.setFieldValue('section', sectionOption);
    if (saved.subSectionId) {
      formik.setFieldValue('subSection', {
        value: saved.subSectionId,
        label: saved.subSectionName || selectedGrade?.subSectionName || String(saved.subSectionId),
      });
    }
    if (gradeOption) formik.setFieldValue('grade', gradeOption);
    if (saved.subSectionId && saved.gradeId) {
      dispatch(getRemediesByGrade({
        SubSectionId: saved.subSectionId,
        GradeId: saved.gradeId
      }));
    }
    hydratedRef.current = true;
  }, [rubricRemedyBySectionIdGreadId, SectionForSubSectionOptions, GradeOptions, selectedGrade, dispatch]);

  // Update authorRemedyList when rubricRemedyBySectionIdGreadId changes (load existing data)
  useEffect(() => {
    const savedRows = rubricRemedyBySectionIdGreadId?.rubricRemedyAuthorList
      || rubricRemedyBySectionIdGreadId?.RubricRemedyAuthorList;
    if (!savedRows) return;
    const formattedList = savedRows.map(item => {
      const authorRows = item.rubricAuthorList || item.RubricAuthorList || [];
      return {
        id: item.rubricRemedyId ?? item.RubricRemedyId,
        remedy: {
          label: item.remedyName ?? item.RemedyName,
          value: item.remedyId ?? item.RemedyId
        },
        authors: authorRows.map(author => ({
          label: author.authorName ?? author.AuthorName,
          value: author.authorId ?? author.AuthorId
        }))
      };
    });
    setAuthorRemedyList(formattedList);
  }, [rubricRemedyBySectionIdGreadId]);

  // Handle section change
  const handleSectionChange = (selectedOption) => {
    formik.setFieldValue('section', selectedOption);
    formik.setFieldValue('subSection', null);
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
    if (String(authorValue).startsWith('none-')) {
      setAuthorRemedyList(prevList => prevList.filter(item => item.id !== id));
      return;
    }
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
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form id="rubric-form" onSubmit={formik.handleSubmit}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit Rubrics</h5>
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
                          <AsyncSelect
                            id="subSection"
                            name="subSection"
                            value={formik.values.subSection}
                            onChange={(selected) => formik.setFieldValue('subSection', selected)}
                            loadOptions={loadSubSectionOptions}
                            defaultOptions={false}
                            cacheOptions={false}
                            isClearable
                            placeholder={formik.values.section ? "Type to search sub section" : "Select Sub Section"}
                            isDisabled={!formik.values.section}
                            className={formik.touched.subSection && formik.errors.subSection ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.subSection && formik.errors.subSection) })}
                            noOptionsMessage={({ inputValue }) => (inputValue || '').trim().length < 2 ? "Type at least 2 letters" : "No sub sections"}
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
                            className={formik.touched.remedy && formik.errors.remedy ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.remedy && formik.errors.remedy) })}
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.authors && formik.errors.authors), isMulti: true })}
                          />
                          {formik.touched.authors && formik.errors.authors && (
                            <FormFeedback type="invalid">{formik.errors.authors}</FormFeedback>
                          )}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div className="admin-form-add-row">
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--import"
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
                                    {(item.authors?.length ? item.authors : [{ value: `none-${item.id}`, label: '—' }]).map((author, authorIndex) => (
                                      <tr key={`${item.id}-${author.value}`}>
                                        {authorIndex === 0 ? (
                                          <td rowSpan={Math.max(item.authors?.length || 0, 1)}>{item.remedy.label}</td>
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
                          Update
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

export default EditRubrics;