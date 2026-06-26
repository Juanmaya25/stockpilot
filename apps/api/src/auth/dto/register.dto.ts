import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan Maya' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Mi Tienda SAS' })
  @IsString()
  @MinLength(2)
  businessName!: string;

  @ApiProperty({ example: 'owner@mitienda.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
