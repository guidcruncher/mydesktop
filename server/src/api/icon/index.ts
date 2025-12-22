import { FastifyInstance } from "fastify"
import Module from "node:module"

const require = Module.createRequire(import.meta.url)
const sharp = require("sharp")

// 1. Define interfaces for your Request types
interface SearchQuery {
  q: string
}

interface IconParams {
  name: string
  fileType?: string
}

const getIconUrl = (t: any) => {
  let format = ""
  if (t.PNG == "Yes") {
    format = "/png"
  } else if (t.SVG == "Yes") {
    format = "/svg"
  } else if (t.WebP == "Yes") {
    format = "/webp"
  } else {
    format = ""
  }

  return `/api/icon/${t.Reference}${format}`
}

const getFilename = (uri: string) => {
  if (!uri) {
    return ""
  }
  let url = new URL(uri)
  let path = url.pathname
  let filename = path.substring(path.lastIndexOf("/") + 1)
  return filename
}

export async function Icon(fastify: FastifyInstance) {
  // Fix 1: Rename 'request' to '_request' to silence the "unused variable" error
  fastify.get("/api/icon/_index", async (_request, reply) => {
    const url: string = "https://raw.githubusercontent.com/selfhst/icons/refs/heads/main/index.json"

    const response = await fetch(url, {
      method: "GET",
    })

    if (!response.ok) {
      const text = (await response.text()) ?? response.statusText
      return reply.code(response.status).send(text)
    }

    const data: any = await response.json()
    const res: any = data
      .map((t: any) => {
        return {
          id: t.Reference,
          label: t.Name,
          url: getIconUrl(t),
        }
      })
      .sort((a: any, b: any) => {
        return a.label.localeCompare(b.label)
      })

    return reply.status(200).send(res)
  })

  // Fix 2: Add <{ Querystring: SearchQuery }> to type the query string
  fastify.get<{ Querystring: SearchQuery }>("/api/icon/_search", async (request, reply) => {
    const url: string = "https://raw.githubusercontent.com/selfhst/icons/refs/heads/main/index.json"
    
    // Now request.query is typed, so accessing .q is safe
    const query: string = request.query.q

    if (!query) {
      reply.code(400).send("Missing search query parameter.")
      return
    }

    const response = await fetch(url, {
      method: "GET",
    })

    if (!response.ok) {
      const text = (await response.text()) ?? response.statusText
      return reply.code(response.status).send(text)
    }

    const data = await response.json()
    const res = data
      .filter((item: any) => {
        return item.Name.toLowerCase().startsWith(query.toLowerCase())
      })
      .map((t: any) => {
        return {
          id: t.Reference,
          label: t.Name,
          url: getIconUrl(t),
        }
      })
      .sort((a: any, b: any) => {
        return a.label.localeCompare(b.label)
      })

    return reply.status(200).send(res)
  })

  // Fix 3: Add <{ Params: IconParams }> to type the URL parameters
  fastify.get<{ Params: IconParams }>("/api/icon/:name/:fileType?", async (request, reply) => {
    // Now request.params is typed
    const name: string = request.params.name
    const fileType: string | undefined = request.params.fileType
    
    const iconType: string = (fileType ?? "png").toLowerCase()
    const imageUrl: string = `https://cdn.jsdelivr.net/gh/selfhst/icons@main/${iconType}/${name}.${iconType}`

    if (!imageUrl) {
      return reply.code(400).send("Missing image URL parameter.")
    }

    const response = await fetch(imageUrl, {
      method: "GET",
    })

    if (!response.ok) {
      if (response.status == 403 || response.status == 404) {
        return reply.code(404).send()
      }
      request.log.error(`Failed to fetch external image: ${response.status} ${response.statusText}`)
      return reply.code(response.status).send("Failed to fetch external image. ")
    }

    const bytes = await response.bytes()
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const filename: string = getFilename(imageUrl)

    const image = sharp(bytes)
    return image.stats().then((stats: any) => {
      return reply
        .header("Content-Disposition", `inline; filename='${filename}'`)
        .header("Content-Type", contentType)
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "public, max-age=31536000")
        .header(
          "X-Image-Dominant-Color",
          `rgba(${stats.dominant.r}, ${stats.dominant.g}, ${stats.dominant.b}, 1)`,
        )
        .header("X-Image-Opaque", stats.isOpaque)
        .send(bytes)
    })
  })
}
