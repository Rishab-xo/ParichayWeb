import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Core Pages & Workflows
import Home from './pages/Home';
import WorkspacePage from './pages/WorkspacePage';
import JudgmentsPage from './pages/JudgmentsPage';
import ActsPage from './pages/ActsPage';
import { IntakeOrchestrator } from './components/IntakeOrchestrator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="judgments" element={<JudgmentsPage />} />
          <Route path="acts" element={<ActsPage />} />
          <Route path="arguments" element={<Navigate to="/workspaces?tab=free-arguments" replace />} />
          <Route path="workspaces" element={<WorkspacePage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="workspaces/:workspaceId" element={<WorkspacePage />} />
          <Route path="input" element={<WorkspacePage defaultView="home" />} />
          <Route
            path="intake"
            element={
              <div className="container" style={{ padding: '40px 0' }}>
                <IntakeOrchestrator />
              </div>
            }
          />
          {/* Fallback to Workspaces */}
          <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
