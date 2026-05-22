import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { MessagingService } from './messaging.service';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsInt()
  clientId?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  @Post('messages')
  send(@Req() req: any, @Body() body: SendMessageDto) {
    const user = req.user;
    const userId = parseInt(user.sub, 10);
    const isAdmin = user.role === 'administrator';
    const clientId = isAdmin ? body.clientId! : userId;
    return this.service.send(userId, user.role, user.username, clientId, body.content);
  }

  @Get('my-messages')
  myConversation(@Req() req: any) {
    return this.service.getConversation(parseInt(req.user.sub, 10));
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('conversations')
  conversations() {
    return this.service.getConversations();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('messages/:clientId')
  conversation(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.service.getConversation(clientId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('messages/:clientId/read')
  markRead(@Param('clientId', ParseIntPipe) clientId: number) {
    return this.service.markRead(clientId);
  }
}
