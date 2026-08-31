import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Input, Container, Form, FormFeedback, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";
// Import Draft.js components
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import htmlToDraft from 'html-to-draftjs';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
//redux
import { useSelector, useDispatch } from "react-redux";
import { createOrUpdateRemedy, getTermalDDL, getSingleRemedy } from '../../../../slices/admin/repertory/remedy/thunk';
import { setRemedySuccess, setRemedyError } from '../../../../slices/admin/repertory/remedy/reducer';

const EditRemedy = () => {
  const location = useLocation();
  const selectedRemedy = location.state?.selectedRemedy;
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { remedySuccess, remedyError, termalDDLList, singleRemedy, loading } = useSelector((state) => state?.Remedy || {});

  const ThermalNameOptions = termalDDLList?.map((thermal) => ({
    label: thermal.thermalName,
    value: thermal.thermalId,
  }));

  // Create empty editor states
  const [editorStateThemeCharactor, setEditorStateThemeCharactor] = useState(() => EditorState.createEmpty());
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

  // Add debug logging for editor states
  useEffect(() => {
    console.log('Editor States:', {
      themes: editorStateThemeCharactor.getCurrentContent().getPlainText(),
      generals: editorStateGenerals.getCurrentContent().getPlainText(),
      modalities: editorStateModalities.getCurrentContent().getPlainText(),
      particulars: editorStateParticulars.getCurrentContent().getPlainText()
    });
  }, [editorStateThemeCharactor, editorStateGenerals, editorStateModalities, editorStateParticulars]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      remedyName: singleRemedy?.remedyName || '',
      remedyAlias: singleRemedy?.remedyAlias || '',
      thermalName: singleRemedy?.thermalId ? ThermalNameOptions.find((thermal) => thermal.value === singleRemedy?.thermalId) : null,
      description: singleRemedy?.description || '',
      commonOrUncommon: singleRemedy?.commonOrUncommon || false,
      themes: null,
      generals: null,
      modalities: null,
      particulars: null
    },
    validationSchema: Yup.object({
      remedyName: Yup.string().required("Please enter remedy name"),
      remedyAlias: Yup.string().required("Please enter remedy alias"),
      thermalName: Yup.object().nullable(),
      description: Yup.string(),
      themes: Yup.string().nullable(),
      generals: Yup.string().nullable(),
      modalities: Yup.string().nullable(),
      particulars: Yup.string().nullable()
    }),
    onSubmit: (values) => {
      const remedyData = {
        remedyId: singleRemedy?.remedyId,
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
        changedBy: userDetails.userId,
        changedDate: new Date(),
        deleteStatus: false,
        fontName: "",
        fontStyle: "",
        fontColor: "",
        gradeNo: 0
      };
      dispatch(createOrUpdateRemedy(remedyData));
    }
  });

  // Initialize editor states
  const initializeEditorState = async (htmlContent) => {
    console.log('Initializing editor with content:', htmlContent);

    if (!htmlContent) {
      console.log('No content provided, creating empty editor state');
      return EditorState.createEmpty();
    }

    try {
      const blocksFromHTML = await htmlToDraft(htmlContent);
      console.log('Blocks from HTML:', blocksFromHTML);

      if (blocksFromHTML && blocksFromHTML.contentBlocks && blocksFromHTML.contentBlocks.length > 0) {
        const contentState = ContentState.createFromBlockArray(
          blocksFromHTML.contentBlocks,
          blocksFromHTML.entityMap
        );
        const editorState = EditorState.createWithContent(contentState);
        console.log('Created editor state with content:', editorState.getCurrentContent().getPlainText());
        return editorState;
      } else {
        console.log('No valid blocks found in HTML content');
        return EditorState.createEmpty();
      }
    } catch (error) {
      console.error('Error initializing editor state:', error);
      return EditorState.createEmpty();
    }
  };

  //useEffect(() => { console.log('editorStateThemeCharactor =', editorStateThemeCharactor) }, [editorStateThemeCharactor])

  // Update editor states when singleRemedy changes
  useEffect(() => {
    if (singleRemedy) {
      const setEditorData = async () => {
        try {
          console.log('Single Remedy Data:', singleRemedy);

          // Update Themes/Characteristics
          const themesState = await initializeEditorState(singleRemedy.themesOrCharacteristics);
          setEditorStateThemeCharactor(themesState);
          formik.setFieldValue('themes', singleRemedy.themesOrCharacteristics || '');

          // Update Generals
          const generalsState = await initializeEditorState(singleRemedy.generals);
          setEditorStateGenerals(generalsState);
          formik.setFieldValue('generals', singleRemedy.generals || '');

          // Update Modalities
          const modalitiesState = await initializeEditorState(singleRemedy.modalities);
          setEditorStateModalities(modalitiesState);
          formik.setFieldValue('modalities', singleRemedy.modalities || '');

          // Update Particulars
          const particularsState = await initializeEditorState(singleRemedy.particulars);
          setEditorStateParticulars(particularsState);
          formik.setFieldValue('particulars', singleRemedy.particulars || '');
        } catch (error) {
          console.error('Error setting editor data:', error);
        }
      };
      setEditorData();
    }
  }, [singleRemedy]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getTermalDDL(null));
      if (selectedRemedy?.remedyId) {
        await dispatch(getSingleRemedy({ remedyId: selectedRemedy.remedyId }));
      }
    };
    fetchData();
  }, [selectedRemedy]);

  useEffect(() => {
    if (formik.submitCount > 0 && Object.keys(formik.errors).length > 0) {
      scrollToFirstError(formik.errors);
    }
  }, [formik.submitCount]);

  // Handle success/error messages
  useEffect(() => {
    if (remedySuccess) {
      const timer = setTimeout(() => {
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner color="primary" />
      </div>
    );
  }

  document.title = "Edit Remedy";
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
                  <h4 className="card-title mb-0 flex-grow-1">Edit Remedy</h4>
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
                              editorState={editorStateThemeCharactor}
                              onEditorStateChange={editorState => {
                                setEditorStateThemeCharactor(editorState);
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

export default EditRemedy;