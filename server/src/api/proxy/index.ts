import { FastifyInstance } from "fastify"
import { Readable } from "node:stream"
import Module from "node:module"
import Parser from "rss-parser"

const require = Module.createRequire(import.meta.url)
const sharp = require("sharp")

const getFilename = (uri) => {
  if (!uri) {
    return ""
  }
  let url = new URL(uri)
  let path = url.pathname
  let filename = path.substring(path.lastIndexOf("/") + 1)
  return filename
}

export async function Proxy(fastify: FastifyInstance) {
  fastify.get("/api/proxy/rss", async (request, reply) => {
    const rssUrl = request.query.url
    const ua =
      request.headers["User-Agent"] ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    if (!rssUrl) {
      reply.code(400).send("Missing feed URL parameter.")
      return
    }
    const response = await fetch(rssUrl, {
      method: "GET",
      headers: new Headers({ "User-Agent": ua }),
    })
    if (!response.ok) {
      request.log.error(`Failed to fetch external feed: ${response.status} ${response.statusText}`)
      reply.code(response.status).send("Failed to fetch external feed.")
      return
    }
    const feed = await response.text()
    const contentType = response.headers.get("content-type") || "text/xml"
    const filename = getFilename(rssUrl)
    return reply
      .header("Content-Disposition", `inline; filename='${filename}'`)
      .header("Content-Type", contentType)
      .header("Access-Control-Allow-Origin", "*")
      .header("Cache-Control", "no-store")
      .send(feed)
  })

  fastify.get("/api/proxy", async (request, reply) => {
    const imageUrl = request.query.url
    const ua =
      request.headers["User-Agent"] ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

    if (!imageUrl) {
      reply.code(400).send("Missing image URL parameter.")
      return
    }

    const response = await fetch(imageUrl, {
      method: "GET",
      headers: new Headers({ "User-Agent": ua }),
    })

    if (!response.ok) {
      request.log.error(`Failed to fetch external image: ${response.status} ${response.statusText}`)
      reply.code(response.status).send("Failed to fetch external image.")
      return
    }

    const bytes = await response.bytes()
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const filename = getFilename(imageUrl)

    const image = sharp(bytes)
    return image.stats().then((stats) => {
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
