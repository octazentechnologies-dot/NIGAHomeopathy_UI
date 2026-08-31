import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Spinner } from 'reactstrap';
import { useLocation } from 'react-router-dom';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import ReactHtmlParser from 'html-react-parser';
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { getMateriaMedica, getAuthorsForMateriaMedicaDDL, getRemedyDDL, getRemedies, getMateriaMedicaRemediesDetails } from '../../../../slices/thunks';

const ViewMateriaMedicaRemedies = () => {

  const location = useLocation();
  const dispatch = useDispatch();

  const { quillRef } = useQuill();

  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const authors = useSelector((state) => state?.MateriaMedica?.materiaMedicaAuthors || []);
  const materiaMedicaRemediesDetails = useSelector((state) => state?.MateriaMedicaRemedy?.materiaMedicaRemediesDetails || []);

  const AuthorOptions = authors?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];
  useEffect(() => {
    dispatch(getAuthorsForMateriaMedicaDDL());
  }, []);

  function handleSelectAuthor(selectedAuthor) {
    setSelectedAuthor(selectedAuthor);
    dispatch(getMateriaMedicaRemediesDetails({ remedyId: location.state.selectedRemedy.remedyId, authorId: selectedAuthor.value }));
  }


  document.title = "View Materia Medica Remedies";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}
          <Row>
            <Col lg={12}>
              <Card>

                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">View Materia Medica Remedies </h4>
                </CardHeader>

                <CardBody className="card-body">
                  <div className="live-preview">
                    <Row className="gy-4">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Materia Medica Remedy Name</Label>
                          <Input type="input" value={location.state.selectedRemedy.remedyName} className="form-control" id="placeholderInput" disabled placeholder="Materia Medica Remedy Name" />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Author</Label>
                          <Select value={selectedAuthor}
                            onChange={(author) => { handleSelectAuthor(author); }}
                            options={AuthorOptions} />
                        </div>
                      </Col>
                    </Row>

                    <Row className='mt-4'>
                      <Col xxl={12} md={12}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Materia Medica Remedies Details</Label>
                          <div>
                            {materiaMedicaRemediesDetails.length === 0 ? <div className="text-center">No Details Found</div> :
                              <div>
                                {
                                  materiaMedicaRemediesDetails?.map((remedy) => {
                                    return (
                                      <Row>
                                        <Col>{ReactHtmlParser(remedy.materiaMedicaDetail1)}</Col>
                                      </Row>
                                    );
                                  })
                                }
                              </div>
                            }
                          </div>

                          {/* <div class="mt-2">
                            <h6 class="fs-15">Some Information</h6>
                            <p class="text-muted">Input groups wrap by default via <code>flex-wrap: wrap</code> in order to accommodate custom form field validation within an input group. You may disable this with <code>flex-nowrap</code> class.</p>
                            <h6 class="fs-15">Some Information</h6>
                            <p class="text-muted">Input groups wrap by default via <code>flex-wrap: wrap</code> in order to accommodate custom form field validation within an input group. You may disable this with <code>flex-nowrap</code> class.</p>
                            <h6 class="fs-15">Some Information</h6>
                            <p class="text-muted">Input groups wrap by default via <code>flex-wrap: wrap</code> in order to accommodate custom form field validation within an input group. You may disable this with <code>flex-nowrap</code> class.</p>
                          </div> */}
                        </div>
                      </Col>
                    </Row>

                  </div>
                </CardBody>

                {/* <CardFooter className=" gap-2">
                  <Row className="g-4">
                    <Col className="col-sm">
                      <div className="d-flex justify-content-sm-start">
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <Link to="/admin/listmateriamedicaremedies"><Button color="danger" className="btn-label"> <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel </Button></Link>
                        <Button color="success" className="btn-label"> <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save </Button>
                      </div>
                    </Col>
                  </Row>
                </CardFooter> */}

              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ViewMateriaMedicaRemedies;