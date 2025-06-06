import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => user.value !== null)
  const isPreviewMode = ref(false)

  const login = (credentials) => {
    // Simple demo login - replace with real API call
    if (credentials.email && credentials.password) {
      user.value = {
        email: credentials.email,
        name: credentials.email.split('@')[0] // Use email prefix as name
      }
      localStorage.setItem('user', JSON.stringify(user.value))
      return { success: true }
    }
    return { success: false, error: 'Please enter email and password' }
  }

  const signup = (credentials) => {
    // Simple demo signup - replace with real API call
    if (credentials.email && credentials.password && credentials.name) {
      user.value = {
        email: credentials.email,
        name: credentials.name
      }
      localStorage.setItem('user', JSON.stringify(user.value))
      return { success: true }
    }
    return { success: false, error: 'Please fill all fields' }
  }

  const logout = () => {
    user.value = null
    isPreviewMode.value = false
    localStorage.removeItem('user')
  }

  const enablePreviewMode = () => {
    isPreviewMode.value = true
  }

  const checkAuth = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
  }

  const canAccessAdmin = computed(() => isLoggedIn.value || isPreviewMode.value)

  return { 
    user, 
    isLoggedIn, 
    isPreviewMode, 
    canAccessAdmin, 
    login, 
    signup, 
    logout, 
    enablePreviewMode, 
    checkAuth 
  }
})