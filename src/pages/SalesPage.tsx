import { useEffect, useMemo, useState } from 'react'
import { Plus } from '../lib/icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'
import type { Sale, Product, Customer } from '../types'

const emptySale = { customer_id: '', product_id: '', quantity: 1, unit_price: 0, total_price: 0, sale_date: new Date().toISOString().slice(0, 10) }
type SaleItem = { product_id: string; product_name: string; quantity: number; unit_price: number; total_price: number; stock: number }
type InvoiceItem = Omit<SaleItem, 'stock'>
type InvoicePreview = { id?: string; invoice_number?: string; customer_name?: string; sale_date: string; items: InvoiceItem[]; grand_total: number }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(emptySale)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoice, setInvoice] = useState<InvoicePreview | null>(null)
  const selectedProduct = products.find((item) => item.id === form.product_id)
  const selectedItemQuantity = saleItems.find((item) => item.product_id === form.product_id)?.quantity || 0
  const selectedAvailableStock = selectedProduct ? selectedProduct.stock - selectedItemQuantity : 0
  const totalPrice = Number(form.quantity) * Number(form.unit_price)
  const grandTotal = saleItems.reduce((sum, item) => sum + Number(item.total_price), 0)
  const quantityError = selectedProduct && Number(form.quantity) > selectedProduct.stock
    ? `Only ${selectedProduct.stock} units are available in stock.`
    : selectedProduct && Number(form.quantity) > selectedAvailableStock
      ? `Only ${selectedAvailableStock} more units can be added for this product.`
    : ''
  const salesInvoices = useMemo(() => sales.reduce<InvoicePreview[]>((invoices, sale) => {
    const groupKey = `${sale.customer_id}-${sale.sale_date}-${sale.created_at || sale.id}`
    const existingInvoice = invoices.find((item) => item.id === groupKey)
    const invoiceItem = {
      product_id: sale.product_id,
      product_name: sale.products?.name || 'Unknown product',
      quantity: Number(sale.quantity),
      unit_price: Number(sale.unit_price),
      total_price: Number(sale.total_price),
    }

    if (existingInvoice) {
      existingInvoice.items.push(invoiceItem)
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
        items: [invoiceItem],
        grand_total: Number(sale.total_price),
      },
    ]
  }, []), [sales])

  const loadData = async () => {
    const [{ data: salesData }, { data: productsData }, { data: customersData }] = await Promise.all([
      supabase.from('sales').select('*, customers(*), products(*)').order('sale_date', { ascending: false }),
      supabase.from('products').select('*').order('name'),
      supabase.from('customers').select('*').order('name'),
    ])
    setSales(salesData || [])
    setProducts(productsData || [])
    setCustomers(customersData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const invoiceId = new URLSearchParams(window.location.search).get('invoice')
    if (!invoiceId || !salesInvoices.length) return

    const selectedInvoice = salesInvoices.find((item) => item.id === invoiceId || item.invoice_number === invoiceId)
    if (selectedInvoice) setInvoice(selectedInvoice)
  }, [salesInvoices])

  const handleProductChange = (value: string) => {
    const product = products.find((item) => item.id === value)
    const unitPrice = Number(product?.selling_price || 0)

    setForm((current) => ({
      ...current,
      product_id: value,
      unit_price: unitPrice,
      total_price: Number(current.quantity) * unitPrice,
    }))
  }

  const handleQuantityChange = (value: number) => {
    setForm((current) => ({
      ...current,
      quantity: value,
      total_price: value * Number(current.unit_price),
    }))
  }

  const handleAddItem = () => {
    setError('')
    if (!selectedProduct) return setError('Please select a product')
    if (Number(form.quantity) <= 0) return setError('Quantity must be greater than 0')

    const existingQuantity = saleItems.find((item) => item.product_id === form.product_id)?.quantity || 0
    const nextQuantity = existingQuantity + Number(form.quantity)
    if (nextQuantity > selectedProduct.stock) {
      return setError(`Cannot add ${form.quantity} units. Only ${selectedProduct.stock - existingQuantity} more units are available for ${selectedProduct.name}.`)
    }

    setSaleItems((current) => {
      const existingItem = current.find((item) => item.product_id === form.product_id)
      if (existingItem) {
        return current.map((item) => item.product_id === form.product_id
          ? { ...item, quantity: nextQuantity, total_price: nextQuantity * item.unit_price }
          : item)
      }

      return [
        ...current,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: Number(form.quantity),
          unit_price: Number(selectedProduct.selling_price),
          total_price: Number(form.quantity) * Number(selectedProduct.selling_price),
          stock: Number(selectedProduct.stock),
        },
      ]
    })
    setForm((current) => ({ ...current, product_id: '', quantity: 1, unit_price: 0, total_price: 0 }))
  }

  const handleRemoveItem = (productId: string) => {
    setSaleItems((current) => current.filter((item) => item.product_id !== productId))
  }

  const handleViewInvoice = (selectedInvoice: InvoicePreview) => {
    setInvoice(selectedInvoice)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.customer_id) return setError('Please select a customer')
    if (!saleItems.length) return setError('Please add at least one item before saving the sale')

    const invalidItem = saleItems.find((item) => item.quantity <= 0 || item.quantity > item.stock)
    if (invalidItem) return setError(`Insufficient stock for ${invalidItem.product_name}`)

    const createdAt = new Date().toISOString()
    const selectedCustomer = customers.find((customer) => customer.id === form.customer_id)
    const payload = saleItems.map((item) => ({
      customer_id: form.customer_id,
      product_id: item.product_id,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
      sale_date: form.sale_date,
      created_at: createdAt,
    }))
    const { data, error } = await supabase.from('sales').insert(payload).select()
    if (error) return setError(error.message)

    await Promise.all(saleItems.map((item) => (
      supabase.from('products').update({ stock: Number(item.stock) - Number(item.quantity) }).eq('id', item.product_id)
    )))
    const savedRows = Array.isArray(data) ? data as Sale[] : []
    setInvoice({
      id: `${form.customer_id}-${form.sale_date}-${savedRows[0]?.created_at || createdAt}`,
      invoice_number: savedRows[0]?.id,
      customer_name: selectedCustomer?.name,
      sale_date: form.sale_date,
      items: saleItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      grand_total: grandTotal,
    })
    setForm(emptySale)
    setSaleItems([])
    loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Sales</h1>
        <p className="text-slate-600">Record sales, deduct stock, and generate invoices.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Add sale</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customer_id} onValueChange={(value: string) => setForm({ ...form, customer_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={form.product_id} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}</SelectContent>
              </Select>
              {selectedProduct ? <p className="text-xs text-slate-500">Available stock: {selectedAvailableStock}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" max={selectedAvailableStock || undefined} value={form.quantity} onChange={(e) => handleQuantityChange(Number(e.target.value))} />
              {quantityError ? <p className="text-xs text-red-600">{quantityError}</p> : null}
            </div>
            <div className="space-y-2"><Label>Unit price</Label><Input type="number" value={form.unit_price} readOnly className="bg-slate-50 text-slate-600" /></div>
            <div className="space-y-2"><Label>Sale date</Label><Input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Total price</Label><Input value={totalPrice} readOnly className="bg-slate-50 text-slate-600" /></div>
            <Button type="button" variant="secondary" className="md:self-end" onClick={handleAddItem}><Plus className="mr-2 h-4 w-4" />Add item</Button>
            <div className="md:col-span-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead><TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.length ? saleItems.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                      <TableCell><Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(item.product_id)}>Remove</Button></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No items added yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-3 text-right text-lg font-semibold">Grand Total: {formatCurrency(grandTotal)}</div>
            </div>
            {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
            <Button className="md:col-span-2"><Plus className="mr-2 h-4 w-4" />Save sale</Button>
          </form>
        </CardContent>
      </Card>
      {invoice ? (
        <Card>
          <CardHeader><CardTitle>Invoice preview</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Invoice #:</strong> {(invoice.invoice_number || invoice.id)?.slice(0, 8).toUpperCase()}</p>
              <p><strong>Customer:</strong> {invoice.customer_name}</p>
              <p><strong>Date:</strong> {invoice.sale_date}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead>Unit Price</TableHead><TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-right text-base"><strong>Total amount:</strong> {formatCurrency(invoice.grand_total)}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Sales history</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesInvoices.map((saleInvoice) => (
                  <TableRow key={saleInvoice.id}>
                    <TableCell>{(saleInvoice.invoice_number || saleInvoice.id)?.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{saleInvoice.customer_name}</TableCell>
                    <TableCell>{saleInvoice.sale_date}</TableCell>
                    <TableCell>{saleInvoice.items.length}</TableCell>
                    <TableCell>{formatCurrency(saleInvoice.grand_total)}</TableCell>
                    <TableCell><Button type="button" variant="outline" size="sm" onClick={() => handleViewInvoice(saleInvoice)}>View Invoice</Button></TableCell>
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
