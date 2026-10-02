const API_BASE = '/api';

export const agentlabApi = {
  // Dashboard
  async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Agents
  async getAgents() {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  async getAgent(id) {
    const res = await fetch(`${API_BASE}/agents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch agent details');
    return res.json();
  },

  async createAgent(agentData) {
    const res = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    if (!res.ok) throw new Error('Failed to create agent');
    return res.json();
  },

  async updateAgent(id, agentData) {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    if (!res.ok) throw new Error('Failed to update agent');
    return res.json();
  },

  async deleteAgent(id) {
    const res = await fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete agent');
    return res.json();
  },

  // Tools
  async getTools() {
    const res = await fetch(`${API_BASE}/tools`);
    if (!res.ok) throw new Error('Failed to fetch tool registry');
    return res.json();
  },

  // Test Suites
  async getTestSuites() {
    const res = await fetch(`${API_BASE}/test-suites`);
    if (!res.ok) throw new Error('Failed to fetch test suites');
    return res.json();
  },

  async getTestSuite(id) {
    const res = await fetch(`${API_BASE}/test-suites/${id}`);
    if (!res.ok) throw new Error('Failed to fetch test suite details');
    return res.json();
  },

  async createTestSuite(suiteData) {
    const res = await fetch(`${API_BASE}/test-suites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suiteData)
    });
    if (!res.ok) throw new Error('Failed to create test suite');
    return res.json();
  },

  async addTestCase(suiteId, caseData) {
    const res = await fetch(`${API_BASE}/test-suites/${suiteId}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    if (!res.ok) throw new Error('Failed to add test case');
    return res.json();
  },

  async generateTestCases(suiteId, count = 10) {
    const res = await fetch(`${API_BASE}/test-suites/${suiteId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });
    if (!res.ok) throw new Error('Failed to generate test cases');
    return res.json();
  },

  async runEvaluation(suiteId) {
    const res = await fetch(`${API_BASE}/test-suites/${suiteId}/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to trigger evaluation run');
    return res.json();
  },

  // Evaluations
  async getEvaluations() {
    const res = await fetch(`${API_BASE}/evaluations`);
    if (!res.ok) throw new Error('Failed to fetch evaluation runs');
    return res.json();
  },

  async getEvaluation(runId) {
    const res = await fetch(`${API_BASE}/evaluations/${runId}`);
    if (!res.ok) throw new Error('Failed to fetch evaluation run');
    return res.json();
  },

  async compareEvaluations(baseRunId, currentRunId) {
    const res = await fetch(`${API_BASE}/evaluations/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_run_id: baseRunId, current_run_id: currentRunId })
    });
    if (!res.ok) throw new Error('Failed to compare evaluation runs');
    return res.json();
  }
};
