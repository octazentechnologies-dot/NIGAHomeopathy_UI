import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge, Card, CardBody, CardHeader, Col, Container, Row, Spinner,
} from 'reactstrap';
import Swal from 'sweetalert2';
import {
  getRubricBenchmarkSummary,
  getRubricBenchmarkTrends,
  getRubricFeedbackQueue,
  getRubricIntelligenceConfig,
  updateRubricIntelligenceConfig,
  getRubricIntelligenceRolloutStatus,
  getRepertoryMappingStatus,
} from '../../../helpers/realbackend_helper';

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
};

const ListRubricBenchmarkDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [queue, setQueue] = useState(null);
  const [config, setConfig] = useState(null);
  const [rollout, setRollout] = useState(null);
  const [repertory, setRepertory] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, queueRes, configRes, rolloutRes, repertoryRes] = await Promise.all([
        getRubricBenchmarkSummary({ days: 30 }),
        getRubricBenchmarkTrends({ weeks: 8 }),
        getRubricFeedbackQueue({ topN: 10 }),
        getRubricIntelligenceConfig(),
        getRubricIntelligenceRolloutStatus(),
        getRepertoryMappingStatus(),
      ]);

      setSummary(summaryRes?.data?.resultObject ?? summaryRes?.data ?? null);
      const trendPayload = trendsRes?.data?.resultObject ?? trendsRes?.data ?? {};
      setTrends(trendPayload.weeks ?? []);
      setQueue(queueRes?.data?.resultObject ?? queueRes?.data ?? null);
      setConfig(configRes?.data?.resultObject ?? configRes?.data ?? null);
      setRollout(rolloutRes?.data?.resultObject ?? rolloutRes?.data ?? null);
      setRepertory(repertoryRes?.data?.resultObject ?? repertoryRes?.data ?? null);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Load failed',
        text: error?.message || 'Could not load benchmark dashboard.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyConfig = async (payload, confirmText) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Confirm configuration change',
      text: confirmText,
      showCancelButton: true,
      confirmButtonColor: '#000000',
    });
    if (!confirm.isConfirmed) return;

    setSavingConfig(true);
    try {
      const response = await updateRubricIntelligenceConfig(payload);
      setConfig(response?.data?.resultObject ?? response?.data ?? null);
      await load();
      Swal.fire({ icon: 'success', title: 'Configuration updated', timer: 1800, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Update failed', text: error?.message || 'Could not update config.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const rejectedRubrics = queue?.topRejectedRubrics ?? summary?.topRejectedRubrics ?? [];
  const lowAliases = queue?.lowAcceptanceAliases ?? [];

  document.title = 'Rubric Intelligence Benchmark';

  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card className="patient-list-modal admin-existance-list admin-benchmark-dashboard">
              <CardHeader className="border-0">
                <div className="admin-list-toolbar d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                  <div>
                    <h5 className="mb-0">Rubric Intelligence Benchmark</h5>
                    <small className="text-muted">Doctor feedback metrics — targets: ≥95% acceptance and primary-in-top-5</small>
                  </div>
                  <div className="admin-list-toolbar__actions d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
                    {loading ? <Spinner size="sm" color="primary" /> : null}
                    <button
                      type="button"
                      className="btn btn-sm admin-list-btn admin-list-btn--reset"
                      onClick={load}
                      disabled={loading}
                    >
                      <i className="ri-refresh-line align-middle me-1" aria-hidden="true" />
                      Refresh
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Row className="g-3 mb-4">
                  <Col lg={6}>
                    <Card className="patient-list-modal admin-existance-list mb-0 h-100">
                      <CardHeader className="border-0 py-2">
                        <strong>Production rollout controls (Phase 8)</strong>
                      </CardHeader>
                      <CardBody>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <Badge color={config?.isV2Active ? 'success' : 'secondary'}>
                            V2 {config?.isV2Active ? 'ACTIVE' : 'OFF'}
                          </Badge>
                          <Badge color={config?.rollbackToV1Only ? 'danger' : 'light'} className={config?.rollbackToV1Only ? '' : 'text-dark'}>
                            Rollback {config?.rollbackToV1Only ? 'ON' : 'OFF'}
                          </Badge>
                          {config?.hasRuntimeOverride && (
                            <Badge color="warning" className="text-dark">Runtime override active</Badge>
                          )}
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--new"
                            disabled={savingConfig || config?.isV2Active}
                            onClick={() => applyConfig({ enableV2: true, rollbackToV1Only: false }, 'Enable V2 for all doctors?')}
                          >
                            Enable V2
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--reset"
                            disabled={savingConfig}
                            onClick={() => applyConfig({ rollbackToV1Only: true }, 'Instant rollback to V1-only behavior?')}
                          >
                            Rollback to V1
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--export"
                            disabled={savingConfig}
                            onClick={() => applyConfig({ rollbackToV1Only: false, enableV2: false }, 'Disable V2 runtime override?')}
                          >
                            Disable V2 override
                          </button>
                        </div>
                        <p className="text-muted small mt-3 mb-0">
                          Runtime toggles apply immediately without redeploy. Persist long-term changes in `appsettings.json` (`RubricIntelligence:EnableV2`).
                        </p>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col lg={6}>
                    <Card className="patient-list-modal admin-existance-list mb-0 h-100">
                      <CardHeader className="border-0 py-2 d-flex justify-content-between align-items-center">
                        <strong>Go-live gates</strong>
                        <span className="small text-muted">
                          {rollout?.gatesPassed ?? 0}/{rollout?.gatesTotal ?? 0} passed
                        </span>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="table-responsive patient-list-modal__table-wrap">
                          <table className="table mb-0 align-middle patient-list-modal__table">
                            <thead>
                              <tr>
                                <th scope="col">Code</th>
                                <th scope="col">Title</th>
                                <th scope="col" className="text-center" style={{ width: '12%' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(rollout?.gates ?? []).length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="text-center text-muted py-3">No gates loaded</td>
                                </tr>
                              ) : (
                                (rollout?.gates ?? []).map((gate) => (
                                  <tr key={gate.gateCode}>
                                    <td>{gate.gateCode}</td>
                                    <td>{gate.title}</td>
                                    <td className="text-center">
                                      <Badge color={gate.passed ? 'success' : 'secondary'}>
                                        {gate.passed ? 'Pass' : 'Pending'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <div className="text-muted small">Repertory sources</div>
                    <div className="fw-semibold">{repertory?.activeSourceCount ?? 0}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">Mapped rubrics (Kent/Complete)</div>
                    <div className="fw-semibold">{repertory?.mappedRubricCount ?? 0}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">Ready for production rollout</div>
                    <div className="fw-semibold">{rollout?.readyForProductionRollout ? 'Yes' : 'Not yet'}</div>
                  </Col>
                </Row>

                <Row className="g-3 mb-4">
                  <Col md={3}>
                    <Card className="patient-list-modal admin-existance-list mb-0">
                      <CardBody>
                        <div className="text-muted small">Acceptance (7 day)</div>
                        <div className="fs-4 fw-semibold">{formatPercent(summary?.acceptanceRate7Day)}</div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="patient-list-modal admin-existance-list mb-0">
                      <CardBody>
                        <div className="text-muted small">Acceptance (30 day)</div>
                        <div className="fs-4 fw-semibold">{formatPercent(summary?.acceptanceRate30Day)}</div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="patient-list-modal admin-existance-list mb-0">
                      <CardBody>
                        <div className="text-muted small">Primary in top-5 (30 day)</div>
                        <div className="fs-4 fw-semibold">{formatPercent(summary?.primaryInTop5Rate30Day)}</div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="patient-list-modal admin-existance-list mb-0">
                      <CardBody>
                        <div className="text-muted small">Gold cases loaded</div>
                        <div className="fs-4 fw-semibold">{summary?.goldCaseCount ?? 0}</div>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>

                <Row className="g-3 mb-4">
                  <Col md={4}>
                    <div className="text-muted small">Sessions benchmarked (30 day)</div>
                    <div className="fw-semibold">{summary?.totalSessionsBenchmarked ?? 0}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">Feedback events (30 day)</div>
                    <div className="fw-semibold">{summary?.totalFeedbackCount ?? 0}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small">V2 acceptance (30 day)</div>
                    <div className="fw-semibold">{formatPercent(summary?.v2AcceptanceRate30Day)}</div>
                  </Col>
                </Row>

                <Card className="patient-list-modal admin-existance-list mb-4">
                  <CardHeader className="border-0 py-2">
                    <strong>Weekly trends</strong>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="table-responsive patient-list-modal__table-wrap">
                      <table className="table mb-0 align-middle patient-list-modal__table">
                        <thead>
                          <tr>
                            <th scope="col" className="text-center" style={{ width: '5%' }}>#</th>
                            <th scope="col">Week Starting</th>
                            <th scope="col">Sessions</th>
                            <th scope="col">Acceptance</th>
                            <th scope="col">Primary in Top-5</th>
                            <th scope="col">False Positive</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trends.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center text-muted py-4">No benchmark data yet.</td>
                            </tr>
                          ) : (
                            trends.map((row, index) => (
                              <tr key={row.weekStartUtc || index}>
                                <td className="text-center patient-list-modal__index">{index + 1}</td>
                                <td>{row.weekStartUtc ? new Date(row.weekStartUtc).toLocaleDateString() : '—'}</td>
                                <td>{row.sessionCount ?? 0}</td>
                                <td>{formatPercent(row.acceptanceRate)}</td>
                                <td>{formatPercent(row.primaryInTop5Rate)}</td>
                                <td>{formatPercent(row.falsePositiveRate)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
                      <div className="text-muted patient-list-modal__footer-text">
                        Showing {trends.length} Results
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <h6 className="mb-3">Improvement queue</h6>
                <Row className="g-3">
                  <Col lg={6}>
                    <Card className="patient-list-modal admin-existance-list mb-0 h-100">
                      <CardHeader className="border-0 py-2">
                        <strong>Top rejected rubrics</strong>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="table-responsive patient-list-modal__table-wrap">
                          <table className="table mb-0 align-middle patient-list-modal__table">
                            <thead>
                              <tr>
                                <th scope="col" className="text-center" style={{ width: '10%' }}>#</th>
                                <th scope="col">Rubric</th>
                                <th scope="col" className="text-center" style={{ width: '20%' }}>Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rejectedRubrics.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="text-center text-muted py-3">No rejections recorded yet.</td>
                                </tr>
                              ) : (
                                rejectedRubrics.map((row, index) => (
                                  <tr key={`${row.rubricName}-${row.subSectionId ?? 'na'}-${index}`}>
                                    <td className="text-center patient-list-modal__index">{index + 1}</td>
                                    <td>{row.rubricName || '—'}</td>
                                    <td className="text-center">
                                      <Badge color="danger">{row.rejectionCount}</Badge>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col lg={6}>
                    <Card className="patient-list-modal admin-existance-list mb-0 h-100">
                      <CardHeader className="border-0 py-2">
                        <strong>Low acceptance aliases</strong>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <div className="table-responsive patient-list-modal__table-wrap">
                          <table className="table mb-0 align-middle patient-list-modal__table">
                            <thead>
                              <tr>
                                <th scope="col" className="text-center" style={{ width: '10%' }}>#</th>
                                <th scope="col">Alias</th>
                                <th scope="col" className="text-center" style={{ width: '25%' }}>Acceptance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lowAliases.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="text-center text-muted py-3">No low-acceptance aliases flagged.</td>
                                </tr>
                              ) : (
                                lowAliases.map((row, index) => (
                                  <tr key={`alias-${row.entityId}-${index}`}>
                                    <td className="text-center patient-list-modal__index">{index + 1}</td>
                                    <td>{row.displayText || '—'}</td>
                                    <td className="text-center">{formatPercent(row.acceptanceRate)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ListRubricBenchmarkDashboard;
