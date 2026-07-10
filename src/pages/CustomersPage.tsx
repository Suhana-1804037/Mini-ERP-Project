import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from '../lib/icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DialogContent } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'

const emptyCustomer = { name: '', email: '', phone: '', address: '' }

type CustomerFormState = typeof emptyCustomer

const CustomerFormModal = ({
  editingId,
  error,
  form,
  onCancel,
  onSubmit,
  setForm,
}: {
  editingId: string | null
  error: string
  form: CustomerFormState
  onCancel: () => void
  onSubmit: (event: React.FormEvent) => void
  setForm: React.Dispatch<React.SetStateAction<CustomerFormState>>
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
    <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-auto">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required /></div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button>{editingId ? 'Update Customer' : 'Save Customer'}</Button>
        </div>
      </form>
    </DialogContent>
  </div>
)

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState(emptyCustomer)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filteredCustomers = customers.filter((customer) => {
    const query = search.toLowerCase()
    return [customer.name, customer.email, customer.phone, customer.address].join(' ').toLowerCase().includes(query)
  })

  const loadCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (!error) setCustomers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadCustomers() }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (editingId) {
      const { error } = await supabase.from('customers').update(form).eq('id', editingId)
      if (error) return setError(error.message)
    } else {
      const { error } = await supabase.from('customers').insert(form)
      if (error) return setError(error.message)
    }
    setForm(emptyCustomer)
    setEditingId(null)
    setIsModalOpen(false)
    await loadCustomers()
  }

  const handleEdit = (customer: Customer) => {
    setError('')
    setEditingId(customer.id)
    setForm({ name: customer.name, email: customer.email, phone: customer.phone, address: customer.address })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setError('')
    setEditingId(null)
    setForm(emptyCustomer)
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setError('')
    setEditingId(null)
    setForm(emptyCustomer)
    setIsModalOpen(false)
  }

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(`Delete ${customer.name}? This action cannot be undone.`)
    if (!confirmed) return

    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) return setError(error.message)
    await loadCustomers()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Customers</h1>
        <p className="text-slate-600">Manage customer records</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Input
            className="w-full md:w-96"
            placeholder="Search customers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Add Customer</Button>
      </div>

      {error && !isModalOpen ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>Customer table</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredCustomers.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">No customers found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen ? (
        <CustomerFormModal
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
