import React, { useEffect, useMemo, useState } from 'react';
import AdminListPagination from '../../../../Components/Common/AdminListPagination';
import { Card, CardBody, CardHeader, Col, Container, Label, Row, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { useDispatch } from 'react-redux';
import { deleteSubQuestionGroup } from '../../../../slices/admin/existancequestions/subquestiongroup/thunk';
import Swal from 'sweetalert2';
import { exportListTableCsv } from '../../../../helpers/listExport';
import {
  getQuestionGroupExistance,
  getQuestionGroups as getQuestionGroupMaster,
  getQuestionSectionDll,
  getQuestionSubGroupList as getQuestionSubGroupListApi,
  getQuestionsSubGroups,
} from '../../../../helpers/realbackend_helper';
import { adminFormSelectPortalProps, getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const asList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.resultObject)) return raw.resultObject;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const ListSubQuestionGroup = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubQuestionGroup, setSelectedSubQuestionGroup] = useState(null);
  const [selectedQuestionGroup, setSelectedQuestionGroup] = useState(null);
  const [selectedExistance, setSelectedExistance] = useState(null);
  const [subQuestionGroupOptions, setSubQuestionGroupOptions] = useState([]);
  const [questionGroupOptions, setQuestionGroupOptions] = useState([]);
  const [existanceOptions, setExistanceOptions] = useState([]);
  const [allSubGroups, setAllSubGroups] = useState([]);
  const [subQuestionGroupLoading, setSubQuestionGroupLoading] = useState(false);
  const pageSize = 10;
  const filtersActive = Boolean(selectedSubQuestionGroup || selectedQuestionGroup || selectedExistance);

  const loadSubGroups = async () => {
    setSubQuestionGroupLoading(true);
    try {
      const pageSizeFetch = 50;
      const fetchPages = async (request) => {
        let page = 1;
        let pages = 1;
        const rows = [];
        do {
          const response = await request({ PageNumber: page, PageSize: pageSizeFetch });
          const batch = asList(response?.resultObject ?? response?.ResultObject);
          rows.push(...batch);
          pages = Number(response?.totalPageCount ?? response?.TotalPageCount ?? 1) || 1;
          if (!batch.length) break;
          page += 1;
        } while (page <= pages && page < 40);
        return rows;
      };
      const [subGroups, groups] = await Promise.all([
        fetchPages(getQuestionSubGroupListApi),
        fetchPages(getQuestionGroupExistance),
      ]);
      const sectionByGroup = new Map(
        groups.map((group) => [
          String(group.questionGroupId ?? group.QuestionGroupId),
          {
            questionSectionId: group.questionSectionId ?? group.QuestionSectionId,
            questionSectionName: group.questionSectionName ?? group.QuestionSectionName,
          },
        ])
      );
      setAllSubGroups(
        subGroups.map((row) => {
          const section = sectionByGroup.get(String(row.questionGroupId ?? row.QuestionGroupId));
          return {
            ...row,
            questionSectionId: row.questionSectionId ?? row.QuestionSectionId ?? section?.questionSectionId,
            questionSectionName: row.questionSectionName ?? row.QuestionSectionName ?? section?.questionSectionName,
          };
        })
      );
    } catch {
      setAllSubGroups([]);
    } finally {
      setSubQuestionGroupLoading(false);
    }
  };

  useEffect(() => {
    loadSubGroups();
  }, []);

  const filteredSubGroups = useMemo(() => {
    return allSubGroups.filter((group) => {
      if (selectedSubQuestionGroup && String(group.questionSubgroupId ?? group.QuestionSubgroupId) !== String(selectedSubQuestionGroup.value)) {
        return false;
      }
      if (selectedQuestionGroup && String(group.questionGroupId ?? group.QuestionGroupId) !== String(selectedQuestionGroup.value)) {
        return false;
      }
      if (selectedExistance && String(group.questionSectionId ?? group.QuestionSectionId) !== String(selectedExistance.value)) {
        return false;
      }
      return true;
    });
  }, [allSubGroups, selectedSubQuestionGroup, selectedQuestionGroup, selectedExistance]);

  const totalRecords = filteredSubGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const subQuestionGroups = filteredSubGroups.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    let cancelled = false;
    const loadMasters = async () => {
      try {
        const [subGroups, groups, sections] = await Promise.all([
          getQuestionsSubGroups(),
          getQuestionGroupMaster(),
          getQuestionSectionDll(),
        ]);
        if (cancelled) return;
        const toOptions = (rows, valueKeys, labelKeys) =>
          asList(rows)
            .map((row) => ({
              value: valueKeys.map((key) => row[key]).find((value) => value != null),
              label: labelKeys.map((key) => row[key]).find((value) => value),
            }))
            .filter((row) => row.value && row.label)
            .sort((a, b) => String(a.label).localeCompare(String(b.label)));
        setSubQuestionGroupOptions(toOptions(subGroups, ['questionSubgroupId', 'QuestionSubgroupId'], ['questionSubgroup1', 'QuestionSubgroup1', 'questionSubGroupName', 'QuestionSubGroupName']));
        setQuestionGroupOptions(toOptions(groups, ['questionGroupId', 'QuestionGroupId'], ['questionGroupName', 'QuestionGroupName']));
        setExistanceOptions(toOptions(sections, ['questionSectionId', 'QuestionSectionId'], ['questionSectionName', 'QuestionSectionName']));
      } catch {
        if (!cancelled) {
          setSubQuestionGroupOptions([]);
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
    setSelectedSubQuestionGroup(null);
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
          deleteSubQuestionGroup({
            questionSubgroupId: group.questionSubgroupId,
            questionSubGroupName: group.questionSubGroupName,
            deleteStatus: true,
          })
        ).then(() => loadSubGroups());
        Swal.fire('Deleted!', 'Your sub question group has been deleted.', 'success');
      }
    });
  };



  const rowStart = (safePage - 1) * pageSize;

  document.title = 'List Sub Question Group';

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardBody>
                  <Row className="g-3 align-items-end">
                    <Col xl={3} md={6}>
                      <Label className="form-label mb-1">Sub Question Group Name</Label>
                      <Select
                        value={selectedSubQuestionGroup}
                        onChange={(selected) => {
                          setSelectedSubQuestionGroup(selected);
                          setCurrentPage(1);
                        }}
                        options={subQuestionGroupOptions}
                        placeholder="Select..."
                        isClearable
                        isSearchable
                        classNamePrefix="admin-form-select"
                        theme={neutralSelectTheme}
                        styles={selectStyles}
                        {...adminFormSelectPortalProps}
                      />
                    </Col>
                    <Col xl={3} md={6}>
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
                    <Col xl={3} md={6}>
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
                    <Col xl={3} md={6}>
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
                      <Link to="/admin/addsubquestiongroup" className="d-inline-flex">
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
                          <th scope="col">Sub Question Group Name</th>
                          <th scope="col">Question Group Name</th>
                          <th scope="col">Existance</th>
                          <th scope="col">Description</th>
                          <th scope="col" className="text-center" style={{ width: '12%' }}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      {subQuestionGroupLoading ? (
                        <tbody>
                          <tr>
                            <td colSpan="6" className="text-center">
                              <div className="patient-list-modal__empty">
                                <Spinner color="primary" size="sm" />
                                Loading sub question groups...
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {subQuestionGroups?.length > 0 ? (
                            subQuestionGroups.map((group, index) => (
                              <tr key={group.questionSubgroupId || index}>
                                <td className="text-center patient-list-modal__index">
                                  {rowStart + index + 1}
                                </td>
                                <td>{group.questionSubGroupName || '—'}</td>
                                <td>{group.questionGroupName || '—'}</td>
                                <td>{group.questionSectionName || '—'}</td>
                                <td>{group.description || '—'}</td>
                                <td className="text-center">
                                  <div className="d-inline-flex gap-2">
                                    <div className="edit">
                                      <Link
                                        to="/admin/editsubquestiongroup"
                                        state={{ selectedSubQuestionGroup: group }}
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
                              <td colSpan="6" className="text-center text-muted py-4">
                                {filtersActive
                                  ? 'No sub question groups match these filters'
                                  : 'No Sub Question Groups Available'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      )}
                    </table>
                  </div>

                  <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                    <div className="text-muted patient-list-modal__footer-text">
                      {subQuestionGroupLoading
                        ? 'Loading...'
                        : `Showing ${subQuestionGroups.length} of ${totalRecords} Results · Page ${safePage} of ${totalPages}`}
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

export default ListSubQuestionGroup;
