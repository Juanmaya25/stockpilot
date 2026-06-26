import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateProductDto) {
    const initialStock = dto.stock ?? 0;
    const product = await this.prisma.product.create({
      data: {
        businessId,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        category: dto.category,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        stock: initialStock,
        minStock: dto.minStock ?? 0,
        supplierId: dto.supplierId,
      },
    });

    if (initialStock > 0) {
      await this.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: initialStock,
          reason: 'Initial stock',
        },
      });
    }

    return product;
  }

  findAll(businessId: string, search?: string) {
    return this.prisma.product.findMany({
      where: {
        businessId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Products at or below their minimum stock threshold. */
  async lowStock(businessId: string) {
    const products = await this.prisma.product.findMany({ where: { businessId } });
    return products.filter((p) => p.stock <= p.minStock);
  }

  async findOne(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(businessId: string, id: string, dto: UpdateProductDto) {
    await this.assertOwned(businessId, id);
    return this.prisma.product.update({ where: { id }, data: { ...dto } });
  }

  async remove(businessId: string, id: string) {
    await this.assertOwned(businessId, id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  /** Adds stock and records an IN movement (audit trail). */
  async restock(businessId: string, id: string, quantity: number, reason?: string) {
    const product = await this.assertOwned(businessId, id);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: product.stock + quantity },
    });
    await this.prisma.stockMovement.create({
      data: { productId: id, type: 'IN', quantity, reason: reason ?? 'Restock' },
    });
    return updated;
  }

  /** Throws if the product doesn't exist or belongs to another tenant. */
  private async assertOwned(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
