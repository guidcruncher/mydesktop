export async function IpInformation() {
  return new Promise<any>(async (resolve, reject) => {
    let ipinfo = {}
    const url = 'https://api.ipinfo.io/lite/me?token=9c046f4792abdc'
    const result = await fetch(url)

    if (result.ok) {
      let cityResult = {}
      ipinfo = await result.json()
      try {
        cityResult = await fetch('https://ipinfo.io/city')
      } catch (err) {
        cityResult.ok = false
      }

      if (cityResult.ok) {
        const city = await cityResult.text()
        ipinfo.city = city.replace(/(\r\n|\n|\r)/gm, '')
      } else {
        ipinfo.city = ''
      }

      if (ipinfo.city != '') {
        ipinfo.full = `${ipinfo.city}, ${ipinfo.country}`
      } else {
        ipinfo.full = `${ipinfo.country}`
      }

      resolve(ipinfo)
    } else {
      const err = await result.text()
      reject()
    }
  })
}
