import { Proxy } from './api/proxy/index.ts'

export async function routes(fastify) {
  Proxy(fastify)
}
