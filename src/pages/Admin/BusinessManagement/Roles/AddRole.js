import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Input, Label, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { FormFeedback } from 'reactstrap';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";

//redux
import { useSelector, useDispatch } from "react-redux";
import { setRoleError, setRoleSuccess } from '../../../../slices/admin/role/reducer';
import { createRole, getFirmDetails } from "../../../../slices/admin/role/thunk";

const AddRole = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Redux state
  const { roleSuccess, roleError, roleLoading } = useSelector((state) => state?.Role || {});
  const firmList = useSelector((state) => state?.Role?.firmList || []);
  const firmLoading = useSelector((state) => state?.Role?.firmLoading || false);

  // Fetch firms on component mount
  useEffect(() => {
    dispatch(getFirmDetails());
  }, [dispatch]);

  // Transform firm list to react-select format
  const firmOptions = useMemo(() => {
    if (!firmList || !Array.isArray(firmList)) {
      return [];
    }
    return firmList
      .filter((firm) => !firm.deleteStatus) // Filter out deleted firms
      .map((firm) => ({
        value: firm.firmId.toString(),
        label: firm.firmName
      }));
  }, [firmList]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      roleName: '',
      firmIds: ''
    },
    validationSchema: Yup.object({
      roleName: Yup.string().required("Please Enter Role Name"),
      firmIds: Yup.string().required("Please Select Firm")
    }),
    onSubmit: (values) => {
      dispatch(createRole({
        "roleId": 0,
        "roleName": values.roleName,
        "firmIds": values.firmIds || "",
        "enteredBy": userDetails?.userName || userDetails?.userId || "Admin",
        "enteredDate": new Date().toISOString(),
        "deleteStatus": false
      }));
    }
  });

  useEffect(() => {
    if (roleSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setRoleSuccess(null));
      }, 2000);
    }
    if (roleError) {
      setTimeout(() => {
        dispatch(setRoleError(null));
      }, 2000);
    }
  }, [roleSuccess, roleError, dispatch]);

  document.title = "Add Role";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {roleSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {roleSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {roleError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {roleError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Role</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="roleName" className="form-label">Role Name</Label>
                            <Input
                              name='roleName'
                              type="text"
                              value={formik.values.roleName || ""}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="roleName"
                              placeholder="Enter Role Name"
                              invalid={
                                formik.touched.roleName && formik.errors.roleName ? true : false
                              }
                            />
                            {formik.touched.roleName && formik.errors.roleName ? (
                              <FormFeedback type="invalid"><div>{formik.errors.roleName}</div></FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="firmIds" className="form-label">Firm Name</Label>
                            <Select
                              value={firmOptions.find(option => option.value === formik.values.firmIds) || null}
                              onChange={(selectedOption) => {
                                formik.setFieldValue('firmIds', selectedOption ? selectedOption.value : '');
                              }}
                              onBlur={() => formik.setFieldTouched('firmIds', true)}
                              options={firmOptions}
                              isLoading={firmLoading}
                              placeholder="Select Firm"
                              className={formik.touched.firmIds && formik.errors.firmIds ? 'is-invalid' : ''}
                            />
                            {formik.touched.firmIds && formik.errors.firmIds ? (
                              <div className="invalid-feedback d-block">{formik.errors.firmIds}</div>
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
                          <Link to="/admin/listrole">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type='submit' disabled={roleLoading}>
                            {roleLoading ? (
                              <>
                                <Spinner size="sm" className="me-2" /> Saving...
                              </>
                            ) : (
                              <>
                                <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
                              </>
                            )}
                          </Button>
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

export default AddRole;

