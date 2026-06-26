import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registers a sale atomically: validates stock, decrements inventory,
   * records OUT stock movements, and updates the customer total.
   * If anything fails, the whole transaction rolls back.
   */
  async create(businessId: string, userId: string, dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      let total = new Prisma.Decimal(0);
      const itemsData: Prisma.SaleItemCreateWithoutSaleInput[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}" (have ${product.stock}, need ${item.quantity})`,
          );
        }

        const subtotal = product.salePrice.mul(item.quantity);
        total = total.add(subtotal);

        itemsData.push({
          product: { connect: { id: product.id } },
          quantity: item.quantity,
          unitPrice: product.salePrice,
          subtotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            product: { connect: { id: product.id } },
            type: 'OUT',
            quantity: item.quantity,
            reason: 'Sale',
          },
        });
      }

      const sale = await tx.sale.create({
        data: {
          business: { connect: { id: businessId } },
          user: { connect: { id: userId } },
          customer: dto.customerId
            ? { connect: { id: dto.customerId } }
            : undefined,
          total,
          items: { create: itemsData },
        },
        include: { items: true },
      });

      if (dto.customerId) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { totalSpent: { increment: total } },
        });
      }

      return sale;
    });
  }

  findAll(businessId: string) {
    return this.prisma.sale.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, customer: true },
    });
  }

  async findOne(businessId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, businessId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }
}
