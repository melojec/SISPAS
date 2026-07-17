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

export default function Sidebar({ collapsed, onToggleCollapse, onClose }) {
  const { user, logout } = useAuthStore()
  const links = NAV.filter(n => !n.perfis || n.perfis.includes(user?.perfil))

  return (
    <aside
      className={`
        min-h-screen bg-blue-950 dark:bg-[#252525] text-white flex flex-col
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo / header */}
      <div className={`px-3 py-4 border-b border-blue-800 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <img src={logo} alt="SISPAS" className="h-8 w-auto shrink-0" />
        {!collapsed && (
          <p className="text-[10px] text-blue-300 leading-snug">
            Sistema de Monitoramento da Programação Anual de Saúde
          </p>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
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

      {/* Footer: user info + logout + collapse toggle */}
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

        {/* Collapse toggle — only on desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`hidden md:flex items-center justify-center mt-3 w-full text-blue-400 hover:text-white text-xs gap-1 transition-colors`}
          >
            {collapsed ? '▶' : '◀ Recolher'}
          </button>
        )}
      </div>
    </aside>
  )
}
