import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'
import { navigateTo } from '../lib/router'
import type { Product, Customer, Supplier, Purchase, Sale } from '../types'

type ReportSectionProps = {
  id: string
  title: string
  open: boolean
  onToggle: (id: string) => void
  children: ReactNode
}

type SalesInvoiceReport = {
  id: string
  invoice_number: string
  customer_name: string
  sale_date: string
  item_count: number
  total_quantity: number
  grand_total: number
}

const ReportSection = ({ id, title, open, onToggle, children }: ReportSectionProps) => (
  <Card>
    <button
      type="button"
      className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
      aria-expanded={open}
      onClick={() => onToggle(id)}
    >
      <CardTitle className="text-base">{title}</CardTitle>
      <span className="text-sm text-slate-500">{open ? 'v' : '>'}</span>
    </button>
    <div className={`grid transition-all duration-200 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">
        <CardContent className="border-t border-slate-100 pt-4">{children}</CardContent>
      </div>
    </div>
  </Card>
)

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [openReports, setOpenReports] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const load = async () => {
      const [{ data: productsData }, { data: customersData }, { data: suppliersData }, { data: purchasesData }, { data: salesData }] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('purchases').select('*, suppliers(*), products(*)').order('purchase_date', { ascending: false }),
        supabase.from('sales').select('*, customers(*), products(*)').order('sale_date', { ascending: false }),
      ])
      setProducts(productsData || [])
      setCustomers(customersData || [])
      setSuppliers(suppliersData || [])
      setPurchases(purchasesData || [])
      setSales(salesData || [])
    }
    load()
  }, [])

  const filteredProducts = products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  const filteredCustomers = customers.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  const filteredSuppliers = suppliers.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  const filteredPurchases = purchases.filter((item) => [item.suppliers?.name, item.products?.name].join(' ').toLowerCase().includes(search.toLowerCase()))
  const filteredSales = sales.filter((item) => [item.customers?.name, item.products?.name].join(' ').toLowerCase().includes(search.toLowerCase()))
  const salesInvoices = filteredSales.reduce<SalesInvoiceReport[]>((invoices, sale) => {
    const groupKey = `${sale.customer_id}-${sale.sale_date}-${sale.created_at || sale.id}`
    const existingInvoice = invoices.find((item) => item.id === groupKey)

    if (existingInvoice) {
      existingInvoice.item_count += 1
      existingInvoice.total_quantity += Number(sale.quantity)
      existingInvoice.grand_total += Number(sale.total_price)
      return invoices
    }

    return [
      ...invoices,
      {
        id: groupKey,
        invoice_number: sale.id,
        customer_name: sale.customers?.name || 'Unknown customer',
        sale_date: sale.sale_date,
        item_count: 1,
        total_quantity: Number(sale.quantity),
        grand_total: Number(sale.total_price),
      },
    ]
  }, [])
  const toggleReport = (id: string) => setOpenReports((current) => ({ ...current, [id]: !current[id] }))
  const openSalesInvoice = (invoice: SalesInvoiceReport) => {
    navigateTo(`/sales?invoice=${encodeURIComponent(invoice.id)}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-slate-600">Searchable reporting tables for core ERP records.</p>
      </div>
      <div className="space-y-2">
        <Input placeholder="Search reports" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-6">
        <ReportSection id="products" title="Product Report" open={!!openReports.products} onToggle={toggleReport}>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead><TableHead>Stock</TableHead></TableRow></TableHeader>
              <TableBody>{filteredProducts.map((product) => <TableRow key={product.id}><TableCell>{product.name}</TableCell><TableCell>{product.sku}</TableCell><TableCell>{product.category}</TableCell><TableCell>{product.stock}</TableCell></TableRow>)}</TableBody>
            </Table>
        </ReportSection>
        <ReportSection id="customers" title="Customer Report" open={!!openReports.customers} onToggle={toggleReport}>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
              <TableBody>{filteredCustomers.map((customer) => <TableRow key={customer.id}><TableCell>{customer.name}</TableCell><TableCell>{customer.email}</TableCell><TableCell>{customer.phone}</TableCell></TableRow>)}</TableBody>
            </Table>
        </ReportSection>
        <ReportSection id="suppliers" title="Supplier Report" open={!!openReports.suppliers} onToggle={toggleReport}>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
              <TableBody>{filteredSuppliers.map((supplier) => <TableRow key={supplier.id}><TableCell>{supplier.name}</TableCell><TableCell>{supplier.email}</TableCell><TableCell>{supplier.phone}</TableCell></TableRow>)}</TableBody>
            </Table>
        </ReportSection>
        <ReportSection id="purchases" title="Purchase Report" open={!!openReports.purchases} onToggle={toggleReport}>
            <Table>
              <TableHeader><TableRow><TableHead>Supplier</TableHead><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>{filteredPurchases.map((purchase) => <TableRow key={purchase.id}><TableCell>{purchase.suppliers?.name}</TableCell><TableCell>{purchase.products?.name}</TableCell><TableCell>{purchase.quantity}</TableCell><TableCell>{formatCurrency(purchase.total_price)}</TableCell></TableRow>)}</TableBody>
            </Table>
        </ReportSection>
        <ReportSection id="sales" title="Sales Report" open={!!openReports.sales} onToggle={toggleReport}>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead><TableHead>Quantity</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>{salesInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell><Button type="button" variant="ghost" size="sm" onClick={() => openSalesInvoice(invoice)}>{invoice.invoice_number.slice(0, 8).toUpperCase()}</Button></TableCell>
                  <TableCell>{invoice.customer_name}</TableCell>
                  <TableCell>{invoice.sale_date}</TableCell>
                  <TableCell>{invoice.item_count}</TableCell>
                  <TableCell>{invoice.total_quantity}</TableCell>
                  <TableCell>{formatCurrency(invoice.grand_total)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
        </ReportSection>
      </div>
    </div>
  )
}
