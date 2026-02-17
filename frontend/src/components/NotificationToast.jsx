import { useState, useEffect } from 'react'
import { X, MessageSquare, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'

const NotificationToast = () => {
    const [notifications, setNotifications] = useState([])

    useEffect(() => {
        const handleNotification = (event) => {
            const { message, type, duration } = event.detail
            const id = Date.now()

            setNotifications(prev => [...prev, { id, message, type, duration }])

            // Auto remove after duration
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }, duration || 5000)
        }

        window.addEventListener('show-notification', handleNotification)
        return () => window.removeEventListener('show-notification', handleNotification)
    }, [])

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const getIcon = (type) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="w-5 h-5" />
            case 'success':
                return <CheckCircle className="w-5 h-5" />
            case 'error':
                return <AlertCircle className="w-5 h-5" />
            case 'info':
            default:
                return <Info className="w-5 h-5" />
        }
    }

    const getColors = (type) => {
        switch (type) {
            case 'message':
                return {
                    bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    icon: 'text-blue-100',
                    text: 'text-white',
                    progress: 'bg-blue-200'
                }
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                    icon: 'text-emerald-100',
                    text: 'text-white',
                    progress: 'bg-emerald-200'
                }
            case 'error':
                return {
                    bg: 'bg-gradient-to-r from-rose-500 to-rose-600',
                    icon: 'text-rose-100',
                    text: 'text-white',
                    progress: 'bg-rose-200'
                }
            case 'info':
            default:
                return {
                    bg: 'bg-gradient-to-r from-slate-700 to-slate-800',
                    icon: 'text-slate-100',
                    text: 'text-white',
                    progress: 'bg-slate-300'
                }
        }
    }

    if (notifications.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
            {notifications.map((notification) => {
                const colors = getColors(notification.type)
                return (
                    <div
                        key={notification.id}
                        className={`${colors.bg} rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-right-full duration-300`}
                        style={{
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <div className="p-4 flex items-start gap-3 relative">
                            {/* Icon */}
                            <div className={`${colors.icon} mt-0.5 flex-shrink-0`}>
                                {getIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 ${colors.text} pr-8`}>
                                <p className="text-sm font-medium leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className={`absolute top-3 right-3 ${colors.icon} hover:text-white transition-colors p-1 rounded-full hover:bg-white/10`}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Progress bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div
                                    className={`h-full ${colors.progress} animate-shrink-width`}
                                    style={{
                                        animation: `shrink ${notification.duration || 5000}ms linear forwards`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )
            })}

            <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrink-width {
          animation: shrink linear forwards;
        }
      `}</style>
        </div>
    )
}

export default NotificationToast
