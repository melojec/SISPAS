import { NavLink } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import logo from '../assets/logo.svg'

const NAV = [
  { to: '/',                  label: 'Dashboard',              icone: '📊', perfis: null },
  { to: '/domi',              label: 'DOMI',                   icone: '🗂️', perfis: null },
  { to: '/relatorios',        label: 'Relatórios',             icone: '📄', perfis: null },
  { to: '/analise-indicadores', label: 'Análise de Indicadores', icone: '📎', perfis: null },
  { to: '/ciclos',            label: 'Ciclos',                 icone: '🔄', perfis: ['administrador','asplan'] },
  { to: '/usuarios',          label: 'Usuários',               icone: '👥', perfis: ['administrador'] },
  { to: '/auditoria',         label: 'Auditoria',              icone: '🔍', perfis: ['administrador','asplan'] },
  { to: '/importar-pas',      label: 'Importar PAS',           icone: '📥', perfis: ['administrador'] },
]

function CollapseIcon({ collapsed }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {collapsed
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      }
    </svg>
  )
}

export default function Sidebar({ collapsed, onToggleCollapse, onClose }) {
  const { user, logout } = useAuthStore()
  const links = NAV.filter(n => !n.perfis || n.perfis.includes(user?.perfil))

  return (
    <>
    <aside
      className={`
        h-screen overflow-visible bg-blue-950 dark:bg-[#252525] text-white flex flex-col
        transition-all duration-300 relative
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo + botão recolher */}
      <div className="relative flex items-center gap-3 px-3 py-4 border-b border-blue-800">
        <img src={logo} alt="SISPAS" className={`h-8 w-auto shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
        {!collapsed && (
          <p className="text-[10px] text-blue-300 leading-snug pr-6">
            Sistema de Monitoramento da Programação Anual de Saúde
          </p>
        )}

        {/* Botão recolher — canto superior direito, só desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="
              hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2
              w-8 h-8 rounded-full
              bg-blue-800 hover:bg-blue-600
              border border-blue-700
              items-center justify-center
              text-blue-200 hover:text-white
              transition-colors shadow-md z-50
            "
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {links.map(({ to, label, icone }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${collapsed ? 'justify-center' : ''}
              ${isActive ? 'bg-blue-700 text-white font-semibold' : 'text-blue-200 hover:bg-blue-800'}`
            }
          >
            <span className="text-base leading-none">{icone}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

      </nav>

      {/* Footer: user info + logout */}
      <div className={`px-3 py-4 border-t border-blue-800 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed && (
          <>
            <p className="text-xs text-blue-300 truncate font-semibold">Bem-vindo, {user?.nome}!</p>
            <p className="text-xs text-blue-400">{user?.perfil_display}</p>
            <button
              onClick={logout}
              className="mt-2 w-full text-xs text-red-300 hover:text-red-100 text-left"
            >
              Sair
            </button>
          </>
        )}
        {collapsed && (
          <button
            onClick={logout}
            title="Sair"
            className="text-xs text-red-300 hover:text-red-100"
          >
            🚪
          </button>
        )}
      </div>
    </aside>
    </>
  )
}
