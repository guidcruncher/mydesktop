<template>
  <div class="demo-wrapper" :class="{ 'dark-mode': formData.darkMode }">
    <div class="demo-grid">
      <UISurface>
        <h2>Form Inputs</h2>

        <div class="form-row">
          <div class="form-group" style="flex: 1">
            <label>Username</label>
            <UITextBox v-model="formData.username" placeholder="Enter username..." />
          </div>
          <div class="form-group" style="flex: 1">
            <label>Password</label>
            <UITextBox v-model="formData.password" type="password" placeholder="••••••" />
          </div>
        </div>

        <div class="form-group">
          <label>Role Selection</label>
          <UIDropdownList v-model="formData.selectedRole" :options="roleOptions" />
        </div>

        <div class="form-group">
          <label>Volume: {{ formData.volume }}%</label>
          <UISlider v-model="formData.volume" :min="0" :max="100" :step="5" />
        </div>

        <div class="toggle-group">
          <UISwitch v-model="formData.darkMode" label="Dark Mode" />
          <UICheckbox v-model="formData.notifications" label="Push Notifications" />
        </div>
      </UISurface>

      <section class="demo-card">
        <h2>Buttons & Actions</h2>
        <div class="button-row">
          <UIButton @click="variant = 'primary'" variant="primary">Primary</UIButton>
          <UIButton variant="secondary">Secondary</UIButton>
          <UIButton variant="destructive">Destructive</UIButton>
          <UIButton disabled>Disabled</UIButton>
        </div>
        <div class="button-row" style="margin-top: 1rem">
          <UIButton variant="prominentGlass" icon="fa-wand-magic">Glass</UIButton>
          <UIButton variant="icon" icon="fa-gear"></UIButton>
        </div>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-secondary)">
          Current User: {{ formData.username || 'Guest' }}
        </div>
      </section>

      <section class="demo-card span-row">
        <h2>Navigation</h2>
        <div class="tab-demo-wrapper">
          <UITabContainer v-model="activeTab">
            <UITabPanel name="dashboard" label="Dashboard">
              <div class="tab-inner">
                <h3>Dashboard Content</h3>
                <p>Welcome back, {{ formData.username || 'User' }}.</p>
              </div>
            </UITabPanel>
            <UITabPanel name="settings" label="Settings">
              <div class="tab-inner">
                <h3>System Settings</h3>
                <UISwitch v-model="formData.wifi" label="Enable Wi-Fi Connection" />
              </div>
            </UITabPanel>
            <UITabPanel name="logs" label="System Logs">
              <div class="tab-inner">
                <h3>Logs</h3>
                <p>No recent errors found.</p>
              </div>
            </UITabPanel>
          </UITabContainer>
        </div>
      </section>

      <section class="demo-card">
        <h2>Feedback</h2>

        <UIProgressbar
          :value="formData.volume"
          :max="100"
          label="System Load (Linked to Volume)"
          color="--sys-primary"
        />

        <UIProgressbar :value="75" :max="100" label="Processing..." striped color="--sys-success" />

        <div class="trigger-row">
          <UIButton variant="secondary" @click="showModal = true"> Open Modal </UIButton>
          <UIButton variant="secondary" @click="addDemoToast"> Trigger Toast </UIButton>
        </div>
      </section>

      <section class="demo-card">
        <h2>Data Viz</h2>
        <div class="chart-group">
          <label>Server Traffic (Line)</label>
          <UISparkline :data="chartData" type="line" color="--sys-primary" :height="60" />
        </div>
        <div class="chart-group">
          <label>Memory Usage (Area)</label>
          <UISparkline :data="chartData" type="area" color="--sys-success" :height="60" />
        </div>
        <div class="chart-group">
          <label>Requests (Bar)</label>
          <UISparkline :data="chartData" type="bar" color="--sys-danger" :height="60" />
        </div>
        <UIButton variant="icon" icon="fa-refresh" @click="randomizeData" style="margin-top: 10px">
          Refresh Data
        </UIButton>
      </section>

      <section class="demo-card span-row">
        <h2>Dashboard Widgets</h2>
        <div class="gauge-row">
          <div class="gauge-item">
            <UIGauge :modelValue="formData.volume" :readonly="true" label="Audio Output">
              <template #default="{ value }">
                {{ value }}<span style="font-size: 0.6em">%</span>
              </template>
            </UIGauge>
            <p class="caption">Linked to Volume Slider</p>
          </div>

          <div class="gauge-item">
            <UIGauge
              v-model="pressure"
              :readonly="false"
              label="Pressure Control"
              :bands="gaugeBands"
            />
            <p class="caption">Interactive (Drag or Click)</p>
          </div>
        </div>
      </section>
    </div>

    <UIToast />

    <UIModalDialog
      :isOpen="showModal"
      title="Confirm Action"
      :actions="modalActions"
      @close="showModal = false"
      @actionclick="handleModalAction"
    >
      <p>Are you sure you want to proceed with this operation? This action cannot be undone.</p>
    </UIModalDialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Import components
