<script setup lang="ts"></script>

<template>
  <div class="app-container">
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/data">Data</router-link>
    </nav>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  font-family: Arial, sans-serif;
  text-align: center;
  margin-top: 40px;
}

nav {
  margin-bottom: 20px;
  padding: 10px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  margin: 0 10px;
}

nav a.router-link-active {
  color: #42b983;
}
</style>
