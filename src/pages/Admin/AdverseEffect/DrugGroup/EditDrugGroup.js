import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateDrugGroup } from "../../../../slices/admin/druggroup/thunk";
import { getDrugSystemList } from "../../../../slices/admin/drugsystem/thunk";
import { setDrugGroupSuccess, setDrugGroupError } from "../../../../slices/admin/druggroup/reducer";

const EditDrugGroup = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { drugSystemList, drugSystemLoading } = useSelector((state) => state?.DrugSystem);
  const { drugGroupSuccess, drugGroupError } = useSelector((state) => state?.DrugGroup);

  // Format drug system options for Select component
  const drugSystemOptions = useMemo(() => {
    return drugSystemList?.resultObject?.map((system) => ({
      label: system.drugSystemName,
      value: system.drugSystemId,
    })) || [];
  }, [drugSystemList]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      drugGroupId: location.state.selectedDrugGroup.drugGroupId,
      drugSystemId: drugSystemOptions.find((system) => system.value === location.state.selectedDrugGroup.drugSystemId),
      drugGroupName: location.state.selectedDrugGroup.drugGroupName,
    },
    validationSchema: Yup.object({
      drugGroupName: Yup.string().required("Please Enter Drug Group Name"),
      drugSystemId: Yup.object().shape({
        value: Yup.string().required("Please Select Drug System"),
      }).nullable().required("Please Select Drug System"),
    }),
    onSubmit: (values) => {
      dispatch(updateDrugGroup({
        drugGroupId: values.drugGroupId,
        drugSystemId: values.drugSystemId.value,
        drugGroupName: values.drugGroupName,
        
      }));
    }
  });

  useEffect(() => {
    dispatch(getDrugSystemList());
  }, [dispatch]);

  useEffect(() => {
    if (drugGroupSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setDrugGroupSuccess(null));
      }, 2000);
    }
    if (drugGroupError) {
      setTimeout(() => {
        dispatch(setDrugGroupError(null));
      }, 2000);
    }
  }, [drugGroupSuccess, drugGroupError]);

  document.title = "Edit Drug Group";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Edit Drug Group" pageTitle="Drug Group" />
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {drugGroupSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {drugGroupSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {drugGroupError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {drugGroupError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Edit Drug Group</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">


                      <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="drugSystemId" className="form-label">
                              Drug System <span className="required">*</span>
                            </Label>
                            <Select
                              name="drugSystemId"
                              value={formik.values.drugSystemId}
                              onChange={(selectedOption) => formik.setFieldValue("drugSystemId", selectedOption)}
                              options={drugSystemOptions}
                              isLoading={drugSystemLoading}
                              onBlur={() => formik.setFieldTouched("drugSystemId", true)}
                              className={formik.touched.drugSystemId && formik.errors.drugSystemId ? "is-invalid" : ""}
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: formik.touched.drugSystemId && formik.errors.drugSystemId ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.drugSystemId && formik.errors.drugSystemId ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.drugSystemId && formik.errors.drugSystemId ? (
                              <FormFeedback type="invalid">{formik.errors.drugSystemId}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="drugGroupName" className="form-label">Drug Group Name <span className="required">*</span></Label>
                            <Input
                              name='drugGroupName'
                              type="text"
                              value={formik.values.drugGroupName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="drugGroupName"
                              placeholder="Enter Drug Group Name"
                              invalid={formik.touched.drugGroupName && formik.errors.drugGroupName ? true : false}
                            />
                            {formik.touched.drugGroupName && formik.errors.drugGroupName ? (
                              <FormFeedback type="invalid">{formik.errors.drugGroupName}</FormFeedback>
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
                          <Link to="/admin/listdruggroup">
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

export default EditDrugGroup;