// Optimized with Caching and Smart Prioritization
const apiCache = new Map()

export function useMapRepository() {
  // --- Helpers ---
  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear Sky'
    if (code >= 1 && code <= 3) return 'Partly Cloudy'
    if (code >= 45 && code <= 48) return 'Fog'
    if (code >= 51 && code <= 67) return 'Rain'
    if (code >= 71 && code <= 77) return 'Snow'
    return 'Unknown'
  }

  // --- API Calls ---
  const geocodeLocation = async (query) => {
    const cacheKey = `geo:${query}`
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      )
      const data = await res.json()
      const result = data[0] ? Object.freeze(data[0]) : null

      apiCache.set(cacheKey, result)
      return result
    } catch (e) {
      console.warn('Geocoding failed', e)
      return null
    }
  }

  const fetchLayerData = async (lat, lng, mode) => {
    if (['standard', 'satellite', 'topo'].includes(mode)) return null

    // Cache key precision reduced to ~11m
    const rLat = lat.toFixed(4)
    const rLng = lng.toFixed(4)
    const cacheKey = `layer:${mode}:${rLat}:${rLng}`

    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey)

    const radius = 60 // Slightly increased radius for better touch target feel
    let query = ''

    // Updated Query: Get more candidates (limit 5) to sort in JS
    if (mode === 'railway') {
      query = `
        [out:json][timeout:10];
        (
          node["railway"="station"](around:${radius},${lat},${lng});
          node["railway"="halt"](around:${radius},${lat},${lng});
          node["railway"="tram_stop"](around:${radius},${lat},${lng});
          way["railway"](around:${radius},${lat},${lng});
        );
        out tags center 5;
      `
    } else if (mode === 'transport') {
      query = `
        [out:json][timeout:10];
        (
          node["station"](around:${radius},${lat},${lng});
          node["public_transport"~"stop|station"](around:${radius},${lat},${lng});
          node["highway"="bus_stop"](around:${radius},${lat},${lng});
          relation["route"="subway"](around:${radius},${lat},${lng});
        );
        out tags center 5;
      `
    }

    if (!query) return null

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      })
      const data = await res.json()
      let bestMatch = null

      if (data.elements && data.elements.length > 0) {
        // Scoring system to pick the most relevant item
        // 1. Prefer items with names
        // 2. Prefer Stations/Stops over Tracks
        bestMatch = data.elements.sort((a, b) => {
          const scoreA =
            (a.tags.name ? 10 : 0) +
            (a.tags.railway === 'station' || a.tags.public_transport ? 5 : 0)
          const scoreB =
            (b.tags.name ? 10 : 0) +
            (b.tags.railway === 'station' || b.tags.public_transport ? 5 : 0)
          return scoreB - scoreA
        })[0]
      }

      let info = null
      if (bestMatch && bestMatch.tags) {
        info = {}
        const tags = bestMatch.tags

        if (mode === 'railway') {
          info['Type'] = tags.railway || 'Track'
          if (tags.name) info['Name'] = tags.name

          // --- ADDED: Rail Identifier Logic ---
          if (tags['ref:crs']) {
            info['CRS Code'] = tags['ref:crs']
          } else if (tags['ref'] && tags['ref'].length === 3) {
            // Fallback: If 'ref' is exactly 3 chars, assume it's a CRS code
            info['CRS Code'] = tags['ref']
          }

          if (tags['ref:tiploc']) {
            info['TIPLOC'] = tags['ref:tiploc']
          }
          // ------------------------------------

          if (tags.operator) info['Operator'] = tags.operator
          if (tags.maxspeed) info['Max Speed'] = tags.maxspeed + ' km/h'
          if (tags.gauge) info['Gauge'] = tags.gauge
          if (tags.voltage) info['Voltage'] = tags.voltage
        } else {
          info['Type'] = tags.public_transport || tags.highway || 'Transport'
          if (tags.name) info['Stop Name'] = tags.name
          if (tags.network) info['Network'] = tags.network
          if (tags.ref) info['Ref'] = tags.ref
          if (tags.operator) info['Operator'] = tags.operator
        }
      }

      const result = info && Object.keys(info).length > 0 ? Object.freeze(info) : null
      apiCache.set(cacheKey, result)
      return result
    } catch (e) {
      console.warn('Overpass fetch failed', e)
      return null
    }
  }

  const fetchFullDetails = async (lat, lng, currentMode) => {
    const cacheKey = `details:${lat.toFixed(5)}:${lng.toFixed(5)}:${currentMode}`
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey)

    try {
      const [geoRes, weatherRes, layerInfo] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&elevation=nan`,
        ),
        fetchLayerData(lat, lng, currentMode),
      ])

      const geoData = await geoRes.json()
      const weatherData = await weatherRes.json()

      const result = Object.freeze({
        lat,
        lng,
        name:
          geoData.address.city ||
          geoData.address.town ||
          geoData.address.village ||
          'Unknown Location',
        address: geoData.display_name,
        country: geoData.address.country,
        county: geoData.address.county,
        elevation: weatherData.elevation || 'N/A',
        weather: {
          temp: weatherData.current?.temperature_2m ?? '--',
          desc: getWeatherDescription(weatherData.current?.weather_code ?? -1),
        },
        layerData: layerInfo,
      })

      apiCache.set(cacheKey, result)
      return result
    } catch (e) {
      console.error('Details fetch failed', e)
      throw e
    }
  }

  return {
    geocodeLocation,
    fetchFullDetails,
  }
}
