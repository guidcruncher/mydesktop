<script setup>
const props = defineProps({
  width: {
    type: String,
    required: false,
    default: '90%', // Default responsive width
  },
  height: {
    type: String,
    required: false,
    default: '400px', // Default minimum height
  },
})
</script>

<template>
  <div class="folder-view-container" :style="{ width: props.width }">
    <div class="folder-title">
      <slot name="title">
        {{ label }}
      </slot>
    </div>

    <div class="collection-view" :style="{ width: props.width, height: props.height }">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.folder-view-container {
  margin: 20px auto;
  padding: 10px 10px 20px 10px;

  /* iOS Frosted Glass Effect 
  background-color: var(--color-folder-bg);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
*/
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-bottom: 1px solid var(--glass-border);

  border-radius: 40px;

  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 var(--color-folder-shadow);

  display: flex;
  flex-direction: column;

  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; /* Improves scrolling performance on iOS devices */
}

.folder-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary-text);
  padding: 10px 20px 10px 20px;
  text-align: left;
  /* Prevents the title from shrinking or scrolling with the content */
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .folder-view-container {
    margin: 10px;
  }
}

.collection-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  flex-grow: 1;
  min-width: 0;
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

.icon {
  font-size: 36px;
}

.cell-label {
  font-size: 13px;
  color: var(--primary-text);
  text-align: center;
  font-weight: 400;
}
</style>
