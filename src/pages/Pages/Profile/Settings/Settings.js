import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import classnames from "classnames";
import Flatpickr from "react-flatpickr";

import avatar1 from '../../../../assets/images/users/avatar-1.jpg';
import ModalActionButton from '../../../../Components/Common/ModalActionButton';
import { navigateToRoleDashboard } from '../../../../helpers/navigateToRoleDashboard';

const SettingsField = ({ icon, label, htmlFor, className = 'mb-3', children }) => (
    <div className={className}>
        <Label htmlFor={htmlFor} className="form-label new-patient-modal__label">
            <i className={icon} aria-hidden="true" />
            {label}
        </Label>
        {children}
    </div>
);

const SettingsSectionTitle = ({ icon, children }) => (
    <h5 className="user-profile-page__section-title">
        <i className={icon} aria-hidden="true" />
        {children}
    </h5>
);

const Settings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("1");

    const tabChange = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleCancel = () => {
        navigateToRoleDashboard(navigate);
    };

    document.title = "Settings | Niga Homeocentrum";

    return (
        <React.Fragment>
            <div className="page-content user-profile-page user-settings-page doctor-dashboard-page">
                <Container fluid>
                    <Row>
                        <Col xxl={3}>
                            <Card className="user-profile-card doctor-stats-card">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="profile-user position-relative d-inline-block mx-auto  mb-4">
                                            <img src={avatar1}
                                                className="rounded-circle avatar-xl img-thumbnail user-profile-image"
                                                alt="user-profile" />
                                            <div className="avatar-xs p-0 rounded-circle profile-photo-edit">
                                                <Input id="profile-img-file-input" type="file"
                                                    className="profile-img-file-input" />
                                                <Label htmlFor="profile-img-file-input"
                                                    className="profile-photo-edit avatar-xs">
                                                    <span className="avatar-title rounded-circle bg-light text-body">
                                                        <i className="ri-camera-fill"></i>
                                                    </span>
                                                </Label>
                                            </div>
                                        </div>
                                        <h5 className="fs-16 mb-1">Dr. Nikhil Jamdar</h5>
                                        <p className="text-muted mb-0">NIGA Homeopathy</p>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className="user-profile-card doctor-stats-card">
                                <CardBody>
                                    <div className="d-flex align-items-center mb-5">
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-0">
                                                <i className="ri-user-settings-line text-primary me-1" aria-hidden="true" />
                                                Complete Your Profile
                                            </h5>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link to="#" className="badge bg-light text-primary fs-12"><i
                                                className="ri-edit-box-line align-bottom me-1"></i> Edit</Link>
                                        </div>
                                    </div>
                                    <div className="progress animated-progress custom-progress progress-label user-settings-page__profile-progress">
                                        <div className="progress-bar bg-primary" role="progressbar" style={{ "width": "30%" }}
                                            aria-valuenow="30" aria-valuemin="0" aria-valuemax="100">
                                            <div className="label">30%</div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="user-profile-card doctor-stats-card">
                                <CardBody>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-0">
                                                <i className="ri-links-line text-primary me-1" aria-hidden="true" />
                                                Portfolio
                                            </h5>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link to="#" className="badge bg-light text-primary fs-12"><i
                                                className="ri-add-fill align-bottom me-1"></i> Add</Link>
                                        </div>
                                    </div>
                                    <div className="mb-3 d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-dark text-light">
                                                <i className="ri-github-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="email" className="form-control" id="gitUsername" placeholder="@nikhiljamdar"
                                            defaultValue="@nikhiljamdar" />
                                    </div>
                                    <div className="mb-3 d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-primary">
                                                <i className="ri-global-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="text" className="form-control" id="websiteInput"
                                            placeholder="www.nigahomeopathy.com" defaultValue="www.nigahomeopathy.com" />
                                    </div>
                                    <div className="mb-3 d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-success">
                                                <i className="ri-dribbble-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="text" className="form-control" id="dribbleName" placeholder="@drnikhiljamdar"
                                            defaultValue="@drnikhiljamdar" />
                                    </div>
                                    <div className="d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-danger">
                                                <i className="ri-pinterest-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="text" className="form-control" id="pinterestName"
                                            placeholder="Dr. Nikhil Jamdar" defaultValue="Dr. Nikhil Jamdar" />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xxl={9}>
                            <Card className="user-profile-card doctor-stats-card">
                                <CardHeader>
                                    <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0"
                                        role="tablist">
                                        <NavItem>
                                            <NavLink
                                                className={classnames({ active: activeTab === "1" })}
                                                onClick={() => {
                                                    tabChange("1");
                                                }}>
                                                <i className="ri-user-line me-1" aria-hidden="true"></i>
                                                Personal Details
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink to="#"
                                                className={classnames({ active: activeTab === "2" })}
                                                onClick={() => {
                                                    tabChange("2");
                                                }}
                                                type="button">
                                                <i className="ri-lock-password-line me-1" aria-hidden="true"></i>
                                                Change Password
                                            </NavLink>
                                        </NavItem>
                                        <NavItem >
                                            <NavLink to="#"
                                                className={classnames({ active: activeTab === "3" })}
                                                onClick={() => {
                                                    tabChange("3");
                                                }}
                                                type="button">
                                                <i className="ri-briefcase-line me-1" aria-hidden="true"></i>
                                                Experience
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink to="#"
                                                className={classnames({ active: activeTab === "4" })}
                                                onClick={() => {
                                                    tabChange("4");
                                                }}
                                                type="button">
                                                <i className="ri-shield-check-line me-1" aria-hidden="true"></i>
                                                Privacy Policy
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                </CardHeader>
                                <CardBody className="p-4">
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId="1">
                                            <Form>
                                                <Row className="g-3 new-patient-modal__fields">
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-user-3-line" label="First Name" htmlFor="firstnameInput">
                                                            <Input type="text" className="form-control" id="firstnameInput"
                                                                placeholder="Enter your firstname" defaultValue="Nikhil" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-user-4-line" label="Last Name" htmlFor="lastnameInput">
                                                            <Input type="text" className="form-control" id="lastnameInput"
                                                                placeholder="Enter your lastname" defaultValue="Jamdar" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-phone-line" label="Phone Number" htmlFor="phonenumberInput">
                                                            <Input type="text" className="form-control"
                                                                id="phonenumberInput"
                                                                placeholder="Enter your phone number"
                                                                defaultValue="+91 98765 43210" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-mail-line" label="Email Address" htmlFor="emailInput">
                                                            <Input type="email" className="form-control" id="emailInput"
                                                                placeholder="Enter your email"
                                                                defaultValue="dr.nikhil@nigahomeopathy.com" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <SettingsField icon="ri-calendar-line" label="Joining Date" htmlFor="JoiningdatInput">
                                                            <Flatpickr
                                                                className="form-control"
                                                                options={{
                                                                    dateFormat: "d M, Y"
                                                                }}
                                                            />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <SettingsField icon="ri-tools-line" label="Skills" htmlFor="skillsInput">
                                                            <select className="form-select" id="skillsInput">
                                                                <option>Select your Skill</option>
                                                                <option value="Choices1">Homeopathy</option>
                                                                <option value="Choices2">Clinical Practice</option>
                                                                <option value="Choices3">Case Taking</option>
                                                            </select>
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-briefcase-line" label="Designation" htmlFor="designationInput">
                                                            <Input type="text" className="form-control"
                                                                id="designationInput" placeholder="Designation"
                                                                defaultValue="Consulting Homeopath" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <SettingsField icon="ri-global-line" label="Website" htmlFor="websiteInput1">
                                                            <Input type="text" className="form-control" id="websiteInput1"
                                                                placeholder="www.example.com" defaultValue="www.nigahomeopathy.com" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-map-pin-line" label="City" htmlFor="cityInput">
                                                            <Input type="text" className="form-control" id="cityInput"
                                                                placeholder="City" defaultValue="Pune" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-earth-line" label="Country" htmlFor="countryInput">
                                                            <Input type="text" className="form-control" id="countryInput"
                                                                placeholder="Country" defaultValue="India" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-mail-send-line" label="Zip Code" htmlFor="zipcodeInput">
                                                            <Input type="text" className="form-control" minLength="5"
                                                                maxLength="6" id="zipcodeInput"
                                                                placeholder="Enter zipcode" defaultValue="411001" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <SettingsField icon="ri-file-text-line" label="Description" htmlFor="exampleFormControlTextarea" className="mb-3 pb-2">
                                                            <textarea className="form-control"
                                                                id="exampleFormControlTextarea"
                                                                rows="3" defaultValue="Dr. Nikhil Jamdar is a consulting homeopath at NIGA Homeopathy, dedicated to holistic patient care and classical homeopathic practice."></textarea>
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <div className="user-profile-page__form-footer">
                                                            <ModalActionButton action="cancel" type="button" onClick={handleCancel}>
                                                                Cancel
                                                            </ModalActionButton>
                                                            <ModalActionButton action="update" type="button">
                                                                Update Profile
                                                            </ModalActionButton>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                        </TabPane>

                                        <TabPane tabId="2">
                                            <Form>
                                                <Row className="g-3 new-patient-modal__fields">
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-lock-line" label="Old Password" htmlFor="oldpasswordInput">
                                                            <Input type="password" className="form-control"
                                                                id="oldpasswordInput"
                                                                placeholder="Enter current password" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-lock-password-line" label="New Password" htmlFor="newpasswordInput">
                                                            <Input type="password" className="form-control"
                                                                id="newpasswordInput" placeholder="Enter new password" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={4}>
                                                        <SettingsField icon="ri-shield-keyhole-line" label="Confirm Password" htmlFor="confirmpasswordInput">
                                                            <Input type="password" className="form-control"
                                                                id="confirmpasswordInput"
                                                                placeholder="Confirm password" />
                                                        </SettingsField>
                                                    </Col>
                                                    <Col lg={12}>
                                                        <div className="user-profile-page__form-footer">
                                                            <ModalActionButton action="cancel" type="button" onClick={handleCancel}>
                                                                Cancel
                                                            </ModalActionButton>
                                                            <ModalActionButton action="update" type="button">
                                                                Change Password
                                                            </ModalActionButton>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Form>
                                            <div className="user-profile-page__divider" />
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <SettingsSectionTitle icon="ri-history-line">Login History</SettingsSectionTitle>
                                                <Link to="#" className="link-primary">All Logout</Link>
                                            </div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="flex-shrink-0 avatar-sm">
                                                    <div className="avatar-title bg-light text-primary rounded-3 fs-18">
                                                        <i className="ri-smartphone-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>iPhone 12 Pro</h6>
                                                    <p className="text-muted mb-0">Los Angeles, United States - March 16 at
                                                        2:47PM</p>
                                                </div>
                                                <div>
                                                    <Link to="#">Logout</Link>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="flex-shrink-0 avatar-sm">
                                                    <div className="avatar-title bg-light text-primary rounded-3 fs-18">
                                                        <i className="ri-tablet-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Apple iPad Pro</h6>
                                                    <p className="text-muted mb-0">Washington, United States - November 06
                                                        at 10:43AM</p>
                                                </div>
                                                <div>
                                                    <Link to="#">Logout</Link>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center mb-3">
                                                <div className="flex-shrink-0 avatar-sm">
                                                    <div className="avatar-title bg-light text-primary rounded-3 fs-18">
                                                        <i className="ri-smartphone-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Galaxy S21 Ultra 5G</h6>
                                                    <p className="text-muted mb-0">Conneticut, United States - June 12 at
                                                        3:24PM</p>
                                                </div>
                                                <div>
                                                    <Link to="#">Logout</Link>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <div className="flex-shrink-0 avatar-sm">
                                                    <div className="avatar-title bg-light text-primary rounded-3 fs-18">
                                                        <i className="ri-macbook-line"></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1 ms-3">
                                                    <h6>Dell Inspiron 14</h6>
                                                    <p className="text-muted mb-0">Phoenix, United States - July 26 at
                                                        8:10AM</p>
                                                </div>
                                                <div>
                                                    <Link to="#">Logout</Link>
                                                </div>
                                            </div>
                                        </TabPane>

                                        <TabPane tabId="3">
                                            <form>
                                                <div id="newlink">
                                                    <div id="1">
                                                        <Row className="g-3 new-patient-modal__fields">
                                                            <Col lg={12}>
                                                                <SettingsField icon="ri-briefcase-line" label="Job Title" htmlFor="jobTitle">
                                                                    <Input type="text" className="form-control"
                                                                        id="jobTitle" placeholder="Job title"
                                                                        defaultValue="Consulting Homeopath" />
                                                                </SettingsField>
                                                            </Col>
                                                            <Col lg={6}>
                                                                <SettingsField icon="ri-building-line" label="Company Name" htmlFor="companyName">
                                                                    <Input type="text" className="form-control"
                                                                        id="companyName" placeholder="Company name"
                                                                        defaultValue="NIGA Homeopathy" />
                                                                </SettingsField>
                                                            </Col>
                                                            <Col lg={6}>
                                                                <div className="mb-3">
                                                                    <Label htmlFor="experienceYear"
                                                                        className="form-label new-patient-modal__label">
                                                                        <i className="ri-calendar-check-line" aria-hidden="true" />
                                                                        Experience Years
                                                                    </Label>
                                                                    <Row>
                                                                        <Col lg={5}>
                                                                            <select className="form-control" data-choices
                                                                                data-choices-search-false
                                                                                name="experienceYear"
                                                                                id="experienceYear">
                                                                                <option defaultValue="">Select years</option>
                                                                                <option value="Choice 1">2001</option>
                                                                                <option value="Choice 2">2002</option>
                                                                                <option value="Choice 3">2003</option>
                                                                                <option value="Choice 4">2004</option>
                                                                                <option value="Choice 5">2005</option>
                                                                                <option value="Choice 6">2006</option>
                                                                                <option value="Choice 7">2007</option>
                                                                                <option value="Choice 8">2008</option>
                                                                                <option value="Choice 9">2009</option>
                                                                                <option value="Choice 10">2010</option>
                                                                                <option value="Choice 11">2011</option>
                                                                                <option value="Choice 12">2012</option>
                                                                                <option value="Choice 13">2013</option>
                                                                                <option value="Choice 14">2014</option>
                                                                                <option value="Choice 15">2015</option>
                                                                                <option value="Choice 16">2016</option>
                                                                                <option value="Choice 17" >2017</option>
                                                                                <option value="Choice 18">2018</option>
                                                                                <option value="Choice 19">2019</option>
                                                                                <option value="Choice 20">2020</option>
                                                                                <option value="Choice 21">2021</option>
                                                                                <option value="Choice 22">2022</option>
                                                                            </select>
                                                                        </Col>

                                                                        <div className="col-auto align-self-center">
                                                                            to
                                                                        </div>

                                                                        <Col lg={5}>
                                                                            <select className="form-control" data-choices
                                                                                data-choices-search-false
                                                                                name="choices-single-default2">
                                                                                <option defaultValue="">Select years</option>
                                                                                <option value="Choice 1">2001</option>
                                                                                <option value="Choice 2">2002</option>
                                                                                <option value="Choice 3">2003</option>
                                                                                <option value="Choice 4">2004</option>
                                                                                <option value="Choice 5">2005</option>
                                                                                <option value="Choice 6">2006</option>
                                                                                <option value="Choice 7">2007</option>
                                                                                <option value="Choice 8">2008</option>
                                                                                <option value="Choice 9">2009</option>
                                                                                <option value="Choice 10">2010</option>
                                                                                <option value="Choice 11">2011</option>
                                                                                <option value="Choice 12">2012</option>
                                                                                <option value="Choice 13">2013</option>
                                                                                <option value="Choice 14">2014</option>
                                                                                <option value="Choice 15">2015</option>
                                                                                <option value="Choice 16">2016</option>
                                                                                <option value="Choice 17">2017</option>
                                                                                <option value="Choice 18">2018</option>
                                                                                <option value="Choice 19">2019</option>
                                                                                <option value="Choice 20">2020</option>
                                                                                <option value="Choice 21">2021</option>
                                                                                <option value="Choice 22">2022</option>
                                                                            </select>
                                                                        </Col>
                                                                    </Row>
                                                                </div>
                                                            </Col>

                                                            <Col lg={12}>
                                                                <SettingsField icon="ri-file-list-3-line" label="Job Description" htmlFor="jobDescription">
                                                                    <Input type="textarea"
                                                                        className="form-control" id="jobDescription"
                                                                        rows="3"
                                                                        placeholder="Enter description"
                                                                        defaultValue="Providing classical homeopathic consultations and patient care at NIGA Homeopathy."
                                                                    />
                                                                </SettingsField>
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                </div>
                                                <div id="newForm" style={{ "display": "none" }}>
                                                </div>

                                                <Col lg={12}>
                                                    <div className="user-profile-page__form-footer">
                                                        <ModalActionButton action="cancel" type="button" onClick={handleCancel}>
                                                            Cancel
                                                        </ModalActionButton>
                                                        <ModalActionButton action="update" type="submit">
                                                            Update
                                                        </ModalActionButton>
                                                    </div>
                                                </Col>
                                            </form>
                                        </TabPane>

                                        <TabPane tabId="4">
                                            <div className="mb-4 pb-2">
                                                <SettingsSectionTitle icon="ri-shield-check-line">Security</SettingsSectionTitle>
                                                <div className="d-flex flex-column flex-sm-row mb-4 mb-sm-0">
                                                    <div className="flex-grow-1">
                                                        <h6 className="fs-14 mb-1">Two-factor Authentication</h6>
                                                        <p className="text-muted">Two-factor authentication is an enhanced
                                                            security meansur. Once enabled, you'll be required to give
                                                            two types of identification when you log into Google
                                                            Authentication and SMS are Supported.</p>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-sm-3 user-settings-page__security-action">
                                                        <ModalActionButton action="update" type="button">
                                                            Enable Two-factor Authentication
                                                        </ModalActionButton>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column flex-sm-row mb-4 mb-sm-0 mt-2">
                                                    <div className="flex-grow-1">
                                                        <h6 className="fs-14 mb-1">Secondary Verification</h6>
                                                        <p className="text-muted">The first factor is a password and the
                                                            second commonly includes a text with a code sent to your
                                                            smartphone, or biometrics using your fingerprint, face, or
                                                            retina.</p>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-sm-3 user-settings-page__security-action">
                                                        <ModalActionButton action="update" type="button">
                                                            Set up secondary method
                                                        </ModalActionButton>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column flex-sm-row mb-4 mb-sm-0 mt-2">
                                                    <div className="flex-grow-1">
                                                        <h6 className="fs-14 mb-1">Backup Codes</h6>
                                                        <p className="text-muted mb-sm-0">A backup code is automatically
                                                            generated for you when you turn on two-factor authentication
                                                            through your iOS or Android Twitter app. You can also
                                                            generate a backup code on twitter.com.</p>
                                                    </div>
                                                    <div className="flex-shrink-0 ms-sm-3 user-settings-page__security-action">
                                                        <ModalActionButton action="update" type="button">
                                                            Generate backup codes
                                                        </ModalActionButton>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <SettingsSectionTitle icon="ri-notification-3-line">Application Notifications</SettingsSectionTitle>
                                                <ul className="list-unstyled mb-0">
                                                    <li className="d-flex">
                                                        <div className="flex-grow-1">
                                                            <label htmlFor="directMessage"
                                                                className="form-check-label fs-14">Direct messages</label>
                                                            <p className="text-muted">Messages from people you follow</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="form-check form-switch">
                                                                <Input className="form-check-input" type="checkbox"
                                                                    role="switch" id="directMessage" defaultChecked />
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li className="d-flex mt-2">
                                                        <div className="flex-grow-1">
                                                            <Label className="form-check-label fs-14"
                                                                htmlFor="desktopNotification">
                                                                Show desktop notifications
                                                            </Label>
                                                            <p className="text-muted">Choose the option you want as your
                                                                default setting. Block a site: Next to "Not allowed to
                                                                send notifications," click Add.</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="form-check form-switch">
                                                                <Input className="form-check-input" type="checkbox"
                                                                    role="switch" id="desktopNotification" defaultChecked />
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li className="d-flex mt-2">
                                                        <div className="flex-grow-1">
                                                            <Label className="form-check-label fs-14"
                                                                htmlFor="emailNotification">
                                                                Show email notifications
                                                            </Label>
                                                            <p className="text-muted"> Under Settings, choose Notifications.
                                                                Under Select an account, choose the account to enable
                                                                notifications for. </p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="form-check form-switch">
                                                                <Input className="form-check-input" type="checkbox"
                                                                    role="switch" id="emailNotification" />
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li className="d-flex mt-2">
                                                        <div className="flex-grow-1">
                                                            <Label className="form-check-label fs-14"
                                                                htmlFor="chatNotification">
                                                                Show chat notifications
                                                            </Label>
                                                            <p className="text-muted">To prevent duplicate mobile
                                                                notifications from the Gmail and Chat apps, in settings,
                                                                turn off Chat notifications.</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="form-check form-switch">
                                                                <Input className="form-check-input" type="checkbox"
                                                                    role="switch" id="chatNotification" />
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li className="d-flex mt-2">
                                                        <div className="flex-grow-1">
                                                            <Label className="form-check-label fs-14"
                                                                htmlFor="purchaesNotification">
                                                                Show purchase notifications
                                                            </Label>
                                                            <p className="text-muted">Get real-time purchase alerts to
                                                                protect yourself from fraudulent charges.</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="form-check form-switch">
                                                                <Input className="form-check-input" type="checkbox"
                                                                    role="switch" id="purchaesNotification" />
                                                            </div>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div>
                                                <SettingsSectionTitle icon="ri-delete-bin-line">Delete This Account</SettingsSectionTitle>
                                                <p className="text-muted">Go to the Data & Privacy section of your profile
                                                    Account. Scroll to "Your data & privacy options." Delete your
                                                    Profile Account. Follow the instructions to delete your account.
                                                </p>
                                                <SettingsField icon="ri-lock-line" label="Password" htmlFor="passwordInput">
                                                    <Input type="password" className="form-control" id="passwordInput"
                                                        placeholder="Enter your password"
                                                        style={{ maxWidth: "265px" }} />
                                                </SettingsField>
                                                <div className="user-profile-page__form-footer">
                                                    <ModalActionButton action="cancel" type="button" onClick={handleCancel}>
                                                        Cancel
                                                    </ModalActionButton>
                                                    <ModalActionButton action="delete" type="button">
                                                        Close & Delete This Account
                                                    </ModalActionButton>
                                                </div>
                                            </div>
                                        </TabPane>
                                    </TabContent>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Settings;