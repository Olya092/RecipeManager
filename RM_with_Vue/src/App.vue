<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router' 
import { nextTick, ref } from 'vue';
import { useAuthStore } from '@/stores/auth'

const router = useRouter(); 
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)

async function navigateAndScrollToAddRecipe() {
  // Check if user is logged in before navigating
  if (!authStore.isLoggedIn) {
    // If not authenticated, go to home page instead
    await router.push('/');
    return;
  }

  // Navigate to admin page with a query parameter
  await router.push({ name: 'admin', query: { openAddRecipe: 'true' } });
}
</script>

<template>
  <!-- notifications -->
  <div id="toast-container" class="fixed top-5 right-5 z-[100] space-y-4"></div>

  <div class="font-sans leading-relaxed text-gray-800 bg-gray-50 min-h-screen flex flex-col">
    <header class="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center py-5 px-4">
      <div class="flex items-center justify-center space-x-4">
        <img src="https://cdn-icons-png.flaticon.com/512/2909/2909765.png" 
              alt="Recipe Icon" 
              class="w-16 h-16 object-cover rounded-full border-4 border-white shadow-lg">
        <h1 class="text-4xl font-bold">Recipe Manager</h1>
      </div>
      <p class="text-lg my-2">Ready to serve you: <time date="00:00-23:59">24/7</time></p>
      <details class="bg-orange-400/70 rounded-lg p-3 max-w-2xl mx-auto text-left">
        <summary class="text-orange-600 font-bold bg-white p-2 rounded shadow-sm cursor-pointer">About Recipe Manager</summary>
        <p class="p-3 text-white leading-relaxed">Have you ever found a great recipe while scrolling through Instagram, Facebook, YouTube, or TikTok, saved it, and then forgotten where you saved it? 
            Recipe Manager is here to solve that problem! Our platform allows you to store links for all your favorite video recipes in one place, making it easy to find and revisit them whenever you want. 
            No more endless searching through saved lists—keep your cooking inspiration organized and accessible!</p>
      </details>
    </header>
    
    <nav class="bg-gray-800 sticky top-0 z-50 py-3">
    <div class="max-w-6xl mx-auto px-4">
    
      <!-- Mobile - Always show burger menu button when screen is small -->
      <div class="md:hidden flex justify-center">
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="text-white p-2 rounded hover:bg-orange-600 transition-colors"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center justify-between">
        <!-- When NOT logged in - Center the Home button -->
        <div v-if="!authStore.isLoggedIn" class="w-full flex justify-center">
          <RouterLink to="/" class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors">
            Home
          </RouterLink>
        </div>

        <!-- When logged in - Show full navigation -->
        <template v-else>
          <!-- Left side navigation -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <RouterLink to="/" class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors">
              Home
            </RouterLink>
            
            <!-- Only show Admin and Add New Recipe if user is logged in -->
            <RouterLink 
              v-if="authStore.isLoggedIn" 
              to="/admin" 
              class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors"
            >
              Recipes
            </RouterLink>
            
            <button 
              v-if="authStore.isLoggedIn"
              @click="navigateAndScrollToAddRecipe"
              class="text-white px-3 py-2 rounded bg-orange-500 hover:bg-orange-600 transition-colors font-semibold flex items-center"
              aria-label="Add new recipe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              <span class="hidden sm:inline">Add Recipe</span>
            </button>
          </div>

          <!-- Right side navigation -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <!-- Account button for logged in users -->
            <RouterLink 
              v-if="authStore.isLoggedIn" 
              to="/account" 
              class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              <span class="hidden sm:inline">Account</span>
            </RouterLink>
          </div>
        </template>
      </div>

      <!-- Mobile Menu (dropdown) -->
      <div v-if="isMobileMenuOpen" class="md:hidden mt-3 bg-gray-700 rounded-lg p-4">
        <div class="flex flex-col space-y-2">
          <RouterLink 
            to="/" 
            @click="isMobileMenuOpen = false"
            class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors text-center"
          >
            Home
          </RouterLink>
          
          <!-- Show admin links if user is logged in -->
          <RouterLink 
            v-if="authStore.isLoggedIn" 
            to="/admin" 
            @click="isMobileMenuOpen = false"
            class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors text-center"
          >
            Recipes
          </RouterLink>
          
          <button 
            v-if="authStore.isLoggedIn"
            @click="() => { navigateAndScrollToAddRecipe(); isMobileMenuOpen = false; }"
            class="text-white px-3 py-2 rounded bg-orange-500 hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Recipe
          </button>
          
          <!-- Account button for logged in users -->
          <RouterLink 
            v-if="authStore.isLoggedIn" 
            to="/account" 
            @click="isMobileMenuOpen = false"
            class="text-white px-3 py-2 rounded hover:bg-orange-600 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            Account
          </RouterLink>
        </div>
      </div>
    </div>
    </nav>

    <div class="flex-grow"> 
      <RouterView />
    </div>

    <footer class="bg-gray-800 text-white text-center py-5 mt-auto">
      <p>Recipe Manager System</p>
      <p>© 2025 - Created for food enthusiasts</p>
    </footer>
  </div>        
</template>

<style scoped>
@keyframes slide-in-right {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.animate-slide-in-right {
  animation: slide-in-right 0.4s ease-out;
}
</style>