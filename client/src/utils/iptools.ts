export async function IpInformation() {
  return new Promise<any>((resolve, reject) => {
    const ipinfo = {}
    const url = 'https://api.ipinfo.io/lite/me?token=9c046f4792abdc'
    const result = await fetch(url)

    if (result.ok) {
      ipinfo = await result.json()

      const cityResult = await fetch('https://ipinfo.io/city')

      if (cityResult.ok) {
        const city = await cityResult.text()
        ipinfo.city = city.replace(/(\r\n|\n|\r)/gm, '')
      } else {
        ipinfo.city = ''
      }
      resolve(ipinfo)
    } else {
      reject()
    }
  })
}
