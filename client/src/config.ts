export const Configuration = () => {
  return JSON.parse(localStorage.getItem('_cfg'))
}

export const Desktop = async () => {
  var url = `${Configuration().API_BASE_URL}/api/desktop`
  const options = {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  }
  const response = await fetch(url, options)
  if (response.ok) {
    return await response.json()
  } else {
    return undefined
  }
}
