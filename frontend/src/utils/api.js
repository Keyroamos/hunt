import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/token/')) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)
        originalRequest.headers.Authorization = `Bearer ${access}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API methods
export const authAPI = {
  login: (email, password) => api.post('/token/', { username: email, password }),
  register: (data) => api.post('/users/', data),
  getCurrentUser: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
  updatePassword: (data) => api.post('/users/set_password/', data),
  requestPasswordReset: (email) => api.post('/password-reset/request/', { email }),
  validateResetToken: (uid, token) => api.get(`/password-reset/validate/${uid}/${token}/`),
  confirmPasswordReset: (uid, token, new_password) => api.post('/password-reset/confirm/', { uid, token, new_password }),
}

export const propertyAPI = {
  getAll: (params) => api.get('/properties/', { params }),
  getMapPins: (params) => api.get('/properties/map/', { params }),
  get: (id) => api.get(`/properties/${id}/`),
  create: (data) => api.post('/properties/', data),
  update: (id, data) => api.patch(`/properties/${id}/`, data),
  delete: (id) => api.delete(`/properties/${id}/`),
  incrementViews: (id) => api.post(`/properties/${id}/increment_views/`),
  getStats: (id) => api.get(`/properties/${id}/stats/`),
  togglePublish: (id) => api.post(`/properties/${id}/toggle_publish/`),
  uploadImages: (id, formData) => api.post(`/properties/${id}/upload_images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (id, imageId) => api.post(`/properties/${id}/delete_image/`, { image_id: imageId }),
  setPrimaryImage: (id, imageId) => api.post(`/properties/${id}/set_primary_image/`, { image_id: imageId }),
  promoteProperty: (id, data) => api.post(`/properties/${id}/promote_property/`, data),
  verifyPromotion: (reference) => api.post('/properties/verify_promotion/', { reference }),
}

export const paymentAPI = {
  getAll: () => api.get('/payments/'),
  create: (data) => api.post('/payments/', data),
  initiate: (data) => api.post('/payments/initiate/', data),
  verifyAccount: (data) => api.post('/payments/verify_account/', data),
  contactAccessPayment: (data) => api.post('/payments/contact_access_payment/', data),
  verifyCallback: (reference) => api.post('/payments/verify_callback/', { reference }),
}

export const verificationAPI = {
  getStatus: () => api.get('/verification/'),
  uploadDocument: (formData) => api.post('/verification/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const favoriteAPI = {
  getAll: () => api.get('/favorites/'),
  add: (propertyId) => api.post('/favorites/', { property: propertyId }),
  remove: (id) => api.delete(`/favorites/${id}/`),
}

export const inquiryAPI = {
  getAll: (params) => api.get('/inquiries/', { params }),
  create: (data) => api.post('/inquiries/', data),
  reply: (id, content) => api.post(`/inquiries/${id}/reply/`, { content }),
  markRead: (id) => api.post(`/inquiries/${id}/mark_read/`),
}

export const messageAPI = {
  getAll: (inquiryId) => api.get('/messages/', { params: { inquiry: inquiryId } }),
  create: (data) => api.post('/messages/', data),
}

export const adminAPI = {
  getStats: () => api.get('/admin-dashboard/stats/'),
  getActivities: () => api.get('/admin-dashboard/recent_activities/'),
  getUsers: () => api.get('/admin-dashboard/all_users/'),
  createUser: (data) => api.post('/admin-dashboard/create_user/', data),
  getUserDetails: (id) => api.get(`/admin-dashboard/${id}/user_details/`),
  toggleUserStatus: (id) => api.post(`/admin-dashboard/${id}/toggle_user_status/`),
  verifyUser: (id) => api.post(`/admin-dashboard/${id}/verify_user/`),
  reviewVerification: (docId, data) => api.post(`/admin-dashboard/${docId}/review_verification/`, data),
  getProperties: () => api.get('/admin-dashboard/all_properties/'),
  togglePropertyStatus: (id) => api.post(`/admin-dashboard/${id}/toggle_property_status/`),
  deleteProperty: (id) => api.delete(`/admin-dashboard/${id}/delete_property/`),
  getPropertyDetails: (id) => api.get(`/admin-dashboard/${id}/property_admin_details/`),
  getRevenueReport: () => api.get('/admin-dashboard/revenue_report/'),
}
