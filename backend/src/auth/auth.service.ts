import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { ClientProfile } from '../users/client-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClientProfile)
    private clientProfileRepository: Repository<ClientProfile>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: registerDto.username }, { email: registerDto.email }],
    });
    if (existingUser) throw new ConflictException('El usuario o correo ya está registrado');

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });
    const savedUser = await this.userRepository.save(user);

    const profile = this.clientProfileRepository.create({
      user: savedUser,
      dni: registerDto.dni,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      birthDate: new Date(registerDto.birthDate),
      birthPlace: registerDto.birthPlace,
      shippingAddress: registerDto.shippingAddress,
      gender: registerDto.gender,
    });
    await this.clientProfileRepository.save(profile);

    const token = this.jwtService.sign({
      sub: savedUser.id,
      username: savedUser.username,
      role: savedUser.role,
    });

    return {
      message: 'Usuario registrado exitosamente',
      access_token: token,
      user: { id: savedUser.id, username: savedUser.username, email: savedUser.email, role: savedUser.role },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { username: loginDto.username } });
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    if (!user.active) {
      throw new UnauthorizedException('Cuenta inactiva. Revisa tu correo para configurar tu contraseña');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Credenciales incorrectas');

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Inicio de sesión exitoso',
      access_token: token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);
    return { message: 'Contraseña actualizada exitosamente' };
  }

  async setPasswordFromToken(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { passwordResetToken: token } });
    if (!user) throw new BadRequestException('Token inválido o expirado');
    if (!user.tokenExpiresAt || user.tokenExpiresAt < new Date()) {
      throw new BadRequestException('El enlace ha expirado. Solicita uno nuevo al administrador ROOT');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.tokenExpiresAt = null;
    user.active = true;
    await this.userRepository.save(user);

    return { message: 'Contraseña configurada correctamente. Ya puedes iniciar sesión.' };
  }
}
