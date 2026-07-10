import { useEffect, useState } from 'react'
import { Package, Users, Truck, ShoppingCart, ReceiptText, TakaSign } from '../lib/icons'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'

const summaryCards = [
  { title: 'Total Products', key: 'products', icon: Package, color: 'text-blue-600' },
  { title: 'Total Customers', key: 'customers', icon: Users, color: 'text-emerald-600' },
  { title: 'Total Suppliers', key: 'suppliers', icon: Truck, color: 'text-violet-600' },
  { title: 'Total Purchases', key: 'purchases', icon: ShoppingCart, color: 'text-amber-600' },
  { title: 'Total Sales', key: 'sales', icon: ReceiptText, color: 'text-rose-600' },
  { title: 'Total Revenue', key: 'revenue', icon: TakaSign, color: 'text-slate-700' },
] as const

export default function DashboardPage() {
  const [counts, setCounts] = useState({ products: 0, customers: 0, suppliers: 0, purchases: 0, sales: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ count: productsCount }, { count: customersCount }, { count: suppliersCount }, { count: purchasesCount }, { count: salesCount }, { data: salesData }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('total_price'),
      ])

      const revenue = Array.isArray(salesData) ? salesData.reduce<number>((sum, item: { total_price?: number | string | null }) => sum + Number(item.total_price || 0), 0) : 0
      setCounts({
        products: productsCount || 0,
        customers: customersCount || 0,
        suppliers: suppliersCount || 0,
        purchases: purchasesCount || 0,
        sales: salesCount || 0,
        revenue,
      })
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">Overview of your Mini ERP operations.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map(({ title, key, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{loading ? '...' : key === 'revenue' ? formatCurrency(counts.revenue) : counts[key as keyof typeof counts]}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
