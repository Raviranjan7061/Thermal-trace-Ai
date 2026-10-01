import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import { SettingsPage } from './pages/Settings';
import { TeamPage } from './pages/Team';
import { FeedbackPage } from './pages/FeedbackPage';
import { AdminFeedbackPage } from './pages/AdminFeedbackPage';

// Read-Only Feature Pages & Pipeline Operations
import { LiveObservationsPage } from './pages/LiveObservations';
import { ThermalIncidentsPage } from './pages/ThermalIncidents';
import { ThermalReplayPage } from './pages/ThermalReplayPage';
import { MultiSatellitePage } from './pages/MultiSatellitePage';
import { IncidentComparisonPage } from './pages/IncidentComparisonPage';
import { DataProvenancePage } from './pages/DataProvenancePage';
import { PipelineStatusPage } from './pages/PipelineStatus';

import { PremiumAccessRequired } from './components/Subscription/PremiumAccessRequired';
import { apiService } from './services/api';

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
    if (userRole === 'analyst') return <Navigate to="/analyst" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

interface PremiumRouteGuardProps {
  children: React.ReactNode;
  featureTitle: string;
}

const PremiumRouteGuard: React.FC<PremiumRouteGuardProps> = ({ children, featureTitle }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [checking, setChecking] = React.useState(true);
  const [isPremiumActive, setIsPremiumActive] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const checkSub = async () => {
      if (!user) {
        if (isMounted) setChecking(false);
        return;
      }

      const userRole = (role || '').toLowerCase();
      if (userRole !== 'user') {
        if (isMounted) {
          setIsPremiumActive(true);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await apiService.getMySubscriptionStatus();
        if (isMounted) {
          setIsPremiumActive(res.is_premium_active);
        }
      } catch (err) {
        console.warn('Subscription check error:', err);
        if (isMounted) setIsPremiumActive(false);
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    if (!authLoading) {
      checkSub();
    }

    return () => {
      isMounted = false;
    };
  }, [user, role, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
        <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span>Verifying ThermalTrace AI subscription entitlement...</span>
      </div>
    );
  }

  const userRole = (role || '').toLowerCase();
  if (userRole === 'user' && !isPremiumActive) {
    return <PremiumAccessRequired featureTitle={featureTitle} />;
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
    const queryParamRole = new URLSearchParams(window.location.search).get('role');
    const storedIntent = sessionStorage.getItem('thermaltrace_login_intent');
    const activeWorkspace = (queryParamRole || storedIntent || '').toLowerCase();

    // If an authenticated user visits /login to authenticate into a DIFFERENT role workspace, show LoginPage
    if (activeWorkspace && activeWorkspace !== userRole && ['analyst', 'authority', 'admin', 'user'].includes(activeWorkspace)) {
      return <LoginPage />;
    }

    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'authority') return <Navigate to="/authority" replace />;
    if (userRole === 'analyst') return <Navigate to="/analyst" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-hidden select-none transition-colors duration-200">
      <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar mobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
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
                    <PremiumRouteGuard featureTitle="Verified Thermal Incidents">
                      <ThermalIncidentsPage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/replay"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="Historical Thermal Replay">
                      <ThermalReplayPage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/multi-satellite"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="Multi-Satellite Fusion & Cross-Verification">
                      <MultiSatellitePage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="Incident Comparison & Differential Analysis">
                      <IncidentComparisonPage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/provenance"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="Data Provenance & Cryptographic Traceability">
                      <DataProvenancePage />
                    </PremiumRouteGuard>
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
                    <PremiumRouteGuard featureTitle="Temporal Analysis & Multi-Day Trends">
                      <TemporalAnalysisPage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/industrial-sites"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="Industrial Thermal Profiling & Baseline Tracking">
                      <IndustrialSitesPage />
                    </PremiumRouteGuard>
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
                <ProtectedRoute allowedRoles={['user', 'analyst', 'admin']}>
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
                    <PremiumRouteGuard featureTitle="Advanced Thermal Analytics & Forecasting">
                      <AnalyticsPage />
                    </PremiumRouteGuard>
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
                    <PremiumRouteGuard featureTitle="AI Model Performance & Drift Analytics">
                      <ModelPerformancePage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/system-health"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PremiumRouteGuard featureTitle="System Health & Diagnostic Telemetry">
                      <SystemHealthPage />
                    </PremiumRouteGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/feedback"
              element={
                <ProtectedRoute allowedRoles={['user', 'analyst', 'authority', 'admin']}>
                  <AppLayout>
                    <FeedbackPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/feedback"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminFeedbackPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['user', 'analyst', 'authority', 'admin']}>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
