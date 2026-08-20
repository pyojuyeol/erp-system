import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // 기본값 7일
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 86400000;
  return value * unitMs;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async issueTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
      },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(Date.now() + parseDurationToMs(refreshExpiresIn));

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(rawRefreshToken), expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async refresh(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) throw new UnauthorizedException('리프레시 토큰이 없습니다.');

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다. 다시 로그인해주세요.');
    }

    // 로테이션: 기존 토큰 폐기 후 새 토큰 발급
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await this.issueTokens(stored.user.id, stored.user.email, stored.user.role);

    return {
      ...tokens,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        name: stored.user.name,
        role: stored.user.role,
      },
    };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return { success: true };
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
    return { success: true };
  }
}
