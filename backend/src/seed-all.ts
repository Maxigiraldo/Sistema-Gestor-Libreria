import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './users/user.entity';
import { ClientProfile } from './users/client-profile.entity';
import { Book, BookCondition } from './books/book.entity';
import { Exemplar } from './exemplars/exemplar.entity';
import { Order, OrderStatus, DeliveryType } from './orders/order.entity';
import { OrderDetail } from './orders/order-detail.entity';
import { Shipping, ShippingStatus, ShippingType } from './shipping/shipping.entity';
import { Payment, PaymentMethod, PaymentStatus } from './payments/payment.entity';
import { Balance } from './payments/balance.entity';
import { Reservation, ReservationStatus } from './reservations/reservation.entity';
import { ReservationItem } from './reservations/reservation-item.entity';
import { Return, ReturnStatus, ReturnCause, RefundMethod } from './returns/return.entity';
import { BonusConfig } from './config/bonus-config.entity';
import { Branch } from './branches/branch.entity';

function randomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function buildExemplarCode(bookId: number, suffix: string): string {
  return `LIB-${bookId}-${suffix}`;
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const profileRepo = app.get<Repository<ClientProfile>>(getRepositoryToken(ClientProfile));
  const bookRepo = app.get<Repository<Book>>(getRepositoryToken(Book));
  const exemplarRepo = app.get<Repository<Exemplar>>(getRepositoryToken(Exemplar));
  const orderRepo = app.get<Repository<Order>>(getRepositoryToken(Order));
  const orderDetailRepo = app.get<Repository<OrderDetail>>(getRepositoryToken(OrderDetail));
  const shippingRepo = app.get<Repository<Shipping>>(getRepositoryToken(Shipping));
  const paymentRepo = app.get<Repository<Payment>>(getRepositoryToken(Payment));
  const balanceRepo = app.get<Repository<Balance>>(getRepositoryToken(Balance));
  const reservationRepo = app.get<Repository<Reservation>>(getRepositoryToken(Reservation));
  const reservationItemRepo = app.get<Repository<ReservationItem>>(getRepositoryToken(ReservationItem));
  const returnRepo = app.get<Repository<Return>>(getRepositoryToken(Return));
  const bonusConfigRepo = app.get<Repository<BonusConfig>>(getRepositoryToken(BonusConfig));
  const branchRepo = app.get<Repository<Branch>>(getRepositoryToken(Branch));

  // ──────────────────────────────────────────────
  // 1. BONUS CONFIG
  // ──────────────────────────────────────────────
  const bonusExists = await bonusConfigRepo.findOne({ where: { id: 1 } });
  if (!bonusExists) {
    await bonusConfigRepo.save(bonusConfigRepo.create({ id: 1, discountPercentage: 10 }));
    console.log('✅ BonusConfig creado (10% descuento)');
  } else {
    console.log('   BonusConfig ya existe, omitiendo');
  }

  // ──────────────────────────────────────────────
  // 2. BRANCHES
  // ──────────────────────────────────────────────
  const branchSeeds = [
    {
      name: 'Sede Principal — Centro',
      address: 'Carrera 8 #19-25, Centro',
      city: 'Pereira',
      latitude: 4.8133,
      longitude: -75.6961,
      phone: '606-234-5678',
      openingHours: 'Lun–Vie 8:00–20:00 · Sáb 9:00–18:00',
    },
    {
      name: 'Sede Norte — Álamos',
      address: 'Calle 105 #19-40, Álamos',
      city: 'Pereira',
      latitude: 4.8412,
      longitude: -75.7023,
      phone: '606-345-6789',
      openingHours: 'Lun–Sáb 9:00–21:00 · Dom 10:00–18:00',
    },
    {
      name: 'Sede Sur — Cuba',
      address: 'Carrera 23 #69B-10, Cuba',
      city: 'Pereira',
      latitude: 4.7891,
      longitude: -75.7198,
      phone: '606-456-7890',
      openingHours: 'Lun–Sáb 9:00–20:00',
    },
    {
      name: 'Sede Circunvalar',
      address: 'Av. Circunvalar #8-61, El Poblado',
      city: 'Pereira',
      latitude: 4.8089,
      longitude: -75.6812,
      phone: '606-567-8901',
      openingHours: 'Lun–Vie 9:00–20:00 · Sáb–Dom 10:00–18:00',
    },
  ];

  const existingBranches = await branchRepo.count();
  if (existingBranches === 0) {
    for (const b of branchSeeds) {
      await branchRepo.save(branchRepo.create(b));
    }
    console.log(`✅ ${branchSeeds.length} sedes creadas`);
  } else {
    console.log(`   Sedes ya existen (${existingBranches}), omitiendo`);
  }

  // ──────────────────────────────────────────────
  // 3. USERS
  // ──────────────────────────────────────────────
  const userSeeds = [
    {
      username: 'admin',
      email: 'admin@libreria.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      profile: null,
    },
    {
      username: 'ana_garcia',
      email: 'ana.garcia@correo.co',
      password: 'ana123',
      role: UserRole.CLIENT,
      profile: {
        dni: '1012345678',
        firstName: 'Ana',
        lastName: 'García',
        birthDate: new Date('1995-03-15'),
        birthPlace: 'Bogotá',
        shippingAddress: 'Calle 85 #15-20, Chapinero, Bogotá',
        gender: 'Femenino',
        favoriteGenres: ['Ficción', 'Realismo Mágico', 'Romance'],
      },
    },
    {
      username: 'carlos_lopez',
      email: 'carlos.lopez@correo.co',
      password: 'carlos123',
      role: UserRole.CLIENT,
      profile: {
        dni: '1098765432',
        firstName: 'Carlos',
        lastName: 'López',
        birthDate: new Date('1990-07-22'),
        birthPlace: 'Medellín',
        shippingAddress: 'Cra 50 #25-30, Laureles, Medellín',
        gender: 'Masculino',
        favoriteGenres: ['Historia', 'Novela colombiana', 'Ciencia ficción'],
      },
    },
    {
      username: 'maria_rodriguez',
      email: 'maria.rodriguez@correo.co',
      password: 'maria123',
      role: UserRole.CLIENT,
      profile: {
        dni: '1023456789',
        firstName: 'María',
        lastName: 'Rodríguez',
        birthDate: new Date('1998-11-05'),
        birthPlace: 'Cali',
        shippingAddress: 'Av. 9N #14-56, Granada, Cali',
        gender: 'Femenino',
        favoriteGenres: ['Ficción contemporánea', 'Romance', 'Thriller'],
      },
    },
  ];

  const savedUsers: Record<string, User> = {};
  for (const seed of userSeeds) {
    const existing = await userRepo.findOne({ where: { username: seed.username } });
    if (existing) {
      console.log(`   Usuario "${seed.username}" ya existe, omitiendo`);
      savedUsers[seed.username] = existing;
      continue;
    }
    const hashed = await bcrypt.hash(seed.password, 12);
    const user = userRepo.create({ username: seed.username, email: seed.email, password: hashed, role: seed.role });
    const savedUser = await userRepo.save(user);
    savedUsers[seed.username] = savedUser;

    if (seed.profile) {
      const profile = profileRepo.create({ user: savedUser, ...seed.profile });
      await profileRepo.save(profile);
    }
    console.log(`✅ Usuario creado: ${seed.username} (${seed.role}) | Password: ${seed.password}`);
  }

  // ──────────────────────────────────────────────
  // 4. BOOKS
  // ──────────────────────────────────────────────
  const bookSeeds = [
    {
      title: 'Cien años de soledad',
      author: 'Gabriel García Márquez',
      publicationYear: 1967,
      genre: 'Realismo Mágico',
      pages: 432,
      publisher: 'Penguin Random House',
      language: 'es',
      condition: BookCondition.NEW,
      price: 32000,
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg',
    },
    {
      title: 'El amor en los tiempos del cólera',
      author: 'Gabriel García Márquez',
      publicationYear: 1985,
      genre: 'Romance',
      pages: 348,
      publisher: 'Oveja Negra',
      language: 'es',
      condition: BookCondition.NEW,
      price: 28000,
      coverImage: 'https://covers.openlibrary.org/b/isbn/9781400044580-L.jpg',
    },
    {
      title: 'La Vorágine',
      author: 'José Eustasio Rivera',
      publicationYear: 1924,
      genre: 'Novela colombiana',
      pages: 312,
      publisher: 'El Áncora Editores',
      language: 'es',
      condition: BookCondition.USED,
      price: 22000,
      coverImage: undefined,
    },
    {
      title: 'María',
      author: 'Jorge Isaacs',
      publicationYear: 1867,
      genre: 'Romanticismo',
      pages: 280,
      publisher: 'Panamericana Editorial',
      language: 'es',
      condition: BookCondition.NEW,
      price: 18000,
      coverImage: undefined,
    },
    {
      title: 'Delirio',
      author: 'Laura Restrepo',
      publicationYear: 2004,
      genre: 'Ficción contemporánea',
      pages: 320,
      publisher: 'Alfaguara',
      language: 'es',
      condition: BookCondition.NEW,
      price: 26000,
      coverImage: undefined,
    },
    {
      title: 'Los ejércitos',
      author: 'Evelio Rosero',
      publicationYear: 2007,
      genre: 'Ficción colombiana',
      pages: 192,
      publisher: 'Tusquets Editores',
      language: 'es',
      condition: BookCondition.NEW,
      price: 21000,
      coverImage: undefined,
    },
    {
      title: 'Sin remedio',
      author: 'Antonio Caballero',
      publicationYear: 1984,
      genre: 'Novela colombiana',
      pages: 480,
      publisher: 'Aguilar',
      language: 'es',
      condition: BookCondition.USED,
      price: 35000,
      coverImage: undefined,
    },
    {
      title: 'El coronel no tiene quien le escriba',
      author: 'Gabriel García Márquez',
      publicationYear: 1961,
      genre: 'Ficción',
      pages: 128,
      publisher: 'Sudamericana',
      language: 'es',
      condition: BookCondition.NEW,
      price: 15000,
      coverImage: 'https://covers.openlibrary.org/b/isbn/9780060882808-L.jpg',
    },
    {
      title: 'La hojarasca',
      author: 'Gabriel García Márquez',
      publicationYear: 1955,
      genre: 'Ficción',
      pages: 200,
      publisher: 'Sudamericana',
      language: 'es',
      condition: BookCondition.NEW,
      price: 17000,
      coverImage: undefined,
    },
    {
      title: 'Crónica de una muerte anunciada',
      author: 'Gabriel García Márquez',
      publicationYear: 1981,
      genre: 'Ficción',
      pages: 120,
      publisher: 'Oveja Negra',
      language: 'es',
      condition: BookCondition.NEW,
      price: 19000,
      coverImage: 'https://covers.openlibrary.org/b/isbn/9781400034932-L.jpg',
    },
    {
      title: 'Bogotá Noir',
      author: 'Varios autores',
      publicationYear: 2012,
      genre: 'Thriller',
      pages: 288,
      publisher: 'Aguilar',
      language: 'es',
      condition: BookCondition.NEW,
      price: 24000,
      coverImage: undefined,
    },
    {
      title: 'El olvido que seremos',
      author: 'Héctor Abad Faciolince',
      publicationYear: 2006,
      genre: 'Autobiografía',
      pages: 252,
      publisher: 'Planeta',
      language: 'es',
      condition: BookCondition.NEW,
      price: 29000,
      coverImage: undefined,
    },
  ];

  const savedBooks: Book[] = [];
  const existingBookCount = await bookRepo.count();
  if (existingBookCount === 0) {
    for (const b of bookSeeds) {
      const book = bookRepo.create(b as Parameters<typeof bookRepo.create>[0]);
      savedBooks.push(await bookRepo.save(book) as Book);
    }
    console.log(`✅ ${savedBooks.length} libros creados`);
  } else {
    const all = await bookRepo.find();
    savedBooks.push(...all);
    console.log(`   Libros ya existen (${savedBooks.length}), omitiendo`);
  }

  // ──────────────────────────────────────────────
  // 5. EXEMPLARS (3 per book)
  // ──────────────────────────────────────────────
  const storeLocations = [
    'Bodega A, Estante 1',
    'Bodega A, Estante 2',
    'Bodega B, Estante 3',
    'Bodega B, Estante 4',
    'Bodega C, Estante 1',
  ];

  const savedExemplars: Exemplar[] = [];
  const existingExemplarCount = await exemplarRepo.count();
  if (existingExemplarCount === 0) {
    for (const book of savedBooks) {
      for (let i = 0; i < 3; i++) {
        const code = buildExemplarCode(book.id, randomHex(8));
        const exemplar = exemplarRepo.create({
          uniqueCode: code,
          book,
          storeLocation: storeLocations[(book.id + i) % storeLocations.length],
          available: true,
          outOfStock: false,
        });
        savedExemplars.push(await exemplarRepo.save(exemplar));
      }
    }
    console.log(`✅ ${savedExemplars.length} ejemplares creados`);
  } else {
    const all = await exemplarRepo.find({ relations: ['book'] });
    savedExemplars.push(...all);
    console.log(`   Ejemplares ya existen (${savedExemplars.length}), omitiendo`);
  }

  // ──────────────────────────────────────────────
  // 6. BALANCES
  // ──────────────────────────────────────────────
  const balanceData = [
    { username: 'ana_garcia', available: 50000 },
    { username: 'carlos_lopez', available: 30000 },
    { username: 'maria_rodriguez', available: 100000 },
  ];

  for (const { username, available } of balanceData) {
    const user = savedUsers[username];
    if (!user) continue;
    const existing = await balanceRepo.findOne({ where: { client: { id: user.id } } });
    if (!existing) {
      await balanceRepo.save(balanceRepo.create({ client: user, available }));
      console.log(`✅ Saldo creado para ${username}: $${available.toLocaleString('es-CO')} COP`);
    } else {
      console.log(`   Saldo de ${username} ya existe, omitiendo`);
    }
  }

  // ──────────────────────────────────────────────
  // 7. ORDERS, ORDER DETAILS, SHIPPING, PAYMENTS
  // ──────────────────────────────────────────────
  const byBook = (bookIndex: number): Exemplar[] =>
    savedExemplars.filter((e) => e.book.id === savedBooks[bookIndex].id);

  const existingOrderCount = await orderRepo.count();
  if (existingOrderCount > 0) {
    console.log(`   Órdenes ya existen (${existingOrderCount}), omitiendo órdenes/envíos/pagos`);
  } else {

    // ── Order 1: Ana — "Cien años de soledad" — DELIVERED ──
    const exemplar1 = byBook(0)[0];
    const order1 = await orderRepo.save(
      orderRepo.create({
        client: savedUsers['ana_garcia'],
        total: 32000,
        discount: 3200,
        status: OrderStatus.CONFIRMED,
        deliveryType: DeliveryType.HOME,
        shippingAddress: 'Calle 85 #15-20, Chapinero, Bogotá',
      }),
    );
    await orderDetailRepo.save(
      orderDetailRepo.create({ order: order1, exemplar: exemplar1, quantity: 1, unitPrice: 32000, subtotal: 32000 }),
    );
    exemplar1.available = false;
    await exemplarRepo.save(exemplar1);

    const deliveredAt = new Date();
    deliveredAt.setDate(deliveredAt.getDate() - 5);
    await shippingRepo.save(
      shippingRepo.create({
        order: order1,
        destinationAddress: 'Calle 85 #15-20, Chapinero, Bogotá',
        type: ShippingType.HOME,
        status: ShippingStatus.DELIVERED,
        estimatedDelivery: deliveredAt,
        deliveredAt,
      }),
    );
    await paymentRepo.save(
      paymentRepo.create({
        client: savedUsers['ana_garcia'],
        amount: 28800,
        method: PaymentMethod.CARD,
        status: PaymentStatus.APPROVED,
        gatewayReference: 'TXN-ANA-001',
      }),
    );
    console.log('✅ Orden 1 creada (Ana — Cien años de soledad — Entregada)');

    // ── Order 2: Ana — "Delirio" + "Los ejércitos" — SHIPPED ──
    const exemplar2 = byBook(4)[0];
    const exemplar3 = byBook(5)[0];
    const total2 = 26000 + 21000;
    const discount2 = total2 * 0.1;
    const order2 = await orderRepo.save(
      orderRepo.create({
        client: savedUsers['ana_garcia'],
        total: total2,
        discount: discount2,
        status: OrderStatus.CONFIRMED,
        deliveryType: DeliveryType.HOME,
        shippingAddress: 'Calle 85 #15-20, Chapinero, Bogotá',
      }),
    );
    await orderDetailRepo.save(
      orderDetailRepo.create({ order: order2, exemplar: exemplar2, quantity: 1, unitPrice: 26000, subtotal: 26000 }),
    );
    await orderDetailRepo.save(
      orderDetailRepo.create({ order: order2, exemplar: exemplar3, quantity: 1, unitPrice: 21000, subtotal: 21000 }),
    );
    exemplar2.available = false;
    exemplar3.available = false;
    await exemplarRepo.save([exemplar2, exemplar3]);

    const estimatedDelivery2 = new Date();
    estimatedDelivery2.setDate(estimatedDelivery2.getDate() + 2);
    await shippingRepo.save(
      shippingRepo.create({
        order: order2,
        destinationAddress: 'Calle 85 #15-20, Chapinero, Bogotá',
        type: ShippingType.HOME,
        status: ShippingStatus.SHIPPED,
        estimatedDelivery: estimatedDelivery2,
      }),
    );
    await paymentRepo.save(
      paymentRepo.create({
        client: savedUsers['ana_garcia'],
        amount: total2 - discount2,
        method: PaymentMethod.CARD,
        status: PaymentStatus.APPROVED,
        gatewayReference: 'TXN-ANA-002',
      }),
    );
    console.log('✅ Orden 2 creada (Ana — Delirio + Los ejércitos — En camino)');

    // ── Order 3: Carlos — "María" — PREPARING ──
    const exemplar4 = byBook(3)[0];
    const order3 = await orderRepo.save(
      orderRepo.create({
        client: savedUsers['carlos_lopez'],
        total: 18000,
        discount: 0,
        status: OrderStatus.CONFIRMED,
        deliveryType: DeliveryType.STORE,
        shippingAddress: undefined,
      }),
    );
    await orderDetailRepo.save(
      orderDetailRepo.create({ order: order3, exemplar: exemplar4, quantity: 1, unitPrice: 18000, subtotal: 18000 }),
    );
    exemplar4.available = false;
    await exemplarRepo.save(exemplar4);

    const estimatedDelivery3 = new Date();
    estimatedDelivery3.setDate(estimatedDelivery3.getDate() + 1);
    await shippingRepo.save(
      shippingRepo.create({
        order: order3,
        type: ShippingType.STORE,
        status: ShippingStatus.PREPARING,
        estimatedDelivery: estimatedDelivery3,
      }),
    );
    await paymentRepo.save(
      paymentRepo.create({
        client: savedUsers['carlos_lopez'],
        amount: 18000,
        method: PaymentMethod.BALANCE,
        status: PaymentStatus.PENDING,
        gatewayReference: undefined,
      }),
    );
    console.log('✅ Orden 3 creada (Carlos — María — En preparación)');

    // ── Order 4: María — "El olvido que seremos" — CANCELLED ──
    const exemplar5 = byBook(11)[0];
    const order4 = await orderRepo.save(
      orderRepo.create({
        client: savedUsers['maria_rodriguez'],
        total: 29000,
        discount: 0,
        status: OrderStatus.CANCELLED,
        deliveryType: DeliveryType.HOME,
        shippingAddress: 'Av. 9N #14-56, Granada, Cali',
      }),
    );
    await orderDetailRepo.save(
      orderDetailRepo.create({ order: order4, exemplar: exemplar5, quantity: 1, unitPrice: 29000, subtotal: 29000 }),
    );
    await paymentRepo.save(
      paymentRepo.create({
        client: savedUsers['maria_rodriguez'],
        amount: 29000,
        method: PaymentMethod.CARD,
        status: PaymentStatus.REJECTED,
        gatewayReference: 'TXN-MARIA-001',
      }),
    );
    console.log('✅ Orden 4 creada (María — El olvido que seremos — Cancelada)');

    // ── Return: Ana devuelve Order 1 ──
    const deadline = new Date(deliveredAt);
    deadline.setDate(deadline.getDate() + 8);
    await returnRepo.save(
      returnRepo.create({
        order: order1,
        client: savedUsers['ana_garcia'],
        cause: ReturnCause.NO_EXPECTATIONS,
        additionalDescription: 'El libro no cumplió con mis expectativas de contenido.',
        refundMethod: RefundMethod.BALANCE,
        qrCode: 'RETURN-QR-ANA-001',
        deadlineDate: deadline,
        status: ReturnStatus.PENDING,
      }),
    );
    console.log('✅ Devolución creada (Ana — Orden 1 — Pendiente)');
  }

  // ──────────────────────────────────────────────
  // 8. RESERVATION — María reserves "El coronel no tiene quien le escriba"
  // ──────────────────────────────────────────────
  const existingReservation = await reservationRepo.findOne({
    where: { client: { id: savedUsers['maria_rodriguez']?.id }, status: ReservationStatus.ACTIVE },
  });
  if (!existingReservation && savedUsers['maria_rodriguez']) {
    const reservedExemplar = byBook(7).find((e) => e.available)!;
    if (reservedExemplar) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 20);

      const reservation = await reservationRepo.save(
        reservationRepo.create({
          client: savedUsers['maria_rodriguez'],
          expiresAt,
          status: ReservationStatus.ACTIVE,
        }),
      );
      await reservationItemRepo.save(
        reservationItemRepo.create({ reservation, exemplar: reservedExemplar, quantity: 1 }),
      );
      reservedExemplar.available = false;
      await exemplarRepo.save(reservedExemplar);
      console.log('✅ Reserva activa creada (María — El coronel no tiene quien le escriba)');
    }
  } else {
    console.log('   Reserva activa de María ya existe, omitiendo');
  }

  // ──────────────────────────────────────────────
  console.log('\n🎉 Seed completo. Credenciales de acceso:');
  console.log('   root            / root123   (ROOT)');
  console.log('   admin           / admin123  (ADMIN)');
  console.log('   ana_garcia      / ana123    (CLIENT)');
  console.log('   carlos_lopez    / carlos123 (CLIENT)');
  console.log('   maria_rodriguez / maria123  (CLIENT)');

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
