import React, { useState } from 'react';
import { 
  User, 
  Brain, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';

export function TraceViewer({ steps = [] }) {
  const [expandedSteps, setExpandedSteps] = useState({});

  const toggleExpand = (stepNum) => {
    setExpandedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  if (!steps || steps.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        No execution trace data available for this run.
      </div>
    );
  }

  const renderIcon = (type) => {
    switch (type) {
      case 'user_input':
        return <div className="trace-icon-box icon-user"><User size={18} /></div>;
      case 'agent_thought':
        return <div className="trace-icon-box icon-agent"><Brain size={18} /></div>;
      case 'tool_call':
        return <div className="trace-icon-box icon-tool"><Wrench size={18} /></div>;
      case 'tool_result':
        return <div className="trace-icon-box icon-result"><CheckCircle2 size={18} /></div>;
      case 'error':
        return <div className="trace-icon-box icon-error"><AlertTriangle size={18} /></div>;
      case 'final_response':
      default:
        return <div className="trace-icon-box icon-user" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-pass)', borderColor: 'var(--color-pass)' }}><MessageSquare size={18} /></div>;
    }
  };

  const getStepTitle = (step) => {
    switch (step.step_type) {
      case 'user_input':
        return 'USER REQUEST';
      case 'agent_thought':
        return 'AGENT REASONING';
      case 'tool_call':
        return `TOOL CALL: ${step.tool_name}`;
      case 'tool_result':
        return `TOOL RESULT: ${step.tool_name}`;
      case 'error':
        return 'EXECUTION ERROR / POLICY ALERT';
      case 'final_response':
        return 'FINAL AGENT RESPONSE';
      default:
        return step.step_type.toUpperCase();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={18} color="var(--accent-cyan)" /> Visual Execution Trace ({steps.length} Steps)
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Click any step to inspect raw payload JSON
        </span>
      </div>

      <div className="trace-timeline">
        {steps.map((step, idx) => {
          const isExpanded = expandedSteps[step.step_number] !== false; // expanded by default
          const stepTitle = getStepTitle(step);

          return (
            <div key={step.id || idx} className="trace-node">
              <div className="trace-line"></div>
              {renderIcon(step.step_type)}

              <div className="trace-body">
                <div 
                  className="trace-header" 
                  onClick={() => toggleExpand(step.step_number)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                    <span className="trace-title">{stepTitle}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: '#161e2e', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      Step #{step.step_number}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Clock size={13} /> {step.latency_ms || 0}ms
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {step.content && (
                      <div style={{ fontSize: '0.85rem', color: step.step_type === 'error' ? 'var(--color-fail)' : 'var(--text-main)', lineHeight: '1.5' }}>
                        {step.content}
                      </div>
                    )}

                    {step.tool_arguments && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-cyan)', marginBottom: '0.2rem' }}>
                          INPUT ARGUMENTS
                        </div>
                        <pre className="code-block">
                          {typeof step.tool_arguments === 'string' ? step.tool_arguments : JSON.stringify(step.tool_arguments, null, 2)}
                        </pre>
                      </div>
                    )}

                    {step.tool_output && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-pass)', marginBottom: '0.2rem' }}>
                          TOOL EXECUTION OUTPUT
                        </div>
                        <pre className="code-block" style={{ color: '#93c5fd' }}>
                          {typeof step.tool_output === 'string' ? step.tool_output : JSON.stringify(step.tool_output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
