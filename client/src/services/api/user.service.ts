import axiosInstance from './axios'

export const userService = {
  getCurrentUser() {
    return axiosInstance.get('/users/me')
  },

  getUser(id: string) {
    return axiosInstance.get(`/users/${id}`)
  },

  getAllUsers() {
    return axiosInstance.get('/users')
  },
}
