import { create } from 'zustand'
import api from '../services/api'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await api.post('/token/', { email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const me = await api.get('/usuarios/me/')
    set({ user: me.data, loading: false })
    return me.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, loading: false })
  },

  fetchMe: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { set({ loading: false }); return }
    try {
      const { data } = await api.get('/usuarios/me/')
      set({ user: data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
}))

export default useAuthStore
