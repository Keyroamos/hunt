import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Home, LogOut, User, Clock, MapPin, Send, ArrowLeft, Bell } from 'lucide-react'
import { authAPI, inquiryAPI, messageAPI } from '../utils/api'
import { requestNotificationPermission, showDesktopNotification } from '../utils/notifications'

const UserDashboard = () => {
  const [user, setUser] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const previousUnreadCount = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()

    // Request notification permission
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('Notification permission granted for tenant')
      }
    })

    // Set up polling for new messages
    const pollInterval = setInterval(() => {
      checkForNewMessages()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [])

  useEffect(() => {
    if (selectedInquiry) {
      fetchMessages(selectedInquiry.id)

      // Mark messages as read when opening a conversation
      markAsRead(selectedInquiry.id)

      // Set up polling for real-time updates
      const pollInterval = setInterval(() => {
        fetchMessages(selectedInquiry.id)
        fetchData() // Refresh inquiry list to update unread counts
      }, 3000) // Poll every 3 seconds

      // Cleanup interval when inquiry changes or component unmounts
      return () => clearInterval(pollInterval)
    }
  }, [selectedInquiry])

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchData = async () => {
    try {
      if (!user) setLoading(true)
      const { data: userData } = await authAPI.getCurrentUser()
      setUser(userData)

      const { data: inquiriesData } = await inquiryAPI.getAll()
      setInquiries(inquiriesData?.results ?? inquiriesData ?? [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      if (error.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const checkForNewMessages = async () => {
    try {
      const { data: userData } = await authAPI.getCurrentUser()
      if (!userData?.id) return

      const { data: inquiriesData } = await inquiryAPI.getAll()
      const allInquiries = inquiriesData?.results ?? inquiriesData ?? []

      // Count unread messages
      const count = allInquiries.reduce((acc, inq) => {
        return acc + (inq.messages || []).filter(m => !m.is_read && m.sender_id !== userData.id).length
      }, 0)

      // Check if there are new messages
      if (count > previousUnreadCount.current && previousUnreadCount.current > 0) {
        const newMessagesCount = count - previousUnreadCount.current

        // Find the inquiries with new messages
        const newMessageInquiries = allInquiries.filter(inq => {
          const unreadInThisInquiry = (inq.messages || []).filter(m => !m.is_read && m.sender_id !== userData.id).length
          return unreadInThisInquiry > 0
        })

        // Get property and owner info
        let propertyTitle = 'a property'
        let ownerName = 'Property Owner'
        if (newMessageInquiries.length > 0) {
          const latestInquiry = newMessageInquiries[0]
          propertyTitle = latestInquiry.property_title || latestInquiry.property_details?.title || 'a property'
          ownerName = latestInquiry.property_details?.owner_name || 'Property Owner'
        }

        // Show native OS desktop notification
        showDesktopNotification(
          `New Message from ${ownerName}`,
          {
            body: newMessagesCount > 1
              ? `${newMessagesCount} new messages about ${propertyTitle}`
              : `New message about ${propertyTitle}`,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'new-message-tenant',
            requireInteraction: false,
            silent: false, // Use system notification sound
            onClick: () => {
              window.focus()
              // Optionally select the inquiry with new messages
              if (newMessageInquiries.length > 0) {
                setSelectedInquiry(newMessageInquiries[0])
              }
            }
          }
        )

        // Refresh inquiries to update UI
        setInquiries(allInquiries)
      }

      previousUnreadCount.current = count
    } catch (error) {
      console.error('Failed to check for new messages:', error)
    }
  }

  const fetchMessages = async (inquiryId) => {
    try {
      const { data } = await messageAPI.getAll(inquiryId)
      setMessages(data?.results ?? data ?? [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const markAsRead = async (inquiryId) => {
    try {
      await inquiryAPI.markRead(inquiryId)
      // Refresh inquiries to update unread counts
      await fetchData()
    } catch (error) {
      console.error('Failed to mark as read:', error)
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
      // Refresh messages
      await fetchMessages(selectedInquiry.id)
      await fetchData() // Update inquiry list
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
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

  const getUnreadCount = (inquiry) => {
    if (!user?.id || !inquiry.messages) return 0
    return inquiry.messages.filter(m => !m.is_read && m.sender_id !== user.id).length
  }

  const getTotalUnread = () => {
    return inquiries.reduce((acc, inq) => acc + getUnreadCount(inq), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl shadow-lg shadow-orange-500/20">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">My Conversations</h1>
                <p className="text-sm text-slate-500">Chat with property owners</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getTotalUnread() > 0 && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                  <Bell className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-bold text-orange-600">
                    {getTotalUnread()} unread
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-orange-500 transition-colors font-medium rounded-xl hover:bg-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Explore</span>
              </button>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {((user?.full_name || user?.username || '').length > 15
                    ? (user?.full_name || user?.username || '').substring(0, 15) + '...'
                    : (user?.full_name || user?.username || ''))}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No conversations yet</h3>
            <p className="text-slate-600 mb-6">Start exploring properties and send inquiries to connect with owners</p>
            <button
              onClick={() => navigate('/explore')}
              className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition-all font-semibold"
            >
              Explore Properties
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/30">
                <h2 className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                    Inbox ({inquiries.length})
                  </span>
                  {getTotalUnread() > 0 && (
                    <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                      {getTotalUnread()}
                    </span>
                  )}
                </h2>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {inquiries.map((inquiry) => {
                  const unreadCount = getUnreadCount(inquiry)
                  return (
                    <button
                      key={inquiry.id}
                      onClick={() => setSelectedInquiry(inquiry)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors relative ${selectedInquiry?.id === inquiry.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <Home className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`font-semibold truncate text-sm ${unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                              {inquiry.property_details?.title || inquiry.property_title || 'Property'}
                            </h3>
                            {unreadCount > 0 && (
                              <span className="ml-2 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {inquiry.property_details?.location || 'Location'}
                          </p>
                          <p className={`text-xs line-clamp-1 ${unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                            {inquiry.messages && inquiry.messages.length > 0
                              ? inquiry.messages[inquiry.messages.length - 1].content
                              : inquiry.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeAgo(inquiry.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chat View */}
            <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
              {selectedInquiry ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-orange-50/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800">{selectedInquiry.property_details?.title || selectedInquiry.property_title}</h3>
                        <p className="text-sm text-slate-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {selectedInquiry.property_details?.location}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/property/${selectedInquiry.property_details?.id || selectedInquiry.property}`)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all text-sm font-semibold"
                      >
                        View Property
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50/50 to-orange-50/20 space-y-4">
                    {/* Initial inquiry message */}
                    <div className="flex justify-end">
                      <div className="max-w-md">
                        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                          <p className="text-sm">{selectedInquiry.message}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 text-right">
                          You • {getTimeAgo(selectedInquiry.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* All subsequent messages */}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-md">
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${msg.sender === user?.id
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 rounded-tl-sm'
                            }`}>
                            {msg.sender !== user?.id && (
                              <p className="text-xs font-medium text-orange-600 mb-1">Property Owner</p>
                            )}
                            <p className={`text-sm ${msg.sender === user?.id ? 'text-white' : 'text-slate-800'}`}>
                              {msg.content}
                            </p>
                          </div>
                          <p className={`text-xs text-slate-400 mt-1 ${msg.sender === user?.id ? 'text-right' : ''}`}>
                            {msg.sender === user?.id ? 'You' : 'Owner'} • {getTimeAgo(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {messages.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500">Waiting for owner's response...</p>
                      </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                        placeholder="Type your message..."
                        disabled={sending}
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none disabled:opacity-50 bg-slate-50"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{sending ? 'Sending...' : 'Send'}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-12 bg-gradient-to-br from-slate-50/50 to-orange-50/20">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a conversation</h3>
                    <p className="text-slate-500 text-sm">Choose a property inquiry to view the conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
