import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from "react-select";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { addDrugGroup } from "../../../../slices/admin/druggroup/thunk";
import { getDrugSystemList } from "../../../../slices/admin/drugsystem/thunk";
import { setDrugGroupSuccess, setDrugGroupError } from "../../../../slices/admin/druggroup/reducer";

const AddDrugGroup = () => {
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
      drugGroupId: 0,
      drugSystemId: null,
      drugSystemName: '',
      drugGroupName: '',
      deleteStatus: false
    },
    validationSchema: Yup.object({
      drugGroupName: Yup.string().required("Please Enter Drug Group Name"),
      drugSystemId: Yup.object().shape({
        value: Yup.string().required("Please Select Drug System"),
      }).nullable().required("Please Select Drug System"),
    }),
    onSubmit: (values) => {
      dispatch(addDrugGroup({
        drugGroupId: values.drugGroupId,
        drugSystemId: values.drugSystemId.value,
        drugGroupName: values.drugGroupName,
        drugSystemName: values.drugSystemName.label,
        deleteStatus: false
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

  document.title = "Add Drug Group";
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
                      <h5 className="admin-form-title">New Drug Group</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(drugGroupSuccess || drugGroupError) ? (
                      <div className="admin-form-alerts">
                        {drugGroupSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {drugGroupSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {drugGroupError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {drugGroupError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.drugSystemId && formik.errors.drugSystemId),
                            })}
                            className={formik.touched.drugSystemId && formik.errors.drugSystemId ? "is-invalid" : ""}
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
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listdruggroup" className="d-inline-flex">
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

export default AddDrugGroup;
