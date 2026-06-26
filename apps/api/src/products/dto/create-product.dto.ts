import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Coca-Cola 350ml' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'COKE-350' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiPropertyOptional({ example: '7701234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'Bebidas' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 1.2 })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 2.0 })
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;
}
