export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier_id: string | null;
  purchase_price: number;
  selling_price: number;
  stock: number;
  description: string;
  created_at: string;
  suppliers?: Supplier;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
};

export type Supplier = {
  id: string;
  supplier_code?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  supplier_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_date: string;
  created_at: string;
  suppliers?: Supplier;
  products?: Product;
};

export type Sale = {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  created_at: string;
  customers?: Customer;
  products?: Product;
};
