import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Swal from 'sweetalert2';
import Select from "react-select";
import makeAnimated from "react-select/animated";

import { useSelector, useDispatch } from "react-redux";
import { getQuestionGroups, getQuestionsSubGroups, getClinicalQuestionBodyPart, deleteClinicalQuestionBodyPart } from "../../../../slices/thunks";


const ClinicalQuestionList = () => {
  const dispatch = useDispatch();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState(null);
  const [selectedSubQuestionGroup, setSelectedSubQuestionGroup] = useState(null);
  const pageSize = 10;

  const buildListParams = (pageNumber = currentPage) => ({
    questionGroupId: selectedQuestionGroup?.value ?? 0,
    questionSubgroupId: selectedSubQuestionGroup?.value ?? 0,
    PageNumber: pageNumber,
    PageSize: pageSize,
    queryString: searchQuery,
  });
  // Redux state
  const clinicalQuestionsLoading = useSelector((state) => state?.ClinicalQuestions?.clinicalQuestionsLoading || false);
  const clinicalQuestions = useSelector((state) => state?.ClinicalQuestions?.questions || []);
  const totalPages = useSelector((state) => state?.ClinicalQuestions?.questions?.totalPageCount || 1);
  const questionGroups = useSelector((state) => state?.ClinicalQuestions?.questionGroups || []);
  const questionSubGroups = useSelector((state) => state?.ClinicalQuestions?.questionSubGroups || []);

  const questionGroupOptions = useMemo(() => {
    return questionGroups.map((group) => ({ value: group.questionGroupId, label: group.questionGroupName }));
  }, [questionGroups]);

  const questionSubGroupOptions = useMemo(() => {
    return questionSubGroups.map((subGroup) => ({ value: subGroup.questionSubgroupId, label: subGroup.questionSubgroup1 }));
  }, [questionSubGroups]);

  useEffect(() => {
    dispatch(getQuestionGroups());
    dispatch(getQuestionsSubGroups());

  }, []);

  useEffect(() => {
    dispatch(getClinicalQuestionBodyPart(buildListParams()));
  }, [currentPage, searchQuery, selectedQuestionGroup, selectedSubQuestionGroup, dispatch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  function handleSelectQuestionGroup(selectedQuestionGroup) {
    setSelectedQuestionGroup(selectedQuestionGroup);
    setSelectedSubQuestionGroup(null);
    setCurrentPage(1);
  }

  function handleSelectSubQuestionGroup(selectedSubQuestionGroup) {
    setSelectedSubQuestionGroup(selectedSubQuestionGroup);
    setCurrentPage(1);
  }

  // Pagination Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleDelete = (clinicalQuestion) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete clinical question which is associated with existance name " ${clinicalQuestion.questionSectionName}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteClinicalQuestionBodyPart({
          questionId: clinicalQuestion.questionsId,
          listParams: buildListParams(1),
        })).then(() => {
          setCurrentPage(1);
          Swal.fire("Deleted!", "The head has been deleted.", "success");
        }).catch(() => {
          Swal.fire("Error!", "Something went wrong.", "error");
        });
      }
    });
  };

  document.title = "List Clinical Question";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* <BreadCrumb title="Starter" pageTitle="Pages" /> */}

          <Row>
            <Col lg={12}>

              <Card>

                <CardBody className="card-body">
                  <div className="live-preview">
                    <Row className="gy-4">
                      <Col xxl={4} md={4}>
                        <div className="mb-3">
                          <Label htmlFor="placeholderInput" className="form-label">Question Group Name</Label>
                          <Select
                            value={selectedQuestionGroup}
                            onChange={(item) => { handleSelectQuestionGroup(item); }}
                            options={questionGroupOptions} />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Sub Question Group Name</Label>
                          <Select
                            value={selectedSubQuestionGroup}
                            onChange={(item) => { handleSelectSubQuestionGroup(item); }}
                            options={questionSubGroupOptions} />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div className="mt-4">
                          <Button className="btn-secondary btn-label m-btn-top" onClick={() => {
                            setSelectedQuestionGroup(null);
                            setSelectedSubQuestionGroup(null);
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}> <i className="ri-refresh-line label-icon align-middle fs-16 me-2"></i> Reset </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </CardBody>



              </Card>

              <Card>
                <CardHeader>

                  <Row className="g-4">
                    <Col className="col-sm">
                      <div className="d-flex justify-content-sm-start">
                        <div className="search-box">
                          <input
                            value={searchQuery}
                            type="text"
                            className="form-control form-control-sm search"
                            placeholder="Search..."
                            onChange={handleSearchChange}
                          /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addclinicalquestion"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
                      </div>
                    </Col>
                  </Row>

                </CardHeader>
                <CardBody>

                  <div className="listjs-table" id="customerList">

                    <div className="table-responsive table-card">
                      <table className="table align-middle table-nowrap" id="customerTable">
                        <thead className="">
                          <tr>
                            <th scope="col" style={{ width: "50px" }}>ID</th>
                            <th>Existance Name</th>
                            <th>Question Group Name</th>
                            <th>Sub Question Group Name</th>
                            {/*  <th>Description</th> */}
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {
                          clinicalQuestionsLoading ? (
                            <tbody className="list form-check-all">
                              <tr>
                                <td colSpan="5" className="text-center">
                                  <Spinner color="primary" className="ms-1" />
                                </td>
                              </tr>
                            </tbody>
                          ) : (
                            <tbody className="list form-check-all">
                              {clinicalQuestions?.resultObject?.length > 0 ? (clinicalQuestions?.resultObject?.map((question, index) => (
                                <tr key={index}>
                                  <td>{question.questionsId}</td>
                                  <td>{question.questionSectionName}</td>
                                  <td>{question.questionGroupName}</td>
                                  <td>{question.questionSubgroupName}</td>
                                  {/* <td>Data</td> */}
                                  <td className='text-center '>
                                    <div className="d-inline-flex gap-2">
                                      <div className="edit">
                                        <Link to="/admin/editclinicalquestion" state={{ selectedClinicalQuestion: question }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                      </div>
                                      <div className="remove">
                                        <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(question)}><i className="ri-delete-bin-5-line" /> </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))) : (
                                <tr>
                                  <td colSpan="6" className="text-center">
                                    No Clinical Questions Found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          )
                        }
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="align-items-center g-3 text-center text-sm-start row mt-3">
                      <div className="col-sm">
                        <div className="text-muted">
                          Showing <span className="fw-semibold ms-1">{currentPage}</span> of <span className="fw-semibold">{totalPages}</span> Pages
                        </div>
                      </div>
                      <div className="col-sm-auto">
                        <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                          {/* Previous Button */}
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handlePrevPage}>Previous</button>
                          </li>

                          {/* First Page */}
                          {currentPage > 3 && (
                            <>
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                              </li>
                              {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            </>
                          )}

                          {/* Dynamic Page Numbers */}
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            if (
                              page === currentPage || // Current Page
                              page === currentPage - 1 || // One Before Current
                              page === currentPage + 1 // One After Current
                            ) {
                              return (
                                <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {/* Last Page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                              <li className="page-item">
                                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                              </li>
                            </>
                          )}

                          {/* Next Button */}
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={handleNextPage}>Next</button>
                          </li>
                        </ul>
                      </div>
                    </div>

                  </div>

                </CardBody>
              </Card>
            </Col>
          </Row>

        </Container>
      </div>
    </React.Fragment>
  );
};

export default ClinicalQuestionList;