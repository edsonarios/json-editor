export const API_URL = import.meta.env.VITE_API_URL
export const DB_ENVS = () => {
  const envs = import.meta.env.VITE_DB_ENVS as string
  return envs.split(',')
}

export const areJsonEqual = (json1: string, json2: string) => {
  try {
    const obj1 = JSON.parse(json1)
    const obj2 = JSON.parse(json2)

    const normalizedJson1 = JSON.stringify(obj1, null, 2)
    const normalizedJson2 = JSON.stringify(obj2, null, 2)
    return normalizedJson1 === normalizedJson2
  } catch (error) {
    // console.error('Not valid json', error)
    return false
  }
}
