import Fastify from "fastify"
import cors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import path from "path"
import { routes } from "./routes"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const server = Fastify({ logger: true })

server.addContentTypeParser(
  ["text/yaml", "application/yaml"],
  { parseAs: "string" },
  (req, body, done) => {
    // No parsing logic here, just pass the raw string through
    req=req
    done(null, body)
  },
)

// 1. Register CORS (Useful for dev, less critical if serving from same origin)
server.register(cors, {
  origin: "*",
  methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
})

// 2. Register API Routes first (so they take precedence)
server.register(routes)

// 3. Serve Static Files (The built Vue app)
// We assume the Vue build will be copied to a 'public' folder relative to this file
server.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/", // Serve from the root
})

// 4. SPA Fallback: If a route isn't found (and isn't an API), return index.html
server.setNotFoundHandler((req, reply) => {
  // If the request is for an API, return actual 404 JSON
  if (req.raw.url?.startsWith("/api")) {
    reply.status(404).send({ error: "API endpoint not found" })
    return
  }
  // Otherwise serve index.html for Vue Router
  reply.sendFile("index.html")
})

const getPort = () => {
  if (process.env.PORT) {
    return parseInt((process.env.PORT) as string)
  }

  return 3000
}

const start = async () => {
  server.listen({ port: getPort(), host: "0.0.0.0" }, function (err, address) {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
    server.log.info(`server listening on ${address}`)
  })
}

start()
