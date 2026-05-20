import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './users/user.entity';
import { ClientProfile } from './users/client-profile.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const profileRepo = app.get<Repository<ClientProfile>>(getRepositoryToken(ClientProfile));

  const exists = await userRepo.findOne({ where: { username: 'user' } });
  if (exists) {
    console.log('El usuario "user" ya existe');
    await app.close();
    return;
  }

  const hashed = await bcrypt.hash('user123', 12);
  const user = userRepo.create({
    username: 'user',
    email: 'user@libreria.com',
    password: hashed,
    role: UserRole.CLIENT,
  });
  const savedUser = await userRepo.save(user);

  const profile = profileRepo.create({
    user: savedUser,
    dni: '00000000',
    firstName: 'Usuario',
    lastName: 'Demo',
    birthDate: new Date('2000-01-01'),
    birthPlace: 'Colombia',
    shippingAddress: 'Calle 1 #1-1',
    gender: 'Prefiero no decir',
  });
  await profileRepo.save(profile);

  console.log('✅ Usuario cliente creado. Username: user | Password: user123');
  await app.close();
}

seed();
