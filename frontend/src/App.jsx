import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import Home from './pages/Home'
import Explore from './pages/Explore'
import PropertyDetails from './pages/PropertyDetails'
import OwnerDashboard from './pages/OwnerDashboard'
import UserDashboard from './pages/UserDashboard'
import Pricing from './pages/Pricing'
import Verification from './pages/Verification'
import AuthLogin from './pages/AuthLogin'
import AuthRegister from './pages/AuthRegister'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import Terms from './pages/Terms'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import NotificationToast from './components/NotificationToast'
import InstallPrompt from './components/InstallPrompt'

import ProtectedRoute from './components/ProtectedRoute'

const AppContent = () => {
  const location = useLocation()
  // Hide Navbar and Footer on dashboard pages to allow full control of layout
  const isDashboard = location.pathname.startsWith('/owner/dashboard') ||
    location.pathname.startsWith('/user/dashboard') ||
    location.pathname.startsWith('/admin-portal/dashboard')

  return (
    <div className={`min-h-screen flex flex-col ${isDashboard ? 'h-screen overflow-hidden' : ''}`}>
      {!isDashboard && <Navbar />}
      <main className={`flex-grow ${isDashboard ? 'h-full' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/property/:id" element={<PropertyDetails />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['landlord']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['hunter']} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-portal/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route path="/admin-portal/login" element={<AdminLogin />} />

          <Route path="/pricing" element={<Pricing />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/login" element={<AuthLogin />} />
          <Route path="/register" element={<AuthRegister />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </main>
      {!isDashboard && location.pathname !== '/explore' && !location.pathname.startsWith('/property/') && <Footer />}
      <NotificationToast />
      <InstallPrompt />
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000) // Show splash for 3 seconds

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </Router>
  )
}

export default App
