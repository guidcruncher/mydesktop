import { BackgroundMesh } from '../utils/BackgroundMesh'

const colors = [
  'hsla(280, 80%, 70%, 1)',
  'hsla(200, 90%, 65%, 1)',
  'hsla(330, 80%, 75%, 1)',
  'hsla(40, 90%, 70%, 1)',
]

export const Background = {
  beforeMount(el, binding) {
    if (!binding.value) {
      return
    }

    const config = binding.value

    if (!config.type) {
      return
    }

    const ctl = document.body

    switch (config.type) {
      case 'mesh':
        BackgroundMesh(config.colors ?? colors, ctl)
        break
      case 'color':
        ctl.style.backgroundColor = config.color
        break
      case 'image':
        const url = `http://192.168.1.202:3009/api/proxy?url=${encodeURIComponent(config.src ?? '')}`
        ctl.style.backgroundImage = `url("${url}")`
        ctl.style.backgroundSize = 'cover'
        ctl.style.backgroundRepeat = 'no-repeatk'
        ctl.style.backgroundPosition = 'center'
        break
    }
  },
  unmounted(el) {},
}
