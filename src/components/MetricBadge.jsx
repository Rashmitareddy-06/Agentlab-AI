import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export function MetricBadge({ score, passed, label }) {
  if (passed !== undefined) {
    if (passed) {
      return (
        <span className="badge badge-pass">
          <CheckCircle2 size={13} /> {label || 'PASSED'}
        </span>
      );
    } else {
      return (
        <span className="badge badge-fail">
          <XCircle size={13} /> {label || 'FAILED'}
        </span>
      );
    }
  }

  const numScore = parseFloat(score || 0);
  let cls = 'badge-pass';
  let Icon = CheckCircle2;

  if (numScore < 70) {
    cls = 'badge-fail';
    Icon = XCircle;
  } else if (numScore < 85) {
    cls = 'badge-warn';
    Icon = AlertTriangle;
  }

  return (
    <span className={`badge ${cls}`}>
      <Icon size={13} />
      {label ? `${label}: ` : ''}{numScore}%
    </span>
  );
}
