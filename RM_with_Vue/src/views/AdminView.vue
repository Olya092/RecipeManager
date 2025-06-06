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
            <h2 class="text-3xl text-orange-600 text-center sm:text-left mb-4 sm:mb-0">Current Recipe List</h2>
            <div class="w-full sm:w-auto flex items-center space-x-2">
                <input 
                    type="text" 
                    v-model="searchQuery" 
                    @keyup.enter="triggerSearch"
                    @input="fetchRecipesDebounced" 
                    placeholder="Search recipes..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
                />
                <button 
                    @click="triggerSearch" 
                    class="p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
                    aria-label="Search"
                >
                    <!-- SVG icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Added: Loading and error states -->
        <div v-if="isLoading" class="text-center py-8">Loading recipes...</div>
        <div v-if="apiError" class="text-center py-8 text-red-500">{{ apiError }}</div>
        
        <!-- Card-based view for small screens (visible only on small screens) -->
        <div v-if="!isLoading && !apiError" class="sm:hidden space-y-4">
          <div class="bg-white rounded-lg shadow p-4">
            <!-- Search input is now above this section -->
            <RecipeCard
              v-for="(recipe, index) in filteredRecipes" 
              :key="'card-' + (recipe.id || index)" 
              :recipe="recipe"
              @view="openRecipeViewModal(recipe)"
              @edit="openEditModalWithRecipe(recipe)"
              @delete="openDeleteModalWithRecipe(recipe)"
            />
            <p v-if="!filteredRecipes.length && searchQuery" class="text-gray-500 text-center py-4">No recipes match your search.</p>
            <p v-if="!recipes.length && !searchQuery" class="text-gray-500 text-center py-4">No recipes yet. Add one below!</p>
          </div>
        </div>
        
        <!-- Table view for larger screens (hidden on small screens) -->
        <section v-if="!isLoading && !apiError" class="hidden sm:block bg-white rounded-lg shadow-md p-5 mb-5">
          <article>
            <!-- Search input is now above this section -->
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
            <p v-if="!filteredRecipes.length && searchQuery" class="text-gray-500 text-center py-8">No recipes match your search.</p>
            <p v-if="!recipes.length && !searchQuery" class="text-gray-500 text-center py-8">No recipes yet. Add one below!</p>
          </article>
        </section>
        
        <!-- Add New Recipe Section -->
        <section v-if="!isLoading && !apiError" class="bg-white rounded-lg shadow-md p-5">
          <h3 class="text-2xl text-orange-600 text-center mb-4">Here the magic ✨ will happen and a new recipe 🍳 will be born!</h3>
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
  import { ref, computed, onMounted } from "vue"; 
  import RecipeViewModal from '../components/RecipeViewModal.vue';
  import RecipeEditModal from '../components/RecipeEditModal.vue';
  import ConfirmDeleteModal from '../components/ConfirmDeleteModal.vue';
  import RecipeCard from '../components/RecipeCard.vue';
  import RecipeListItem from '../components/RecipeListItem.vue';
  import RecipeForm from '../components/RecipeForm.vue';
  import axios from 'axios';
  
  const initialNewRecipeState = () => ({
    image: '', name: '', category: '', description: '',
    prepTime: null, cookTime: null, temperature: '', link: ''
  });

  const recipes = ref([]); 
  const newRecipe = ref(initialNewRecipeState());
  
  const searchQuery = ref('');
  const isLoading = ref(false);
  const apiError = ref(null);

  //let debounceTimer = null;

  // --- API Calls ---

  const fetchRecipes = async () => {
    isLoading.value = true;
    apiError.value = null;
    try {
      const params = {};
      if (searchQuery.value) {
        params.search = searchQuery.value;
      }
      // if (selectedCategory.value && selectedCategory.value !== 'All') { // If add category filter
      //   params.category = selectedCategory.value;
      // }
      const response = await axios.get('/api/recipes', { params });
      recipes.value = response.data.recipes; // Assuming backend returns { recipes: [...] }
      console.log('Received recipes:', recipes.value); // Add this line to debug
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
      apiError.value = "Failed to load recipes. Please try again later.";
      recipes.value = []; // Clear recipes on error
      showToast(apiError.value, "error");
    } finally {
      isLoading.value = false;
    }
  };

  // const fetchRecipesDebounced = () => {
  //   clearTimeout(debounceTimer);
  //   debounceTimer = setTimeout(fetchRecipes, 500); // 500ms delay
  // };

  const triggerSearch = () => {
    fetchRecipes();
  };

  onMounted(() => {
    fetchRecipes();
  });

  // const filteredRecipes = computed(() => {
  //   if (!searchQuery.value) {
  //     return recipes.value; // Return all recipes if search query is empty
  //   }
  //   const lowerSearchQuery = searchQuery.value.toLowerCase();
  //   return recipes.value.filter(recipe => {
  //     return (
  //       (recipe.name && recipe.name.toLowerCase().includes(lowerSearchQuery)) ||
  //       (recipe.category && recipe.category.toLowerCase().includes(lowerSearchQuery)) ||
  //       (recipe.description && recipe.description.toLowerCase().includes(lowerSearchQuery)) ||
  //       (recipe.temperature && recipe.temperature.toLowerCase().includes(lowerSearchQuery)) ||
  //       (recipe.prepTime !== null && String(recipe.prepTime).includes(lowerSearchQuery)) ||
  //       (recipe.cookTime !== null && String(recipe.cookTime).includes(lowerSearchQuery))   
  //     );
  //   });
  // });

  const filteredRecipes = computed(() => {
    return recipes.value;
  });

  // Helper to find the original index in the `recipes` array for a recipe from `filteredRecipes`
  // function findOriginalIndex(filteredRecipe) {
  //   return recipes.value.findIndex(r => r.id === filteredRecipe.id);
  // }

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
    setTimeout(() => { // Ensure toast is still a child before removing
        if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
        }
    }, 3000);
  }
  
  // View Modal State & Logic
  const showRecipeModal = ref(false);
  const viewingRecipe = ref(null); 
  
  function openRecipeViewModal(recipe) {
    viewingRecipe.value = recipe; // recipe here is from filteredRecipes
    showRecipeModal.value = true;
  }
  function closeRecipeViewModal() {
    showRecipeModal.value = false;
    viewingRecipe.value = null;
  }
  
  // Edit Modal State & Logic
  const showEditModal = ref(false);
  const editingRecipeData = ref(null); 
  //let editingRecipeOriginalIndex = -1; // Removed originalIndex, will find by ID
  
  function openEditModalWithRecipe(recipe) {
    editingRecipeData.value = { ...recipe }; 
    //editingRecipeOriginalIndex = originalIndex; 
    showEditModal.value = true;
    if (showRecipeModal.value) closeRecipeViewModal(); 
  }
  
  function editRecipeFromView() {
    if (viewingRecipe.value) {
      //const originalIndex = findOriginalIndex(viewingRecipe.value);
      //if (originalIndex !== -1) {
        openEditModalWithRecipe(viewingRecipe.value);
      //}
    }
  }
  
  function closeEditModal() {
    showEditModal.value = false;
    editingRecipeData.value = null;
    //editingRecipeOriginalIndex = -1;
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
      // Change this line:
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
  //let recipeToDeleteOriginalIndex = -1;
  
  function openDeleteModalWithRecipe(recipe) {
    recipeToDelete.value = recipe;
    //recipeToDeleteOriginalIndex = originalIndex; 
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
    //recipeToDeleteOriginalIndex = -1;
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
      // Change this line:
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

