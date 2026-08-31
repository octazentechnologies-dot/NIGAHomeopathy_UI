import React from 'react';
import AudioCaseConfidenceBadge from './AudioCaseConfidenceBadge';

const AudioCaseRubricExplainabilityPanel = ({ rubric }) => {
  const explainability = rubric?.explainability ?? {};
  const v6 = rubric?.v6Explainability ?? {};
  const v7 = rubric?.v7Explainability ?? {};
  const confidence = rubric?.confidenceScore ?? rubric?.matchScore ?? v7.confidence ?? v6.confidenceScore ?? explainability.confidenceScore ?? rubric?.enterpriseConfidenceScore;
  const tier = explainability.rubricTier ?? rubric?.rubricTier;

  return (
    <div className="border-top bg-light px-3 py-2 small">
      <div className="mb-2">
        <AudioCaseConfidenceBadge score={confidence} tier={tier} />
      </div>
      <div className="row g-2">
        <div className="col-md-6">
          <div className="text-muted">Patient statement</div>
          <div>{explainability.patientStatement || rubric?.matchedFrom || '—'}</div>
        </div>
        <div className="col-md-6">
          <div className="text-muted">Clinical meaning</div>
          <div>{explainability.clinicalMeaning || '—'}</div>
        </div>
        <div className="col-md-6">
          <div className="text-muted">Homeopathic meaning</div>
          <div>{explainability.homeopathicMeaning || '—'}</div>
        </div>
        <div className="col-md-6">
          <div className="text-muted">Match layer</div>
          <div>{explainability.matchLayer || rubric?.matchLayer || rubric?.matchSource || '—'}</div>
        </div>
        <div className="col-12">
          <div className="text-muted">Why suggested</div>
          <div>{v7.finalExplanation || v6.finalExplanation || explainability.whySuggested || rubric?.selectionReason || rubric?.whySuggested || '—'}</div>
        </div>
        {v6.transcriptEvidence && (
          <div className="col-md-6">
            <div className="text-muted">Transcript evidence</div>
            <div>{v6.transcriptEvidence}</div>
          </div>
        )}
        {v6.ontologyPath && (
          <div className="col-md-6">
            <div className="text-muted">Ontology path</div>
            <div>{v6.ontologyPath}</div>
          </div>
        )}
        {v6.sqlMatchPath && (
          <div className="col-md-6">
            <div className="text-muted">SQL match path</div>
            <div>{v6.sqlMatchPath}</div>
          </div>
        )}
        {v6.hierarchyPath && (
          <div className="col-md-6">
            <div className="text-muted">Hierarchy path</div>
            <div>{v6.hierarchyPath}</div>
          </div>
        )}
        {(v6.embeddingScore != null || v6.validationScore != null) && (
          <div className="col-md-6">
            <div className="text-muted">V6 scores</div>
            <div>
              {v6.embeddingScore != null && `Embedding: ${Math.round(Number(v6.embeddingScore) * 100)}%`}
              {v6.embeddingScore != null && v6.validationScore != null && ' · '}
              {v6.validationScore != null && `Validation: ${Math.round(Number(v6.validationScore))}/100`}
            </div>
          </div>
        )}
        {v7.finalExplanation && (
          <div className="col-12">
            <div className="text-muted">V7 reasoning chain</div>
            <div>{v7.finalExplanation}</div>
          </div>
        )}
        {Array.isArray(v7.vocabularyExpansion) && v7.vocabularyExpansion.length > 0 && (
          <div className="col-12">
            <div className="text-muted">Vocabulary expansion</div>
            <div>{v7.vocabularyExpansion.slice(0, 8).join(', ')}</div>
          </div>
        )}
        {Array.isArray(v6.searchStages) && v6.searchStages.length > 0 && (
          <div className="col-12">
            <div className="text-muted">Search stages</div>
            <div>{v6.searchStages.join(' → ')}</div>
          </div>
        )}
        {v7.searchStrategy && (
          <div className="col-md-6">
            <div className="text-muted">V7 search strategy</div>
            <div>{v7.searchStrategy}</div>
          </div>
        )}
        {Array.isArray(explainability.causationChain) && explainability.causationChain.length > 0 && (
          <div className="col-12">
            <div className="text-muted">Causation chain</div>
            <ul className="mb-0 ps-3">
              {explainability.causationChain.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {(explainability.reviewRequired || rubric?.requiresDoctorReview) && (
          <div className="col-12 text-warning">
            Doctor review required before adding to repertorization.
          </div>
        )}
        {(rubric?.qualityScore != null || explainability.qualityScore != null) && (
          <div className="col-md-6">
            <div className="text-muted">Quality score (V2.1)</div>
            <div>{Math.round(rubric?.qualityScore ?? explainability.qualityScore)} / 100</div>
          </div>
        )}
        {Array.isArray(explainability.validationFlags) && explainability.validationFlags.length > 0 && (
          <div className="col-md-6">
            <div className="text-muted">Validation flags</div>
            <div>{explainability.validationFlags.join(', ')}</div>
          </div>
        )}
        {(explainability.evidenceChain || rubric?.evidenceChain) && (
          <div className="col-12">
            <div className="text-muted">Evidence chain</div>
            <ul className="mb-0 ps-3">
              {(explainability.evidenceChain?.patientStatements || rubric?.evidenceChain?.patientStatements || []).map((item) => (
                <li key={`ps-${item}`}>{item}</li>
              ))}
              {(explainability.evidenceChain?.clinicalMeanings || rubric?.evidenceChain?.clinicalMeanings || []).map((item) => (
                <li key={`cm-${item}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCaseRubricExplainabilityPanel;
