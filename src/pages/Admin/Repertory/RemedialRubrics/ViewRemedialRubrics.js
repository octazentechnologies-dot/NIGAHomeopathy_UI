import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Input, Label, Row, Button, Spinner } from 'reactstrap';
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
            <Card>
              <CardBody className="text-center py-5">
                <p className="text-muted mb-3">No remedy selected.</p>
                <Link to="/admin/listremedialrubrics">
                  <Button color="primary">Back to list</Button>
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
              <Card>
                <CardHeader className="align-items-center d-flex">
                  <h4 className="card-title mb-0 flex-grow-1">View Remedial Rubrics</h4>
                  {loading && rubricRemedyDetails && (
                    <Spinner size="sm" color="primary" className="ms-2" />
                  )}
                </CardHeader>

                <CardBody className="card-body">
                  {isInitialLoading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted mt-3 mb-0">Loading remedial rubrics...</p>
                    </div>
                  ) : (
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={12} md={12}>
                          <table className="table table-responsive table-bordered">
                            <tbody>
                              <tr>
                                <td style={{ width: '220px' }}>Remedy Name</td>
                                <td>
                                  <p className="text-muted mb-0">{rubricRemedyDetails?.remedyName}</p>
                                </td>
                              </tr>
                              <tr>
                                <td>Themes/ Characteristics</td>
                                <td>
                                  {renderHtmlContent(rubricRemedyDetails?.themesOrCharacteristics)}
                                </td>
                              </tr>
                              <tr>
                                <td>Generals</td>
                                <td>
                                  {renderHtmlContent(rubricRemedyDetails?.generals)}
                                </td>
                              </tr>
                              <tr>
                                <td>Modalities</td>
                                <td>
                                  {renderHtmlContent(rubricRemedyDetails?.modalities)}
                                </td>
                              </tr>
                              <tr>
                                <td>Particulars</td>
                                <td>
                                  {renderHtmlContent(rubricRemedyDetails?.particulars)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Col>
                      </Row>

                      <hr />

                      <Row className="g-4 align-items-center">
                        <Col className="col-sm">
                          <div className="d-flex justify-content-sm-start">
                            <div className="search-box">
                              <input
                                type="text"
                                className="form-control form-control-sm search"
                                placeholder="Search subsection..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                              />
                              <i className="ri-search-line search-icon"></i>
                            </div>
                          </div>
                        </Col>
                        <Col className="col-sm-auto">
                          <div className="d-flex justify-content-sm-start align-items-center gap-2">
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
                                }}
                              />
                            </div>
                            <span className="text-muted small text-nowrap">
                              {filteredRubrics.length} rubric{filteredRubrics.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-2">
                        <div className="listjs-table mt-2" id="customerList">
                          <div
                            ref={listScrollRef}
                            className="table-responsive table-card"
                            style={{ maxHeight: '520px', overflowY: 'auto' }}
                            onScroll={handleListScroll}
                          >
                            <table className="table align-middle table-nowrap mb-0" id="customerTable">
                              <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                  <th>Rubric</th>
                                  <th>Description</th>
                                  <th>S.R.</th>
                                  <th>K.M.</th>
                                </tr>
                              </thead>
                              <tbody className="list form-check-all">
                                {visibleRubrics.length > 0 ? (
                                  visibleRubrics.map((rubric) => (
                                    <tr key={rubric.rubricRemedyId}>
                                      <td>{rubric.subSectionName}</td>
                                      <td>{`[${rubric.remedyCount}]`}</td>
                                      <td>
                                        <div className="form-check">
                                          <Input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`sr-${rubric.rubricRemedyId}`}
                                            checked={!!rubric.isSmallRubric}
                                            disabled={updatingRubricId === rubric.rubricRemedyId}
                                            onChange={(e) => handleSmallRubricChange(rubric.rubricRemedyId, e.target.checked)}
                                          />
                                          <Label className="form-check-label" htmlFor={`sr-${rubric.rubricRemedyId}`}>
                                            &nbsp;S.R.
                                          </Label>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="form-check">
                                          <Input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`cr-${rubric.rubricRemedyId}`}
                                            checked={!!rubric.isConformationRubric}
                                            disabled={updatingRubricId === rubric.rubricRemedyId}
                                            onChange={(e) => handleConfirmationRubricChange(rubric.rubricRemedyId, e.target.checked)}
                                          />
                                          <Label className="form-check-label" htmlFor={`cr-${rubric.rubricRemedyId}`}>
                                            &nbsp;K.M.
                                          </Label>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="text-center">
                                      No rubrics found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {filteredRubrics.length > 0 && (
                              <div className="text-center py-2 border-top bg-light">
                                {isLoadingMore ? (
                                  <span className="text-muted small">
                                    <Spinner size="sm" className="me-2" />
                                    Loading more...
                                  </span>
                                ) : hasMore ? (
                                  <span className="text-muted small">
                                    Showing {visibleRubrics.length} of {filteredRubrics.length} — scroll for more
                                  </span>
                                ) : (
                                  <span className="text-muted small">
                                    Showing all {filteredRubrics.length} rubrics
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Row>
                    </div>
                  )}
                </CardBody>

                <CardFooter className="gap-2">
                  <Row className="g-4">
                    <Col className="col-sm">
                      <div className="d-flex justify-content-sm-start" />
                    </Col>
                    <Col className="col-sm-auto">
                      <div className="d-inline-flex gap-2">
                        <Link to="/admin/listremedialrubrics">
                          <Button color="danger" className="btn-label">
                            <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                          </Button>
                        </Link>
                      </div>
                    </Col>
                  </Row>
                </CardFooter>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ViewRemedialRubrics;
