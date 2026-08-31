import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, DropdownItem, DropdownMenu, DropdownToggle, FormGroup, Input, InputGroup, InputGroupText, Label, Row, UncontrolledDropdown, Button } from 'reactstrap';
import TableContainer from "../../../../Components/Common/TableContainerReactTable";
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import { useSelector, useDispatch } from "react-redux";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import Swal from 'sweetalert2';
import { getMateriaMedica, getAuthorsForMateriaMedicaDDL, getRemedyDDL, getRemedies, deleteMateriaMedica } from '../../../../slices/thunks';

const MateriaMedicaList = () => {

  const dispatch = useDispatch();
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [selectedSingle, setSelectedSingle] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState('');
  const pageSize = 10;
  // Redux state
  const materiaMedicaLoading = useSelector((state) => state?.MateriaMedica?.materiaMedicaLoading || false);
  const materiaMedica = useSelector((state) => state?.MateriaMedica?.materiaMedica?.resultObject || []);
  const authors = useSelector((state) => state?.MateriaMedica?.materiaMedicaAuthors || []);
  const remedys = useSelector((state) => state?.MateriaMedicaRemedy?.matriaMedicaRemedies || []);
  const totalPages = useSelector((state) => state?.MateriaMedica?.materiaMedica?.totalPageCount || 1);
  const { materiaMedicaSuccess, materiaMedicaError } = useSelector((state) => state?.MateriaMedica || {});

  const AuthorOptions = authors?.map((author) => ({
    label: author.authorName,
    value: author.authorId,
  })) || [];

  const RemedyOptions = remedys?.map((remedy) => ({
    label: remedy.remedyName,
    value: remedy.remedyId,
  })) || [];

  useEffect(() => {
    const params = {
      PageNumber: currentPage,
      PageSize: pageSize,
    };

    if (selectedAuthor) {
      params.authorId = selectedAuthor.value;
    }

    if (selectedRemedy) {
      params.remedyId = selectedRemedy.value;
    }

    dispatch(getMateriaMedica(params));
  }, [currentPage, selectedAuthor, selectedRemedy]);

  useEffect(() => {
    dispatch(getAuthorsForMateriaMedicaDDL());
    dispatch(getRemedies());
  }, []);

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

  const handleGoToPageInputChange = (e) => {
    const digitsOnly = (e.target.value || '').replace(/[^\d]/g, '');
    setGoToPageInput(digitsOnly);
  };

  const handleGoToPage = () => {
    const page = Number.parseInt(goToPageInput, 10);

    if (!Number.isFinite(page) || Number.isNaN(page)) {
      Swal.fire({
        title: 'Invalid page number',
        text: `Please enter a page number between 1 and ${totalPages}.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (page < 1 || page > totalPages) {
      Swal.fire({
        title: 'Invalid page number',
        text: `Page number must be between 1 and ${totalPages}.`,
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setCurrentPage(page);
    setGoToPageInput('');
  };

  const handleGoToPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoToPage();
    }
  };


  function handleSelectAuthor(selectedAuthor) {
    setSelectedAuthor(selectedAuthor);
  }

  function handleSelectRemedy(selectedRemedy) {
    setSelectedRemedy(selectedRemedy);
  }

  const handleDelete = (materialMedica) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete material medica which is associated with author " ${materialMedica.authorName}"
      \n and remedy " ${materialMedica.remedyName}"
      \n and head " ${materialMedica.materiaMedicaHeadName}"
      \n. This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMateriaMedica({
          "materiaMedicaId": materialMedica.materiaMedicaId,
          "authorId": materialMedica.authorId,
          "remedyId": materialMedica.remedyId,
          "materiaMedicaHeadId": materialMedica.materiaMedicaHeadId,
          "dose": "string",
          "enteredBy": 0,
          "enteredDate": new Date(),
          "changedBy": 0,
          "changedDate": new Date(),
          "seqNo": 0,
          "isActive": true,
          "isDeleted": true,
          "modelEx": [
            {
              "matriaMedicaDetailId": 0,
              "materiaMedicaId": 0,
              "details": "string"
            }
          ]
        })).then(() => {
          setCurrentPage(1);
          Swal.fire("Deleted!", "The head has been deleted.", "success");
        }).catch(() => {
          Swal.fire("Error!", "Something went wrong.", "error");
        });
      }
    });
  };



  document.title = "List Materia Medica";
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
                          <Label htmlFor="placeholderInput" className="form-label">Author Name</Label>
                          <Select value={selectedAuthor}
                            onChange={(author) => { handleSelectAuthor(author); }}
                            options={AuthorOptions} />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="placeholderInput" className="form-label">Remedy Name</Label>
                          <Select value={selectedRemedy}
                            onChange={(remedy) => { handleSelectRemedy(remedy); }}
                            options={RemedyOptions} />
                        </div>
                      </Col>
                      <Col xxl={4} md={4}>
                        <div className="mt-4">
                          <Button className="btn-secondary btn-label m-btn-top" onClick={() => {
                            setSelectedAuthor(null);
                            setSelectedRemedy(null);
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
                          <input type="text" className="form-control form-control-sm search" placeholder="Search..." /><i className="ri-search-line search-icon"></i>
                        </div>
                      </div>
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <button type="button" className="btn btn-soft-primary btn-sm"><i className=" ri-newspaper-line align-middle"></i> Import</button>
                        <button type="button" className="btn btn-soft-secondary btn-sm"><i className="ri-file-list-3-line align-middle"></i> Export</button>
                        <Link to="/admin/addmateriamedica"><button type="button" className="btn btn-soft-info btn-sm"><i className="ri-add-line align-middle"></i> New</button></Link>
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
                            <th>Author Name</th>
                            <th>Remedy Name</th>
                            <th>Head</th>
                            <th className='text-center' style={{ width: '10%' }}>Action</th>
                          </tr>
                        </thead>
                        {
                          materiaMedicaLoading ? (
                            <tbody className="list form-check-all">
                              <tr>
                                <td colSpan="5" className="text-center">
                                  <Spinner color="primary" className="ms-1" />
                                </td>
                              </tr>
                            </tbody>
                          ) : (
                            <tbody className="list form-check-all">
                              {materiaMedica.length > 0 ? (
                                materiaMedica.map((item, index) => (
                                  <tr key={index}>
                                    <td>{item.materiaMedicaId}</td>
                                    <td>{item.authorName}</td>
                                    <td>{item.remedyName}</td>
                                    <td>{item.materiaMedicaHeadName}</td>
                                    <td className='text-center '>
                                      <div className="d-inline-flex gap-2">
                                        <div className="edit">
                                          <Link to="/admin/editmateriamedica" state={{ selectedMateriaMedica: item }}><button className="btn btn-sm btn-soft-success edit-item-btn"><i className="ri-pencil-fill" /></button></Link>
                                        </div>
                                        <div className="remove">
                                          <button className="btn btn-sm btn-soft-danger remove-item-btn" onClick={() => handleDelete(item)}><i className="ri-delete-bin-5-line" /> </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="text-center">
                                    No data found
                                  </td>
                                </tr>
                              )
                              }
                            </tbody>)
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
                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center justify-content-sm-start">
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

                          <InputGroup size="sm" style={{ width: '190px' }}>
                            <InputGroupText>Go to</InputGroupText>
                            <Input
                              value={goToPageInput}
                              onChange={handleGoToPageInputChange}
                              onKeyDown={handleGoToPageKeyDown}
                              placeholder="Page #"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              aria-label="Go to page number"
                              disabled={totalPages <= 1}
                            />
                            <Button
                              color="primary"
                              outline
                              onClick={handleGoToPage}
                              disabled={totalPages <= 1}
                            >
                              Go
                            </Button>
                          </InputGroup>
                        </div>
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

export default MateriaMedicaList;