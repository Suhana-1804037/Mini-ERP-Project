import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from '../lib/icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DialogContent } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/currency'
import type { Product, Supplier } from '../types'

const emptyProduct = {
  name: '',
  sku: '',
  category: '',
  supplier_id: '',
  purchase_price: 0,
  selling_price: 0,
  stock: 0,
  description: '',
}

type ProductFormState = typeof emptyProduct

const StockBadge = ({ stock }: { stock: number }) => {
  if (stock >= 20) {
    return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">🟢 In Stock</span>
  }

  if (stock > 0) {
    return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">🟡 Low Stock</span>
  }

  return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">🔴 Out of Stock</span>
}

const ProductFormModal = ({
  editingId,
  error,
  filteredSuppliers,
  form,
  onCancel,
  onSubmit,
  setForm,
  setSupplierSearch,
  supplierSearch,
}: {
  editingId: string | null
  error: string
  filteredSuppliers: Supplier[]
  form: ProductFormState
  onCancel: () => void
  onSubmit: (event: React.FormEvent) => void
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>
  setSupplierSearch: React.Dispatch<React.SetStateAction<string>>
  supplierSearch: string
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
    <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-auto">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={form.supplier_id} onValueChange={(value: string) => setForm({ ...form, supplier_id: value })}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                <div className="mb-2">
                  <Input value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder="Search suppliers..." />
                </div>
                {filteredSuppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>)}
                {!filteredSuppliers.length ? <p className="px-2 py-1 text-sm text-slate-500">No suppliers found</p> : null}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Purchase Price</Label><Input type="number" min="0" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: Number(e.target.value) })} required /></div>
          <div className="space-y-2"><Label>Selling Price</Label><Input type="number" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} required /></div>
          <div className="space-y-2"><Label>Current Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required /></div>
        </div>
        <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button>{editingId ? 'Update Product' : 'Save Product'}</Button>
        </div>
      </form>
    </DialogContent>
  </div>
)

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const filteredSuppliers = suppliers.filter((supplier) => supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()))
  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase()
    return [product.name, product.sku, product.category, product.suppliers?.name].join(' ').toLowerCase().includes(query)
  })

  const loadProducts = async () => {
    setLoading(true)
    const [{ data: productsData, error }, { data: suppliersData }] = await Promise.all([
      supabase.from('products').select('*, suppliers(*)').order('created_at', { ascending: false }),
      supabase.from('suppliers').select('*').order('name'),
    ])
    if (!error) setProducts(productsData || [])
    setSuppliers(suppliersData || [])
    setLoading(false)
  }

  useEffect(() => { loadProducts() }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!form.supplier_id) return setError('Please select a supplier')

    const payload = {
      ...form,
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      stock: Number(form.stock),
    }

    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId)
      if (error) return setError(error.message)
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) return setError(error.message)
    }

    setForm(emptyProduct)
    setEditingId(null)
    setSupplierSearch('')
    setIsModalOpen(false)
    await loadProducts()
  }

  const handleEdit = (product: Product) => {
    setError('')
    setEditingId(product.id)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplier_id: product.supplier_id || '',
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock: product.stock,
      description: product.description,
    })
    setSupplierSearch('')
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setError('')
    setEditingId(null)
    setForm(emptyProduct)
    setSupplierSearch('')
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setError('')
    setEditingId(null)
    setForm(emptyProduct)
    setSupplierSearch('')
    setIsModalOpen(false)
  }

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(`Delete ${product.name}? This action cannot be undone.`)
    if (!confirmed) return

    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) return setError(error.message)
    await loadProducts()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="text-slate-600">Manage inventory products</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Input
            className="w-full md:w-96"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />Add Product
        </Button>
      </div>

      {error && !isModalOpen ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Product table</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.suppliers?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{product.stock}</span>
                        <span className="text-slate-400">—</span>
                        <StockBadge stock={product.stock} />
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.purchase_price)}</TableCell>
                    <TableCell>{formatCurrency(product.selling_price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(product)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredProducts.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">No products found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen ? (
        <ProductFormModal
          editingId={editingId}
          error={error}
          filteredSuppliers={filteredSuppliers}
          form={form}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          setForm={setForm}
          setSupplierSearch={setSupplierSearch}
          supplierSearch={supplierSearch}
        />
      ) : null}
    </div>
  )
}
