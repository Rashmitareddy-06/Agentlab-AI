import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { AgentsPage } from './pages/AgentsPage';
import { ToolsPage } from './pages/ToolsPage';
import { TestSuitesPage } from './pages/TestSuitesPage';
import { EvaluationRunPage } from './pages/EvaluationRunPage';
import { ReliabilityReportPage } from './pages/ReliabilityReportPage';
import { agentlabApi } from './api/agentlabApi';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMockMode, setIsMockMode] = useState(true);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState(null);

  useEffect(() => {
    // Check initial mode from backend dashboard API
    agentlabApi.getDashboard().then(data => {
      setIsMockMode(data.stats?.is_mock_mode ?? true);
      if (data.latest_runs && data.latest_runs.length > 0) {
        setSelectedRunId(data.latest_runs[0].id);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleOpenCreateAgent = () => {
    setActiveTab('agents');
    setIsCreateAgentOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setActiveTab} 
            onOpenCreateAgent={handleOpenCreateAgent} 
            setSelectedRunId={setSelectedRunId}
          />
        );
      case 'agents':
        return (
          <AgentsPage 
            isCreateOpen={isCreateAgentOpen} 
            setIsCreateOpen={setIsCreateAgentOpen} 
          />
        );
      case 'tools':
        return <ToolsPage />;
      case 'suites':
        return (
          <TestSuitesPage 
            onNavigate={setActiveTab} 
            setSelectedRunId={setSelectedRunId} 
          />
        );
      case 'evaluations':
        return (
          <EvaluationRunPage 
            selectedRunId={selectedRunId} 
            setSelectedRunId={setSelectedRunId}
            onNavigate={setActiveTab}
          />
        );
      case 'report':
        return <ReliabilityReportPage selectedRunId={selectedRunId} />;
      default:
        return <Dashboard onNavigate={setActiveTab} onOpenCreateAgent={handleOpenCreateAgent} setSelectedRunId={setSelectedRunId} />;
    }
  };

  return (
    <div className="app-container">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMockMode={isMockMode} 
        onOpenCreateAgent={handleOpenCreateAgent}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
