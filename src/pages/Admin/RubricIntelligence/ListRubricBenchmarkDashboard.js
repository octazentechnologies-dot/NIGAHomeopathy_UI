import React, { useCallback, useEffect, useState } from 'react';
import {
  Badge, Button, Card, CardBody, CardHeader, Col, Container, Row, Spinner, Table,
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

  return (
    <div className="page-content">
      <Container fluid>
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="card-title mb-1">Rubric Intelligence Benchmark</h4>
              <p className="text-muted mb-0">Doctor feedback metrics — targets: ≥95% acceptance and primary-in-top-5</p>
            </div>
            {loading && <Spinner size="sm" />}
          </CardHeader>
          <CardBody>
            <Row className="g-3 mb-4">
              <Col lg={6}>
                <Card className="border shadow-none h-100">
                  <CardHeader className="py-2">
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
                      <Button
                        size="sm"
                        color="success"
                        disabled={savingConfig || config?.isV2Active}
                        onClick={() => applyConfig({ enableV2: true, rollbackToV1Only: false }, 'Enable V2 for all doctors?')}
                      >
                        Enable V2
                      </Button>
                      <Button
                        size="sm"
                        color="warning"
                        disabled={savingConfig}
                        onClick={() => applyConfig({ rollbackToV1Only: true }, 'Instant rollback to V1-only behavior?')}
                      >
                        Rollback to V1
                      </Button>
                      <Button
                        size="sm"
                        color="secondary"
                        outline
                        disabled={savingConfig}
                        onClick={() => applyConfig({ rollbackToV1Only: false, enableV2: false }, 'Disable V2 runtime override?')}
                      >
                        Disable V2 override
                      </Button>
                    </div>
                    <p className="text-muted small mt-3 mb-0">
                      Runtime toggles apply immediately without redeploy. Persist long-term changes in `appsettings.json` (`RubricIntelligence:EnableV2`).
                    </p>
                  </CardBody>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border shadow-none h-100">
                  <CardHeader className="py-2 d-flex justify-content-between align-items-center">
                    <strong>Go-live gates</strong>
                    <span className="small text-muted">
                      {rollout?.gatesPassed ?? 0}/{rollout?.gatesTotal ?? 0} passed
                    </span>
                  </CardHeader>
                  <CardBody className="p-0">
                    <Table size="sm" responsive className="mb-0">
                      <tbody>
                        {(rollout?.gates ?? []).map((gate) => (
                          <tr key={gate.gateCode}>
                            <td>{gate.gateCode}</td>
                            <td>{gate.title}</td>
                            <td className="text-end">
                              <Badge color={gate.passed ? 'success' : 'secondary'}>
                                {gate.passed ? 'Pass' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
                <Card className="border shadow-none mb-0">
                  <CardBody>
                    <div className="text-muted small">Acceptance (7 day)</div>
                    <div className="fs-4 fw-semibold">{formatPercent(summary?.acceptanceRate7Day)}</div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border shadow-none mb-0">
                  <CardBody>
                    <div className="text-muted small">Acceptance (30 day)</div>
                    <div className="fs-4 fw-semibold">{formatPercent(summary?.acceptanceRate30Day)}</div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border shadow-none mb-0">
                  <CardBody>
                    <div className="text-muted small">Primary in top-5 (30 day)</div>
                    <div className="fs-4 fw-semibold">{formatPercent(summary?.primaryInTop5Rate30Day)}</div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border shadow-none mb-0">
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

            <h5 className="mb-3">Weekly trends</h5>
            <Table size="sm" responsive className="mb-4">
              <thead className="table-light">
                <tr>
                  <th>Week starting</th>
                  <th>Sessions</th>
                  <th>Acceptance</th>
                  <th>Primary in top-5</th>
                  <th>False positive</th>
                </tr>
              </thead>
              <tbody>
                {trends.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted">No benchmark data yet.</td>
                  </tr>
                )}
                {trends.map((row) => (
                  <tr key={row.weekStartUtc}>
                    <td>{row.weekStartUtc ? new Date(row.weekStartUtc).toLocaleDateString() : '—'}</td>
                    <td>{row.sessionCount ?? 0}</td>
                    <td>{formatPercent(row.acceptanceRate)}</td>
                    <td>{formatPercent(row.primaryInTop5Rate)}</td>
                    <td>{formatPercent(row.falsePositiveRate)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <h5 className="mb-3">Improvement queue</h5>
            <Row className="g-3">
              <Col lg={6}>
                <Card className="border shadow-none h-100">
                  <CardHeader className="py-2">
                    <strong>Top rejected rubrics</strong>
                  </CardHeader>
                  <CardBody className="p-0">
                    <Table size="sm" responsive className="mb-0">
                      <tbody>
                        {(queue?.topRejectedRubrics ?? summary?.topRejectedRubrics ?? []).length === 0 && (
                          <tr><td className="text-muted p-3">No rejections recorded yet.</td></tr>
                        )}
                        {(queue?.topRejectedRubrics ?? summary?.topRejectedRubrics ?? []).map((row) => (
                          <tr key={`${row.rubricName}-${row.subSectionId ?? 'na'}`}>
                            <td>{row.rubricName}</td>
                            <td className="text-end">
                              <Badge color="danger">{row.rejectionCount}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </CardBody>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="border shadow-none h-100">
                  <CardHeader className="py-2">
                    <strong>Low acceptance aliases</strong>
                  </CardHeader>
                  <CardBody className="p-0">
                    <Table size="sm" responsive className="mb-0">
                      <tbody>
                        {(queue?.lowAcceptanceAliases ?? []).length === 0 && (
                          <tr><td className="text-muted p-3">No low-acceptance aliases flagged.</td></tr>
                        )}
                        {(queue?.lowAcceptanceAliases ?? []).map((row) => (
                          <tr key={`alias-${row.entityId}`}>
                            <td>{row.displayText}</td>
                            <td className="text-end">{formatPercent(row.acceptanceRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ListRubricBenchmarkDashboard;
