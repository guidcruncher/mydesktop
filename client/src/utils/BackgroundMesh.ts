export const BackgroundMesh = (colors, el) => {
  const getMeshBackgroundCSS = (colorvalues) => {
    const [c1, c2, c3, c4] = colorvalues

    return `
        radial-gradient(circle at 10% 20%, ${c1} 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, ${c2} 0%, transparent 50%),
        radial-gradient(circle at 30% 70%, ${c3} 0%, transparent 50%),
        radial-gradient(circle at 75% 15%, ${c4} 0%, transparent 20%)
    `
  }

  const applyBodyStyles = (el) => {
    const bodyStyle = el.style

    bodyStyle.backgroundImage = getMeshBackgroundCSS(colors)

    bodyStyle.backgroundSize = '200% 200%'
    bodyStyle.backgroundRepeat = 'no-repeat'
    bodyStyle.animation = 'moveMesh 30s infinite alternate'
    bodyStyle.minHeight = '100vh'
    bodyStyle.margin = '0'

    if (!el.classList.contains('mesh-gradient')) {
      el.classList.add('mesh-gradient')
    }

    return bodyStyle
  }

  const style = applyBodyStyles(el)
  return style
}