import UISlider from './UISlider.vue'
import UITabContainer from './UITabContainer.vue'
import UITabPanel from './UITabPanel.vue'
import UIProgressbar from './UIProgressbar.vue'
import UIToast from './UIToast.vue'
import UICheckbox from './UICheckbox.vue'
import UIDropdownList from './UIDropdownList.vue'
import UIButton from './UIButton.vue'
import UISparkline from './UISparkline.vue'
import UIModalDialog from './UIModalDialog.vue'
import UITextBox from './UITextBox.vue'
import UISwitch from './UISwitch.vue'
import UISurface from './UISurface.vue'
import UIGauge from './UIGauge.vue' // NEW IMPORT
import { useToast } from '../composables/useToast'

// --- State Management ---

const toasts = useToast()

const formData = reactive({
  username: '',
  password: '',
  volume: 35,
  notifications: true,
  darkMode: false,
  wifi: true,
  selectedRole: 'admin',
})

const activeTab = ref('dashboard')
const showModal = ref(false)
const chartData = ref([10, 45, 30, 60, 55, 80, 70, 90, 20, 50])

// Gauge State
const pressure = ref(50)
const gaugeBands = [
  { from: 0, to: 40, color: 'var(--sys-success)' },
  { from: 41, to: 75, color: 'var(--sys-info)' },
  { from: 76, to: 100, color: 'var(--sys-danger)' },
]

// --- Configuration Data ---

const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
]

const modalActions = [
  { label: 'Cancel', id: 'cancel' },
  { label: 'Confirm', id: 'confirm' },
]

// --- Methods ---

const randomizeData = () => {
  chartData.value = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
}

const handleModalAction = (action) => {
  console.log('Modal action:', action.id)
  showModal.value = false
}

const addDemoToast = () => {
  console.log('Toast triggered')
  toasts.showToast('Here is a toast message')
}
</script>

<style>
/* Design Tokens / CSS Variables */
:root {
  /* Colors */
  --sys-primary: #3b82f6;
  --sys-success: #10b981;
  --sys-danger: #ef4444;
  --sys-info: #3b82f6;

  --surface-rgb: 255, 255, 255;
  --surface-bg: rgba(255, 255, 255, 0.7);
  --surface-border: 1px solid #e5e7eb;
  --surface-blur: 10px;
  --surface-saturate: 180%;
  --surface-radius: 12px;

  --text-color: #1f2937;
  --text-secondary: #6b7280;

  --overlay-bg: rgba(0, 0, 0, 0.4);
  --overlay-blur: 4px;

  /* Controls */
  --btn-bg: #f3f4f6;
  --btn-text: #1f2937;
  --btn-border: 1px solid #d1d5db;
  --btn-hover-brightness: 0.95;
  --btn-radius: 6px;

  --tab-inactive-bg: transparent;
  --tab-active-bg: #eff6ff;
  --tab-border: 1px solid transparent;
  --tab-radius: 6px;

  --progress-bg: #e5e7eb;
  --progress-height: 8px;
  --progress-radius: 99px;

  --dropdown-bg: #ffffff;
  --dropdown-border: 1px solid #e5e7eb;
  --dropdown-radius: 6px;
  --dropdown-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  --modal-radius: 12px;

  /* Fonts */
  --font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

  /* Widget Background (For Gauge Inner Hole) */
  --widget-bg: var(--dropdown-bg);
}

/* Demo Specific Styles */
.demo-wrapper {
  padding: 2rem;
  font-family: var(--font-family);
  min-height: 100vh;
  color: var(--text-color);
  transition: background 0.3s ease;
}

/* Simple Dark Mode Simulation */
.demo-wrapper.dark-mode {
  background: #111827;
  --text-color: #f3f4f6;
  --text-secondary: #9ca3af;
  --surface-bg: rgba(31, 41, 55, 0.7);
  --surface-rgb: 31, 41, 55;
  --surface-border: 1px solid #374151;
  --btn-bg: #374151;
  --btn-text: #f3f4f6;
  --btn-border: 1px solid #4b5563;
  --dropdown-bg: #1f2937;
  --dropdown-border: 1px solid #374151;
  --tab-active-bg: #374151;
  --progress-bg: #374151;
}

.demo-header {
  margin-bottom: 2rem;
  text-align: center;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-card {
  background: var(--surface-bg);
  padding: 24px;
  border-radius: 12px;
  border: var(--surface-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.span-row {
  grid-column: 1 / -1;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.5rem;
  margin-top: 0;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(var(--surface-rgb), 0.1);
  padding: 12px;
  border-radius: var(--btn-radius);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.trigger-row {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.tab-demo-wrapper {
  min-height: 200px;
  background: rgba(var(--surface-rgb), 0.05);
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed var(--surface-border);
}

.chart-group {
  margin-bottom: 16px;
}

.chart-group label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 4px;
}

/* Gauge Section Styles */
.gauge-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px 0;
}

.gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.caption {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}
</style>
