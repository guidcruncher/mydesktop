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
    const doc = yaml.load(fs.readFileSync(configFile, "utf8"))
    return reply
      .header("Content-Disposition", `inline; filename=config.json'`)
      .header("Content-Type", "application/json")
      .header("Access-Control-Allow-Origin", "*")
      .header("Cache-Control", "public, max-age=31536000")
      .send(JSON.stringify(doc))
  })
}
