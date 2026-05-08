import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  response => {
    const { code } = response.data

    if (code !== 0) {
      console.error(`API Error [${code}]:`, response.data.message)
      return Promise.reject(new Error(response.data.message))
    }

    return response.data
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      const errorMessage = data.message || 'Unknown error'
      const errorCode = data.code || status

      console.error(`HTTP Error [${status}]:`, errorMessage)

      if (status === 401) {
        localStorage.removeItem('token')
      }

      const enhancedError = new Error(errorMessage) as Error & { code?: number }
      enhancedError.code = errorCode
      return Promise.reject(enhancedError)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
