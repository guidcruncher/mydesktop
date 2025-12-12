<script setup lang="ts">
import { ref, onMounted } from 'vue'

const message = ref<string>('Loading...')
const items = ref<{ id: number; name: string }[]>([])

onMounted(async () => {
  try {
    // Fetch hello message
    const resHello = await fetch('/api/hello')
    const dataHello = await resHello.json()
    message.value = dataHello.message

    // Fetch data list
    const resData = await fetch('/api/data')
    const dataItems = await resData.json()
    items.value = dataItems.items
  } catch (error) {
    console.error('API Error:', error)
    message.value = 'Error connecting to server'
  }
})
</script>

<template>
  <div class="container">
    <h1>Vue 3 + Fastify</h1>
    <div class="card">
      <h2>Server Message:</h2>
      <p class="highlight">{{ message }}</p>
    </div>

    <div class="card" v-if="items.length">
      <h2>Database Items:</h2>
      <ul>
        <li v-for="item in items" :key="item.id">
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.card {
  border: 1px solid #ddd;
  padding: 20px;
  margin: 20px auto;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.highlight {
  color: #42b983;
  font-weight: bold;
  font-size: 1.2em;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  background: #f9f9f9;
  margin: 5px 0;
  padding: 10px;
  border-radius: 4px;
}
</style>
