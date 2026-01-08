<template>
  <div class="ui-tabs-container">
    <div class="ui-tabs-nav">
      <div 
        v-for="tab in tabs" 
        :key="tab.props.name"
        class="ui-tab-btn"
        :class="{ active: activeTab === tab.props.name }"
        @click="selectTab(tab.props.name)"
      >
        {{ tab.props.label }}
      </div>
    </div>
    <div class="ui-tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, useSlots, watchEffect } from 'vue';

const props = defineProps({
  modelValue: String
});

const emit = defineEmits(['update:modelValue']);

const slots = useSlots();
const tabs = ref([]);
const activeTab = ref(props.modelValue);

// Watch for slot changes (naive implementation)
watchEffect(() => {
  if (slots.default) {
    tabs.value = slots.default().filter(child => child.type && child.type.__name === 'OsTabPane');
    if (!activeTab.value && tabs.value.length > 0) {
      activeTab.value = tabs.value[0].props.name;
    }
  }
});

const selectTab = (name) => {
  activeTab.value = name;
  emit('update:modelValue', name);
};

provide('activeTab', activeTab);
</script>

<style scoped>
.ui-tabs-container { display: flex; flex-direction: column; height: 100%; }
.ui-tabs-nav { display: flex; gap: 4px; border-bottom: 1px solid rgba(128,128,128,0.2); margin-bottom: 16px; position: relative; }

.ui-tab-btn {
  padding: 8px 16px; cursor: pointer; background: var(--tab-inactive-bg);
  border: var(--tab-border); border-radius: var(--tab-radius);
  color: var(--text-secondary); font-family: var(--font-family);
  font-size: 0.9rem; transition: all 0.2s ease;
}

.ui-tab-btn:hover { color: var(--text-color); background: rgba(var(--surface-rgb), 0.1); }
.ui-tab-btn.active { color: var(--text-color); background: var(--tab-active-bg); font-weight: 600; }
</style>
