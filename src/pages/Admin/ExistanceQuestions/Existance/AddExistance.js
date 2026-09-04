import React, { useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Form, FormFeedback, UncontrolledAlert } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createQuestionSection } from '../../../../slices/admin/existance/thunk';
import { setExistanceError, setExistanceSuccess } from '../../../../slices/admin/existance/reducer';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const AddExistance = () => {
  const dispatch = useDispatch();
  const { existanceSuccess, existanceError } = useSelector((state) => state?.Existance);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      questionSectionName: '',
      description: '',
    },
    validationSchema: Yup.object({
      questionSectionName: Yup.string().required('Please Enter Question Section Name'),
      description: Yup.string().required('Please Enter Description'),
    }),
    onSubmit: (values) => {
      dispatch(createQuestionSection({
        questionSectionId: 0,
        questionSectionName: values.questionSectionName,
        description: values.description,
        enteredBy: 'Admin',
        deleteStatus: false,
      }));
    },
  });

  useEffect(() => {
    if (existanceSuccess) {
      formik.resetForm({
        values: {
          questionSectionName: '',
          description: '',
        },
      });
      setTimeout(() => {
        dispatch(setExistanceSuccess(null));
      }, 3000);
    }
    if (existanceError) {
      setTimeout(() => {
        dispatch(setExistanceError(null));
      }, 3000);
    }
  }, [existanceSuccess, existanceError, dispatch, formik]);

  document.title = 'Add Question Section';

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                    return false;
                  }}
                >
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New Question Section</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(existanceSuccess || existanceError) ? (
                      <div className="admin-form-alerts">
                        {existanceSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {existanceSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {existanceError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {existanceError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="questionSectionName" className="form-label">
                            Question Section Name <span className="required">*</span>
                          </Label>
                          <Input
                            name="questionSectionName"
                            type="text"
                            value={formik.values.questionSectionName || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="questionSectionName"
                            placeholder="Enter Question Section Name"
                            invalid={Boolean(formik.touched.questionSectionName && formik.errors.questionSectionName)}
                          />
                          {formik.touched.questionSectionName && formik.errors.questionSectionName ? (
                            <FormFeedback type="invalid">{formik.errors.questionSectionName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={6} md={6}>
                        <div>
                          <Label htmlFor="description" className="form-label">
                            Description <span className="required">*</span>
                          </Label>
                          <Input
                            name="description"
                            type="text"
                            value={formik.values.description || ''}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="description"
                            placeholder="Enter Description"
                            invalid={Boolean(formik.touched.description && formik.errors.description)}
                          />
                          {formik.touched.description && formik.errors.description ? (
                            <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listexistance" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
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

export default AddExistance;
