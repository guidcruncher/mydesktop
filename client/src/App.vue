<script setup lang="ts">
import { ref } from 'vue'

const menuData = [
  {
    id: 'sys',
    isLogo: true,
    items: [
      { label: 'Desktop', id: 'about', to: '/' },
      { type: 'separator' },
      { label: 'System Settings...', id: 'settings', to: '/config' },
      { label: 'Icons', id: 'store', to: '/icons' },
      { type: 'separator' },
    ],
  },
]
</script>

<template>
  <UIDropdownMenu :menu="menuData">
    <template #app-title>My Desktop</template>
    <template #right-toolbar>
      <UIThemeChooser />
    </template>
  </UIDropdownMenu>

  <Container>
    <router-view></router-view>
  </Container>
</template>

<style lang="scss" scoped></style>
