import { createClient } from '@supabase/supabase-js'

type QueryPayload = { data: any; error: { message: string } | null; count?: number | null }
type QueryResult = Promise<QueryPayload>
type AuthPayload = Promise<{ data: any; error: { message: string } | null }>
type AuthSessionPayload = Promise<{ data: { session: any | null } }>
type AuthStateCallback = (event: string, session: any | null) => void

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const localSessionKey = 'mini-erp-demo-session'
const localTablesKey = 'mini-erp-demo-tables'
const authListeners = new Set<AuthStateCallback>()
const tableNames = ['products', 'customers', 'suppliers', 'purchases', 'sales'] as const
type TableName = typeof tableNames[number]
type DemoTables = Record<TableName, any[]>

const getStoredSession = () => {
  const storedSession = window.localStorage.getItem(localSessionKey)
  return storedSession ? JSON.parse(storedSession) : null
}

const setStoredSession = (session: any | null) => {
  if (session) {
    window.localStorage.setItem(localSessionKey, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(localSessionKey)
  }
  authListeners.forEach((listener) => listener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

const emptyTables = (): DemoTables => ({
  products: [],
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
})

const getStoredTables = () => {
  const storedTables = window.localStorage.getItem(localTablesKey)
  return { ...emptyTables(), ...(storedTables ? JSON.parse(storedTables) : {}) }
}

const setStoredTables = (tables: DemoTables) => {
  window.localStorage.setItem(localTablesKey, JSON.stringify(tables))
}

const createId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const withRelations = (table: TableName, rows: any[]) => {
  if (table !== 'products' && table !== 'purchases' && table !== 'sales') return rows

  const tables = getStoredTables()
  return rows.map((row) => ({
    ...row,
    products: tables.products.find((product: any) => product.id === row.product_id),
    suppliers: table === 'products' || table === 'purchases' ? tables.suppliers.find((supplier: any) => supplier.id === row.supplier_id) : undefined,
    customers: table === 'sales' ? tables.customers.find((customer: any) => customer.id === row.customer_id) : undefined,
  }))
}

class DemoQuery {
  private table: TableName
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: any
  private filters: Array<{ column: string; value: unknown }> = []
  private orderConfig: { column: string; ascending: boolean } | null = null
  private shouldReturnSingle = false

  constructor(table: TableName) {
    this.table = table
  }

  select(..._args: unknown[]) {
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending ?? true }
    return this
  }

  insert(payload: any) {
    this.action = 'insert'
    this.payload = payload
    return this
  }

  update(payload: any) {
    this.action = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  single() {
    this.shouldReturnSingle = true
    return this
  }

  then<TResult1 = QueryPayload, TResult2 = never>(
    onfulfilled?: ((value: QueryPayload) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected)
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally)
  }

  private rowMatches(row: any) {
    return this.filters.every((filter) => row[filter.column] === filter.value)
  }

  private execute(): QueryResult {
    const tables = getStoredTables()

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload]
      const createdRows = items.map((item) => ({
        ...item,
        id: item.id || createId(),
        created_at: item.created_at || new Date().toISOString(),
      }))
      tables[this.table] = [...createdRows, ...tables[this.table]]
      setStoredTables(tables)
      const data = this.shouldReturnSingle ? withRelations(this.table, createdRows)[0] : withRelations(this.table, createdRows)
      return Promise.resolve({ data, error: null, count: createdRows.length })
    }

    if (this.action === 'update') {
      tables[this.table] = tables[this.table].map((row: any) => (this.rowMatches(row) ? { ...row, ...this.payload } : row))
      setStoredTables(tables)
      return Promise.resolve({ data: null, error: null, count: null })
    }

    if (this.action === 'delete') {
      tables[this.table] = tables[this.table].filter((row: any) => !this.rowMatches(row))
      setStoredTables(tables)
      return Promise.resolve({ data: null, error: null, count: null })
    }

    let rows = withRelations(this.table, [...tables[this.table]])
    if (this.filters.length) rows = rows.filter((row) => this.rowMatches(row))
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig
      rows.sort((a, b) => {
        const left = a[column] ?? ''
        const right = b[column] ?? ''
        if (left === right) return 0
        return (left > right ? 1 : -1) * (ascending ? 1 : -1)
      })
    }

    return Promise.resolve({
      data: this.shouldReturnSingle ? rows[0] || null : rows,
      error: null,
      count: rows.length,
    })
  }
}

const demoSupabase = {
  auth: {
    getSession: async (): AuthSessionPayload => ({ data: { session: getStoredSession() } }),
    onAuthStateChange: (callback: AuthStateCallback) => {
      authListeners.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback)
            },
          },
        },
      }
    },
    signInWithPassword: async (...args: unknown[]): AuthPayload => {
      const credentials = args[0] as { email?: string } | undefined
      const session = { user: { email: credentials?.email || 'demo@mini-erp.local' } }
      setStoredSession(session)
      return { data: { session }, error: null }
    },
    signUp: async (...args: unknown[]): AuthPayload => {
      const credentials = args[0] as { email?: string } | undefined
      const session = { user: { email: credentials?.email || 'demo@mini-erp.local' } }
      setStoredSession(session)
      return { data: { session }, error: null }
    },
    signOut: async () => {
      setStoredSession(null)
      return { error: null }
    },
  },
  from: (table: TableName) => new DemoQuery(table),
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : demoSupabase
