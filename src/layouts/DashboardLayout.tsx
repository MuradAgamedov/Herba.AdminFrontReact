import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './DashboardLayout.css'

interface NavLeaf {
  to: string
  label: string
  end?: boolean
}

interface NavGroup {
  label: string
  children: NavLeaf[]
}

type NavItem = NavLeaf | NavGroup

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Ana səhifə', end: true },
  { to: '/hero', label: 'Hero' },
  { to: '/about', label: 'Haqqımızda' },
  {
    label: 'Bloqlar',
    children: [
      { to: '/blogs/categories', label: 'Bloq Kateqoriyaları' },
      { to: '/blogs', label: 'Bloqlar', end: true },
      { to: '/blogs/footer-categories', label: 'Footer Kateqoriyaları' },
    ],
  },
  {
    label: 'Məhsullar',
    children: [
      { to: '/products/categories', label: 'Məhsul Kateqoriyaları' },
      { to: '/products', label: 'Məhsullar', end: true },
      { to: '/products/featured', label: 'Seçilmiş Məhsullar' },
    ],
  },
  { to: '/testimonials', label: 'Rəylər' },
  { to: '/aims', label: 'Məqsədlər' },
  { to: '/analyses', label: 'Analizlər' },
]

function NavGroupItem({ group }: { group: NavGroup }) {
  const location = useLocation()
  const containsActive = group.children.some((child) =>
    child.end ? location.pathname === child.to : location.pathname.startsWith(child.to),
  )
  const [isOpen, setIsOpen] = useState(containsActive)

  return (
    <div className={`dashboard-nav-group ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className={`dashboard-nav-group-toggle ${containsActive ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{group.label}</span>
        <span className="dashboard-nav-chevron" aria-hidden="true">
          ⌄
        </span>
      </button>

      {isOpen && (
        <div className="dashboard-nav-subitems">
          {group.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end={child.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">Herba Admin</div>
        <nav className="dashboard-nav">
          {NAV_ITEMS.map((item) =>
            isGroup(item) ? (
              <NavGroupItem key={item.label} group={item} />
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-user">
            <span className="dashboard-user-name">
              {user?.name} {user?.surName}
            </span>
            <span className="dashboard-user-role">{user?.role}</span>
          </div>
          <button type="button" className="dashboard-logout" onClick={logout}>
            Çıxış
          </button>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
