<template>
  <div class="table-cell">
    <div v-if="icon" class="table-cell__icon-box">
      <IconView :name="icon" />
    </div>

    <div v-if="label" class="table-cell__label">{{ label }}</div>

    <slot name="custom-content"></slot>
    <div v-if="value" class="table-cell__value">{{ value }}</div>

    <UISwitch
      v-if="type === 'switch'"
      :checked="initialSwitchState"
      @update:checked="handleSwitchChange"
    />

    <IconView v-if="accessory" :name="getAccessoryIcon(accessory)" class="table-cell__accessory" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import IconView from '@/components/IconView.vue'
import UISwitch from '@/components/UISwitch.vue' // Need to define this one too

type Accessory = 'chevron' | 'detail' | 'none'
type CellType = 'default' | 'switch' | 'input'

interface Props {
  label?: string
  value?: string
  icon?: string
  type?: CellType
  accessory?: Accessory
  switchState?: 'on' | 'off'
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  value: undefined,
  icon: undefined,
  type: 'default',
  accessory: undefined,
  switchState: 'off',
})

// For switch: manage its state internally, or use v-model if it were more complex
const initialSwitchState = ref(props.switchState === 'on')

const handleSwitchChange = (newState: boolean) => {
  initialSwitchState.value = newState
  // Emit event if parent component needs to react
  // emit('switchChange', newState);
}

const getAccessoryIcon = (acc: Accessory): string => {
  switch (acc) {
    case 'chevron':
      return 'chevron'
    // Add other accessory icons here if needed
    default:
      return ''
  }
}
</script>

<style lang="scss" scoped>
.table-cell {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-height: 48px;
  background: var(--ui-card-bg);
  border-bottom: 0.5px solid var(--ui-separator);
  font-size: 17px;

  // The parent (UITableView) handles the first/last-child logic to clear borders,
  // but we keep the separator here for general use.

  &:last-child {
    border-bottom: none;
  }

  &__icon-box {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: var(--system-blue);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;

    :deep(svg) {
      width: 18px;
      height: 18px;
      fill: white;
    }
  }

  &__label {
    flex: 0 0 auto;
    color: var(--ui-text-primary);
    margin-right: 10px;
  }

  &__value {
    flex: 1;
    text-align: right;
    color: var(--ui-text-secondary);
    margin-right: 8px;
  }

  // Slot content needs to be flexible to hold TextFields, TextViews, etc.
  :deep(slot[name='custom-content']) {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__accessory {
    color: var(--ui-text-tertiary);
    width: 14px;
    height: 14px;
    fill: currentColor;
    opacity: 0.6;
    margin-left: 8px;
  }
}
</style>
