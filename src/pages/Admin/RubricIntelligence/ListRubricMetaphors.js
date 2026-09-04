import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge, Card, CardBody, CardHeader, Col, Container, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from 'reactstrap';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import Swal from 'sweetalert2';
import {
  getRubricMetaphors,
  createRubricMetaphor,
  updateRubricMetaphor,
  deleteRubricMetaphor,
  approveRubricMetaphor,
  rejectRubricMetaphor,
} from '../../../helpers/realbackend_helper';

const emptyForm = {
  patientExpression: '',
  clinicalMeaning: '',
  rubricMeaning: '',
  language: 'en',
  confidenceWeight: 0.85,
  subSectionId: '',
};

const ListRubricMetaphors = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const pageSize = 10;

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await getRubricMetaphors({
        search: search || undefined,
        language: languageFilter || undefined,
        pageNumber: page,
        pageSize,
      });
      const payload = response?.data?.resultObject ?? response?.data ?? {};
      setItems(payload.items ?? []);
      setTotalCount(payload.totalCount ?? 0);
      setCurrentPage(page);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Load failed', text: error?.message || 'Could not load metaphors.' });
    } finally {
      setLoading(false);
    }
  }, [search, languageFilter]);

  useEffect(() => {
    load(1);
  }, [languageFilter]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      load(1);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.metaphorId);
    setForm({
      patientExpression: row.patientExpression || '',
      clinicalMeaning: row.clinicalMeaning || '',
      rubricMeaning: row.rubricMeaning || '',
      language: row.language || 'en',
      confidenceWeight: row.confidenceWeight ?? 0.85,
      subSectionId: row.subSectionId ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const body = {
      patientExpression: form.patientExpression,
      clinicalMeaning: form.clinicalMeaning,
      rubricMeaning: form.rubricMeaning,
      language: form.language,
      confidenceWeight: Number(form.confidenceWeight),
      subSectionId: form.subSectionId ? Number(form.subSectionId) : null,
    };
    try {
      if (editId) {
        await updateRubricMetaphor(editId, body);
      } else {
        await createRubricMetaphor(body);
      }
      setModalOpen(false);
      await load(currentPage);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: error?.message || 'Could not save metaphor.' });
    }
  };

  const handleDelete = async (row) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: `You are about to delete metaphor "${row.patientExpression}". This action cannot be undone!`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!confirm.isConfirmed) return;
    await deleteRubricMetaphor(row.metaphorId);
    await load(currentPage);
  };

  const handleApprove = async (id) => {
    await approveRubricMetaphor(id);
    await load(currentPage);
  };

  const handleReject = async (id) => {
    await rejectRubricMetaphor(id);
    await load(currentPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) load(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) load(currentPage + 1);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rowStart = (currentPage - 1) * pageSize;

  document.title = 'Rubric Metaphors';

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
              <CardBody>
                <Row className="gy-3 align-items-end">
                  <Col xxl={4} md={4}>
                    <div className="mb-0">
                      <Label htmlFor="languageFilter" className="form-label">Language</Label>
                      <Input
                        id="languageFilter"
                        type="select"
                        className="form-select admin-list-filter-select"
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                      >
                        <option value="">All languages</option>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="mr">Marathi</option>
                      </Input>
                    </div>
                  </Col>
                  <Col xxl={4} md={4}>
                    <div className="admin-list-filter-reset">
                      <button
                        type="button"
                        className="btn btn-sm admin-list-btn admin-list-btn--reset"
                        onClick={() => {
                          setLanguageFilter('');
                          setSearch('');
                          load(1);
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
                      placeholder="Search metaphors..."
                      value={search}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                    />
                  </div>
                  <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                    <button
                      type="button"
                      className="btn btn-sm admin-list-btn admin-list-btn--export"
                      onClick={() => load(1)}
                    >
                      <i className="ri-search-line align-middle me-1" aria-hidden="true" />
                      Search
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm admin-list-btn admin-list-btn--new"
                      onClick={openCreate}
                    >
                      <i className="ri-add-line align-middle me-1" aria-hidden="true" />
                      New
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="table-responsive patient-list-modal__table-wrap">
                  <table className="table mb-0 align-middle patient-list-modal__table">
                    <thead>
                      <tr>
                        <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                        <th scope="col">Patient Expression</th>
                        <th scope="col">Clinical Meaning</th>
                        <th scope="col">Language</th>
                        <th scope="col">Status</th>
                        <th scope="col">Usage</th>
                        <th scope="col" className="text-center" style={{ width: '18%' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            <Spinner color="primary" size="sm" />
                          </td>
                        </tr>
                      ) : items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            {search || languageFilter ? 'No metaphors match your filters' : 'No metaphors found'}
                          </td>
                        </tr>
                      ) : (
                        items.map((row, index) => (
                          <tr key={row.metaphorId || index}>
                            <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                            <td>
                              <div>{row.patientExpression || '—'}</div>
                              {row.rubricMeaning ? (
                                <small className="text-muted">{row.rubricMeaning}</small>
                              ) : null}
                            </td>
                            <td>{row.clinicalMeaning || '—'}</td>
                            <td>{row.language || '—'}</td>
                            <td>
                              <Badge
                                color={
                                  row.approvalStatus === 'Approved'
                                    ? 'success'
                                    : row.approvalStatus === 'Rejected'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {row.approvalStatus || '—'}
                              </Badge>
                            </td>
                            <td>{row.usageCount ?? 0}</td>
                            <td className="text-center">
                              <div className="d-inline-flex gap-1 flex-wrap justify-content-center">
                                {row.approvalStatus === 'Pending' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-soft-success"
                                      title="Approve"
                                      onClick={() => handleApprove(row.metaphorId)}
                                    >
                                      <i className="ri-check-line" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-soft-danger"
                                      title="Reject"
                                      onClick={() => handleReject(row.metaphorId)}
                                    >
                                      <i className="ri-close-line" />
                                    </button>
                                  </>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-success edit-item-btn"
                                  title="Edit"
                                  onClick={() => openEdit(row)}
                                >
                                  <i className="ri-pencil-fill" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-soft-danger remove-item-btn"
                                  title="Delete"
                                  onClick={() => handleDelete(row)}
                                >
                                  <i className="ri-delete-bin-5-line" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                  <div className="text-muted patient-list-modal__footer-text">
                    {loading
                      ? 'Loading...'
                      : `Showing ${items.length} of ${totalCount} Results · Page ${currentPage} of ${totalPages}`}
                  </div>
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
                            <button type="button" className="page-link" onClick={() => load(pageNumber)}>
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
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>{editId ? 'Edit metaphor' : 'Add metaphor'}</ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={12}>
              <Label>Patient expression</Label>
              <Input value={form.patientExpression} onChange={(e) => setForm({ ...form, patientExpression: e.target.value })} />
            </Col>
            <Col md={12}>
              <Label>Clinical meaning</Label>
              <Input type="textarea" rows={2} value={form.clinicalMeaning} onChange={(e) => setForm({ ...form, clinicalMeaning: e.target.value })} />
            </Col>
            <Col md={12}>
              <Label>Rubric meaning (repertory style)</Label>
              <Input value={form.rubricMeaning} onChange={(e) => setForm({ ...form, rubricMeaning: e.target.value })} />
            </Col>
            <Col md={4}>
              <Label>Language</Label>
              <Input type="select" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </Input>
            </Col>
            <Col md={4}>
              <Label>Confidence (0–1)</Label>
              <Input type="number" step="0.01" min="0" max="1" value={form.confidenceWeight} onChange={(e) => setForm({ ...form, confidenceWeight: e.target.value })} />
            </Col>
            <Col md={4}>
              <Label>SubSectionId (optional)</Label>
              <Input value={form.subSectionId} onChange={(e) => setForm({ ...form, subSectionId: e.target.value })} />
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={() => setModalOpen(false)} />
          <ModalActionButton action="save" onClick={handleSave} />
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ListRubricMetaphors;
