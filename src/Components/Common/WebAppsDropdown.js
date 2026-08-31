import React, { useState } from 'react';
import { Col, Dropdown, DropdownMenu, DropdownToggle, Row } from 'reactstrap';

//import images
import github from "../../assets/images/brands/github.png";
import bitbucket from "../../assets/images/brands/bitbucket.png";
import dribbble from "../../assets/images/brands/dribbble.png";
import dropbox from "../../assets/images/brands/dropbox.png";
import mail_chimp from "../../assets/images/brands/mail_chimp.png";
import slack from "../../assets/images/brands/slack.png";
import { Link } from 'react-router-dom';

const WebAppsDropdown = () => {
    const [isWebAppDropdown, setIsWebAppDropdown] = useState(false);
    const toggleWebAppDropdown = () => {
        setIsWebAppDropdown(!isWebAppDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isWebAppDropdown} toggle={toggleWebAppDropdown} className="topbar-head-dropdown ms-1 header-item">
                <DropdownToggle tag="button" type="button" className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle">
                    <i className='bx bx-category-alt fs-22'></i>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-lg p-0 dropdown-menu-end">
                    <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                        <Row className="align-items-center">
                            <Col>
                                <h6 className="m-0 fw-semibold fs-15"> Quick Links </h6>
                            </Col>
                        </Row>
                    </div>

                    <div className="p-2">
                        <div className="row g-0">
                            <Col>
                                <Link className="dropdown-icon-item" to="#">
                                    <img src={github} alt="Github" />
                                    <span>Website</span>
                                </Link>
                            </Col>
                            <Col>
                                <Link className="dropdown-icon-item" to="#">
                                    <img src={bitbucket} alt="bitbucket" />
                                    <span>Gmail</span>
                                </Link>
                            </Col>
                            <Col>
                                <Link className="dropdown-icon-item" to="#">
                                    <img src={dribbble} alt="dribbble" />
                                    <span>WhatsApp</span>
                                </Link>
                            </Col>
                        </div>

                    </div>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default WebAppsDropdown;