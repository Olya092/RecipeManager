<template>
    <div 
      class="border rounded-lg p-3 mb-4 cursor-pointer hover:bg-orange-50 transition-colors"
      @click="$emit('view')"
    >
      <div class="flex mb-3">
        <img 
          :src="recipe.image || defaultImage" 
          :alt="recipe.name" 
          class="w-16 h-16 object-cover rounded-md mr-3"
        >
        <div>
          <h4 class="font-bold">{{ recipe.name }}</h4>
          <p class="text-sm text-gray-600">Category: {{ recipe.category }}</p>
        </div>
      </div>
      <p class="text-sm mb-2 truncate">{{ recipe.description }}</p>
      <div class="text-sm text-gray-600 mb-2">
        <p>Prep: {{ recipe.prepTime || '-' }} mins | Cook: {{ recipe.cookTime || '-' }} mins</p>
        <p>Temp: {{ recipe.temperature || '-' }}</p>
      </div>
      <div class="flex justify-between items-center">
        <a :href="recipe.link" target="_blank" class="text-orange-600 hover:underline text-sm" @click.stop>
          View Source
        </a>
        <div>
          <button @click.stop="$emit('edit')" class="text-orange-600 hover:underline text-sm mr-2">Edit</button>
          <span class="text-gray-400">|</span>
          <button @click.stop="$emit('delete')" class="text-orange-600 hover:underline text-sm ml-2">Delete</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  defineProps({
    recipe: {
      type: Object,
      required: true
    }
  });
  
  defineEmits(['view', 'edit', 'delete']);
  
  //const defaultImage = 'https://via.placeholder.com/150/FFDAB9/000000?Text=Recipe';
  const defaultImage = 'https://theme-assets.getbento.com/sensei/0a13254.sensei/assets/images/catering-item-placeholder-704x520.png';
  </script>