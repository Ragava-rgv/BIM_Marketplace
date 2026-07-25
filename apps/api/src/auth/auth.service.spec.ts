import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import { GstStatus, UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';

/**
 * Regression coverage for Bug 3 ("buyer cannot switch to seller mode"): `canSell` is only ever
 * set true by `switchToSeller`, and `switchMode('SELLER')` deliberately requires it already true.
 * The web frontend fix (calling `switchToSeller` instead of `switchMode` on first enablement)
 * only works if this contract holds — these tests pin it down at the service layer.
 */
describe('AuthService — seller mode switching (Bug 3)', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock }; refreshToken: { create: jest.Mock } };

  const baseUser = {
    id: 'user-1',
    role: UserRole.BUYER,
    canSell: false,
    activeMode: 'BUYER',
    gstStatus: GstStatus.PENDING,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: OtpService, useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('switchToSeller sets canSell, role, and activeMode when GST is ACTIVE', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, gstStatus: GstStatus.ACTIVE });
    prisma.user.update.mockResolvedValue({
      ...baseUser,
      gstStatus: GstStatus.ACTIVE,
      canSell: true,
      role: UserRole.SELLER,
      activeMode: 'SELLER',
    });

    await service.switchToSeller('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: UserRole.SELLER, canSell: true, activeMode: 'SELLER' },
    });
  });

  it('switchToSeller is rejected when GST is not ACTIVE', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, gstStatus: GstStatus.PENDING });

    await expect(service.switchToSeller('user-1')).rejects.toThrow(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('switchMode("SELLER") is rejected until canSell is true — this is why first-time enablement must call switchToSeller', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, canSell: false });

    await expect(service.switchMode('user-1', 'SELLER')).rejects.toThrow(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('switchMode("SELLER") succeeds once canSell is true, and persists activeMode', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, canSell: true });
    prisma.user.update.mockResolvedValue({ ...baseUser, canSell: true, activeMode: 'SELLER' });

    const result = await service.switchMode('user-1', 'SELLER');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeMode: 'SELLER' },
    });
    expect(result.activeMode).toBe('SELLER');
  });
});
