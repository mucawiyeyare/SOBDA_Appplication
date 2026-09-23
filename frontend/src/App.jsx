import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Signin from "./pages/Signin.jsx";
import Signup from "./pages/Singup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Contact from "./pages/Contact.jsx";

// Components
import PublicNavbar from "./Components/PublicNavbar.jsx";
import Footer from "./Components/Footer.jsx";
import Donors from "./Components/Donors.jsx";
import Users from "./Components/User.jsx";
import Profile from "./Components/profile.jsx";
import DashboardHome from "./Components/DashboardHome.jsx";
import Analysis from "./Components/Analysis.jsx";
import Reports from "./Components/Reports.jsx";
import ActivityLog from "./Components/ActivityLog.jsx";
import RegisterUser from "./Components/RegisterUser.jsx";
import DonorLocationPicker from "./Components/DonorLocationPicker.jsx";
import NearestDonors from "./Components/NearestDonors.jsx";
import HealthInstitutionAnalytics from "./Components/HealthInstitutionAnalytics.jsx";
import HospitalRequests from "./Components/HospitalRequests.jsx";
import DonorRequests from "./Components/DonorRequests.jsx";
import HospitalDonors from "./Components/HospitalDonors.jsx";
import HospitalDonationHistory from "./Components/HospitalDonationHistory.jsx";
import HospitalManagement from "./Components/HospitalManagement.jsx";
import DashboardMessages from "./Components/DashboardMessages.jsx";
import AdminMessageSender from "./Components/AdminMessageSender.jsx";
import PartnersManagement from "./Components/PartnersManagement.jsx";
import DoctorsManagement from "./Components/DoctorsManagement.jsx";
import AskDoctor from "./Components/AskDoctor.jsx";
import DoctorInbox from "./Components/DoctorInbox.jsx";
import Doctors from "./pages/Doctors.jsx";
import Partners from "./pages/Partners.jsx";
import DonorRegistrationModal from "./Components/DonorRegistrationModal.jsx";
import ScrollToTop from "./Components/ScrollToTop.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import MobileNotificationBanner from "./Components/MobileNotificationBanner.jsx";

function App() {
  // Read the saved login synchronously so a page refresh or deep link to a
  // dashboard page isn't bounced to /signin (and then /dashboard) on first render.
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return token && role ? { token, role } : null;
  });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsRegisterModalOpen(true);
    window.addEventListener("open-donor-register", handleOpen);
    return () => window.removeEventListener("open-donor-register", handleOpen);
  }, []);

  // Check login state when app loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  // Clear expired or invalid tokens
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthenticatedRequest = Boolean(error.config?.headers?.Authorization);

        if (error.response?.status === 401 && isAuthenticatedRequest) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          setUser(null);
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  // Auth guard
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/signin" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role))
      return <Navigate to="/dashboard/profile" replace />;
    return children;
  };

  return (
    <NotificationProvider>
      <ScrollToTop />
      {/* Heads-up Mobile Push Notification Banner (WhatsApp / Phone Top Notification) */}
      <MobileNotificationBanner />
      <Routes>
      {/* Public Routes with Navbar and Footer */}
      <Route
        path="/"
        element={
          <>
            <PublicNavbar />
            <Home />
            <Footer />
          </>
        }
      />
      <Route
        path="/about"
        element={
          <>
            <PublicNavbar />
            <About />
            <Footer />
          </>
        }
      />
      <Route
        path="/contact"
        element={
          <>
            <PublicNavbar />
            <Contact />
            <Footer />
          </>
        }
      />
      <Route
        path="/doctors"
        element={
          <>
            <PublicNavbar />
            <Doctors />
            <Footer />
          </>
        }
      />
      <Route
        path="/partners"
        element={
          <>
            <PublicNavbar />
            <Partners />
            <Footer />
          </>
        }
      />
      <Route
        path="/signin"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <>
              <PublicNavbar />
              <Signin setUser={setUser} />
              <Footer />
            </>
          )
        }
      />
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/dashboard" />
          ) : (
            <>
              <PublicNavbar />
              <Signup />
              <Footer />
            </>
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "donor", "hospital", "health_institution", "doctor"]}>
            <Dashboard setUser={setUser} />
          </ProtectedRoute>
        }
      >
        {/* Nested Routes */}
        <Route
          index
          element={
            <ProtectedRoute allowedRoles={["admin", "donor", "hospital", "health_institution", "doctor"]}>
              {user?.role === "donor" ? (
                <Navigate to="/dashboard/donor-requests" replace />
              ) : user?.role === "doctor" ? (
                <Navigate to="/dashboard/doctor-inbox" replace />
              ) : user?.role === "hospital" ? (
                <Navigate to="/dashboard/hospital-donors" replace />
              ) : (
                <DashboardHome />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="hospitals"
          element={
            <ProtectedRoute allowedRoles={["admin", "health_institution"]}>
              <HospitalManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="donors"
          element={
            <ProtectedRoute allowedRoles={["admin", "hospital", "health_institution"]}>
              <Donors />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="register-user"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RegisterUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={["donor", "hospital", "admin", "health_institution", "doctor"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="analysis"
          element={
            <ProtectedRoute allowedRoles={["admin", "health_institution"]}>
              <Analysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute allowedRoles={["health_institution", "admin"]}>
              <HealthInstitutionAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "hospital", "health_institution"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="activity"
          element={
            <ProtectedRoute allowedRoles={["admin", "health_institution"]}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />
        <Route
          path="set-location"
          element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorLocationPicker />
            </ProtectedRoute>
          }
        />
        <Route
          path="nearest-donors"
          element={
            <ProtectedRoute allowedRoles={["admin", "hospital"]}>
              <NearestDonors />
            </ProtectedRoute>
          }
        />
        <Route
          path="hospital-requests"
          element={
            <ProtectedRoute allowedRoles={["hospital", "admin"]}>
              <HospitalRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="donor-requests"
          element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <DonorRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="hospital-donors"
          element={
            <ProtectedRoute allowedRoles={["hospital", "admin", "health_institution"]}>
              <HospitalDonors />
            </ProtectedRoute>
          }
        />
        <Route
          path="hospital-history"
          element={
            <ProtectedRoute allowedRoles={["hospital", "admin"]}>
              <HospitalDonationHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="send-messages"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMessageSender />
            </ProtectedRoute>
          }
        />
        <Route
          path="partners"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PartnersManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctors"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DoctorsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="ask-doctor"
          element={
            <ProtectedRoute allowedRoles={["donor"]}>
              <AskDoctor />
            </ProtectedRoute>
          }
        />
        <Route
          path="doctor-inbox"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorInbox />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>

    {/* Global Instant Donor Registration Modal */}
    <DonorRegistrationModal
      isOpen={isRegisterModalOpen}
      onClose={() => setIsRegisterModalOpen(false)}
    />
    </NotificationProvider>
  );
}

export default App;
