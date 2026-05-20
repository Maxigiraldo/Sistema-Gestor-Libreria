import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class OptionalJwtGuard extends (AuthGuard('jwt') as any) {
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @UseGuards(OptionalJwtGuard)
  @Get('book/:bookId')
  forBook(@Param('bookId', ParseIntPipe) bookId: number, @Req() req: any) {
    return this.service.forBook(bookId, req.user ? parseInt(req.user.sub, 10) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get('for-me')
  forMe(@Req() req: any) {
    return this.service.forMe(parseInt(req.user.sub, 10));
  }
}
