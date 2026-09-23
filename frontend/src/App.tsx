import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { Sidebar } from './components/Layout/Sidebar';

import { LoginPage } from './pages/Login';
import { PublicDashboardPage } from './pages/PublicDashboard';
import { AdminConsolePage } from './pages/AdminConsole';
import { UserManagementPage } from './pages/UserManagement';
import { SecurityAuditPage } from './pages/SecurityAudit';
import { AuthorityDashboardPage } from './pages/AuthorityDashboard';
import { RegulatoryAuditTrailPage } from './pages/RegulatoryAuditTrailPage';
import { DashboardPage } from './pages/Dashboard';
import { ExplorerPage } from './pages/Explorer';
import { TemporalAnalysisPage } from './pages/TemporalAnalysis';
import { IndustrialSitesPage } from './pages/IndustrialSites';
import { AnalystReviewPage } from './pages/AnalystReview';
import { WatchlistsPage } from './pages/Watchlists';
import { AlertsPage } from './pages/Alerts';
import { AnalyticsPage } from './pages/Analytics';
import { DataSourcesPage } from './pages/DataSources';
import { ModelPerformancePage } from './pages/ModelPerformance';
import { SystemHealthPage } from './pages/SystemHealth';
import { TeamPage } from './pages/Team';

// Read-Only Feature Pages & Pipeline Operations
import { LiveObservationsPage } from './pages/LiveObservations';
import { ThermalIncidentsPage } from './pages/ThermalIncidents';
import { ThermalReplayPage } from './pages/ThermalReplayPage';
import { MultiSatellitePage } from './pages/MultiSatellitePage';
import { IncidentComparisonPage } from './pages/IncidentComparisonPage';
import { DataProvenancePage } from './pages/DataProvenancePage';
import { PipelineStatusPage } from './pages/PipelineStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Validating ThermalTrace AI session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role.toLowerCase())) {
    const userRole = role.toLowerCase();
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'authority') return <Navigate to="/authority" replace />;
    if (userRole === 'user') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PublicLoginRoute: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Loading ThermalTrace AI authentication...</span>
      </div>
    );
  }

  if (user) {
    const userRole = (role || '').toLowerCase();
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'authority') return <Navigate to="/authority" replace />;
    if (userRole === 'user') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login & Signup Route */}
          <Route path="/login" element={<PublicLoginRoute />} />
          <Route path="/team" element={<TeamPage />} />

          {/* Public User Explorer Dashboard & Full Thermal Map */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'analyst', 'authority', 'admin']}>
                <AppLayout>
                  <PublicDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute allowedRoles={['user', 'analyst', 'authority', 'admin']}>
                <AppLayout>
                  <PublicDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Command Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminConsolePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin User & Role Management */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Security Audit Logs */}
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <SecurityAuditPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Data Pipeline Status */}
          <Route
            path="/pipeline-status"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <PipelineStatusPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Authority Monitoring Dashboard */}
          <Route
            path="/authority"
            element={
              <ProtectedRoute allowedRoles={['authority', 'admin']}>
                <AppLayout>
                  <AuthorityDashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Authority Regulatory Audit Trail */}
          <Route
            path="/authority/audit"
            element={
              <ProtectedRoute allowedRoles={['authority', 'admin']}>
                <AppLayout>
                  <RegulatoryAuditTrailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Analyst Operational Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyst"
            element={
              <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Additional Feature Pages */}
          <Route
            path="/observations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LiveObservationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ThermalIncidentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/replay"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ThermalReplayPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/multi-satellite"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MultiSatellitePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <IncidentComparisonPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/provenance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DataProvenancePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/explorer"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ExplorerPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/temporal"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TemporalAnalysisPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/industrial-sites"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <IndustrialSitesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlists"
            element={
              <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                <AppLayout>
                  <WatchlistsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reviews"
            element={
              <ProtectedRoute allowedRoles={['analyst', 'admin']}>
                <AppLayout>
                  <AnalystReviewPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AlertsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnalyticsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-sources"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DataSourcesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/model-performance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ModelPerformancePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/system-health"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SystemHealthPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
