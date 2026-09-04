import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Label, Row, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import { getDiagnosisForClinicalPatternList, saveDiagnosisTherapeuticsDetail } from '../../../../slices/thunks';
import { convertToRaw, EditorState, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import htmlToDraft from 'html-to-draftjs';
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const EditDiagnosisTherapeuticsDetails = () => {
  document.title = 'Edit Diagnosis Therapeutics Details';
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const diagnosisForClinicalPattern = useSelector((state) => state.DiagnosisTherapeutics.diagnosisListForClinicalPattern);
  const { success, error, loading } = useSelector((state) => state.DiagnosisTherapeutics);

  const DiagnosisForClinicalPatternOptions = diagnosisForClinicalPattern?.map((diagnosis) => ({
    label: diagnosis.diagnosisName,
    value: diagnosis.diagnosisID,
  })) || [];

  const selectedDiagnosis = location.state?.selectedDiagnosis || null;

  const initialDiagnosis = selectedDiagnosis
    ? DiagnosisForClinicalPatternOptions.find((opt) => opt.value === selectedDiagnosis.diagnosisId)
    : null;
  const initialDetails = selectedDiagnosis?.diagnosisTherapeuticsDetail1 || '';

  const [editorState, setEditorState] = useState(() => {
    if (initialDetails) {
      const contentBlock = htmlToDraft(initialDetails);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks, contentBlock.entityMap);
        return EditorState.createWithContent(contentState);
      }
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    dispatch(getDiagnosisForClinicalPatternList(null));
  }, [dispatch]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      diagnosis: initialDiagnosis,
      details: initialDetails,
    },
    validationSchema: Yup.object({
      diagnosis: Yup.object().shape({
        value: Yup.string().required('Diagnosis is required'),
      }).nullable().required('Diagnosis is required'),
    }),
    onSubmit: (values, { setSubmitting }) => {
      const payload = {
        diagnosisTherapeuticsDetailId: selectedDiagnosis?.diagnosisTherapeuticsDetailId,
        diagnosisId: values.diagnosis.value,
        diagnosisTherapeuticsDetail1: values.details,
      };
      dispatch(saveDiagnosisTherapeuticsDetail(payload));
      setSubmitting(false);
    },
  });

  const diagnosisInvalid = Boolean(formik.touched.diagnosis && formik.errors.diagnosis);

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
        navigate('/admin/listdiagnosistherapeuticsdetails');
      }, 1500);
    }
  }, [success, navigate]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <form onSubmit={formik.handleSubmit}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit Diagnosis Therapeutics Details</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(success || error) ? (
                      <div className="admin-form-alerts">
                        {success ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {success}
                          </UncontrolledAlert>
                        ) : null}
                        {error ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {error}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="diagnosis" className="form-label">
                            Diagnosis Therapeutics Name <span className="required">*</span>
                          </Label>
                          <Select
                            name="diagnosis"
                            inputId="diagnosis"
                            value={formik.values.diagnosis}
                            onChange={handleSelectDiagnosis}
                            options={DiagnosisForClinicalPatternOptions}
                            onBlur={() => formik.setFieldTouched('diagnosis', true)}
                            className={diagnosisInvalid ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: diagnosisInvalid })}
                            placeholder="Select..."
                          />
                          {diagnosisInvalid ? (
                            <FormFeedback type="invalid" style={{ display: 'block' }}>
                              {formik.errors.diagnosis?.value || formik.errors.diagnosis}
                            </FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="diagnosisTherapeuticsDetails" className="form-label">
                            Diagnosis Therapeutics Details <span className="required">*</span>
                          </Label>
                          <Editor
                            wrapperClassName="demo-wrapper admin-form-editor"
                            editorClassName="demo-editor"
                            editorState={editorState}
                            onEditorStateChange={handleEditorStateChange}
                            toolbarClassName="toolbar-class"
                            wrapperStyle={{
                              borderRadius: 4,
                              border: '1px solid #dee2e6',
                            }}
                            editorStyle={{
                              borderRadius: 2,
                              backgroundColor: '#FFFFFF',
                              height: '300px',
                              padding: '0 0.5rem',
                            }}
                          />
                          {formik.touched.details && formik.errors.details ? (
                            <FormFeedback type="invalid" style={{ display: 'block' }}>{formik.errors.details}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listdiagnosistherapeuticsdetails" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-sm admin-list-btn admin-list-btn--new"
                          disabled={formik.isSubmitting || loading}
                        >
                          {loading ? (
                            <Spinner size="sm" className="me-1" />
                          ) : (
                            <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          )}
                          Update
                        </button>
                      </div>
                    </div>
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

export default EditDiagnosisTherapeuticsDetails;
