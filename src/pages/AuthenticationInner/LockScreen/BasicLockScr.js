import React from 'react';
import { Button, Card, CardBody, Col, Container, Row } from 'reactstrap';
import ParticlesAuth from "../ParticlesAuth";

import avatar1 from "../../../assets/images/users/avatar-1.jpg";

const BasicLockScreen = () => {
    document.title = "Your Screen Is Locked ! | Niga Homeocentrum";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">Your Screen Is Locked !</h5>
                                            <p className="text-muted">Enter your password to unlock the screen!</p>
                                        </div>
                                        <div className="user-thumb text-center">
                                            <img src={avatar1} className="rounded-circle img-thumbnail avatar-lg" alt="thumbnail" />
                                            <h5 className="font-size-15 mt-3">Dr. Nikhil Jamdar</h5>
                                        </div>
                                        <div className="p-2 mt-4">
                                            <form>
                                                <div className="mb-3">
                                                    <label className="form-label" htmlFor="userpassword">Password</label>
                                                    <input type="password" className="form-control" id="userpassword" placeholder="Enter password" required />
                                                </div>
                                                <div className="mb-2 mt-4">
                                                    <Button color="secondary" className="w-100" type="submit">Unlock</Button>
                                                </div>
                                            </form>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default BasicLockScreen;
