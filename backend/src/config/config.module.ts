import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusConfig } from './bonus-config.entity';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BonusConfig])],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
