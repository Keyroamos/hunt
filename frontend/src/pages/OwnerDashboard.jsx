import { useState, useEffect, useRef } from 'react'
import {
  Home, LayoutDashboard, MessageSquare, CreditCard, BarChart2,
  UserCheck, Settings, Bell, Plus, Search,
  Filter, Edit, Trash2, Eye, TrendingUp, Star,
  Shield, AlertCircle, LogOut, MoreHorizontal, MapPin,
  CheckCircle2, XCircle, Clock, Check, Send, X, Sparkles, Heart, Camera, Lock, ChevronRight, Upload
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI, propertyAPI, inquiryAPI, paymentAPI, messageAPI, verificationAPI } from '../utils/api'
import { requestNotificationPermission, showDesktopNotification, showInAppNotification } from '../utils/notifications'

const OwnerDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = searchParams.get('tab') || 'dashboard'

  const setActiveSection = (section) => {
    setSearchParams({ tab: section })
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [viewingPropertyStats, setViewingPropertyStats] = useState(null)
  const navigate = useNavigate()

  const [user, setUser] = useState({ name: 'Landlord', email: '', is_verified: false })
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [unreadInquiries, setUnreadInquiries] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationInquiryId, setNotificationInquiryId] = useState(null)
  const notificationRef = useRef(null)
  const previousUnreadCount = useRef(0)

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authAPI.getCurrentUser()
        setUser(data)
      } catch (error) {
        console.error('Failed to fetch user', error)
      }
    }
    fetchUser()

    // Request notification permission
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('Notification permission granted')
      }
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const fetchUnread = async () => {
      try {
        const { data } = await inquiryAPI.getAll()
        const allInquiries = data?.results ?? data ?? []
        const count = allInquiries.reduce((acc, inq) => {
          return acc + (inq.messages || []).filter(m => !m.is_read && m.sender_id !== user.id).length
        }, 0)

        // Check if there are new messages
        if (count > previousUnreadCount.current && previousUnreadCount.current > 0) {
          const newMessagesCount = count - previousUnreadCount.current

          // Find the inquiries with new messages
          const newMessageInquiries = allInquiries.filter(inq => {
            const unreadInThisInquiry = (inq.messages || []).filter(m => !m.is_read && m.sender_id !== user.id).length
            return unreadInThisInquiry > 0
          })

          // Get the sender name from the most recent inquiry
          let senderName = 'Someone'
          let propertyTitle = ''
          if (newMessageInquiries.length > 0) {
            const latestInquiry = newMessageInquiries[0]
            // Determine sender name based on who the user is
            if (latestInquiry.user === user.id) {
              senderName = latestInquiry.property_details?.owner_name || 'Landlord'
            } else {
              senderName = latestInquiry.user_name || 'House Hunter'
            }
            propertyTitle = latestInquiry.property_title || 'your property'
          }

          // Show native OS desktop notification
          showDesktopNotification(
            `New Message from ${senderName}`,
            {
              body: newMessagesCount > 1
                ? `${newMessagesCount} new messages about ${propertyTitle}`
                : `New message about ${propertyTitle}`,
              icon: '/logo.png',
              badge: '/logo.png',
              tag: 'new-message',
              requireInteraction: false,
              silent: false, // Use system notification sound
              onClick: () => {
                window.focus()
                setActiveSection('messages')
                if (newMessageInquiries.length > 0) {
                  setNotificationInquiryId(newMessageInquiries[0].id)
                }
              }
            }
          )
        }

        previousUnreadCount.current = count
        setUnreadTotal(count)

        const unreadList = allInquiries.filter(inq =>
          (inq.messages || []).some(m => !m.is_read && m.sender_id !== user.id)
        )
        setUnreadInquiries(unreadList)
      } catch (e) {
        console.error("Unread count error", e)
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Handle payment verification callback
  useEffect(() => {
    const verifyRef = searchParams.get('reference')
    const verifyParam = searchParams.get('verify')

    if (verifyParam === 'callback' && verifyRef) {
      const verify = async () => {
        try {
          setPaymentStatus('processing')
          await paymentAPI.verifyCallback(verifyRef)
          setPaymentStatus('success')
          // Refresh user
          const { data } = await authAPI.getCurrentUser()
          setUser(data)
          // Clear URL params but keep tab
          setSearchParams({ tab: activeSection })
          alert("Account verification successful!")
        } catch (e) {
          console.error(e)
          setPaymentStatus('error')
          alert("Verification failed. Please contact support.")
        }
      }
      verify()
    }
  }, [searchParams])

  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pollingInterval, setPollingInterval] = useState(null)
  const [verificationReference, setVerificationReference] = useState(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [promotionPhone, setPromotionPhone] = useState('')
  const [promotionStatus, setPromotionStatus] = useState('idle')
  const [promotionDuration, setPromotionDuration] = useState(30)

  const [verificationTab, setVerificationTab] = useState('kyc') // 'kyc', 'payment', 'success'
  const [kycData, setKycData] = useState({ idNumber: '', idType: 'national_id', document: null })
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false)

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [pollingInterval])

  const handleVerifyClick = () => {
    setVerificationTab('kyc')
    setShowVerificationModal(true)
  }

  const manualCheckPayment = async () => {
    if (!verificationReference) return
    try {
      const { data: verifyData } = await paymentAPI.verifyCallback(verificationReference)
      if (verifyData.status === 'verified') {
        if (pollingInterval) clearInterval(pollingInterval)
        setPaymentStatus('success')
        const { data: u } = await authAPI.getCurrentUser()
        setUser(u)
      } else {
        alert("Payment not confirmed yet. Please verify you entered your PIN.")
      }
    } catch (e) {
      console.error(e)
      alert("Check failed: " + (e.response?.data?.error || "Still pending"))
    }
  }

  const handlePromoteProperty = (property) => {
    setSelectedProperty(property)
    setShowPromotionModal(true)
  }

  const submitPromotion = async (e) => {
    e.preventDefault()
    if (!promotionPhone) {
      alert('Please enter your M-Pesa number')
      return
    }

    try {
      let propertyToPromote = selectedProperty

      if (!propertyToPromote) {
        const { data: propertiesData } = await propertyAPI.getAll({ mode: 'mine' })
        const properties = propertiesData?.results ?? propertiesData ?? []
        if (properties.length === 0) {
          alert('You need to create a property first before promoting.')
          return
        }
        propertyToPromote = properties[0]
      }

      let p = promotionPhone.replace(/\D/g, '')
      if (p.startsWith('0')) p = '254' + p.substring(1)
      else if (p.length === 9) p = '254' + p
      const formattedPhone = '+' + p

      setPromotionStatus('processing')
      const { data } = await propertyAPI.promoteProperty(propertyToPromote.id, {
        phone: formattedPhone,
        duration_days: promotionDuration
      })

      if (data && data.reference) {
        console.log('Promotion STK Push sent, reference:', data.reference)
        setVerificationReference(data.reference)
        setPromotionStatus('polling')

        const interval = setInterval(async () => {
          try {
            console.log('Polling promotion status for reference:', data.reference)
            const { data: verifyData } = await propertyAPI.verifyPromotion(data.reference)
            console.log('Promotion verification response:', verifyData)
            if (verifyData.status === 'promoted') {
              console.log('Promotion successful!')
              clearInterval(interval)
              setPollingInterval(null)
              setPromotionStatus('success')
            }
          } catch (err) {
            console.log('Polling error (will retry):', err.response?.data || err.message)
            // Keep polling
          }
        }, 4000)
        setPollingInterval(interval)
      } else if (data && data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (e) {
      console.error(e)
      setPromotionStatus('error')
      const msg = e.response?.data?.details?.message || e.response?.data?.error || "Payment failed. Please try again."
      alert(`Error: ${msg}`)
    }
  }

  const submitKyc = async (e) => {
    e.preventDefault()
    if (!kycData.document) {
      alert("Please upload your identification document")
      return
    }

    try {
      setIsSubmittingKyc(true)
      const formData = new FormData()
      formData.append('id_number', kycData.idNumber)
      formData.append('id_type', kycData.idType)
      formData.append('id_document', kycData.document)

      await verificationAPI.uploadDocument(formData)
      setVerificationTab('payment')
    } catch (error) {
      console.error('KYC upload failed', error)
      const msg = error.response?.data?.detail || error.response?.data?.error || "Failed to upload KYC documents. Please try again."
      alert(msg)
    } finally {
      setIsSubmittingKyc(false)
    }
  }

  const submitVerification = async (e) => {
    e.preventDefault()
    if (!phoneNumber) return

    let p = phoneNumber.replace(/\D/g, '')
    if (p.startsWith('0')) p = '254' + p.substring(1)
    else if (p.length === 9) p = '254' + p

    const formattedPhone = '+' + p

    try {
      setPaymentStatus('processing')
      const { data } = await paymentAPI.verifyAccount({ phone: formattedPhone })

      if (data && data.reference) {
        setVerificationReference(data.reference)
        setPaymentStatus('polling')
        // Check if it's STK or link
        if (data.authorization_url && !data.status) {
          // Fallback to link if strictly link returned
          window.location.href = data.authorization_url
          return
        }

        // Start polling for STK
        const interval = setInterval(async () => {
          try {
            const { data: verifyData } = await paymentAPI.verifyCallback(data.reference)
            if (verifyData.status === 'verified') {
              clearInterval(interval)
              setPollingInterval(null)
              setPaymentStatus('success')
              setVerificationTab('success')
              const { data: u } = await authAPI.getCurrentUser()
              setUser(u)
              // Modal stays open to show success state
            }
          } catch (err) {
            // Keep polling
          }
        }, 4000)
        setPollingInterval(interval)
      } else if (data && data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (e) {
      console.error(e)
      setPaymentStatus('error')
      const msg = e.response?.data?.details?.message || e.response?.data?.error || "Payment failed. Please try again."
      alert(`Error: ${msg} (Sent: ${formattedPhone})`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Properties', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadTotal > 0 ? unreadTotal : null },
    { id: 'analytics', label: 'Insights', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ]

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 flex overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-all duration-300 ease-in-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } lg:relative lg:block overflow-y-auto`}
      >
        <div className="h-full flex flex-col p-6">
          {/* Brand */}
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-lg shadow-lg shadow-orange-500/20">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">House Hunt</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${activeSection === item.id
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex items-center relative z-10">
                  <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110 ${activeSection === item.id ? 'text-orange-400' : 'text-slate-500 group-hover:text-orange-400'
                    }`} />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-orange-500/20">
                    {item.badge}
                  </span>
                )}
                {/* Active Indicator Line */}
                {activeSection === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-full" />
                )}
              </button>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="flex items-center space-x-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {(user.full_name || user.username || 'U').charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {((user.full_name || user.username || '').length > 20
                    ? (user.full_name || user.username || '').substring(0, 20) + '...'
                    : (user.full_name || user.username || ''))}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.user_type}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">

        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <LayoutDashboard className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-slate-800">
                {navItems.find(i => i.id === activeSection)?.label}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNewPropertyModal(true)}
                className="flex items-center space-x-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transform hover:-translate-y-0.5 shadow-slate-900/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Property</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2.5 rounded-full transition-colors ${showNotifications ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                  title="View Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                      {unreadTotal > 0 && (
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">
                          {unreadTotal} new
                        </span>
                      )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                      {unreadInquiries.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {unreadInquiries.map(inq => {
                            const unreadCount = (inq.messages || []).filter(m => !m.is_read && m.sender_id !== user.id).length
                            // Assuming getOtherPartyName is available globally or inline logic needed
                            // We can use a simplified inline logic here or just show user_name
                            const title = inq.user === user.id ? (inq.property_details?.owner_name || 'Landlord') : (inq.user_name || 'House Hunter')

                            return (
                              <button
                                key={inq.id}
                                onClick={() => {
                                  setNotificationInquiryId(inq.id)
                                  setActiveSection('messages')
                                  setShowNotifications(false)
                                }}
                                className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3"
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-xs">
                                  {title.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate">
                                    {title}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {unreadCount} new message{unreadCount !== 1 ? 's' : ''} about {inq.property_title}
                                  </p>
                                </div>
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                      <button
                        onClick={() => {
                          setActiveSection('messages')
                          setShowNotifications(false)
                        }}
                        className="w-full py-2 text-center text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
                      >
                        View all messages
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {!user.is_verified && user.verification_status === 'pending' && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Verification in Progress</h3>
                    <p className="text-amber-700 text-sm">Your documents have been submitted and are being reviewed by our team. This usually takes 24-48 hours.</p>
                  </div>
                </div>
                <div className="px-6 py-3 bg-amber-100 text-amber-700 font-bold rounded-xl border border-amber-200 relative z-10">
                  Status: Pending
                </div>
              </div>
            )}

            {!user.is_verified && user.verification_status === 'rejected' && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-900">Verification Declined</h3>
                    <p className="text-rose-700 text-sm">Your verification request was rejected. Reason: <span className="font-medium">{user.rejection_reason || 'Information provided did not meet our criteria.'}</span></p>
                  </div>
                </div>
                <button
                  onClick={handleVerifyClick}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all relative z-10"
                >
                  Re-submit Documents
                </button>
              </div>
            )}

            {!user.is_verified && user.verification_status === 'not_started' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden text-white shadow-2xl">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Get Verified Landlord Badge</h3>
                    <p className="text-slate-400 text-sm">Build trust with tenants and unlock premium listing features. Verification Fee: <span className="font-bold text-orange-400">KES 999</span>.</p>
                  </div>
                </div>
                <button
                  onClick={handleVerifyClick}
                  disabled={paymentStatus === 'processing'}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xl shadow-orange-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap relative z-10 transform hover:-translate-y-0.5"
                >
                  {paymentStatus === 'processing' ? 'Processing...' : 'Verify My Account'}
                </button>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
            )}

            {activeSection === 'dashboard' && <DashboardOverview onPromote={() => handlePromoteProperty(null)} onManageListings={() => setActiveSection('listings')} />}
            {activeSection === 'listings' && <ListingsSection onEdit={setEditingProperty} onViewStats={setViewingPropertyStats} />}
            {activeSection === 'messages' && <MessagesSection currentUser={user} initialInquiryId={notificationInquiryId} />}
            {activeSection === 'analytics' && <AnalyticsSection />}
            {activeSection === 'profile' && <ProfileSection user={user} />}
          </div>
        </main>
      </div>

      {/* New Property Modal */}
      {showNewPropertyModal && (
        <NewPropertyModal
          onClose={() => setShowNewPropertyModal(false)}
        />
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
        />
      )}

      {/* Property Statistics Modal */}
      {viewingPropertyStats && (
        <PropertyStatsModal
          property={viewingPropertyStats}
          onClose={() => setViewingPropertyStats(null)}
          onPromote={() => handlePromoteProperty(viewingPropertyStats)}
        />
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Account Verification</h3>
                  <p className="text-xs text-slate-500">Professional Landlord Badge</p>
                </div>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                disabled={paymentStatus === 'polling' || isSubmittingKyc}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 mb-8 px-2">
              <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${verificationTab === 'kyc' ? 'bg-orange-500' : 'bg-green-500'}`} />
              <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${verificationTab === 'payment' ? 'bg-orange-500' : verificationTab === 'success' ? 'bg-green-500' : 'bg-slate-200'}`} />
              <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${verificationTab === 'success' ? 'bg-green-500' : 'bg-slate-200'}`} />
            </div>

            {verificationTab === 'kyc' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 mb-1">Step 1: Identity Information</h4>
                  <p className="text-sm text-slate-500">Please provide your identification details for record keeping.</p>
                </div>

                <form onSubmit={submitKyc} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">ID Type</label>
                    <select
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-800"
                      value={kycData.idType}
                      onChange={e => setKycData({ ...kycData, idType: e.target.value })}
                      required
                    >
                      <option value="national_id">National ID Card</option>
                      <option value="passport">Passport</option>
                      <option value="alien_id">Alien ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Identification Number</label>
                    <input
                      type="text"
                      placeholder="Enter ID / Passport Number"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-800"
                      value={kycData.idNumber}
                      onChange={e => setKycData({ ...kycData, idNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Upload Document (Front Side)</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id="kyc-doc"
                        onChange={e => setKycData({ ...kycData, document: e.target.files[0] })}
                      />
                      <label
                        htmlFor="kyc-doc"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${kycData.document ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                      >
                        {kycData.document ? (
                          <div className="text-center px-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{kycData.document.name}</p>
                            <p className="text-xs text-slate-400 uppercase mt-1">Click to change</p>
                          </div>
                        ) : (
                          <div className="text-center px-4">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-orange-400" />
                            <p className="text-sm font-medium text-slate-600">Select Image or PDF</p>
                            <p className="text-xs text-slate-400 mt-1">Maximum size: 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingKyc}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg mt-4"
                  >
                    {isSubmittingKyc ? (
                      <span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Processing...</span>
                    ) : 'Continue to Payment'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </form>
              </div>
            )}

            {verificationTab === 'payment' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 mb-1">Step 2: Verification Fee</h4>
                  <p className="text-sm text-slate-500">Pay the one-time verification fee via M-Pesa to activate your badge.</p>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-green-600 font-bold shadow-sm">
                    KES
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Amount Payable</p>
                    <p className="text-2xl font-black text-green-900">999.00</p>
                  </div>
                </div>

                <form onSubmit={submitVerification} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">M-Pesa Number</label>
                    <input
                      type="text"
                      placeholder="0712 345 678"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-green-500 font-medium text-slate-800"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      disabled={paymentStatus === 'polling'}
                      required
                    />
                  </div>

                  {paymentStatus === 'polling' && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 font-medium flex items-start gap-3 animate-pulse">
                      <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">STK Push Sent!</p>
                        <p className="text-xs opacity-80">Please check your phone and enter your M-Pesa PIN to complete the payment.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setVerificationTab('kyc')}
                      className="flex-1 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={paymentStatus === 'processing' || paymentStatus === 'polling'}
                      className="flex-[2] bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    >
                      {paymentStatus === 'polling' ? (
                        <span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Waiting for PIN...</span>
                      ) : paymentStatus === 'processing' ? 'Connecting...' : 'Pay KES 999'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {verificationTab === 'success' && (
              <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 border-4 border-green-50 shadow-inner">
                  <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Verification Complete!</h3>
                <p className="text-slate-600 mb-8 leading-relaxed px-4">
                  Awesome! Your documents have been submitted and payment confirmed. Your professional badge will appear on your profile shortly.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-full text-white">
                      <Shield className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-slate-800">Professional Landlord Verified</p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {promotionStatus === 'success' ? (
              <div className="text-center py-6">
                <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-orange-600" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Property Promoted!</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Your property is now featured and will appear at the top of search results for {promotionDuration} days.
                </p>
                <button
                  onClick={() => {
                    setShowPromotionModal(false)
                    setPromotionStatus('idle')
                    setPromotionPhone('')
                  }}
                  className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  Continue to Dashboard
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  Boost Your Listing
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Get 3x more views with premium placement. Your property will appear at the top of search results.
                </p>

                <div className="bg-orange-50 p-4 rounded-xl space-y-3 mb-6 border border-orange-100">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Why Promote?</p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm text-slate-700">
                      <TrendingUp className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Featured spot on the Homepage</span>
                    </li>
                    <li className="flex items-start text-sm text-slate-700">
                      <Eye className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Up to 3x more views and inquiries</span>
                    </li>
                    <li className="flex items-start text-sm text-slate-700">
                      <Star className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Stand out from competitors</span>
                    </li>
                  </ul>
                </div>

                <form onSubmit={submitPromotion} className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { days: 1, price: 99, label: '1 Day' },
                        { days: 7, price: 499, label: '7 Days', popular: true },
                        { days: 30, price: 1499, label: '30 Days' }
                      ].map(option => (
                        <button
                          key={option.days}
                          type="button"
                          onClick={() => setPromotionDuration(option.days)}
                          disabled={promotionStatus === 'processing' || promotionStatus === 'polling'}
                          className={`relative p-3 rounded-xl border-2 transition-all ${promotionDuration === option.days
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 hover:border-slate-300'
                            } disabled:opacity-50`}
                        >
                          {option.popular && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                              POPULAR
                            </span>
                          )}
                          <div className="text-center">
                            <div className="font-bold text-slate-800">{option.label}</div>
                            <div className="text-xs text-slate-500 mt-1">KES {option.price}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">M-Pesa Number</label>
                    <input
                      type="text"
                      placeholder="0712 345 678"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-slate-800"
                      value={promotionPhone}
                      onChange={e => setPromotionPhone(e.target.value)}
                      disabled={promotionStatus === 'processing' || promotionStatus === 'polling'}
                      required
                    />
                  </div>

                  {promotionStatus === 'polling' && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium flex items-center animate-pulse">
                      <AlertCircle className="w-4 h-4 mr-2" /> STK Push sent! Please check your phone.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={promotionStatus === 'processing' || promotionStatus === 'polling'}
                    className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-orange-600/20"
                  >
                    {promotionStatus === 'polling' ? (
                      <span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Waiting for PIN...</span>
                    ) : promotionStatus === 'processing' ? 'Sending Request...' : `Pay KES ${promotionDuration === 1 ? '99' : promotionDuration === 7 ? '499' : '1499'}`}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setShowPromotionModal(false)
                    setPromotionStatus('idle')
                  }}
                  className="w-full text-sm text-slate-500 hover:text-slate-800 font-medium py-2"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// -- SUB COMPONENTS --

const StatsCard = ({ title, value, trend, icon: Icon, color, bg }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <span className={`flex items-center font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
          {trend.value}
        </span>
        <span className="text-slate-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
)

const DashboardOverview = ({ onPromote, onManageListings }) => {
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    publishedListings: 0,
  })
  const [recentInquiries, setRecentInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch user data
      const { data: userData } = await authAPI.getCurrentUser()
      setUser(userData)

      // Fetch properties to calculate stats
      const { data: propertiesData } = await propertyAPI.getAll({ mode: 'mine' })
      const properties = propertiesData?.results ?? propertiesData ?? []

      // Calculate statistics
      const activeListings = properties.filter(p => p.status === 'active').length
      const publishedListings = properties.filter(p => p.is_published).length
      const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0)

      // Fetch inquiries
      const { data: inquiriesData } = await inquiryAPI.getAll()
      const inquiries = inquiriesData?.results ?? inquiriesData ?? []

      setStats({
        activeListings,
        totalViews,
        totalInquiries: inquiries.length,
        publishedListings,
      })

      // Get the 3 most recent inquiries
      setRecentInquiries(inquiries.slice(0, 3))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || user?.username || 'Landlord'}! 👋</h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              Here is what is happening with your properties today.
              {stats.totalInquiries > 0 ? (
                <> You have <span className="text-white font-semibold">{stats.totalInquiries} {stats.totalInquiries === 1 ? 'inquiry' : 'inquiries'}</span> waiting for your response.</>
              ) : (
                <> You have no pending inquiries at the moment.</>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl backdrop-blur-md transition-all text-sm font-medium">
              View Reports
            </button>
            <button
              onClick={onManageListings}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 rounded-xl transition-all text-sm font-medium border border-transparent">
              Manage Listings
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Listings"
          value={stats.activeListings.toString()}
          icon={Home}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatsCard
          title="Total Views"
          value={formatNumber(stats.totalViews)}
          icon={Eye}
          color="text-indigo-500"
          bg="bg-indigo-50"
        />
        <StatsCard
          title="Total Inquiries"
          value={stats.totalInquiries.toString()}
          icon={MessageSquare}
          color="text-orange-500"
          bg="bg-orange-50"
        />
        <StatsCard
          title="Published Listings"
          value={stats.publishedListings.toString()}
          icon={CheckCircle2}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Inquiries List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800">Recent Inquiries</h3>
            <button className="text-orange-500 text-sm font-medium hover:text-orange-600">View All</button>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No inquiries yet</p>
              <p className="text-slate-400 text-xs mt-1">Inquiries from interested tenants will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {getInitials(inquiry.user?.full_name || inquiry.user?.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800 truncate">
                        {inquiry.user?.full_name || inquiry.user?.username || 'Anonymous'}
                      </h4>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                        {getTimeAgo(inquiry.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {inquiry.message || 'Interested in this property'}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-md">
                        {inquiry.status === 'pending' ? 'New Lead' : inquiry.status}
                      </span>
                      {inquiry.property && (
                        <span className="text-xs text-slate-400 truncate">
                          • {inquiry.property.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Help / Promo */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-orange-900">Boost Visibility</h3>
            </div>
            <p className="text-sm text-orange-800 mb-4">
              Premium listings get 10 views. Upgrade your package to reach more tenants.
            </p>
            <button
              onClick={onPromote}
              className="w-full py-2.5 bg-white text-orange-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
            >
              Upgrade Now
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Verification Status</h3>
            <div className={`flex items-center space-x-3 p-4 rounded-xl border ${user?.is_verified
              ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
              : user?.verification_status === 'rejected'
                ? 'text-rose-600 bg-rose-50 border-rose-100'
                : 'text-amber-600 bg-amber-50 border-amber-100'
              }`}>
              {user?.is_verified ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Account Verified</span>
                </>
              ) : user?.verification_status === 'rejected' ? (
                <>
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Verification Rejected</span>
                </>
              ) : user?.verification_status === 'pending' ? (
                <>
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">Under Review</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Not Verified</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ListingsSection = ({ onEdit, onViewStats }) => {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const { data } = await propertyAPI.getAll({ mode: 'mine' })
      const results = data?.results ?? data ?? []
      setProperties(results)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (propertyId) => {
    try {
      const { data } = await propertyAPI.togglePublish(propertyId)

      // Update local state
      setProperties(prev => prev.map(prop =>
        prop.id === propertyId
          ? { ...prop, is_published: data.is_published }
          : prop
      ))

      // Show success message
      alert(data.message)
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      alert('Failed to update property visibility. Please try again.')
    }
  }

  const handleDelete = async (propertyId) => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      await propertyAPI.delete(propertyId)
      setProperties(prev => prev.filter(prop => prop.id !== propertyId))
      alert('Property deleted successfully')
    } catch (error) {
      console.error('Failed to delete property:', error)
      alert('Failed to delete property. Please try again.')
    }
  }

  const filteredProperties = properties.filter(prop =>
    prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center max-w-md w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProperties}
              className="flex items-center space-x-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-medium text-sm transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Home className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">No properties yet</h3>
              <p className="text-slate-500 text-sm">Click "New Property" to add your first listing</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Visibility</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-16 w-24 bg-slate-200 rounded-lg flex-shrink-0 object-cover overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img src={item.images[0].image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{item.title}</div>
                          <div className="flex items-center mt-1 text-slate-500 text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.location}
                          </div>
                          <div className="mt-1 font-medium text-orange-600 text-sm">KES {parseFloat(item.rent_per_month).toLocaleString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${item.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : item.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : item.status === 'rented'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {item.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(item.id)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${item.is_published
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        title={item.is_published ? 'Click to hide from tenants' : 'Click to show to tenants'}
                      >
                        {item.is_published ? (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Published
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                            Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-slate-600">
                          <Eye className="w-4 h-4 mr-2 text-slate-400" />
                          {item.views || 0}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <MessageSquare className="w-4 h-4 mr-2 text-slate-400" />
                          0
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewStats(item)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Statistics"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination/Footer */}
        {!loading && filteredProperties.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">Showing {filteredProperties.length} of {properties.length} properties</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-white text-slate-600 disabled:opacity-50">Previous</button>
              <button className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-white text-slate-600">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



const AnalyticsSection = () => {
  const [stats, setStats] = useState({
    occupancyRate: 0,
    actualRevenue: 0,
    conversionRate: 0,
    totalViews: 0,
    topProperties: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [{ data: propsData }, { data: inqData }] = await Promise.all([
          propertyAPI.getAll({ mode: 'mine' }),
          inquiryAPI.getAll()
        ])

        const props = propsData?.results || propsData || []
        const inquiries = inqData?.results || inqData || []

        const total = props.length
        const views = props.reduce((acc, p) => acc + (p.views || 0), 0)

        // Revenue from rented properties only
        const rentedProps = props.filter(p => p.status === 'rented')
        const actualRevenue = rentedProps.reduce((acc, p) => acc + parseFloat(p.rent_per_month || 0), 0)

        const occupancyRate = total > 0 ? (rentedProps.length / total) * 100 : 0
        const conversionRate = views > 0 ? (inquiries.length / views) * 100 : 0

        // Top 5 by views
        const sorted = [...props].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)

        setStats({
          occupancyRate,
          actualRevenue,
          conversionRate,
          totalViews: views,
          topProperties: sorted
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
    </div>
  )

  const maxViews = Math.max(...stats.topProperties.map(p => p.views || 0), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Monthly Revenue (Rented)"
          value={`KES ${stats.actualRevenue.toLocaleString()}`}
          icon={TrendingUp}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <StatsCard
          title="Occupancy Rate"
          value={`${Math.round(stats.occupancyRate)}%`}
          icon={CheckCircle2}
          bg="bg-blue-50"
          color="text-blue-600"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          trend={{ value: 'Leads / Views', isPositive: true }}
          icon={BarChart2}
          bg="bg-purple-50"
          color="text-purple-600"
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 mb-6">Top Performing Properties</h3>
        <div className="space-y-6">
          {stats.topProperties.map(p => (
            <div key={p.id} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-700 truncate max-w-[200px]">{p.title}</span>
                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{p.views || 0} views</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${((p.views || 0) / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {stats.topProperties.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No property data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Tip */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-xl hidden sm:block">
            <TrendingUp className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-1">Boost Your Occupancy</h4>
            <p className="text-slate-300 text-sm">Properties with professional photos get 40% more inquiries.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Change Password Modal Component */
const ChangePasswordModal = ({ onClose }) => {
  const [passData, setPassData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passData.new_password !== passData.confirm_password) {
      alert("New passwords do not match")
      return
    }
    setLoading(true)
    try {
      await authAPI.updatePassword({
        old_password: passData.current_password,
        new_password: passData.new_password
      })
      alert("Password updated successfully")
      onClose()
    } catch (e) {
      console.error(e)
      alert("Failed to update password: " + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1">Current Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={passData.current_password}
              onChange={e => setPassData({ ...passData, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={passData.new_password}
              onChange={e => setPassData({ ...passData, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={passData.confirm_password}
              onChange={e => setPassData({ ...passData, confirm_password: e.target.value })}
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ProfileSection = ({ user }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await authAPI.updateProfile(formData)
      alert('Profile updated successfully!')
      setIsEditing(false)
      window.location.reload() // Simple way to refresh user context
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600 transition-all duration-700 group-hover:scale-105"></div>
        <div className="absolute top-4 right-4 z-10">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl text-sm font-bold transition-all border border-white/20 flex items-center gap-2 shadow-lg"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>

        <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-2xl ring-4 ring-white/50 relative z-10">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center overflow-hidden relative group/avatar cursor-pointer">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400 select-none">
                    {(formData.full_name || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                {/* Avatar Overlay (Mockup for future update) */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 border-4 border-white rounded-full z-20" title="Online"></div>
            </div>
          </div>

          <div className="pb-4 flex-1">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{user.full_name || user.username}</h2>
                <p className="text-slate-500 font-medium mt-1 flex items-center justify-center md:justify-start gap-2">
                  <span className="text-slate-400">@</span>{user.username}
                  <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
                  {user.user_type === 'landlord' ? 'Property Owner' : 'Tenant'}
                </p>
              </div>

              <div className="flex gap-2">
                {user.is_verified ? (
                  <div className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verified Landlord
                  </div>
                ) : user.verification_status === 'pending' ? (
                  <div className="px-4 py-2 bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold rounded-xl flex items-center shadow-sm">
                    <Clock className="w-4 h-4 mr-2 animate-pulse" /> Under Review
                  </div>
                ) : user.verification_status === 'rejected' ? (
                  <div className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold rounded-xl flex items-center shadow-sm">
                    <XCircle className="w-4 h-4 mr-2" /> Application Rejected
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl flex items-center shadow-sm">
                    <AlertCircle className="w-4 h-4 mr-2" /> Identity Unverified
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-orange-500" />
              Personal Details
            </h3>
            {isEditing && (
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full animate-pulse">Editing Mode Active</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl outline-none font-medium transition-all ${isEditing
                    ? 'border-slate-300 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm'
                    : 'border-transparent text-slate-600 bg-slate-50/50 cursor-not-allowed'}`}
                />
                {!isEditing && <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  disabled
                  placeholder="No email address set"
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-transparent rounded-xl outline-none font-medium text-slate-500 cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
              </div>
              <p className="text-[10px] text-slate-400 px-1">Email cannot be changed for security reasons.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl outline-none font-medium transition-all ${isEditing
                    ? 'border-slate-300 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm'
                    : 'border-transparent text-slate-600 bg-slate-50/50 cursor-not-allowed'}`}
                />
                {!isEditing && <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Location</label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="Nairobi, Kenya"
                  disabled
                  className="w-full px-4 py-3.5 bg-slate-50/50 border border-transparent rounded-xl outline-none font-medium text-slate-500 cursor-not-allowed"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setFormData({
                    full_name: user?.full_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                  })
                  setIsEditing(false)
                }}
                className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Account Status / Side Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Account Status
              </h3>
              <p className="text-orange-100 text-sm mb-6">
                {user.is_verified ? 'Your account is fully verified. You can list unlimited properties.' : 'Verify your account to start listing properties and reach more tenants.'}
              </p>

              {!user.is_verified && (
                <button className="w-full py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg hover:bg-orange-50 transition-colors text-sm">
                  Verify Information
                </button>
              )}
            </div>

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-5 translate-y-5" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
            <h4 className="font-bold text-slate-800 mb-4 text-sm">Security Settings</h4>
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Change Password</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Bell className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  )
}

// New Property Modal Component
const AMENITY_OPTIONS = [
  'Wifi', 'Parking', 'Security', 'Water Supply', 'Gym',
  'Swimming Pool', 'Balcony', 'Garden', 'CCTV',
  'Borehole', 'Elevator', 'Pet Friendly'
]

const NewPropertyModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'bedsitter',
    bedrooms: 0,
    bathrooms: 0,
    rent_per_month: '',
    deposit: '',
    location: '',
    contact_phone: '',
    map_embed: '',
    photos: [],
    amenities: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare property data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms || 0,
        bathrooms: formData.bathrooms || 0,
        rent_per_month: parseFloat(formData.rent_per_month),
        deposit: parseFloat(formData.deposit),
        location: formData.location,
        contact_phone: formData.contact_phone,
        amenities: formData.amenities,
      }


      // Add optional fields if provided
      if (formData.map_embed) {
        propertyData.map_embed = formData.map_embed
      }

      // Create property
      const { data } = await propertyAPI.create(propertyData)

      // Upload photos if any
      if (formData.photos && formData.photos.length > 0) {
        const formDataImages = new FormData()
        formData.photos.forEach((photo, index) => {
          formDataImages.append('images', photo.file)
        })
        await propertyAPI.uploadImages(data.id, formDataImages)
      }

      alert('Property created successfully! It is now live for tenants to see.')
      onClose()

      // Refresh the page to show new property
      window.location.reload()
    } catch (error) {
      console.error('Error creating property:', error)
      let errorMessage = 'Failed to create property.'

      if (error.response?.data) {
        const data = error.response.data
        if (data.detail) errorMessage = data.detail
        else if (data.message) errorMessage = data.message
        else if (typeof data === 'object') {
          // Extract field errors
          const parts = []
          for (const [key, value] of Object.entries(data)) {
            parts.push(`${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          }
          if (parts.length > 0) errorMessage = `Validation Error:\n${parts.join('\n')}`
        }
      }

      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Property</h2>
            <p className="text-slate-300 text-sm mt-1">Fill in the details to list your property</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Property Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Modern 2BR Apartment in Westlands"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* House Type & Bedrooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">House Type *</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="single_room">Single Room</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="1br">1 Bedroom</option>
                  <option value="2br">2 Bedroom</option>
                  <option value="3br">3 Bedroom</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="mansion">Mansion</option>
                  <option value="godown">Go-down</option>
                  <option value="shop">Shop</option>
                </select>
              </div>


            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Monthly Rent (KES) *</label>
                <input
                  type="number"
                  name="rent_per_month"
                  value={formData.rent_per_month}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 45000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Deposit (KES) *</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 45000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Contact Phone & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Westlands, Nairobi"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Phone (Private) *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Only shown to tenants who click "Contact Owner".</p>
              </div>
            </div>

            {/* Google Maps Embed (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Google Maps Embed Code (Optional)</label>
              <textarea
                name="map_embed"
                value={formData.map_embed || ''}
                onChange={handleChange}
                rows="3"
                placeholder='Paste Google Maps embed code here, e.g., <iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" ... ></iframe>'
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Get embed code: Open Google Maps → Search location → Click "Share" → Select "Embed a map" → Copy HTML code
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your property, amenities, nearby facilities, etc."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Amenities & Features */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Amenities & Features</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.amenities.includes(amenity)
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-slate-300 group-hover:border-orange-400'
                      }`}>
                      {formData.amenities.includes(amenity) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData(prev => ({
                          ...prev,
                          amenities: checked
                            ? [...prev.amenities, amenity]
                            : prev.amenities.filter(a => a !== amenity)
                        }))
                      }}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Photos (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Property Photos (Optional)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files)
                    const newPhotos = files.map(file => ({
                      file,
                      preview: URL.createObjectURL(file)
                    }))
                    setFormData(prev => ({
                      ...prev,
                      photos: [...prev.photos, ...newPhotos]
                    }))
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-8 h-8 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload photos</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB each</p>
                </label>
              </div>

              {/* Photo Previews */}
              {formData.photos && formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== index)
                          }))
                          URL.revokeObjectURL(photo.preview)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-md">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                📸 First photo will be used as the primary image. Drag to reorder (coming soon)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Property</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Property Modal Component
const EditPropertyModal = ({ property, onClose }) => {
  const [formData, setFormData] = useState({
    title: property.title || '',
    description: property.description || '',
    property_type: property.property_type || 'bedsitter',
    bedrooms: property.bedrooms || 0,
    bathrooms: property.bathrooms || 0,
    rent_per_month: property.rent_per_month || '',
    deposit: property.deposit || '',
    location: property.location || '',
    contact_phone: property.contact_phone || '',
    map_embed: property.map_embed || '',
    amenities: property.amenities || [],
  })
  const [newPhotos, setNewPhotos] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingImages, setExistingImages] = useState(property.images || [])

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this photo permanently?')) return
    try {
      await propertyAPI.deleteImage(property.id, imageId)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error(error)
      alert('Failed to delete image')
    }
  }

  const handleSetPrimary = async (imageId) => {
    try {
      await propertyAPI.setPrimaryImage(property.id, imageId)
      setExistingImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })))
    } catch (error) {
      console.error(error)
      alert('Failed to update primary image')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare property data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms || 0,
        bathrooms: formData.bathrooms || 0,
        rent_per_month: parseFloat(formData.rent_per_month),
        deposit: parseFloat(formData.deposit),
        location: formData.location,
        contact_phone: formData.contact_phone,
        amenities: formData.amenities,
      }

      // Add optional fields if provided
      if (formData.map_embed) {
        propertyData.map_embed = formData.map_embed
      }

      // Update property details
      await propertyAPI.update(property.id, propertyData)

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const formDataImages = new FormData()
        newPhotos.forEach((photo) => {
          formDataImages.append('images', photo.file)
        })
        await propertyAPI.uploadImages(property.id, formDataImages)
      }

      alert('Property updated successfully!')
      onClose()

      // Refresh the page to show updated property
      window.location.reload()
    } catch (error) {
      console.error('Error updating property:', error)
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to update property. Please check all fields and try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Property</h2>
            <p className="text-blue-300 text-sm mt-1">Update your property details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Property Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Modern 2BR Apartment in Westlands"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* House Type & Bedrooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">House Type *</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="single_room">Single Room</option>
                  <option value="bedsitter">Bedsitter</option>
                  <option value="1br">1 Bedroom</option>
                  <option value="2br">2 Bedroom</option>
                  <option value="3br">3 Bedroom</option>
                  <option value="bungalow">Bungalow</option>
                  <option value="mansion">Mansion</option>
                  <option value="godown">Go-down</option>
                  <option value="shop">Shop</option>
                </select>
              </div>


            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Monthly Rent (KES) *</label>
                <input
                  type="number"
                  name="rent_per_month"
                  value={formData.rent_per_month}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 45000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Deposit (KES) *</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 45000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Westlands, Nairobi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Contact Phone (Private) *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    required
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Only shown to tenants who click "Contact Owner".</p>
              </div>
            </div>

            {/* Amenities & Features */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Amenities & Features</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.amenities.includes(amenity)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300 group-hover:border-blue-400'
                      }`}>
                      {formData.amenities.includes(amenity) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setFormData(prev => ({
                          ...prev,
                          amenities: checked
                            ? [...prev.amenities, amenity]
                            : prev.amenities.filter(a => a !== amenity)
                        }))
                      }}
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Google Maps Embed (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Google Maps Embed Code (Optional)</label>
              <textarea
                name="map_embed"
                value={formData.map_embed || ''}
                onChange={handleChange}
                rows="3"
                placeholder='Paste Google Maps embed code here, e.g., <iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" ... ></iframe>'
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Get embed code: Open Google Maps → Search location → Click "Share" → Select "Embed a map" → Copy HTML code
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your property, amenities, nearby facilities, etc."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Property Photos (Existing & New) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Property Photos</label>
                <span className="text-xs text-slate-500">{existingImages.length} existing</span>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="edit-photo-upload"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files)
                    const newPhotoObjects = files.map(file => ({
                      file,
                      preview: URL.createObjectURL(file)
                    }))
                    setNewPhotos(prev => [...prev, ...newPhotoObjects])
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="edit-photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload new photos</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB each</p>
                </label>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {/* Existing Photos */}
                {existingImages.map((img, index) => (
                  <div key={`existing-${img.id || index}`} className="relative group">
                    <img
                      src={img.image}
                      alt={`Existing ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-xl border-2 ${img.is_primary ? 'border-orange-500' : 'border-slate-200'}`}
                    />

                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        title="Set as Primary"
                        className={`p-2 rounded-full ${img.is_primary ? 'bg-orange-500 text-white' : 'bg-white/20 text-white hover:bg-orange-500'}`}
                      >
                        <Star className={`w-4 h-4 ${img.is_primary ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        title="Delete Photo"
                        className="p-2 rounded-full bg-white/20 text-white hover:bg-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {img.is_primary && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded shadow-sm">
                        Primary
                      </div>
                    )}
                  </div>
                ))}

                {/* New Photo Previews */}
                {newPhotos.map((photo, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={photo.preview}
                      alt={`New Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-blue-200 ring-2 ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewPhotos(prev => prev.filter((_, i) => i !== index))
                        URL.revokeObjectURL(photo.preview)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded">
                      New
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  <span>Update Property</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Property Statistics Modal Component
const PropertyStatsModal = ({ property, onClose, onPromote }) => {
  const [stats, setStats] = useState({
    views: property.views || 0,
    favorites: 0,
    inquiries: { total: 0, last_7_days: 0, last_30_days: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const { data } = await propertyAPI.getStats(property.id)
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch property stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [property.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-orange-400" />
              Property Performance
            </h2>
            <p className="text-slate-400 text-sm mt-1">{property.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Views */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                        <Eye className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Views</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-slate-900">{stats.views.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Times your property was viewed</p>
                  </div>
                </div>

                {/* Favorites */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                        <Heart className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Favorites</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-slate-900">{stats.favorites.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Users who saved your property</p>
                  </div>
                </div>

                {/* Total Inquiries */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Inquiries</span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-slate-900">{stats.inquiries.total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Total messages received</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Trends (Accurate Data) */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Recent Interest
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">Last 7 Days</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.inquiries.last_7_days}</p>
                      <p className="text-xs text-slate-400 mt-1">New inquiries</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 flex items-center justify-center bg-white shadow-sm">
                      <span className="text-emerald-600 font-bold text-xs">Week</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">Last 30 Days</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.inquiries.last_30_days}</p>
                      <p className="text-xs text-slate-400 mt-1">New inquiries</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-blue-100 border-t-blue-500 flex items-center justify-center bg-white shadow-sm">
                      <span className="text-blue-600 font-bold text-xs">Month</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-full shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-800 text-sm">Pro Tip</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      {stats.inquiries.last_30_days === 0
                        ? "Promote your property to get more visibility! Properties with promotions get 10 views."
                        : "You are getting attention! Respond to inquiries within 1 hour to increase your conversion rate."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Boost Visibility per Property */}
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-indigo-500/50 rounded-lg backdrop-blur-sm border border-indigo-400/30">
                        <TrendingUp className="w-5 h-5 text-indigo-300" />
                      </div>
                      <h3 className="text-xl font-bold">Boost Visibility</h3>
                    </div>
                    <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
                      Premium listings get <span className="text-white font-bold underline decoration-indigo-400">10 views</span>. Upgrade your package to reach more tenants specifically for this property.
                    </p>
                  </div>
                  <button
                    onClick={onPromote}
                    className="bg-white text-indigo-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-all shadow-xl shadow-indigo-900/50 active:scale-95 whitespace-nowrap"
                  >
                    Upgrade Now
                  </button>
                </div>
                {/* Decorative element */}
                <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  )
}

const MessagesSection = ({ currentUser, initialInquiryId }) => {
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchInquiries()
  }, [])

  useEffect(() => {
    if (inquiries.length > 0 && initialInquiryId) {
      const target = inquiries.find(i => i.id === initialInquiryId)
      if (target) setSelectedInquiry(target)
    }
  }, [inquiries, initialInquiryId])

  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.id)

      const interval = setInterval(() => {
        // Poll both messages and potentially refresh inquiry list for unread counts
        fetchMessages(selectedInquiry.id)
        if (document.visibilityState === 'visible') fetchInquiries()
      }, 3000)

      return () => clearInterval(interval)
    } else {
      // Poll list if no chat selected
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchInquiries()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [selectedInquiry])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchInquiries = async () => {
    try {
      // Don't show global loading on poll
      if (inquiries.length === 0) setLoading(true)
      const { data } = await inquiryAPI.getAll()
      const list = data?.results ?? data ?? []
      setInquiries(list)
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      if (inquiries.length === 0) setLoading(false)
    }
  }

  const fetchMessages = async (inquiryId) => {
    try {
      const { data } = await messageAPI.getAll(inquiryId)
      setMessages(data?.results ?? data ?? [])

      // Mark messages as read if we are viewing them
      // Logic: Mark all messages in this thread NOT sent by me as read
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        await inquiryAPI.markRead(inquiryId)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedInquiry) return

    try {
      setSending(true)
      await messageAPI.create({
        inquiry: selectedInquiry.id,
        content: newMessage
      })
      setNewMessage('')
      await fetchMessages(selectedInquiry.id)
      await fetchInquiries() // Update last message preview
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getTimeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  // Helper to determine the "Other Party" name
  const getOtherPartyName = (inquiry) => {
    if (!currentUser || !inquiry) return 'User'
    // If I am the creator of the inquiry (Hunter), show the Owner
    if (inquiry.user === currentUser.id) {
      return inquiry.property_details?.owner_name || 'Landlord'
    }
    // If I am the Owner (Landlord), show the Creator (Hunter)
    return inquiry.user_name || 'House Hunter'
  }

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Inquiries List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
            Inbox ({inquiries.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No inquiries yet.</p>
            </div>
          ) : (
            inquiries.map((inquiry) => {
              const otherPartyName = getOtherPartyName(inquiry)
              const unreadCount = (inquiry.messages || []).filter(m => !m.is_read && m.sender !== currentUser.id).length

              return (
                <button
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors relative ${selectedInquiry?.id === inquiry.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-sm ${unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>{otherPartyName}</h3>
                    <span className="text-xs text-slate-400">{getTimeAgo(inquiry.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500 font-medium mb-0.5 truncate">
                        Re: {inquiry.property_title || 'Property'}
                      </p>
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        {inquiry.messages && inquiry.messages.length > 0
                          ? inquiry.messages[inquiry.messages.length - 1].content
                          : inquiry.message}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {selectedInquiry ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  {getOtherPartyName(selectedInquiry).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {getOtherPartyName(selectedInquiry)}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center">
                    Interested in <span className="font-semibold ml-1">{selectedInquiry.property_title}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
              {/* Initial Inquiry - Hide if we have messages that replicate it, otherwise show as first msg */}
              {/* If we treat the Inquiry.message as the first message, let's display it prominently or as a normal message */}
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 mb-1">Initial Inquiry</p>
                    <p className="text-sm text-slate-800">{selectedInquiry.message}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{getTimeAgo(selectedInquiry.created_at)}</p>
                </div>
              </div>

              {/* Thread */}
              {messages.map((msg) => {
                const isMe = msg.sender === currentUser?.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%]">
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${isMe
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 rounded-tl-none'
                        }`}>
                        <p className={`text-sm ${isMe ? 'text-white' : 'text-slate-800'}`}>
                          {msg.content}
                        </p>
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                        {isMe ? 'You' : getOtherPartyName(selectedInquiry)} • {getTimeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
export default OwnerDashboard

