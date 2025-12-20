import { FastifyInstance } from "fastify"
import { Readable } from "node:stream"
import Module from "node:module"
import * as fs from "fs"
import * as path from "path"

const require = Module.createRequire(import.meta.url)
const yaml = require("js-yaml")

export async function Desktop(fastify: FastifyInstance) {
  fastify.get("/api/desktop", async (request, reply) => {
    const configFile = path.join(process.cwd(), "./config", "desktop.yml")
    const raw = fs.readFileSync(configFile, "utf8")
    const accept = request.headers["accept"] ?? ""

    const doc = yaml.load(raw)

    if (accept.includes("application/json")) {
      return reply
        .header("Content-Type", "application/json")
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "no-store, private")
        .send(JSON.stringify(doc))
    } else if (accept.includes("text/html") || accept.includes("*/*")) {
      return reply
        .header("Content-Type", "application/json")
        .header("Cache-Control", "no-store, private")
        .send(JSON.stringify(doc))
    } else if (accept.includes("application/yaml")) {
      return reply
        .header("Content-Type", "application/yaml")
        .header("Access-Control-Allow-Origin", "*")
        .header("Cache-Control", "no-store, private")
        .send(raw)
    }

    return reply.code(406).send({ error: "Not Acceptable" })
  })
}
