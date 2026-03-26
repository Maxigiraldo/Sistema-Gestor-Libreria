import {
  Injectable, ConflictException, NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ClientProfile } from './client-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClientProfile)
    private profileRepository: Repository<ClientProfile>,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) throw new ConflictException('Usuario o correo ya registrado');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashed,
      role: UserRole.ADMIN,
    });
    const saved = await this.userRepository.save(user);
    const { password, ...result } = saved;
    return { message: 'Administrador creado', user: result };
  }

  async listAdmins() {
    return this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['id', 'username', 'email', 'active', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async deactivateAdmin(id: number) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.ADMIN },
    });
    if (!user) throw new NotFoundException('Administrador no encontrado');
    user.active = false;
    await this.userRepository.save(user);
    return { message: 'Administrador desactivado' };
  }

  async getClientProfile(userId: number) {
  return this.profileRepository.findOne({
    where: { user: { id: userId } },
  });
}
}