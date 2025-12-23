import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

// Pages - DEMO
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TimbratureListPage from '../pages/timbrature/TimbratureListPage';
import TimbraturaFormPage from '../pages/timbrature/TimbraturaFormPage';
import DocumentiListPage from '../pages/documenti/DocumentiListPage';
import UsersListPage from '../pages/admin/UsersListPage';
import UserFormPage from '../pages/admin/UserFormPage';
import UserDetailPage from '../pages/admin/UserDetailPage';
import ImpostazioniPage from '../pages/admin/ImpostazioniAdminPage';
import QRDisplayPage from '../pages/qr/QRDisplayPage';
import QRScannerPage from '../pages/qr/QRScannerPage';
import RecentEntriesPage from '../pages/qr/RecentEntriesPage';
import ProfiloPage from '../pages/profilo/ProfiloPage';
import Layout from '../components/layout/Layout';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Caricamento...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.ruolo)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Timbrature */}
        <Route path="timbrature" element={<TimbratureListPage />} />
        <Route path="timbrature/nuova" element={<TimbraturaFormPage />} />

        {/* Documenti */}
        <Route path="documenti" element={<DocumentiListPage />} />

        {/* Dipendenti/Users Routes (Manager/Admin) */}
        <Route
          path="dipendenti"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <UsersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dipendenti/nuovo"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="dipendenti/:id"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Impostazioni */}
        <Route path="impostazioni" element={<ImpostazioniPage />} />

        {/* QR Routes (Receptionist) */}
        <Route
          path="qr/dashboard"
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
              <QRDisplayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="qr/scanner"
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
              <QRScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="qr/timbrature-recenti"
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
              <RecentEntriesPage />
            </ProtectedRoute>
          }
        />

        {/* Profilo */}
        <Route path="profilo" element={<ProfiloPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
