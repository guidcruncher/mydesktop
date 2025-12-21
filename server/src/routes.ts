import { Desktop } from './api/desktop/index.ts'
import { Icon } from './api/icon/index.ts'
import { Proxy } from './api/proxy/index.ts'
import { Sysinfo } from './api/sysinfo/index.ts'

export async function routes(fastify) {
  Desktop(fastify)
  Icon(fastify)
  Proxy(fastify)
  Sysinfo(fastify)
}
