import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonusConfig } from './bonus-config.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(BonusConfig)
    private bonusRepo: Repository<BonusConfig>,
  ) {}

  private async getOrCreate(): Promise<BonusConfig> {
    let config = await this.bonusRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.bonusRepo.create({ id: 1, discountPercentage: 10 });
      await this.bonusRepo.save(config);
    }
    return config;
  }

  async getBonus() {
    return this.getOrCreate();
  }

  async updateBonus(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('El porcentaje debe estar entre 0 y 100');
    }
    const config = await this.getOrCreate();
    config.discountPercentage = percentage;
    return this.bonusRepo.save(config);
  }
}
