import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart2, 
  TrendingUp,
  Award,
  Zap,
  Printer,
  Info
} from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';
import { MetricBadge } from '../components/MetricBadge';
import { MetricCard } from '../components/MetricCard';

export function ReliabilityReportPage({ selectedRunId }) {
  const [reportRun, setReportRun] = useState(null);
  const [runsList, setRunsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [selectedRunId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const allRuns = await agentlabApi.getEvaluations();
      setRunsList(allRuns);

      let targetId = selectedRunId || (allRuns.length > 0 ? allRuns[0].id : null);
      if (targetId) {
        const detail = await agentlabApi.getEvaluation(targetId);
        setReportRun(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generating AgentLab Reliability Report...</div>;
  }

  if (!reportRun) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No evaluation run available to generate report.</div>;
  }

  const results = reportRun.results || [];

  // Group by Category
  const categoryStats = {};
  results.forEach(r => {
    const cat = r.test_case?.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, passed: 0, sumScore: 0 };
    }
    categoryStats[cat].total += 1;
    if (r.passed) categoryStats[cat].passed += 1;
    categoryStats[cat].sumScore += r.score;
  });

  const failureTaxonomy = {};
  results.filter(r => !r.passed).forEach(r => {
    const cause = r.failure_cause || 'UNSPECIFIED_FAILURE';
    failureTaxonomy[cause] = (failureTaxonomy[cause] || 0) + 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Printable / Viewable Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
              AgentLab Reliability & Evaluation Report
            </h2>
            <span className="badge badge-purple">Run #{reportRun.id}</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Agent: <strong>{reportRun.agent_name}</strong> • Mode: {reportRun.mode} • Generated on {reportRun.created_at?.substring(0, 10)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className="input-control"
            value={reportRun.id}
            onChange={e => loadReport(Number(e.target.value))}
          >
            {runsList.map(r => (
              <option key={r.id} value={r.id}>
                Run #{r.id} — Score: {r.overall_score}% ({r.agent_name})
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Hero Score Box */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0d1424, #121c33)',
        border: '1px solid var(--border-bright)',
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2rem',
        padding: '2rem'
      }}>
        {/* Score dial indicator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid var(--border-color)',
          paddingRight: '2rem'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            AGENTLAB RELIABILITY SCORE
          </span>

          <div style={{ fontSize: '3.5rem', fontWeight: '900', color: reportRun.overall_score >= 80 ? 'var(--color-pass)' : 'var(--color-fail)', letterSpacing: '-0.04em', lineHeight: '1' }}>
            {reportRun.overall_score}%
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <MetricBadge score={reportRun.overall_score} passed={reportRun.overall_score >= 80} />
          </div>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.75rem', textAlign: 'center' }}>
            Calculated via 7-Dimension Pre-Deployment Evaluation Model
          </span>
        </div>

        {/* Methodology & Score Formula Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Info size={18} color="var(--accent-cyan)" /> Evaluation Methodology & Weighting
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            The AgentLab Reliability Score evaluates multi-step agent behavior across 7 core quantitative dimensions. It penalizes unchecked policy bypasses, hallucinated figures, missing parameter tool calls, and step inefficiency.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <div>• Task Success: <strong>30%</strong></div>
            <div>• Safety / Policy: <strong>20%</strong></div>
            <div>• Tool Selection: <strong>15%</strong></div>
            <div>• Instruction: <strong>15%</strong></div>
            <div>• Tool Arguments: <strong>10%</strong></div>
            <div>• Groundedness: <strong>5%</strong></div>
            <div>• Step Efficiency: <strong>5%</strong></div>
          </div>
        </div>
      </div>

      {/* 7 Metric Dimensions Breakdown */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={20} color="var(--accent-cyan)" /> Performance Across 7 Evaluation Dimensions
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <MetricCard title="Task Success" value={`${reportRun.task_success_rate}%`} subtitle="Goal completion" icon={CheckCircle2} color="cyan" />
          <MetricCard title="Safety / Policy" value={`${reportRun.safety_score}%`} subtitle="Policy compliance" icon={ShieldAlert} color={reportRun.safety_score >= 80 ? 'emerald' : 'rose'} />
          <MetricCard title="Tool Selection" value={`${reportRun.tool_accuracy_score}%`} subtitle="Tool accuracy" icon={Zap} color="indigo" />
          <MetricCard title="Instruction Following" value={`${reportRun.instruction_score}%`} subtitle="Constraint adherence" icon={Award} color="purple" />
          <MetricCard title="Tool Arguments" value={`${reportRun.tool_accuracy_score}%`} subtitle="Schema validity" icon={CheckCircle2} color="cyan" />
          <MetricCard title="Groundedness" value={`${reportRun.groundedness_score}%`} subtitle="Hallucination check" icon={CheckCircle2} color="emerald" />
          <MetricCard title="Efficiency Score" value={`${reportRun.efficiency_score}%`} subtitle="Step count ratio" icon={TrendingUp} color="amber" />
          <MetricCard title="Avg Latency / Step" value={`${reportRun.avg_latency}s / ${reportRun.avg_steps}`} subtitle="Telemetry speed" icon={TrendingUp} color="indigo" />
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem' }}>
          Category-wise Performance Breakdown
        </h3>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Test Count</th>
                  <th>Passed</th>
                  <th>Failed</th>
                  <th>Pass Rate</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryStats).map(([cat, stat]) => {
                  const pRate = roundVal((stat.passed / stat.total) * 100);
                  const avgSc = roundVal(stat.sumScore / stat.total);
                  return (
                    <tr key={cat}>
                      <td><strong>{cat}</strong></td>
                      <td>{stat.total}</td>
                      <td style={{ color: 'var(--color-pass)' }}>{stat.passed}</td>
                      <td style={{ color: stat.total - stat.passed > 0 ? 'var(--color-fail)' : 'var(--text-muted)' }}>{stat.total - stat.passed}</td>
                      <td><MetricBadge score={pRate} /></td>
                      <td style={{ fontWeight: 'bold' }}>{avgSc}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Failure Taxonomy Distribution */}
      {Object.keys(failureTaxonomy).length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-fail)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> Identified Root Cause Failure Taxonomy
          </h3>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(failureTaxonomy).map(([cause, count]) => (
              <div key={cause} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#160d16', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fca5a5' }}>
                  {cause}
                </span>
                <span className="badge badge-fail">
                  {count} Test Case{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Engineering Recommendations */}
      <div className="card" style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
          AgentLab Engineering Recommendations
        </h3>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#e0f2fe', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>Add explicit identity verification constraints to system prompt: <em>"Always verify customer identity via get_customer before executing notifications."</em></li>
          <li>Instruct agent to query missing parameters explicitly instead of making premature tool calls with empty inputs.</li>
          <li>Verify return policy windows in system instructions to gracefully decline expired order returns.</li>
        </ul>
      </div>
    </div>
  );
}

function roundVal(v) {
  return Math.round(v * 10) / 10;
}
