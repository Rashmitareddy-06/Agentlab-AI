import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';
import { MetricBadge } from './MetricBadge';

export function RegressionComparisonModal({ isOpen, onClose, runs, currentRunId }) {
  const [baseRunId, setBaseRunId] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (runs && runs.length >= 2) {
      // Pick second latest run as base default
      const defaultBase = runs.find(r => r.id !== currentRunId) || runs[0];
      if (defaultBase) {
        setBaseRunId(defaultBase.id);
      }
    }
  }, [runs, currentRunId]);

  useEffect(() => {
    if (baseRunId && currentRunId && baseRunId !== currentRunId) {
      fetchComparison();
    }
  }, [baseRunId, currentRunId]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const data = await agentlabApi.compareEvaluations(baseRunId, currentRunId);
      setComparison(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const delta = comparison?.metrics_delta || {};
  const summary = comparison?.summary || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
              Regression Comparison Analysis
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Compare reliability metrics between two evaluation iterations
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Run Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group">
            <label>BASE EVALUATION RUN (Previous)</label>
            <select 
              className="input-control" 
              value={baseRunId} 
              onChange={e => setBaseRunId(e.target.value)}
            >
              {runs.map(r => (
                <option key={r.id} value={r.id} disabled={r.id === currentRunId}>
                  Run #{r.id} ({r.created_at?.substring(0,10)}) — Score: {r.overall_score}%
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>TARGET EVALUATION RUN (Current)</label>
            <select className="input-control" value={currentRunId} disabled>
              <option value={currentRunId}>
                Run #{currentRunId} (Current Run)
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" /> Computing delta telemetry...
          </div>
        ) : comparison ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Metric Diffs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reliability Delta</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: delta.overall_score >= 0 ? 'var(--color-pass)' : 'var(--color-fail)' }}>
                  {delta.overall_score >= 0 ? `+${delta.overall_score}%` : `${delta.overall_score}%`}
                </div>
              </div>

              <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Success Delta</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: delta.task_success_rate >= 0 ? 'var(--color-pass)' : 'var(--color-fail)' }}>
                  {delta.task_success_rate >= 0 ? `+${delta.task_success_rate}%` : `${delta.task_success_rate}%`}
                </div>
              </div>

              <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Score Delta</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: delta.safety_score >= 0 ? 'var(--color-pass)' : 'var(--color-fail)' }}>
                  {delta.safety_score >= 0 ? `+${delta.safety_score}%` : `${delta.safety_score}%`}
                </div>
              </div>

              <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fixed / New Failures</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                  <span style={{ color: 'var(--color-pass)' }}>+{summary.fixed_count}</span> / <span style={{ color: 'var(--color-fail)' }}>-{summary.new_failures_count}</span>
                </div>
              </div>
            </div>

            {/* Fixed Tests */}
            {comparison.fixed_test_cases?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-pass)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> Fixed Test Scenarios ({comparison.fixed_test_cases.length})
                </h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Test Code</th>
                        <th>Category</th>
                        <th>User Input</th>
                        <th>Prev Score</th>
                        <th>Curr Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.fixed_test_cases.map(item => (
                        <tr key={item.test_case_id}>
                          <td><strong>{item.test_code}</strong></td>
                          <td><span className="badge badge-info">{item.category}</span></td>
                          <td>{item.user_input}</td>
                          <td style={{ color: 'var(--color-fail)' }}>{item.base_score}%</td>
                          <td style={{ color: 'var(--color-pass)', fontWeight: 'bold' }}>{item.current_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* New Failures */}
            {comparison.new_failures?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-fail)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <XCircle size={16} /> Newly Regressed Failures ({comparison.new_failures.length})
                </h4>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Test Code</th>
                        <th>Category</th>
                        <th>Failure Taxonomy</th>
                        <th>Score Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.new_failures.map(item => (
                        <tr key={item.test_case_id}>
                          <td><strong>{item.test_code}</strong></td>
                          <td><span className="badge badge-fail">{item.category}</span></td>
                          <td style={{ color: '#fca5a5' }}>{item.new_failure_cause}</td>
                          <td style={{ color: 'var(--color-fail)', fontWeight: 'bold' }}>{item.score_delta}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {comparison.fixed_test_cases?.length === 0 && comparison.new_failures?.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#0e1422', borderRadius: '8px' }}>
                Zero test regressions detected! Behavior remained consistent across both evaluation runs.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
