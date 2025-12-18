<script setup lang="ts"></script>

<template>
  <UINavigationBar title="Desktop">
    <template #left> </template>
    <template #right>
      <UIThemeChooser />
    </template>
  </UINavigationBar>
  <Container>
    <router-view></router-view>
  </Container>
</template>

<style lang="scss" scoped></style>
