import { FastifyInstance } from "fastify"
import fs from "node:fs"
import os from "node:os"
import { exec } from "node:child_process"

const getDistroIcon = async () => {
  const osReleasePath = "/etc/os-release"
  // Fix 1: Type the map to allow string indexing
  const aliasMap: Record<string, string> = {
    arch: "arch-linux",
    "opensuse-leap": "opensuse",
    "opensuse-tumbleweed": "opensuse",
    raspbian: "raspberry-pi",
    rhel: "red-hat",
    linuxmint: "linux-mint",
    pop: "pop-os",
    elementary: "elementary-os",
  }

  try {
    if (!fs.existsSync(osReleasePath)) return null

    const fileContent = await fs.promises.readFile(osReleasePath, "utf8")
    const idMatch = fileContent.match(/^ID=["']?([^"'\n]+)["']?/m)

    if (idMatch && idMatch[1]) {
      let distroId: string = idMatch[1].toLowerCase()
      const iconName = aliasMap[distroId] || distroId
      return `https://raw.githubusercontent.com/haroeris01/walkxcode-dashboard-icons/refs/heads/main/png/${iconName}.png`
    }
  } catch (err) {
    return ""
  }
  return ""
}

const getDistroName = () => {
  try {
    const content = fs.readFileSync("/etc/os-release", "utf8")
    const match = content.match(/PRETTY_NAME="(.*?)"/)
    return match ? match[1] : "Linux OS"
  } catch (e) {
    return "Linux"
  }
}

/**
 * UTILITY: CPU Load via /proc/stat
 */
const getCpuStats = () => {
  const readStat = () => {
    const content = fs.readFileSync("/proc/stat", "utf8")
    const lines = content.split("\n")
    // 'cpu' line: cpu  user nice system idle iowait irq softirq steal guest guest_nice

    // Fix 2: Check if line exists before accessing properties on it
    if (!lines || !lines[0]) {
      return { idle: 0, total: 0 }
    }

    const parts = lines[0].replace(/\s+/g, " ").split(" ")

    // Fix 3: Handle undefined array indices by defaulting to "0" for parseInt
    const parsePart = (index: number) => parseInt(parts[index] || "0", 10)

    const idle = parsePart(4) + parsePart(5) // idle + iowait
    let total = 0
    // Sum all indices from 1 to 7 to get total ticks
    for (let i = 1; i <= 7; i++) total += parsePart(i)

    return { idle, total }
  }

  return new Promise((resolve) => {
    const start = readStat()
    setTimeout(() => {
      const end = readStat()
      const idleDiff = end.idle - start.idle
      const totalDiff = end.total - start.total

      // Prevent division by zero
      if (totalDiff === 0) {
        resolve(0)
        return
      }

      const percent = 100 - Math.floor((100 * idleDiff) / totalDiff)
      resolve(percent)
    }, 100) // 100ms sampling
  })
}

/**
 * UTILITY: Memory via /proc/meminfo
 */
const getMemStats = () => {
  try {
    const content = fs.readFileSync("/proc/meminfo", "utf8")

    // Fix 4: Explicitly type 'key'
    const parse = (key: string) => {
      const match = content.match(new RegExp(`${key}:\\s+(\\d+)`))
      // Fix 5: Ensure match[1] exists before passing to parseInt
      return match && match[1] ? parseInt(match[1]) * 1024 : 0 // Convert kB to Bytes
    }

    const total = parse("MemTotal")
    const available = parse("MemAvailable")
    const used = total - available

    return {
      total,
      used,
      percent: total > 0 ? Math.round((used / total) * 100) : 0,
      usedGB: (used / 1024 ** 3).toFixed(1),
      totalGB: (total / 1024 ** 3).toFixed(1),
    } as any
  } catch (e) {
    return { percent: 0, usedGB: 0, totalGB: 0 } as any
  }
}

/**
 * UTILITY: Storage via `df` command
 */
