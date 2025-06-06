<template>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label :for="formId + '-image'" class="block mb-2 font-bold">
          <!-- Use editableRecipe for display to reflect local changes immediately -->
          {{ editableRecipe.image && editableRecipe.image !== defaultImagePlaceholder ? 'Current Image:' : 'Upload Image:' }}
        </label>
        <img v-if="editableRecipe.image && editableRecipe.image !== defaultImagePlaceholder" :src="editableRecipe.image" alt="Recipe Image" class="w-24 h-24 object-cover rounded-md mb-2">
        <input 
          type="file" 
          :id="formId + '-image'" 
          @change="handleImageUpload"
          accept="image/*"
          class="w-full p-2 border rounded border-gray-300"
        >
      </div>
      <div>
        <label :for="formId + '-name'" class="block mb-2 font-bold">Recipe Name:</label>
        <input 
          type="text" 
          :id="formId + '-name'" 
          v-model="editableRecipe.name" 
          required 
          class="w-full p-2 border rounded border-gray-300"
        >
      </div>
      <div>
        <label :for="formId + '-category'" class="block mb-2 font-bold">Category:</label>
        <select 
          :id="formId + '-category'" 
          v-model="editableRecipe.category" 
          class="w-full p-2 border rounded border-gray-300 appearance-none"
        >
          <option value="">-- Select Category --</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Dessert">Dessert</option>
          <option value="Snack">Snack</option>
          <option value="Appetizer">Appetizer</option>
          <option value="Main Course">Main Course</option>
          <option value="Side Dish">Side Dish</option>
          <option value="Beverage">Beverage</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label :for="formId + '-description'" class="block mb-2 font-bold">Description:</label>
        <textarea 
          :id="formId + '-description'" 
          v-model="editableRecipe.description" 
          class="w-full p-2 border rounded border-gray-300 min-h-[100px] resize-y"
        ></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label :for="formId + '-prep-time'" class="block mb-2 font-bold">Preparation Time:</label>
          <input 
            type="number" 
            :id="formId + '-prep-time'" 
            v-model.number="editableRecipe.prepTime" 
            min="0" 
            step="1" 
            placeholder="5 mins" 
            class="w-full p-2 border rounded border-gray-300"
          >
        </div>
        <div>
          <label :for="formId + '-cook-time'" class="block mb-2 font-bold">Cooking Time:</label>
          <input 
            type="number" 
            :id="formId + '-cook-time'" 
            v-model.number="editableRecipe.cookTime" 
            min="0" 
            step="1" 
            placeholder="5 mins" 
            class="w-full p-2 border rounded border-gray-300"
          >
        </div>
      </div>
      <div>
        <label :for="formId + '-temperature'" class="block mb-2 font-bold">Temperature:</label>
        <input 
          type="text" 
          :id="formId + '-temperature'" 
          v-model="editableRecipe.temperature" 
          class="w-full p-2 border rounded border-gray-300"
        >
      </div>
      <div>
        <label :for="formId + '-link'" class="block mb-2 font-bold">Recipe Link:</label>
        <input 
          type="url" 
          :id="formId + '-link'" 
          v-model="editableRecipe.link" 
          placeholder="Paste the recipe URL here" 
          class="w-full p-2 border rounded border-gray-300"
        >
      </div>
      <div class="text-center">
        <button 
          type="submit" 
          class="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition-colors"
        >
          {{ submitButtonText }}
        </button>
        <button 
          v-if="showCancelButton"
          type="button" 
          @click="$emit('cancel')"
          class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors ml-4"
        >
          Cancel
        </button>
      </div>
    </form>
  </template>
  
  <script setup>
  import { ref, watch, computed } from 'vue';
  
  const props = defineProps({
    modelValue: { 
      type: Object,
      default: () => ({
        image: '', 
        name: '',
        category: '',
        description: '',
        prepTime: null,
        cookTime: null,
        temperature: '',
        link: ''
      })
    },
    submitButtonText: {
      type: String,
      default: 'Submit'
    },
    formIdPrefix: { 
      type: String,
      default: 'recipe-form'
    },
    showCancelButton: {
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);
  
  const defaultImagePlaceholder = ''; 
  
  // Initialize editableRecipe with a deep copy of modelValue
  const editableRecipe = ref(JSON.parse(JSON.stringify(props.modelValue)));
  
  // Watcher 1: Update local 'editableRecipe' ONLY if 'props.modelValue' changes
  // from an external source AND is different from the current 'editableRecipe'.
  // This is primarily for when a new recipe is loaded into the form for editing.
  watch(() => props.modelValue, (newModelValue) => {
    // Simple string comparison for deep equality check (can be improved for complex cases)
    // This prevents the loop if the update originated from this component's emit.
    if (JSON.stringify(newModelValue) !== JSON.stringify(editableRecipe.value)) {
      editableRecipe.value = JSON.parse(JSON.stringify(newModelValue));
    }
  }, { deep: true });
  
  // Watcher 2: Emit 'update:modelValue' when local 'editableRecipe' changes (due to user input).
  watch(editableRecipe, (newEditableRecipe) => {
    emit('update:modelValue', JSON.parse(JSON.stringify(newEditableRecipe)));
  }, { deep: true });
  
  
  const formId = computed(() => props.formIdPrefix + (props.modelValue.id || Date.now()));
  
  
  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        editableRecipe.value.image = e.target.result; // This will trigger Watcher 2
      };
      reader.readAsDataURL(file);
    }
  }
  
  function handleSubmit() {
    emit('submit', JSON.parse(JSON.stringify(editableRecipe.value)));
  }
  </script>