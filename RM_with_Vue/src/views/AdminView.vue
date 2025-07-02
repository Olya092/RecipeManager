<template>
    <div> <!-- Wrapper -->

      <!-- View Recipe Modal Component -->
      <RecipeViewModal 
        :show="showRecipeModal" 
        :recipe="viewingRecipe"
        @close="closeRecipeViewModal"
        @edit-recipe="editRecipeFromView"
        @delete-recipe="deleteRecipeFromView"
      />
  
      <!-- Edit Recipe Modal Component -->
      <RecipeEditModal
        :show="showEditModal"
        :recipe="editingRecipeData"
        @close="closeEditModal"
        @save="saveEditedRecipe"
      />
  
      <!-- Delete Confirmation Modal Component -->
      <ConfirmDeleteModal
        :show="showDeleteModal"
        :recipe-name="recipeToDelete ? recipeToDelete.name : ''"
        @cancel="closeDeleteModal"
        @confirm="confirmDeleteRecipe"
      />
  
      <main class="max-w-6xl mx-auto w-full flex-grow px-4 py-5">
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div class="text-center sm:text-left mb-4 sm:mb-0">
              <h2 class="text-3xl text-orange-600">My Recipes</h2>
            </div>
            
            <!-- Enhanced Search Component -->
            <EnhancedSearch
              v-model:searchQuery="searchQuery"
              v-model:selectedCategory="selectedCategory"
              @search="triggerSearch"
              @clear="clearAndFetchAll"
            />
        </div>

        <!-- Add New Recipe Section -->
        <section v-if="!isLoading && !apiError" class="bg-white rounded-lg shadow-md p-5 mb-5">
          <h3 class="text-2xl text-orange-600 text-center mb-4">
            Here the magic ✨ will happen and a new recipe 🍳 will be born!
          </h3>
          <details id="add-recipe-details" class="bg-gray-50 rounded-lg p-4">
            <summary class="text-orange-600 font-bold bg-white p-2 rounded shadow-sm cursor-pointer">Add a New Recipe</summary>
            <div class="mt-4">
              <RecipeForm
                v-model="newRecipe"
                submit-button-text="Create Recipe"
                form-id-prefix="new-recipe"
                @submit="addNewRecipe"
              />
            </div>
          </details> 
        </section>

        <!-- Loading and error states -->
        <div v-if="isLoading" class="text-center py-8">Loading recipes...</div>
        <div v-if="apiError" class="text-center py-8 text-red-500">{{ apiError }}</div>
        
        <!-- Card-based view for small screens -->
        <div v-if="!isLoading && !apiError" class="sm:hidden space-y-4">
          <div class="bg-white rounded-lg shadow p-4">
            <RecipeCard
              v-for="(recipe, index) in filteredRecipes" 
              :key="'card-' + (recipe.id || index)" 
              :recipe="recipe"
              @view="openRecipeViewModal(recipe)"
              @edit="openEditModalWithRecipe(recipe)"
              @delete="openDeleteModalWithRecipe(recipe)"
            />
            <div v-if="!filteredRecipes.length && (searchQuery || selectedCategory)" class="text-gray-500 text-center py-4">
              <p>No recipes match your search criteria.</p>
              <button @click="clearAllFilters" class="text-orange-600 hover:underline mt-2">
                Clear all filters
              </button>
            </div>
            <div v-if="!recipes.length && !searchQuery && !selectedCategory" class="text-gray-500 text-center py-4">
              <p>You haven't created any recipes yet. Add your first recipe above!</p>
            </div>
          </div>
        </div>
        
        <!-- Table view for larger screens -->
        <section v-if="!isLoading && !apiError" class="hidden sm:block bg-white rounded-lg shadow-md p-5">
          <article>
            <div v-if="filteredRecipes.length" class="overflow-x-auto">
              <table class="w-full table-auto border-collapse table-fixed">
                <thead class="bg-orange-600 text-white">
                  <tr>
                    <th class="p-3 text-left" >Image</th>
                    <th class="p-3 text-left"  >Name</th>
                    <th class="p-3 text-left">Category</th>
                    <th class="hidden md:table-cell p-3 text-left" style="width: 20%;" >Description</th>
                    <th class="hidden lg:table-cell p-3 text-left">Prep Time</th>
                    <th class="hidden md:table-cell p-3 text-left">Cook Time</th>
                    <th class="hidden lg:table-cell p-3 text-left">Temp</th>
                    <th class="p-3 text-left">Link</th>
                    <th class="p-3 text-center w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <RecipeListItem
                    v-for="(recipe, index) in filteredRecipes" 
                    :key="'item-' + (recipe.id || index)" 
                    :recipe="recipe"
                    @view="openRecipeViewModal(recipe)"
                    @edit="openEditModalWithRecipe(recipe)"
                    @delete="openDeleteModalWithRecipe(recipe)"
                  />
                </tbody>
              </table>
            </div>
            <div v-if="!filteredRecipes.length && (searchQuery || selectedCategory)" class="text-gray-500 text-center py-8">
              <p>No recipes match your search criteria.</p>
              <button @click="clearAllFilters" class="text-orange-600 hover:underline mt-2">
                Clear all filters
              </button>
            </div>
            <div v-if="!recipes.length && !searchQuery && !selectedCategory" class="text-gray-500 text-center py-8">
              <p>You haven't created any recipes yet. Add your first recipe above!</p>
            </div>
          </article>
        </section>
      </main>
    </div>
