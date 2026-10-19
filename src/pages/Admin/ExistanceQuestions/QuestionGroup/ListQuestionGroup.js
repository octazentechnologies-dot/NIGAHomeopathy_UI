import React, { useEffect, useMemo, useState } from 'react';
import AdminListPagination from '../../../../Components/Common/AdminListPagination';
import { Card, CardBody, CardHeader, Col, Container, Label, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { deleteQuestionGroup } from '../../../../slices/admin/questiongroup/thunk';
import Swal from 'sweetalert2';
import { getAuditUserName } from "../../../../helpers/api_helper";
import { exportListTableCsv } from '../../../../helpers/listExport';
import { getQuestionGroupExistance, getQuestionGroups as getQuestionGroupMaster, getQuestionSectionDll } from '../../../../helpers/realbackend_helper';
import { adminFormSelectPortalProps, getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const asList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.resultObject)) return raw.resultObject;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const ListQuestionGroup = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState(null);
  const [selectedExistance, setSelectedExistance] = useState(null);
  const [questionGroupOptions, setQuestionGroupOptions] = useState([]);
  const [existanceOptions, setExistanceOptions] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [questionGroupLoading, setQuestionGroupLoading] = useState(false);
  const pageSize = 10;
  const filtersActive = Boolean(selectedQuestionGroup || selectedExistance);

  const loadGroups = async () => {
    setQuestionGroupLoading(true);
    try {
      const pageSizeFetch = 50;
      let page = 1;
      let pages = 1;
      const rows = [];
      do {
        const response = await getQuestionGroupExistance({ PageNumber: page, PageSize: pageSizeFetch });
        const batch = asList(response?.resultObject ?? response?.ResultObject);
        rows.push(...batch);
        pages = Number(response?.totalPageCount ?? response?.TotalPageCount ?? 1) || 1;
        if (!batch.length) break;
        page += 1;
      } while (page <= pages && page < 40);
      setAllGroups(rows);
    } catch {
      setAllGroups([]);
    } finally {
      setQuestionGroupLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    return allGroups.filter((group) => {
      if (selectedQuestionGroup && String(group.questionGroupId ?? group.QuestionGroupId) !== String(selectedQuestionGroup.value)) {
        return false;
      }
      if (selectedExistance && String(group.questionSectionId ?? group.QuestionSectionId) !== String(selectedExistance.value)) {
        return false;
      }
      return true;
    });
  }, [allGroups, selectedQuestionGroup, selectedExistance]);

  const totalRecords = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const questionGroups = filteredGroups.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    let cancelled = false;
    const loadMasters = async () => {
      try {
        const [groups, sections] = await Promise.all([
          getQuestionGroupMaster(),
          getQuestionSectionDll(),
        ]);
        if (cancelled) return;
        setQuestionGroupOptions(
          asList(groups)
            .map((row) => ({
              value: row.questionGroupId ?? row.QuestionGroupId,
              label: row.questionGroupName ?? row.QuestionGroupName,
            }))
            .filter((row) => row.value && row.label)
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        setExistanceOptions(
          asList(sections)
            .map((row) => ({
              value: row.questionSectionId ?? row.QuestionSectionId,
              label: row.questionSectionName ?? row.QuestionSectionName,
            }))
            .filter((row) => row.value && row.label)
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch {
        if (!cancelled) {
          setQuestionGroupOptions([]);
          setExistanceOptions([]);
        }
      }
    };
    loadMasters();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectStyles = useMemo(() => getAdminFormSelectStyles(), []);

  const handleReset = () => {
    setSelectedQuestionGroup(null);
    setSelectedExistance(null);
    setCurrentPage(1);
  };

  const handleDelete = (group) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(
          deleteQuestionGroup({
            questionGroupId: group.questionGroupId,
            QuestionGroupName: group.questionGroupName,
            enteredBy: getAuditUserName(),
            deleteStatus: true,
          })
        ).then(() => loadGroups());
        Swal.fire('Deleted!', 'Your question group has been deleted.', 'success');
      }
    });
  };



  const rowStart = (safePage - 1) * pageSize;

  document.title = 'List Question Groups';

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <Row className="g-3 align-items-end">
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1">Question Group Name</Label>
                      <Select
                        value={selectedQuestionGroup}
                        onChange={(selected) => {
                          setSelectedQuestionGroup(selected);
                          setCurrentPage(1);
                        }}
                        options={questionGroupOptions}
                        placeholder="Select..."
                        isClearable
                        isSearchable
                        classNamePrefix="admin-form-select"
                        theme={neutralSelectTheme}
                        styles={selectStyles}
                        {...adminFormSelectPortalProps}
                      />
                    </Col>
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1">Existance</Label>
                      <Select
                        value={selectedExistance}
                        onChange={(selected) => {
                          setSelectedExistance(selected);
                          setCurrentPage(1);
                        }}
                        options={existanceOptions}
                        placeholder="Select..."
                        isClearable
                        isSearchable
                        classNamePrefix="admin-form-select"
                        theme={neutralSelectTheme}
                        styles={selectStyles}
                        {...adminFormSelectPortalProps}
                      />
                    </Col>
                    <Col xxl={4} md={4}>
                      <Label className="form-label mb-1 opacity-0 user-select-none" aria-hidden="true">
                        Reset
                      </Label>
                      <div className="admin-list-filter-reset">
                        <button
                          type="button"
                          className="btn btn-sm admin-list-btn admin-list-btn--reset"
                          onClick={handleReset}
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
                  <div className="admin-list-toolbar d-flex align-items-center justify-content-end gap-2 flex-wrap w-100">
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0">
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--import" disabled title="Import is not available for this list yet">
                        <i className="ri-upload-2-line align-middle me-1" aria-hidden="true" />
                        Import
                      </button>
                      <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export" onClick={(e) => exportListTableCsv(e)}>
                        <i className="ri-download-2-line align-middle me-1" aria-hidden="true" />
                        Export
                      </button>
                      <Link to="/admin/addquestiongroup" className="d-inline-flex">
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
                          <th scope="col" className="text-center" style={{ width: '5%' }}>
                            #
                          </th>
                          <th scope="col">Question Group Name</th>
                          <th scope="col">Existance</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      {questionGroupLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="5" className="text-center">
                              <div className="patient-list-modal__empty">
                                <Spinner color="primary" size="sm" />
                                Loading question groups...
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {questionGroups?.length > 0 ? (
                            questionGroups.map((group, index) => (
                              <tr key={group.questionGroupId || index}>
                                <td className="text-center patient-list-modal__index">
                                  {rowStart + index + 1}
                                </td>
                                <td>{group.questionGroupName || '—'}</td>
                                <td>{group.questionSectionName || '—'}</td>
                                <td>{group.description || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link
                                        to="/admin/editquestiongroup"
                                        state={{ selectedQuestionGroup: group }}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-soft-success edit-item-btn"
                                          title="Edit"
                                        >
                                          <i className="ri-pencil-fill" />
                                        </button>
                                      </Link>
                                    </div>
                                    <div className="remove">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        title="Delete"
                                        onClick={() => handleDelete(group)}
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
                                {filtersActive
                                  ? 'No question groups match these filters'
                                  : 'No Question Groups Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {questionGroupLoading
                        ? 'Loading...'
                        : `Showing ${questionGroups.length} of ${totalRecords} Results · Page ${safePage} of ${totalPages}`}
                    </div>
                                        <AdminListPagination
                      currentPage={safePage}
                      totalPages={totalPages}
                      onPage={setCurrentPage}
                    />
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

export default ListQuestionGroup;
