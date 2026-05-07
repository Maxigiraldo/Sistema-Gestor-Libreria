import {
  Injectable, ConflictException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from './user.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ClientProfile } from './client-profile.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClientProfile)
    private profileRepository: Repository<ClientProfile>,
    private mailService: MailService,
  ) {}

  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) throw new ConflictException('Usuario o correo ya registrado');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: await bcrypt.hash(uuidv4(), 12), // contraseña temporal inutilizable
      role: UserRole.ADMIN,
      active: false, // se activa cuando el admin configura su contraseña
      passwordResetToken: token,
      tokenExpiresAt: expiresAt,
    });
    const saved = await this.userRepository.save(user);

    await this.mailService.sendAdminWelcome(dto.email, dto.username, token);

    const { password, passwordResetToken, tokenExpiresAt, ...result } = saved;
    return { message: 'Administrador creado. Se envió correo para configurar contraseña.', user: result };
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { password, passwordResetToken, tokenExpiresAt, ...userSafe } = user;

    if (user.role !== UserRole.CLIENT) {
      return { ...userSafe, profile: null };
    }

    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    return { ...userSafe, profile };
  }

  async updateClientProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.username && dto.username !== user.username) {
      const taken = await this.userRepository.findOne({ where: { username: dto.username } });
      if (taken) throw new ConflictException('El nombre de usuario ya está en uso');
      user.username = dto.username;
    }
    await this.userRepository.save(user);

    if (user.role !== UserRole.CLIENT) {
      const { password, passwordResetToken, tokenExpiresAt, ...userSafe } = user;
      return { message: 'Perfil actualizado', ...userSafe, profile: null };
    }

    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (dto.firstName       !== undefined) profile.firstName       = dto.firstName;
    if (dto.lastName        !== undefined) profile.lastName        = dto.lastName;
    if (dto.gender          !== undefined) profile.gender          = dto.gender;
    if (dto.shippingAddress !== undefined) profile.shippingAddress = dto.shippingAddress;

    await this.profileRepository.save(profile);

    const { password, passwordResetToken, tokenExpiresAt, ...userSafe } = user;
    return { message: 'Perfil actualizado', ...userSafe, profile };
  }

  async getFavoriteGenres(userId: number) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return { favoriteGenres: profile.favoriteGenres ?? [] };
  }

  async updateFavoriteGenres(userId: number, genres: string[]) {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    profile.favoriteGenres = genres;
    await this.profileRepository.save(profile);
    return { message: 'Categorías actualizadas', favoriteGenres: profile.favoriteGenres };
  }
}
