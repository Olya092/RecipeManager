<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router' 
import { nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth'  // ADD THIS IMPORT

const router = useRouter(); 
const authStore = useAuthStore()  // ADD THIS LINE

async function navigateAndScrollToAddRecipe() {
  // Check if user can access admin before navigating
  if (!authStore.canAccessAdmin) {
    // If not authenticated, go to home page instead
    await router.push('/');
    return;
  }

  if (router.currentRoute.value.name !== 'admin') {
    try {
      await router.push({ name: 'admin' });
    } catch (error) {
      if (error.name === 'NavigationDuplicated') {
        console.warn("NavigationDuplicated error, proceeding with scroll attempt.");
      } else {
        console.error("Navigation error:", error);
        return; 
      }
    }
  }
  
  nextTick(() => {
    const targetElement = document.getElementById('add-recipe-details');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
      if (!targetElement.open) {
        targetElement.open = true;
      }
    } else {
      console.warn("Element with ID 'add-recipe-details' not found on the current page after navigation attempt.");
    }
  });
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
    
    <nav class="bg-gray-800 sticky top-0 z-50 py-3 text-center">
      <RouterLink to="/" class="text-white mx-2 sm:mx-4 px-3 py-2 rounded hover:bg-orange-600 transition-colors">Home</RouterLink>
      
      <!-- Only show Admin and Add New Recipe if user can access admin -->
      <RouterLink 
        v-if="authStore.canAccessAdmin" 
        to="/admin" 
        class="text-white mx-2 sm:mx-4 px-3 py-2 rounded hover:bg-orange-600 transition-colors"
      >
        Admin
      </RouterLink>
      
      <button 
        v-if="authStore.canAccessAdmin"
        @click="navigateAndScrollToAddRecipe"
        class="text-white mx-2 sm:mx-4 px-3 py-2 rounded bg-orange-500 hover:bg-orange-600 transition-colors font-semibold"
        aria-label="Add new recipe"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Show authentication status in nav -->
      <span v-if="authStore.isPreviewMode" class="text-yellow-300 mx-2 sm:mx-4 px-3 py-2 text-sm">
        Preview Mode
      </span>
      <span v-else-if="authStore.isLoggedIn" class="text-green-300 mx-2 sm:mx-4 px-3 py-2 text-sm">
        Welcome, {{ authStore.user.name }}
      </span>
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