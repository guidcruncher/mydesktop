export const VisualEffect = {
  beforeMount(el: HTMLElement) {
    el.style.backgroundColor = 'var(--glass-bg)'
    el.style.backdropFilter = 'blur(25px) saturate(180%)'
    el.style.webkitBackdropFilter = 'blur(25px) saturate(180%)'

    el.style.border = '1px solid var(--glass-border)'
    el.style.boxShadow = 'var(--glass-shadow)'
    el.style.overflow = 'hidden'
  },

  // You might not need 'updated' or 'unmounted' for this simple style application,
  // but they can be included if the styles need dynamic changes or cleanup.
}
