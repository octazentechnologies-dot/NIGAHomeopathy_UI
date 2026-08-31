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
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
              <Col lg={12}>
                <Card>
                  <div className="p-2">
                    {userSuccess ? (
                      <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                        <i className="ri-notification-off-line label-icon"></i>
                        {userSuccess}
                      </UncontrolledAlert>
                    ) : null}
                    {userError ? (
                      <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                        <i className="ri-error-warning-line label-icon"></i>
                        {userError}
                      </UncontrolledAlert>
                    ) : null}
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                    return false;
                  }}>
                    <CardHeader className="align-items-center d-flex">
                      <h4 className="card-title mb-0 flex-grow-1">New User</h4>
                    </CardHeader>

                    <CardBody className="card-body">
                      <div className="live-preview">
                        <Row className="gy-4">
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

                        <Row className="mt-3">  
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

                        <Row className="mt-3">
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
                            <Link to="/admin/listusers">
                              <Button color="danger" className="btn-label">
                                <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                              </Button>
                            </Link>
                            <Button 
                              color="success" 
                              className="btn-label" 
                              type="submit"
                              disabled={userLoading}
                            >
                              {userLoading ? (
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

export default Starter;
