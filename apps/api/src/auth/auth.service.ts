import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './jwt.strategy';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: string;
  theme: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: [
        { username: dto.username.toLowerCase() },
        { email: dto.email.toLowerCase() },
      ],
    });
    if (existing) {
      const field =
        existing.email === dto.email.toLowerCase() ? 'email' : 'username';
      throw new ConflictException(
        field === 'email'
          ? 'Ese email ya está en uso'
          : 'Ese nombre de usuario ya está en uso',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      username: dto.username.toLowerCase(),
      email: dto.email.toLowerCase(),
      passwordHash: hashedPassword,
    } as any);
    const saved = (await this.userRepository.save(user)) as unknown as User;
    const token = this.generateToken(saved);
    return { token, user: this.toSafeUser(saved) };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.toLowerCase();
    const user = await this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const token = this.generateToken(user);
    return { token, user: this.toSafeUser(user) };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toSafeUser(user);
  }

  async updateProfile(
    userId: string,
    dto: { username?: string; email?: string; theme?: string },
  ): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (dto.username !== undefined) {
      const clash = await this.userRepository.findOne({
        where: { username: dto.username.toLowerCase() },
      });
      if (clash && clash.id !== userId) {
        throw new ConflictException('Ese nombre de usuario ya está en uso');
      }
      user.username = dto.username.toLowerCase();
    }
    if (dto.email !== undefined) {
      const clash = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (clash && clash.id !== userId) {
        throw new ConflictException('Ese email ya está en uso');
      }
      user.email = dto.email.toLowerCase();
    }
    if (dto.theme !== undefined) {
      user.theme = dto.theme as User['theme'];
    }
    const saved = (await this.userRepository.save(user)) as unknown as User;
    return this.toSafeUser(saved);
  }

  async setRole(userId: string, role: string): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    user.role = role as User['role'];
    const saved = (await this.userRepository.save(user)) as unknown as User;
    return this.toSafeUser(saved);
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      theme: user.theme,
    };
  }

  private generateToken(user: User): string {
    const payload = { username: user.username, role: user.role, sub: user.id };
    return this.jwtService.sign(payload);
  }
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    theme: user.theme,
  };
}

export type { AuthenticatedUser };
