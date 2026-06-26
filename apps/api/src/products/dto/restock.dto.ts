import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RestockDto {
  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Compra a proveedor' })
  @IsOptional()
  @IsString()
  reason?: string;
}
