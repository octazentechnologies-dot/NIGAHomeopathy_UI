import React from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
// import Vector from './VectorMap';
import { VectorMap } from '@south-paw/react-vector-maps'
import world from '../../common/world.svg.json';

const SalesByLocations = () => {
    return (
        <React.Fragment>
            <Col xl={4}>
                <Card className="card-height-100 admin-dash-card">
                    <CardHeader className="align-items-center d-flex admin-dash-card-header">
                        <h4 className="card-title mb-0 flex-grow-1">Patients by Location</h4>
                        <div className="flex-shrink-0">
                            <button type="button" className="btn btn-sm doctor-dashboard-toolbar-btn">
                                Export Report
                            </button>
                        </div>
                    </CardHeader>

                    <CardBody>

                        <div
                            data-colors='["--vz-light", "--vz-success", "--vz-primary"]'
                            style={{ height: "269px" }} dir="ltr">
                           <div id="world_map_line_markers" className="custom-vector-map">
                                        <VectorMap {...world} />
                                    </div>
                        </div>

                        <div className="px-2 py-2 mt-1">
                            <p className="mb-1">Maharashtra <span className="float-end">68%</span></p>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                                <div className="progress-bar progress-bar-striped bg-info" role="progressbar"
                                    style={{ width: "68%" }} aria-valuenow="68" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>

                            <p className="mt-3 mb-1">Karnataka <span className="float-end">17%</span></p>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                                <div className="progress-bar progress-bar-striped bg-info" role="progressbar"
                                    style={{ width: "17%" }} aria-valuenow="17" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>

                            <p className="mt-3 mb-1">Goa <span className="float-end">9%</span></p>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                                <div className="progress-bar progress-bar-striped bg-info" role="progressbar"
                                    style={{ width: "9%" }} aria-valuenow="9" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>

                            <p className="mt-3 mb-1">Other States <span className="float-end">6%</span></p>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                                <div className="progress-bar progress-bar-striped bg-info" role="progressbar"
                                    style={{ width: "6%" }} aria-valuenow="6" aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default SalesByLocations;