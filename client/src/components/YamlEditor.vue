<template>
  <div class="yaml-editor">
    <div class="ymledit-toolbar">
      <div class="status-indicator">
        <span class="status-dot" :class="isValid ? 'status-valid' : 'status-error'"></span>
        <span v-if="isValid">Valid YAML</span>
        <span v-else>Invalid YAML</span>
      </div>
      <div class="toolbar-actions">
        <button class="toolbar-btn" @click="copyToClipboard" title="Copy">
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div class="gutter" ref="gutterRef">
        <div v-for="line in lineCount" :key="line" class="line-num">
          {{ line }}
        </div>
      </div>

      <div class="code-area">
        <pre class="highlight-layer" aria-hidden="true"><code v-html="highlightedCode"></code></pre>

        <textarea
          ref="editorRef"
          v-model="editorValue"
          class="input-layer"
          @input="handleInput"
          @scroll="syncScroll"
          @keydown.tab.prevent="insertTab"
          spellcheck="false"
        ></textarea>
      </div>
    </div>

    <div class="ymledit-status-bar">
      <span>{{ cursorPos }}</span>
      <span v-if="errorMessage" class="error-msg">{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import yaml from 'js-yaml'
import hljs from 'highlight.js/lib/core'
import yamlLang from 'highlight.js/lib/languages/yaml'

// Register YAML language
hljs.registerLanguage('yaml', yamlLang)

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'validation-change'])

// State
const editorValue = ref(props.modelValue)
const highlightedCode = ref('')
const isValid = ref(true)
const errorMessage = ref('')
const cursorPos = ref('Ln 1, Col 1')

// Refs to DOM elements
const editorRef = ref(null)
const gutterRef = ref(null)

const lineCount = computed(() => {
  return editorValue.value.split('\n').length
})

// -- Core Logic --

const validateAndEmit = (val) => {
  try {
    // Parse YAML to check validity
    const parsed = yaml.load(val)

    // If we get here, it's valid
    isValid.value = true
    errorMessage.value = ''

    // Only emit update if valid
    emit('update:modelValue', val)
    emit('validation-change', { isValid: true, error: null })
  } catch (e) {
    isValid.value = false
    // Extract first line of error for brevity
    errorMessage.value = e.message ? e.message.split('\n')[0] : 'Invalid YAML'
    emit('validation-change', { isValid: false, error: e.message })
  }
}

const highlight = () => {
  if (!editorValue.value) {
    highlightedCode.value = ''
    return
  }
  const result = hljs.highlight(editorValue.value, { language: 'yaml' })
  highlightedCode.value = result.value
}

const handleInput = (e) => {
  const val = e.target.value
  editorValue.value = val
  highlight()
  validateAndEmit(val)
  updateCursor(e)
}

const insertTab = (e) => {
  const start = e.target.selectionStart
  const end = e.target.selectionEnd
  const val = editorValue.value

  // Insert 2 spaces for YAML
  editorValue.value = val.substring(0, start) + '  ' + val.substring(end)

  nextTick(() => {
    e.target.selectionStart = e.target.selectionEnd = start + 2
    highlight()
  })
}

const syncScroll = (e) => {
  // Sync highlight layer scroll
  const highlightLayer = e.target.previousElementSibling
  if (highlightLayer) {
    highlightLayer.scrollTop = e.target.scrollTop
    highlightLayer.scrollLeft = e.target.scrollLeft
  }
  // Sync Gutter
  if (gutterRef.value) {
    gutterRef.value.scrollTop = e.target.scrollTop
  }
}

const updateCursor = (e) => {
  const val = editorValue.value.substring(0, e.target.selectionStart)
  const lines = val.split('\n')
  const line = lines.length
  const col = lines[lines.length - 1].length + 1
  cursorPos.value = `Ln ${line}, Col ${col}`
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(editorValue.value)
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== editorValue.value) {
      editorValue.value = newVal
      highlight()
    }
  },
)

onMounted(() => {
  highlight()
  // Add listeners for cursor tracking
  if (editorRef.value) {
    editorRef.value.addEventListener('click', updateCursor)
    editorRef.value.addEventListener('keyup', updateCursor)
  }
})
</script>

<style lang="scss" scoped>
.yaml-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 300px;
  background-color: var(--ymledit-bg);
  border: 1px solid var(--ymledit-border);
  border-radius: 6px;
  overflow: hidden;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
}

/* --- Toolbar --- */
.ymledit-toolbar {
  height: 36px;
  /* Solid Background */
  background-color: var(--ymledit-toolbar-bg);
  border-bottom: 1px solid var(--ymledit-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ymledit-fg);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-valid {
  background-color: var(--ymledit-status-ok-bg);
}
.status-error {
  background-color: var(--ymledit-status-err-bg);
}

.toolbar-btn {
  background: var(--ymledit-toolbar-btn-bg);
  border: 1px solid var(--ymledit-toolbar-btn-border);
  color: var(--ymledit-fg);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.toolbar-btn:hover {
  background: var(--ymledit-toolbar-btn-hover);
}

/* --- Editor Container --- */
.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.gutter {
  width: 40px;
  background-color: var(--ymledit-gutter-bg);
  color: var(--ymledit-gutter-fg);
  border-right: 1px solid var(--ymledit-border);
  padding: 10px 0;
  text-align: right;
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  user-select: none;
}

.line-num {
  padding-right: 8px;
}

.code-area {
  flex: 1;
  position: relative;
}

.highlight-layer,
.input-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 10px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  box-sizing: border-box;
  white-space: pre;
  overflow: auto;
}

.highlight-layer {
  z-index: 1;
  pointer-events: none;
  color: var(--ymledit-fg);
}

.input-layer {
  z-index: 2;
  color: transparent;
  background: transparent;
  caret-color: var(--ymledit-caret);
  resize: none;
  outline: none;
}

/* --- Status Bar --- */
.ymledit-status-bar {
  height: 24px;
  background-color: var(--ymledit-toolbar-bg);
  border-top: 1px solid var(--ymledit-border);
  color: var(--ymledit-fg);
  font-size: 11px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
}

.error-msg {
  color: var(--ymledit-status-err-fg);
}

/* Syntax Highlighting Colors (Mapped to Vars) */
:deep(.hljs-attr) {
  color: var(--ymledit-syntax-key);
}
:deep(.hljs-string) {
  color: var(--ymledit-syntax-string);
}
:deep(.hljs-number) {
  color: var(--ymledit-syntax-value);
}
:deep(.hljs-literal) {
  color: var(--ymledit-syntax-keyword);
}
:deep(.hljs-comment) {
  color: var(--ymledit-syntax-comment);
  font-style: italic;
}
</style>
