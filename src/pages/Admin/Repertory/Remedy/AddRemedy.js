import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Input, Container, Form, FormFeedback, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";
// Import Draft.js components
import { convertToRaw, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
//redux
import { useSelector, useDispatch } from "react-redux";
import { createOrUpdateRemedy, getTermalDDL } from '../../../../slices/admin/repertory/remedy/thunk';
import { setRemedySuccess, setRemedyError } from '../../../../slices/admin/repertory/remedy/reducer';

const AddRemedy = () => {
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { remedySuccess, remedyError, termalDDLList } = useSelector((state) => state?.Remedy || {});

  const ThermalNameOptions = termalDDLList?.map((thermal) => ({
    label: thermal.thermalName,
    value: thermal.thermalId,
  }));

  const [editorStateThemes, setEditorStateThemes] = useState(() => EditorState.createEmpty());
  const [editorStateGenerals, setEditorStateGenerals] = useState(() => EditorState.createEmpty());
  const [editorStateModalities, setEditorStateModalities] = useState(() => EditorState.createEmpty());
  const [editorStateParticulars, setEditorStateParticulars] = useState(() => EditorState.createEmpty());

  const scrollToFirstError = (errors) => {
    const fieldOrder = ['remedyName', 'remedyAlias', 'thermalName', 'description', 'themes', 'generals', 'modalities', 'particulars'];
    const firstErrorField = fieldOrder.find((field) => errors[field]);
    if (!firstErrorField) {
      return;
    }
    const el = document.getElementById(firstErrorField);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') {
        el.focus();
      }
    }
  };

  const formik = useFormik({
    enableReinitialize: false,
    initialValues: {
      remedyName: '',
      remedyAlias: '',
      thermalName: null,
      description: '',
      commonOrUncommon: false,
      themes: '',
      generals: '',
      modalities: '',
      particulars: ''
    },
    validationSchema: Yup.object({
      remedyName: Yup.string().required("Please enter remedy name"),
      remedyAlias: Yup.string().required("Please enter remedy alias"),
      thermalName: Yup.object().nullable(),
      description: Yup.string(),
      themes: Yup.string(),
      generals: Yup.string(),
      modalities: Yup.string(),
      particulars: Yup.string()
    }),
    onSubmit: (values) => {
      const remedyData = {
        remedyId: 0,
        remedyName: values.remedyName,
        remedyAlias: values.remedyAlias,
        thermalId: values.thermalName?.value ?? null,
        description: values.description,
        commonOrUncommon: Boolean(values.commonOrUncommon),
        themesOrCharacteristics: values.themes,
        generals: values.generals,
        modalities: values.modalities,
        particulars: values.particulars,
        enteredBy: userDetails.userId,
        enteredDate: new Date(),
        changedBy: 0,
        changedDate: "",
        deleteStatus: false,
        fontName: "",
        fontStyle: "",
        fontColor: "",
        gradeNo: 0
      };
      dispatch(createOrUpdateRemedy(remedyData));
    }
  });

  useEffect(() => {
    dispatch(getTermalDDL(null));
  }, []);

  useEffect(() => {
    if (formik.submitCount > 0 && Object.keys(formik.errors).length > 0) {
      scrollToFirstError(formik.errors);
    }
  }, [formik.submitCount]);

  useEffect(() => {
    if (remedySuccess) {
      const timer = setTimeout(() => {
        formik.resetForm();
        setEditorStateThemes(EditorState.createEmpty());
        setEditorStateGenerals(EditorState.createEmpty());
        setEditorStateModalities(EditorState.createEmpty());
        setEditorStateParticulars(EditorState.createEmpty());
        dispatch(setRemedySuccess(null));
        navigate('/admin/listremedy');
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (remedyError) {
      const timer = setTimeout(() => {
        dispatch(setRemedyError(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [remedySuccess, remedyError]);

  document.title = "Add Remedy";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {remedySuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {remedySuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {remedyError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {remedyError}
                    </UncontrolledAlert>
                  ) : null}
                  {formik.submitCount > 0 && Object.keys(formik.errors).length > 0 ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      Please fill the required fields (Remedy Name and Remedy Alias).
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">New Remedy</h4>
                </CardHeader>
                <Form onSubmit={formik.handleSubmit}>
                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="remedyName" className="form-label">Remedy Name <span className="required">*</span></Label>
                            <Input
                              type="text"
                              className="form-control"
                              id="remedyName"
                              name="remedyName"
                              value={formik.values.remedyName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.remedyName && formik.errors.remedyName ? true : false}
                            />
                            {formik.touched.remedyName && formik.errors.remedyName ? (
                              <FormFeedback type="invalid">{formik.errors.remedyName}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="remedyAlias" className="form-label">Remedy Alias <span className="required">*</span></Label>
                            <Input
                              type="text"
                              className="form-control"
                              id="remedyAlias"
                              name="remedyAlias"
                              value={formik.values.remedyAlias}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.remedyAlias && formik.errors.remedyAlias ? true : false}
                            />
                            {formik.touched.remedyAlias && formik.errors.remedyAlias ? (
                              <FormFeedback type="invalid">{formik.errors.remedyAlias}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="thermalName" className="form-label">Thermal Name</Label>
                            <div id="thermalName">
                              <Select
                                name="thermalName"
                                value={formik.values.thermalName}
                                onChange={(selectedOption) => formik.setFieldValue("thermalName", selectedOption)}
                                options={ThermalNameOptions}
                                onBlur={() => formik.setFieldTouched("thermalName", true)}
                                isClearable
                              />
                            </div>
                            {formik.touched.thermalName && formik.errors.thermalName ? (
                              <div className="invalid-feedback d-block">
                                {typeof formik.errors.thermalName === 'string' ? formik.errors.thermalName : formik.errors.thermalName.value}
                              </div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="description" className="form-label">Description</Label>
                            <Input
                              type="textarea"
                              className="form-control"
                              id="description"
                              name="description"
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              invalid={formik.touched.description && formik.errors.description ? true : false}
                            />
                            {formik.touched.description && formik.errors.description ? (
                              <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div className="d-flex align-items-center">
                            <Label htmlFor="commonOrUncommon" className="form-label mb-0">Common ? :</Label>
                            <Input
                              type="checkbox"
                              id="commonOrUncommon"
                              name="commonOrUncommon"
                              checked={formik.values.commonOrUncommon}
                              onChange={(e) => formik.setFieldValue("commonOrUncommon", e.target.checked)}
                              style={{ marginLeft: '1.25em' }}
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="themes" className="form-label">Themes/ Characteristics</Label>
                            <div id="themes">
                              <Editor
                                wrapperClassName="demo-wrapper"
                                editorClassName="demo-editor"
                                editorState={editorStateThemes}
                                onEditorStateChange={editorState => {
                                  setEditorStateThemes(editorState);
                                  formik.setFieldValue('themes', draftToHtml(convertToRaw(editorState.getCurrentContent())));
                                }}
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
                            {formik.touched.themes && formik.errors.themes ? (
                              <div className="invalid-feedback d-block">{formik.errors.themes}</div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="generals" className="form-label">Generals</Label>
                            <div id="generals">
                              <Editor
                                wrapperClassName="demo-wrapper"
                                editorClassName="demo-editor"
                                editorState={editorStateGenerals}
                                onEditorStateChange={editorState => {
                                  setEditorStateGenerals(editorState);
                                  formik.setFieldValue('generals', draftToHtml(convertToRaw(editorState.getCurrentContent())));
                                }}
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
                            {formik.touched.generals && formik.errors.generals ? (
                              <div className="invalid-feedback d-block">{formik.errors.generals}</div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="modalities" className="form-label">Modalities</Label>
                            <div id="modalities">
                              <Editor
                                wrapperClassName="demo-wrapper"
                                editorClassName="demo-editor"
                                editorState={editorStateModalities}
                                onEditorStateChange={editorState => {
                                  setEditorStateModalities(editorState);
                                  formik.setFieldValue('modalities', draftToHtml(convertToRaw(editorState.getCurrentContent())));
                                }}
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
                            {formik.touched.modalities && formik.errors.modalities ? (
                              <div className="invalid-feedback d-block">{formik.errors.modalities}</div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="particulars" className="form-label">Particulars</Label>
                            <div id="particulars">
                              <Editor
                                wrapperClassName="demo-wrapper"
                                editorClassName="demo-editor"
                                editorState={editorStateParticulars}
                                onEditorStateChange={editorState => {
                                  setEditorStateParticulars(editorState);
                                  formik.setFieldValue('particulars', draftToHtml(convertToRaw(editorState.getCurrentContent())));
                                }}
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
                            {formik.touched.particulars && formik.errors.particulars ? (
                              <div className="invalid-feedback d-block">{formik.errors.particulars}</div>
                            ) : null}
                          </div>
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
                          <Link to="/admin/listremedy">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
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

export default AddRemedy;