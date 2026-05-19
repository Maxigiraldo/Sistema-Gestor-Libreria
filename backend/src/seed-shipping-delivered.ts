import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus, ShippingType } from './shipping/shipping.entity';

const ORDER_ID = 9;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const shippingRepo = app.get<Repository<Shipping>>(getRepositoryToken(Shipping));

  let shipping = await shippingRepo.findOne({ where: { order: { id: ORDER_ID } } });

  if (!shipping) {
    shipping = shippingRepo.create({
      order: { id: ORDER_ID } as any,
      type: ShippingType.HOME,
      destinationAddress: 'Calle de prueba 123',
      status: ShippingStatus.DELIVERED,
      estimatedDelivery: new Date(),
      deliveredAt: new Date(),
    });
    await shippingRepo.save(shipping);
    console.log(`✅ Envío creado y marcado como entregado para pedido #${ORDER_ID}`);
  } else {
    shipping.status = ShippingStatus.DELIVERED;
    shipping.deliveredAt = new Date();
    await shippingRepo.save(shipping);
    console.log(`✅ Envío existente del pedido #${ORDER_ID} actualizado a entregado`);
  }

  await app.close();
}

seed();
