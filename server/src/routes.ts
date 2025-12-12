import { FastifyInstance } from "fastify"

export async function routes(fastify: FastifyInstance) {
  fastify.get("/api/hello", async (request, reply) => {
    return { message: "Hello from Fastify Server!" }
  })

  fastify.get("/api/data", async (request, reply) => {
    return {
      items: [
        { id: 1, name: "Item One" },
        { id: 2, name: "Item Two" },
      ],
    }
  })
}
