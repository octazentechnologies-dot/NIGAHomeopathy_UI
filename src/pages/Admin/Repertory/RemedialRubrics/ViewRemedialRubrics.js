import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardBody, Col, Container, Input, Row, Spinner } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { getRubricRemedyDetails, updateIsSmallRubricStatus, updateIsConfirmationRubricStatus } from '../../../../slices/admin/repertory/remedialrubrics/thunk';
import { setRubricRemedyDetails } from '../../../../slices/admin/repertory/remedialrubrics/reducer';
import Select from "react-select";
import { getRemedyGrades } from '../../../../slices/admin/repertory/rubric/thunk';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const SCROLL_LOAD_THRESHOLD_PX = 120;

const renderHtmlContent = (html) => {
  if (html == null || html === '') {
    return <span className="text-muted">—</span>;
  }
  return (
    <div
      className="text-muted remedial-rubric-html"
      dangerouslySetInnerHTML={{ __html: String(html) }}
    />
  );
};

const ViewRemedialRubrics = () => {
  const location = useLocation();
  document.title = "View Remedial Rubrics";
  const dispatch = useDispatch();
  const { rubricRemedyDetails, loading } = useSelector((state) => state.RemedicalRubric);
  const remedyGrades = useSelector((state) => state.Rubric.remedyGrades);

  const [selectedGrade, setSelectedGrade] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [updatingRubricId, setUpdatingRubricId] = useState(null);
  const listScrollRef = useRef(null);
  const loadMoreLockRef = useRef(false);

  const remedyId = location.state?.selectedRemedy?.remedyId;

  useEffect(() => {
    if (!remedyId) {
      return;
    }
    dispatch(getRubricRemedyDetails({ remedyId }));
  }, [dispatch, remedyId]);

  useEffect(() => {
    dispatch(getRemedyGrades(null));
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setVisibleCount(PAGE_SIZE);
      if (listScrollRef.current) {
        listScrollRef.current.scrollTop = 0;
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    if (listScrollRef.current) {
      listScrollRef.current.scrollTop = 0;
    }
  }, [selectedGrade]);

  const GradeOptions = useMemo(() => (
    remedyGrades?.map((grade) => ({
      label: grade.gradeNo,
      value: grade.gradeId,
    })) || []
  ), [remedyGrades]);

  const filteredRubrics = useMemo(() => {
    const list = rubricRemedyDetails?.rubricRemedyViewsList;
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }

    let filtered = list;

    if (selectedGrade) {
      filtered = filtered.filter((rubric) => rubric.gradeId === selectedGrade.value);
    }

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter((rubric) =>
        (rubric.subSectionName || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rubricRemedyDetails, selectedGrade, debouncedSearch]);

  const hasMore = visibleCount < filteredRubrics.length;

  const visibleRubrics = useMemo(
    () => filteredRubrics.slice(0, visibleCount),
    [filteredRubrics, visibleCount]
  );

  const loadMoreRubrics = useCallback(() => {
    if (loadMoreLockRef.current || !hasMore) {
      return;
    }

    loadMoreLockRef.current = true;
    setIsLoadingMore(true);

    // Keep UI responsive while appending the next chunk
    window.setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredRubrics.length));
      setIsLoadingMore(false);
      loadMoreLockRef.current = false;
    }, 0);
  }, [filteredRubrics.length, hasMore]);

  const handleListScroll = useCallback((event) => {
    const target = event.currentTarget;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining <= SCROLL_LOAD_THRESHOLD_PX) {
      loadMoreRubrics();
    }
  }, [loadMoreRubrics]);

  const patchRubricInStore = useCallback((rubricRemedyId, patch) => {
    if (!rubricRemedyDetails?.rubricRemedyViewsList) {
      return;
    }
    const nextList = rubricRemedyDetails.rubricRemedyViewsList.map((item) => (
      item.rubricRemedyId === rubricRemedyId ? { ...item, ...patch } : item
    ));
    dispatch(setRubricRemedyDetails({
      ...rubricRemedyDetails,
      rubricRemedyViewsList: nextList,
    }));
  }, [dispatch, rubricRemedyDetails]);

  const handleSmallRubricChange = async (rubricId, isChecked) => {
    const previous = filteredRubrics.find((r) => r.rubricRemedyId === rubricId)?.isSmallRubric;
    patchRubricInStore(rubricId, { isSmallRubric: isChecked });
    setUpdatingRubricId(rubricId);
    try {
      await dispatch(updateIsSmallRubricStatus({ rubricId, isSmallRubric: isChecked }));
    } catch (error) {
      console.error('Error updating small rubric:', error);
      patchRubricInStore(rubricId, { isSmallRubric: previous });
    } finally {
      setUpdatingRubricId(null);
    }
  };

  const handleConfirmationRubricChange = async (rubricId, isChecked) => {
    const previous = filteredRubrics.find((r) => r.rubricRemedyId === rubricId)?.isConformationRubric;
    patchRubricInStore(rubricId, { isConformationRubric: isChecked });
    setUpdatingRubricId(rubricId);
    try {
      await dispatch(updateIsConfirmationRubricStatus({ rubricId, isConfirmationRubric: isChecked }));
    } catch (error) {
      console.error('Error updating confirmation rubric:', error);
      patchRubricInStore(rubricId, { isConformationRubric: previous });
    } finally {
      setUpdatingRubricId(null);
    }
  };

  const handleGradeChange = (selectedOption) => {
    setSelectedGrade(selectedOption);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const isInitialLoading = loading && !rubricRemedyDetails;

  if (!remedyId) {
    return (
      <React.Fragment>
        <div className="page-content">
          <Container fluid>
            <Card className="patient-list-modal admin-existance-list">
              <CardBody className="text-center py-5">
                <p className="text-muted mb-3">No remedy selected.</p>
                <Link to="/admin/listremedialrubrics" className="d-inline-flex">
                  <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export">
                    <i className="ri-arrow-left-line align-middle me-1" aria-hidden="true" />
                    Back
                  </button>
                </Link>
              </CardBody>
            </Card>
          </Container>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-list-filter-card">
                <CardHeader className="border-0">
                  <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                    <h5 className="mb-0 fw-semibold">View Remedial Rubrics</h5>
                    <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                      {loading && rubricRemedyDetails && (
                        <Spinner size="sm" color="primary" />
                      )}
                      <Link to="/admin/listremedialrubrics" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--export">
                          <i className="ri-arrow-left-line align-middle me-1" aria-hidden="true" />
                          Back
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {isInitialLoading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" size="sm" />
                      <p className="text-muted mt-3 mb-0">Loading remedial rubrics...</p>
                    </div>
                  ) : (
                    <div className="table-responsive patient-list-modal__table-wrap">
                      <table className="table mb-0 align-middle patient-list-modal__table view-remedial-details-table">
                        <tbody>
                          <tr>
                            <th scope="row" style={{ width: '220px' }}>Remedy Name</th>
                            <td>{rubricRemedyDetails?.remedyName || '—'}</td>
                          </tr>
                          <tr>
                            <th scope="row">Themes / Characteristics</th>
                            <td>{renderHtmlContent(rubricRemedyDetails?.themesOrCharacteristics)}</td>
                          </tr>
                          <tr>
                            <th scope="row">Generals</th>
                            <td>{renderHtmlContent(rubricRemedyDetails?.generals)}</td>
                          </tr>
                          <tr>
                            <th scope="row">Modalities</th>
                            <td>{renderHtmlContent(rubricRemedyDetails?.modalities)}</td>
                          </tr>
                          <tr>
                            <th scope="row">Particulars</th>
                            <td>{renderHtmlContent(rubricRemedyDetails?.particulars)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>

              {!isInitialLoading && (
                <Card className="patient-list-modal admin-existance-list">
                  <CardHeader className="border-0">
                    <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                      <div className="patient-list-modal__search flex-shrink-0">
                        <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Search subsection..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                      </div>
                      <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                        <div style={{ minWidth: 180 }}>
                          <Select
                            options={GradeOptions}
                            value={selectedGrade}
                            onChange={handleGradeChange}
                            isClearable
                            placeholder="Select Grade"
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                            menuPosition="fixed"
                            styles={{
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                              menu: (base) => ({ ...base, zIndex: 9999 }),
                              control: (base) => ({ ...base, minHeight: 34, height: 34 }),
                              valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                              indicatorsContainer: (base) => ({ ...base, height: 34 }),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div
                      ref={listScrollRef}
                      className="table-responsive patient-list-modal__table-wrap"
                      style={{ maxHeight: '520px', overflowY: 'auto' }}
                      onScroll={handleListScroll}
                    >
                      <table className="table mb-0 align-middle patient-list-modal__table" id="customerTable">
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th scope="col">Rubric</th>
                            <th scope="col">Description</th>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>S.R.</th>
                            <th scope="col" className="text-center" style={{ width: '10%' }}>K.M.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRubrics.length > 0 ? (
                            visibleRubrics.map((rubric) => (
                              <tr key={rubric.rubricRemedyId}>
                                <td>{rubric.subSectionName || '—'}</td>
                                <td>{`[${rubric.remedyCount ?? 0}]`}</td>
                                <td className="text-center">
                                  <Input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`sr-${rubric.rubricRemedyId}`}
                                    checked={!!rubric.isSmallRubric}
                                    disabled={updatingRubricId === rubric.rubricRemedyId}
                                    onChange={(e) => handleSmallRubricChange(rubric.rubricRemedyId, e.target.checked)}
                                  />
                                </td>
                                <td className="text-center">
                                  <Input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`cr-${rubric.rubricRemedyId}`}
                                    checked={!!rubric.isConformationRubric}
                                    disabled={updatingRubricId === rubric.rubricRemedyId}
                                    onChange={(e) => handleConfirmationRubricChange(rubric.rubricRemedyId, e.target.checked)}
                                  />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-4">
                                {searchQuery || selectedGrade ? 'No rubrics match your filters' : 'No rubrics found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                      <div className="text-muted patient-list-modal__footer-text">
                        {isLoadingMore ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Loading more...
                          </>
                        ) : hasMore ? (
                          `Showing ${visibleRubrics.length} of ${filteredRubrics.length} Results — scroll for more`
                        ) : (
                          `Showing ${visibleRubrics.length} of ${filteredRubrics.length} Results`
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ViewRemedialRubrics;
