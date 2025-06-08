<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="text-right">
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-if="recipe" class="text-center mb-4">
        <img :src="recipe.image || defaultImage" :alt="recipe.name" class="w-32 h-32 object-cover rounded-md mx-auto">
      </div>
      <h3 v-if="recipe" class="text-2xl text-orange-600 font-bold text-center mb-4">{{ recipe.name }}</h3>
      
      <div v-if="recipe" class="space-y-3 mb-6">
        <div class="flex justify-between">
          <span class="font-bold">Category:</span>
          <span>{{ recipe.category }}</span>
        </div>
        <div>
          <span class="font-bold">Description:</span>
          <p class="mt-1">{{ recipe.description }}</p>
        </div>
        <div class="flex justify-between">
          <span class="font-bold">Preparation Time:</span>
          <span>{{ recipe.prepTime || '-' }} mins</span>
        </div>
        <div class="flex justify-between">
          <span class="font-bold">Cooking Time:</span>
          <span>{{ recipe.cookTime || '-' }} mins</span>
        </div>
        <div class="flex justify-between">
          <span class="font-bold">Temperature:</span>
          <span>{{ recipe.temperature || '-' }}</span>
        </div>
        <div class="pt-2">
          <a :href="recipe.link" target="_blank" class="text-orange-600 hover:underline">View Original Recipe</a>
        </div>
      </div>
      
      <div class="flex justify-center space-x-4">
        <button @click="$emit('edit-recipe')" 
                class="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition-colors">
          Edit Recipe
        </button>
        <button @click="$emit('delete-recipe')" 
                class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors">
          Delete Recipe
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  show: Boolean,
  recipe: Object
});
defineEmits(['close', 'edit-recipe', 'delete-recipe']);
const defaultImage = 'https://theme-assets.getbento.com/sensei/0a13254.sensei/assets/images/catering-item-placeholder-704x520.png';
</script>