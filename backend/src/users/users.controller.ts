import {
  Controller, Get, Post, Put, Patch,
  Body, Param, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Admin management (ROOT only) ──────────────────────────────────────────

  @Post('admins')
  @Roles(UserRole.ROOT)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get('admins')
  @Roles(UserRole.ROOT)
  listAdmins() {
    return this.usersService.listAdmins();
  }

  @Patch('admins/:id/deactivate')
  @Roles(UserRole.ROOT)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivateAdmin(id);
  }

  // ── Profile (CLIENT, ADMIN, ROOT) ─────────────────────────────────────────

  @Get('me/profile')
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.ROOT)
  getMyProfile(@Req() req: any) {
    return this.usersService.getClientProfile(req.user.sub);
  }

  @Put('me/profile')
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.ROOT)
  updateMyProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateClientProfile(req.user.sub, dto);
  }

  // ── Categories (CLIENT only) ──────────────────────────────────────────────

  @Get('me/categories')
  @Roles(UserRole.CLIENT)
  getMyCategories(@Req() req: any) {
    return this.usersService.getFavoriteGenres(req.user.sub);
  }

  @Put('me/categories')
  @Roles(UserRole.CLIENT)
  updateMyCategories(@Req() req: any, @Body('genres') genres: string[]) {
    return this.usersService.updateFavoriteGenres(req.user.sub, genres);
  }
}
