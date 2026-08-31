import React, { useState, useEffect } from "react";
import { isEmpty } from "lodash";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  CardBody,
  Button,
  Label,
  Input,
  FormFeedback,
  Form,
} from "reactstrap";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";

import avatar from "../../assets/images/users/avatar-1.jpg";
// actions
import { editProfile, resetProfileFlag } from "../../slices/thunks";
import { createSelector } from "reselect";
import { UserRole } from "../../Components/constants/roles";

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [email, setemail] = useState("admin@gmail.com");
  const [idx, setidx] = useState("1");
  const [userName, setUserName] = useState("Admin");

  const selectLayoutState = (state) => state.Profile;
  const userprofileData = createSelector(
    selectLayoutState,
    (state) => ({
      user: state.user,
      success: state.success,
      error: state.error
    })
  );
  // Inside your component
  const {
    user, success, error 
  } = useSelector(userprofileData);

  useEffect(() => {
    const authUserStr = sessionStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const obj = JSON.parse(authUserStr);
        // Handle both direct user object and wrapped in data property
        const userInfo = obj.data || obj;

        if (userInfo) {
          setUserData(userInfo);
          setUserName(userInfo.userName || "Admin");
          setemail(userInfo.email || "N/A");
          setidx(userInfo.userId || userInfo._id || "1");

          if (!isEmpty(user)) {
            // Update logic if needed
            const updatedObj = { ...obj };
            if (updatedObj.data) {
              updatedObj.data.first_name = user.first_name;
            } else {
              updatedObj.first_name = user.first_name;
            }
            sessionStorage.setItem("authUser", JSON.stringify(updatedObj));
          }
        }

        setTimeout(() => {
          dispatch(resetProfileFlag());
        }, 3000);
      } catch (error) {
        console.error("Error parsing authUser:", error);
      }
    }
  }, [dispatch, user]);



  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      first_name: userName || 'Admin',
      idx: idx || '',
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("Please Enter Your UserName"),
    }),
    onSubmit: (values) => {
      dispatch(editProfile(values));
    }
  });

  // Function to handle back button click - navigate to appropriate dashboard based on role
  const handleBackToDashboard = () => {
    const authUserStr = sessionStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const obj = JSON.parse(authUserStr);
        const userInfo = obj.data || obj;
        const userRole = userInfo?.role;

        if (userRole === UserRole.ADMIN) {
          navigate("/dashboard");
        } else if (userRole === UserRole.DOCTOR || userRole === UserRole.RECEPTION) {
          navigate("/doctordashboard");
        } else {
          // Default to dashboard if role is not recognized
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error parsing authUser:", error);
        navigate("/dashboard");
      }
    } else {
      navigate("/dashboard");
    }
  };

  document.title = "Profile | Velzon - React Admin & Dashboard Template";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row className="mb-3">
            <Col lg="12">
              <Button
                color="secondary"
                onClick={handleBackToDashboard}
                className="d-flex align-items-center"
              >
                <i className="mdi mdi-arrow-left me-2"></i>
                Back to Dashboard
              </Button>
            </Col>
          </Row>
          <Row>
            <Col lg="12">
              {error && error ? <Alert color="danger">{error}</Alert> : null}
              {success ? <Alert color="success">Username Updated To {userName}</Alert> : null}

              <Card>
                <CardBody>
                  <div className="d-flex">
                    <div className="mx-3">
                      <img
                        src={avatar}
                        alt=""
                        className="avatar-md rounded-circle img-thumbnail"
                      />
                    </div>
                    <div className="flex-grow-1 align-self-center">
                      <div className="text-muted">
                        <h5>{userName || "Admin"}</h5>
                        <p className="mb-1">Email Id : {email}</p>
                        <p className="mb-0">User ID : #{idx}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Additional User Information */}
              {userData && (
                <Card className="mt-4">
                  <CardBody>
                    <h4 className="card-title mb-4">User Information</h4>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Full Name</Label>
                          <p className="mb-0">{userData.userName || "N/A"}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">First Name</Label>
                          <p className="mb-0">{userData.firstName || "N/A"}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Last Name</Label>
                          <p className="mb-0">{userData.lastName || "N/A"}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Role</Label>
                          <p className="mb-0">
                            <span className="badge bg-primary">{userData.role || "N/A"}</span>
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Role ID</Label>
                          <p className="mb-0">{userData.roleId || "N/A"}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">User ID</Label>
                          <p className="mb-0">#{userData.userId || "N/A"}</p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Super User</Label>
                          <p className="mb-0">
                            <span className={`badge ${userData.isSuperUser ? "bg-success" : "bg-secondary"}`}>
                              {userData.isSuperUser ? "Yes" : "No"}
                            </span>
                          </p>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="fw-semibold text-muted">Plan Status</Label>
                          <p className="mb-0">
                            <span className={`badge ${userData.isPlanActive ? "bg-success" : "bg-danger"}`}>
                              {userData.isPlanActive ? "Active" : "Inactive"}
                            </span>
                          </p>
                        </div>
                      </Col>
                      {userData.daysRemaining !== undefined && (
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="fw-semibold text-muted">Days Remaining</Label>
                            <p className="mb-0">
                              <span className={`badge ${userData.daysRemaining > 7 ? "bg-success" : userData.daysRemaining > 3 ? "bg-warning" : "bg-danger"}`}>
                                {userData.daysRemaining} days
                              </span>
                            </p>
                          </div>
                        </Col>
                      )}
                      {userData.firmIds && (
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="fw-semibold text-muted">Firm IDs</Label>
                            <p className="mb-0">{userData.firmIds}</p>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>

          <h4 className="card-title mb-4">Change User Name</h4>

          <Card>
            <CardBody>
              <Form
                className="form-horizontal"
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                <div className="form-group">
                  <Label className="form-label">User Name</Label>
                  <Input
                    name="first_name"
                    // value={name}
                    className="form-control"
                    placeholder="Enter User Name"
                    type="text"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.first_name || ""}
                    invalid={
                      validation.touched.first_name && validation.errors.first_name ? true : false
                    }
                  />
                  {validation.touched.first_name && validation.errors.first_name ? (
                    <FormFeedback type="invalid">{validation.errors.first_name}</FormFeedback>
                  ) : null}
                  <Input name="idx" value={idx} type="hidden" />
                </div>
                <div className="text-center mt-4">
                  <Button type="submit" color="danger">
                    Update User Name
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default UserProfile;
