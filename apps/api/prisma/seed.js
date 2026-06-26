/* Seed demo data: a business with a known login, products and a week of sales. */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const DAY = 86400000;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

async function main() {
  const email = 'demo@stockpilot.dev';

  // Idempotent: wipe any previous demo business (cascades to all its data).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.business
      .delete({ where: { id: existing.businessId } })
      .catch(() => {});
  }

  const business = await prisma.business.create({
    data: { name: 'Tienda Demo StockPilot', currency: 'USD' },
  });
  const owner = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('demo1234', 10),
      name: 'Demo Owner',
      role: 'OWNER',
      businessId: business.id,
    },
  });

  const catalog = [
    { name: 'Coca-Cola 350ml', sku: 'COKE-350', category: 'Bebidas', costPrice: 0.6, salePrice: 1.2, stock: 120, minStock: 24 },
    { name: 'Agua 600ml', sku: 'AGUA-600', category: 'Bebidas', costPrice: 0.3, salePrice: 0.8, stock: 80, minStock: 20 },
    { name: 'Pan tajado', sku: 'PAN-01', category: 'Panadería', costPrice: 1.2, salePrice: 2.5, stock: 6, minStock: 10 },
    { name: 'Leche 1L', sku: 'LECHE-1L', category: 'Lácteos', costPrice: 0.9, salePrice: 1.6, stock: 40, minStock: 15 },
    { name: 'Café 250g', sku: 'CAFE-250', category: 'Despensa', costPrice: 3.0, salePrice: 5.5, stock: 25, minStock: 8 },
    { name: 'Arroz 1kg', sku: 'ARROZ-1K', category: 'Despensa', costPrice: 0.8, salePrice: 1.5, stock: 5, minStock: 12 },
    { name: 'Huevos x12', sku: 'HUEVO-12', category: 'Despensa', costPrice: 1.8, salePrice: 3.2, stock: 30, minStock: 10 },
    { name: 'Chocolatina', sku: 'CHOC-01', category: 'Dulces', costPrice: 0.4, salePrice: 1.0, stock: 150, minStock: 30 },
  ];

  const products = [];
  for (const p of catalog) {
    const prod = await prisma.product.create({
      data: { ...p, businessId: business.id },
    });
    await prisma.stockMovement.create({
      data: { productId: prod.id, type: 'IN', quantity: p.stock, reason: 'Initial stock' },
    });
    products.push(prod);
  }

  // Only sell well-stocked items, so low-stock alerts stay visible in the demo.
  const sellable = products.filter((p) => p.stock >= 25);

  for (let d = 6; d >= 0; d--) {
    const sales = rand(1, 4);
    for (let s = 0; s < sales; s++) {
      const when = new Date(Date.now() - d * DAY + rand(8, 18) * 3600000);
      const picks = [...sellable].sort(() => 0.5 - Math.random()).slice(0, rand(1, 3));
      let total = 0;
      const items = [];
      for (const prod of picks) {
        const qty = rand(1, 4);
        const unit = Number(prod.salePrice);
        total += unit * qty;
        items.push({
          product: { connect: { id: prod.id } },
          quantity: qty,
          unitPrice: prod.salePrice,
          subtotal: unit * qty,
        });
        await prisma.product.update({
          where: { id: prod.id },
          data: { stock: { decrement: qty } },
        });
        await prisma.stockMovement.create({
          data: { productId: prod.id, type: 'OUT', quantity: qty, reason: 'Sale', createdAt: when },
        });
      }
      await prisma.sale.create({
        data: {
          businessId: business.id,
          userId: owner.id,
          total,
          createdAt: when,
          items: { create: items },
        },
      });
    }
  }

  console.log('✅ Seed listo. Login demo:  demo@stockpilot.dev  /  demo1234');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
