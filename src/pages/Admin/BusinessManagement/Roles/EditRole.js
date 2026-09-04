import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, UncontrolledAlert, Form, FormFeedback, Input, Label, Row, Spinner } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as Yup from "yup";
import { useFormik } from "formik";
import Select from "react-select";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';
import { useSelector, useDispatch } from "react-redux";
import { setRoleError, setRoleSuccess } from '../../../../slices/admin/role/reducer';
import { getRoleById, updateRole, getFirmDetails } from "../../../../slices/admin/role/thunk";

const EditRole = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  // Get roleId from location state
  const roleId = location.state?.roleId || null;

  // Redux state
  const { roleSuccess, roleError, roleLoading, selectedRole } = useSelector((state) => state?.Role || {});
  const firmList = useSelector((state) => state?.Role?.firmList || []);
  const firmLoading = useSelector((state) => state?.Role?.firmLoading || false);

  // Fetch role data and firms on component mount
  useEffect(() => {
    dispatch(getFirmDetails());
    if (roleId) {
      dispatch(getRoleById(roleId));
    } else {
      // If no roleId, redirect back to list
      navigate('/admin/listrole');
    }
  }, [dispatch, roleId, navigate]);

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
      roleName: selectedRole?.roleName || '',
      firmIds: selectedRole?.firmIds || ''
    },
    validationSchema: Yup.object({
      roleName: Yup.string().required("Please Enter Role Name"),
      firmIds: Yup.string().required("Please Enter Firm")
    }),
    onSubmit: (values) => {
      dispatch(updateRole({
        "roleId": roleId,
        "roleName": values.roleName,
        "firmIds": values.firmIds,
        "ChangedBy": userDetails?.userName || userDetails?.userId || "Admin",
        "ChangedDate": new Date().toISOString(),
        "deleteStatus": selectedRole?.deleteStatus || false
      }));
    }
  });

  useEffect(() => {
    if (roleSuccess) {
      setTimeout(() => {
        dispatch(setRoleSuccess(null));
        navigate('/admin/listrole');
      }, 2000);
    }
    if (roleError) {
      setTimeout(() => {
        dispatch(setRoleError(null));
      }, 2000);
    }
  }, [roleSuccess, roleError, dispatch, navigate]);

  if (!roleId) {
    return null;
  }

  document.title = "Edit Role";
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
                      <h5 className="admin-form-title">Edit Role</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(roleSuccess || roleError) ? (
                      <div className="admin-form-alerts">
                        {roleSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {roleSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {roleError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {roleError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    {roleLoading && !selectedRole ? (
                      <div className="text-center">
                        <Spinner color="primary" />
                      </div>
                    ) : (
                      <Row className="gy-3 admin-form-fields">
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
                              <FormFeedback type="invalid">{formik.errors.roleName}</FormFeedback>
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
                              classNamePrefix="admin-form-select"
                              theme={neutralSelectTheme}
                              styles={getAdminFormSelectStyles({
                                invalid: Boolean(formik.touched.firmIds && formik.errors.firmIds),
                              })}
                              className={formik.touched.firmIds && formik.errors.firmIds ? 'is-invalid' : ''}
                            />
                            {formik.touched.firmIds && formik.errors.firmIds ? (
                              <div className="invalid-feedback d-block">{formik.errors.firmIds}</div>
                            ) : null}
                          </div>
                        </Col>
                      </Row>
                    )}
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listrole" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new" disabled={roleLoading || !selectedRole}>
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          Update
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

export default EditRole;
