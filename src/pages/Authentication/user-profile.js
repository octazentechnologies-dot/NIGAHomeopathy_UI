import React, { useState, useEffect } from "react";
import { isEmpty } from "lodash";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Alert,
  Label,
  Input,
  FormFeedback,
  Form,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

import ModalActionButton from "../../Components/Common/ModalActionButton";
import { editProfile, resetProfileFlag } from "../../slices/thunks";
import { navigateToRoleDashboard } from "../../helpers/navigateToRoleDashboard";

const ProfileBadge = ({ tone = "neutral", children }) => (
  <span className={`user-profile-page__badge user-profile-page__badge--${tone}`}>
    {children}
  </span>
);

const ProfileInfoField = ({ icon, label, children }) => (
  <Col lg={4} md={6} xs={12}>
    <div className="user-profile-page__field">
      <Label className="form-label new-patient-modal__label">
        <i className={icon} aria-hidden="true" />
        {label}
      </Label>
      <div className="user-profile-page__value">{children}</div>
    </div>
  </Col>
);

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [email, setemail] = useState("admin@gmail.com");
  const [idx, setidx] = useState("1");
  const [userName, setUserName] = useState("Admin");

  const selectLayoutState = (state) => state.Profile;
  const userprofileData = createSelector(selectLayoutState, (state) => ({
    user: state.user,
    success: state.success,
    error: state.error,
  }));

  const { user, success, error } = useSelector(userprofileData);

  useEffect(() => {
    const authUserStr = sessionStorage.getItem("authUser");
    if (authUserStr) {
      try {
        const obj = JSON.parse(authUserStr);
        const userInfo = obj.data || obj;

        if (userInfo) {
          setUserData(userInfo);
          setUserName(userInfo.userName || "Admin");
          setemail(userInfo.email || "N/A");
          setidx(userInfo.userId || userInfo._id || "1");

          if (!isEmpty(user)) {
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
      } catch (parseError) {
        console.error("Error parsing authUser:", parseError);
      }
    }
  }, [dispatch, user]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: userName || "Admin",
      idx: idx || "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("Please Enter Your UserName"),
    }),
    onSubmit: (values) => {
      dispatch(editProfile(values));
    },
  });

  const handleBackToDashboard = () => {
    navigateToRoleDashboard(navigate);
  };

  const getDaysRemainingTone = (days) => {
    if (days > 7) return "success";
    if (days > 3) return "warning";
    return "danger";
  };

  document.title = "Profile | Niga Homeocentrum";

  return (
    <div className="page-content user-profile-page doctor-dashboard-page">
      <Container fluid>
        <Row>
          <Col xs={12}>
            <Card className="user-profile-card doctor-stats-card">
              <CardBody className="user-profile-card__body">
            {error ? <Alert color="danger" className="mb-3">{error}</Alert> : null}
            {success ? (
              <Alert color="success" className="mb-3">
                Username updated to {userName}
              </Alert>
            ) : null}

            <div className="user-profile-page__summary">
              <span className="user-profile-page__avatar" aria-hidden="true">
                <i className="ri-user-heart-line" />
              </span>
              <div className="min-w-0">
                <h5 className="user-profile-page__summary-name text-truncate">{userName || "Admin"}</h5>
                <p className="user-profile-page__summary-meta">
                  <i className="ri-mail-line" aria-hidden="true" />
                  <span>Email: {email}</span>
                </p>
                <p className="user-profile-page__summary-meta mb-0">
                  <i className="ri-hashtag" aria-hidden="true" />
                  <span>User ID: #{idx}</span>
                </p>
              </div>
            </div>

            {userData ? (
              <>
                <h5 className="user-profile-page__section-title">
                  <i className="ri-information-line" aria-hidden="true" />
                  User Information
                </h5>
                <Row className="g-3 new-patient-modal__fields user-profile-page__info-grid">
                  <ProfileInfoField icon="ri-user-line" label="Full Name">
                    {userData.userName || "N/A"}
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-user-3-line" label="First Name">
                    {userData.firstName || "N/A"}
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-user-4-line" label="Last Name">
                    {userData.lastName || "N/A"}
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-shield-user-line" label="Role">
                    <ProfileBadge tone="info">{userData.role || "N/A"}</ProfileBadge>
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-key-line" label="Role ID">
                    {userData.roleId || "N/A"}
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-fingerprint-line" label="User ID">
                    #{userData.userId || "N/A"}
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-vip-crown-line" label="Super User">
                    <ProfileBadge tone={userData.isSuperUser ? "success" : "neutral"}>
                      {userData.isSuperUser ? "Yes" : "No"}
                    </ProfileBadge>
                  </ProfileInfoField>
                  <ProfileInfoField icon="ri-checkbox-circle-line" label="Plan Status">
                    <ProfileBadge tone={userData.isPlanActive ? "success" : "danger"}>
                      {userData.isPlanActive ? "Active" : "Inactive"}
                    </ProfileBadge>
                  </ProfileInfoField>
                  {userData.daysRemaining !== undefined ? (
                    <ProfileInfoField icon="ri-timer-line" label="Days Remaining">
                      <ProfileBadge tone={getDaysRemainingTone(userData.daysRemaining)}>
                        {userData.daysRemaining} days
                      </ProfileBadge>
                    </ProfileInfoField>
                  ) : null}
                  {userData.firmIds ? (
                    <ProfileInfoField icon="ri-building-line" label="Firm IDs">
                      {userData.firmIds}
                    </ProfileInfoField>
                  ) : null}
                </Row>
              </>
            ) : null}

            <div className="user-profile-page__divider" />

            <Form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
            >
              <div className="user-profile-page__row-section">
                <h5 className="user-profile-page__section-title">
                  <i className="ri-edit-line" aria-hidden="true" />
                  Change User Name
                </h5>
                <Row className="g-3 new-patient-modal__fields">
                  <Col xs={12}>
                    <Label htmlFor="profileUserName" className="form-label new-patient-modal__label">
                      <i className="ri-user-line" aria-hidden="true" />
                      User Name
                    </Label>
                    <Input
                      id="profileUserName"
                      name="first_name"
                      className="form-control"
                      placeholder="Enter user name"
                      type="text"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={validation.values.first_name || ""}
                      invalid={Boolean(validation.touched.first_name && validation.errors.first_name)}
                    />
                    {validation.touched.first_name && validation.errors.first_name ? (
                      <FormFeedback type="invalid">{validation.errors.first_name}</FormFeedback>
                    ) : null}
                    <Input name="idx" value={idx} type="hidden" />
                  </Col>
                </Row>
              </div>

              <div className="user-profile-page__form-footer">
                <ModalActionButton action="cancel" type="button" onClick={handleBackToDashboard}>
                  Cancel
                </ModalActionButton>
                <ModalActionButton action="update" type="submit">
                  Update User Name
                </ModalActionButton>
              </div>
            </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UserProfile;
