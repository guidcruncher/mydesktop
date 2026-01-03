import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"

export async function Rtt(fastify: FastifyInstance) {
  fastify.get("/api/rtt/*", async (request: FastifyRequest, reply: FastifyReply) => {
    const rawUrl = request.url.substring(9)

    if (!rawUrl.startsWith("http")) {
      return reply
        .status(400)
        .send({ error: `Invalid Target URL ${rawUrl}. Must start with http/https.` })
    }

    const authHeader = request.headers.authorization

    if (!authHeader) {
      fastify.log.warn("Request missing Authorization header")
    }

    const headers = new Headers()
    headers.append("Content-Type", "text/xml")
    if (authHeader) {
      headers.append("Authorization", authHeader)
    }

    // 3. Make the request to Realtime Trains
    const response = await fetch(rawUrl, { method: "GET", headers: headers })

    if (response.ok) {
      return await response.json()
    }

    return reply.status(response.status).send(response.statusText)
  })
}
