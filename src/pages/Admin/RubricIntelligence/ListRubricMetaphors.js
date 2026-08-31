import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge, Button, Card, CardBody, CardHeader, Col, Container, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from 'reactstrap';
import AdminListPagination from '../../../Components/Common/AdminListPagination';
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

  const load = useCallback(async (page = currentPage) => {
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
  }, [search, languageFilter, currentPage]);

  useEffect(() => {
    load(1);
  }, [languageFilter]);

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
      title: 'Delete metaphor?',
      showCancelButton: true,
      confirmButtonColor: '#000',
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

  document.title = 'Rubric Metaphors';
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <Row className="g-3 align-items-center">
                  <Col md={4}>
                    <Input
                      placeholder="Search metaphors..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && load(1)}
                    />
                  </Col>
                  <Col md={3}>
                    <Input type="select" value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                      <option value="">All languages</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                    </Input>
                  </Col>
                  <Col md="auto" className="ms-auto d-flex gap-2">
                    <Button color="secondary" outline size="sm" onClick={() => load(1)}>Search</Button>
                    <Button color="primary" size="sm" onClick={openCreate}>Add Metaphor</Button>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="table-responsive">
                  <table className="table align-middle table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Patient expression</th>
                        <th>Clinical meaning</th>
                        <th>Language</th>
                        <th>Status</th>
                        <th>Usage</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center"><Spinner size="sm" /></td></tr>
                      ) : items.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-muted">No metaphors found</td></tr>
                      ) : items.map((row) => (
                        <tr key={row.metaphorId}>
                          <td>
                            <div className="fw-medium">{row.patientExpression}</div>
                            <small className="text-muted">{row.rubricMeaning}</small>
                          </td>
                          <td>{row.clinicalMeaning}</td>
                          <td>{row.language}</td>
                          <td>
                            <Badge color={row.approvalStatus === 'Approved' ? 'success' : row.approvalStatus === 'Rejected' ? 'danger' : 'warning'}>
                              {row.approvalStatus}
                            </Badge>
                          </td>
                          <td>{row.usageCount ?? 0}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-1 flex-wrap justify-content-end">
                              {row.approvalStatus === 'Pending' && (
                                <>
                                  <Button size="sm" color="success" outline onClick={() => handleApprove(row.metaphorId)}>Approve</Button>
                                  <Button size="sm" color="danger" outline onClick={() => handleReject(row.metaphorId)}>Reject</Button>
                                </>
                              )}
                              <Button size="sm" color="info" outline onClick={() => openEdit(row)}>Edit</Button>
                              <Button size="sm" color="danger" outline onClick={() => handleDelete(row)}>Delete</Button>
                            </div>
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
          <Button color="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button color="primary" onClick={handleSave}>Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ListRubricMetaphors;
