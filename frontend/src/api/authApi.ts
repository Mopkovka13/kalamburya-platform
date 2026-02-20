import axios from 'axios'

const authApi = axios.create({
  baseURL: 'http://localhost:8082',
  withCredentials: true,
})

export default authApi
