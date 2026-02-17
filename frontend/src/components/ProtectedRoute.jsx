import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authAPI } from '../utils/api'

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const [loading, setLoading] = useState(true)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('access_token')
            if (!token) {
                setLoading(false)
                return
            }

            // Check localStorage cache first for instant feedback (optimistic)
            const cachedType = localStorage.getItem('user_type')
            if (cachedType && allowedRoles.includes(cachedType)) {
                // Optimistically allow, but verifying in background is safer. 
                // For now, let's trust localStorage for speed, and actual API calls in the page will fail if token is invalid/wrong scope.
                // However, for strict security, we should fetch user.
                // Let's verify with API to be sure.
            }

            try {
                const { data } = await authAPI.getCurrentUser()

                let userType = data.user_type
                if (data.is_staff || data.is_superuser) {
                    userType = 'admin'
                }

                localStorage.setItem('user_type', userType) // sync cache

                if (allowedRoles.length === 0 || allowedRoles.includes(userType)) {
                    setIsAuthorized(true)
                }
            } catch (error) {
                console.error('Auth verification failed', error)
                localStorage.removeItem('access_token')
            } finally {
                setLoading(false)
            }
        }

        verifyAuth()
    }, [allowedRoles])

    if (loading) {
        // Simple spinner if LoadingSkeleton doesn't exist
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const token = localStorage.getItem('access_token')
    if (!token) {
        const isAdminRoute = location.pathname.startsWith('/admin-portal')
        return <Navigate to={isAdminRoute ? "/admin-portal/login" : "/login"} state={{ from: location }} replace />
    }

    if (!isAuthorized) {
        // Redirect based on role? Or just generic access denied?
        // If I am a hunter trying to access landlord, go to explore
        const userType = localStorage.getItem('user_type')
        if (userType === 'hunter') {
            return <Navigate to="/explore" replace />
        }
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
