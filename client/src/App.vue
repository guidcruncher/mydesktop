<script setup lang="ts">
import { ref } from 'vue'
const isMenuOpen = ref(false)
</script>

<template>
  <UINavigationBar title="Desktop">
    <template #left>
      <UIDropdownMenu v-model="isMenuOpen">
        <template #trigger="{ isOpen }">
          <UIDropdownMenuTrigger
            class="control-btn"
            icon="fa-solid fa-grip-lines"
            title="Desk"
            :active="isOpen"
          />
        </template>
        <UIDropdownMenuItem
          icon="fa-solid fa-gear"
          label="Configuration"
          title="Configuration"
          routerlink="/config"
        />
        <hr class="menu-divider" />
        <UIDropdownMenuItem
          icon="fa-solid fa-palette"
          label="Icons"
          title="Icons"
          routerlink="/icons"
        />
      </UIDropdownMenu>
    </template>
    <template #right>
      <UIThemeChooser />
    </template>
  </UINavigationBar>
  <Container>
    <router-view></router-view>
  </Container>
</template>

<style lang="scss" scoped></style>