</template>
  
<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue"; 
  import { useAuthStore } from '@/stores/auth'
  import { useRoute, useRouter } from 'vue-router'
  import RecipeViewModal from '../components/RecipeViewModal.vue';
  import RecipeEditModal from '../components/RecipeEditModal.vue';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
  import RecipeCard from '../components/RecipeCard.vue';
  import RecipeListItem from '../components/RecipeListItem.vue';
  import RecipeForm from '../components/RecipeForm.vue';
  import EnhancedSearch from '../components/EnhancedSearch.vue';
  import axios from 'axios';
  import { io } from 'socket.io-client';

  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  
  const initialNewRecipeState = () => ({
    image: '', name: '', category: '', description: '',
    prepTime: null, cookTime: null, temperature: '', link: ''
  });

  // Data refs
  const recipes = ref([]);
  const newRecipe = ref(initialNewRecipeState());
  const searchQuery = ref('');
  const selectedCategory = ref('');
  const isLoading = ref(false);
  const apiError = ref(null);

  // WebSocket related refs
  const socket = ref(null);
  const apiClient = ref(null);
  const interestedIn = 'recipe:create,recipe:update,recipe:delete';
  const isConnected = ref(false);

  // Modal refs
  const showRecipeModal = ref(false);
  const viewingRecipe = ref(null);
  const showEditModal = ref(false);
  const editingRecipeData = ref(null);
  const showDeleteModal = ref(false);
  const recipeToDelete = ref(null);

  // WebSocket setup function
  const setupWebSocketAndAPIClient = () => {
    socket.value = io('http://localhost:3002/', {
      query: {
        interestedIn: interestedIn,
      },
    });

    socket.value.on('connect', () => {
      console.log('WebSocket.io connection opened with ID:', socket.value.id);

      apiClient.value = axios.create({
        baseURL: 'http://localhost:3000',
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          'x-client-id': socket.value.id,
        },
      });

      fetchRecipes();
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      console.log('WebSocket.io connection closed');
      isConnected.value = false;
    });

    socket.value.on('recipe:create', (data) => {
      console.log("RECEIVED recipe:create event with data:", data);
      handleRecipeCreate(data);
    });
    
    socket.value.on('recipe:update', (data) => {
      console.log("RECEIVED recipe:update event with data:", data);
      handleRecipeUpdate(data);
    });
    
    socket.value.on('recipe:delete', (data) => {
      console.log("RECEIVED recipe:delete event with data:", data);
      handleRecipeDelete(data);
    });

    socket.value.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
    });
  };

  // Handle real-time events - ignore events from our own client
  const handleRecipeCreate = (newRecipe) => {
    console.log("'recipe:create' event received:", newRecipe);
    
    // Check if this recipe already exists locally
    const existsLocally = recipes.value.some(recipe => 
      recipe._id === newRecipe._id || recipe.id === newRecipe._id
    );
    
    if (!existsLocally) {
      // Add recipe to list (handles events from other users)
      recipes.value.push(newRecipe);
      showToast(`New recipe "${newRecipe.name}" was added by another user!`, "info");
    } else {
      console.log("Ignoring create event for recipe we already have locally");
    }
  };
  
  const handleRecipeUpdate = (updatedRecipe) => {
    console.log("'recipe:update' event received:", updatedRecipe);
    
    // More robust ID matching
    const index = recipes.value.findIndex((recipe) => {
      const currentId = recipe._id || recipe.id;
      const updatedId = updatedRecipe._id || updatedRecipe.id;
      
      return currentId === updatedId || 
             recipe._id === updatedRecipe._id || 
             recipe.id === updatedRecipe._id ||
             recipe._id === updatedRecipe.id ||
             recipe.id === updatedRecipe.id;
    });
    
    if (index !== -1) {
      const currentRecipe = recipes.value[index];
      console.log('Current recipe lastModified:', currentRecipe.lastModified);
      console.log('Updated recipe lastModified:', updatedRecipe.lastModified);
      
      // Check if this is a meaningful update from another user
      // Give a small buffer (1 second) to account for timing differences
      const currentTime = currentRecipe.lastModified ? new Date(currentRecipe.lastModified).getTime() : 0;
      const updatedTime = updatedRecipe.lastModified ? new Date(updatedRecipe.lastModified).getTime() : 0;
      const timeDiff = Math.abs(currentTime - updatedTime);
      
      // If the time difference is less than 1 second, it's likely my own update
      const isOwnUpdate = timeDiff < 1000 && currentTime > 0;
      
      if (!isOwnUpdate) {
        console.log('Recipe found at index', index, 'will be updated from other user');
        recipes.value.splice(index, 1, updatedRecipe);
        showToast(`Recipe "${updatedRecipe.name}" was updated by another user!`, "info");
        
        // Update viewing recipe if it's currently being viewed
        if (viewingRecipe.value) {
          const viewingId = viewingRecipe.value._id || viewingRecipe.value.id;
          const updatedId = updatedRecipe._id || updatedRecipe.id;
          if (viewingId === updatedId) {
            viewingRecipe.value = { ...updatedRecipe };
          }
        }
      } else {
        console.log("Ignoring update event - appears to be my own recent change");
      }
    } else {
      console.log('Recipe not found in local list - adding it');
      recipes.value.push(updatedRecipe);
      showToast(`Recipe "${updatedRecipe.name}" was updated by another user!`, "info");
    }
  };
  
  const handleRecipeDelete = (payloadWithId) => {
    console.log("'recipe:delete' event received:", payloadWithId);
    
    const deletedRecipe = recipes.value.find(recipe => recipe._id === payloadWithId._id);
    
    if (deletedRecipe) {
      // Check if this recipe still exists locally (was just deleted it)
      const stillExistsLocally = recipes.value.some(recipe => recipe._id === payloadWithId._id);
      
      if (!stillExistsLocally) {
        console.log("Ignoring delete event for recipe we already removed locally");
        return;
      }
      
      recipes.value = recipes.value.filter((recipe) => recipe._id !== payloadWithId._id);
      showToast(`Recipe "${deletedRecipe.name}" was deleted by another user!`, "info");
      
      // Close modals if the deleted recipe is being viewed
      if (viewingRecipe.value && viewingRecipe.value._id === payloadWithId._id) {
        closeRecipeViewModal();
      }
      if (editingRecipeData.value && editingRecipeData.value._id === payloadWithId._id) {
        closeEditModal();
      }
    }
  };

  // API calls using apiClient
  const fetchRecipes = async () => {
    if (!apiClient.value) return;
    
    isLoading.value = true;
    apiError.value = null;
    try {
      const params = {};
      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      if (selectedCategory.value && selectedCategory.value !== 'All') {
        params.category = selectedCategory.value;
      }
      const response = await apiClient.value.get('/api/recipes', { params });
      recipes.value = response.data.recipes;
      console.log('Received recipes:', recipes.value);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
      apiError.value = "Failed to load recipes. Please try again later.";
      recipes.value = [];
      showToast(apiError.value, "error");
    } finally {
      isLoading.value = false;
    }
  };

  const triggerSearch = () => {
    fetchRecipes();
  };

  const clearAndFetchAll = () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    fetchAllRecipes();
  };

  const fetchAllRecipes = async () => {
    if (!apiClient.value) return;
    
    isLoading.value = true;
    apiError.value = null;
    try {
      const response = await apiClient.value.get('/api/recipes');
      recipes.value = response.data.recipes;
      console.log('Received all recipes:', recipes.value);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
      apiError.value = "Failed to load recipes. Please try again later.";
      recipes.value = [];
      showToast(apiError.value, "error");
    } finally {
      isLoading.value = false;
    }
  };

  const clearAllFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    fetchAllRecipes();
  };

  const filteredRecipes = computed(() => {
    return recipes.value;
  });

  // Toast Notification
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      console.warn("Toast container not found!");
      alert(message); 
      return;
    }
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
    toast.className = `${bgColor} text-white px-4 py-3 rounded shadow-lg animate-slide-in-right transition-all duration-300`;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('opacity-0', 'translate-x-full'), 2500);
    setTimeout(() => { 
        if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
        }
    }, 3000);
  }
  
  // Modal functions
  function openRecipeViewModal(recipe) {
    viewingRecipe.value = recipe;
    showRecipeModal.value = true;
  }
  function closeRecipeViewModal() {
    showRecipeModal.value = false;
    viewingRecipe.value = null;
  }
  
  function openEditModalWithRecipe(recipe) {
    editingRecipeData.value = { ...recipe }; 
    showEditModal.value = true;
    if (showRecipeModal.value) closeRecipeViewModal(); 
  }
  
  function editRecipeFromView() {
    if (viewingRecipe.value) {
      openEditModalWithRecipe(viewingRecipe.value);
    }
  }

  function closeEditModal() {
    showEditModal.value = false;
    editingRecipeData.value = null;
  }
  
  // Updated saveEditedRecipe - don't send _id in body
  async function saveEditedRecipe(updatedRecipeFromModal) {
    if (!editingRecipeData.value || (!editingRecipeData.value.id && !editingRecipeData.value._id)) {
      showToast("Error: No recipe selected for editing.", "error");
      return;
    }
    if (!apiClient.value) return;
    
    isLoading.value = true;
    apiError.value = null;
    try {
      const recipeId = editingRecipeData.value.id || editingRecipeData.value._id;
      
      // Don't include _id or id in the request body - use URL parameter only
      const { _id, id, ...dataToSend } = updatedRecipeFromModal;
      
      console.log('Sending update data:', dataToSend);
      console.log('Recipe ID:', recipeId);
      
      const response = await apiClient.value.put(`/api/recipes/${recipeId}`, dataToSend);
      console.log('Received response:', response.data);
      
      // Do immediate local update for responsiveness with better ID matching
      const index = recipes.value.findIndex((recipe) => {
        const currentId = recipe._id || recipe.id;
        const responseId = response.data._id || response.data.id;
        return currentId === responseId || currentId === recipeId || 
               recipe._id === recipeId || recipe.id === recipeId;
      });
      
      console.log('Found recipe at index:', index);
      if (index !== -1) {
        console.log('Updating recipe at index', index);
        console.log('Old recipe:', recipes.value[index]);
        recipes.value.splice(index, 1, response.data);
        console.log('New recipe:', response.data);
      } else {
        console.log('Recipe not found locally, adding it');
        recipes.value.push(response.data);
      }
      
      console.log('Updated recipe:', response.data.name);
      showToast("Recipe updated successfully!");
      closeEditModal();
      
      // Update the viewing recipe if it's the same one being edited
      if (viewingRecipe.value && editingRecipeData.value) {
        const viewingId = viewingRecipe.value._id || viewingRecipe.value.id;
        const editingId = editingRecipeData.value._id || editingRecipeData.value.id;
        if (viewingId === editingId) {
          viewingRecipe.value = { ...response.data };
        }
      }
    } catch (err) {
        console.error("Error saving recipe:", err);
        console.error("Error details:", err.response?.data);
        const errorMessage = err.response?.data?.error || "Failed to update recipe.";
        showToast(errorMessage, "error");
        apiError.value = errorMessage;
    } finally {
        isLoading.value = false;
    }
  }
  
  function openDeleteModalWithRecipe(recipe) {
    recipeToDelete.value = recipe;
    showDeleteModal.value = true;
    if (showRecipeModal.value) closeRecipeViewModal(); 
  }
  
  function deleteRecipeFromView() {
    if (viewingRecipe.value) {
        openDeleteModalWithRecipe(viewingRecipe.value);
    }
  }
  
  function closeDeleteModal() {
    showDeleteModal.value = false;
    recipeToDelete.value = null;
  }

  // Updated confirmDeleteRecipe - do immediate local update
  async function confirmDeleteRecipe() {
    if (!recipeToDelete.value || (!recipeToDelete.value.id && !recipeToDelete.value._id)) {
        showToast("Error: No recipe selected for deletion.", "error");
        return;
    }
    if (!apiClient.value) return;
    
    isLoading.value = true;
    apiError.value = null;
    try {
      const recipeId = recipeToDelete.value.id || recipeToDelete.value._id;
      await apiClient.value.delete(`/api/recipes/${recipeId}`);
      
      // Do immediate local update for responsiveness
      recipes.value = recipes.value.filter((recipe) => (recipe._id || recipe.id) !== recipeId);
      
      console.log('Deleted recipe ID:', recipeId);
      showToast("Recipe deleted successfully!");
      
      if (viewingRecipe.value && recipeToDelete.value && 
          ((viewingRecipe.value._id || viewingRecipe.value.id) === recipeId)) {
          closeRecipeViewModal();
      }
      closeDeleteModal(); 
    } catch (err) {
        console.error("Error deleting recipe:", err);
        const errorMessage = err.response?.data?.error || "Failed to delete recipe.";
        showToast(errorMessage, "error");
        apiError.value = errorMessage;
    } finally {
        isLoading.value = false;
    }
  }
  
  // Updated addNewRecipe - do immediate local update
  async function addNewRecipe(submittedRecipeData) {
    if (!submittedRecipeData.name) {
      showToast("Recipe name is required!", "error");
      return;
    }
    if (!apiClient.value) return;
    
    isLoading.value = true;
    apiError.value = null;
    try {
      const response = await apiClient.value.post('/api/recipes', submittedRecipeData);
      
      // Do immediate local update for responsiveness
      recipes.value.push(response.data);
      
      console.log('Added new recipe:', response.data.name);
      
      newRecipe.value = initialNewRecipeState();
      showToast("Recipe added successfully!");
      
      const detailsElement = document.getElementById('add-recipe-details');
      if (detailsElement) {
        detailsElement.open = false;
      }
    } catch (err) {
      console.error("Error adding new recipe:", err);
      const errorMessage = err.response?.data?.error || "Failed to add new recipe.";
      showToast(errorMessage, "error");
      apiError.value = errorMessage;
    } finally {
        isLoading.value = false;
    }
  }

  // Lifecycle hooks
  onMounted(() => {
    console.log('AdminPage component (Composition API) mounted.');
    setupWebSocketAndAPIClient();
    
    // Check if we should open the add recipe form
    if (route.query.openAddRecipe === 'true') {
      setTimeout(() => {
        const detailsElement = document.getElementById('add-recipe-details');
        if (detailsElement) {
          detailsElement.open = true;
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          router.replace({ query: {} });
        }
      }, 300);
    }
  });

  onBeforeUnmount(() => {
    if (socket.value) {
      socket.value.disconnect();
    }
  });

  // Watch for route changes to handle navigation from other pages
  watch(() => route.query.openAddRecipe, (newValue) => {
    if (newValue === 'true') {
      setTimeout(() => {
        const detailsElement = document.getElementById('add-recipe-details');
        if (detailsElement) {
          detailsElement.open = true;
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          router.replace({ query: {} });
        }
      }, 300);
    }
  });
</script>