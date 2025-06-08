<template>
  <div class="w-full sm:w-auto">
    <!-- Search Input with Dropdown -->
    <div class="relative">
      <div class="flex items-center space-x-2">
        <!-- Text Search Input -->
        <div class="relative flex-1">
          <input 
            type="text" 
            v-model="displayValue" 
            @keyup.enter="triggerSearch"
            @focus="showSearchDropdown = true"
            @input="handleInput"
            placeholder="Search recipes or select category..."
            class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          />
          <!-- Clear button -->
          <button 
            v-if="displayValue"
            @click="clearAll"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Search Button -->
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

      <!-- Search Dropdown -->
      <div 
        v-if="showSearchDropdown" 
        class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
      >
        <!-- Categories Section -->
        <div class="p-2">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categories</div>
          <div class="space-y-1">
            <button
              v-for="category in availableCategories"
              :key="category"
              @click="selectCategory(category)"
              class="w-full text-left px-3 py-2 text-sm rounded hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center justify-between"
              :class="{ 'bg-orange-100 text-orange-700': localSelectedCategory === category }"
            >
              <span>{{ category }}</span>
              <span v-if="localSelectedCategory === category" class="text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <!-- Divider (only show if there are active filters) -->
        <div v-if="localSearchQuery || localSelectedCategory" class="border-t border-gray-200"></div>

        <!-- Quick Actions (only show if there are active filters) -->
        <div v-if="localSearchQuery || localSelectedCategory" class="p-2">
          <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Actions</div>
          <div class="space-y-1">
            <button
              @click="clearAll"
              class="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors text-gray-600"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="localSelectedCategory || localSearchQuery" class="mt-2 flex flex-wrap gap-2">
      <span v-if="localSelectedCategory" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Category: {{ localSelectedCategory }}
        <button @click="clearCategory" class="ml-1 text-orange-600 hover:text-orange-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </span>
      <span v-if="localSearchQuery" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Search: "{{ localSearchQuery }}"
        <button @click="clearSearchText" class="ml-1 text-blue-600 hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </span>
    </div>
  </div>

  <!-- Click outside to close dropdown -->
  <div 
    v-if="showSearchDropdown" 
    @click="showSearchDropdown = false" 
    class="fixed inset-0 z-5"
  ></div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  selectedCategory: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:searchQuery', 'update:selectedCategory', 'search', 'clear'])

// Local reactive data
const showSearchDropdown = ref(false)

// Local state that syncs with props
const localSearchQuery = ref(props.searchQuery)
const localSelectedCategory = ref(props.selectedCategory)

// The value displayed in the input field (always shows search query, never category)
const displayValue = computed({
  get() {
    return localSearchQuery.value
  },
  set(value) {
    localSearchQuery.value = value
    emit('update:searchQuery', value)
  }
})

// Watch for prop changes to update local state
watch(() => props.searchQuery, (newVal) => {
  localSearchQuery.value = newVal
})

watch(() => props.selectedCategory, (newVal) => {
  localSelectedCategory.value = newVal
})

// Available categories (should match your backend categories)
const availableCategories = ref([
  'All',
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Dessert',
  'Snack',
  'Appetizer',
  'Main Course',
  'Side Dish',
  'Beverage',
  'Other'
])

// Methods
const handleInput = (event) => {
  // User can always type in the search field regardless of category selection
  // This allows searching within a selected category
}

const triggerSearch = () => {
  showSearchDropdown.value = false
  // Always trigger search whether there's text, category, or both
  emit('search')
}

const selectCategory = (category) => {
  showSearchDropdown.value = false
  
  if (category === 'All') {
    // Clear everything and show all recipes immediately
    localSelectedCategory.value = ''
    localSearchQuery.value = ''
    emit('update:selectedCategory', '')
    emit('update:searchQuery', '')
    emit('clear') // This will trigger immediate fetch of all recipes
  } else {
    // Clear search query and set category, then search immediately
    localSearchQuery.value = ''
    localSelectedCategory.value = category
    emit('update:searchQuery', '')
    emit('update:selectedCategory', category)
    emit('search') // Immediate search for category
  }
}

const clearAll = () => {
  localSearchQuery.value = ''
  localSelectedCategory.value = ''
  showSearchDropdown.value = false
  emit('update:searchQuery', '')
  emit('update:selectedCategory', '')
  emit('clear') // This will trigger immediate fetch of all recipes
}

const clearCategory = () => {
  localSelectedCategory.value = ''
  emit('update:selectedCategory', '')
  emit('clear') // This will trigger immediate fetch of all recipes
}

const clearSearchText = () => {
  localSearchQuery.value = ''
  emit('update:searchQuery', '')
  // If category is still selected, search with just the category
  // If no category, clear and show all
  if (localSelectedCategory.value) {
    emit('search')
  } else {
    emit('clear')
  }
}
</script>