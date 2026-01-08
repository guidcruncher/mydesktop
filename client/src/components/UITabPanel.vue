<template>
  <div class="ui-tab-pane" :class="{ active: isActive }">
    <slot v-if="isActive"></slot>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true }
});

const activeTab = inject('activeTab');
const isActive = computed(() => activeTab.value === props.name);
</script>

<style scoped>
.ui-tab-pane { display: none; animation: fadeIn 0.3s ease; }
.ui-tab-pane.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>
