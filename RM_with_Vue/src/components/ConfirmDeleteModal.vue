<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
      <h3 class="text-2xl text-orange-600 mb-4">Confirm Delete</h3>
      <p class="mb-6">Are you sure you want to delete "{{ recipeName }}"?</p>
      <div class="flex justify-center space-x-4">
        <button @click="$emit('cancel')" 
                class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors">
          Cancel
        </button>
        <button @click="$emit('confirm')" 
                class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors">
          Delete
        </button>
      </div>                    
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  show: Boolean,
  recipeName: String
});
defineEmits(['cancel', 'confirm']);
</script>