export interface AuthUser {
  id: string;
  email: string;
  businessId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string | null;
  costPrice: string; // Prisma Decimal -> string in JSON
  salePrice: string;
  stock: number;
  minStock: number;
  supplierId: string | null;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  productId: string;
  product?: Product;
}

export interface Sale {
  id: string;
  total: string;
  createdAt: string;
  items: SaleItem[];
  customer?: { name: string } | null;
}

export interface DashboardOverview {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  monthSalesCount: number;
  monthRevenue: number;
  salesTrend: { date: string; revenue: number }[];
  topProducts: { id: string; name: string; unitsSold: number }[];
}
