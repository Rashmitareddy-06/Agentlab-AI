import React, { useState, useEffect } from 'react';
import { Wrench, Code2, ShieldCheck, Database } from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';

export function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const res = await agentlabApi.getTools();
      setTools(res);
    } catch (err) {
      alert('Error fetching tools: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Tool Registry...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Wrench size={24} color="var(--accent-cyan)" /> Tool Registry & Schemas
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Registered simulated tools available for agent function-calling loops during test case execution.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {tools.map(tool => (
          <div key={tool.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>{tool.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Handler: {tool.handler_name}
                  </span>
                </div>
              </div>
              <span className="badge badge-info">Simulated Tool</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {tool.description}
            </p>

            {/* Input Schema */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={14} /> INPUT PARAMETER SCHEMA
              </div>
              <pre className="code-block">
                {JSON.stringify(tool.input_schema, null, 2)}
              </pre>
            </div>

            {/* Output Schema */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-pass)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Database size={14} /> OUTPUT RESPONSE SCHEMA
              </div>
              <pre className="code-block" style={{ color: '#93c5fd' }}>
                {JSON.stringify(tool.output_schema, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
