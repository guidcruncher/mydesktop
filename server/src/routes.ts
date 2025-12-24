import { Desktop } from "./api/desktop/index"
import { Icon } from "./api/icon/index"
import { Proxy } from "./api/proxy/index"
import { Sysinfo } from "./api/sysinfo/index"

export async function routes(fastify: any) {
  Desktop(fastify)
  Icon(fastify)
  Proxy(fastify)
  Sysinfo(fastify)
}
