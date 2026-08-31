import React from 'react';
import { Badge } from 'reactstrap';

/**
 * Internal confidence is 0–1. EnterpriseConfidenceScore may arrive as 0–100.
 * Normalize once here; never multiply an already-percent value by 100 again.
 */
export const normalizeConfidence01 = (score) => {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return null;
  if (numeric > 1.5) return Math.min(1, Math.max(0, numeric / 100));
  return Math.min(1, Math.max(0, numeric));
};

const resolveColor = (score01) => {
  if (score01 == null) return 'secondary';
  if (score01 >= 0.85) return 'success';
  if (score01 >= 0.70) return 'primary';
  if (score01 >= 0.50) return 'warning';
  return 'secondary';
};

const AudioCaseConfidenceBadge = ({ score, tier }) => {
  const score01 = normalizeConfidence01(score);
  const label = score01 != null ? `${Math.round(score01 * 100)}%` : '—';

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <Badge color={resolveColor(score01)} pill>
        {label}
        {' '}
        confidence
      </Badge>
      {tier && (
        <Badge color="light" className="text-dark" pill>
          {tier}
        </Badge>
      )}
    </div>
  );
};

export default AudioCaseConfidenceBadge;
