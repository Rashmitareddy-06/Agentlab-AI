import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Sparkles, 
  Plus, 
  PlayCircle, 
  Wrench, 
  ListFilter,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { agentlabApi } from '../api/agentlabApi';

export function TestSuitesPage({ onNavigate, setSelectedRunId }) {
  const [suites, setSuites] = useState([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Manual Test Case modal state
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('Normal case');
  const [newUserInput, setNewUserInput] = useState('');
  const [newExpectedBehaviour, setNewExpectedBehaviour] = useState('');

  useEffect(() => {
    loadSuites();
  }, []);

  const loadSuites = async () => {
    try {
      setLoading(true);
      const res = await agentlabApi.getTestSuites();
      setSuites(res);
      if (res.length > 0 && !selectedSuiteId) {
        setSelectedSuiteId(res[0].id);
      }
    } catch (err) {
      alert('Error fetching test suites: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCases = async () => {
    if (!selectedSuiteId) return;
    try {
      setGenerating(true);
      await agentlabApi.generateTestCases(selectedSuiteId, 10);
      loadSuites();
    } catch (err) {
      alert('Failed to generate test cases: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedSuiteId) return;
    try {
      const run = await agentlabApi.runEvaluation(selectedSuiteId);
      setSelectedRunId(run.id);
      onNavigate('evaluations');
    } catch (err) {
      alert('Error running evaluation: ' + err.message);
    }
  };

  const handleAddCase = async (e) => {
    e.preventDefault();
    if (!newUserInput.trim()) return alert('User Input is required.');
    try {
      await agentlabApi.addTestCase(selectedSuiteId, {
        category: newCategory,
        user_input: newUserInput,
        expected_behaviour: newExpectedBehaviour,
        expected_tools: ["search_order"]
      });
      setIsAddCaseOpen(false);
      setNewUserInput('');
      setNewExpectedBehaviour('');
      loadSuites();
    } catch (err) {
      alert('Failed to add test case: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Test Suites...</div>;
  }

  const currentSuite = suites.find(s => s.id === selectedSuiteId) || suites[0];
  const testCases = currentSuite?.test_cases || [];

  const categories = ['ALL', ...new Set(testCases.map(tc => tc.category))];

  const filteredCases = filterCategory === 'ALL' 
    ? testCases 
    : testCases.filter(tc => tc.category === filterCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileCheck2 size={24} color="var(--accent-cyan)" /> Test Suite Library
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Systematic benchmark scenarios across 10 evaluation categories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleGenerateCases} disabled={generating}>
            <Sparkles size={16} color="var(--accent-purple)" />
            {generating ? 'Generating Scenarios...' : 'Generate AI Test Cases'}
          </button>
          
          <button className="btn btn-secondary" onClick={() => setIsAddCaseOpen(true)}>
            <Plus size={16} /> Add Test Case
          </button>

          <button className="btn btn-primary" onClick={handleRunEvaluation}>
            <PlayCircle size={16} /> Run Evaluation
          </button>
        </div>
      </div>

      {/* Suite Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        {suites.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSuiteId(s.id)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: s.id === selectedSuiteId ? '#fff' : 'var(--text-muted)',
              background: s.id === selectedSuiteId ? 'var(--bg-subtle)' : 'transparent',
              border: s.id === selectedSuiteId ? '1px solid var(--border-bright)' : '1px solid transparent'
            }}
          >
            {s.name} ({s.test_case_count || s.test_cases?.length || 0})
          </button>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <ListFilter size={14} /> FILTER CATEGORY:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: filterCategory === cat ? '#fff' : 'var(--text-muted)',
              background: filterCategory === cat ? 'var(--accent-indigo)' : '#111827',
              border: '1px solid var(--border-color)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Cases Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '90px' }}>Code</th>
                <th style={{ width: '180px' }}>Category</th>
                <th>User Scenario Prompt</th>
                <th>Expected Agent Behaviour</th>
                <th>Expected Tools</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(tc => (
                <tr key={tc.id}>
                  <td><strong>{tc.test_code}</strong></td>
                  <td>
                    <span className={`badge ${tc.category.includes('Policy') || tc.category.includes('failure') ? 'badge-fail' : 'badge-info'}`}>
                      {tc.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500' }}>"{tc.user_input}"</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tc.expected_behaviour}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {tc.expected_tools?.map(t => (
                        <span key={t} style={{ fontSize: '0.7rem', background: '#172033', color: 'var(--accent-cyan)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          {t}
                        </span>
                      ))}
                      {(!tc.expected_tools || tc.expected_tools.length === 0) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None (Clarify)</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Test Case Modal */}
      {isAddCaseOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCaseOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Add Manual Test Case
            </h3>
            <form onSubmit={handleAddCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>CATEGORY</label>
                <select className="input-control" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                  <option value="Normal case">Normal case</option>
                  <option value="Missing information">Missing information</option>
                  <option value="Ambiguous request">Ambiguous request</option>
                  <option value="Invalid input">Invalid input</option>
                  <option value="Tool failure">Tool failure</option>
                  <option value="Conflicting information">Conflicting information</option>
                  <option value="Edge case">Edge case</option>
                  <option value="Policy violation attempt">Policy violation attempt</option>
                  <option value="Multi-step task">Multi-step task</option>
                </select>
              </div>

              <div className="input-group">
                <label>USER SCENARIO PROMPT *</label>
                <textarea className="input-control" value={newUserInput} onChange={e => setNewUserInput(e.target.value)} rows={3} placeholder="Enter exact user message prompt..." required />
              </div>

              <div className="input-group">
                <label>EXPECTED AGENT BEHAVIOUR *</label>
                <textarea className="input-control" value={newExpectedBehaviour} onChange={e => setNewExpectedBehaviour(e.target.value)} rows={3} placeholder="What should the agent do or check?" required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddCaseOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Test Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
