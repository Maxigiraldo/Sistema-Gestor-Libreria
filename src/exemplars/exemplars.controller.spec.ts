import { Test, TestingModule } from '@nestjs/testing';
import { ExemplarsController } from './exemplars.controller';

describe('ExemplarsController', () => {
  let controller: ExemplarsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExemplarsController],
    }).compile();

    controller = module.get<ExemplarsController>(ExemplarsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
