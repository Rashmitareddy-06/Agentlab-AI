import React from 'react';
import { 
  FlaskConical, 
  Bot, 
  Wrench, 
  FileCheck2, 
  PlayCircle, 
  BarChart3, 
  Zap,
  Activity
} from 'lucide-react';

export function Navigation({ activeTab, setActiveTab, isMockMode, onOpenCreateAgent }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'suites', label: 'Test Suites', icon: FileCheck2 },
    { id: 'evaluations', label: 'Live Evaluation', icon: PlayCircle },
    { id: 'report', label: 'Reliability Report', icon: FlaskConical },
  ];

  return (
    <header style={{
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <FlaskConical size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#fff' }}>
              Agent<span style={{ color: 'var(--accent-cyan)' }}>Lab</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              AI AGENT EVALUATION PLATFORM
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '0.4rem' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-subtle)' : 'transparent',
                  border: isActive ? '1px solid var(--border-bright)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--accent-cyan)' : 'inherit'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Live / Mock Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isMockMode ? (
            <div 
              className="badge badge-warn" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              title="Running in Deterministic Mock Simulation Mode. Add OPENAI_API_KEY to backend .env to enable Live LLM reasoning."
            >
              <Zap size={13} />
              MODE: MOCK SIMULATION
            </div>
          ) : (
            <div 
              className="badge badge-pass" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)' }}
              title="Connected to Live OpenAI-compatible LLM Execution Layer"
            >
              <Activity size={13} />
              MODE: LIVE LLM ENGINE
            </div>
          )}

          <button className="btn btn-primary" onClick={onOpenCreateAgent}>
            + Create Agent
          </button>
        </div>
      </div>
    </header>
  );
}
