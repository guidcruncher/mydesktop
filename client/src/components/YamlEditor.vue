<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
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
const highlightRef = ref(null)
const scrollViewRef = ref(null)
const gutterRef = ref(null)

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
    emit('validation-change', { isValid: false, error: errorMessage.value })
  }
}

const updateHighlighting = () => {
  if (!editorValue.value) {
    highlightedCode.value = ''
    syncHeight() // Ensure height syncs even on empty
    return
  }

  // Add a space if ends in newline to preserve visual height
  let codeToHighlight = editorValue.value
  if (codeToHighlight.endsWith('\n')) {
    codeToHighlight += ' '
  }

  const result = hljs.highlight(codeToHighlight, { language: 'yaml' })
  highlightedCode.value = result.value

  syncHeight()
}

const syncHeight = async () => {
  await nextTick()
  if (editorRef.value && highlightRef.value) {
    // FIX: Reset height to 'auto' first so it can shrink if lines are deleted
    editorRef.value.style.height = 'auto'
    highlightRef.value.parentElement.style.height = 'auto'

    // Now measure the true scrollHeight
    const height = editorRef.value.scrollHeight + 'px'

    // Apply new height
    editorRef.value.style.height = height
    highlightRef.value.parentElement.style.height = height
  }
}

const handleInput = (e) => {
  const val = e.target.value
  editorValue.value = val
  validateAndEmit(val)
  updateHighlighting()
}

// -- Scroll & Cursor Sync --

const handleScroll = () => {
  if (scrollViewRef.value && gutterRef.value) {
    gutterRef.value.scrollTop = scrollViewRef.value.scrollTop
  }
}

const updateCursorPos = () => {
  if (!editorRef.value) return

  const text = editorValue.value
  const pos = editorRef.value.selectionStart
  const sub = text.substring(0, pos)
  const lines = sub.split('\n')
  const row = lines.length
  const col = lines[lines.length - 1].length + 1

  cursorPos.value = `Ln ${row}, Col ${col}`
}

// -- Keyboard Handling --

const handleKeydown = (e) => {
  // Support Tab indentation (2 spaces)
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = editorRef.value.selectionStart
    const end = editorRef.value.selectionEnd
    const spaces = '  '

    // Insert spaces
    editorValue.value =
      editorValue.value.substring(0, start) + spaces + editorValue.value.substring(end)

    // Move cursor
    nextTick(() => {
      editorRef.value.selectionStart = editorRef.value.selectionEnd = start + spaces.length
      handleInput({ target: { value: editorValue.value } }) // trigger update
    })
  }
}

// -- Actions --

const formatYaml = () => {
  try {
    const obj = yaml.load(editorValue.value)
    const formatted = yaml.dump(obj, { indent: 2, lineWidth: -1 })
    editorValue.value = formatted
    validateAndEmit(formatted)
    updateHighlighting()
  } catch (e) {
    alert('Cannot format invalid YAML. Please fix errors first.')
  }
}

const copyContent = () => {
  navigator.clipboard.writeText(editorValue.value)
}

// -- Watchers & Lifecycle --

// Sync from parent prop to local state
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== editorValue.value) {
      editorValue.value = newVal
      validateAndEmit(newVal)
      updateHighlighting()
    }
  },
)

onMounted(() => {
  validateAndEmit(editorValue.value)
  updateHighlighting()
})

// Computed for line numbers
const lineNumbers = ref([1])

// FIX: Added { immediate: true } so line numbers generate on load
watch(
  editorValue,
  (newVal) => {
    const lines = newVal.split('\n').length
    lineNumbers.value = Array.from({ length: lines }, (_, i) => i + 1)
  },
  { immediate: true },
)
</script>

<template>
  <div class="ymledit-container">
    <div class="ymledit-toolbar">
      <div class="ymledit-title">
        <slot name="title">Editor</slot>
      </div>
      <div class="ymledit-actions">
        <button class="ymledit-btn" @click="formatYaml" title="Format Document">Format</button>
        <button class="ymledit-btn" @click="copyContent">Copy</button>
      </div>
    </div>

    <div class="ymledit-main">
      <div class="ymledit-gutter" ref="gutterRef">
        <div v-for="n in lineNumbers" :key="n">{{ n }}</div>
      </div>

      <div class="ymledit-scroll-view" ref="scrollViewRef" @scroll="handleScroll">
        <pre class="ymledit-highlight"><code 
          ref="highlightRef" 
          v-html="highlightedCode" 
          class="language-yaml"
        ></code></pre>

        <textarea
          ref="editorRef"
          class="ymledit-editor"
          v-model="editorValue"
          @input="handleInput"
          @keydown="handleKeydown"
          @keyup="updateCursorPos"
          @click="updateCursorPos"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
        ></textarea>
      </div>
    </div>

    <div class="ymledit-status-bar">
      <div class="status-indicator" :class="isValid ? 'status-valid' : 'status-error'">
        <span class="status-dot"></span>
        {{ isValid ? 'Valid YAML' : errorMessage }}
      </div>
      <div class="status-pos">{{ cursorPos }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped Styles */

.ymledit-container {
  /* Layout Variables */
  /* We use a specific stack and force the font size/line-height to be pixels 
     to avoid browser rounding errors (sub-pixel rendering) */
  --ymledit-font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  --ymledit-font-size: 14px;
  --ymledit-line-height: 21px; /* Fixed pixel height is crucial for alignment */
  --ymledit-padding: 15px;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--ymledit-bg);
  border: 1px solid var(--ymledit-border);
  border-radius: 6px;
  overflow: hidden;
}

