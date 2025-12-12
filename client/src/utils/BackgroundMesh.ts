export const BackgroundMesh = (config, el) => {
  const getMeshBackgroundCSS = () => {
    const [c1, c2, c3, c4] = config.colors

    return `
        radial-gradient(circle at 10% 20%, ${c1} 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, ${c2} 0%, transparent 50%),
        radial-gradient(circle at 30% 70%, ${c3} 0%, transparent 50%),
        radial-gradient(circle at 75% 15%, ${c4} 0%, transparent 20%)
    `
  }

  const applyBodyStyles = (el) => {
    const bodyStyle = {}

    bodyStyle.backgroundImage = getMeshBackgroundCSS()

    bodyStyle.backgroundSize = '200% 200%'
    bodyStyle.backgroundRepeat = 'no-repeat'
    bodyStyle.animation = 'moveMesh 30s infinite alternate'
    bodyStyle.minHeight = '100vh'
    bodyStyle.margin = '0'

    return bodyStyle
  }

  const style = applyBodyStyles(el)
  return style
}
