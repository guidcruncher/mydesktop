<template>
  <button
    type="button"
    :class="['ui-dropdown-item', { 'is-selected': isSelected }]"
    :title="title || label"
    @click="handleClick"
  >
    <div class="icon-wrapper">
      <i v-if="icon" :class="icon" />
    </div>
    <span class="label-text">
      <slot>{{ label }}</slot>
    </span>

    <i v-if="isSelected" class="fa-solid fa-check check-icon" />
  </button>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  active: { type: Boolean, default: false }, // Manual override
  value: { type: [String, Number, Object], default: null }, // Unique ID for selection
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  title: { type: String, default: '' },
  routerlink: { type: String, default: undefined },
})

const emit = defineEmits(['click', 'navigate'])

// Inject context from parent UIDropdownMenu
const dropdownContext = inject('dropdownContext', null)

const isSelected = computed(() => {
  // Return true if manually active OR if matches parent's selected value
  if (props.active) return true
  if (dropdownContext && dropdownContext.selected.value !== undefined) {
    return dropdownContext.selected.value === props.value
  }
  return false
})

const handleClick = (ev) => {
  // 1. Handle Navigation
  if (props.routerlink) {
    emit('navigate', props)
    router.push({ path: props.routerlink, replace: true })
    if (dropdownContext) dropdownContext.closeMenu()
    return
  }

  // 2. Handle Selection (Updates parent model and closes menu)
  if (dropdownContext) {
    dropdownContext.handleSelect(props.value)
  }

  // 3. Emit standard click
  emit('click', ev)
}
</script>

<style lang="scss" scoped>
.ui-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  text-align: left;
  transition: all 0.2s ease;

  .icon-wrapper {
    width: 24px;
    display: flex;
    justify-content: center;
    margin-right: 8px;
    font-size: 16px;
  }

  .label-text {
    flex: 1;
  }

  .check-icon {
    font-size: 12px;
    margin-left: 8px;
    opacity: 0.8;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.is-selected {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 600;

    .icon-wrapper {
      color: #fff;
    }
  }
}
</style>
