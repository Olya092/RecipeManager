<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showLoginForm = ref(false)
const showSignupForm = ref(false)
const isLoading = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

const signupForm = ref({
  name: '',
  email: '',
  password: ''
})

const loginError = ref('')
const signupError = ref('')

const handleLogin = async () => {
  if (isLoading.value) return
  
  loginError.value = ''
  isLoading.value = true
  
  try {
    const result = await authStore.login(loginForm.value)
    
    if (result.success) {
      router.push('/admin')
    } else {
      loginError.value = result.error
    }
  } catch (error) {
    loginError.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleSignup = async () => {
  if (isLoading.value) return
  
  signupError.value = ''
  
  // Client-side validation
  if (!signupForm.value.name || !signupForm.value.email || !signupForm.value.password) {
    signupError.value = 'Please fill in all fields'
    return
  }
  
  if (signupForm.value.password.length < 6) {
    signupError.value = 'Password must be at least 6 characters long'
    return
  }
  
  isLoading.value = true
  
  try {
    const result = await authStore.signup(signupForm.value)
    
    if (result.success) {
      router.push('/admin')
    } else {
      signupError.value = result.error
    }
  } catch (error) {
    signupError.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const showLogin = () => {
  showLoginForm.value = true
  showSignupForm.value = false
  loginError.value = ''
  loginForm.value = { email: '', password: '' }
}

const showSignup = () => {
  showSignupForm.value = true
  showLoginForm.value = false
  signupError.value = ''
  signupForm.value = { name: '', email: '', password: '' }
}

const hideAllForms = () => {
  showLoginForm.value = false
  showSignupForm.value = false
  loginError.value = ''
  signupError.value = ''
}
</script>

<template>
  <main class="home-container">
    <div v-if="!authStore.isLoggedIn" class="welcome-section">
      <h1>Welcome to Recipe Manager! 🍳</h1>
      <p>Create an account or log in to start managing your recipes!</p>
      <p>Your email can be fake for now, but <strong>don't forget your credetentials</strong> if you want to return to your saved recipe list 😉</p>
      <!--
      <p>To try full mode of the app log in with the following credetentials:
        <br>Email: <strong>guest@example.com</strong>
        <br>Password: <strong>guest01</strong>
      </p>
      -->
      <p>To try mode of the app with existing recipes log in with the following credetentials:
        <br>Email: <strong>guest2@example.com</strong>
        <br>Password: <strong>guest02</strong>
      </p>

      <!-- Action Buttons -->
      <div v-if="!showLoginForm && !showSignupForm" class="action-buttons">
        <button @click="showLogin" class="btn btn-primary">
          Log In
        </button>
        <button @click="showSignup" class="btn btn-secondary">
          Sign Up
        </button>
      </div>
      
      <!-- Login Form -->
      <div v-if="showLoginForm" class="auth-form">
        <h2>Welcome Back!</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">Email:</label>
            <input 
              type="email" 
              id="login-email" 
              v-model="loginForm.email" 
              required
              :disabled="isLoading"
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="login-password">Password:</label>
            <input 
              type="password" 
              id="login-password" 
              v-model="loginForm.password" 
              required
              :disabled="isLoading"
              placeholder="Enter your password"
            />
          </div>
          
          <div v-if="loginError" class="error-message">
            {{ loginError }}
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isLoading"
            >
              <span v-if="isLoading">Logging in...</span>
              <span v-else>Log In</span>
            </button>
            <button 
              type="button" 
              @click="hideAllForms" 
              class="btn btn-secondary"
              :disabled="isLoading"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
      <!-- Signup Form -->
      <div v-if="showSignupForm" class="auth-form">
        <h2>Create Your Account</h2>
        <form @submit.prevent="handleSignup">
          <div class="form-group">
            <label for="signup-name">Name:</label>
            <input 
              type="text" 
              id="signup-name" 
              v-model="signupForm.name" 
              required
              :disabled="isLoading"
              placeholder="Enter your desired name"
            />
          </div>
          
          <div class="form-group">
            <label for="signup-email">Email:</label>
            <input 
              type="email" 
              id="signup-email" 
              v-model="signupForm.email" 
              required
              :disabled="isLoading"
              placeholder="Enter your email"
            />
          </div>
          
          <div class="form-group">
            <label for="signup-password">Password:</label>
            <input 
              type="password" 
              id="signup-password" 
              v-model="signupForm.password" 
              required
              :disabled="isLoading"
              placeholder="Create a password (min 6 characters)"
              minlength="6"
            />
          </div>
          
          <div v-if="signupError" class="error-message">
            {{ signupError }}
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isLoading"
            >
              <span v-if="isLoading">Creating account...</span>
              <span v-else>Sign Up</span>
            </button>
            <button 
              type="button" 
              @click="hideAllForms" 
              class="btn btn-secondary"
              :disabled="isLoading"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Already logged in -->
    <div v-else class="logged-in-section">
      <h1>Welcome back, {{ authStore.user.name }}! 👋</h1>
      <p>You're successfully logged in to Recipe Manager.</p>
      
      <div class="action-buttons">
        <router-link to="/admin" class="btn btn-primary">
          Go to Recipe Manager
        </router-link>
        
        <button @click="authStore.logout" class="btn btn-secondary">
          Logout
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-section,
.logged-in-section {
  width: 100%;
}

h1 {
  color: #ea580c;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

p {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #ea580c;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.auth-form {
  background-color: #f8fafc;
  padding: 2rem;
  border-radius: 12px;
  margin-top: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.auth-form h2 {
  color: #1f2937;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #ea580c;
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (min-width: 640px) {
  .action-buttons {
    flex-direction: row;
    justify-content: center;
  }
  
  .form-actions {
    justify-content: space-between;
  }
}
</style>