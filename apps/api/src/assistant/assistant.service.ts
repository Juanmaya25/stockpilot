import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface ChatCompletion {
  choices: { message: { content: string } }[];
}

/**
 * AI assistant grounded in the tenant's real data. Builds a compact snapshot
 * of the business (inventory, low stock, recent sales) and asks an LLM to
 * answer the user's question using ONLY that data.
 *
 * Uses Groq's free, OpenAI-compatible API — provider/model are configurable,
 * so the same code works with any OpenAI-style endpoint.
 */
@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async ask(businessId: string, question: string): Promise<{ answer: string }> {
    const context = await this.buildContext(businessId);
    const answer = await this.complete(question, context);
    return { answer };
  }

  /** Compact, factual snapshot of the business for grounding. */
  private async buildContext(businessId: string): Promise<string> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    const products = await this.prisma.product.findMany({
      where: { businessId },
      orderBy: { stock: 'asc' },
      take: 60,
    });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sales = await this.prisma.sale.findMany({
      where: { businessId, createdAt: { gte: since } },
      include: { items: true },
    });

    const soldByProduct = new Map<string, number>();
    for (const sale of sales) {
      for (const item of sale.items) {
        soldByProduct.set(
          item.productId,
          (soldByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    const inventoryValue = products.reduce(
      (sum, p) => sum + Number(p.costPrice) * p.stock,
      0,
    );
    const revenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const lowStock = products.filter((p) => p.stock <= p.minStock);

    const productLines = products
      .map(
        (p) =>
          `- ${p.name} | SKU ${p.sku} | stock ${p.stock} | min ${p.minStock} | costo ${String(p.costPrice)} | venta ${String(p.salePrice)} | vendidas(30d) ${soldByProduct.get(p.id) ?? 0}`,
      )
      .join('\n');

    return [
      `Negocio: ${business?.name ?? ''} (moneda ${business?.currency ?? 'USD'})`,
      `Productos (${products.length}):`,
      productLines || '(sin productos)',
      `Valor de inventario a costo: ${inventoryValue.toFixed(2)}`,
      `Ventas últimos 30 días: ${sales.length} ventas, ingresos ${revenue.toFixed(2)}`,
      `Productos en stock bajo (stock <= mínimo): ${
        lowStock.length
          ? lowStock.map((p) => `${p.name} (${p.stock}/${p.minStock})`).join('; ')
          : 'ninguno'
      }`,
    ].join('\n');
  }

  private async complete(question: string, context: string): Promise<string> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    const model =
      this.config.get<string>('AI_MODEL') ?? 'llama-3.3-70b-versatile';

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI assistant not configured. Set GROQ_API_KEY (free key at console.groq.com).',
      );
    }

    const systemPrompt =
      'Eres el asistente de StockPilot, un sistema de inventario y ventas para negocios. ' +
      'Responde de forma BREVE, concreta y accionable, SOLO con base en los datos del negocio que te doy. ' +
      'Si la pregunta no se puede responder con esos datos, dilo claramente. ' +
      'Usa el mismo idioma del usuario.\n\n' +
      `DATOS ACTUALES DEL NEGOCIO:\n${context}`;

    const res = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new ServiceUnavailableException(
        `AI provider error (${res.status}): ${detail.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as ChatCompletion;
    return data.choices[0]?.message?.content?.trim() ?? '(sin respuesta)';
  }
}
