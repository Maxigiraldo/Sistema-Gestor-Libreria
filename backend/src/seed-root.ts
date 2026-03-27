import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './users/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const exists = await userRepo.findOne({ where: { username: 'root' } });
  if (exists) {
    console.log('El usuario root ya existe');
    await app.close();
    return;
  }

  const hashed = await bcrypt.hash('root1234', 12);
  const root = userRepo.create({
    username: 'root',
    email: 'root@libreria.com',
    password: hashed,
    role: UserRole.ROOT,
  });
  await userRepo.save(root);
  console.log('✅ Usuario root creado. Username: root | Password: root1234');
  await app.close();
}

seed();