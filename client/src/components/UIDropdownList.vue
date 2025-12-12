<template>
  <div class="ui-dropdown-root" :class="{ disabled: disabled }">
    <div
      ref="triggerRef"
      class="selected-display"
      @click="!disabled && (isOpen ? closeDropdown() : openDropdown())"
    >
      <div class="label-slot">
        <slot name="label">
          <div class="selected-text">
            <span v-if="selectedLabel">{{ selectedLabel }}</span
            ><span v-else> {{ placeholder }}</span>
          </div>
        </slot>
      </div>
      <!-- Chevron Icon: fa-chevron-down points down when closed (0deg) and up when open (-180deg) -->
      <i
        class="fa-solid fa-chevron-down accessory"
        :style="{ transform: isOpen ? 'rotate(-180deg)' : 'rotate(0deg)' }"
      />
    </div>

    <Teleport to="body">
      <div v-if="isOpen" class="ui-dropdown-overlay" @click.self="closeDropdown">
        <div
          ref="dropdownRef"
          class="ui-dropdown-popover-glass"
          :style="{
            top: position.top,
            left: position.left,
            minWidth: position.width,
            maxWidth: '300px',
          }"
        >
          <div class="items-list">
            <div
              v-for="item in items"
              :key="item.value"
              class="dropdown-item"
              :class="{ active: item.value === selectedValue }"
              @click="selectItem(item.value, item.label)"
            >
              <div class="label">{{ item.label }}</div>
              <div v-if="item.value === selectedValue" class="check">✓</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive, Teleport } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: null,
  },
  items: {
    type: Array,
    required: true,
    // Validator ensures each item has 'value' and 'label' keys
    validator: (arr) => arr.every((item) => 'value' in item && 'label' in item),
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
  // NEW: Disabled state prop to prevent interaction
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'selected'])

const isOpen = ref(false)
const selectedValue = ref(props.modelValue)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const position = reactive({ top: '0px', left: '0px', width: '0px' })

// Compute the label for the currently selected value
const selectedLabel = computed(() => {
  const selected = props.items.find((opt) => opt.value === selectedValue.value)
  return selected ? selected.label : null
})

// Watch modelValue changes from parent
watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue
  },
  { immediate: true },
)

// --- Dropdown Management ---

const openDropdown = () => {
  // Guard clause: Do not open if disabled
  if (props.disabled) return

  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()

    // Calculate position (8px below the trigger)
    position.top = `${rect.bottom + 8}px`
    position.left = `${rect.left}px`
    position.width = `${rect.width}px`

    // Simple check to ensure the popover doesn't go off-screen right
    const viewportWidth = window.innerWidth
    const popoverWidth = 300 // Fixed max width
    if (rect.left + popoverWidth > viewportWidth - 20) {
      // 20px margin
      position.left = `${viewportWidth - popoverWidth - 20}px`
    }

    isOpen.value = true
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

// --- Core Functionality ---

/**
 * Updates the selected value and emits events.
 * @param {any} value - The value of the selected item.
 * @param {string} label - The label of the selected item.
 */
const selectItem = (value, label) => {
  // Ensure interaction is blocked if disabled
  if (props.disabled) return

  selectedValue.value = value
  emit('update:modelValue', value)
  emit('selected', { value, label })
  closeDropdown()
}

// --- Click Outside Listener ---

const handleClickOutside = (event) => {
  // Check if click is outside the popover and outside the trigger
  if (
    isOpen.value &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target) &&
    !triggerRef.value.contains(event.target)
  ) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
/* Scoped styles to match the iOS UI Kit */

/* --- UI Dropdown List Root Container --- */
.ui-dropdown-root {
  display: block; /* Typically used within a table cell or form */
  width: 100%;
}

/* Disabled state styling: applied via the class binding in the template */
.ui-dropdown-root.disabled .selected-display {
  cursor: not-allowed;
  background-color: var(--ui-card-bg-disabled, #f0f0f0);
  border-color: var(--ui-separator-disabled, #e0e0e0);
  opacity: 0.6; /* Dim the component */
}

.ui-dropdown-root.disabled .selected-display .selected-text {
  color: var(--ui-text-secondary); /* Grey out the text */
}

/* --- Selected Display/Trigger --- */
.selected-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 10px 16px;
  background: var(--ui-card-bg); /* Use card background for consistency */
  border-radius: var(--radius-medium);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: background 0.1s;
  border: 1px solid var(--ui-separator); /* Subtle border */
  min-height: 44px;
}
.selected-display:active {
  background: rgba(120, 120, 128, 0.1);
}

.label-slot {
  flex-grow: 1;
}

.selected-text {
  font-size: 17px;
  color: var(--system-blue);
  font-weight: 500;
}

/* --- Accessory Icon --- */
.accessory {
  transition: transform 0.2s;
  width: 14px;
  height: 14px;
  fill: var(--ui-text-secondary);
  flex-shrink: 0;
  margin-left: 10px;
}

/* --- Teleported Popover --- */
.ui-dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 500;
}

.ui-dropdown-popover-glass {
  position: absolute;
  z-index: 501;
  /* Glass effect */
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-medium);
  overflow: hidden;
  max-height: 400px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform-origin: top left;
  animation: popin 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  /* Min width set in template for responsive positioning */
}

@keyframes popin {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* --- Items List Container --- */
.items-list {
  max-height: 300px;
  overflow-y: auto;
}

/* --- Individual Dropdown Item --- */
.dropdown-item {
  padding: 12px 16px;
  font-size: 17px;
  cursor: pointer;
  border-bottom: 0.5px solid var(--ui-separator);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--ui-text-primary);
  transition: background-color 0.1s;
}
.dropdown-item:last-child {
  border-bottom: none;
}
.dropdown-item:hover {
  background-color: rgba(120, 120, 128, 0.1);
}
.dropdown-item.active {
  font-weight: 600;
  color: var(--system-blue);
}

.check {
  color: var(--system-blue);
  font-weight: 900;
  font-size: 20px;
  line-height: 1;
}
</style>
