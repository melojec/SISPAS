import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SinoBadge from './SinoBadge'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0">
          <SinoBadge />
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
