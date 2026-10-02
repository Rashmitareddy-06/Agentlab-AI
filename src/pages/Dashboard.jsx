import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  FileCheck2, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Wrench,
  Sparkles
} from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';
import { MetricCard } from '../components/MetricCard';
import { MetricBadge } from '../components/MetricBadge';

export function Dashboard({ onNavigate, onOpenCreateAgent, setSelectedRunId, setSelectedResultId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningSuiteId, setRunningSuiteId] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await agentlabApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async (suiteId) => {
    try {
      setRunningSuiteId(suiteId);
      const run = await agentlabApi.runEvaluation(suiteId);
      setSelectedRunId(run.id);
      onNavigate('evaluations');
    } catch (err) {
      alert('Error triggering evaluation run: ' + err.message);
    } finally {
      setRunningSuiteId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>Loading Developer Dashboard...</div>
        <p style={{ fontSize: '0.85rem' }}>Retrieving telemetry data, agent benchmarks, and evaluation traces.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ border: '1px solid var(--color-fail)', color: 'var(--color-fail)' }}>
        Failed to load dashboard: {error}
      </div>
    );
  }

  const { stats, agents, latest_runs, recent_failures } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.75rem 2rem'
      }}>
        <div style={{ maxWidth: '750px' }}>
          <div className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
            <Sparkles size={12} /> Pre-Deployment Reliability Suite
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Test & Benchmark AI Agents Systematic & Deterministically
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            AgentLab executes multi-step agent tool calls against diverse operational scenarios, captures granular step telemetry, isolates root cause failures, and computes 7 reliability metrics before production deployment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={onOpenCreateAgent}>
            + Create Agent
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('suites')}>
            Manage Test Suites
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <MetricCard
          title="Active Agents"
          value={stats.total_agents}
          subtitle="Configured in registry"
          icon={Bot}
          color="indigo"
        />
        <MetricCard
          title="Test Suites"
          value={stats.total_suites}
          subtitle="Benchmark scenarios"
          icon={FileCheck2}
          color="cyan"
        />
        <MetricCard
          title="Total Evaluations"
          value={stats.total_evaluations}
          subtitle="Execution runs"
          icon={FlaskConical}
          color="purple"
        />
        <MetricCard
          title="Pass Rate"
          value={`${stats.pass_rate}%`}
          subtitle="Across test cases"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="AgentLab Score"
          value={`${stats.avg_reliability}%`}
          subtitle="Weighted reliability"
          icon={ShieldAlert}
          color={stats.avg_reliability >= 80 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Main Grid: Agents & Recent History */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Active Agents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={20} color="var(--accent-indigo)" /> Configured AI Agents ({agents.length})
            </h3>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onNavigate('agents')}>
              View All Agents <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {agents.map(agent => (
              <div key={agent.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{agent.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{agent.description}</span>
                  </div>
                  <span className="badge badge-info">{agent.model}</span>
                </div>

                <div style={{ background: '#0a0e18', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  System: {agent.system_instructions?.substring(0, 110)}...
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #161f30' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {agent.tools?.map(t => (
                      <span key={t.id} style={{ fontSize: '0.7rem', background: '#172033', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--accent-cyan)' }}>
                        <Wrench size={10} style={{ marginRight: '3px' }} />
                        {t.name}
                      </span>
                    ))}
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      // Trigger evaluation on first available test suite
                      handleRunEvaluation(1);
                    }}
                    disabled={runningSuiteId !== null}
                  >
                    <PlayCircle size={15} />
                    {runningSuiteId ? 'Executing Run...' : 'Run Evaluation'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Latest Evaluation History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--accent-cyan)" /> Evaluation History
            </h3>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onNavigate('report')}>
              Full Reports <ArrowRight size={14} />
            </button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem' }}>
            {latest_runs.map(run => (
              <div 
                key={run.id} 
                onClick={() => {
                  setSelectedRunId(run.id);
                  onNavigate('evaluations');
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                    Run #{run.id} — {run.agent_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    {run.passed_tests}/{run.total_tests} Passed • {run.mode}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <MetricBadge score={run.overall_score} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Failure Feed */}
          {recent_failures && recent_failures.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-fail)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} /> Recent Failure Root Causes
              </h4>
              {recent_failures.slice(0, 3).map(f => (
                <div key={f.id} className="card" style={{ borderLeft: '3px solid var(--color-fail)', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {f.test_case?.test_code || 'TC-FAIL'} — {f.test_case?.category}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {f.failure_cause || f.failure_reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
