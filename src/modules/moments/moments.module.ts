import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomentsService } from './moments.service';
import { MomentsController } from './moments.controller';
import { PublicMomentsController } from './public-moments.controller';
import { Moment } from '../../entities/Moment';
import { User } from '../../entities/User';
import { Analytics } from '../../entities/Analytics';

@Module({
  imports: [TypeOrmModule.forFeature([Moment, User, Analytics])],
  controllers: [MomentsController, PublicMomentsController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}