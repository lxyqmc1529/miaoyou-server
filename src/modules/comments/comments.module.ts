import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '../../entities/Comment';
import { Article } from '../../entities/Article';
import { Moment } from '../../entities/Moment';
import { Work } from '../../entities/Work';
import { User } from '../../entities/User';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PublicCommentsController } from './public-comments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article, Moment, Work, User])],
  controllers: [CommentsController, PublicCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}