import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from '../lib/icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DialogContent } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import type { Supplier } from '../types'

const emptySupplier = { supplier_code: '', name: '', email: '', phone: '', address: '' }

type SupplierFormState = typeof emptySupplier

const SupplierFormModal = ({
  editingId,
  error,
  form,
  onCancel,
  onSubmit,
  setForm,
}: {
  editingId: string | null
  error: string
  form: SupplierFormState
  onCancel: () => void
  onSubmit: (event: React.FormEvent) => void
  setForm: React.Dispatch<React.SetStateAction<SupplierFormState>>
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
    <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-auto">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Supplier ID</Label><Input value={form.supplier_code} onChange={(event) => setForm({ ...form, supplier_code: event.target.value })} placeholder="SUP-001" required /></div>
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></div>
        </div>
        <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required /></div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button>{editingId ? 'Update Supplier' : 'Save Supplier'}</Button>
        </div>
      </form>
    </DialogContent>
  </div>
)

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState(emptySupplier)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.toLowerCase()
    return [supplier.supplier_code, supplier.name, supplier.email, supplier.phone, supplier.address].join(' ').toLowerCase().includes(query)
  })

  const loadSuppliers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (!error) setSuppliers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadSuppliers() }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (editingId) {
      const { error } = await supabase.from('suppliers').update({ ...form, supplier_code: form.supplier_code.trim() }).eq('id', editingId)
      if (error) return setError(error.message)
    } else {
      const { error } = await supabase.from('suppliers').insert({ ...form, supplier_code: form.supplier_code.trim() })
      if (error) return setError(error.message)
    }
    setForm(emptySupplier)
    setEditingId(null)
    setIsModalOpen(false)
    await loadSuppliers()
  }

  const handleEdit = (supplier: Supplier) => {
    setError('')
    setEditingId(supplier.id)
    setForm({ supplier_code: supplier.supplier_code || '', name: supplier.name, email: supplier.email, phone: supplier.phone, address: supplier.address })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setError('')
    setEditingId(null)
    setForm(emptySupplier)
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setError('')
    setEditingId(null)
    setForm(emptySupplier)
    setIsModalOpen(false)
  }

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = window.confirm(`Delete ${supplier.name}? This action cannot be undone.`)
    if (!confirmed) return

    const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id)
    if (error) return setError(error.message)
    await loadSuppliers()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Suppliers</h1>
        <p className="text-slate-600">Manage supplier records</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Input
            className="w-full md:w-96"
            placeholder="Search suppliers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Add Supplier</Button>
      </div>

      {error && !isModalOpen ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Supplier table</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.supplier_code || supplier.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredSuppliers.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">No suppliers found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen ? (
        <SupplierFormModal
          editingId={editingId}
          error={error}
          form={form}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          setForm={setForm}
        />
      ) : null}
    </div>
  )
}
