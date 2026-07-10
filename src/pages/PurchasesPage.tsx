import { useEffect, useState } from 'react'
import { Plus } from '../lib/icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'
import type { Purchase, Product } from '../types'

const emptyPurchase = { product_id: '', quantity: 1, purchase_date: new Date().toISOString().slice(0, 10) }

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyPurchase)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const selectedProduct = products.find((item) => item.id === form.product_id)
  const selectedSupplier = selectedProduct?.suppliers
  const unitPurchasePrice = Number(selectedProduct?.purchase_price || 0)
  const totalPurchaseCost = Number(form.quantity) * unitPurchasePrice
  const filteredProducts = products.filter((product) => [product.name, product.sku].join(' ').toLowerCase().includes(productSearch.toLowerCase()))

  const loadData = async () => {
    const [{ data: purchasesData }, { data: productsData }] = await Promise.all([
      supabase.from('purchases').select('*, suppliers(*), products(*)').order('purchase_date', { ascending: false }),
      supabase.from('products').select('*, suppliers(*)').order('name'),
    ])
    setPurchases(purchasesData || [])
    setProducts(productsData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!selectedProduct) return setError('Please select a product')
    if (!selectedProduct.supplier_id) return setError('Selected product does not have a default supplier')
    if (Number(form.quantity) <= 0) return setError('Purchase quantity must be greater than 0')

    const payload = {
      supplier_id: selectedProduct.supplier_id,
      product_id: form.product_id,
      quantity: Number(form.quantity),
      unit_price: unitPurchasePrice,
      total_price: totalPurchaseCost,
      purchase_date: form.purchase_date,
    }
    const { error } = await supabase.from('purchases').insert(payload)
    if (error) return setError(error.message)

    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: Number(selectedProduct.stock) + Number(form.quantity) })
      .eq('id', form.product_id)
    if (stockError) return setError(stockError.message)

    setForm(emptyPurchase)
    setProductSearch('')
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Purchases</h1>
        <p className="text-slate-600">Record supplier purchases and update stock.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Add purchase</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={(value: string) => setForm({ ...form, product_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  <div className="mb-2">
                    <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." />
                  </div>
                  {filteredProducts.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} ({product.sku})</SelectItem>)}
                  {!filteredProducts.length ? <p className="px-2 py-1 text-sm text-slate-500">No products found</p> : null}
                </SelectContent>
              </Select>
              {selectedProduct ? <p className="text-xs text-slate-500">Current stock: {selectedProduct.stock}</p> : null}
            </div>
            <div className="space-y-2"><Label>Product ID</Label><Input value={selectedProduct?.sku || ''} readOnly className="bg-slate-50 text-slate-600" /></div>
            <div className="space-y-2"><Label>Product name</Label><Input value={selectedProduct?.name || ''} readOnly className="bg-slate-50 text-slate-600" /></div>
            <div className="space-y-2"><Label>Supplier name</Label><Input value={selectedSupplier?.name || ''} readOnly className="bg-slate-50 text-slate-600" /></div>
            <div className="space-y-2"><Label>Unit purchase price</Label><Input value={selectedProduct ? formatCurrency(unitPurchasePrice) : ''} readOnly className="bg-slate-50 text-slate-600" /></div>
            <div className="space-y-2"><Label>Purchase quantity</Label><Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Purchase date</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total purchase cost</Label><Input value={formatCurrency(totalPurchaseCost)} readOnly className="bg-slate-50 text-slate-600" /></div>
            {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
            <Button className="md:col-span-2"><Plus className="mr-2 h-4 w-4" />Save purchase</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Purchase history</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase ID</TableHead><TableHead>Purchase Date</TableHead><TableHead>Supplier Name</TableHead><TableHead>Product ID</TableHead><TableHead>Product Name</TableHead><TableHead>Unit Purchase Price</TableHead><TableHead>Quantity</TableHead><TableHead>Total Purchase Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{purchase.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{purchase.purchase_date}</TableCell>
                    <TableCell>{purchase.suppliers?.name}</TableCell>
                    <TableCell>{purchase.products?.sku}</TableCell>
                    <TableCell>{purchase.products?.name}</TableCell>
                    <TableCell>{formatCurrency(purchase.unit_price)}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>{formatCurrency(purchase.total_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
