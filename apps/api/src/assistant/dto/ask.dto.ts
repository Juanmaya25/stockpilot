import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskDto {
  @ApiProperty({ example: '¿Qué productos debería reordenar y por qué?' })
  @IsString()
  @MinLength(2)
  question!: string;
}
