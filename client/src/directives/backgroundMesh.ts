const colors = [
  'hsla(280, 80%, 70%, 1)',
  'hsla(200, 90%, 65%, 1)',
  'hsla(330, 80%, 75%, 1)',
  'hsla(40, 90%, 70%, 1)',
]

const darkcolors = [
  'hsla(280, 80%, 30%, 1)',
  'hsla(200, 90%, 25%, 1)',
  'hsla(330, 80%, 35%, 1)',
  'hsla(40, 90%, 30%, 1)',
]

const getMeshBackgroundCSS = () => {
  const [c1, c2, c3, c4] = colors

  return `
        radial-gradient(circle at 10% 20%, ${c1} 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, ${c2} 0%, transparent 50%),
        radial-gradient(circle at 30% 70%, ${c3} 0%, transparent 50%),
        radial-gradient(circle at 75% 15%, ${c4} 0%, transparent 20%)
    `
}

const applyBodyStyles = (el, binding) => {
  const bodyStyle = el.style

  bodyStyle.backgroundImage = getMeshBackgroundCSS()

  bodyStyle.backgroundSize = '200% 200%'
  bodyStyle.backgroundRepeat = 'no-repeat'
  bodyStyle.animation = 'moveMesh 30s infinite alternate'
  bodyStyle.minHeight = '100vh'
  bodyStyle.margin = '0'
  bodyStyle.zIndex = -1
}

const styleId = 'mesh-keyframes'

const addMeshKeyframes = () => {
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
            @keyframes moveMesh {
                0% { background-position: 0% 0%; }
                100% { background-position: 100% 100%; }
            }
        `
    document.head.appendChild(style)
  }
}

const removeMeshKeyframes = () => {
  const style = document.getElementById(styleId)
  if (style) {
    style.remove()
  }
}

export const BackgroundMesh = {
  beforeMount(el, binding) {
    applyBodyStyles(el, binding)

    addMeshKeyframes()
  },
  unmounted(el) {
    const bodyStyle = el.style
    bodyStyle.backgroundImage = ''
    bodyStyle.backgroundSize = ''
    bodyStyle.backgroundRepeat = ''
    bodyStyle.animation = ''
    bodyStyle.minHeight = ''
    bodyStyle.margin = ''
    removeMeshKeyframes()
  },
}
