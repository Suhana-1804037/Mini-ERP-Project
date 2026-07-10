import { useEffect, useState } from 'react'
import ProtectedLayout from '../layouts/ProtectedLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import ProductsPage from '../pages/ProductsPage'
import CustomersPage from '../pages/CustomersPage'
import SuppliersPage from '../pages/SuppliersPage'
import PurchasesPage from '../pages/PurchasesPage'
import SalesPage from '../pages/SalesPage'
import ReportsPage from '../pages/ReportsPage'
import { supabase } from '../lib/supabase'
import { getCurrentPath, Navigate, useRouter } from '../lib/router'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthed(Boolean(data.session))
      setSessionReady(true)
    }
    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session))
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  if (!sessionReady) return <div className="p-6">Loading...</div>
  return isAuthed ? <>{children}</> : <Navigate to="/login" />
}

function RouteRenderer() {
  const { route } = useRouter()
  const path = (route || getCurrentPath()).split('?')[0]

  if (path === '/login') return <LoginPage />
  if (path === '/register') return <RegisterPage />
  if (path === '/dashboard') return <ProtectedRoute><ProtectedLayout><DashboardPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/products') return <ProtectedRoute><ProtectedLayout><ProductsPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/customers') return <ProtectedRoute><ProtectedLayout><CustomersPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/suppliers') return <ProtectedRoute><ProtectedLayout><SuppliersPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/purchases') return <ProtectedRoute><ProtectedLayout><PurchasesPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/sales') return <ProtectedRoute><ProtectedLayout><SalesPage /></ProtectedLayout></ProtectedRoute>
  if (path === '/reports') return <ProtectedRoute><ProtectedLayout><ReportsPage /></ProtectedLayout></ProtectedRoute>
  return <Navigate to="/login" />
}

export default function AppRoutes() {
  return <RouteRenderer />
}
