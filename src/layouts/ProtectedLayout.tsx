import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { Link, useRouter } from '../lib/router'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '◉' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/suppliers', label: 'Suppliers', icon: '🚚' },
  { to: '/purchases', label: 'Purchases', icon: '🛒' },
  { to: '/sales', label: 'Sales', icon: '🧾' },
  { to: '/reports', label: 'Reports', icon: '📊' },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { route, navigate } = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b bg-slate-900 p-6 text-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Mini ERP</h2>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${route === to ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <Button variant="outline" className="w-full justify-start border-slate-700 bg-slate-800 text-white hover:bg-slate-700" onClick={handleLogout}>
              <span className="mr-2">↩</span>
              Logout
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
