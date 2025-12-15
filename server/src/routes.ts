import { Icon } from './api/icon/index.ts'
import { Proxy } from './api/proxy/index.ts'

export async function routes(fastify) {
  Icon(fastify)
  Proxy(fastify)
}
