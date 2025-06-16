import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Article } from '../../entities/Article';
import { Category } from '../../entities/Category';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PublicArticlesController } from './public-articles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category, User, Analytics])],
  controllers: [ArticlesController, PublicArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}