import React, { useEffect, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';

import Select from "react-select";
import makeAnimated from "react-select/animated";

import { useDispatch, useSelector } from 'react-redux';
import { getDiagnosisForClinicalPatternList, saveDiagnosisTherapeuticsDetail } from '../../../../slices/thunks';

// Draft.js and react-draft-wysiwyg
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import * as Yup from 'yup';
import { useFormik } from 'formik';

const AddDiagnosisTherapeuticsDetails = () => {
  document.title = "Add Diagnosis Therapeutics Details";

  const dispatch = useDispatch();

  // Redux state
  const diagnosisForClinicalPattern = useSelector((state) => state.DiagnosisTherapeutics.diagnosisListForClinicalPattern);
  const { success, error, loading } = useSelector((state) => state.DiagnosisTherapeutics);

  const DiagnosisForClinicalPatternOptions = diagnosisForClinicalPattern?.map((diagnosis) => ({
    label: diagnosis.diagnosisName,
    value: diagnosis.diagnosisID,
  })) || [];

  useEffect(() => {
    dispatch(getDiagnosisForClinicalPatternList(null));
  }, [dispatch]);

  // Editor state
  const [editorState, setEditorState] = useState(() => {
    const contentState = ContentState.createFromText('');
    return EditorState.createWithContent(contentState);
  });

  // Formik setup
  const formik = useFormik({
    enableReinitialize: false,
    initialValues: {
      diagnosis: null,
      details: '',
    },
    validationSchema: Yup.object({
      diagnosis: Yup.object().shape({
        value: Yup.string().required('Diagnosis is required'),
      }).nullable().required('Diagnosis is required'),
      //details: Yup.string().test('not-empty', 'Details are required', value => value && value.replace(/<(.|\n)*?>/g, '').trim().length > 0),
    }),
    onSubmit: (values, { setSubmitting, resetForm }) => {
      const payload = {
        diagnosisId: values.diagnosis.value,
        diagnosisTherapeuticsDetail1: values.details,
      };
      dispatch(saveDiagnosisTherapeuticsDetail(payload));
      setSubmitting(false);
    },
  });

  // Sync editor state to formik
  function handleEditorStateChange(newEditorState) {
    setEditorState(newEditorState);
    formik.setFieldValue('details', draftToHtml(convertToRaw(newEditorState.getCurrentContent())));
  }

  function handleSelectDiagnosis(selected) {
    formik.setFieldValue('diagnosis', selected);
  }

  useEffect(() => {
    if (success) {
      setTimeout(() => {
        formik.resetForm();
      }, 2000);
    }
  }, [success]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {success ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {success}
                    </UncontrolledAlert>
                  ) : null}
                  {error ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {error}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">New Diagnosis Therapeutics Details</h4>
                </CardHeader>
                <form onSubmit={formik.handleSubmit}>
                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="diagnosis" className="form-label">Diagnosis Therapeutics Name <span className="required">*</span></Label>
                            <Select
                              name="diagnosis"
                              value={formik.values.diagnosis}
                              onChange={handleSelectDiagnosis}
                              options={DiagnosisForClinicalPatternOptions}
                              onBlur={() => formik.setFieldTouched('diagnosis', true)}
                              className={formik.touched.diagnosis && formik.errors.diagnosis ? "is-invalid" : ""}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  borderColor: formik.touched.diagnosis && formik.errors.diagnosis ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.diagnosis && formik.errors.diagnosis ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.diagnosis && formik.errors.diagnosis ? (
                              <FormFeedback type="invalid" style={{ display: 'block' }}>{formik.errors.diagnosis.value || formik.errors.diagnosis}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="diagnosisTherapeuticsDetails" className="form-label">Diagnosis Therapeutics Details <span className="required">*</span></Label>
                            <Editor
                              wrapperClassName="demo-wrapper"
                              editorClassName="demo-editor"
                              editorState={editorState}
                              onEditorStateChange={handleEditorStateChange}
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
                            {formik.touched.details && formik.errors.details ? (
                              <FormFeedback type="invalid" style={{ display: 'block' }}>{formik.errors.details}</FormFeedback>
                            ) : null}
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
                          <Link to="/admin/listdiagnosistherapeuticsdetails"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit" disabled={formik.isSubmitting || loading}> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> {loading ? <Spinner size="sm" /> : 'Save'} </Button>
                        </div>
                      </Col>
                    </Row>
                  </CardFooter>
                </form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AddDiagnosisTherapeuticsDetails;