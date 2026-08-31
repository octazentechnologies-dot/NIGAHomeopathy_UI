import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, FormGroup, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { useLocation } from 'react-router-dom';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createAuthor, updateAuthor } from '../../../../slices/thunks';
import { setAuthorError, setAuthorSuccess } from '../../../../slices/admin/materiaMedica/author/reducer';

const SingleOptions = [
  { value: 'Choices 1', label: 'Choices 1' },
  { value: 'Choices 2', label: 'Choices 2' },
  { value: 'Choices 3', label: 'Choices 3' },
  { value: 'Choices 4', label: 'Choices 4' }
];


const Starter = () => {


  /* const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti2, setselectedMulti2] = useState(null);

  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  function handleMulti2(selectedMulti2) {
    setselectedMulti2(selectedMulti2);
  } */
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { authorSuccess, authorError } = useSelector((state) => state?.Author);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      authorName: location.state.selectedAuthor.authorName,
      authorAlias: location.state.selectedAuthor.authorAlias,
      isForRepertory: !!location.state.selectedAuthor.isForRepertory,
      description: location.state.selectedAuthor.description
    },
    validationSchema: Yup.object({
      authorName: Yup.string().required("Please Enter Author Name"),
      authorAlias: Yup.string().required("Please Enter Author Alias"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      /*  console.log({
         "authorId": 0,
         "authorName": values.authorName,
         "authorAlias": values.authorAlias,
         "isForRepertory": values.isForRepertory,
         "description": values.description,
         "enteredBy": "Admin",
         "deleteStatus": false
       }); */
      dispatch(updateAuthor({
        "authorId": location.state.selectedAuthor.authorId,
        "authorName": values.authorName,
        "authorAlias": values.authorAlias,
        "isForRepertory": values.isForRepertory,
        "description": values.description,
        "enteredBy": "Admin",
        "isDeleted": false
      }));
    }
  });

  useEffect(() => {
    if (authorSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setAuthorSuccess(null));
      }, 2000);
      if (authorError) {
        setTimeout(() => {
          dispatch(setAuthorError(null));
        }, 2000);
      }
    }
  }, [authorSuccess, authorError]);

  document.title = "Edit Author";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {authorSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {authorSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {authorError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {authorError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Author</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Author Name</Label>
                            <Input
                              name='authorName'
                              type="input"
                              value={formik.values.authorName || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Author Name"
                              invalid={
                                formik.touched.authorName && formik.errors.authorName ? true : false
                              } />
                            {formik.touched.authorName && formik.errors.authorName ? (
                              <FormFeedback type="invalid"><div>{formik.errors.authorName}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Author Alias</Label>
                            <Input
                              name='authorAlias'
                              type="input"
                              value={formik.values.authorAlias || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Author Alias"
                              invalid={
                                formik.touched.authorAlias && formik.errors.authorAlias ? true : false
                              } />
                            {formik.touched.authorAlias && formik.errors.authorAlias ? (
                              <FormFeedback type="invalid"><div>{formik.errors.authorAlias}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Is For Repertory ?</Label>
                            <div className="form-check form-switch form-switch-lg mt-1" dir="ltr">
                              <Input
                                name='isForRepertory'
                                type="checkbox"
                                checked={!!formik.values.isForRepertory}
                                onChange={(e) => formik.setFieldValue('isForRepertory', e.target.checked)}
                                onBlur={formik.handleBlur}
                                className="form-check-input"
                                id="customSwitchsizelg"
                                invalid={formik.touched.isForRepertory && !!formik.errors.isForRepertory} />
                              {formik.touched.isForRepertory && formik.errors.isForRepertory && (
                                <FormFeedback>{formik.errors.isForRepertory}</FormFeedback>
                              )}
                            </div>
                          </div>
                        </Col>

                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={12} md={12}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="exampleFormControlTextarea5"
                              rows="1"
                              placeholder="Enter Description"
                              invalid={
                                formik.touched.description && formik.errors.description ? true : false
                              }></textarea>
                            {formik.touched.description && formik.errors.description && (
                              <FormFeedback>{formik.errors.description}</FormFeedback>
                            )}
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
                          <Link to="/admin/listauthor"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type='submit'> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update </Button>
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

export default Starter;