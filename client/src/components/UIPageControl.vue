<template>
  <div class="ui-page-control">
    <div class="container">
      <div
        v-for="i in totalPages"
        :key="i"
        :class="['dot', { active: i - 1 === currentPage }]"
        @click="selectPage(i - 1)"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface Props {
  pages?: number | string
  currentPage?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  pages: 3,
  currentPage: 0,
})

const emit = defineEmits(['update:currentPage'])

const totalPages = ref(parseInt(props.pages.toString()))
const currentPage = ref(parseInt(props.currentPage.toString()))

const selectPage = (index: number) => {
  currentPage.value = index
  emit('update:currentPage', index)
}

// Sync internal state if the parent updates the prop
watch(
  () => props.currentPage,
  (newVal) => {
    currentPage.value = parseInt(newVal.toString())
  },
)
</script>

<style lang="scss" scoped>
.ui-page-control {
  display: inline-block;

  .container {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ui-text-tertiary);
    transition: all 0.2s;
    cursor: pointer;

    &.active {
      background: var(--ui-text-primary);
      transform: scale(1.1);
    }
  }
}
</style>
