'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Candidatures', icon: '📋' },
  { href: '/search', label: 'Recherche', icon: '🔍' },
  { href: '/map', label: 'Carte', icon: '🗺️' },
  { href: '/companies', label: 'Entreprises', icon: '🏢' },
  { href: '/dashboard/stats', label: 'Stats', icon: '📊' },
  { href: '/settings', label: 'Paramètres', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-black text-brand-600">1taff4me</span>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 px-3">v0.1.0</p>
      </div>
    </aside>
  )
}
