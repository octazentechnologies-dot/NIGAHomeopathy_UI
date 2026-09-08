import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Col, Container, Input, InputGroup, InputGroupText, Label, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { getMateriaMedica, getAuthorsForMateriaMedicaDDL, getRemedies, deleteMateriaMedica } from '../../../../slices/thunks';

const MateriaMedicaList = () => {
  const dispatch = useDispatch();
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  const materiaMedicaLoading = useSelector((state) => state?.MateriaMedica?.materiaMedicaLoading || false);
  const materiaMedica = useSelector((state) => state?.MateriaMedica?.materiaMedica?.resultObject || []);
  const authors = useSelector((state) => state?.MateriaMedica?.materiaMedicaAuthors || []);
  const remedys = useSelector((state) => state?.MateriaMedicaRemedy?.matriaMedicaRemedies || []);
  const totalPages = useSelector((state) => state?.MateriaMedica?.materiaMedica?.totalPageCount || 1);
  const totalRecords = useSelector(
    (state) => state?.MateriaMedica?.materiaMedica?.totalRecordCount || materiaMedica.length || 0
  );

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
      queryString: searchQuery,
    };

    if (selectedAuthor) {
      params.authorId = selectedAuthor.value;
    }

    if (selectedRemedy) {
      params.remedyId = selectedRemedy.value;
    }

    dispatch(getMateriaMedica(params));
  }, [currentPage, selectedAuthor, selectedRemedy, searchQuery, dispatch]);

  useEffect(() => {
    dispatch(getAuthorsForMateriaMedicaDDL());
    dispatch(getRemedies());
  }, [dispatch]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
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
        confirmButtonText: 'OK',
      });
      return;
    }

    if (page < 1 || page > totalPages) {
      Swal.fire({
        title: 'Invalid page number',
        text: `Page number must be between 1 and ${totalPages}.`,
        icon: 'warning',
        confirmButtonText: 'OK',
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

  const handleDelete = (materialMedica) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete material medica which is associated with author "${materialMedica.authorName}", remedy "${materialMedica.remedyName}" and head "${materialMedica.materiaMedicaHeadName}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteMateriaMedica({
          materiaMedicaId: materialMedica.materiaMedicaId,
          authorId: materialMedica.authorId,
          remedyId: materialMedica.remedyId,
          materiaMedicaHeadId: materialMedica.materiaMedicaHeadId,
          dose: 'string',
          enteredBy: 0,
          enteredDate: new Date(),
          changedBy: 0,
          changedDate: new Date(),
          seqNo: 0,
          isActive: true,
          isDeleted: true,
          modelEx: [
            {
              matriaMedicaDetailId: 0,
              materiaMedicaId: 0,
              details: 'string',
            },
          ],
        })).then(() => {
          setCurrentPage(1);
          Swal.fire('Deleted!', 'The materia medica has been deleted.', 'success');
        }).catch(() => {
          Swal.fire('Error!', 'Something went wrong.', 'error');
        });
      }
    });
  };

  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'List Materia Medica';
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <Row className="gy-3 align-items-end">
                    <Col xxl={4} md={4}>
                      <div className="mb-0">
                        <Label htmlFor="authorFilter" className="form-label">Author Name</Label>
                        <Select
                          id="authorFilter"
                          value={selectedAuthor}
                          onChange={(author) => {
                            setSelectedAuthor(author);
                            setCurrentPage(1);
                          }}
                          options={AuthorOptions}
                          isClearable
                          placeholder="Select..."
                        />
                      </div>
                    </Col>
                    <Col xxl={4} md={4}>
                      <div className="mb-0">
                        <Label htmlFor="remedyFilter" className="form-label">Remedy Name</Label>
                        <Select
                          id="remedyFilter"
                          value={selectedRemedy}
                          onChange={(remedy) => {
                            setSelectedRemedy(remedy);
                            setCurrentPage(1);
                          }}
                          options={RemedyOptions}
                          isClearable
                          placeholder="Select..."
                        />
                      </div>
                    </Col>
                    <Col xxl={4} md={4}>
                      <div className="admin-list-filter-reset">
                        <button
                          type="button"
                          className="btn btn-sm admin-list-btn admin-list-btn--reset"
                          onClick={() => {
                            setSelectedAuthor(null);
                            setSelectedRemedy(null);
                            setSearchQuery('');
                            setCurrentPage(1);
                          }}
                        >
                          <i className="ri-refresh-line align-middle me-1" aria-hidden="true" />
                          Reset
                        </button>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>

              <Card className="patient-list-modal admin-existance-list">
                <CardHeader className="border-0">
                  <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                    <div className="patient-list-modal__search flex-shrink-0">
                      <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export">
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/addmateriamedica" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--new">
                          <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                          New
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="table-responsive patient-list-modal__table-wrap">
                    <table className="table mb-0 align-middle patient-list-modal__table" id="customerTable">
                      <thead>
                        <tr>
                          <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                          <th scope="col">Author Name</th>
                          <th scope="col">Remedy Name</th>
                          <th scope="col">Head</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
                        </tr>
                      </thead>
                      {materiaMedicaLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <Spinner color="primary" size="sm" />
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {materiaMedica.length > 0 ? (
                            materiaMedica.map((item, index) => (
                              <tr key={item.materiaMedicaId || index}>
                                <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                                <td>{item.authorName || '—'}</td>
                                <td>{item.remedyName || '—'}</td>
                                <td>{item.materiaMedicaHeadName || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link to="/admin/editmateriamedica" state={{ selectedMateriaMedica: item }}>
                                        <button type="button" className="btn btn-sm btn-soft-success edit-item-btn" title="Edit">
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                    </div>
                                    <div className="remove">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => handleDelete(item)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center text-muted py-4">
                                {searchQuery || selectedAuthor || selectedRemedy
                                  ? 'No data matches your filters'
                                  : 'No data found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer flex-wrap gap-2">
                    <div className="text-muted patient-list-modal__footer-text">
                      {materiaMedicaLoading
                        ? 'Loading...'
                        : `Showing ${materiaMedica.length} of ${totalRecords} Results · Page ${currentPage} of ${totalPages}`}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <ul className="pagination pagination-separated pagination-md mb-0 admin-list-pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button type="button" className="page-link page-link--nav" onClick={handlePrevPage}>
                            Previous
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <li key={index} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                <button type="button" className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                                  {pageNumber}
                                </button>
                              </li>
                            );
                          }
                          if (pageNumber === 2 || pageNumber === totalPages - 1) {
                            return (
                              <li key={index} className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button type="button" className="page-link page-link--nav" onClick={handleNextPage}>
                            Next
                          </button>
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
                        <Button color="primary" outline onClick={handleGoToPage} disabled={totalPages <= 1}>
                          Go
                        </Button>
                      </InputGroup>
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