const getStorageStats = () => {
  return new Promise((resolve) => {
    // -B1 forces bytes output
    exec("df -B1 /", (err, stdout) => {
      if (err) {
        resolve({ percent: 0, usedGB: 0, totalGB: 0 })
        return
      }
      const lines = stdout.trim().split("\n")

      // Fix 6: Ensure lines[1] exists
      if (!lines[1]) {
        resolve({ percent: 0, usedGB: 0, totalGB: 0 })
        return
      }

      const parts = lines[1].replace(/\s+/g, " ").split(" ")

      // Fix 7: Provide default "0" string if index is undefined
      const total = parseInt(parts[1] || "0", 10)
      const used = parseInt(parts[2] || "0", 10)

      resolve({
        totalBytes: total,
        usedBytes: used,
        percent: total > 0 ? Math.round((used / total) * 100) : 0,
        totalGB: (total / 1024 ** 3).toFixed(0),
        usedGB: (used / 1024 ** 3).toFixed(0),
      } as any)
    })
  })
}

const getCpu = () => {
  const cpus = os.cpus()
  if (!cpus) {
    return "unknown"
  }
  if (cpus.length > 0) {
    if (cpus[0]) {
      return `${cpus[0].model} (${cpus.length} core) ${cpus[0].speed}Mhz`
    }
  }

  return "unknown"
}

const getArchHtmlSnippet = (width = "45px") => {
  const arch = os.arch() // e.g. 'x64', 'arm64'
  const cpus = os.cpus()
  const model = cpus.length > 0 ? (cpus[0] ? cpus[0].model : "") : ""
  const platform = os.platform()

  let iconSlug = "cpu" // Default generic icon
  let brandColor = "555555" // Default Grey
  let altText = "Unknown Architecture"

  // 1. Detect Intel (x64/ia32)
  if ((arch === "x64" || arch === "ia32") && model.includes("Intel")) {
    iconSlug = "intel"
    brandColor = "0068B5" // Intel Blue
    altText = "Intel Architecture"
  }
  // 2. Detect AMD (x64)
  else if ((arch === "x64" || arch === "ia32") && model.includes("AMD")) {
    iconSlug = "amd"
    brandColor = "ED1C24" // AMD Red
    altText = "AMD Architecture"
  }
  // 3. Detect Apple Silicon (arm64 on macOS)
  else if (arch === "arm64" && platform === "darwin") {
    iconSlug = "apple"
    brandColor = "000000" // Apple Black
    altText = "Apple Silicon"
  }
  // 4. Detect Generic ARM (Linux/Windows on ARM)
  else if (arch === "arm64" || arch === "arm") {
    iconSlug = "arm"
    brandColor = "0091BD" // ARM Blue
    altText = "ARM Processor"
  }

  // Construct the Simple Icons CDN URL
  // Format: https://cdn.simpleicons.org/[SLUG]/[COLOR]
  const src = `https://cdn.simpleicons.org/${iconSlug}/${brandColor}`

  return `<img src="${src}" alt="${altText}" title="${altText}" style="width: ${width}; height: auto;" />`
}

const isContainer = () => {
  if (!process.env.CONTAINER) {
    return false
  }
  return process.env.CONTAINER.toLowerCase() === "true"
}

export async function Sysinfo(fastify: FastifyInstance) {
  // Fix 8: Rename 'request' to '_request' to solve unused variable error
  fastify.get("/api/sysinfo", async (_request, reply) => {
    try {
      const cpuPercent: any = (await getCpuStats()) as any
      const storage: any = (await getStorageStats()) as any
      const memory: any = getMemStats() as any
      const distro: any = getDistroName() as any
      const icon: any = (await getDistroIcon()) as any

      return {
        device: {
          container: isContainer(),
          platform: os.platform(),
          distro: distro,
          icon: icon,
          arch: os.arch(),
          archLogo: getArchHtmlSnippet(),
          cpu: getCpu(),
          kernel: os.release(),
          hostname: os.hostname(),
        },
        cpu: {
          percent: cpuPercent,
          load: cpuPercent,
        },
        memory: {
          percent: memory.percent,
          usedGB: memory.usedGB,
          totalGB: memory.totalGB,
        },
        storage: {
          percent: storage.percent,
          usedGB: storage.usedGB,
          totalGB: storage.totalGB,
        },
      }
    } catch (error) {
      fastify.log.error(error)
      // Fix 9: Ensure catch block returns the reply object
      return reply.code(500).send({ error: "Internal Server Error" })
    }
  })
}
