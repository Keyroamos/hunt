import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Lock, Mail, LogIn, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../utils/api'

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)
    const navigate = useNavigate()

    // Redirect if already logged in as admin
    useEffect(() => {
        const token = localStorage.getItem('access_token')
        const isStaff = localStorage.getItem('is_staff') === 'true'
        if (token && isStaff) {
            navigate('/admin-portal/dashboard')
        }
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const { data } = await authAPI.login(formData.email, formData.password)

            // Save tokens immediately so they are available for the subsequent getCurrentUser call
            localStorage.setItem('access_token', data.access)
            localStorage.setItem('refresh_token', data.refresh)

            // Verify if user is staff
            // We use the raw axios call or a dedicated method if we want to avoid interceptors for a moment
            // But getCurrentUser works fine if we set headers
            const userRes = await authAPI.getCurrentUser()
            const user = userRes.data

            if (!user.is_staff && !user.is_superuser) {
                // Clear tokens if not staff
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                setError('Access Denied: This portal is reserved for administrators only.')
                setIsLoading(false)
                return
            }

            // Confirm staff status
            localStorage.setItem('is_staff', 'true')
            localStorage.setItem('user_type', 'admin')

            setIsSuccess(true)
            setTimeout(() => {
                navigate('/admin-portal/dashboard')
            }, 1500)

        } catch (err) {
            console.error('Admin login error:', err)
            setError(err.response?.data?.detail || 'Invalid identification credentials. Please verify your access level.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/3"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back to Home */}
                <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium group text-slate-400/80">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Platform
                </Link>

                <div className="bg-slate-900/50 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl shadow-black/50">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-orange-600 shadow-xl shadow-orange-500/20 mb-6 group transition-transform hover:scale-105">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Admin Portal</h1>
                        <p className="text-slate-400 font-medium">Verify your administrative identity to proceed.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm flex items-start gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Key (Email)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all font-medium"
                                        placeholder="admin@househunt.ke"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Security Pass (Password)</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all font-medium"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${isSuccess
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-white text-slate-900 hover:bg-orange-500 hover:text-white shadow-white/5 active:scale-95'
                                } disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isSuccess ? (
                                <>
                                    <Shield className="w-5 h-5" />
                                    <span>Access Granted</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>Authenticate</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
                        <p className="text-slate-500 text-xs font-medium">
                            Authorized personnel only. All access attempts are logged.
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-center gap-6">
                    <img src="/logo.png" alt="House Hunt" className="h-6 opacity-20 grayscale brightness-200" />
                </div>
            </motion.div>
        </div>
    )
}

export default AdminLogin
