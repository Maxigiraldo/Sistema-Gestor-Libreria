import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NewsService } from './news.service';

class SubscriptionDto {
  @IsBoolean()
  subscribe!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('books')
  getNewBooks(@Req() req: any) {
    return this.newsService.getNewBooks(parseInt(req.user.sub, 10));
  }

  @Get('subscription')
  async getSubscription(@Req() req: any) {
    const subscribed = await this.newsService.getSubscription(parseInt(req.user.sub, 10));
    return { subscribed };
  }

  @Put('subscription')
  async setSubscription(@Req() req: any, @Body() body: SubscriptionDto) {
    await this.newsService.setSubscription(parseInt(req.user.sub, 10), body.subscribe);
    return { subscribed: body.subscribe };
  }

  @Get('new-book-ids')
  getNewBookIds(@Req() req: any) {
    return this.newsService.getNewBookIds(parseInt(req.user.sub, 10));
  }
}
