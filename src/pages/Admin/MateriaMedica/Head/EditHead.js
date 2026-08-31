import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
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
import { updateHead, getAuthorForCreateOrUpdateHead } from '../../../../slices/thunks';
import { setHeadError, setHeadSuccess } from "../../../../slices/admin/materiaMedica/head/reducer";


const EditHead = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const [selectedSingle, setSelectedSingle] = useState(null);
  const [selectedMulti2, setselectedMulti2] = useState(null);

  // Redux state
  const { authors } = useSelector((state) => state?.Head || {});
  const { headSuccess, headError } = useSelector((state) => state?.Head || {});
  const SingleOptions = authors?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      headName: location.state.selectedHead.materiaMedicaHeadName,
      author: SingleOptions.find((author) => author.label === location.state.selectedHead.authorName),
      seqNo: location.state.selectedHead.seqNo,
      description: location.state.selectedHead.description,
      isSection: location.state.selectedHead.isSection
    },
    validationSchema: Yup.object({
      headName: Yup.string().required("Please Enter Head Name"),
      author: Yup.object().shape({
        value: Yup.string().required("Please Select Author"),
      }).nullable().required("Please Select Author"),
      //description: Yup.string().required("Please Enter Description")
    }),
    onSubmit: (values) => {
      debugger
      dispatch(updateHead({
        "materiaMedicaHeadId": location.state.selectedHead.materiaMedicaHeadId,
        "authorId": values.author.value,
        "materiaMedicaHeadName": values.headName,
        "isSection": values.isSection,
        "description": values.description,
        "seqNo": values.seqNo,
        "isDeleted": false
      }));
    }
  });

  useEffect(() => {
    dispatch(getAuthorForCreateOrUpdateHead(null));
  }, [])

  useEffect(() => {
    if (headSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setHeadSuccess(null));
      }, 2000);
      if (headError) {
        setTimeout(() => {
          dispatch(setHeadError(null));
        }, 2000);
      }
    }
  }, [headSuccess, headError]);



  function handleSelectSingle(selectedSingle) {
    setSelectedSingle(selectedSingle);
  }

  function handleMulti2(selectedMulti2) {
    setselectedMulti2(selectedMulti2);
  }


  document.title = "Edit Head";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {headSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow " style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {headSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {headError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {headError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  debugger
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Head</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Head Name</Label>
                            <Input
                              name='headName'
                              type="input"
                              value={formik.values.headName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              placeholder="Enter Head Name"
                              invalid={
                                formik.touched.headName && formik.errors.headName ? true : false
                              } />
                            {formik.touched.headName && formik.errors.headName ?
                              (<FormFeedback type="invalid">{formik.errors.headName}</FormFeedback>) : null
                            }
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Author Name</Label>
                            <Select
                              name="author"
                              value={formik.values.author}
                              onChange={(selectedOption) => formik.setFieldValue("author", selectedOption)}
                              options={SingleOptions}
                              onBlur={() => formik.setFieldTouched("author", true)} // Mark field as touched
                              className={formik.touched.author && formik.errors.author ? "is-invalid" : ""}
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: formik.touched.author && formik.errors.author ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.author && formik.errors.author ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.author && formik.errors.author ? (
                              <FormFeedback type="invalid">{formik.errors.author}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Seq. No.</Label>
                            <Input
                              name='seqNo'
                              type="input"
                              value={formik.values.seqNo}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="placeholderInput"
                              disabled placeholder="Seq. No."
                              invalid={formik.touched.seqNo && formik.errors.seqNo ? true : false} />
                            {formik.touched.seqNo && formik.errors.seqNo ?
                              <FormFeedback type="invalid">{formik.errors.seqNo}</FormFeedback> : null
                            }
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={8} md={8}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Description</Label>
                            <textarea
                              name='description'
                              value={formik.values.description}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="exampleFormControlTextarea5"
                              rows="1"
                              placeholder="Enter Description" ></textarea>
                          </div>
                        </Col>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="placeholderInput" className="form-label">Is Section ?</Label>
                            <div className="form-check form-switch form-switch-lg mt-1" dir="ltr">
                              <Input
                                name='isSection'
                                type="checkbox"
                                className="form-check-input"
                                id="customSwitchsizelg"
                                checked={formik.values.isSection}
                                onChange={() => formik.setFieldValue('isSection', !formik.values.isSection)} />
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
                          <Link to="/admin/listhead"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                          <Button color="success" className="btn-label" type="submit"> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Update </Button>
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

export default EditHead;