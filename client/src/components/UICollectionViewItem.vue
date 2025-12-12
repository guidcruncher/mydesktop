<template>
  <div class="cell">
    <div class="cell-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.collection-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cell-content {
  width: 80px;
  height: 80px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--shadow-base);
  margin-bottom: 8px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.cell-content:hover {
  transform: scale(0.95);
}

.cell:active .cell-content {
  transform: scale(0.9);
}
</style>
