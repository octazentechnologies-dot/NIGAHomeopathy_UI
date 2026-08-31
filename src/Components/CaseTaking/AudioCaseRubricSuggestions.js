import React, { useMemo, useState } from 'react';
import { Badge, Card, CardBody, CardHeader, Collapse, Table } from 'reactstrap';
import AudioCaseConfidenceBadge, { normalizeConfidence01 } from './AudioCaseConfidenceBadge';
import AudioCaseRubricExplainabilityPanel from './AudioCaseRubricExplainabilityPanel';
import AudioCaseRubricApprovalBar from './AudioCaseRubricApprovalBar';
import { isAiClinicalConceptOnly } from '../../helpers/audioCaseTakingHelper';

export const getRubricKey = (rubric) => (
  rubric?.subSectionId > 0
    ? `id:${rubric.subSectionId}`
    : `name:${String(rubric?.subSectionName || '').toLowerCase()}`
);

const formatRubricTitle = (name) => {
  if (!name) return '—';
  return String(name)
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' › ');
};

const humanHint = (rubric) => {
  const hint = rubric.matchedFrom || rubric.repertoryPath;
  if (!hint) return null;
  // Hide raw machine debug lines in the primary row.
  if (/cosine=|canonicalscore|domain=|srp=/i.test(hint)) return null;
  return hint;
};

const technicalDetails = (rubric) => {
  const bits = [];
  if (rubric.matchedFrom) bits.push(rubric.matchedFrom);
  if (rubric.selectionReason) bits.push(rubric.selectionReason);
  if (rubric.repertoryPath) bits.push(`Repertory: ${rubric.repertoryPath}`);
  return bits.filter(Boolean);
};

