<template>
    <tr 
      class="hover:bg-orange-50 transition-colors cursor-pointer"
      @click="$emit('view')"
    >
      <td class="p-3">
        <img 
          :src="recipe.image || defaultImage" 
          :alt="recipe.name" 
          class="w-12 h-12 object-cover rounded-md"
        >
      </td>
      <td class="p-3 font-medium">{{ recipe.name }}</td>
      <td class="p-3">{{ recipe.category }}</td>
      <td class="hidden md:table-cell p-3 max-w-xs truncate" :title="recipe.description">
          {{ recipe.description || 'No description :(' }}
      </td>
      <td class="hidden md:table-cell p-3 whitespace-nowrap">{{ recipe.prepTime || '-' }} mins</td>
      <td class="hidden lg:table-cell p-3 whitespace-nowrap">{{ recipe.cookTime || '-' }} mins</td>
      <td class="hidden lg:table-cell p-3">{{ recipe.temperature || '-' }}</td>
      <td class="p-3">
        <a :href="recipe.link" target="_blank" class="text-orange-600 hover:underline" @click.stop>View Source</a>
      </td>
      <td class="p-3 text-center">
        <div class="flex justify-center space-x-1">
          <button @click.stop="$emit('edit')" class="text-orange-600 hover:underline px-2 py-1">Edit</button>
          <span class="text-gray-400">|</span>
          <button @click.stop="$emit('delete')" class="text-orange-600 hover:underline px-2 py-1">Delete</button>
        </div>
      </td>
    </tr>
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
  
  //const defaultImage = 'https://via.placeholder.com/100/FFDAB9/000000?Text=R'; 
  const defaultImage = 'https://theme-assets.getbento.com/sensei/0a13254.sensei/assets/images/catering-item-placeholder-704x520.png';
  </script>