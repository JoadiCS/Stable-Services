import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Nav } from './components/Nav';
import { PromoBanner } from './components/PromoBanner';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Services } from './components/Services';
import { Process } from './components/Process';
import { Testimonials } from './components/Testimonials';
import { Why } from './components/Why';
import { PhotoBand } from './components/PhotoBand';
import { Coverage } from './components/Coverage';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { FloatingPhone } from './components/FloatingPhone';
import { FunnelModal } from './components/funnel/FunnelModal';
import { RepairModal } from './components/repair/RepairModal';
import { ThankYou } from './components/ThankYou';
import { ModalProvider } from './context/ModalContext';
import { ServicesProvider } from './context/ServicesContext';

import { PortalShell } from './components/portal/PortalShell';
import { ProtectedRoute } from './components/portal/ProtectedRoute';
import { LoginPage } from './components/portal/LoginPage';
import { SignupPage } from './components/portal/SignupPage';
import { ForgotPasswordPage } from './components/portal/ForgotPasswordPage';
import { DashboardPage } from './components/portal/DashboardPage';
import { RequestsPage } from './components/portal/RequestsPage';
import { NewRequestPage } from './components/portal/NewRequestPage';
import { VisitReportPage } from './components/portal/VisitReportPage';

import { AdminShell } from './components/admin/AdminShell';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { CustomersPage } from './components/admin/CustomersPage';
import { AdminRequestsPage } from './components/admin/RequestsPage';
import { SchedulePage } from './pages/admin/SchedulePage';
import { TechsPage } from './pages/admin/TechsPage';
import { CustomerEditPage } from './pages/admin/CustomerEditPage';

import { TechLoginPage } from './pages/tech/TechLoginPage';
import { TechRoutePage } from './pages/tech/TechRoutePage';
import { TechVisitPage } from './pages/tech/TechVisitPage';
import { TechGuard } from './pages/tech/TechGuard';

import { useAuthUser } from './lib/auth';

function MarketingRoute() {
  const [params] = useSearchParams();
  if (params.get('status') === 'success') {
    return <ThankYou />;
  }
  return (
    <>
      <PromoBanner />
      <Nav />
      <Hero />
      <Marquee />
      <Services />
      <Process />
      <Testimonials />
      <Why />
      <PhotoBand />
      <Coverage />
      <CTA />
      <Footer />
      <FloatingPhone />
      <FunnelModal />
      <RepairModal />
    </>
  );
}

function PortalIndexRedirect() {
  const { user, loading } = useAuthUser();
  if (loading) return null;
  return <Navigate to={user ? '/portal/dashboard' : '/portal/login'} replace />;
}

function AdminIndexRedirect() {
  const { user, loading } = useAuthUser();
  if (loading) return null;
  return <Navigate to={user ? '/admin/dashboard' : '/admin/login'} replace />;
}

function TechIndexRedirect() {
  const { user, loading } = useAuthUser();
  if (loading) return null;
  return <Navigate to={user ? '/tech/route' : '/tech/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ServicesProvider>
        <ModalProvider>
          <Routes>
            <Route path="/" element={<MarketingRoute />} />

            <Route path="/portal" element={<PortalIndexRedirect />} />
            <Route path="/portal/login" element={<LoginPage />} />
            <Route path="/portal/signup" element={<SignupPage />} />
            <Route path="/portal/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <PortalShell />
                </ProtectedRoute>
              }
            >
              <Route path="/portal/dashboard" element={<DashboardPage />} />
              <Route path="/portal/requests" element={<RequestsPage />} />
              <Route path="/portal/requests/new" element={<NewRequestPage />} />
              <Route path="/portal/visit/:visitId" element={<VisitReportPage />} />
            </Route>

            <Route path="/admin" element={<AdminIndexRedirect />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              element={
                <AdminProtectedRoute>
                  <AdminShell />
                </AdminProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/customers" element={<CustomersPage />} />
              <Route path="/admin/customers/:customerId" element={<CustomerEditPage />} />
              <Route path="/admin/schedule" element={<SchedulePage />} />
              <Route path="/admin/techs" element={<TechsPage />} />
              <Route path="/admin/requests" element={<AdminRequestsPage />} />
            </Route>

            <Route path="/tech" element={<TechIndexRedirect />} />
            <Route path="/tech/login" element={<TechLoginPage />} />
            <Route
              path="/tech/route"
              element={
                <TechGuard>
                  <TechRoutePage />
                </TechGuard>
              }
            />
            <Route
              path="/tech/visit/:visitId"
              element={
                <TechGuard>
                  <TechVisitPage />
                </TechGuard>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ModalProvider>
      </ServicesProvider>
    </BrowserRouter>
  );
}
