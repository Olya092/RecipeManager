<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] backdrop-blur-sm">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h3 class="text-2xl text-orange-600 mb-4">Edit Recipe</h3>
      <RecipeForm
        v-if="recipeData"
        :modelValue="recipeData"
        @update:modelValue="updateLocalRecipeData"
        submit-button-text="Save"
        form-id-prefix="edit-recipe"
        :show-cancel-button="true"
        @submit="handleSave"
        @cancel="$emit('close')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import RecipeForm from './RecipeForm.vue';

const props = defineProps({
  show: Boolean,
  recipe: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['close', 'save']);
const recipeData = ref(null);

watch(() => props.recipe, (newVal) => {
  if (newVal) {
    recipeData.value = { ...newVal };
  } else {
    recipeData.value = null;
  }
}, { immediate: true, deep: true });

function updateLocalRecipeData(updatedData) {
    recipeData.value = updatedData;
}
function handleSave() {
  if (recipeData.value) {
    emit('save', { ...recipeData.value });
  }
}
</script>