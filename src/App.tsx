import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import TicketQueue from './pages/admin/TicketQueue';
import Projects from './pages/admin/Projects';
import ProjectDetail from './pages/admin/ProjectDetail';
import Developers from './pages/admin/Developers';
import Reports from './pages/admin/Reports';
import CompanyReport from './pages/admin/CompanyReport';
import HappinessIndex from './pages/admin/HappinessIndex';

// Support
import SupportDashboard from './pages/support/Dashboard';
import NewTicket from './pages/support/NewTicket';

// Developer
import DeveloperDashboard from './pages/developer/Dashboard';
import DeveloperProfile from './pages/developer/Profile';

// Shared
import TicketDetail from './pages/shared/TicketDetail';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/new-ticket" element={<NewTicket />} />
            <Route path="/admin/tickets" element={<TicketQueue />} />
            <Route path="/admin/tickets/:id" element={<TicketDetail />} />
            <Route path="/admin/projects" element={<Projects />} />
            <Route path="/admin/projects/:id" element={<ProjectDetail />} />
            <Route path="/admin/developers" element={<Developers />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/reports/company/:id" element={<CompanyReport />} />
            <Route path="/admin/happiness-index" element={<HappinessIndex />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['support']} />}>
            <Route path="/support" element={<SupportDashboard />} />
            <Route path="/support/new" element={<NewTicket />} />
            <Route path="/support/ticket/:id" element={<TicketDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['developer']} />}>
            <Route path="/developer" element={<DeveloperDashboard />} />
            <Route path="/developer/tickets/:id" element={<TicketDetail />} />
            <Route path="/developer/profile" element={<DeveloperProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
