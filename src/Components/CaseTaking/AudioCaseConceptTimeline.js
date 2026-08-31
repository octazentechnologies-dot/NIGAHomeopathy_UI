import React from 'react';
import { Badge, Card, CardBody, CardHeader, Col, Row } from 'reactstrap';

const categoryColor = (category) => {
  const key = String(category || '').toLowerCase();
  if (key === 'mental') return 'primary';
  if (key === 'causation') return 'warning';
  if (key === 'general') return 'info';
  if (key === 'particular') return 'secondary';
  if (key === 'concomitant') return 'dark';
  return 'light';
};

const AudioCaseConceptTimeline = ({
  concepts = [],
  causationLinks = [],
  engineVersion = 'v1',
  loading = false,
  error = null,
}) => {
  if (engineVersion !== 'v2') {
    return null;
  }

  if (loading) {
    return (
      <Card className="border mb-3">
        <CardBody className="text-muted small">Loading clinical concept timeline…</CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border mb-3">
        <CardBody className="text-danger small">{error}</CardBody>
      </Card>
    );
  }

  if ((!Array.isArray(concepts) || concepts.length === 0) && (!Array.isArray(causationLinks) || causationLinks.length === 0)) {
    return null;
  }

  const sortedConcepts = [...(concepts || [])].sort((a, b) => {
    const orderA = Number(a.sequenceOrder || 0);
    const orderB = Number(b.sequenceOrder || 0);
    if (orderA !== orderB) return orderA - orderB;
    return Number(b.confidence || 0) - Number(a.confidence || 0);
  });

  return (
    <Card className="border mb-3">
      <CardHeader className="py-2">
        <h6 className="mb-0">Clinical concept timeline</h6>
      </CardHeader>
      <CardBody>
        {Array.isArray(causationLinks) && causationLinks.length > 0 && (
          <div className="mb-3">
            <div className="fw-medium mb-2">Causation chain</div>
            {causationLinks.map((link) => (
              <div
                key={link.linkId || `${link.causeText}-${link.effectText}`}
                className="d-flex flex-wrap align-items-center gap-2 mb-2 p-2 rounded bg-light"
              >
                <Badge color="warning" pill>{link.causeText || 'Cause'}</Badge>
                <span className="text-muted">→</span>
                <Badge color="success" pill>{link.effectText || 'Effect'}</Badge>
                {link.confidence != null && (
                  <span className="small text-muted ms-auto">
                    {Math.round(Number(link.confidence) * 100)}% confidence
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {sortedConcepts.length > 0 && (
          <>
            <div className="fw-medium mb-2">Extracted concepts</div>
            <Row className="g-2">
              {sortedConcepts.map((concept, index) => (
                <Col md={6} key={concept.conceptId || `concept-${index}`}>
                  <div className="border rounded p-2 h-100">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <Badge color={categoryColor(concept.category)} pill>
                        {concept.category || 'concept'}
                      </Badge>
                      {concept.isSRP && <Badge color="danger" pill>SRP</Badge>}
                      {concept.homeopathicWeight > 0 && (
                        <Badge color="light" className="text-dark" pill>
                          Weight {Number(concept.homeopathicWeight).toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="small fw-medium">{concept.clinicalMeaning || concept.rawStatement}</div>
                    {concept.homeopathicMeaning && concept.homeopathicMeaning !== concept.clinicalMeaning && (
                      <div className="small text-muted mt-1">{concept.homeopathicMeaning}</div>
                    )}
                    {Array.isArray(concept.modalities) && concept.modalities.length > 0 && (
                      <div className="small mt-1">
                        <span className="text-muted">Modalities: </span>
                        {concept.modalities.join(', ')}
                      </div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default AudioCaseConceptTimeline;
