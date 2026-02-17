import { useState, useEffect } from 'react'
import {
    Users, Home, CreditCard, Shield, BarChart2, User,
    Settings, LogOut, Search, Filter, MoreHorizontal,
    CheckCircle2, XCircle, Clock, TrendingUp, UserPlus, MapPin,
    ArrowUpRight, ArrowDownRight, LayoutDashboard,
    Eye, MessageSquare, Trash2, Edit, Check, X, ShieldCheck,
    Lock, Mail, Phone, EyeOff, ShieldAlert, Activity, Download
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI, adminAPI, propertyAPI, paymentAPI, verificationAPI } from '../utils/api'

const AdminDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeSection = searchParams.get('tab') || 'overview'
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await authAPI.getCurrentUser()
                if (!data.is_staff) {
                    navigate('/')
                    return
                }
                setUser(data)
            } catch (error) {
                console.error('Failed to fetch user', error)
                navigate('/login')
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigate('/login')
    }

    const setActiveSection = (section) => {
        setSearchParams({ tab: section })
        if (window.innerWidth < 1024) setSidebarOpen(false)
    }

    const [showAddUserModal, setShowAddUserModal] = useState(false)
    const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
    const [showPropertyDetailsModal, setShowPropertyDetailsModal] = useState(false)
    const [showKYCDetailsModal, setShowKYCDetailsModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [selectedKYC, setSelectedKYC] = useState(null)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'properties', label: 'Properties', icon: Home },
        { id: 'revenue', label: 'Revenue', icon: CreditCard },
        { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
    ]

    const handleViewUser = (id) => {
        adminAPI.getUserDetails(id).then(({ data }) => {
            setSelectedUser(data)
            setShowUserDetailsModal(true)
        })
    }

    const handleViewProperty = (id) => {
        adminAPI.getPropertyDetails(id).then(({ data }) => {
            setSelectedProperty(data)
            setShowPropertyDetailsModal(true)
        })
    }

    const handleTogglePropertyStatus = async (id) => {
        try {
            await adminAPI.togglePropertyStatus(id)
            window.location.reload() // Refresh to show new status
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeleteProperty = async (id) => {
        if (window.confirm('Are you sure you want to delete this property?')) {
            try {
                await adminAPI.deleteProperty(id)
                window.location.reload()
            } catch (error) {
                console.error(error)
            }
        }
    }

    const handleUserAdded = () => {
        setShowAddUserModal(false)
        // Optionally refresh users section if it's active
        if (activeSection === 'users') {
            // We'll handle refresh via a key or signal if needed, but for now just a message
            alert('User created successfully')
            window.location.reload() // Simple way to refresh for now
        }
    }

    const setKYCAndShow = (doc) => {
        setSelectedKYC(doc)
        setShowKYCDetailsModal(true)
    }

    return (
        <div className="h-screen bg-[#F8FAFC] font-sans text-slate-900 flex overflow-hidden selection:bg-orange-100 selection:text-orange-900">
            {/* Elegant Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200/60 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full bg-gradient-to-b from-white via-white to-slate-50/50">
                    {/* Brand/Logo Area */}
                    <div className="p-8 pb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 group cursor-pointer">
                            <div className="relative">
                                <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center shadow-xl shadow-slate-900/10 group-hover:bg-orange-600 transition-all duration-300">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none group-hover:text-orange-600 transition-colors">HouseHunt</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Admin Portal</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 bg-slate-100 text-slate-500 rounded-xl lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
                        {/* Navigation Group */}
                        <div>
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                            <nav className="space-y-1">
                                {navItems.slice(0, 5).map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative ${activeSection === item.id
                                            ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/10'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 mr-3 hidden lg:block transition-transform duration-300 ${activeSection === item.id ? 'text-orange-400 scale-110' : 'text-slate-400 group-hover:text-slate-900'}`} />
                                        <span>{item.label}</span>
                                        {activeSection === item.id && (
                                            <div className="absolute right-4 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* System Group */}
                        <div>
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Platform</p>
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveSection('settings')}
                                    className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${activeSection === 'settings'
                                        ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/10'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                >
                                    <Settings className={`w-5 h-5 mr-3 transition-transform duration-300 ${activeSection === 'settings' ? 'text-orange-400 scale-110' : 'text-slate-400 group-hover:text-slate-900'}`} />
                                    <span>Settings</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Bottom User Area */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="p-4 bg-slate-50/80 backdrop-blur rounded-[24px] border border-slate-200/50">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-orange-500/20 uppercase ring-2 ring-white">
                                    {user?.full_name ? user.full_name.charAt(0) : user?.username?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || user?.username}</p>
                                    <p className="text-[10px] font-medium text-slate-500 truncate capitalize">{user?.user_type || 'Admin'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center px-4 py-2.5 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all duration-300 uppercase tracking-widest"
                            >
                                <LogOut className="w-3 h-3 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Glassmorphism Header & Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-100/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-100/20 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/3 -z-10"></div>

                <header className="h-20 lg:h-24 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-xl">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 mr-4 bg-white shadow-sm border border-slate-200 rounded-xl lg:hidden hover:rotate-90 transition-transform duration-300">
                            <LayoutDashboard className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-lg lg:text-2xl font-black text-slate-900 capitalize tracking-tight">{activeSection}</h2>
                            <p className="hidden sm:block text-[10px] lg:text-xs font-medium text-slate-500 mt-0.5">Welcome back to your dashboard overview.</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search platform analytics..."
                                className="pl-11 pr-6 py-2.5 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[18px] text-sm focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 outline-none w-48 lg:w-72 shadow-sm transition-all text-slate-700"
                            />
                        </div>
                        <div className="flex items-center p-1 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl lg:rounded-2xl">
                            <button className="p-2 lg:p-2.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg lg:rounded-xl transition-all relative">
                                <Clock className="w-4 h-4 lg:w-5 h-5" />
                                <span className="absolute top-2 lg:top-2.5 right-2 lg:right-2.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-orange-500 rounded-full border-2 border-white"></span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 scroll-smooth">
                    <div className="max-w-[1400px] mx-auto pt-4">
                        {activeSection === 'overview' && <OverviewSection onViewUser={handleViewUser} />}
                        {activeSection === 'users' && <UsersSection onAddUser={() => setShowAddUserModal(true)} onViewUser={handleViewUser} />}
                        {activeSection === 'properties' && (
                            <PropertiesSection
                                onViewProperty={handleViewProperty}
                                onToggleStatus={handleTogglePropertyStatus}
                                onDelete={handleDeleteProperty}
                            />
                        )}
                        {activeSection === 'revenue' && <RevenueSection />}
                        {activeSection === 'verifications' && <VerificationsSection onViewKYC={setKYCAndShow} />}
                        {activeSection === 'settings' && <SettingsSection user={user} />}
                    </div>
                </main>
            </div>

            {/* Modals */}
            {showAddUserModal && (
                <AddUserModal
                    onClose={() => setShowAddUserModal(false)}
                    onSuccess={handleUserAdded}
                />
            )}
            {showUserDetailsModal && selectedUser && (
                <UserDetailsModal
                    user={selectedUser}
                    onClose={() => setShowUserDetailsModal(false)}
                    onUpdate={() => {
                        setShowUserDetailsModal(false)
                        alert('Updated successfully')
                        window.location.reload()
                    }}
                />
            )}
            {showPropertyDetailsModal && selectedProperty && (
                <PropertyDetailsModal
                    property={selectedProperty}
                    onClose={() => setShowPropertyDetailsModal(false)}
                    onUpdate={() => {
                        setShowPropertyDetailsModal(false)
                        window.location.reload()
                    }}
                />
            )}
            {showKYCDetailsModal && selectedKYC && (
                <KYCDetailsModal
                    doc={selectedKYC}
                    onClose={() => setShowKYCDetailsModal(false)}
                    onReview={async (id, status, reason) => {
                        try {
                            await adminAPI.reviewVerification(id, { status, reason })
                            setShowKYCDetailsModal(false)
                            alert(`Verification ${status} successfully`)
                            window.location.reload()
                        } catch (e) {
                            alert('Action failed')
                        }
                    }}
                />
            )}
        </div>
    )
}

// --- Sub-sections ---

const OverviewSection = ({ onViewUser }) => {
    const [stats, setStats] = useState(null)
    const [activities, setActivities] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes] = await Promise.all([
                    adminAPI.getStats(),
                    adminAPI.getActivities()
                ])
                setStats(statsRes.data)
                setActivities(activitiesRes.data)
            } catch (error) {
                console.error('Failed to fetch admin dashboard data', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/50 animate-pulse rounded-3xl border border-slate-100"></div>
            ))}
        </div>
    )

    return (
        <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* High-Impact Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <StatsCard
                    title="Total Revenue"
                    value={`KES ${stats.revenue.total.toLocaleString()}`}
                    icon={CreditCard}
                    color="orange"
                    trend="+12.5%"
                    subtitle="Platform platform earnings"
                />
                <StatsCard
                    title="Active Users"
                    value={stats.users.total}
                    icon={Users}
                    color="blue"
                    trend="+5.2%"
                    subtitle="Landlords & Hunters"
                />
                <StatsCard
                    title="Total Listings"
                    value={stats.properties.total}
                    icon={Home}
                    color="emerald"
                    trend="+8.1%"
                    subtitle="Active property inventory"
                />
                <StatsCard
                    title="Identity Verification"
                    value={stats.verifications.pending}
                    icon={Shield}
                    color="rose"
                    alert={stats.verifications.pending > 0}
                    subtitle="Pending KYC approval"
                />
            </div>
            {/* Dashboard Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                {/* Visualizer - Main Content Area */}
                <div className="lg:col-span-2 space-y-6 md:space-y-10">
                    <div className="bg-white p-6 md:p-12 rounded-[40px] md:rounded-[56px] border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Pulse</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Real-time platform revenue activity</p>
                            </div>
                            <button className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-[11px] font-black text-slate-900 uppercase tracking-widest rounded-xl transition-all border border-slate-200/50">
                                View Full Report
                            </button>
                        </div>
                        <div className="space-y-3">
                            {activities.payments.map(pay => (
                                <div key={pay.id} className="flex items-center justify-between p-5 rounded-[24px] hover:bg-slate-50/80 transition-all duration-300 group/item border border-transparent hover:border-slate-100">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover/item:scale-110">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-none">{pay.user_name || pay.user}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{pay.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">KES {pay.amount.toLocaleString()}</p>
                                        <div className="flex items-center justify-end mt-1 space-x-2">
                                            <span className="text-[10px] font-medium text-slate-400">{new Date(pay.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${pay.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {pay.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stylish Registration Feed */}
                <div className="space-y-6 md:space-y-10">
                    <div className="bg-slate-900 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-2xl shadow-slate-900/20 h-full overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>

                        <div className="relative z-10 flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Cloud Feed</h3>
                                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Latest user onboards</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                                <Activity className="w-5 h-5 animate-pulse" />
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            {activities.users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => onViewUser(u.id)}
                                    className="flex items-center justify-between p-4 rounded-[20px] bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group/user border border-white/5"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 md:w-11 h-10 md:h-11 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-lg transition-transform group-hover/user:scale-105 ${u.type === 'landlord' ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-blue-500 text-white shadow-blue-500/20'}`}>
                                            {u.username.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white leading-none text-sm md:text-base">{u.full_name || u.username}</p>
                                            <p className="text-[10px] font-black text-slate-400 capitalize mt-1.5">{u.type}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-2 rounded-xl group-hover/user:bg-white/20 transition-colors">
                                        <ArrowUpRight className="w-3 md:w-4 h-3 md:h-4 text-slate-300" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="relative z-10 w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5">
                            Show Activity Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const UsersSection = ({ onAddUser, onViewUser }) => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const { data } = await adminAPI.getUsers()
            setUsers(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (id) => {
        try {
            await adminAPI.toggleUserStatus(id)
            setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
        } catch (error) {
            console.error(error)
        }
    }

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl border border-slate-100"></div>
            ))}
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="text-center lg:text-left">
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">Identity Registry</h3>
                    <p className="text-xs lg:text-sm font-medium text-slate-500 mt-1">Manage platform users and access levels</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-6 py-3.5 bg-white border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all w-full sm:w-64 lg:w-80 shadow-sm text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={onAddUser}
                        className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 group"
                    >
                        <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>Provision New User</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200/60 overflow-hidden shadow-sm shadow-slate-200/40">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Information</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform Role</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Joining Date</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm border-2 border-white ${u.user_type === 'landlord' ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'}`}>
                                                {u.username.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-black text-slate-900 leading-none">{u.full_name || u.username}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-1.5">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border ${u.user_type === 'landlord' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {u.user_type}
                                            </span>
                                            {u.is_staff && (
                                                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-1 ml-1 flex items-center">
                                                    <Shield className="w-2.5 h-2.5 mr-1" /> Admin Access
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border ${u.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${u.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{u.is_active ? 'Active' : 'Suspended'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                        {new Date(u.date_joined || u.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end space-x-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(u.id)}
                                                className={`p-2.5 rounded-xl transition-all border ${u.is_active ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100' : 'text-emerald-500 hover:bg-emerald-50 border-transparent hover:border-emerald-100'}`}
                                                title={u.is_active ? 'Suspend User' : 'Restore User'}
                                            >
                                                {u.is_active ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                            </button>
                                            <button
                                                onClick={() => onViewUser(u.id)}
                                                className="p-2.5 text-slate-500 hover:text-white hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:shadow-xl hover:shadow-slate-900/20"
                                                title="View Detailed Profile"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight">Access Denied</h4>
                        <p className="text-sm font-medium text-slate-400 mt-1">No users found matching your current filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const PropertiesSection = ({ onViewProperty, onToggleStatus, onDelete }) => {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const { data } = await adminAPI.getProperties()
                setProperties(data.results || data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchProperties()
    }, [])

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[400px] bg-white/50 animate-pulse rounded-[32px] border border-slate-100"></div>
            ))}
        </div>
    )

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Global Inventory</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Monitor and moderate all property listings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map(p => (
                    <div key={p.id} className="group relative bg-white rounded-[32px] border border-slate-200/60 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2 overflow-hidden flex flex-col">
                        <div className="aspect-[4/3] relative overflow-hidden">
                            {p.images && p.images[0] ? (
                                <img
                                    src={p.images[0].image}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={p.title}
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Home className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${p.is_published ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/90 text-slate-300'}`}>
                                    {p.is_published ? 'Published' : 'Hidden'}
                                </span>
                                {p.is_promoted && (
                                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-orange-500/90 text-white backdrop-blur-md border border-white/20 shadow-lg">
                                        Promoted
                                    </span>
                                )}
                            </div>
                            <div className="absolute bottom-4 right-4 flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-300">
                                <button
                                    onClick={() => onViewProperty(p.id)}
                                    className="p-3 bg-white text-slate-900 rounded-xl shadow-xl hover:bg-slate-900 hover:text-white transition-all ring-1 ring-black/5"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onToggleStatus(p.id)}
                                    className={`p-3 rounded-xl shadow-xl transition-all ${p.is_published ? 'bg-white text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-white text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                >
                                    {p.is_published ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => onDelete(p.id)}
                                    className="p-3 bg-white text-rose-600 rounded-xl shadow-xl hover:bg-rose-600 hover:text-white transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-7 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{p.property_type}</span>
                                    <span className="text-xl font-black text-slate-900">KES {parseFloat(p.rent_per_month).toLocaleString()}</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 leading-tight mb-2 line-clamp-1">{p.title}</h4>
                                <p className="text-sm font-medium text-slate-500 flex items-center">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    {p.location}
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                        {p.owner_name?.charAt(0) || 'L'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 leading-none">{p.owner_name || 'Landlord'}</p>
                                        <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Verified Owner</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-center group-hover:scale-105 transition-transform">
                                        <p className="text-[10px] font-black text-slate-900 leading-none">{p.bedrooms}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Beds</p>
                                    </div>
                                    <div className="text-center group-hover:scale-105 transition-transform delay-75">
                                        <p className="text-[10px] font-black text-slate-900 leading-none">{p.bathrooms}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Baths</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const RevenueSection = () => {
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const { data } = await adminAPI.getRevenueReport()
                setReport(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchReport()
    }, [])

    if (loading) return (
        <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[32px] border border-slate-100"></div>
                ))}
            </div>
            <div className="h-96 bg-white/50 animate-pulse rounded-[48px] border border-slate-100"></div>
        </div>
    )

    if (!report) return (
        <div className="flex flex-col items-center justify-center p-8 md:p-20 bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-rose-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                <XCircle className="w-8 md:w-10 h-8 md:h-10" />
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2">Financial Engine Offline</h3>
            <p className="text-xs md:text-sm font-medium text-slate-500 text-center max-w-xs px-4">We encountered an error while synthesizing the revenue report. Please verify backend connectivity.</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-8 px-8 py-4 bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all"
            >
                Retry Operation
            </button>
        </div>
    )

    const maxChartValue = Math.max(...(report?.trends?.map(t => t.amount) || [1000]))

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Advanced Financial Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-orange-100 transition-colors"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 relative z-10">Historical Gross</p>
                    <div className="flex items-baseline space-x-2 relative z-10">
                        <span className="text-sm font-black text-slate-400">KES</span>
                        <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{report.overview.total_gross.toLocaleString()}</h4>
                    </div>
                    <div className="mt-6 flex items-center space-x-2 text-emerald-500 relative z-10">
                        <div className="p-1 bg-emerald-50 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Platform Total</span>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/20 rounded-full blur-[60px] -ml-16 -mb-16"></div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Monthly Pulse</p>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-black text-white/40">KES</span>
                        <h4 className="text-3xl font-black text-white leading-none tracking-tight">{report.overview.monthly_gross.toLocaleString()}</h4>
                    </div>
                    <div className="mt-6 flex items-center space-x-2 text-orange-400">
                        <div className="p-1 bg-white/10 rounded-lg animate-pulse">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">+{report.overview.growth_rate}% Growth</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Unit Yield</p>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-black text-slate-400">KES</span>
                        <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{Math.round(report.overview.avg_value).toLocaleString()}</h4>
                    </div>
                    <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Per Transaction Avg</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Ledger Volume</p>
                    <h4 className="text-3xl font-black text-slate-900 leading-none tracking-tight">{report.overview.transaction_count}</h4>
                    <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Successful Invoices</p>
                </div>
            </div>

            {/* Performance Visualizer */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                <div className="xl:col-span-2 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center justify-between mb-8 md:mb-12">
                        <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Revenue Stream Velocity</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Real-time projection (Last 30 Days)</p>
                        </div>
                        <div className="flex space-x-2">
                            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                            <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between w-full space-x-2 px-2 relative">
                        {/* Trend Bars */}
                        {report.trends?.map((t, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative min-w-[4px]">
                                <div
                                    className="w-full bg-slate-100 rounded-lg group-hover:bg-slate-900 transition-all duration-300 relative"
                                    style={{ height: `${(t.amount / maxChartValue) * 100}%` }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                        KES {t.amount.toLocaleString()}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                    </div>
                                </div>
                                <div className="h-1 w-full mt-4 bg-slate-50 rounded-full group-hover:bg-orange-400 transition-colors"></div>
                            </div>
                        ))}
                        {report.trends?.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-black uppercase tracking-[0.3em]">No Temporal Data Points</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
                    <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-8">Revenue Ecosystem</h4>
                    <div className="space-y-6 flex-1">
                        {report.distribution.map((d, i) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-end mb-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{d.type.replace('_', ' ')}</p>
                                    <p className="text-sm font-black text-slate-900 leading-none">KES {d.total.toLocaleString()}</p>
                                </div>
                                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-slate-900' : i === 1 ? 'bg-orange-500' : 'bg-slate-300'}`}
                                        style={{ width: `${(d.total / report.overview.total_gross) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{d.count} Successful Operations</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Engine</span>
                        </div>
                        <button className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] hover:text-orange-600 transition-colors">Full Audit &rarr;</button>
                    </div>
                </div>
            </div>

            {/* Ledger Operations Table */}
            < div className="space-y-6" >
                <div className="flex items-center justify-between px-4">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Financial Ledger</h4>
                    <button className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
                <div className="bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Trace</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payee Identity</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monetary Value</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recorded At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.recent.map(pay => (
                                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-10 py-6">
                                            <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                #{pay.ref || pay.id.toString().padStart(6, '0')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 shadow-sm border border-orange-200">
                                                    {pay.user.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">{pay.user}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{pay.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <p className="text-sm font-black text-slate-900">KES {parseFloat(pay.amount).toLocaleString()}</p>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-widest border border-orange-100">
                                                {pay.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-right font-medium text-slate-500 text-xs">
                                            {new Date(pay.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >
        </div >
    )
}

const VerificationsSection = ({ onViewKYC }) => {
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const { data } = await verificationAPI.getStatus()
                setDocs(data.results || data || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchDocs()
    }, [])

    const handleReview = async (id, status, reason = '') => {
        try {
            await adminAPI.reviewVerification(id, { status, reason })
            setDocs(docs.map(d => d.id === id ? { ...d, status, rejection_reason: reason } : d))
            alert(`Verification ${status} successfully`)
        } catch (error) {
            console.error(error)
            alert('Action failed')
        }
    }

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[32px] border border-slate-100"></div>
            ))}
        </div>
    )

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">KYC Trust Center</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Verify user identities to maintain platform safety</p>
            </div>

            {docs.filter(d => d.status === 'pending').length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                    {docs.filter(d => d.status === 'pending').map(doc => (
                        <div key={doc.id} className="group relative bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-orange-100/50 shadow-2xl shadow-orange-500/5 overflow-hidden flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Visual ID Card Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-[60px] -mr-16 -mt-16"></div>

                            <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto rounded-[32px] overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                {doc.id_document.toLowerCase().endsWith('.pdf') ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                            <ShieldCheck className="w-8 h-8 text-orange-500" />
                                        </div>
                                        <p className="text-sm font-black text-slate-800">DOCUMENTARY PROOF</p>
                                        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase">Protected PDF Document</p>
                                        <a href={doc.id_document} target="_blank" rel="noreferrer" className="mt-6 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-colors">Open Vault</a>
                                    </div>
                                ) : (
                                    <img src={doc.id_document} className="w-full h-full object-cover" alt="KYC Doc" />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="px-3 py-1.5 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-xl">Action Required</span>
                                        <span className="text-[10px] font-black font-mono text-slate-300">ID #{doc.id.toString().padStart(6, '0')}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-slate-900/20">
                                            {doc.user_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 leading-none">{doc.user_name}</h4>
                                            <p className="text-xs font-bold text-orange-600 mt-2 flex items-center capitalize">
                                                <User className="w-3 h-3 mr-1" /> {doc.id_type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onViewKYC(doc)}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Number</p>
                                        <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">{doc.id_number}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <button
                                        onClick={() => onViewKYC(doc)}
                                        className="w-full py-3.5 md:py-4 bg-slate-900 text-white text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> Inspect Data
                                    </button>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <button
                                            onClick={() => handleReview(doc.id, 'approved')}
                                            className="py-3.5 md:py-4 bg-emerald-500 text-white text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Certify
                                        </button>
                                        <button
                                            onClick={() => {
                                                const r = prompt('Reason for rejection?')
                                                if (r) handleReview(doc.id, 'rejected', r)
                                            }}
                                            className="py-3.5 md:py-4 bg-slate-100 text-slate-900 text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-[32px] border border-slate-200/60 overflow-x-auto shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Code</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {docs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-slate-900">{doc.user_name}</p>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 capitalize">{doc.id_type}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <button onClick={() => onViewKYC(doc)} className="inline-flex items-center text-orange-500 text-[10px] font-black uppercase tracking-widest hover:text-orange-600 group">
                                        Inspect ID Asset <ArrowUpRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </button>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : doc.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                        {doc.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right text-xs font-bold text-slate-400">
                                    {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const SettingsSection = ({ user }) => (
    <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage global platform parameters and your admin profile</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-slate-900 rounded-bl-[60px] md:rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left">
                        <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-orange-500/20">
                            {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-900 mb-1">{user?.full_name || user?.username}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start">
                                <Shield className="w-3 h-3 mr-1.5" /> Platform Orchestrator
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
                        <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Primary Email</p>
                            <p className="text-sm font-black text-slate-900 truncate">{user?.email}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Access Tier</p>
                            <p className="text-sm font-black text-slate-900">Full Orchestration</p>
                        </div>
                    </div>

                    <button className="w-full mt-8 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2">
                        <Edit className="w-4 h-4" /> Update Identity Data
                    </button>
                </div>

                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[32px] border border-slate-200/60 border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutDashboard className="w-8 h-8 text-slate-300" />
                    </div>
                    <h5 className="font-black text-slate-800">Advanced Engine Settings</h5>
                    <p className="text-xs font-medium text-slate-500 mt-2 max-w-xs mx-auto">Modules for fee management, automated emails, and security throttling are currently locked.</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden ring-4 ring-orange-500/10">
                    <div className="relative z-10">
                        <ShieldAlert className="w-10 h-10 text-orange-500 mb-6" />
                        <h5 className="text-xl font-black mb-2">Security Shield</h5>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">System-wide monitoring is active. All administrative actions are cryptographically logged for audit.</p>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Node Status: Optimal</span>
                        </div>
                    </div>
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    </div>
                </div>

                <button className="w-full py-5 bg-white border-2 border-slate-900/5 text-slate-900 text-[11px] font-black uppercase tracking-widest rounded-[32px] hover:bg-slate-50 hover:border-slate-900/10 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Export System Logs
                </button>
            </div>
        </div>
    </div>
)

const StatsCard = ({ title, value, icon: Icon, color, trend, alert, subtitle }) => {
    const colorConfigs = {
        blue: {
            bg: 'bg-blue-500/10',
            text: 'text-blue-600',
            icon: 'bg-blue-600',
            border: 'border-blue-100/50',
            shadow: 'shadow-blue-500/10'
        },
        orange: {
            bg: 'bg-orange-500/10',
            text: 'text-orange-600',
            icon: 'bg-orange-600',
            border: 'border-orange-100/50',
            shadow: 'shadow-orange-500/10'
        },
        emerald: {
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-600',
            icon: 'bg-emerald-600',
            border: 'border-emerald-100/50',
            shadow: 'shadow-emerald-500/10'
        },
        rose: {
            bg: 'bg-rose-500/10',
            text: 'text-rose-600',
            icon: 'bg-rose-600',
            border: 'border-rose-100/50',
            shadow: 'shadow-rose-500/10'
        },
    }

    const cfg = colorConfigs[color]

    return (
        <div className={`group relative bg-white p-7 rounded-[32px] border ${alert ? 'border-rose-200' : 'border-slate-200/60'} shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 overflow-hidden h-full flex flex-col justify-between`}>
            {/* Background Accent */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${cfg.bg}`}></div>

            <div className="relative">
                <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ${cfg.icon} ${cfg.shadow} transition-transform duration-500 group-hover:rotate-12`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {trend && (
                        <div className="flex flex-col items-end">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {trend}
                            </span>
                            <span className="text-[9px] font-medium text-slate-400 mt-1">vs last month</span>
                        </div>
                    )}
                    {alert && (
                        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-rose-50 rounded-xl border border-rose-100 animate-pulse">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Urgent</span>
                        </div>
                    )}
                </div>

                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 drop-shadow-sm">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-500">{subtitle}</span>
                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight className="w-3 h-3" />
                </div>
            </div>
        </div>
    )
}

export const AddUserModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        user_type: 'hunter',
        phone: '',
        is_verified: false,
        is_staff: false
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await adminAPI.createUser(formData)
            onSuccess()
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.error || 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Provision Identity</h3>
                        <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Manual account generation for platform nodes</p>
                    </div>
                    <button onClick={onClose} className="p-2 md:p-3 hover:bg-white rounded-xl md:rounded-2xl transition-all shadow-sm ring-1 ring-slate-200 group">
                        <X className="w-5 md:w-6 h-5 md:h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 h-full max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Authority</label>
                            <input
                                required
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all text-sm font-bold"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="e.g. jdoe_admin"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all text-sm font-bold"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Johnathon Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verified Email Entry</label>
                        <input
                            required
                            type="email"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all text-sm font-bold"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="j.doe@platform.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Credentials</label>
                            <input
                                required
                                type="password"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all text-sm font-bold"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform Role</label>
                            <select
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/50 transition-all text-sm font-black appearance-none"
                                value={formData.user_type}
                                onChange={e => setFormData({ ...formData, user_type: e.target.value })}
                            >
                                <option value="hunter">HOUSE HUNTER</option>
                                <option value="landlord">PLATFORM LANDLORD</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.is_verified ? 'bg-emerald-50 border-emerald-500/20' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                            <div className="flex items-center space-x-3">
                                <ShieldCheck className={`w-5 h-5 ${formData.is_verified ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${formData.is_verified ? 'text-emerald-700' : 'text-slate-500'}`}>Pre-Verify</span>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                checked={formData.is_verified}
                                onChange={e => setFormData({ ...formData, is_verified: e.target.checked })}
                            />
                        </label>

                        <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.is_staff ? 'bg-blue-50 border-blue-500/20' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                            <div className="flex items-center space-x-3">
                                <Lock className={`w-5 h-5 ${formData.is_staff ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className={`text-[11px] font-black uppercase tracking-widest ${formData.is_staff ? 'text-blue-700' : 'text-slate-500'}`}>Sys Admin</span>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.is_staff}
                                onChange={e => setFormData({ ...formData, is_staff: e.target.checked })}
                            />
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Executing...' : 'Generate Identity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export const UserDetailsModal = ({ user, onClose, onUpdate }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] border border-white/20">
                {/* Immersive Profile Header */}
                <div className="bg-slate-900 p-6 md:p-12 text-white relative overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                    <button onClick={onClose} className="absolute top-4 md:top-8 right-4 md:right-8 z-20 p-2 md:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl transition-all group">
                        <X className="w-5 h-5 md:w-6 h-6 group-hover:rotate-90 transition-transform" />
                    </button>

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left">
                        <div className="w-20 md:w-28 h-20 md:h-28 rounded-2xl md:rounded-[36px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl md:text-4xl font-black shadow-2xl shadow-orange-600/40 border-4 border-white/10 md:rotate-3 transition-transform hover:rotate-0 duration-500">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 mb-2">
                                <h3 className="text-2xl md:text-4xl font-black tracking-tight">{user.full_name || user.username}</h3>
                                {user.is_verified && <ShieldCheck className="w-6 h-6 md:w-8 h-8 text-emerald-400" />}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3">
                                <span className="px-2 md:px-3 py-1 bg-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg backdrop-blur-sm border border-white/5">@{user.username}</span>
                                <span className={`px-2 md:px-3 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border backdrop-blur-sm ${user.user_type === 'landlord' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/20'}`}>{user.user_type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 relative z-10">
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Inventory Assets</p>
                            <p className="text-3xl font-black">{user.properties_count || 0}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Ledger Entry</p>
                            <p className="text-3xl font-black">{user.payments_count || 0}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 backdrop-blur-md">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 opacity-60">Communication</p>
                            <p className="text-3xl font-black">{user.inquiries_count || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 bg-gradient-to-b from-white to-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Metadata</h4>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4 group p-1">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all duration-300">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entry Endpoint</p>
                                        <p className="text-sm font-black text-slate-800">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 group p-1">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all duration-300">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telecom Root</p>
                                        <p className="text-sm font-black text-slate-800">{user.phone || 'NO_PH_DATA'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Trust Analytics</h4>
                            <div className="space-y-3 p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Onboarded</span>
                                    <span className="text-[11px] font-black text-slate-900">{new Date(user.date_joined).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Privilege</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${user.is_staff ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                        {user.is_staff ? 'ADMIN_ORCHESTRATOR' : 'STANDARD_CLIENT'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Code</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {user.is_active ? 'ACTIVE_REACHABLE' : 'SYSTEM_SUSPENDED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {user.kyc_details && (
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Evidence</h4>
                            <div className="p-6 md:p-8 bg-slate-900 rounded-[32px] md:rounded-[40px] text-white border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-orange-600/30 transition-all"></div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-4 md:space-x-6">
                                        <div className="w-12 md:w-16 h-12 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                            <ShieldCheck className="w-6 md:w-8 h-6 md:h-8 text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Official Credential</p>
                                            <p className="text-base md:text-xl font-black truncate max-w-[150px] md:max-w-none">{user.kyc_details.id_type?.toUpperCase().replace('_', ' ')}</p>
                                            <p className="text-[10px] md:text-xs font-bold text-orange-400 mt-1">CODE: {user.kyc_details.id_number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(user.kyc_details.id_document, '_blank')}
                                        className="w-full md:w-auto px-6 py-4 bg-white/10 hover:bg-white text-[11px] font-black text-white hover:text-slate-900 uppercase tracking-widest rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> Audit Asset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-4 md:gap-6">
                    <button
                        onClick={() => {
                            if (window.confirm('IRREVERSIBLE ACTION: Purge this identity from platform registry?')) {
                                adminAPI.toggleUserStatus(user.id).then(onUpdate)
                            }
                        }}
                        className="p-5 text-rose-500 hover:bg-rose-50 rounded-3xl transition-all border-2 border-transparent hover:border-rose-100 group"
                    >
                        <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                        onClick={onUpdate}
                        className="flex-1 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[28px] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 group"
                    >
                        <Edit className="w-5 h-5 transition-transform group-hover:-rotate-12" />
                        <span>Override Profile Constraints</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

const KYCDetailsModal = ({ doc, onClose, onReview }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-4xl rounded-[56px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col h-[85vh] border border-white/20">
                <div className="bg-slate-900 p-6 md:p-10 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 md:space-x-4 mb-2">
                            <span className="px-2 md:px-3 py-1 bg-white/10 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5">KYC_INSPECTION</span>
                            <span className={`px-2 md:px-3 py-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border ${doc.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : doc.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                                STATUS_{doc.status.toUpperCase()}
                            </span>
                        </div>
                        <h3 className="text-xl md:text-3xl font-black tracking-tight line-clamp-1">{doc.user_name}</h3>
                    </div>

                    <button onClick={onClose} className="relative z-10 p-3 md:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl md:rounded-[24px] text-white transition-all group border border-white/10">
                        <X className="w-5 md:w-6 h-5 md:h-6 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Document Preview */}
                    <div className="flex-[1.5] bg-slate-100 p-4 md:p-8 flex items-center justify-center border-b lg:border-r border-slate-100 h-[300px] lg:h-auto">
                        <div className="w-full h-full rounded-3xl md:rounded-[40px] overflow-hidden bg-white shadow-2xl border-4 border-white flex items-center justify-center relative">
                            {doc.id_document.toLowerCase().endsWith('.pdf') ? (
                                <div className="text-center p-6 md:p-12">
                                    <ShieldCheck className="w-12 md:w-24 h-12 md:h-24 text-slate-200 mx-auto mb-4 md:mb-6" />
                                    <h4 className="text-base md:text-xl font-black text-slate-800 mb-1 md:mb-2 text-center">Secure PDF</h4>
                                    <p className="hidden md:block text-sm text-slate-500 mb-8 max-w-xs mx-auto text-center">Open it in a secure environment for full inspection.</p>
                                    <a href={doc.id_document} target="_blank" rel="noreferrer" className="px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10">Decrypt & Open</a>
                                </div>
                            ) : (
                                <img src={doc.id_document} className="w-full h-full object-contain" alt="Identity Asset" />
                            )}
                        </div>
                    </div>

                    {/* Meta Info & Actions */}
                    <div className="flex-1 p-6 md:p-12 flex flex-col space-y-8 md:space-y-10 overflow-y-auto bg-slate-50/30">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Credential Details</h4>
                            <div className="space-y-6">
                                <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Classification</p>
                                    <p className="text-lg font-black text-slate-900 capitalize">{doc.id_type.replace('_', ' ')}</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Standardized Index</p>
                                    <p className="text-lg font-black text-slate-900 font-mono tracking-tighter">{doc.id_number}</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Timestamp</p>
                                    <p className="text-lg font-black text-slate-900">{new Date(doc.uploaded_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {doc.status === 'pending' && (
                            <div className="mt-auto pt-10 border-t border-slate-200 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Adjudication Console</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => onReview(doc.id, 'approved')}
                                        className="py-5 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-3xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
                                    >
                                        <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                        Authorize Identity
                                    </button>
                                    <button
                                        onClick={() => {
                                            const r = prompt('Specify rejection reason:')
                                            if (r) onReview(doc.id, 'rejected', r)
                                        }}
                                        className="py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-3xl hover:bg-rose-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group"
                                    >
                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                        Recall Application
                                    </button>
                                </div>
                            </div>
                        )}

                        {doc.status === 'rejected' && doc.rejection_reason && (
                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Rejection Log</p>
                                <p className="text-sm font-bold text-rose-900">{doc.rejection_reason}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const PropertyDetailsModal = ({ property, onClose, onUpdate }) => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await adminAPI.getPropertyDetails(property.id)
                setStats(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [property.id])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-700">
            <div className="bg-white w-full max-w-5xl rounded-[56px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 flex flex-col h-[92vh] border border-white/20">
                {/* Immersive Gallery Header */}
                <div className="relative h-[30%] md:h-[45%] group shrink-0">
                    <div className="absolute inset-0 bg-slate-200 overflow-hidden">
                        {property.images?.length > 0 ? (
                            <img src={property.images[0].image} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <Home className="w-20 h-20 text-slate-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                    </div>

                    <div className="absolute top-6 md:top-10 inset-x-6 md:inset-x-10 flex justify-between items-start z-10">
                        <div className="flex gap-2">
                            <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${property.is_published ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                                {property.is_published ? 'NODE_ONLINE' : 'DRAFT_MODE'}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-2.5 md:p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl md:rounded-[24px] text-white transition-all group border border-white/10">
                            <X className="w-5 md:w-6 h-5 md:h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="absolute bottom-6 md:bottom-12 inset-x-6 md:inset-x-12 z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-2 md:space-y-3 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start space-x-3 text-white/60">
                                    <MapPin className="w-3 md:w-4 h-3 md:h-4" />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest truncate">{property.location}, {property.county}</span>
                                </div>
                                <h3 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight line-clamp-2 md:line-clamp-none">{property.title}</h3>
                            </div>
                            <div className="text-center md:text-right shrink-0">
                                <p className="text-[9px] md:text-xs font-black text-white/60 uppercase tracking-widest mb-0.5 md:mb-1">Valuation</p>
                                <p className="text-2xl md:text-4xl font-black text-white">KES {property.rent?.toLocaleString()}<span className="text-base md:text-xl opacity-60 font-medium">/mo</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/30">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 border-b md:border-r border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Space Matrix</p>
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <Home className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900">{property.bedrooms} BDRM</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">{property.property_type}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ownership</p>
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900 truncate max-w-[120px]">{property.owner?.username}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Registered Agent</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Audit Date</p>
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900">{new Date(property.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Genesis Entry</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                                Detailed Architecture Description
                                <div className="flex-1 h-px bg-slate-100 ml-6"></div>
                            </h4>
                            <p className="text-slate-600 leading-relaxed font-medium">
                                {property.description || 'No extended description available for this asset entry in the registry.'}
                            </p>
                        </div>

                        {stats?.inquiries?.length > 0 && (
                            <div>
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                                    Network Interactions
                                    <div className="flex-1 h-px bg-slate-100 ml-6"></div>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {stats.inquiries.map(inq => (
                                        <div key={inq.id} className="p-6 bg-white border border-slate-100 rounded-[28px] flex items-center justify-between group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{inq.user_name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="w-full md:w-80 p-8 md:p-12 bg-white flex flex-col shrink-0">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 md:mb-8">Asset Control</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                            <button
                                onClick={() => {
                                    adminAPI.togglePropertyStatus(property.id).then(onUpdate)
                                }}
                                className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[28px] text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center space-x-3 border ${property.is_published ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                            >
                                {property.is_published ? (
                                    <><EyeOff className="w-4 h-4" /> <span>Shadow Asset</span></>
                                ) : (
                                    <><Eye className="w-4 h-4" /> <span>Deploy Asset</span></>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('PROTOCOL ALERT: Are you certain you want to purge this asset?')) {
                                        adminAPI.deleteProperty(property.id).then(onUpdate)
                                    }
                                }}
                                className="w-full py-4 md:py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl md:rounded-[28px] text-[11px] font-black uppercase tracking-[0.15em] hover:bg-rose-100 transition-all flex items-center justify-center space-x-3"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Terminate Record</span>
                            </button>
                        </div>

                        <div className="mt-8 md:mt-auto space-y-6">
                            <div className="p-6 bg-slate-900 rounded-[28px] md:rounded-[32px] text-white">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Registry Identity</p>
                                <p className="text-xs font-mono text-white/60 mb-2 truncate">UUID: {property.id}</p>
                                <div className="flex items-center gap-2 text-[10px] font-black text-orange-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                                    FULLY_SYNCHRONIZED
                                </div>
                            </div>
                            <button className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:bg-slate-800 hover:-translate-y-1 transition-all">
                                Update Data Asset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
