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
import UISwitch from '@/components/UISwitch.vue'

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

const initialSwitchState = ref(props.switchState === 'on')

const handleSwitchChange = (val: boolean) => {
  initialSwitchState.value = val
}

const getAccessoryIcon = (acc: Accessory): string => {
  switch (acc) {
    case 'chevron':
      return 'chevron'
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
  /* Solid Background */
  background: var(--ui-card-bg);
  border-bottom: 0.5px solid var(--ui-separator);
  font-size: 17px;

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
    color: var(--text-color);
    margin-right: 10px;
  }

  &__value {
    flex: 1;
    text-align: right;
    color: var(--ui-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__accessory {
    margin-left: 10px;
    color: var(--ui-text-tertiary);
    font-size: 14px;
  }
}
</style>
