import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Menu, X, LogIn, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import { authAPI } from '../utils/api'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState(null)
  const [isStaff, setIsStaff] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchUser = async () => {
    try {
      const res = await authAPI.getCurrentUser()
      setUserType(res.data.user_type)
      const hasStaffAccess = !!(res.data.is_staff || res.data.is_superuser)
      setIsStaff(hasStaffAccess)
      // Cache staff status for optimistic UI
      if (hasStaffAccess) {
        localStorage.setItem('is_staff', 'true')
      } else {
        localStorage.removeItem('is_staff')
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error)
    }
  }

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token')
      const cachedStaff = localStorage.getItem('is_staff') === 'true'

      setIsLoggedIn(!!token)
      setIsStaff(cachedStaff)

      if (token && !userType) {
        fetchUser()
      } else if (!token) {
        setUserType(null)
        setIsStaff(false)
        localStorage.removeItem('is_staff')
      }
    }

    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [userType])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const hasToken = !!token
    setIsLoggedIn(hasToken)
    if (hasToken && !userType) {
      fetchUser()
    }
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('is_staff')
    localStorage.removeItem('user_type')
    setIsLoggedIn(false)
    setIsStaff(false)
    setUserType(null)
    setIsMenuOpen(false)
    navigate('/login')
  }

  const allNavLinks = [
    { label: 'Home', to: '/' },
    { label: 'Explore', to: '/explore' },
    { label: 'Dashboard', to: userType === 'landlord' ? '/owner/dashboard' : '/user/dashboard' },
    { label: 'Admin', to: '/admin-portal/dashboard' },
  ]

  const navLinks = allNavLinks.filter(link => {
    if (link.label === 'Dashboard') {
      return isLoggedIn
    }
    if (link.label === 'Admin') {
      return isLoggedIn && isStaff
    }
    return true
  })

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">House Hunt</span>
          </Link>

          {/* Primary navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-colors ${isActive ? 'text-orange-600' : 'text-gray-600 hover:text-orange-500'
                    }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop Auth buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoggedIn ? (
              <>

                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="group px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold transition-all flex items-center space-x-2 rounded-full hover:bg-slate-100"
                >
                  <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all duration-300 font-bold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 flex items-center space-x-2 ring-4 ring-transparent hover:ring-slate-100"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-6 border-t border-gray-100"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:text-orange-500 hover:bg-gray-50'
                        }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>

              {isLoggedIn ? (
                <>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate('/login')
                      setIsMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center space-x-2 text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors font-bold py-3.5 px-4 rounded-xl"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/register')
                      setIsMenuOpen(false)
                    }}
                    className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all duration-200 font-bold shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
