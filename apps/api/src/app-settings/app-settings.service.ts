import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async get(key: string): Promise<string> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException(`Setting '${key}' not found`);
    return setting.value;
  }

  async getContactRevealPrice(): Promise<number> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'contact_reveal_price_inr' },
    });
    return setting ? Number(setting.value) : 500;
  }

  async update(key: string, value: string) {
    const existing = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException(`Setting '${key}' not found`);
    return this.prisma.appSetting.update({ where: { key }, data: { value } });
  }
}
