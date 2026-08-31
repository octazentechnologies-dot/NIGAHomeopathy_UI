import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import htmlToDraft from 'html-to-draftjs';
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
              <Card>
                <div className="p-2">
                  {materiaMedicaSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {materiaMedicaSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {materiaMedicaError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {materiaMedicaError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">Edit Materia Medica</h4>
                </CardHeader>
                <Form onSubmit={formik.handleSubmit}>
                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Author</Label>
                            <Select
                              name="author"
                              value={formik.values.author}
                              onChange={(selectedOption) => {
                                formik.setFieldValue("author", selectedOption);
                                dispatch(getMateriaMedicaHeadByAuthorId({ authorId: selectedOption.value }));
                              }}
                              options={AuthorOptions}
                              onBlur={() => formik.setFieldTouched("author", true)}
                              className={formik.touched.author && formik.errors.author ? "is-invalid" : ""}
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              menuPosition="fixed"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.author && formik.errors.author ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.author && formik.errors.author ? "red" : base.borderColor,
                                  },
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              }}
                            />
                            {formik.touched.author && formik.errors.author ? (
                              <FormFeedback type="invalid">{formik.errors.author}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Remedy</Label>
                            <Select
                              name="remedy"
                              value={formik.values.remedy}
                              onChange={(selectedOption) => formik.setFieldValue("remedy", selectedOption)}
                              options={RemedyOptions}
                              onBlur={() => formik.setFieldTouched("remedy", true)}
                              className={formik.touched.remedy && formik.errors.remedy ? "is-invalid" : ""}
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              menuPosition="fixed"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.remedy && formik.errors.remedy ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.remedy && formik.errors.remedy ? "red" : base.borderColor,
                                  },
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              }}
                            />
                            {formik.touched.remedy && formik.errors.remedy ? (
                              <FormFeedback type="invalid">{formik.errors.remedy}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Head</Label>
                            <Select
                              name="head"
                              value={formik.values.head}
                              onChange={(selectedOption) => formik.setFieldValue("head", selectedOption)}
                              options={HeadOptions}
                              onBlur={() => formik.setFieldTouched("head", true)}
                              className={formik.touched.head && formik.errors.head ? "is-invalid" : ""}
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              menuPosition="fixed"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.head && formik.errors.head ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.head && formik.errors.head ? "red" : base.borderColor,
                                  },
                                }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              }}
                            />
                            {formik.touched.head && formik.errors.head ? (
                              <FormFeedback type="invalid">{formik.errors.head}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Materia Medica Details</Label>
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
                          <Link to="/admin/listmateriamedica"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit" onClick={formik.handleSubmit}> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update </Button>
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

export default EditMateriaMedica;