/* --- Toolbar --- */
.ymledit-toolbar {
  padding: 8px 12px;
  background-color: var(--ymledit-toolbar-bg);
  border-bottom: 1px solid var(--ymledit-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.ymledit-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--ymledit-fg);
}

.ymledit-actions {
  display: flex;
  gap: 8px;
}

.ymledit-btn {
  background-color: var(--ymledit-toolbar-btn-bg);
  border: 1px solid var(--ymledit-toolbar-btn-border);
  color: var(--ymledit-fg);
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}
.ymledit-btn:hover {
  background-color: var(--ymledit-toolbar-btn-hover);
}

/* --- Main Editor Area --- */
.ymledit-main {
  flex: 1;
  position: relative;
  display: flex;
  overflow: hidden;
}

.ymledit-gutter {
  width: 45px;
  background-color: var(--ymledit-gutter-bg);
  color: var(--ymledit-gutter-fg);
  text-align: right;
  padding: var(--ymledit-padding) 8px var(--ymledit-padding) 0;
  font-family: var(--ymledit-font-family);
  font-size: var(--ymledit-font-size);
  line-height: var(--ymledit-line-height);
  user-select: none;
  border-right: 1px solid var(--ymledit-border);
  overflow: hidden;
}

.ymledit-scroll-view {
  flex: 1;
  position: relative;
  overflow: auto;
  background-color: var(--ymledit-bg);
}

/* --- The Core Alignment Fix --- */

/* 1. Shared Base Styles for both layers */
.ymledit-editor,
.ymledit-highlight {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  border: none;
  padding: var(--ymledit-padding);
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;

  /* Font Geometry - Must be identical */
  font-family: var(--ymledit-font-family) !important; /* Force override user agent */
  font-size: var(--ymledit-font-size) !important;
  line-height: var(--ymledit-line-height) !important;
  letter-spacing: 0px;
  word-spacing: 0px;

  /* Rendering - Must be identical to prevent width drift */
  tab-size: 2;
  white-space: pre;
  overflow: hidden;
  -webkit-font-smoothing: antialiased; /* Ensure both layers render font weight the same */
  -moz-osx-font-smoothing: grayscale;
}

/* 2. Highlight Layer Specifics */
.ymledit-highlight {
  z-index: 1;
  color: var(--ymledit-fg);
  pointer-events: none;
}

/* 3. Textarea Layer Specifics */
.ymledit-editor {
  z-index: 2;
  color: transparent; /* Hide text, show cursor */
  background: transparent;
  caret-color: var(--ymledit-caret);
  resize: none;
  outline: none;
}
.ymledit-editor::selection {
  background: var(--ymledit-selection);
  color: transparent;
}

/* 4. RESET Highlight.js inner code element 
   (Crucial: browsers often add padding/margin/font changes to <code> tags) */
.ymledit-highlight code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  padding: 0;
  margin: 0;
  white-space: pre;
}

/* --- Status Bar --- */
.ymledit-status-bar {
  padding: 4px 12px;
  border-top: 1px solid var(--ymledit-border);
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--ymledit-gutter-bg);
  color: var(--ymledit-fg);
  height: 28px;
  flex-shrink: 0;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.status-valid {
  background-color: var(--ymledit-status-ok-bg);
  color: var(--ymledit-status-ok-fg);
}
.status-error {
  background-color: var(--ymledit-status-err-bg);
  color: var(--ymledit-status-err-fg);
}

/* Syntax Highlighting */
:deep(.hljs-attr) {
  color: var(--ymledit-syntax-key);
  font-weight: 600;
}
:deep(.hljs-string) {
  color: var(--ymledit-syntax-string);
}
:deep(.hljs-number) {
  color: var(--ymledit-syntax-value);
}
:deep(.hljs-comment) {
  color: var(--ymledit-syntax-comment);
  font-style: italic;
}
:deep(.hljs-literal) {
  color: var(--ymledit-syntax-keyword);
}
:deep(.hljs-bullet) {
  color: var(--ymledit-syntax-keyword);
}
:deep(.hljs-meta) {
  color: var(--ymledit-syntax-meta);
}
:deep(.hljs-variable) {
  color: var(--ymledit-syntax-string);
}
</style>
