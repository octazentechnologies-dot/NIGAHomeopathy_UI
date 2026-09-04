import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { bestSellingProducts } from "../../common/data";
import AdminPeriodFilter from './AdminPeriodFilter';

const BestSellingProducts = () => {
    const [activePeriod, setActivePeriod] = useState('all');

    return (
        <React.Fragment>
            <Col xl={6}>
                <Card className="admin-dash-card">
                    <CardHeader className="align-items-center d-flex admin-dash-card-header">
                        <h4 className="card-title mb-0 flex-grow-1">Recent Appointments</h4>
                        <AdminPeriodFilter activePeriod={activePeriod} onChange={setActivePeriod} />
                    </CardHeader>

                    <CardBody>
                        <div className="table-responsive table-card">
                            <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                                <tbody>
                                    {(bestSellingProducts || []).map((item, key) => (
                                        <tr key={key}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-sm bg-light rounded p-1 me-2">
                                                        <img src={item.img} alt="" className="img-fluid d-block rounded-circle" />
                                                    </div>
                                                    <div>
                                                        <h5 className="fs-14 my-1"><Link to="/apps-ecommerce-product-details" className="text-reset">{item.label}</Link></h5>
                                                        <span className="text-muted">{item.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">{item.time}</h5>
                                                <span className="text-muted">Appointment</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">{item.doctor}</h5>
                                                <span className="text-muted">Doctor</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">{item.type}</h5>
                                                <span className="text-muted">Type</span>
                                            </td>
                                            <td>
                                                <h5 className="fs-14 my-1 fw-normal">
                                                    <span className={"badge bg-" + item.statusClass + "-subtle text-" + item.statusClass}>{item.status}</span>
                                                </h5>
                                                <span className="text-muted">Status</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="align-items-center mt-4 pt-2 justify-content-between row text-center text-sm-start">
                            <div className="col-sm">
                                <div className="text-muted">Showing <span className="fw-semibold">5</span> of <span className="fw-semibold">28</span> Appointments
                                </div>
                            </div>
                            <div className="col-sm-auto mt-3 mt-sm-0">
                                <ul className="pagination pagination-separated pagination-sm mb-0 justify-content-center">
                                    <li className="page-item disabled">
                                        <Link to="#" className="page-link">←</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">1</Link>
                                    </li>
                                    <li className="page-item active">
                                        <Link to="#" className="page-link">2</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">3</Link>
                                    </li>
                                    <li className="page-item">
                                        <Link to="#" className="page-link">→</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default BestSellingProducts;