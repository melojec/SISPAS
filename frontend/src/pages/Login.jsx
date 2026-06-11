import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/authStore'
import useDarkMode from '../store/useDarkMode'
import logo from '../assets/logo.svg'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [dark, toggleDark] = useDarkMode()

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
    <div className="min-h-screen bg-blue-950 dark:bg-gray-950 flex items-center justify-center px-4">
      <button
        onClick={toggleDark}
        className="fixed top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title={dark ? 'Modo claro' : 'Modo escuro'}
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.7.7M6.34 17.66l-.7.7m12.02 0-.7-.7M6.34 6.34l-.7-.7M12 7a5 5 0 100 10A5 5 0 0012 7z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          </svg>
        )}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <img src={logo} alt="SISPAS" className="h-30 w-auto" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sistema de Monitoramento da Programação Anual de Saúde</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              {...register('email', { required: 'Informe o e-mail' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <input
              id="password"
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              {...register('password', { required: 'Informe a senha' })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {erro && <p className="text-red-600 dark:text-red-400 text-sm text-center">{erro}</p>}

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
