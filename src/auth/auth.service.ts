import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { ClientProfile } from '../users/client-profile.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException('El usuario o correo ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Crear usuario
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });

    const savedUser = await this.userRepository.save(user);

    // Crear perfil de cliente
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

    // Generar token
    const token = this.jwtService.sign({
      sub: savedUser.id,
      username: savedUser.username,
      role: savedUser.role,
    });

    return {
      message: 'Usuario registrado exitosamente',
      access_token: token,
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // Generar token
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      message: 'Inicio de sesión exitoso',
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}