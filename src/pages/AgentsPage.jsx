import React, { useState, useEffect } from 'react';
import { Bot, Wrench, Trash2, Edit3, Plus, Save, Sliders } from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';

export function AgentsPage({ isCreateOpen, setIsCreateOpen }) {
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.2);
  const [maxSteps, setMaxSteps] = useState(5);
  const [selectedToolIds, setSelectedToolIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aList, tList] = await Promise.all([
        agentlabApi.getAgents(),
        agentlabApi.getTools()
      ]);
      setAgents(aList);
      setTools(tList);
      if (tList.length > 0) {
        setSelectedToolIds(tList.map(t => t.id)); // Select all tools by default
      }
    } catch (err) {
      alert('Error loading agents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingAgent(null);
    setName('');
    setDescription('');
    setSystemInstructions(
      "You are an automated Customer Support Resolution Agent for an e-commerce platform. " +
      "Your job is to assist users with order inquiries, return processing, inventory checks, and customer notifications. " +
      "Always call search_order to verify ground truth before issuing refunds."
    );
    setModel('gpt-4o-mini');
    setTemperature(0.2);
    setMaxSteps(5);
    setSelectedToolIds(tools.map(t => t.id));
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setSystemInstructions(agent.system_instructions || '');
    setModel(agent.model || 'gpt-4o-mini');
    setTemperature(agent.temperature || 0.2);
    setMaxSteps(agent.max_steps || 5);
    setSelectedToolIds(agent.tools?.map(t => t.id) || []);
    setIsCreateOpen(true);
  };

  const toggleTool = (toolId) => {
    if (selectedToolIds.includes(toolId)) {
      setSelectedToolIds(selectedToolIds.filter(id => id !== toolId));
    } else {
      setSelectedToolIds([...selectedToolIds, toolId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Agent Name is required.');

    const payload = {
      name,
      description,
      system_instructions: systemInstructions,
      model,
      temperature: parseFloat(temperature),
      max_steps: parseInt(maxSteps, 10),
      tool_ids: selectedToolIds
    };

    try {
      if (editingAgent) {
        await agentlabApi.updateAgent(editingAgent.id, payload);
      } else {
        await agentlabApi.createAgent(payload);
      }
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to save agent: ' + err.message);
    }
  };

  const handleDelete = async (agentId) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await agentlabApi.deleteAgent(agentId);
      loadData();
    } catch (err) {
      alert('Failed to delete agent: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Agent Configurations...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={24} color="var(--accent-indigo)" /> AI Agent Configurations
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure system instructions, LLM parameters, and attached tools for systematic testing.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={16} /> Create Agent
        </button>
      </div>

      {/* Agents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {agents.map(agent => (
          <div key={agent.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{agent.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {agent.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => handleOpenEdit(agent)}>
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }} onClick={() => handleDelete(agent.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Hyperparameters Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-info">Model: {agent.model}</span>
              <span className="badge badge-purple">Temp: {agent.temperature}</span>
              <span className="badge badge-warn">Max Steps: {agent.max_steps}</span>
            </div>

            {/* System Instructions */}
            <div style={{ background: '#0a0e18', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                SYSTEM INSTRUCTIONS
              </div>
              <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontFamily: 'var(--font-mono)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {agent.system_instructions}
              </p>
            </div>

            {/* Tools list */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                AVAILABLE TOOLS ({agent.tools?.length || 0})
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {agent.tools?.map(t => (
                  <span key={t.id} style={{ fontSize: '0.75rem', background: '#172033', color: 'var(--accent-cyan)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <Wrench size={11} style={{ marginRight: '4px' }} />
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit Agent */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {editingAgent ? 'Edit Agent Configuration' : 'Create New AI Agent'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>AGENT NAME *</label>
                <input className="input-control" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer Support Resolution Agent" required />
              </div>

              <div className="input-group">
                <label>DESCRIPTION</label>
                <input className="input-control" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary of agent scope" />
              </div>

              <div className="input-group">
                <label>SYSTEM INSTRUCTIONS (PROMPT) *</label>
                <textarea 
                  className="input-control" 
                  value={systemInstructions} 
                  onChange={e => setSystemInstructions(e.target.value)} 
                  rows={5}
                  placeholder="Define operational rules, policy constraints, and step-by-step procedures..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>MODEL SELECTION</label>
                  <select className="input-control" value={model} onChange={e => setModel(e.target.value)}>
                    <option value="gpt-4o-mini">gpt-4o-mini (Recommended)</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    <option value="mock-agent-v1">Mock Engine Agent v1</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>TEMPERATURE ({temperature})</label>
                  <input type="range" min="0.0" max="1.0" step="0.05" value={temperature} onChange={e => setTemperature(e.target.value)} style={{ width: '100%', marginTop: '0.4rem' }} />
                </div>

                <div className="input-group">
                  <label>MAXIMUM STEPS</label>
                  <input className="input-control" type="number" min="1" max="15" value={maxSteps} onChange={e => setMaxSteps(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <label>ATTACHED TOOLS ({selectedToolIds.length} Selected)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {tools.map(tool => (
                    <label 
                      key={tool.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.6rem', 
                        background: selectedToolIds.includes(tool.id) ? 'rgba(99, 102, 241, 0.15)' : '#0d131f', 
                        border: selectedToolIds.includes(tool.id) ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)', 
                        padding: '0.5rem 0.75rem', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: selectedToolIds.includes(tool.id) ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedToolIds.includes(tool.id)} 
                        onChange={() => toggleTool(tool.id)} 
                      />
                      <div>
                        <strong>{tool.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{tool.description.substring(0, 45)}...</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
