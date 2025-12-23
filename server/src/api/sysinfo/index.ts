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
          platform: "Linux",
          distro: distro,
          icon: icon,
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
