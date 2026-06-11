import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const onSubmit = async ({ email, password }) => {
    setErro('')
    setCarregando(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-950">SISPAS</h1>
          <p className="text-sm text-gray-500 mt-1">Secretaria de Estado da Saúde — MA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              {...register('email', { required: 'Informe o e-mail' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              {...register('password', { required: 'Informe a senha' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
