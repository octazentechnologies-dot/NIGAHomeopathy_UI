import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button, UncontrolledAlert, FormFeedback } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useDispatch, useSelector } from "react-redux";
import { getRoleMaster, createUser } from "../../../../slices/admin/users/thunk";
import { setUserError, setUserSuccess } from "../../../../slices/admin/users/reducer";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

import Select from "react-select";
import makeAnimated from "react-select/animated";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const Starter = () => {
  document.title = "Add User";
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem('authUser'));

  const {  quillRef } = useQuill();

  // Redux state for roles
  const roleList = useSelector((state) => state?.User?.roleList || []);
  const roleLoading = useSelector((state) => state?.User?.roleLoading || false);
  const { userSuccess, userError, userLoading } = useSelector((state) => state?.User || {});

  // Fetch roles on component mount
  useEffect(() => {
    dispatch(getRoleMaster());
  }, [dispatch]);

  // Transform role list to react-select format
  const roleOptions = useMemo(() => {
    if (!roleList || !Array.isArray(roleList)) {
      return [];
    }
    return roleList
      .filter((role) => !role.deleteStatus) // Filter out deleted roles
      .map((role) => ({
        value: role.roleId,
        label: role.roleName
      }));
  }, [roleList]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: '',
      lastName: '',
      userName: '',
      emailId: '',
      roleId: null,
      userStatus: false,
      password: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("Please Enter First Name"),
      lastName: Yup.string().required("Please Enter Last Name"),
      userName: Yup.string().required("Please Enter User Name"),
      emailId: Yup.string()
        .email("Please Enter Valid Email")
        .required("Please Enter Email"),
      roleId: Yup.number()
        .required("Please Select Role")
        .min(1, "Please Select Role"),
      password: Yup.string()
        .required("Please Enter Password")
        .min(4, "Password must be at least 4 characters"),
      confirmPassword: Yup.string()
        .required("Please Confirm Password")
        .oneOf([Yup.ref('password')], "Passwords must match")
    }),
    onSubmit: (values) => {
      const userData = {
        userId: 0,
        userName: values.userName,
        userPassword: values.password,
        userStatus: values.userStatus,
        emailId: values.emailId,
        enteredBy: userDetails?.userName || userDetails?.userId || "Admin",
        deleteStatus: false,
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: values.roleId
      };
      dispatch(createUser(userData));
    }
  });

  useEffect(() => {
    if (userSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setUserSuccess(null));
      }, 3000);
    }
    if (userError) {
      setTimeout(() => {
        dispatch(setUserError(null));
      }, 3000);
    }
  }, [userSuccess, userError, dispatch]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">New User</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(userSuccess || userError) ? (
                      <div className="admin-form-alerts">
                        {userSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {userSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {userError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {userError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="firstName" className="form-label">First Name</Label>
                          <Input
                            name="firstName"
                            type="text"
                            value={formik.values.firstName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="firstName"
                            placeholder="Enter First Name"
                            invalid={formik.touched.firstName && formik.errors.firstName ? true : false}
                          />
                          {formik.touched.firstName && formik.errors.firstName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.firstName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="lastName" className="form-label">Last Name</Label>
                          <Input
                            name="lastName"
                            type="text"
                            value={formik.values.lastName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="lastName"
                            placeholder="Enter Last Name"
                            invalid={formik.touched.lastName && formik.errors.lastName ? true : false}
                          />
                          {formik.touched.lastName && formik.errors.lastName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.lastName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="userName" className="form-label">User Name</Label>
                          <Input
                            name="userName"
                            type="text"
                            value={formik.values.userName || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="userName"
                            placeholder="Enter User Name"
                            invalid={formik.touched.userName && formik.errors.userName ? true : false}
                          />
                          {formik.touched.userName && formik.errors.userName ? (
                            <FormFeedback type="invalid"><div>{formik.errors.userName}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="emailId" className="form-label">Email</Label>
                          <Input
                            name="emailId"
                            type="email"
                            value={formik.values.emailId || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="emailId"
                            placeholder="Enter Email"
                            invalid={formik.touched.emailId && formik.errors.emailId ? true : false}
                          />
                          {formik.touched.emailId && formik.errors.emailId ? (
                            <FormFeedback type="invalid"><div>{formik.errors.emailId}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="roleId" className="form-label">Role</Label>
                          <Select
                            value={roleOptions.find(option => option.value === formik.values.roleId) || null}
                            onChange={(selectedOption) => {
                              formik.setFieldValue('roleId', selectedOption ? selectedOption.value : null);
                            }}
                            onBlur={() => formik.setFieldTouched('roleId', true)}
                            options={roleOptions}
                            isLoading={roleLoading}
                            placeholder="Select Role"
                            className={formik.touched.roleId && formik.errors.roleId ? 'is-invalid' : ''}
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({
                              invalid: Boolean(formik.touched.roleId && formik.errors.roleId)
                            })}
                          />
                          {formik.touched.roleId && formik.errors.roleId ? (
                            <div className="invalid-feedback d-block">{formik.errors.roleId}</div>
                          ) : null}
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="userStatus" className="form-label">Status</Label>
                          <div className="form-check form-switch form-switch-lg mt-1" dir="ltr">
                            <Input
                              name="userStatus"
                              type="checkbox"
                              checked={formik.values.userStatus}
                              onChange={(e) => formik.setFieldValue('userStatus', e.target.checked)}
                              className="form-check-input"
                              id="userStatus"
                            />
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="password" className="form-label">Password</Label>
                          <Input
                            name="password"
                            type="password"
                            value={formik.values.password || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="password"
                            placeholder="Enter Password"
                            invalid={formik.touched.password && formik.errors.password ? true : false}
                          />
                          {formik.touched.password && formik.errors.password ? (
                            <FormFeedback type="invalid"><div>{formik.errors.password}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
                          <Input
                            name="confirmPassword"
                            type="password"
                            value={formik.values.confirmPassword || ""}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            invalid={formik.touched.confirmPassword && formik.errors.confirmPassword ? true : false}
                          />
                          {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                            <FormFeedback type="invalid"><div>{formik.errors.confirmPassword}</div></FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listusers" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-sm admin-list-btn admin-list-btn--new"
                          disabled={userLoading}
                        >
                          {userLoading ? (
                            <>
                              <Spinner size="sm" className="me-1" /> Saving...
                            </>
                          ) : (
                            <>
                              <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                              Save
                            </>
                          )}
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

export default Starter;
