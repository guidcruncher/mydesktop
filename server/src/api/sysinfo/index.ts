import { FastifyInstance } from "fastify"
import { Readable } from "node:stream"
import Module from "node:module"
import fs from "node:fs"
import os from "node:os"
import { exec } from "node:child_process"

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
    const parts = lines[0].replace(/\s+/g, " ").split(" ")

    const idle = parseInt(parts[4]) + parseInt(parts[5]) // idle + iowait
    let total = 0
    // Sum all indices from 1 to 7 to get total ticks
    for (let i = 1; i <= 7; i++) total += parseInt(parts[i])

    return { idle, total }
  }

  return new Promise((resolve) => {
    const start = readStat()
    setTimeout(() => {
      const end = readStat()
      const idleDiff = end.idle - start.idle
      const totalDiff = end.total - start.total
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

    const parse = (key) => {
      const match = content.match(new RegExp(`${key}:\\s+(\\d+)`))
      return match ? parseInt(match[1]) * 1024 : 0 // Convert kB to Bytes
    }

    const total = parse("MemTotal")
    const available = parse("MemAvailable")
    const used = total - available

    return {
      total,
      used,
      percent: Math.round((used / total) * 100),
      usedGB: (used / 1024 ** 3).toFixed(1),
      totalGB: (total / 1024 ** 3).toFixed(1),
    }
  } catch (e) {
    return { percent: 0, usedGB: 0, totalGB: 0 }
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
      const parts = lines[1].replace(/\s+/g, " ").split(" ")

      const total = parseInt(parts[1])
      const used = parseInt(parts[2])

      resolve({
        totalBytes: total,
        usedBytes: used,
        percent: Math.round((used / total) * 100),
        totalGB: (total / 1024 ** 3).toFixed(0),
        usedGB: (used / 1024 ** 3).toFixed(0),
      })
    })
  })
}

export async function Proxy(fastify: FastifyInstance) {
  fastify.get("/api/#sysinfo", async (request, reply) => {
    try {
      const [cpuPercent, storage] = await Promise.all([getCpuStats(), getStorageStats()])

      const memory = getMemStats()
      const distro = getDistroName()

      return {
        device: {
          platform: "Linux",
          distro: distro,
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
      reply.code(500).send({ error: "Internal Server Error" })
    }
  })
}
