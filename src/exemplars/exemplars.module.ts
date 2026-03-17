import { Module } from '@nestjs/common';
import { ExemplarsController } from './exemplars.controller';

@Module({
  controllers: [ExemplarsController]
})
export class ExemplarsModule {}
