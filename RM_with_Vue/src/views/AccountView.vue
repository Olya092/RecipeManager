<template>
  <div class="account-container">
    <main class="max-w-4xl mx-auto w-full flex-grow px-4 py-5">
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 class="text-3xl text-orange-600 font-bold mb-6">My Account</h1>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading account information...</p>
        </div>

        <!-- Error State -->
        <div v-if="error && !isLoading" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {{ error }}
        </div>

        <!-- Account Information -->
        <div v-if="!isLoading && !error" class="space-y-6">
          
          <!-- Profile Header -->
          <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div class="bg-orange-600 text-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold flex-shrink-0">
                {{ userInitials }}
              </div>
              <div class="text-center sm:text-left">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800">{{ userInfo.name }}</h2>
                <p class="text-gray-600 text-sm sm:text-base">{{ userInfo.email }}</p>
                <p class="text-xs sm:text-sm text-gray-500">
                  Member since {{ formatDate(userInfo.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Edit Profile Section -->
          <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Profile Information</h3>
              <button 
                v-if="!isEditing"
                @click="startEditing"
                class="w-full sm:w-auto bg-orange-600 text-white px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded hover:bg-orange-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>

            <!-- View Mode -->
            <div v-if="!isEditing" class="space-y-4">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Full Name</label>
                  <p class="mt-1 text-gray-900 break-words">{{ userInfo.name }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Email Address</label>
                  <p class="mt-1 text-gray-900 break-all">{{ userInfo.email }}</p>
                </div>
              </div>
            </div>

            <!-- Edit Mode -->
            <div v-if="isEditing" class="space-y-4">
              <form @submit.prevent="saveProfile">
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      v-model="editForm.name"
                      required
                      :disabled="isSaving"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      v-model="editForm.email"
                      required
                      :disabled="isSaving"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <!-- Save/Cancel Buttons -->
                <div class="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                  <button
                    type="button"
                    @click="cancelEditing"
                    :disabled="isSaving"
                    class="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2"
                  >
                    <span v-if="isSaving">Saving...</span>
                    <span v-else>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Change Password Section -->
          <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h3 class="text-lg sm:text-xl font-semibold text-gray-800">Change Password</h3>
              <button 
                v-if="!isChangingPassword"
                @click="startChangingPassword"
                class="w-full sm:w-auto bg-gray-600 text-white px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base rounded hover:bg-gray-700 transition-colors"
              >
                Change Password
              </button>
            </div>

            <!-- Change Password Form -->
            <div v-if="isChangingPassword" class="space-y-4">
              <form @submit.prevent="changePassword">
                <div class="space-y-4">
                  <div>
                    <label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      required
                      :disabled="isSaving"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      required
                      minlength="6"
                      :disabled="isSaving"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      required
                      minlength="6"
                      :disabled="isSaving"
                      class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div v-if="passwordError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4 text-sm">
                  {{ passwordError }}
                </div>

                <!-- Password Form Buttons -->
                <div class="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                  <button
                    type="button"
                    @click="cancelPasswordChange"
                    :disabled="isSaving"
                    class="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 text-sm sm:text-base order-1 sm:order-2"
                  >
                    <span v-if="isSaving">Changing...</span>
                    <span v-else>Change Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Account Stats -->
          <div class="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Account Statistics</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div class="text-xl sm:text-2xl font-bold text-orange-600">{{ userStats.totalRecipes }}</div>
                <div class="text-xs sm:text-sm text-gray-600">Total Recipes</div>
              </div>
              <div class="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div class="text-sm sm:text-lg font-bold text-green-600 break-words">{{ formatDate(userInfo.createdAt) }}</div>
                <div class="text-xs sm:text-sm text-gray-600">Member Since</div>
              </div>
              <div class="bg-white rounded-lg p-3 sm:p-4 text-center">
                <div class="text-sm sm:text-lg font-bold text-blue-600 break-words">{{ formatDate(userInfo.lastModified) }}</div>
                <div class="text-xs sm:text-sm text-gray-600">Last Updated</div>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
            <h3 class="text-lg sm:text-xl font-semibold text-red-800 mb-4">Danger Zone</h3>
            <p class="text-red-700 mb-4 text-sm sm:text-base">
              Delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              @click="showDeleteConfirmation = true"
              class="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm sm:text-base"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-semibold text-red-800 mb-4">Delete Account</h3>
        <p class="text-gray-700 mb-4">
          Are you sure you want to delete your account? This will permanently delete all your recipes and account data. This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteConfirmation = false"
            class="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="deleteAccount"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

// Reactive data
const userInfo = ref({})
const userStats = ref({ totalRecipes: 0 })
const isLoading = ref(true)
const error = ref('')
const isEditing = ref(false)
const isChangingPassword = ref(false)
const isSaving = ref(false)
const showDeleteConfirmation = ref(false)
const passwordError = ref('')

// Form data
const editForm = ref({
  name: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const userInitials = computed(() => {
  if (!userInfo.value.name) return ''
  return userInfo.value.name
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
})

// Methods
const fetchUserInfo = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const response = await axios.get('/api/auth/me')
    userInfo.value = response.data.user
    
    // Also fetch user's recipe count
    const recipesResponse = await axios.get('/api/recipes')
    // All recipes returned will be user's recipes since the backend filters by user
    userStats.value.totalRecipes = recipesResponse.data.recipes.length
    
  } catch (err) {
    console.error('Error fetching user info:', err)
    error.value = 'Failed to load account information'
  } finally {
    isLoading.value = false
  }
}

const startEditing = () => {
  editForm.value = {
    name: userInfo.value.name,
    email: userInfo.value.email
  }
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editForm.value = { name: '', email: '' }
}

const saveProfile = async () => {
  try {
    isSaving.value = true
    
    await axios.put(`/api/users/${userInfo.value.id}`, {
      name: editForm.value.name,
      email: editForm.value.email
    })
    
    // Update local user info
    userInfo.value.name = editForm.value.name
    userInfo.value.email = editForm.value.email
    
    // Update auth store
    authStore.user.name = editForm.value.name
    authStore.user.email = editForm.value.email
    
    isEditing.value = false
    showToast('Profile updated successfully!', 'success')
    
  } catch (err) {
    console.error('Error updating profile:', err)
    showToast(err.response?.data?.error || 'Failed to update profile', 'error')
  } finally {
    isSaving.value = false
  }
}

const startChangingPassword = () => {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordError.value = ''
  isChangingPassword.value = true
}

const cancelPasswordChange = () => {
  isChangingPassword.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordError.value = ''
}

const changePassword = async () => {
  try {
    passwordError.value = ''
    
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      passwordError.value = 'New passwords do not match'
      return
    }
    
    if (passwordForm.value.newPassword.length < 6) {
      passwordError.value = 'Password must be at least 6 characters long'
      return
    }
    
    isSaving.value = true
    
    await axios.put(`/api/users/${userInfo.value.id}`, {
      currentPassword: passwordForm.value.currentPassword,
      password: passwordForm.value.newPassword
    })
    
    isChangingPassword.value = false
    showToast('Password changed successfully!', 'success')
    
  } catch (err) {
    console.error('Error changing password:', err)
    passwordError.value = err.response?.data?.error || 'Failed to change password'
  } finally {
    isSaving.value = false
  }
}

const deleteAccount = async () => {
  try {
    await axios.delete(`/api/users/${userInfo.value.id}`)
    showToast('Account deleted successfully', 'success')
    authStore.logout()
    router.push('/')
  } catch (err) {
    console.error('Error deleting account:', err)
    showToast(err.response?.data?.error || 'Failed to delete account', 'error')
  } finally {
    showDeleteConfirmation.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const showToast = (message, type = 'success') => {
  const toastContainer = document.getElementById('toast-container')
  if (!toastContainer) {
    alert(message)
    return
  }
  
  const toast = document.createElement('div')
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
  toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg animate-slide-in-right transition-all duration-300`
  toast.innerText = message
  toastContainer.appendChild(toast)
  
  setTimeout(() => toast.classList.add('opacity-0', 'translate-x-full'), 2500)
  setTimeout(() => {
    if (toastContainer.contains(toast)) {
      toastContainer.removeChild(toast)
    }
  }, 3000)
}

// Lifecycle
onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push('/')
    return
  }
  fetchUserInfo()
})
</script>

<style scoped>
.account-container {
  min-height: calc(100vh - 200px);
  background-color: #f9fafb;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>