<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isVisible" class="overlay">
        <transition name="pop">
          <div v-if="isVisible" class="ui-alert__dialog">
            <div class="content">
              <h3 v-if="title" class="title">{{ title }}</h3>
              <p v-if="message" class="message">{{ message }}</p>
            </div>

            <div class="actions" :class="{ 'actions--vertical': actions.length > 2 }">
              <button
                v-for="(action, index) in actions"
                :key="index"
                class="action-button"
                :class="getActionButtonClass(action.style)"
                @click="handleActionClick(index, action.handler)"
              >
                {{ action.text }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

// --- Type Definitions ---
export type UIAlertActionStyle = 'default' | 'cancel' | 'destructive'
export type UIAlertActionHandler = (actionIndex: number) => void

export interface UIAlertAction {
  title: string
  style: UIAlertActionStyle
  handler?: UIAlertActionHandler
}

interface Props {
  // Controls the visibility of the dialog
  modelValue: boolean
  title?: string
  message?: string
  actions: UIAlertAction[]
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'action-clicked'])

// Internal state for visibility management
const isVisible = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newVal) => {
    isVisible.value = newVal
  },
)

// --- Component Logic ---
const getActionButtonClass = (style: UIAlertActionStyle) => {
  return {
    'action-button--default': style === 'default',
    'action-button--cancel': style === 'cancel',
    'action-button--destructive': style === 'destructive',
  }
}

const handleActionClick = (index: number, handler?: UIAlertActionHandler) => {
  // 1. Execute the handler function if provided
  if (handler) {
    handler(index)
  }

  // 2. Emit a general event for parent component tracking
  emit('action-clicked', index)

  // 3. Close the alert and update the modelValue prop
  isVisible.value = false
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.ui-alert__dialog {
  max-width: 270px;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;

  // The Alert Glass Effect (simulating UIVisualEffectView)
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);

  // No border needed here, separation is done by the action row borders
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  .content {
    padding: 20px 16px 15px;
    text-align: center;
    color: var(--ui-text-primary);

    .title {
      font-size: 17px;
      font-weight: 600;
      margin: 0 0 4px;
      line-height: 1.2;
    }

    .message {
      font-size: 13px;
      font-weight: 400;
      color: var(--ui-text-primary);
      margin: 0;
      opacity: 0.9;
    }
  }

  .actions {
    display: flex;
    border-top: 0.5px solid var(--ui-separator);

    &.actions--vertical {
      flex-direction: column;

      .action-button {
        border-left: none; // Remove vertical separator
        border-bottom: 0.5px solid var(--ui-separator); // Add horizontal separator

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .action-button {
    flex: 1;
    height: 44px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 17px;
    outline: none;
    transition: background-color 0.1s;
    white-space: nowrap;

    // Default style
    color: var(--system-blue);
    font-weight: 400;

    // Separator for horizontal buttons (1 or 2 actions)
    &:not(:last-child) {
      border-right: 0.5px solid var(--ui-separator);
    }

    // Pressed state feedback
    &:active {
      background: rgba(0, 0, 0, 0.05);
    }

    &--default {
      color: var(--system-blue);
    }

    // Styles specific to UIAlertActionStyle
    &--destructive {
      color: var(--system-red);
    }

    &--cancel {
      font-weight: 600; // Cancel buttons are usually bold
    }
  }
}

// --- Transition Styles ---
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.3, 1.2, 0.7, 1);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
