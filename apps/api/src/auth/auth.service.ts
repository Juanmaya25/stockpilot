import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Creates a new Business and its first OWNER user, returns a token. */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: 'OWNER',
        business: { create: { name: dto.businessName } },
      },
    });

    return this.issueToken(user.id, user.email, user.businessId, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, user.email, user.businessId, user.role);
  }

  private async issueToken(
    userId: string,
    email: string,
    businessId: string,
    role: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, businessId, role },
      {
        secret: this.config.get<string>('JWT_SECRET') ?? 'dev-fallback-secret',
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
    return { accessToken, user: { id: userId, email, businessId, role } };
  }
}
