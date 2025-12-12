import Fastify, { FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import { routes } from "./routes"

const server: FastifyInstance = Fastify({ logger: true })

// Register CORS to allow the frontend to communicate
server.register(cors, {
  origin: true, // In production, replace with your client URL
})

// Register Routes
server.register(routes)

const start = async () => {
  server.listen({ port: 3009, host: "0.0.0.0" }, function (err, address) {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
    server.log.info(`server listening on ${address}`)
  })
}

start()