const AudioCaseRubricSuggestions = ({
  rubrics = [],
  intensities = [],
  onApplyRubric,
  onApplyAll,
  onRejectRubric,
  repertorizationCount = 0,
  maxRubrics = 20,
  requireManualApproval = false,
  engineVersion = 'v1',
  rubricApprovalState = {},
  approvedCount = 0,
  showEmptyHint = false,
  embedded = false,
}) => {
  const [expandedKeys, setExpandedKeys] = useState({});

  const defaultIntensity = useMemo(
    () => intensities.find((item) => item.intensityNo === 2)
      || intensities[0]
      || { intensityNo: 2, intensityId: 2 },
    [intensities],
  );

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showExplainability = engineVersion === 'v2' || engineVersion === 'v4.0' || engineVersion === 'v5.2' || engineVersion === 'v6.0' || engineVersion === 'v7.0';
  const repertoryRubrics = rubrics.filter((r) => !isAiClinicalConceptOnly(r) && r.subSectionId > 0);
  const aiConceptRubrics = rubrics.filter((r) => isAiClinicalConceptOnly(r));
  const legacyAiRubrics = rubrics.filter((r) => r.isAiSuggested && !isAiClinicalConceptOnly(r) && r.subSectionId > 0);

  const tierSections = useMemo(() => {
    if (!showExplainability || legacyAiRubrics.length === 0) {
      return [];
    }

    const order = ['Primary', 'Strong', 'Supporting', 'Secondary', 'Confirmatory', 'Inference'];
    const grouped = legacyAiRubrics.reduce((acc, rubric) => {
      const tier = rubric.rubricTier || rubric.explainability?.rubricTier || 'Confirmatory';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(rubric);
      return acc;
    }, {});

    return order
      .filter((tier) => grouped[tier]?.length)
      .map((tier) => ({
        key: tier.toLowerCase(),
        label: `${tier} rubrics`,
        items: grouped[tier],
      }));
  }, [legacyAiRubrics, showExplainability]);

  const pendingApprovals = useMemo(() => {
    if (!requireManualApproval) {
      return 0;
    }
    return rubrics.filter((rubric) => {
      if (isAiClinicalConceptOnly(rubric) || !(rubric.subSectionId > 0)) {
        return false;
      }
      const state = rubricApprovalState[getRubricKey(rubric)];
      return state !== 'rejected' && state !== 'approved';
    }).length;
  }, [rubrics, rubricApprovalState, requireManualApproval]);

  const approvalPct = rubrics.length
    ? Math.round((Math.min(approvedCount, rubrics.length) / rubrics.length) * 100)
    : 0;

  if (!rubrics.length) {
    if (!showEmptyHint) {
      return null;
    }

    return (
      <div className={embedded ? 'ac-rubrics-embedded-empty' : ''}>
        {!embedded && (
          <Card className="border mb-0">
            <CardHeader className="py-2">
              <h6 className="mb-0">Suggested rubrics</h6>
            </CardHeader>
            <CardBody>
              <p className="text-muted mb-0 small">
                No rubrics were suggested. Try re-analyzing after editing the transcript,
                or add rubrics manually from the Repertory tab.
              </p>
            </CardBody>
          </Card>
        )}
        {embedded && (
          <p className="text-muted mb-0 small px-3 py-4 text-center">
            No rubrics were suggested. Try re-analyzing after editing the transcript,
            or add rubrics manually from Repertory.
          </p>
        )}
      </div>
    );
  }

  const renderTable = (items, keyPrefix) => (
    <Table className="align-middle mb-0 ac-rubric-table" size="sm" responsive>
      <thead className="table-light">
        <tr>
          <th style={{ width: '36px' }} />
          <th>Rubric</th>
          <th style={{ width: '88px' }}>Match</th>
          <th style={{ width: '64px' }}>Grade</th>
          <th className="text-end" style={{ width: '76px' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map((rubric) => {
          const rubricKey = getRubricKey(rubric);
          const approvalState = rubricApprovalState[rubricKey] || 'pending';
          const isExpanded = Boolean(expandedKeys[rubricKey]);
          const confidence = rubric.confidenceScore ?? rubric.matchScore ?? rubric.explainability?.confidenceScore ?? rubric.enterpriseConfidenceScore;
          const isAiConcept = isAiClinicalConceptOnly(rubric);
          const score01 = normalizeConfidence01(confidence);
          const matchPct = score01 != null ? Math.round(score01 * 100) : null;
          const hint = humanHint(rubric);
          const details = technicalDetails(rubric);

          return (
            <React.Fragment key={`${keyPrefix}-${rubricKey}`}>
              <tr>
                <td>
                  {showExplainability && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      onClick={() => toggleExpanded(rubricKey)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  )}
                </td>
                <td>
                  <div className="d-flex align-items-start gap-2 flex-wrap">
                    <div className="ac-rubric-name">{formatRubricTitle(rubric.subSectionName)}</div>
                    {isAiConcept && (
                      <Badge color="secondary" pill>
                        AI Clinical Concept
                      </Badge>
                    )}
                    {isAiConcept && (
                      <Badge color="light" pill className="text-muted border">
                        Not in repertory
                      </Badge>
                    )}
                    {rubric.isAiSuggested && !isAiConcept && (
                      <Badge color="warning" pill className="text-dark">
                        {String(rubric.matchSource || '').toLowerCase() === 'aireconciledfuzzy'
                          ? 'Approximate match'
                          : 'AI suggested'}
                      </Badge>
                    )}
                    {showExplainability && (
                      <AudioCaseConfidenceBadge
                        score={confidence}
                        tier={rubric.rubricTier || rubric.explainability?.rubricTier}
                      />
                    )}
                    {showExplainability && rubric.repertorySources?.length > 0 && (
                      <Badge color="info" pill className="text-dark">
                        {rubric.primaryRepertorySource || rubric.repertorySources[0]}
                      </Badge>
                    )}
                  </div>
                  {hint && <div className="ac-rubric-hint">{hint}</div>}
                  {details.length > 0 && (
                    <details className="ac-rubric-why">
                      <summary>Why this match?</summary>
                      <div className="ac-rubric-why-body">
                        {details.map((line, idx) => (
                          <div key={`${rubricKey}-detail-${idx}`}>{line}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </td>
                <td className="ac-match-cell">
                  {isAiConcept || matchPct == null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <>
                      <div className="ac-match-pct">
                        {matchPct}
                        %
                      </div>
                      <div className="ac-match-bar" aria-hidden="true">
                        <span style={{ width: `${matchPct}%` }} />
                      </div>
                    </>
                  )}
                </td>
                <td>
                  <span className="ac-grade-pill">
                    {rubric.suggestedIntensityNo ?? defaultIntensity.intensityNo}
                  </span>
                </td>
                <td className="text-end">
                  <AudioCaseRubricApprovalBar
                    rubricKey={rubricKey}
                    approvalState={approvalState}
                    requireManualApproval={requireManualApproval || isAiConcept}
                    disabled={repertorizationCount >= maxRubrics || approvalState === 'rejected' || isAiConcept}
                    onApprove={() => !isAiConcept && onApplyRubric(rubric, defaultIntensity)}
                    onReject={onRejectRubric}
                  />
                </td>
              </tr>
              {showExplainability && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <Collapse isOpen={isExpanded}>
                      <AudioCaseRubricExplainabilityPanel rubric={rubric} />
                    </Collapse>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </Table>
  );

  return (
    <Card className={`border mb-0${embedded ? ' ac-rubrics-embedded border-0 shadow-none' : ''}`}>
      {!embedded && (
        <CardHeader className="py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h6 className="mb-0">Suggested rubrics</h6>
            {requireManualApproval && (
              <div className="ac-rubric-header-progress mt-1">
                <small className="text-muted">
                  Review and approve before repertorization (AI Engine
                  {' '}
                  {engineVersion}
                  ).
                  {' '}
                  {approvedCount}
                  /
                  {rubrics.length}
                  {' '}
                  approved
                </small>
                <div className="ac-rubric-progress-track" aria-hidden="true">
                  <div className="ac-rubric-progress-fill" style={{ width: `${approvalPct}%` }} />
                </div>
              </div>
            )}
          </div>
          {!requireManualApproval && onApplyAll && (
            <button type="button" className="btn btn-sm ac-btn-secondary" onClick={onApplyAll}>
              Add all to repertorization
            </button>
          )}
          {requireManualApproval && onApplyAll && pendingApprovals > 0 && (
            <button type="button" className="btn btn-sm ac-btn-approve" onClick={onApplyAll}>
              Approve all remaining
            </button>
          )}
        </CardHeader>
      )}
      {embedded && (requireManualApproval || (!requireManualApproval && onApplyAll)) && (
        <div className="ac-rubrics-embedded-toolbar">
          {requireManualApproval ? (
            <>
              <div className="ac-rubric-header-progress">
                <small className="text-muted">
                  AI Engine
                  {' '}
                  {engineVersion}
                  {' · '}
                  {approvedCount}
                  /
                  {rubrics.length}
                  {' '}
                  approved
                </small>
                <div className="ac-rubric-progress-track" aria-hidden="true">
                  <div className="ac-rubric-progress-fill" style={{ width: `${approvalPct}%` }} />
                </div>
              </div>
              {onApplyAll && pendingApprovals > 0 && (
                <button type="button" className="btn btn-sm ac-btn-approve" onClick={onApplyAll}>
                  Approve All
                </button>
              )}
            </>
          ) : (
            <button type="button" className="btn btn-sm ac-btn-secondary" onClick={onApplyAll}>
              Add all
            </button>
          )}
        </div>
      )}
      <CardBody className="p-0">
        {repertoryRubrics.length > 0 && (
          <>
            <div className="ac-section-label">
              Repertory matches
              <span className="badge bg-light text-muted border ms-1">{repertoryRubrics.length}</span>
            </div>
            <div className="table-responsive px-1">
              {renderTable(repertoryRubrics, 'db-rubric')}
            </div>
          </>
        )}

        {aiConceptRubrics.length > 0 && (
          <>
            <div className="ac-section-label">
              AI clinical concepts
              <span className="badge bg-light text-muted border ms-1">{aiConceptRubrics.length}</span>
            </div>
            <div className="px-3 pb-1 small text-muted">
              Normalized clinical concepts only — not repertory rubrics, cannot be repertorized directly.
            </div>
            <div className="table-responsive px-1">
              {renderTable(aiConceptRubrics, 'ai-concept')}
            </div>
          </>
        )}

        {tierSections.map((section) => (
          <React.Fragment key={section.key}>
            <div className="ac-section-label">{section.label}</div>
            <div className="table-responsive px-1">
              {renderTable(section.items, `ai-${section.key}`)}
            </div>
          </React.Fragment>
        ))}

        <div className="ac-rubric-footer">
          <span>
            Repertorization
            {' '}
            {repertorizationCount}
            /
            {maxRubrics}
          </span>
          <span>
            {rubrics.length}
            {' '}
            suggested
          </span>
        </div>
      </CardBody>
    </Card>
  );
};

export default AudioCaseRubricSuggestions;
