import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterUser from './components/RegisterUser';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import GuestDashboard from './pages/GuestDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPOForm from './components/AdminPOForm';
import AdminPOList from './components/AdminPOList';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm'; // ✅ New Import
import InverterStatusChart from './components/employee/InverterStatusChart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route
          path="/reset-password/:uidb64/:token"
          element={<ResetPasswordForm />}
        />{' '}
        {/* ✅ Reset route */}
        {/* Registration */}
        <Route path="/register/admin" element={<RegisterUser role="admin" />} />
        <Route
          path="/register/employee"
          element={<RegisterUser role="employee" />}
        />
        <Route path="/register/guest" element={<RegisterUser role="guest" />} />
        {/* Admin Dashboard with Nested Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<InverterStatusChart mode="admin" />} />
          <Route path="add-po" element={<AdminPOForm />} />
          <Route path="view-pos" element={<AdminPOList />} />
        </Route>
        {/* Employee and Guest Dashboards */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guest-dashboard"
          element={
            <ProtectedRoute allowedRoles={['guest']}>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
