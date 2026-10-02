import React from 'react';
import { ShieldAlert, AlertTriangle, Lightbulb, Target, Wrench } from 'lucide-react';

export function FailureAnalysisCard({ result }) {
  if (!result || result.passed) return null;

  const tc = result.test_case || {};

  return (
    <div style={{
      background: 'rgba(244, 63, 94, 0.05)',
      border: '1px solid rgba(244, 63, 94, 0.3)',
      borderRadius: '10px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <ShieldAlert size={22} color="var(--color-fail)" />
        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-fail)' }}>
          FAILURE DIAGNOSIS & ROOT CAUSE ANALYSIS
        </h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Expected */}
        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Target size={14} color="var(--accent-cyan)" /> EXPECTED BEHAVIOUR
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
            {tc.expected_behaviour || 'Expected task completion and policy adherence.'}
          </p>
        </div>

        {/* Actual */}
        <div style={{ background: '#0e1422', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-fail)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <AlertTriangle size={14} color="var(--color-fail)" /> ACTUAL OBSERVED BEHAVIOUR
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
            {result.failure_reason || result.final_output || 'Agent execution failed evaluation thresholds.'}
          </p>
        </div>
      </div>

      {/* Root Cause Taxonomy */}
      {result.failure_cause && (
        <div style={{ background: '#160d16', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-fail)', marginBottom: '0.3rem' }}>
            ROOT CAUSE TAXONOMY
          </div>
          <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>
            {result.failure_cause}
          </div>
        </div>
      )}

      {/* Actionable Prompt/Tool Fix */}
      {result.suggestion && (
        <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <Lightbulb size={15} color="var(--accent-cyan)" /> SUGGESTED SYSTEM INSTRUCTION IMPROVEMENT
          </div>
          <p style={{ fontSize: '0.85rem', color: '#e0f2fe', lineHeight: '1.4' }}>
            {result.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}
