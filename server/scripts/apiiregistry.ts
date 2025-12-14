import fs from 'fs'
import path from 'path'

export function ApiRegistry(options = {}) {
  const sourceDirectory = options.directory || 'src/api'
  const outputFile = options.outputFile || 'src/routes.ts'

  // Absolute paths for file system operations
  const absoluteOutputDir = path.resolve(process.cwd(), path.dirname(outputFile))
  const absoluteOutputPath = path.resolve(process.cwd(), outputFile)

  const generateStaticCode = () => {
    const files = fs.readdirSync(sourceDirectory, {withFileTypes: true })
    const dirs = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)

    const capitalize = ((string) => {return string.charAt(0).toUpperCase() + string.slice(1)})

    const imports = (() => {  return dirs.map(name => `import { ${capitalize(name)} } from './api/${name}/index.ts'`).join('\n') })
    const inits = (() => { return dirs.map(name => `  ${capitalize(name)}(fastify)` ).join('\n') })

    return `${imports()}

export async function routes(fastify) {
${inits()}
}
`
  }

  fs.writeFileSync(absoluteOutputPath, generateStaticCode())
}

ApiRegistry()
