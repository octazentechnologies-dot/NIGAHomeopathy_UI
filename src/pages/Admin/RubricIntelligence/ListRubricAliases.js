import React, { useCallback, useEffect, useState } from 'react';
import {
  Card, CardBody, CardHeader, Col, Container, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from 'reactstrap';
import ModalActionButton from '../../../Components/Common/ModalActionButton';
import Swal from 'sweetalert2';
import {
  getRubricAliases,
  createRubricAlias,
  updateRubricAlias,
  deleteRubricAlias,
} from '../../../helpers/realbackend_helper';

const emptyForm = {
  subSectionId: '',
  aliasText: '',
  language: 'en',
  aliasType: 'patient_phrase',
  weight: 1,
};

const ListRubricAliases = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const pageSize = 10;

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await getRubricAliases({
        search: search || undefined,
        pageNumber: page,
        pageSize,
      });
      const payload = response?.data?.resultObject ?? response?.data ?? {};
      setItems(payload.items ?? []);
      setTotalCount(payload.totalCount ?? 0);
      setCurrentPage(page);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Load failed', text: error?.message || 'Could not load aliases.' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load(1);
  }, []);

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
    setEditId(row.rubricAliasId);
    setForm({
      subSectionId: row.subSectionId,
      aliasText: row.aliasText,
      language: row.language || 'en',
      aliasType: row.aliasType || 'patient_phrase',
      weight: row.weight ?? 1,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const body = {
      subSectionId: Number(form.subSectionId),
      aliasText: form.aliasText,
      language: form.language,
      aliasType: form.aliasType,
      weight: Number(form.weight),
    };
    try {
      if (editId) {
        await updateRubricAlias(editId, body);
      } else {
        await createRubricAlias(body);
      }
      setModalOpen(false);
      await load(currentPage);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: error?.message || 'Could not save alias.' });
    }
  };

  const handleDelete = async (row) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: `You are about to delete alias "${row.aliasText}". This action cannot be undone!`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });
    if (!confirm.isConfirmed) return;
    await deleteRubricAlias(row.rubricAliasId);
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

  document.title = 'Rubric Aliases';

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card className="patient-list-modal admin-existance-list">
              <CardHeader className="border-0">
                <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                  <div className="patient-list-modal__search flex-shrink-0">
                    <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search alias or rubric name..."
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
                        <th scope="col">Alias</th>
                        <th scope="col">Rubric (SubSection)</th>
                        <th scope="col">Type</th>
                        <th scope="col">Weight</th>
                        <th scope="col">Usage</th>
                        <th scope="col" className="text-center" style={{ width: '12%' }}>Action</th>
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
                            {search ? 'No aliases match your search' : 'No aliases found'}
                          </td>
                        </tr>
                      ) : (
                        items.map((row, index) => (
                          <tr key={row.rubricAliasId || index}>
                            <td className="text-center patient-list-modal__index">{rowStart + index + 1}</td>
                            <td>{row.aliasText || '—'}</td>
                            <td>
                              <div>{row.subSectionName || '—'}</div>
                              <small className="text-muted">ID: {row.subSectionId ?? '—'}</small>
                            </td>
                            <td>{row.aliasType || '—'}</td>
                            <td>{row.weight ?? '—'}</td>
                            <td>{row.usageCount ?? 0}</td>
                            <td className="text-center">
                              <div className="d-inline-flex gap-2">
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

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>{editId ? 'Edit alias' : 'Add alias'}</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <Label>SubSectionId</Label>
            <Input value={form.subSectionId} onChange={(e) => setForm({ ...form, subSectionId: e.target.value })} />
          </div>
          <div className="mb-3">
            <Label>Alias text</Label>
            <Input value={form.aliasText} onChange={(e) => setForm({ ...form, aliasText: e.target.value })} />
          </div>
          <div className="mb-3">
            <Label>Language</Label>
            <Input type="select" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
            </Input>
          </div>
          <div className="mb-3">
            <Label>Alias type</Label>
            <Input type="select" value={form.aliasType} onChange={(e) => setForm({ ...form, aliasType: e.target.value })}>
              <option value="patient_phrase">Patient phrase</option>
              <option value="clinical">Clinical</option>
              <option value="synonym">Synonym</option>
              <option value="translated">Translated</option>
            </Input>
          </div>
          <div className="mb-3">
            <Label>Weight (0–1)</Label>
            <Input type="number" step="0.01" min="0" max="1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalActionButton action="cancel" onClick={() => setModalOpen(false)} />
          <ModalActionButton action="save" onClick={handleSave} />
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ListRubricAliases;
