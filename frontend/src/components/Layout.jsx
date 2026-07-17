import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SinoBadge from './SinoBadge'
import useDarkMode from '../store/useDarkMode'

function ToggleDark({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
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
  )
}

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function Layout() {
  const [dark, toggle] = useDarkMode()
  const [collapsed, setCollapsed] = useState(false)   // desktop: recolhido
  const [drawerOpen, setDrawerOpen] = useState(false) // mobile: aberto

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0b0b]">

      {/* ── Overlay mobile ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar desktop (sempre visível) ── */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
      </div>

      {/* ── Sidebar mobile (drawer) ── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 md:hidden flex
          transform transition-transform duration-300
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          collapsed={false}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── Conteúdo principal ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-12 bg-white dark:bg-[#0a0b0b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1 px-4 shrink-0">
          {/* Hambúrguer — só mobile */}
          <button
            className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setDrawerOpen(o => !o)}
            title="Menu"
          >
            <HamburgerIcon />
          </button>

          <div className="flex items-center gap-1 ml-auto">
            <ToggleDark dark={dark} toggle={toggle} />
            <SinoBadge />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
