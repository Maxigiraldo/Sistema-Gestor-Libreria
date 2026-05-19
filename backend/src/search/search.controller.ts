import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('title') title?: string,
    @Query('author') author?: string,
    @Query('genre') genre?: string,
    @Query('publisher') publisher?: string,
    @Query('issn') issn?: string,
    @Query('language') language?: string,
    @Query('condition') condition?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('publicationYear') publicationYear?: number,
  ) {
    return this.searchService.search({
      title,
      author,
      genre,
      publisher,
      issn,
      language,
      condition,
      minPrice,
      maxPrice,
      publicationYear,
    });
  }
}