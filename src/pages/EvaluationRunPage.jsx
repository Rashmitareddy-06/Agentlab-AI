import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle2, XCircle, Clock, Brain, RefreshCw, GitCompare } from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';
import { MetricBadge } from '../components/MetricBadge';
import { TraceViewer } from '../components/TraceViewer';
import { FailureAnalysisCard } from '../components/FailureAnalysisCard';
import { RegressionComparisonModal } from '../components/RegressionComparisonModal';

export function EvaluationRunPage({ selectedRunId, setSelectedRunId, onNavigate }) {
  const [runData, setRunData] = useState(null);
  const [runsList, setRunsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  useEffect(() => {
    fetchRunData();
  }, [selectedRunId]);

  const fetchRunData = async () => {
    try {
      setLoading(true);
      const allRuns = await agentlabApi.getEvaluations();
      setRunsList(allRuns);

      let targetId = selectedRunId;
      if (!targetId && allRuns.length > 0) {
        targetId = allRuns[0].id;
        setSelectedRunId(targetId);
      }

      if (targetId) {
        const detail = await agentlabApi.getEvaluation(targetId);
        setRunData(detail);
        if (detail.results && detail.results.length > 0) {
          setSelectedResultId(detail.results[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Evaluation Run Telemetry...</div>;
  }

  if (!runData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No evaluation run selected. Trigger an evaluation run from Dashboard or Test Suites.</div>;
  }

  const results = runData.results || [];
  const activeResult = results.find(r => r.id === selectedResultId) || results[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Run Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
              Evaluation Run #{runData.id}
            </h2>
            <MetricBadge score={runData.overall_score} />
            <span className="badge badge-purple">{runData.mode}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Agent: <strong>{runData.agent_name}</strong> • Test Suite: <strong>{runData.suite_name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className="input-control"
            value={runData.id}
            onChange={e => {
              const val = Number(e.target.value);
              setSelectedRunId(val);
            }}
            style={{ minWidth: '220px' }}
          >
            {runsList.map(r => (
              <option key={r.id} value={r.id}>
                Run #{r.id} ({r.created_at?.substring(0, 10)}) — {r.overall_score}%
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={() => setIsCompareOpen(true)}>
            <GitCompare size={16} /> Regression Compare
          </button>

          <button className="btn btn-primary" onClick={() => onNavigate('report')}>
            Reliability Report
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Score</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{runData.overall_score}%</div>
        </div>

        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Passed / Total</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-pass)' }}>
            {runData.passed_tests} / {runData.total_tests}
          </div>
        </div>

        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Success</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{runData.task_success_rate}%</div>
        </div>

        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Score</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: runData.safety_score >= 80 ? 'var(--color-pass)' : 'var(--color-fail)' }}>
            {runData.safety_score}%
          </div>
        </div>

        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Steps</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{runData.avg_steps}</div>
        </div>

        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Latency</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>{runData.avg_latency}s</div>
        </div>
      </div>

      {/* Main Execution Explorer: Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Test Case Execution Results List */}
        <div className="card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '800px', overflowY: 'auto' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Test Case Executions ({results.length})
          </h4>

          {results.map(r => {
            const isSelected = r.id === selectedResultId;
            const tc = r.test_case || {};
            return (
              <div
                key={r.id}
                onClick={() => setSelectedResultId(r.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: isSelected ? 'var(--bg-subtle)' : '#0d131f',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{tc.test_code || `TC-${r.id}`}</strong>
                    <span className={`badge ${r.passed ? 'badge-pass' : 'badge-fail'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Category: {tc.category}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: r.score >= 80 ? 'var(--color-pass)' : 'var(--color-fail)' }}>
                    {r.score}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                    {r.total_steps} steps
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Test Trace & Failure Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeResult ? (
            <>
              {/* Single Test Dimension Breakdown Header */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                        {activeResult.test_case?.test_code}: {activeResult.test_case?.category}
                      </h3>
                      <MetricBadge passed={activeResult.passed} score={activeResult.score} />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      User Request: "{activeResult.test_case?.user_input}"
                    </p>
                  </div>
                </div>

                {/* 7 Metric Pill Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: '#090d16', padding: '0.65rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem' }}>Task Success: <strong>{activeResult.task_success_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Tool Selection: <strong>{activeResult.tool_selection_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Instruction: <strong>{activeResult.instruction_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Safety Compliance: <strong>{activeResult.safety_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Tool Arguments: <strong>{activeResult.tool_arg_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Groundedness: <strong>{activeResult.groundedness_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Step Efficiency: <strong>{activeResult.efficiency_score}%</strong></div>
                  <div style={{ fontSize: '0.75rem' }}>Exec Time: <strong>{activeResult.execution_time}s</strong></div>
                </div>
              </div>

              {/* Failure Diagnosis if Failed */}
              {!activeResult.passed && (
                <FailureAnalysisCard result={activeResult} />
              )}

              {/* Step-by-Step Visual Execution Trace */}
              <div className="card">
                <TraceViewer steps={activeResult.execution_steps || []} />
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              Select a test case on the left to inspect its visual execution trace.
            </div>
          )}
        </div>
      </div>

      {/* Regression Comparison Modal */}
      <RegressionComparisonModal 
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        runs={runsList}
        currentRunId={runData.id}
      />
    </div>
  );
}
