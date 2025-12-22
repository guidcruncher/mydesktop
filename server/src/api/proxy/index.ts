import { FastifyInstance } from "fastify"
import Module from "node:module"

const require = Module.createRequire(import.meta.url)
const sharp = require("sharp")

// 1. Define the shape of the query string
interface ProxyQuery {
  url: string
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

export async function Proxy(fastify: FastifyInstance) {
  // 2. Pass <{ Querystring: ProxyQuery }> to the route handler
  fastify.get<{ Querystring: ProxyQuery }>("/api/proxy/rss", async (request, reply) => {
    // request.query is now typed, so accessing .url is valid
    const rssUrl: string = request.query.url

    if (!rssUrl) {
      reply.code(400).send("Missing feed URL parameter.")
      return
    }
    const response = await fetch(rssUrl, {
      method: "GET",
    })

    if (!response.ok) {
      request.log.error(`Failed to fetch external feed: ${response.status} ${response.statusText}`)
      reply.code(response.status).send("Failed to fetch external feed.")
      return
    }
    const feed = await response.text()
    const contentType = response.headers.get("content-type") || "text/xml"
    const filename: string = getFilename(rssUrl)
    return reply
      .header("Content-Disposition", `inline; filename='${filename}'`)
      .header("Content-Type", contentType)
      .header("Access-Control-Allow-Origin", "*")
      .header("Cache-Control", "no-store")
      .send(feed)
  })

  // 3. Apply the same type to the second route
  fastify.get<{ Querystring: ProxyQuery }>("/api/proxy", async (request, reply) => {
    const imageUrl = request.query.url

    if (!imageUrl) {
      reply.code(400).send("Missing image URL parameter.")
      return
    }

    const response = await fetch(imageUrl, {
      method: "GET",
    })

    if (!response.ok) {
      request.log.error(`Failed to fetch external image: ${response.status} ${response.statusText}`)
      reply.code(response.status).send("Failed to fetch external image.")
      return
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
