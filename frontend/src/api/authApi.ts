import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  withCredentials: true,
})

export default authApi
