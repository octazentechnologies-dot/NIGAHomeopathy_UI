import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, CardBody, CardHeader, Col, Container, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from 'reactstrap';
import AdminListPagination from '../../../Components/Common/AdminListPagination';
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

  const load = useCallback(async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await getRubricAliases({ search: search || undefined, pageNumber: page, pageSize });
      const payload = response?.data?.resultObject ?? response?.data ?? {};
      setItems(payload.items ?? []);
      setTotalCount(payload.totalCount ?? 0);
      setCurrentPage(page);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Load failed', text: error?.message || 'Could not load aliases.' });
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    load(1);
  }, []);

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
      title: 'Delete alias?',
      showCancelButton: true,
      confirmButtonColor: '#000',
    });
    if (!confirm.isConfirmed) return;
    await deleteRubricAlias(row.rubricAliasId);
    await load(currentPage);
  };

  document.title = 'Rubric Aliases';
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <Row className="g-3 align-items-center">
                  <Col md={5}>
                    <Input
                      placeholder="Search alias or rubric name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && load(1)}
                    />
                  </Col>
                  <Col md="auto" className="ms-auto d-flex gap-2">
                    <Button color="secondary" outline size="sm" onClick={() => load(1)}>Search</Button>
                    <Button color="primary" size="sm" onClick={openCreate}>Add Alias</Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="table-responsive">
                  <table className="table align-middle table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Alias</th>
                        <th>Rubric (SubSection)</th>
                        <th>Type</th>
                        <th>Weight</th>
                        <th>Usage</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center"><Spinner size="sm" /></td></tr>
                      ) : items.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted">No aliases found</td></tr>
                      ) : items.map((row) => (
                        <tr key={row.rubricAliasId}>
                          <td className="fw-medium">{row.aliasText}</td>
                          <td>
                            <div>{row.subSectionName}</div>
                            <small className="text-muted">ID: {row.subSectionId}</small>
                          </td>
                          <td>{row.aliasType}</td>
                          <td>{row.weight}</td>
                          <td>{row.usageCount ?? 0}</td>
                          <td className="text-end">
                            <Button size="sm" color="info" outline className="me-1" onClick={() => openEdit(row)}>Edit</Button>
                            <Button size="sm" color="danger" outline onClick={() => handleDelete(row)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <AdminListPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  onPageChange={load}
                />
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
          <Button color="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button color="primary" onClick={handleSave}>Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ListRubricAliases;
