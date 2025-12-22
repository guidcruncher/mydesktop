import { FastifyInstance } from "fastify"
import { Readable } from "node:stream"
import Module from "node:module"

const require = Module.createRequire(import.meta.url)
const sharp = require("sharp")

const getIconUrl = (t) => {
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

const getFilename = (uri) => {
  if (!uri) {
    return ""
  }
  let url = new URL(uri)
  let path = url.pathname
  let filename = path.substring(path.lastIndexOf("/") + 1)
  return filename
}

export async function Icon(fastify: FastifyInstance) {
  fastify.get("/api/icon/_index", async (request, reply) => {
    const url = "https://raw.githubusercontent.com/selfhst/icons/refs/heads/main/index.json"
    const ua =
      request.headers["User-Agent"] ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

    const response = await fetch(url, {
      method: "GET",
      headers: new Headers({ "User-Agent": ua }),
    })

    if (!response.ok) {
      const text = (await response.text()) ?? response.statusText
      return reply.code(response.status).send(text)
    }

    const data = await response.json()
    const res = data
      .map((t) => {
        return {
          id: t.Reference,
          label: t.Name,
          url: getIconUrl(t),
        }
      })
      .sort((a, b) => {
        return a.label.localeCompare(b.label)
      })

    return reply.status(200).send(res)
  })

  fastify.get("/api/icon/_search", async (request, reply) => {
    const url = "https://raw.githubusercontent.com/selfhst/icons/refs/heads/main/index.json"
    const query = request.query["q"]
    const ua =
      request.headers["User-Agent"] ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

    if (!query) {
      reply.code(400).send("Missing search query parameter.")
      return
    }

    const response = await fetch(url, {
      method: "GET",
      headers: new Headers({ "User-Agent": ua }),
    })

    if (!response.ok) {
      const text = (await response.text()) ?? response.statusText
      return reply.code(response.status).send(text)
    }

    const data = await response.json()
    const res = data
      .filter((item) => {
        return item.Name.toLowerCase().startsWith(query.toLowerCase())
      })
      .map((t) => {
        return {
          id: t.Reference,
          label: t.Name,
          url: getIconUrl(t),
        }
      })
      .sort((a, b) => {
        return a.label.localeCompare(b.label)
      })

    return reply.status(200).send(res)
  })

  fastify.get("/api/icon/:name/:fileType?", async (request, reply) => {
    const { name, fileType } = request.params
    const iconType = (fileType ?? "png").toLowerCase()
    const imageUrl = `https://cdn.jsdelivr.net/gh/selfhst/icons@main/${iconType}/${name}.${iconType}`
    const ua =
      request.headers["User-Agent"] ??
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"

    if (!imageUrl) {
      return reply.code(400).send("Missing image URL parameter.")
    }

    const response = await fetch(imageUrl, {
      method: "GET",
      headers: new Headers({ "User-Agent": ua }),
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
