import { FastifyInstance } from "fastify"
import Module from "node:module"

const require = Module.createRequire(import.meta.url)
const sharp = require("sharp")

// 1. Define the shape of the query string
interface ProxyQuery {
  url: string
}

interface ArtistQuery {
  artist: string
  track: string
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

  fastify.get<{ Querystring: ArtistQuery }>("/api/proxy/deezer", async (request, reply) => {
    // 1. Extract parameters from the query string
    const artist = request.query.artist
    const track = request.query.track

    // Basic validation
    if (!artist || !track) {
      return reply.code(400).send({
        error: "Bad Request",
        message: 'Both "artist" and "track" query parameters are required.',
      })
    }

    try {
      // 2. Construct the Deezer API URL with the specific query format
      const deezerUrl = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artist.toUpperCase())}"%20track:"${encodeURIComponent(track.toUpperCase())}"`
      // 3. Call the Deezer API
      const response = await fetch(deezerUrl)
      if (!response.ok) {
        return reply.status(response.status).send(response.statusText)
      }

      const data = await response.json()

      // 4. Check for results and return the first one
      if (data.data && data.data.length > 0) {
        // Return the first result directly
        return reply.status(200).send(data.data[0])
      } else {
        // No results found
        return reply.status(404).send({
          error: "Not Found",
          success: false,
          message: "No track found for this artist and title.",
        })
      }
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: "Internal Server Error" })
    }
  })
}
