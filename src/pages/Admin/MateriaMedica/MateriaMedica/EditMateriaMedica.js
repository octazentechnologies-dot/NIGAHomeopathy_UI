import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Select from "react-select";
import htmlToDraft from 'html-to-draftjs';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';
// Import Draft.js components
import { convertToRaw, EditorState, ContentState, Modifier } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
//redux
import { useSelector, useDispatch } from "react-redux";
import { getAuthorsForMateriaMedicaDDL, getRemedyDDL, getMateriaMedicaHeadByAuthorId, updateMateriaMedica, getMateriaMedicaDetails } from '../../../../slices/thunks';
import { setMateriaMedicaSuccess, setMateriaMedicaError } from '../../../../slices/admin/materiaMedica/materialMedica/reducer';

const EditMateriaMedica = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const dispatch = useDispatch();
  // Redux state
  const authors = useSelector((state) => state?.MateriaMedica?.materiaMedicaAuthors || []);
  const remedies = useSelector((state) => state?.MateriaMedica.matriaMedicaRemediesDDL || []);
  const heads = useSelector((state) => state?.MateriaMedica.materiaMedicaHeads || []);
  const materiaMedicaDetails = useSelector((state) => state?.MateriaMedica.materiaMedicaDetails || null);
  const { materiaMedicaSuccess, materiaMedicaError } = useSelector((state) => state?.MateriaMedica || {});


  // Create an empty editor state
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  const AuthorOptions = authors?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];

  const RemedyOptions = remedies?.map((remedy) => ({
    label: remedy.remedyName,
    value: remedy.remedyId,
  })) || [];

  const HeadOptions = heads?.map((head) => ({
    label: head.materiaMedicaHeadName,
    value: head.materiaMedicaHeadId,
  })) || [];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      author: AuthorOptions.find((author) => author.value === location.state.selectedMateriaMedica.authorId),
      remedy: RemedyOptions.find((remedy) => remedy.value === location.state.selectedMateriaMedica.remedyId),
      head: HeadOptions.find((head) => head.value === location.state.selectedMateriaMedica.materiaMedicaHeadId),
      details: null
    },
    validationSchema: Yup.object({
      author: Yup.object().shape({
        value: Yup.string().required("Please Select Author"),
      }).nullable().required("Please Select Author"),
      remedy: Yup.object().shape({
        value: Yup.string().required("Please Select Remedy"),
      }).nullable().required("Please Select Remedy"),
      head: Yup.object().shape({
        value: Yup.string().required("Please Select Head"),
      }).nullable().required("Please Select Head"),
    }),
    onSubmit: (values) => {
      const Object = {
        "materiaMedicaId": location.state.selectedMateriaMedica.materiaMedicaId, // This should be updated with the actual ID
        "authorId": values.author.value,
        "remedyId": values.remedy.value,
        "materiaMedicaHeadId": values.head.value,
        "dose": "",
        "enteredBy": userDetails.userId,
        "enteredDate": new Date(),
        "changedBy": userDetails.userId,
        "changedDate": new Date(),
        "seqNo": 0,
        "isActive": true,
        "isDeleted": false,
        "modelEx": [
          {
            "matriaMedicaDetailId": 0,
            "materiaMedicaId": 0,
            "details": values.details
          }
        ]
      }
      dispatch(updateMateriaMedica(Object));
    }
  });

  useEffect(() => {
    if (materiaMedicaDetails && materiaMedicaDetails.modelEx && materiaMedicaDetails.modelEx.length > 0) {
      const firstDetail = materiaMedicaDetails.modelEx[0];
      if (firstDetail.details) {
        try {
          const blocksFromHTML = htmlToDraft(firstDetail.details);
          if (blocksFromHTML && blocksFromHTML.contentBlocks) {
            const contentState = ContentState.createFromBlockArray(
              blocksFromHTML.contentBlocks,
              blocksFromHTML.entityMap
            );
            const newEditorState = EditorState.createWithContent(contentState);
            setEditorState(newEditorState);
            formik.setFieldValue('details', firstDetail.details);
          }
        } catch (error) {
          console.error('Error converting HTML to editor state:', error);
        }
      }
    }
  }, [materiaMedicaDetails]);

  // Update formik when editor state changes
  useEffect(() => {
    if (editorState) {
      try {
        const htmlContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
        formik.setFieldValue('details', htmlContent);
      } catch (error) {
        console.error('Error converting editor state to HTML:', error);
      }
    }
  }, [editorState]);

  useEffect(() => {
    dispatch(getAuthorsForMateriaMedicaDDL());
    dispatch(getRemedyDDL());
    dispatch(getMateriaMedicaHeadByAuthorId({ authorId: location.state.selectedMateriaMedica.authorId }));
    dispatch(getMateriaMedicaDetails({ materiaMedicaId: location.state.selectedMateriaMedica.materiaMedicaId }));
  }, []);

  useEffect(() => {
    if (materiaMedicaSuccess) {
      const timer = setTimeout(() => {
        formik.resetForm();
        dispatch(setMateriaMedicaSuccess(null));
        navigate('/admin/listmateriamedica');
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (materiaMedicaError) {
      const timer = setTimeout(() => {
        dispatch(setMateriaMedicaError(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [materiaMedicaSuccess, materiaMedicaError, dispatch, navigate]);

  document.title = "Edit Materia Medica";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit Materia Medica</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(materiaMedicaSuccess || materiaMedicaError) ? (
                      <div className="admin-form-alerts">
                        {materiaMedicaSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {materiaMedicaSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {materiaMedicaError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {materiaMedicaError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="author" className="form-label">Author</Label>
                          <Select
                            name="author"
                            value={formik.values.author}
                            onChange={(selectedOption) => {
                              formik.setFieldValue("author", selectedOption);
                              dispatch(getMateriaMedicaHeadByAuthorId({ authorId: selectedOption.value }));
                            }}
                            options={AuthorOptions}
                            onBlur={() => formik.setFieldTouched("author", true)}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.author && formik.errors.author),
                            })}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                          />
                          {formik.touched.author && formik.errors.author ? (
                            <FormFeedback type="invalid" className="d-block">{formik.errors.author}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="remedy" className="form-label">Remedy</Label>
                          <Select
                            name="remedy"
                            value={formik.values.remedy}
                            onChange={(selectedOption) => formik.setFieldValue("remedy", selectedOption)}
                            options={RemedyOptions}
                            onBlur={() => formik.setFieldTouched("remedy", true)}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.remedy && formik.errors.remedy),
                            })}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                          />
                          {formik.touched.remedy && formik.errors.remedy ? (
                            <FormFeedback type="invalid" className="d-block">{formik.errors.remedy}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="head" className="form-label">Head</Label>
                          <Select
                            name="head"
                            value={formik.values.head}
                            onChange={(selectedOption) => formik.setFieldValue("head", selectedOption)}
                            options={HeadOptions}
                            onBlur={() => formik.setFieldTouched("head", true)}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.head && formik.errors.head),
                            })}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                          />
                          {formik.touched.head && formik.errors.head ? (
                            <FormFeedback type="invalid" className="d-block">{formik.errors.head}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="details" className="form-label">Materia Medica Details</Label>
                          <div>
                            <Editor
                              wrapperClassName="demo-wrapper"
                              editorClassName="demo-editor"
                              onEditorStateChange={setEditorState}
                              editorState={editorState}
                              toolbarClassName="toolbar-class"
                              wrapperStyle={{
                                borderRadius: 5,
                                borderWidth: 1,
                                borderColor: '#0000'
                              }}
                              editorStyle={{
                                borderRadius: 2,
                                border: '1px solid lightgrey',
                                backgroundColor: '#FFFFFF',
                                height: '300px'
                              }}
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listmateriamedica" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
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

export default EditMateriaMedica;