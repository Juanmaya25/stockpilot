import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregated KPIs + chart data for the business dashboard. */
  async overview(businessId: string) {
    const products = await this.prisma.product.findMany({ where: { businessId } });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last7 = new Date(Date.now() - 7 * DAY_MS);

    const recentSales = await this.prisma.sale.findMany({
      where: { businessId, createdAt: { gte: last7 } },
      include: { items: true },
    });
    const monthSales = await this.prisma.sale.findMany({
      where: { businessId, createdAt: { gte: startOfMonth } },
    });

    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice) * p.stock,
      0,
    );
    const lowStock = products.filter((p) => p.stock <= p.minStock);
    const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total), 0);

    // Revenue per day for the last 7 days (filled, even days with no sales).
    const trend = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      trend.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), 0);
    }
    for (const sale of recentSales) {
      const key = sale.createdAt.toISOString().slice(0, 10);
      if (trend.has(key)) trend.set(key, (trend.get(key) ?? 0) + Number(sale.total));
    }
    const salesTrend = [...trend.entries()].map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2)),
    }));

    // Top products by units sold in the last 7 days.
    const sold = new Map<string, number>();
    for (const sale of recentSales) {
      for (const item of sale.items) {
        sold.set(item.productId, (sold.get(item.productId) ?? 0) + item.quantity);
      }
    }
    const topProducts = products
      .map((p) => ({ id: p.id, name: p.name, unitsSold: sold.get(p.id) ?? 0 }))
      .filter((p) => p.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return {
      totalProducts: products.length,
      inventoryValue: Number(inventoryValue.toFixed(2)),
      lowStockCount: lowStock.length,
      monthSalesCount: monthSales.length,
      monthRevenue: Number(monthRevenue.toFixed(2)),
      salesTrend,
      topProducts,
    };
  }
}
