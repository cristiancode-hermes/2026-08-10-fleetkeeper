import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  @Roles('admin')
  async list() {
    const users = await this.userRepository.find({
      order: { createdAt: 'ASC' },
    });
    return users.map((u) => this.authService.toSafeUser(u));
  }

  @Patch(':id/role')
  @Roles('admin')
  async setRole(
    @Param('id') id: string,
    @Body() dto: { role: string },
  ) {
    return this.authService.setRole(id, dto.role);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}
