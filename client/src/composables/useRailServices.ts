import { ref, computed, watchEffect, toValue } from 'vue'

export function useRailServices(props) {
  const data = ref([])
  const loading = ref(false)
  const error = ref(null)
  const lastUpdated = ref(new Date())

  // Configuration
  const API_BASE = 'https://api.rtt.io/api/v1/json/search/'

  const fetchData = async () => {
    // Reset state
    loading.value = true
    error.value = null

    // Unwrap props (handles both refs and static values)
    const code = toValue(props.stationCode)
    const mode = toValue(props.mode) || 'dep'
    const showPassing = toValue(props.showPassing) ?? true
    const user = toValue(props.apiUser)
    const pass = toValue(props.apiPass)
    const proxy = toValue(props.proxyUrl) || '' // If you are using a proxy prefix

    if (!user || !pass) {
      error.value = 'Missing API Credentials'
      loading.value = false
      return
    }

    try {
      const suffix = mode === 'arr' ? '/arrivals' : ''
      // Combine proxy (if exists) with RTT API
      const url = `${proxy}${API_BASE}${code}${suffix}`
      const authString = btoa(`${user}:${pass}`)

      const response = await fetch(url, {
        headers: { Authorization: `Basic ${authString}` },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const json = await response.json()

      if (json.services) {
        data.value = parseServices(json.services, mode, showPassing)
      } else {
        data.value = []
      }

      lastUpdated.value = new Date()
    } catch (err) {
      console.error(err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Helper: specific parsing logic moved out of the UI
  const parseServices = (services, mode, showPassing) => {
    return services
      .map((svc) => {
        const isPublicCall = svc.locationDetail.isPublicCall
        const isPassing = !isPublicCall

        if (isPassing && !showPassing) return null

        let t = ''
        let est = ''
        let locName = ''
        const detail = svc.locationDetail

        if (mode === 'arr') {
          locName = detail.origin ? detail.origin[0].description : 'Unknown'
          t = detail.gbttBookedArrival
          est = detail.realtimeArrival
        } else {
          locName = detail.destination ? detail.destination[0].description : 'Unknown'
          t = detail.gbttBookedDeparture
          est = detail.realtimeDeparture
        }

        // Format time HHMM -> HH:MM
        if (t?.length === 4) t = `${t.substring(0, 2)}:${t.substring(2, 4)}`
        if (est?.length === 4) est = `${est.substring(0, 2)}:${est.substring(2, 4)}`

        let statusText = 'On time'
        if (isPassing) statusText = 'Pass'
        else if (!est) statusText = 'On time'
        else if (est !== t) statusText = est

        if (detail.cancelReasonCode) statusText = 'Cancelled'

        return {
          uid: svc.serviceUid,
          loc: locName,
          time: t,
          est: statusText,
          plat: detail.platform || '-',
          isPassing: isPassing,
        }
      })
      .filter((s) => s !== null)
  }

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchData,
  }
}
