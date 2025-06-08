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
            <div class="w-full sm:w-auto flex items-center space-x-2">
                <input 
                    type="text" 
                    v-model="searchQuery" 
                    @keyup.enter="triggerSearch"
                    @input="fetchRecipesDebounced" 
                    placeholder="Search your recipes..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
                <button 
                    @click="triggerSearch" 
                    class="p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                    aria-label="Search"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>

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
            <div v-if="!filteredRecipes.length && searchQuery" class="text-gray-500 text-center py-4">
              <p>No recipes match your search.</p>
            </div>
            <div v-if="!recipes.length && !searchQuery" class="text-gray-500 text-center py-4">
              <p>You haven't created any recipes yet. Add your first recipe below!</p>
            </div>
          </div>
        </div>
        
        <!-- Table view for larger screens -->
        <section v-if="!isLoading && !apiError" class="hidden sm:block bg-white rounded-lg shadow-md p-5 mb-5">
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
            <div v-if="!filteredRecipes.length && searchQuery" class="text-gray-500 text-center py-8">
              <p>No recipes match your search.</p>
            </div>
            <div v-if="!recipes.length && !searchQuery" class="text-gray-500 text-center py-8">
              <p>You haven't created any recipes yet. Add your first recipe below!</p>
            </div>
          </article>
        </section>
        
        <!-- Add New Recipe Section -->
        <section v-if="!isLoading && !apiError" class="bg-white rounded-lg shadow-md p-5">
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
      </main>
    </div>
</template>
  
<script setup>
  import { ref, computed, onMounted, watch, nextTick } from "vue"; 
  import { useAuthStore } from '@/stores/auth'
  import { useRoute, useRouter } from 'vue-router'
  import RecipeViewModal from '../components/RecipeViewModal.vue';
  import RecipeEditModal from '../components/RecipeEditModal.vue';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
  import RecipeCard from '../components/RecipeCard.vue';
  import RecipeListItem from '../components/RecipeListItem.vue';
  import RecipeForm from '../components/RecipeForm.vue';
  import axios from 'axios';

  const authStore = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  
  const initialNewRecipeState = () => ({
    image: '', name: '', category: '', description: '',
    prepTime: null, cookTime: null, temperature: '', link: ''
  });

  const recipes = ref([]); 
  const newRecipe = ref(initialNewRecipeState());
  
  const searchQuery = ref('');
  const isLoading = ref(false);
  const apiError = ref(null);

  // --- API Calls ---

  const fetchRecipes = async () => {
    isLoading.value = true;
    apiError.value = null;
    try {
      const params = {};
      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      const response = await axios.get('/api/recipes', { params });
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

  onMounted(() => {
    fetchRecipes();
    
    // Check if we should open the add recipe form
    if (route.query.openAddRecipe === 'true') {
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const detailsElement = document.getElementById('add-recipe-details');
        if (detailsElement) {
          detailsElement.open = true;
          // Scroll to the element with offset to center it better
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Clear the query parameter after using it
          router.replace({ query: {} });
        }
      }, 300); // 300ms delay to ensure DOM is ready
    }
  });

  // Watch for route changes to handle navigation from other pages
  watch(() => route.query.openAddRecipe, (newValue) => {
    if (newValue === 'true') {
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const detailsElement = document.getElementById('add-recipe-details');
        if (detailsElement) {
          detailsElement.open = true;
          // Scroll to the element with offset to center it better
          detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Clear the query parameter after using it
          router.replace({ query: {} });
        }
      }, 300); // 300ms delay to ensure DOM is ready
    }
  });

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
  
  // View Modal State & Logic
  const showRecipeModal = ref(false);
  const viewingRecipe = ref(null); 
  
  function openRecipeViewModal(recipe) {
    viewingRecipe.value = recipe;
    showRecipeModal.value = true;
  }
  function closeRecipeViewModal() {
    showRecipeModal.value = false;
    viewingRecipe.value = null;
  }
  
  // Edit Modal State & Logic
  const showEditModal = ref(false);
  const editingRecipeData = ref(null); 
  
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
  
   async function saveEditedRecipe(updatedRecipeFromModal) {
    if (!editingRecipeData.value || (!editingRecipeData.value.id && !editingRecipeData.value._id)) {
      showToast("Error: No recipe selected for editing.", "error");
      return;
    }
    isLoading.value = true;
    apiError.value = null;
    try {
      const recipeId = editingRecipeData.value.id || editingRecipeData.value._id;
      await axios.put(`/api/recipes/${recipeId}`, updatedRecipeFromModal);
      await fetchRecipes(); 
      showToast("Recipe updated successfully!");
      closeEditModal();
      if (viewingRecipe.value && editingRecipeData.value && viewingRecipe.value.id === editingRecipeData.value.id) {
        const updatedViewRecipe = recipes.value.find(r => r.id === editingRecipeData.value.id);
        if (updatedViewRecipe) viewingRecipe.value = { ...updatedViewRecipe };
      }
    } catch (err) {
        console.error("Error saving recipe:", err);
        const errorMessage = err.response?.data?.error || "Failed to update recipe.";
        showToast(errorMessage, "error");
        apiError.value = errorMessage;
    } finally {
        isLoading.value = false;
    }
  }
  
  // Delete Modal State & Logic 
  const showDeleteModal = ref(false);
  const recipeToDelete = ref(null); 
  
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

  async function confirmDeleteRecipe() {
    if (!recipeToDelete.value || (!recipeToDelete.value.id && !recipeToDelete.value._id)) {
        showToast("Error: No recipe selected for deletion.", "error");
        return;
    }
    isLoading.value = true;
    apiError.value = null;
    try {
      const recipeId = recipeToDelete.value.id || recipeToDelete.value._id;
      await axios.delete(`/api/recipes/${recipeId}`);
      await fetchRecipes(); 
      showToast("Recipe deleted successfully!");
      if (viewingRecipe.value && recipeToDelete.value && viewingRecipe.value.id === recipeToDelete.value.id) {
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
  
  // Add New Recipe Logic
  async function addNewRecipe(submittedRecipeData) {
    if (!submittedRecipeData.name) {
      showToast("Recipe name is required!", "error");
      return;
    }
    isLoading.value = true;
    apiError.value = null;
    try {
      await axios.post('/api/recipes', submittedRecipeData);
      await fetchRecipes(); 
      
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
</script>