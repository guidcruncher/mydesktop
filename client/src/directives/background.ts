import { BackgroundMesh } from '../utils/BackgroundMesh'
import { inject } from 'vue'
import { Desktop, Configuration } from '../config'

const colors = [
  'hsla(280, 80%, 70%, 1)',
  'hsla(200, 90%, 65%, 1)',
  'hsla(330, 80%, 75%, 1)',
  'hsla(40, 90%, 70%, 1)',
]

const apply = (el, config, API_BASE_URL) => {
  if (!config) {
    return
  }

  if (!config.background) {
    return
  }

  const backgroundConfig = config.background

  if (!backgroundConfig.style) {
    return
  }
  const ctl = document.body
  switch (backgroundConfig.style) {
    case 'mesh':
      BackgroundMesh(backgroundConfig.colors ?? colors, ctl)
      break
    case 'color':
      ctl.style.backgroundColor = backgroundConfig.color
      break
    case 'image':
      const url = `${API_BASE_URL}/api/proxy?url=${encodeURIComponent(backgroundConfig.src ?? '')}`
      ctl.style.backgroundImage = `url("${url}")`
      ctl.style.backgroundSize = 'cover'
      ctl.style.backgroundRepeat = 'no-repeat'
      ctl.style.backgroundPosition = 'center'
      break
  }
}

export const Background = {
  beforeMount(el, binding) {
    apply(el, binding.value, Configuration().API_BASE_URL)
  },
  updated(el, binding, vnode) {
    apply(el, binding.value, Configuration().API_BASE_URL)
  },
  unmounted(el) {},
}
