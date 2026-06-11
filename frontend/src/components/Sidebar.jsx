import { NavLink } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import logo from '../assets/logo.svg'

const NAV = [
  { to: '/',           label: 'Dashboard',  icone: '📊', perfis: null },
  { to: '/domi',       label: 'DOMI',       icone: '🗂️', perfis: null },
  { to: '/relatorios', label: 'Relatórios', icone: '📄', perfis: null },
  { to: '/ciclos',     label: 'Ciclos',     icone: '🔄', perfis: ['administrador','asplan'] },
  { to: '/usuarios',   label: 'Usuários',   icone: '👥', perfis: ['administrador'] },
  { to: '/auditoria',  label: 'Auditoria',  icone: '🔍', perfis: ['administrador','asplan'] },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  const links = NAV.filter(n => !n.perfis || n.perfis.includes(user?.perfil))

  return (
    <aside className="w-64 min-h-screen bg-blue-950 dark:bg-[#252525] text-white flex flex-col">
      <div className="px-4 py-4 border-b border-blue-800 flex flex-col items-center text-center gap-2">
        <img src={logo} alt="SISPAS" className="h-25 w-auto" />
        <p className="text-[10px] text-blue-300 leading-snug">Sistema de Monitoramento da Programação Anual de Saúde</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-blue-700 text-white font-semibold' : 'text-blue-200 hover:bg-blue-800'
              }`
            }
          >
            <span>{icone}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-blue-800">
        <p className="text-xs text-blue-300 truncate">{user?.nome}</p>
        <p className="text-xs text-blue-400">{user?.perfil_display}</p>
        <button
          onClick={logout}
          className="mt-2 w-full text-xs text-red-300 hover:text-red-100 text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
