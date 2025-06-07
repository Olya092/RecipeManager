import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isLoggedIn = computed(() => user.value !== null && token.value !== null)

  // Set up axios interceptor to include token in requests
  const setupAxiosInterceptor = () => {
    axios.interceptors.request.use(
      (config) => {
        if (token.value) {
          config.headers.Authorization = `Bearer ${token.value}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token is invalid or expired
          logout()
        }
        return Promise.reject(error)
      }
    )
  }

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email: credentials.email,
        password: credentials.password
      })

      if (response.data.user && response.data.token) {
        user.value = response.data.user
        token.value = response.data.token
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        
        return { success: true, message: response.data.message }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      }
    }
  }

  const signup = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/register', {
        name: credentials.name,
        email: credentials.email,
        password: credentials.password
      })

      if (response.data.user && response.data.token) {
        user.value = response.data.user
        token.value = response.data.token
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        
        return { success: true, message: response.data.message }
      }
      
      return { success: false, error: 'Invalid response from server' }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed. Please try again.' 
      }
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint (optional, since JWT is stateless)
      if (token.value) {
        await axios.post('/api/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state and storage
      user.value = null
      token.value = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  const checkAuth = async () => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      try {
        user.value = JSON.parse(savedUser)
        token.value = savedToken
        
        // Verify token is still valid by making a request to /api/auth/me
        const response = await axios.get('/api/auth/me')
        
        if (response.data.user) {
          // Update user info in case it changed
          user.value = response.data.user
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
      } catch (error) {
        console.error('Token validation failed:', error)
        // Token is invalid, clear auth state
        logout()
      }
    }
  }

  // Initialize axios interceptor when store is created
  setupAxiosInterceptor()

  return { 
    user, 
    token,
    isLoggedIn, 
    login, 
    signup, 
    logout, 
    checkAuth 
  }
})