// src/utils/TabBarContext.ts
import { ref } from 'vue'
import type { InjectionKey } from '@vue/runtime-core' // <-- Change this line!

// 1. Define the full interface for the context object
export interface TabBarContext {
  activeTabIndex: Readonly<ref<number>>
  selectTab: (index: number) => void
  registerTab: (tabId: symbol) => number
}

// 2. Define and export the InjectionKey (Symbol)
// Using InjectionKey provides better type checking when injecting.
export const TabBarContextKey: InjectionKey<TabBarContext> = Symbol('TabBarContextKey')

// Note: You can now delete 'export { TabBarContextKey };' from UITabBar.vue
